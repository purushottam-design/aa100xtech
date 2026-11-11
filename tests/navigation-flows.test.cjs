const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

// Exercise the actual form handlers without sending test applications to production.
function load(relativePath, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const exports = {};
  const components = new Proxy({}, { get: (_, name) => String(name) });
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      if (name in mocks) return mocks[name];
      if (name === "react/jsx-runtime") return require(name);
      if (name.startsWith("@/components/") || name === "lucide-react") return components;
      throw new Error("Unexpected test import: " + name);
    },
    URLSearchParams,
    ...globals,
  });
  return exports;
}

function findAll(node, predicate) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap((item) => findAll(item, predicate));
  return [...(predicate(node) ? [node] : []), ...findAll(node.props?.children, predicate)];
}

const cohorts = load("src/data/careers.ts", {
  "./site": load("src/data/site.ts"),
});

for (const kind of ["global", "london", "partnership"]) {
  test(`${kind}: success requires a completed insert; errors retain the application`, async () => {
    let complete;
    let insertResult = new Promise((resolve) => {
      complete = resolve;
    });
    const inserts = [],
      successes = [],
      errors = [],
      states = [];
    let resets = 0;
    const mocks = {
      react: {
        useState: (initial) => [initial, (value) => states.push(value)],
        useRef: (initial) => ({ current: initial }),
        useEffect() {},
      },
      sonner: {
        toast: {
          success: (...args) => successes.push(args),
          error: (...args) => errors.push(args),
        },
      },
      "@/lib/navigation": { Link: "Link" },
      "@/hooks/use-public-site": { usePublicSite: () => load("src/data/site.ts").site },
      "next/navigation": {
        useSearchParams: () =>
          new URLSearchParams(kind === "influencer" ? "opportunity=paid-promotion" : ""),
      },
      "@/integrations/supabase/client": {
        supabase: {
          from: (table) => ({
            insert: (data) => {
              inserts.push({ table, data });
              return insertResult;
            },
          }),
        },
      },
      "@/data/partner-plans": { partnerPlans: [] },
      "@/data/partnership": { partnerTiers: [] },
      "@/data/careers": cohorts,
      "@/data/site": load("src/data/site.ts"),
    };
    mocks["@/lib/website-requests"] = {
      submitWebsiteRequest: async (data) => {
        inserts.push({
          table: "candidate_submissions",
          data: {
            role_applied: data.role,
            task_title: data.requirements,
            availability: data.availability,
          },
        });
        const result = await insertResult;
        if (result.error) throw new Error("Save failed");
        return { saved: true, notification: "sent" };
      },
    };
    const globals = {
      File,
      crypto: { randomUUID: () => "00000000-0000-4000-8000-000000000001" },
      FormData: class {
        constructor(form) {
          this.form = form;
        }
        get(key) {
          return this.form.values[key] ?? null;
        }
      },
    };
    const jobs = kind === "global" || kind === "london";
    const module = load(
      kind === "global"
        ? "src/components/candidate-application-form.tsx"
        : jobs
          ? "src/components/careers-page.tsx"
          : "src/routes/partners.apply.tsx",
      mocks,
      globals,
    );
    const tree =
      kind === "global"
        ? module.CandidateApplicationForm({ initialRole: "Engineer" })
        : jobs
          ? module.CareersPage({
              cohort: kind === "global" ? cohorts.globalCohort : cohorts.londonCohort,
            })
          : module.default();
    const form = findAll(tree, (node) => node.type === "form")[0];
    assert.ok(form);
    if (!jobs) {
      const ladderFields = findAll(tree, (node) =>
        ["target_level", "plan", "affiliate_platforms"].includes(node.props?.id),
      );
      assert.equal(ladderFields.length, kind === "influencer" ? 0 : 3);
    }
    const values = {
      name: " Test Applicant ",
      full_name: "Test Applicant",
      email: "test@example.com",
      role: "Engineer",
      task_title: "A global task application",
      hours: "4",
      start: "2026-11-01",
      portfolio: "https://example.com/work",
      shipped: "A project",
      motivation: "Paid content proposal",
      rightToWork: "Yes",
      location: "London",
    };
    const event = {
      preventDefault() {},
      currentTarget: {
        values,
        reset: () => {
          resets++;
        },
      },
    };
    const pending = form.props.onSubmit(event);
    assert.equal(successes.length, 0, "No success before the database responds");
    assert.equal(resets, 0);
    complete({ error: null });
    await pending;
    assert.equal(successes.length, 1);
    assert.equal(resets, 1);
    assert.equal(inserts[0].table, jobs ? "candidate_submissions" : "partner_applications");
    if (jobs) {
      assert.equal(inserts[0].data.role_applied, "Engineer");
      assert.match(inserts[0].data.task_title, new RegExp(kind));
      if (kind === "london") assert.match(inserts[0].data.availability, /London/);
    } else if (kind === "influencer") {
      assert.equal(inserts[0].data.target_level, "Paid promotion collaboration");
      assert.equal(inserts[0].data.plan_id, null);
    }
    insertResult = Promise.resolve({ error: { message: "Insert denied" } });
    await form.props.onSubmit(event);
    assert.equal(successes.length, 1);
    assert.equal(resets, 1);
    assert.equal(errors.length, 1);
    insertResult = Promise.reject(new Error("Network unavailable"));
    await form.props.onSubmit(event);
    assert.equal(successes.length, 1);
    assert.equal(resets, 1);
    assert.equal(errors.length, 2);
    assert.equal(states.at(-1), false, "Submit button recovers after a network failure");
  });
}

test("header destinations and reversible authentication visibility", () => {
  const site = load("src/data/site.ts");
  assert.equal(site.showAuthButtons, true);
  assert.ok(
    !site.headerNavLinks.some((item) => ["/careers", "/creator-moves-365"].includes(item.to)),
  );
  assert.ok(site.headerNavLinks.some((item) => item.to === "/business-plans"));
  assert.ok(site.headerNavLinks.some((item) => item.to === "/consultation"));
  assert.deepEqual(
    Array.from(site.joinUsLinks, (item) => item.label),
    ["Jobs", "Join Us Influencer"],
  );
  assert.equal(site.marketingLinks[0].to, "/social-media-ads-marketing");
  assert.equal(site.marketingLinks[3].to, "/influencers");
});
