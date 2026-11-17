"use strict";

const { loadEnvConfig } = require("@next/env");
const { validateSupabaseIdentity } = require("./environment.cjs");

function main() {
  const values = {};
  for (const arg of process.argv.slice(2)) {
    const match = /^--(master-ref|source-ref)=([a-z0-9]{20})$/.exec(arg);
    if (!match || values[match[1]]) {
      console.error(
        "Usage: npm run partners:preflight -- --master-ref=<verified-ref> --source-ref=<verified-ref>",
      );
      process.exitCode = 2;
      return;
    }
    values[match[1]] = match[2];
  }
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", { info() {}, error() {} });
  const identity = validateSupabaseIdentity(process.env, {
    expectedMasterRef: values["master-ref"],
    sourceRef: values["source-ref"],
  });
  console.log(
    JSON.stringify(
      {
        mode: "read-only-local-configuration",
        ...identity,
        credentialsVerified: false,
        liveSchemasVerified: false,
        sourceParityVerified: false,
        productionCutoverReady: false,
      },
      null,
      2,
    ),
  );
  if (!identity.identityReady) process.exitCode = 1;
}

main();
