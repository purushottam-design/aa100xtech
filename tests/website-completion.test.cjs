const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");
const { services } = load("src/data/services.ts");

test("all catalog services have complete guidance and valid existing specification links", () => {
  const { serviceDetails } = load("src/data/service-details.ts");
  for (const service of services) {
    const detail = serviceDetails(service);
    assert.ok(detail.benefits.length >= 3, service.slug);
    assert.ok(detail.stack.length > 0, service.slug);
    assert.equal(detail.process.length, 4, service.slug);
    assert.ok(detail.faqs.length >= 4, service.slug);
    assert.equal(new Set(detail.stack).size, detail.stack.length, service.slug);
    for (const type of detail.types) {
      assert.ok(type.serviceSlug === service.slug || type.slug === service.slug);
    }
  }
});

test("public service canonicals and social text are unique and missing services remain noindex", () => {
  const { detailMetadata } = load("src/lib/page-metadata/services.slug.ts");
  const canonicals = new Set();
  for (const service of services) {
    const meta = detailMetadata(service);
    assert.equal(meta.alternates.canonical, `https://aa100xtech.com/services/${service.slug}`);
    assert.equal(meta.openGraph.url, meta.alternates.canonical);
    assert.equal(meta.twitter.description, service.short);
    canonicals.add(meta.alternates.canonical);
  }
  assert.equal(canonicals.size, services.length);
  assert.equal(detailMetadata().robots, "noindex");
});

test("every detailed service specification has a matching canonical", () => {
  const { serviceTypes } = load("src/data/service-types.ts");
  const { detailMetadata } = load("src/lib/page-metadata/services.explore.slug.ts");
  for (const type of serviceTypes) {
    assert.equal(
      detailMetadata(type).alternates.canonical,
      `https://aa100xtech.com/services/explore/${type.slug}`,
    );
  }
});
