const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

module.exports = function loadServer(entry, mocks = {}, globals = {}) {
  const cache = new Map();
  const root = path.resolve("src");
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
      },
    });
    vm.runInNewContext(outputText, {
      exports,
      Request,
      Response,
      Headers,
      URL,
      URLSearchParams,
      Buffer,
      AbortSignal,
      fetch,
      console,
      process,
      ...globals,
      require(name) {
        if (name === "server-only") return {};
        if (name in mocks) return mocks[name];
        if (name.startsWith("@/") || name.startsWith(".")) {
          let resolved = name.startsWith("@/")
            ? path.join(root, name.slice(2))
            : path.resolve(path.dirname(file), name);
          if (!fs.existsSync(resolved))
            resolved += fs.existsSync(resolved + ".ts") ? ".ts" : ".tsx";
          const alias =
            "@/" +
            path
              .relative(root, resolved)
              .replaceAll("\\", "/")
              .replace(/\.tsx?$/, "");
          return alias in mocks ? mocks[alias] : load(resolved);
        }
        return require(name);
      },
    });
    return exports;
  }
  return load(entry);
};
