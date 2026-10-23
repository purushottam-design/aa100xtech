# Rebuild AA100XTech as a Multi-Page Site

Rebuild your site (aa100xtech.com) here with the same content and structure, but a fresh, more distinctive visual design. All pages, fully responsive.

## Pages

- **/** — Home: hero with headline and dual CTAs, animated stat counters, client logo marquee, technology-expertise service grid with starting prices, digital-marketing plan tiers (Starter Presence, Growth Accelerator, Enterprise Dominance), website project-scope tiers (Business Essentials, Business Scaler, Corporate Custom) with a deliverables comparison, "Why Choose Us" section, custom-scope CTA.
- **/about** — Mission and vision, company stats, 2025–2026 timeline, core values (Innovation, Client-Centric, Integrity, Excellence), Patna/GSTIN company details.
- **/services** — Full service catalog with transparent INR pricing: website development, e-commerce, mobile apps, AI, cloud, cybersecurity, marketing, design. Expandable per-service offering lists with prices.
- **/services/$slug** — Detail page per service category, driven by a shared services data file (no dead links).
- **/portfolio** — Filterable project grid (Worldwide Prominent Properties, PicEmpire, Shakti Sphere Lifestyle, and the rest), each with tech tags, description, and live link.
- **/contact** — Contact details (email, phone, Patna address, hours, GSTIN), inquiry form (name, email, phone, company, service, message), map link, FAQ accordion.

## Design direction

Fresh design instead of a pixel copy: a dark, high-contrast "engineering studio" look with a single strong accent color, generous spacing, editorial typography (distinctive display face for headings, clean sans for body), subtle motion on scroll, and glass/depth cards for pricing. All colors as semantic tokens in `src/styles.css` — no hardcoded color utilities. Not the generic purple-gradient look.

## Shared components

Sticky header with logo, nav links, and a "Start Your Project" CTA (mobile drawer nav), and a footer with services, company links, and contact info — both in `src/routes/__root.tsx`.

## Technical notes

- TanStack Start file routes under `src/routes/`; each route gets its own `head()` with unique title/description/OG tags.
- Content lives in typed data modules (`src/data/services.ts`, `portfolio.ts`, `pricing.ts`) so pages stay small and prices are edited in one place.
- Section components under `src/components/` (Hero, StatCounters, LogoMarquee, ServiceGrid, PricingTiers, ComparisonTable, FAQ, ContactForm).
- Images: your existing logo/asset URLs are referenced from your current domain; brand imagery can be swapped for generated assets later if you prefer.
- Contact form: front-end only at this stage (validation + success toast, no email delivery). Wiring it to store submissions and send email needs Lovable Cloud — say the word and I'll add it in a follow-up.

## Out of scope for this pass

Blog, service-inquiry funnel pages, and admin/CMS editing.
