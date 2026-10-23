import { createFileRoute, Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const title = "Admin guide — how to open Super Admin & Admin | AA100XTech";
const description =
  "Step-by-step picture guide: sign in, open the Super Admin console, open a role admin panel, create a new admin and set permissions — on the website and in the phone app.";

export const Route = createFileRoute("/admin-guide")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminGuidePage,
});

type Step = {
  n: number;
  title: string;
  hindi: string;
  english: string;
  image?: { src: string; alt: string };
  action?: { label: string; to: string; search?: Record<string, string> };
};

const OPEN_SUPER: Step[] = [
  {
    n: 1,
    title: "My account → Sign in",
    hindi: "Website par upar dayein “My account” par click karein. Sign-in page khulega (email + password).",
    english: "Click “My account” at the top right of the site to reach the sign-in page.",
    image: { src: "/guide/auth.png", alt: "AA100XTech sign-in page with email and password fields" },
    action: { label: "Open sign-in page", to: "/auth" },
  },
  {
    n: 2,
    title: "Super admin ka email/password daalein",
    hindi: "Wahi email aur password daalein jo super admin ke liye set hai. Login hote hi “Choose panel” page aata hai.",
    english: "Enter the super admin email and password. After login you land on the Choose panel page.",
  },
  {
    n: 3,
    title: "Super console kholein",
    hindi: "“Super console” button dabayein, ya browser me seedhe /admin/super kholein.",
    english: "Press “Super console”, or open /admin/super directly.",
    image: { src: "/guide/super.png", alt: "Super admin console dashboard with sidebar sections" },
    action: { label: "Open Super console", to: "/admin/super", search: { section: "overview" } },
  },
  {
    n: 4,
    title: "Bayein sidebar se koi bhi section",
    hindi: "Dashboard, Reports, Users, Admins & permissions, Roles, Hierarchy, Support, Notifications, Content, Activity & logins, Sessions, Two-factor, Settings.",
    english: "Use the left sidebar to open any module of the console.",
  },
];

const OPEN_ADMIN: Step[] = [
  {
    n: 1,
    title: "Wahi ek hi login page",
    hindi: "Company / Interview / Marketing / Business / Manager — sabke liye same login page hai, alag koi login nahi.",
    english: "Every admin uses the same sign-in page — there is no separate admin login.",
    action: { label: "Open sign-in page", to: "/auth" },
  },
  {
    n: 2,
    title: "Sirf assigned panel dikhte hain",
    hindi: "Login ke baad account ko jo panel diye gaye hain wahi dikhte hain (jaise Marketing Admin → /admin/marketing).",
    english: "After sign-in only the panels assigned to that account are shown.",
  },
  {
    n: 3,
    title: "Permission server par check hoti hai",
    hindi: "Jo permission super admin ne di hai wahi modules khulenge. Button sirf chhupaya nahi jaata — server har request par dobara check karta hai.",
    english: "Modules open only with granted permissions; the server re-checks every request, buttons are not just hidden.",
  },
];

const CREATE_ADMIN: Step[] = [
  {
    n: 1,
    title: "Super console → Admins & permissions",
    hindi: "Super console kholein aur “Admins & permissions” section me jayein.",
    english: "Open the console and go to “Admins & permissions”.",
    image: { src: "/guide/admins.png", alt: "Admins and permissions page listing admin accounts" },
    action: { label: "Open Admins & permissions", to: "/admin/admins" },
  },
  {
    n: 2,
    title: "Create admin",
    hindi: "Naam, email, employee ID, department, role aur password bhar kar admin banayein.",
    english: "Fill name, email, employee ID, department, role and password to create the admin.",
  },
  {
    n: 3,
    title: "Permissions → Select all / tick → Save",
    hindi: "Us admin ki row me Permissions kholein, “Select all” ya zaroorat ke box tick karein aur Save dabayein.",
    english: "Open Permissions on that admin's row, tick what they need (or Select all), then Save.",
    image: { src: "/guide/roles.png", alt: "Roles page with permission checkboxes and select all option" },
    action: { label: "Open Roles", to: "/admin/super", search: { section: "roles" } },
  },
];

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-6">
      {steps.map((s) => (
        <li key={s.n} className="rounded-2xl border border-border/60 bg-card/40 p-5">
          <div className="flex items-start gap-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {s.n}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-foreground/90">{s.hindi}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.english}</p>

              {s.image ? (
                <figure className="mt-4 overflow-hidden rounded-xl border border-border/60">
                  <img
                    src={s.image.src}
                    alt={s.image.alt}
                    loading="lazy"
                    className="w-full object-cover object-top"
                    style={{ maxHeight: 420 }}
                  />
                  <figcaption className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
                    {s.image.alt}
                  </figcaption>
                </figure>
              ) : null}

              {s.action ? (
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link to={s.action.to as never} search={s.action.search as never}>
                    {s.action.label}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function AdminGuidePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge variant="secondary">Guide · Hindi + English</Badge>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Super Admin aur Admin kaise kholein
      </h1>
      <p className="mt-3 text-muted-foreground">
        Screenshots ke saath poora tarika: login karna, super console kholna, role admin panel kholna,
        naya admin banana aur uski permissions set karna. Website aur phone app dono ek hi backend par
        chalte hain, isliye data dono jagah same rehta hai.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/auth">Sign in / Create account</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/super" search={{ section: "overview" } as never}>Super console</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/app/admin">Phone app admin screen</Link>
        </Button>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">1. Super Admin kholna</h2>
        <div className="mt-5">
          <StepList steps={OPEN_SUPER} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">2. Normal admin kholna</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Company · Interview · Marketing · Business · Manager
        </p>
        <div className="mt-5">
          <StepList steps={OPEN_ADMIN} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">3. Naya admin banana aur permission dena</h2>
        <div className="mt-5">
          <StepList steps={CREATE_ADMIN} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">4. Phone app me bhi wahi console</h2>
        <Card className="surface-card mt-5">
          <CardHeader>
            <CardTitle className="font-display text-lg">App → Admin screen</CardTitle>
            <CardDescription>
              App ke Admin screen par “Super admin console” card hai — Dashboard, Reports, Users, Admins,
              Roles, Hierarchy, Support, Notifications, Content, Activity log, Sessions aur Two-factor ke
              direct buttons. Ek tap me wahi section khulta hai, data website jaisa hi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <figure className="overflow-hidden rounded-xl border border-border/60">
              <img
                src="/guide/app-admin2.png"
                alt="Phone app admin screen showing the super admin console shortcut buttons"
                loading="lazy"
                className="mx-auto w-full max-w-xs object-cover object-top"
              />
            </figure>
            <Button asChild className="mt-4">
              <Link to="/app/admin">Open app admin screen</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
