const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { test } = require("node:test");
test("Next development env precedence matches the app and a prompted process value wins", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aa-admin-env-"));
  const files = [".env", ".env.local", ".env.development.local"];
  try {
    for (const [index, file] of files.entries())
      fs.writeFileSync(path.join(dir, file), `SUPER_ADMIN_PASSWORD=fixture-source-${index}\n`);
    const script = `const {loadEnvConfig}=require('@next/env');const r=loadEnvConfig(process.argv[1],true,{info(){},error(){}});console.log(JSON.stringify({selected:process.env.SUPER_ADMIN_PASSWORD===process.argv[2],files:r.loadedEnvFiles.map(f=>f.path)}));`;
    const env = { ...process.env, NODE_ENV: "development" };
    delete env.SUPER_ADMIN_PASSWORD;
    const run = (expected, overrides = {}) =>
      JSON.parse(
        execFileSync(process.execPath, ["-e", script, dir, expected], {
          env: { ...env, ...overrides },
          encoding: "utf8",
          windowsHide: true,
        }),
      );
    assert.equal(run("fixture-source-2").selected, true);
    assert.deepEqual(run("fixture-source-2").files, [
      ".env.development.local",
      ".env.local",
      ".env",
    ]);
    assert.equal(
      run("fixture-process", { SUPER_ADMIN_PASSWORD: "fixture-process" }).selected,
      true,
    );
  } finally {
    for (const file of files) fs.unlinkSync(path.join(dir, file));
    fs.rmdirSync(dir);
  }
});
