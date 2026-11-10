const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");
const { headerNavigation, headerHref, headerLinkActive, moreItems } = load(
  "src/data/header-navigation.ts",
);

test("navbar preserves the requested primary order and existing submenu destinations", () => {
  assert.deepEqual(
    Array.from(headerNavigation, (item) => item.label),
    ["Home", "Services", "Our Top Clients", "Founder", "Marketing", "Join Us"],
  );
  const join = headerNavigation.find((item) => item.label === "Join Us").items;
  assert.ok(join.some((link) => link.to === "/careers"));
  assert.equal(
    join.some((link) => link.to === "/careers/apply"),
    false,
  );
  assert.deepEqual(
    Array.from(join, (link) => link.label),
    ["Jobs", "Request an Account"],
  );
  const marketing = headerNavigation.find((item) => item.label === "Marketing").items;
  assert.deepEqual(
    Array.from(marketing, (link) => [link.label, headerHref(link)]),
    [
      ["Social Media Ads Marketing", "/marketing/social-media-ads"],
      ["Banner Marketing", "/marketing/banner-marketing"],
      ["Newspaper Marketing", "/marketing/newspaper-marketing"],
      ["Influencer Marketing", "/influencers"],
      ["Hoarding Ads", "/marketing/hoarding-ads"],
      ["Celebrity Marketing", "/marketing/celebrity-marketing"],
    ],
  );
  const influencer = marketing.find((link) => link.to === "/influencers");
  assert.equal(headerLinkActive(influencer, "/influencer-partners"), true);
  assert.equal(headerLinkActive(influencer, "/influencer-marketing/for-brands"), true);
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
    const pathname = href.split("#")[0];
    assert.ok(
      fs.existsSync(`src/app${pathname === "/" ? "" : pathname}/page.tsx`) ||
        /^\/services\/[^/]+$/.test(href) ||
        (/^\/marketing\/[^/]+$/.test(href) && fs.existsSync("src/app/marketing/[slug]/page.tsx")),
      href,
    );
    assert.ok(!/^\/(admin|dashboard|affiliate-admin)/.test(href), href);
  }
  const more = moreItems;
  assert.equal(more.length, 4);
  for (const to of ["/about", "/consultation", "/contact", "/catalog"])
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
