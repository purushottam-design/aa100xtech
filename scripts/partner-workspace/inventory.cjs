"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const prdPath = "prd/AA100XTech_Partners_Complete_Integration_PRD.md";
const ledgerPath = "prd/partners-parity-ledger.json";

function section(markdown, start, end) {
  const from = markdown.indexOf(start);
  const to = markdown.indexOf(end, from + start.length);
  if (from < 0 || to < 0)
    throw new Error("PRD appendix boundaries changed; review the inventory parser.");
  return markdown.slice(from, to);
}

function rows(markdown) {
  return markdown
    .split(/\r?\n/)
    .filter((line) => line.startsWith("| ") && line.includes("`"))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim().replaceAll("`", "")),
    );
}

function verifyCount(items, key, expected, label) {
  if (items.length !== expected || new Set(items.map((item) => item[key])).size !== expected) {
    throw new Error(
      `PRD ${label} count or uniqueness changed; review the inventory before continuing.`,
    );
  }
}

function buildPartnerInventory(markdown) {
  const privateRoutes = rows(
    section(markdown, "## Appendix A", "### Public, login and special route disposition"),
  ).map(([sourceRoute, targetRoute, proposedTargetFile, audience]) => ({
    sourceRoute,
    targetRoute,
    proposedTargetFile,
    audience,
    implementation: null,
    authorization: null,
    caller: null,
    status: "pending-source-review",
    verification: null,
  }));
  const tables = rows(section(markdown, "## Appendix B", "## Appendix C")).map(
    ([sourceTable, proposedTargetTable, rule]) => ({
      sourceTable,
      proposedTargetTable,
      rule,
      sourceLiveSchema: null,
      targetLiveSchema: null,
      migration: null,
      status: "pending-live-schema-reconciliation",
      verification: null,
    }),
  );
  const publicAndSpecialRoutes = rows(
    section(markdown, "### Public, login and special route disposition", "## Appendix B"),
  ).map(([sourceEntry, proposedDisposition]) => ({
    sourceEntry,
    proposedDisposition,
    status: "pending-source-review",
    verification: null,
  }));
  const operationSection = section(markdown, "## Appendix C", "## Appendix D");
  const operations = [];
  let moduleName = null;
  let declaredCount = 0;
  let moduleOperations = 0;
  let moduleCount = 0;
  function verifyModule() {
    if (moduleName && declaredCount !== moduleOperations)
      throw new Error("PRD operation module count changed; review the inventory.");
  }
  for (const line of operationSection.split(/\r?\n/)) {
    const heading = /^### C\.0 .+? ([a-z-]+) \((\d+)\)$/.exec(line);
    if (heading) {
      verifyModule();
      moduleName = heading[1];
      declaredCount = Number(heading[2]);
      moduleOperations = 0;
      moduleCount++;
    }
    const row =
      /^\| `([A-Za-z][A-Za-z0-9]*)` \| `(authenticated|any|staff|admin|influencer|lead_team|gamer)` \|$/.exec(
        line,
      );
    if (row && moduleName) {
      operations.push({
        key: `${moduleName}.${row[1]}`,
        module: moduleName,
        operation: row[1],
        sourceAccessClass: row[2],
        sourceFile: `supabase/external/edge/_shared/ops/${moduleName}.ts`,
        targetHandler: null,
        authorization: null,
        caller: null,
        status: "pending-source-review",
        verification: null,
      });
      moduleOperations++;
    }
  }
  verifyModule();
  const existingPages = rows(section(markdown, "## Appendix D", "## Appendix E")).map(
    ([route, file]) => ({ route, file, status: "preserve-existing-behavior", verification: null }),
  );
  verifyCount(privateRoutes, "sourceRoute", 46, "private routes");
  verifyCount(tables, "sourceTable", 56, "source tables");
  verifyCount(tables, "proposedTargetTable", 56, "target tables");
  verifyCount(operations, "key", 173, "operations");
  verifyCount(existingPages, "route", 71, "existing pages");
  if (moduleCount !== 25) throw new Error("PRD operation module count changed.");
  return {
    formatVersion: 1,
    specification: { file: prdPath, sha256: createHash("sha256").update(markdown).digest("hex") },
    source: {
      lovableProjectId: "596d7dbe-aa8e-4a98-9859-a133b7678ff6",
      auditedCommit: "dd09e0b44087c823624aab423b4c0275cb7a67bd",
      configuredProjectRefFromPrd: "hvcznonjilfmyizlmlkq",
      actualSourceReviewed: false,
    },
    completion: {
      complete: false,
      implementedPrivateRoutes: 0,
      implementedSourceOperations: 0,
      reconciledLiveTables: 0,
      productionCutoverReady: false,
    },
    counts: {
      privateRoutes: privateRoutes.length,
      publicAndSpecialRoutes: publicAndSpecialRoutes.length,
      tables: tables.length,
      operations: operations.length,
      operationModules: moduleCount,
      existingPages: existingPages.length,
    },
    additionalObligations: [
      "Public/source asset and motion parity; native login and recovery aliases",
      "Master-auth reconciliation, canonical account links and logged bootstrap",
      "Shared identity-safe removals, resets and credential issuance",
      "Atomic approvals/drafts/sharing from source migrations 055–057",
      "Private storage migration and freshly authorized signed links",
      "Durable idempotent intake-to-CRM bridge with visible retries",
      "Source health, protected follow-up cron and external AI/Sheets providers",
      "Staging rehearsal, role/ownership tests, rollback and production approval",
    ],
    publicImplementation: {
      status: "partial",
      requirements: ["FR-23 (campaign offer subset)", "FR-24 (native package context subset)"],
      files: [
        "src/data/partner-campaign-packages.ts",
        "src/components/partner-campaign-packages.tsx",
        "src/app/influencer-marketing/for-brands/page.tsx",
        "src/lib/marketing-form.server.ts",
      ],
      implemented: [
        "Four distinct campaign offers with written-confirmation and whole-campaign quantity qualifiers",
        "Allowlisted package selection through the existing native enquiry",
        "Server-derived offer snapshot persisted by the existing idempotent AA receipt RPC",
        "Selected offer scope displayed in the existing brand inquiry inbox",
      ],
      outstanding: [
        "Review source public content, assets and motion",
        "Durable intake-to-CRM bridge after source/schema discovery",
        "Actual source workflow and route parity",
      ],
    },
    publicAndSpecialRoutes,
    privateRoutes,
    tables,
    operations,
    existingPages,
  };
}

if (require.main === module) {
  try {
    const root = path.resolve(__dirname, "../..");
    const inventory = buildPartnerInventory(fs.readFileSync(path.join(root, prdPath), "utf8"));
    const serialized = JSON.stringify(inventory, null, 2) + "\n";
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] === "--write")
      fs.writeFileSync(path.join(root, ledgerPath), serialized);
    else if (args.length === 1 && args[0] === "--check") {
      const current = JSON.parse(fs.readFileSync(path.join(root, ledgerPath), "utf8"));
      if (JSON.stringify(current) !== JSON.stringify(inventory))
        throw new Error("Parity ledger is stale; regenerate after reviewing the PRD.");
    } else if (args.length)
      throw new Error("Usage: npm run partners:inventory -- [--check|--write]");
    console.log(
      JSON.stringify(
        { counts: inventory.counts, complete: false, sourceReviewed: false, ledger: ledgerPath },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { buildPartnerInventory };
