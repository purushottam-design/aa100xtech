import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { AccessRequestForm } from "@/components/access-request-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/request-access")({
  head: () => ({
    meta: [
      { title: "Request an account — AA100XTech portal access" },
      {
        name: "description",
        content:
          "Employees, customers, partners and job seekers can request an AA100XTech portal account. The company verifies your email and phone, then issues your credentials.",
      },
      { property: "og:title", content: "Request an account — AA100XTech portal access" },
      {
        property: "og:description",
        content: "Submit your details and the company will approve and issue your login.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestAccessPage,
});

function RequestAccessPage() {
  const [done, setDone] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-4 text-muted-foreground">
        New accounts need approval. Tell us who you are — we verify you on your personal email and
        WhatsApp number, and the company's supreme user then allots your username, email, phone and
        password.
      </p>

      {done ? (
        <Card className="surface-card mt-8">
          <CardHeader>
            <CardTitle className="font-display">Request received</CardTitle>
            <CardDescription>
              Our team will verify your details on your personal email and WhatsApp number. Once
              approved, your credentials will be shared with you and you can sign in.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button asChild variant="outline">
              <Link to="/auth">Go to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="surface-card mt-8">
          <CardContent className="pt-6">
            <AccessRequestForm idPrefix="ra" onSuccess={() => setDone(true)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
