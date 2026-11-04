const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");
const { headerNavigation, headerHref, headerLinkActive } = load("src/data/header-navigation.ts");

test("navbar preserves the requested primary order and existing submenu destinations", () => {
  assert.deepEqual(
    Array.from(headerNavigation, (item) => item.label),
    [
      "Home",
      "Services",
      "Our Top Clients",
      "Be The One",
      "Founder",
      "Join Us",
      "Marketing",
      "More",
    ],
  );
  const join = headerNavigation.find((item) => item.label === "Join Us").items;
  assert.ok(join.some((link) => link.to === "/careers"));
  assert.equal(
    join.some((link) => link.to === "/careers/apply"),
    false,
  );
  assert.ok(join.some((link) => link.to === "/influencers"));
  const marketing = headerNavigation.find((item) => item.label === "Marketing").items;
  assert.ok(marketing.some((link) => headerHref(link) === "/services/social-media-marketing"));
  assert.ok(marketing.some((link) => link.to === "/influencer-marketing"));
  assert.ok(marketing.some((link) => link.to === "/influencer-programs"));
});

test("navbar links resolve to existing routes without duplicates between primary and secondary menus", () => {
  const links = headerNavigation.flatMap((item) =>
    item.kind === "link" ? [item] : item.kind === "dropdown" ? Array.from(item.items) : [],
  );
  const destinations = links.map(headerHref);
  assert.equal(new Set(destinations).size, destinations.length);
  for (const href of destinations) {
    if (href.startsWith("https://")) {
      assert.equal(href, "https://theamanlife.com/");
      continue;
    }
    assert.ok(!href.includes("$"), href);
    assert.ok(
      fs.existsSync(`src/app${href === "/" ? "" : href}/page.tsx`) ||
        /^\/services\/[^/]+$/.test(href),
      href,
    );
    assert.ok(!/^\/(admin|dashboard|affiliate-admin)/.test(href), href);
  }
  const more = headerNavigation.find((item) => item.label === "More").items;
  assert.equal(more.length, 3);
  for (const to of ["/about", "/consultation", "/contact"])
    assert.ok(
      more.some((link) => link.to === to),
      to,
    );
});

test("active navigation handles exact home, nested pages and parameterized marketing links", () => {
  assert.equal(headerLinkActive({ to: "/", label: "Home" }, "/about"), false);
  assert.equal(headerLinkActive({ to: "/partners", label: "Partners" }, "/partners/plans"), true);
  assert.equal(headerLinkActive({ to: "/partners", label: "Partners" }, "/partnership"), false);
  assert.equal(
    headerLinkActive(
      { to: "/services/$slug", params: { slug: "social-media-marketing" }, label: "Social" },
      "/services/social-media-marketing",
    ),
    true,
  );
});
