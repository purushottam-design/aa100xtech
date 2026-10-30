// Start Node with the operating system's trusted CAs where supported. This
// retains certificate verification on networks that use an installed company CA.
const { spawn } = require("node:child_process");

const flags = process.allowedNodeEnvironmentFlags.has("--use-system-ca") ? ["--use-system-ca"] : [];
const args = process.argv.slice(2);
const commands = {
  "diagnose-influencers": require.resolve("./diagnose-influencers.cjs"),
  "repair-influencers": require.resolve("./repair-influencers.cjs"),
};
const command = Object.hasOwn(commands, args[0]) ? commands[args.shift()] : undefined;
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
