"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { referralStatuses, type PartnerReferral } from "@/lib/influencer-program";

type Records = {
  referrals: PartnerReferral[];
  testimonial: {
    quote: string;
    publication_status: "draft" | "published" | "unpublished";
    consent_confirmed: boolean;
  } | null;
};
async function programRequest(profileId: string, input?: unknown): Promise<Records> {
  const headers = await attachSupabaseAuth();
  headers.set("x-aa-rpc", "1");
  if (input) headers.set("content-type", "application/json");
  const response = await fetch(
    `/api/influencers/program?profileId=${encodeURIComponent(profileId)}`,
    {
      method: input ? "POST" : "GET",
      headers,
      credentials: "same-origin",
      cache: "no-store",
      ...(input ? { body: JSON.stringify(input) } : {}),
    },
  );
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      body.error ||
        "Program records are unavailable. Check the program migration and server access.",
    );
  return body;
}

export function InfluencerProgramManagement({
  profileId,
  canEdit,
}: {
  profileId: string;
  canEdit: boolean;
}) {
  const query = useQuery({
    queryKey: ["influencer-program-records", profileId],
    queryFn: () => programRequest(profileId),
    retry: false,
  });
  const [clientReference, setClientReference] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [status, setStatus] = useState<PartnerReferral["status"]>("pending");
  const [reviewed, setReviewed] = useState(false);
  const [quote, setQuote] = useState("");
  const [publication, setPublication] = useState<"draft" | "published" | "unpublished">("draft");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (query.data) {
      setQuote(query.data.testimonial?.quote ?? "");
      setPublication(query.data.testimonial?.publication_status ?? "draft");
      setConsent(query.data.testimonial?.consent_confirmed ?? false);
    }
  }, [query.data]);
  async function save(input: unknown) {
    if (saving || !canEdit) return;
    setSaving(true);
    try {
      await programRequest(profileId, input);
      toast.success("Partner program record saved");
      await query.refetch();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save this record");
    } finally {
      setSaving(false);
    }
  }
  function referralSubmit(event: FormEvent) {
    event.preventDefault();
    void save({
      action: "referral",
      profileId,
      clientReference,
      evidenceReference,
      status,
      confirmationReviewed: reviewed,
    });
  }
  if (query.isLoading)
    return (
      <p className="surface-card mt-6 p-5 text-sm">Loading private partner program records…</p>
    );
  if (query.error)
    return (
      <div role="alert" className="surface-card mt-6 p-5">
        <h3 className="font-semibold">Partner program records are unavailable.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Verify the partner program migration and server access. Existing application review
          remains available above.
        </p>
        <Button className="mt-3" variant="outline" onClick={() => void query.refetch()}>
          Retry program records
        </Button>
      </div>
    );
  return (
    <section
      className="surface-card mt-6 space-y-7 p-5 sm:p-7"
      aria-label="Partner program administration"
    >
      <div>
        <h2 className="text-xl font-bold">Verified clients & partner stories</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Client and evidence references are private. Only confirmed conversion totals appear
          publicly. Use the same canonical CRM client ID for repeat orders; one client can be
          credited to one partner.
        </p>
      </div>
      <form onSubmit={referralSubmit}>
        <fieldset disabled={!canEdit || saving} className="grid gap-4 rounded-xl border p-4">
          <legend className="px-2 font-semibold">Record or update a client introduction</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="partner-client-ref">Private CRM client ID</Label>
              <Input
                id="partner-client-ref"
                required
                minLength={3}
                maxLength={100}
                value={clientReference}
                onChange={(event) => {
                  setClientReference(event.target.value);
                  setReviewed(false);
                }}
                placeholder="client-001 (not an email or phone)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="partner-client-status">Referral outcome</Label>
              <select
                id="partner-client-status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as PartnerReferral["status"]);
                  setReviewed(false);
                }}
                className="h-9 rounded-md border px-3 text-sm"
              >
                {referralStatuses.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="partner-evidence">Private conversion evidence reference</Label>
            <Input
              id="partner-evidence"
              required={status === "converted"}
              minLength={status === "converted" ? 3 : undefined}
              maxLength={250}
              value={evidenceReference}
              onChange={(event) => {
                setEvidenceReference(event.target.value);
                setReviewed(false);
              }}
              placeholder="Verified CRM outcome, contract or payment reference"
            />
          </div>
          {status === "converted" && (
            <label className="flex items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                required
                checked={reviewed}
                onChange={(event) => setReviewed(event.target.checked)}
                className="mt-1"
              />
              <span>
                I verified that this is a genuine successful client conversion and checked the
                supporting evidence. This is not only a lead or enquiry.
              </span>
            </label>
          )}
          <Button type="submit" className="justify-self-start">
            {saving ? "Saving…" : "Save client record"}
          </Button>
        </fieldset>
      </form>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Recent private client records</h3>
        <p className="text-xs text-muted-foreground">
          Showing the latest 200 records. Ranking totals include every confirmed record.
        </p>
        {query.data?.referrals.length ? (
          query.data.referrals.map((row) => (
            <button
              key={row.id}
              type="button"
              disabled={!canEdit}
              className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-left text-xs"
              onClick={() => {
                setClientReference(row.client_reference);
                setEvidenceReference(row.evidence_reference);
                setStatus(row.status);
                setReviewed(false);
              }}
            >
              <span className="font-medium">{row.client_reference}</span>
              <span className="text-muted-foreground">{row.status} · Review record</span>
            </button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No client records yet. Nothing is counted until a conversion is confirmed.
          </p>
        )}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save({
            action: "testimonial",
            profileId,
            quote,
            publicationStatus: publication,
            consentConfirmed: consent,
          });
        }}
      >
        <fieldset disabled={!canEdit || saving} className="grid gap-4 rounded-xl border p-4">
          <legend className="px-2 font-semibold">Approved partner testimonial</legend>
          <p className="text-xs leading-6 text-muted-foreground">
            Use the partner’s exact approved words. No example quotes are published. The public
            story also requires an approved, consented and published profile.
          </p>
          <div className="grid gap-2">
            <Label htmlFor="partner-testimonial">Exact quote</Label>
            <Textarea
              id="partner-testimonial"
              minLength={20}
              maxLength={600}
              required
              rows={4}
              value={quote}
              onChange={(event) => {
                setQuote(event.target.value);
                setConsent(false);
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="partner-story-publication">Story publication</Label>
            <select
              id="partner-story-publication"
              value={publication}
              onChange={(event) => setPublication(event.target.value as typeof publication)}
              className="h-9 rounded-md border px-3 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>
          <label className="flex items-start gap-3 text-sm leading-6">
            <input
              type="checkbox"
              checked={consent}
              required={publication === "published"}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1"
            />
            <span>The partner has explicitly approved publication of this exact quote.</span>
          </label>
          <Button type="submit" className="justify-self-start">
            {saving ? "Saving…" : "Save partner story"}
          </Button>
        </fieldset>
      </form>
    </section>
  );
}
