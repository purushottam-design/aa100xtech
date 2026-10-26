const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const fixture = require("./fixtures/migration-parity.json");

const root = path.join(__dirname, "..");
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

// Captured from the original Git commit before migration, then updated only
// for the requested influencer and payment additions.
// Normalizing through
// the JSX compiler ignores formatting while retaining text, classes, attributes,
// event handlers, component order, and conditional rendering.
function markup(source, file) {
  const result = [];
  const syntax = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
      const compiled = ts.transpileModule(`const view = (${node.getText(syntax)});`, {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
        },
      }).outputText;
      result.push(compiled.replace(/\r\n/g, "\n"));
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(syntax);
  return result;
}

test("all 58 existing page templates match the approved rendered JSX baseline", () => {
  const pages = Object.entries(fixture.markup).filter(([file]) => file.startsWith("src/routes/"));
  assert.equal(pages.length, 58);
  for (const [file, expected] of pages) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert.equal(hash(JSON.stringify(markup(source, file))), expected, file);
  }
});

test("all 79 existing shared components match the approved rendered JSX baseline", () => {
  const components = Object.entries(fixture.markup).filter(([file]) => file.startsWith("src/components/"));
  assert.equal(components.length, 79);
  for (const [file, expected] of components) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert.equal(hash(JSON.stringify(markup(source, file))), expected, file);
  }
});

test("original styles, business data, robots, manifest, and public images remain unchanged", () => {
  for (const [file, expected] of Object.entries(fixture.files)) {
    const bytes = fs.readFileSync(path.join(root, file));
    const actual = expected.text ? bytes.toString("utf8").replace(/\r\n/g, "\n") : bytes;
    assert.equal(hash(actual), expected.hash, file);
  }
});

function loadMetadata(file) {
  const { outputText } = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === "@/lib/page-metadata") return loadMetadata("src/lib/page-metadata.ts");
      // Dynamic metadata only uses these imports in erased type annotations.
      if (name.startsWith("@/data/")) return {};
      throw new Error("Unexpected metadata import: " + name);
    },
  });
  return exports;
}

function assertSeoFields(actual, legacy, file) {
  for (const meta of legacy.meta ?? []) {
    if (meta.title !== undefined) assert.equal(actual.title, meta.title, `${file}: title`);
    const key = meta.name ?? meta.property;
    if (!key || meta.content === undefined) continue;
    if (key.startsWith("og:")) assert.equal(actual.openGraph?.[key.slice(3)], meta.content, `${file}: ${key}`);
    else if (key.startsWith("twitter:")) assert.equal(actual.twitter?.[key.slice(8)], meta.content, `${file}: ${key}`);
    else assert.equal(actual[key], meta.content, `${file}: ${key}`);
  }
  for (const link of legacy.links ?? []) {
    if (link.rel === "canonical") assert.equal(actual.alternates?.canonical, link.href, `${file}: canonical`);
  }
  assert.equal(actual.openGraph?.type ?? "website", legacy.meta?.find((item) => item.property === "og:type")?.content ?? "website", `${file}: inherited OG type`);
}

test("native Next metadata preserves SEO fields on all 58 pages and both dynamic 404 variants", () => {
  assert.equal(fixture.metadata.length, 58);
  for (const entry of fixture.metadata) {
    const module = loadMetadata(entry.file);
    const metadata = entry.input ? module.detailMetadata(entry.input) : module.metadata;
    assertSeoFields(metadata, entry.legacy, entry.file);
    if (entry.missing) assertSeoFields(module.detailMetadata(), entry.missing, `${entry.file} (not found)`);
  }
});
