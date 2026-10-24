"use client";

import { useSearchParams } from "next/navigation";
import { Link } from "@/lib/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { partnerPlans } from "@/data/partner-plans";
import { partnerTiers } from "@/data/partnership";
import { supabase } from "@/integrations/supabase/client";

const title = "Apply — Influencer Partnership Program | AA100XTech";
const description =
  "Apply for entry into the AA100XTech 30-level influencer partnership ladder — from affiliate commissions to territory rights, academy building and full global partnership.";

export default PartnerApplyPage;

function PartnerApplyPage() {
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get("plan") ?? undefined;
  const opportunity = searchParams.get("opportunity") === "paid-promotion" ? "paid-promotion" : undefined;
  const paidPromotion = opportunity === "paid-promotion";
  const [submitting, setSubmitting] = useState(false);
  const [level, setLevel] = useState("");
  const [plan, setPlan] = useState(planFromUrl ?? "");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSubmitting(true);

    try {
      const selectedPlan = paidPromotion ? undefined : partnerPlans.find((p) => p.id === plan);
      const { error } = await supabase.from("partner_applications").insert({
        full_name: String(fd.get("full_name") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        country: String(fd.get("country") ?? ""),
        platforms: String(fd.get("platforms") ?? ""),
        handle: String(fd.get("handle") ?? ""),
        followers: String(fd.get("followers") ?? ""),
        niche: String(fd.get("niche") ?? ""),
        target_level: paidPromotion ? "Paid promotion collaboration" : level,
        plan_id: selectedPlan?.id ?? null,
        plan_name: selectedPlan?.name ?? null,
        affiliate_platforms: String(fd.get("affiliate_platforms") ?? ""),
        motivation:
          (paidPromotion ? "Paid promotion application\n" : "") +
          String(fd.get("motivation") ?? ""),
        referrer: String(fd.get("referrer") ?? ""),
      });

      if (error) throw error;
      toast.success("Application received", {
        description: "Your application has been saved for review.",
      });
      form.reset();
      setLevel("");
      setPlan("");
    } catch {
      toast.error("Could not save your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-16 md:py-20">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/partners"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Partnership program
          </Link>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl">
            {paidPromotion
              ? "Influencer: paid promotion opportunities"
              : "Apply to the 30-level partnership ladder"}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {paidPromotion
              ? "Apply to collaborate with AA100XTech on paid promotions for our company, products and services. Share your social profiles, audience and proposed content. Our team will review your fit and discuss campaign deliverables, rates and payment terms before any work begins. Applying does not guarantee a paid campaign."
              : "Tell us where you create, who you reach and which level you are aiming for. Everyone starts at Level 1 affiliate; how fast you climb depends on delivery, not tenure."}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <form onSubmit={onSubmit} className="surface-card grid gap-5 p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full name *</Label>
                <Input id="full_name" name="full_name" required placeholder="Your name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required placeholder="you@email.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone / WhatsApp</Label>
                <Input id="phone" name="phone" placeholder="+91 ..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Country / city</Label>
                <Input id="country" name="country" placeholder="Patna, India" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="platforms">Platforms you create on</Label>
                <Input
                  required={paidPromotion}
                  id="platforms"
                  name="platforms"
                  placeholder="Instagram, YouTube, LinkedIn"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="handle">Main handle / profile link</Label>
                <Input
                  required={paidPromotion}
                  id="handle"
                  name="handle"
                  placeholder="@yourhandle"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="followers">Total audience size</Label>
                <Input id="followers" name="followers" placeholder="e.g. 42,000" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="niche">Audience niche</Label>
                <Input id="niche" name="niche" placeholder="Real estate, business, tech" />
              </div>
            </div>

            {!paidPromotion && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="target_level">Level you are applying for</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger id="target_level">
                      <SelectValue placeholder="Select a tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {partnerTiers.map((t) => (
                        <SelectItem key={t.name} value={t.name}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="plan">Partnership plan</Label>
                  <Select value={plan} onValueChange={setPlan}>
                    <SelectTrigger id="plan">
                      <SelectValue placeholder="Select one of the 30 plans" />
                    </SelectTrigger>
                    <SelectContent>
                      {partnerPlans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.no.toString().padStart(2, "0")} · {p.name} — {p.payout}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="affiliate_platforms">Affiliate platforms you use</Label>
                  <Input
                    id="affiliate_platforms"
                    name="affiliate_platforms"
                    placeholder="Impact, PartnerStack, Cuelinks, direct..."
                  />
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="motivation">
                {paidPromotion
                  ? "Your promotion proposal and expected rate *"
                  : "Why you, and what will you promote? *"}
              </Label>
              <Textarea
                id="motivation"
                name="motivation"
                required
                rows={5}
                placeholder={
                  paidPromotion
                    ? "Your audience, content formats, availability, previous campaigns and expected rate."
                    : "Your audience, the services you would sell, and the results you have driven before."
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="referrer">Referred by (optional)</Label>
              <Input id="referrer" name="referrer" placeholder="Partner name or code" />
            </div>

            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitting ? "Sending..." : "Submit application"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {paidPromotion
                ? "If your profile fits a campaign, our team will contact you by email to discuss a paid collaboration."
                : "We review applications within 48 hours and send onboarding, your tracking link and your Level 1 dashboard access by email."}
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
