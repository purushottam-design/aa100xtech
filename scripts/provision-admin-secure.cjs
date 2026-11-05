const { emitKeypressEvents } = require("node:readline");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

function readSecret(label, input = process.stdin, output = process.stdout) {
  if (!input.isTTY || typeof input.setRawMode !== "function")
    throw new Error(
      "Run the masked command in your IDE's interactive terminal. Do not pipe a password or put it in command arguments.",
    );
  output.write(label);
  emitKeypressEvents(input);
  const previousRaw = !!input.isRaw;
  input.setRawMode(true);
  input.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    function finish(error) {
      input.removeListener("keypress", keypress);
      input.setRawMode(previousRaw);
      input.pause();
      output.write("\n");
      if (error) {
        value = "";
        reject(error);
      } else resolve(value);
    }
    function keypress(text, key = {}) {
      if (key.ctrl && key.name === "c")
        return finish(new Error("Cancelled; no account changes were made."));
      if (key.name === "return" || key.name === "enter") return finish();
      if (key.name === "backspace") {
        value = Array.from(value).slice(0, -1).join("");
        return;
      }
      if (text && !key.ctrl && !key.meta && !/[\x00-\x1f\x7f]/.test(text)) {
        value += text;
        if (value.length > 128)
          finish(new Error("Use at most 128 characters; no account changes were made."));
      }
      // No characters or length markers are echoed.
    }
    input.on("keypress", keypress);
  });
}

async function secureProvision({
  args = process.argv.slice(2),
  env = process.env,
  prompt = readSecret,
  run = spawnSync,
  output = process.stdout,
} = {}) {
  const aliases = {
    "-ExpectedProject": "--expected-project",
    "-Apply": "--apply",
    "-ResetPassword": "--reset-password",
  };
  const flags = args.map((arg) => aliases[arg] ?? arg);
  const projectIndex = flags.indexOf("--expected-project");
  const project = projectIndex < 0 ? "" : flags[projectIndex + 1];
  if (!project || !/^[a-z0-9]{8,40}$/.test(project))
    throw new Error("Provide --expected-project with the confirmed development project reference.");
  const apply = flags.includes("--apply"),
    reset = flags.includes("--reset-password");
  if (reset && !apply) throw new Error("--reset-password also requires --apply.");
  if (env.NODE_ENV === "production") throw new Error("This command refuses NODE_ENV=production.");
  const known = new Set(["--expected-project", project, "--apply", "--reset-password"]);
  if (flags.some((flag) => !known.has(flag)))
    throw new Error(
      "Unknown option; use --expected-project, --apply and optionally --reset-password.",
    );
  const base = [path.join(__dirname, "next.cjs"), "provision-admin", "--expected-project", project];
  function execute(extra, password) {
    const child = run(process.execPath, [...base, ...extra], {
      cwd: path.resolve(__dirname, ".."),
      env: password === undefined ? { ...env } : { ...env, SUPER_ADMIN_PASSWORD: password },
      stdio: "inherit",
      windowsHide: true,
    });
    if (child.error) throw new Error("Could not start the provisioning command.");
    return child.status ?? 1;
  }
  output.write(
    "Preflight uses current file configuration; readiness is checked again after masked entry.\n",
  );
  if (execute([]) !== 0) throw new Error("Project preflight failed; no account changes were made.");
  let password, confirmation;
  try {
    password = await prompt("Enter a unique Super Admin password (16-128 characters; hidden): ");
    confirmation = await prompt("Confirm password (hidden): ");
    if (password !== confirmation)
      throw new Error("Passwords do not match; no account changes were made.");
    output.write("Checking the entered password; this preview must show passwordReady: true.\n");
    if (execute(["--require-password-ready"], password) !== 0)
      throw new Error("Password preview failed; no account changes were made.");
    if (apply) {
      const status = execute(["--apply", ...(reset ? ["--reset-password"] : [])], password);
      if (status !== 0) return status;
      output.write(
        "Provisioning completed. Checking readiness and assigned role again without changes.\n",
      );
      return execute(["--require-password-ready"], password);
    }
    return 0;
  } finally {
    password = undefined;
    confirmation = undefined;
    // Only child environments contained the supplied secret; files and the
    // parent's inherited environment are untouched.
  }
}
module.exports = { readSecret, secureProvision };
if (require.main === module)
  secureProvision()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
