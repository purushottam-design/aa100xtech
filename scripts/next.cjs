// Start Node with the operating system's trusted CAs where supported. This
// retains certificate verification on networks that use an installed company CA.
const { spawn } = require("node:child_process");

const flags = process.allowedNodeEnvironmentFlags.has("--use-system-ca") ? ["--use-system-ca"] : [];
const args = process.argv.slice(2);
const commands = {
  "partners-preflight": require.resolve("./partner-workspace/preflight.cjs"),
  "provision-admin": require.resolve("./provision-admin.cjs"),
  "diagnose-marketing": require.resolve("./diagnose-marketing-intake.cjs"),
  "repair-marketing": require.resolve("./apply-marketing-intake.cjs"),
  "diagnose-website": require.resolve("./diagnose-website.cjs"),
  "diagnose-influencers": require.resolve("./diagnose-influencers.cjs"),
  "repair-influencers": require.resolve("./repair-influencers.cjs"),
};
const command = Object.hasOwn(commands, args[0]) ? commands[args.shift()] : undefined;
// Enforce the explicitly selected master before starting/building the Partners
// integration. An absent value leaves the existing AA launch contract intact.
if (!command && ["dev", "build", "start"].includes(args[0])) {
  require("@next/env").loadEnvConfig(process.cwd(), args[0] === "dev", { info() {}, error() {} });
  const expectedMasterRef = process.env.CM365_EXPECTED_MASTER_REF;
  if (expectedMasterRef) {
    const result = require("./partner-workspace/environment.cjs").validateSupabaseIdentity(
      process.env,
      { expectedMasterRef },
    );
    if (result.targetStatus !== "TARGET_CONFIRMED") {
      console.error(
        "Partners master configuration rejected:",
        result.codes.filter((code) => code !== "SOURCE_REF_REQUIRED").join(", "),
      );
      process.exit(1);
    }
  }
}
const script = command ?? require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [...flags, script, ...args], { stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
}
child.on("error", () => {
  console.error("Could not start the application process.");
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 1);
});
