const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");
const { services } = load("src/data/services.ts");
const { buildServiceNavigation } = load("src/data/service-navigation.ts");

test("service navigation includes each catalog service once and preserves the actual detail routes", () => {
  const groups = buildServiceNavigation();
  const items = groups.flatMap((group) => Array.from(group.items));
  assert.equal(new Set(items.map((item) => item.href)).size, items.length);
  assert.equal(items.length, services.length + 3);
  for (const service of services) {
    const matches = items.filter((item) => item.href === `/services/${service.slug}`);
    assert.equal(matches.length, 1, service.slug);
    assert.equal(matches[0].title, service.title);
    assert.equal(matches[0].icon, service.icon);
    assert.ok(service.navigationGroup);
  }
  assert.ok(items.some((item) => item.href === "/influencer-programs"));
  assert.ok(items.some((item) => item.href === "/influencer-marketing#viral-influencer-marketing"));
  assert.equal(
    items.some((item) => /game development/i.test(item.title)),
    false,
  );
});

test("new catalog entries automatically appear even before their navigation group is assigned", () => {
  const next = {
    ...services[0],
    slug: "future-example",
    title: "Future example",
    navigationGroup: undefined,
  };
  const groups = buildServiceNavigation([...services, next]);
  const other = groups.find((group) => group.id === "other");
  assert.equal(other.items[0].href, "/services/future-example");
  assert.equal(other.items[0].title, "Future example");
});

test("navigation metadata leaves all approved service content, packages and prices unchanged", () => {
  const crypto = require("node:crypto");
  const plain = Array.from(services, ({ navigationGroup, ...service }) => service);
  assert.equal(
    crypto.createHash("sha256").update(JSON.stringify(plain)).digest("hex"),
    "3b7b35210a1719afe9e8ae07d075ac142627a4d800db2d7b83d865fa984b947f",
  );
});
