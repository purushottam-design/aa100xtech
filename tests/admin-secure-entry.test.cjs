const assert = require("node:assert/strict");
const { test } = require("node:test");
const { PassThrough } = require("node:stream");
const { readSecret, secureProvision } = require("../scripts/provision-admin-secure.cjs");
test("masked input handles editing without echoing secrets and restores terminal mode", async () => {
  const input = new PassThrough();
  input.isTTY = true;
  input.isRaw = false;
  input.setRawMode = (value) => {
    input.isRaw = value;
  };
  let display = "";
  const pending = readSecret("Hidden: ", input, {
    write(text) {
      display += text;
    },
  });
  input.emit("keypress", "fixture-secretX", {});
  input.emit("keypress", undefined, { name: "backspace" });
  input.emit("keypress", undefined, { name: "return" });
  assert.equal(await pending, "fixture-secret");
  assert.equal(input.isRaw, false);
  assert.equal(display, "Hidden: \n");
});
test("secure entry forwards project/reset flags, previews before apply and never puts secrets in argv or parent env", async () => {
  const calls = [];
  let display = "";
  const env = { NODE_ENV: "development", SUPER_ADMIN_PASSWORD: "prior-fixture" };
  const status = await secureProvision({
    args: ["-ExpectedProject", "fixtureproject", "-Apply", "-ResetPassword"],
    env,
    prompt: async () => "fixture-vault-value-96#Q!",
    output: {
      write(text) {
        display += text;
      },
    },
    run(_exe, argv, options) {
      calls.push({ argv, env: options.env });
      return { status: 0 };
    },
  });
  assert.equal(status, 0);
  assert.equal(calls.length, 4);
  assert.deepEqual(
    calls.map((c) => c.argv.includes("--apply")),
    [false, false, true, false],
  );
  assert.equal(
    calls.every((c) => c.argv.includes("--expected-project") && c.argv.includes("fixtureproject")),
    true,
  );
  assert.equal(calls[2].argv.includes("--reset-password"), true);
  assert.equal(calls[1].env.SUPER_ADMIN_PASSWORD, "fixture-vault-value-96#Q!");
  assert.equal(env.SUPER_ADMIN_PASSWORD, "prior-fixture");
  assert.doesNotMatch(display + JSON.stringify(calls.map((c) => c.argv)), /fixture-vault-value/);
});
test("a failed password preview cannot reach apply", async () => {
  let calls = 0;
  await assert.rejects(
    secureProvision({
      args: ["--expected-project", "fixtureproject", "--apply", "--reset-password"],
      env: {},
      prompt: async () => "too-short",
      output: { write() {} },
      run() {
        calls++;
        return { status: calls === 1 ? 0 : 1 };
      },
    }),
    /no account changes/,
  );
  assert.equal(calls, 2);
});
