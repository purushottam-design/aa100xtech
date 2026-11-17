const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { buildPartnerInventory } = require("../scripts/partner-workspace/inventory.cjs");
const prd = fs.readFileSync("prd/AA100XTech_Partners_Complete_Integration_PRD.md", "utf8");

test("parity inventory accounts for all appendix obligations without claiming unimplemented behavior", () => {
  const ledger = buildPartnerInventory(prd);
  assert.deepEqual(ledger.counts, {
    privateRoutes: 46,
    publicAndSpecialRoutes: 12,
    tables: 56,
    operations: 173,
    operationModules: 25,
    existingPages: 71,
  });
  assert.equal(ledger.completion.complete, false);
  assert.ok(ledger.operations.every((op) => op.verification === null && op.targetHandler === null));
  assert.ok(ledger.tables.every((table) => table.proposedTargetTable.startsWith("cm365_")));
  const retiredRoles = ledger.tables.find((table) => table.sourceTable === "user_roles");
  assert.equal(retiredRoles.proposedTargetTable, "cm365_legacy_user_roles");
  assert.equal(
    ledger.tables.find((table) => table.sourceTable === "products").proposedTargetTable,
    "cm365_products",
  );
});

test("missing and duplicated appendix operations fail rather than shrinking claimed scope", () => {
  assert.throws(() => buildPartnerInventory(prd.replace("| `getMe` | `any` |", "")), /count/);
  assert.throws(
    () =>
      buildPartnerInventory(prd.replace("| `getMe` | `any` |", "| `listMemberships` | `any` |")),
    /uniqueness/,
  );
});
