"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminNav } from "@/components/admin-nav";
import { useMyAccess } from "@/components/admin-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { listInfluencerApplications, saveInfluencer } from "@/lib/influencers.functions";
import { InfluencerProgramManagement } from "@/components/influencer-program-management";
import {
  influencerCategories,
  maxImageBytes,
  mediaUrl,
  reviewStatuses,
  type InfluencerApplication,
  type InfluencerProfile,
} from "@/lib/influencers";

function PrivateImage({ path }: { path: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true;
    let blobUrl = "";
    void (async () => {
      const headers = await attachSupabaseAuth();
      const res = await fetch(mediaUrl(path)!, { headers, cache: "no-store" });
      if (!res.ok) return;
      const blob = await res.blob();
      if (active) {
        blobUrl = URL.createObjectURL(blob);
        setSrc(blobUrl);
      }
    })().catch(() => undefined);
    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [path]);
  return src ? (
    <img
      src={src}
      alt="Private application upload for review"
      className="h-32 w-full rounded-lg object-cover"
    />
  ) : (
    <div className="flex h-32 items-center justify-center rounded-lg bg-secondary text-xs text-muted-foreground">
      Image preview unavailable
    </div>
  );
}
export function InfluencerManagement() {
  const access = useMyAccess();
  const view = !!(access.data?.isSuper || access.data?.permissions.includes("partners.view"));
  const edit = !!(access.data?.isSuper || access.data?.permissions.includes("partners.review"));
  const query = useQuery({
    queryKey: ["influencer-applications"],
    queryFn: () => listInfluencerApplications(),
    enabled: view,
    retry: false,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState("");
  const rows = query.data ?? [];
  const current = rows.find((r) => r.id === selected);
  const filtered = rows.filter(
    (r) =>
      `${r.full_name} ${r.email} ${r.influencer_data?.display_name ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!status || r.influencer_review_status === status),
  );
  if (access.isLoading) return <p className="p-10">Checking access…</p>;
  if (!view)
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-4">You need permission to view partner applications.</p>
      </div>
    );
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Marketing & partnerships</p>
          <h1 className="mt-3 text-3xl font-bold">Influencer Management</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Review applications, curate public profiles and manage publication separately.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/influencers">View public program</Link>
        </Button>
      </div>
      <AdminNav className="mt-6" />
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {reviewStatuses.map((s) => (
          <div key={s} className="surface-card p-4">
            <p className="text-xs capitalize text-muted-foreground">{s.replace("_", " ")}</p>
            <p className="mt-2 text-3xl font-semibold">
              {rows.filter((r) => r.influencer_review_status === s).length}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Input
          aria-label="Search applications"
          placeholder="Search creator name or private email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <select
          aria-label="Filter application status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All application statuses</option>
          {reviewStatuses.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Refresh
        </Button>
      </div>
      {query.isLoading && <p className="mt-8">Loading applications…</p>}
      {query.error && (
        <p role="alert" className="mt-8 text-destructive">
          {query.error.message}
        </p>
      )}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[0.65fr_1.35fr]">
        <div className="space-y-3">
          {filtered.map((row) => (
            <button
              key={row.id}
              onClick={() => setSelected(row.id)}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${selected === row.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}
            >
              <p className="font-semibold">{row.influencer_data?.display_name || row.full_name}</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">{row.email}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <span className="capitalize text-primary">
                  {row.influencer_review_status.replace("_", " ")}
                </span>
                <span className="capitalize">
                  {row.profile?.publication_status ?? "No public profile"}
                </span>
              </div>
            </button>
          ))}
          {!query.isLoading && !query.error && !filtered.length && (
            <p className="surface-card p-6 text-sm text-muted-foreground">
              No applications match this view.
            </p>
          )}
        </div>
        <div>
          {current ? (
            <>
              <ApplicationEditor
                key={`${current.id}:${current.profile?.updated_at}:${current.influencer_review_status}`}
                application={current}
                canEdit={edit}
              />
              {current.profile && (
                <InfluencerProgramManagement
                  key={current.profile.id}
                  profileId={current.profile.id}
                  canEdit={edit}
                />
              )}
            </>
          ) : (
            <div className="surface-card p-8 text-sm text-muted-foreground">
              Select an application to review its private details and public profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function ApplicationEditor({
  application: a,
  canEdit,
}: {
  application: InfluencerApplication;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(a.influencer_review_status);
  const [profile, setProfile] = useState<InfluencerProfile | null>(a.profile);
  const [note, setNote] = useState(a.review_note ?? "");
  const [request, setRequest] = useState(a.information_request ?? "");
  const [type, setType] = useState(a.partnership_type ?? "");
  const [progress, setProgress] = useState(a.collaboration_progress ?? "");
  const [uploading, setUploading] = useState(false);
  const d = a.influencer_data;
  const save = useMutation({
    mutationFn: (revokeConsent: boolean) =>
      saveInfluencer({
        data: {
          applicationId: a.id,
          status,
          profile,
          review_note: note,
          information_request: request,
          partnership_type: type,
          collaboration_progress: progress,
          revokeConsent,
        },
      }),
    onSuccess: async () => {
      toast.success("Application and profile saved");
      await queryClient.invalidateQueries({ queryKey: ["influencer-applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  async function upload(
    file: File | undefined,
    field: "profile_image" | "cover_image" | "gallery",
  ) {
    if (!file || !profile) return;
    if (
      file.size > maxImageBytes ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      toast.error("Choose a JPG, PNG or WebP image up to 3 MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("applicationId", a.id);
      fd.set("file", file);
      const headers = await attachSupabaseAuth();
      headers.set("x-aa-rpc", "1");
      const res = await fetch("/api/influencers/upload", { method: "POST", headers, body: fd });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setProfile((p) =>
        p
          ? {
              ...p,
              [field]: field === "gallery" ? [...p.gallery, result.path].slice(0, 6) : result.path,
            }
          : p,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }
  const media = [
    ...new Set(
      [
        d?.profile_image,
        d?.cover_image,
        ...(d?.gallery ?? []),
        profile?.profile_image,
        profile?.cover_image,
        ...(profile?.gallery ?? []),
      ].filter((path): path is string => !!path),
    ),
  ];
  return (
    <form
      className="surface-card min-w-0 space-y-7 p-5 sm:p-7"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        save.mutate(false);
      }}
    >
      <h2 className="text-2xl font-semibold">{d?.display_name || a.full_name}</h2>
      <p className="text-xs text-muted-foreground">
        Submitted {new Date(a.created_at).toLocaleDateString()} · Private application details
      </p>
      <div className="grid gap-3 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-2">
        <p>
          <strong>Full name:</strong> {a.full_name}
        </p>
        <p className="break-all">
          <strong>Email:</strong> {a.email}
        </p>
        <p>
          <strong>Phone:</strong> {a.phone || "Not supplied"}
        </p>
        <p>
          <strong>Location:</strong> {d?.city}, {d?.state}, {d?.country}
        </p>
        <p>
          <strong>Development interest:</strong> {d?.interest || "Not recorded"}
        </p>
        <p>
          <strong>Audience:</strong> {d?.audience_location || "Not recorded"}
        </p>
        <p className="sm:col-span-2 whitespace-pre-line">
          <strong>Proposed deliverables:</strong> {d?.deliverables || "See original application"}
        </p>
        <p className="sm:col-span-2 whitespace-pre-line">
          <strong>Private terms:</strong> {d?.expected_terms || "Not recorded"}
        </p>
        <p className="sm:col-span-2 whitespace-pre-line">
          <strong>Previous collaborations:</strong> {d?.previous_collaborations || "Not supplied"}
        </p>
      </div>
      {d?.biography && (
        <section className="space-y-3 text-sm">
          <h3 className="font-semibold">Submitted biography & content</h3>
          <p className="whitespace-pre-line leading-7 text-muted-foreground">{d.biography}</p>
          <p>
            {d.category} · {d.specialization}
          </p>
          {d.portfolio_url && (
            <a
              href={d.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block break-all text-primary underline"
            >
              Submitted portfolio
            </a>
          )}
          {d.video_urls?.map((url, index) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block break-all text-primary underline"
            >
              Submitted promotional content {index + 1}
            </a>
          ))}
        </section>
      )}
      {d?.socials && (
        <section className="space-y-2 text-sm">
          <h3 className="font-semibold">Submitted social profiles</h3>
          {Object.entries(d.socials)
            .filter(
              ([key, value]) =>
                !key.endsWith("followers") &&
                typeof value === "string" &&
                value.startsWith("https://"),
            )
            .map(([key, value]) => (
              <a
                key={key}
                href={String(value)}
                target="_blank"
                rel="noopener noreferrer"
                className="block break-all text-primary underline"
              >
                {key}: {String(value)}
              </a>
            ))}
        </section>
      )}
      {!profile && media.length > 0 && (
        <section>
          <h3 className="mb-4 font-semibold">Submitted images (private review)</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {media.map((path) => (
              <PrivateImage key={path} path={path} />
            ))}
          </div>
        </section>
      )}
      <p
        className={`rounded-xl border p-4 text-sm ${a.publication_consent ? "border-primary/30 bg-primary/5" : "border-destructive/40 bg-destructive/5"}`}
      >
        Recorded applicant publication consent:{" "}
        <strong>{a.publication_consent ? "Yes" : "No — publication is blocked"}</strong>. Processing
        consent: {a.processing_consent ? "Yes" : "Not recorded"}. Only the applicant can give
        publication consent; this editor cannot grant it on their behalf.
      </p>
      <fieldset
        disabled={!canEdit || save.isPending || uploading}
        className="space-y-5 disabled:opacity-70"
      >
        <div className="grid gap-2">
          <Label htmlFor="review-status">Application status</Label>
          <select
            id="review-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="h-10 rounded-md border border-input bg-background px-3"
          >
            {reviewStatuses.map((s) => (
              <option value={s} key={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="review-note">Private review note</Label>
          <Textarea
            id="review-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="information-request">Request additional information</Label>
          <Textarea
            id="information-request"
            value={request}
            onChange={(e) => {
              setRequest(e.target.value);
              if (e.target.value) setStatus("under_review");
            }}
            maxLength={2000}
            placeholder="Record the information you need, save, then contact the applicant below."
          />
          <a
            href={`mailto:${encodeURIComponent(a.email)}?subject=${encodeURIComponent("Your AA100X TECH influencer application")}&body=${encodeURIComponent(request)}`}
            className="text-sm text-primary underline"
          >
            Open email to applicant (send after saving)
          </a>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="partnership-type">Private partnership type</Label>
          <Input
            id="partnership-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            maxLength={250}
            placeholder="Website development / app development / paid campaign"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="collaboration-progress">Private collaboration progress</Label>
          <Textarea
            id="collaboration-progress"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            maxLength={2000}
          />
        </div>
        {!profile && (
          <div className="rounded-xl border border-border p-5 text-sm text-muted-foreground">
            Approve and save this application to create its public profile as a draft. Existing
            applications without recorded consent can be reviewed, but cannot be published.
          </div>
        )}
        {profile && (
          <section className="space-y-5 border-t border-border pt-6">
            <h3 className="text-xl font-semibold">Approved public profile</h3>
            <p className="text-sm text-muted-foreground">
              Only these curated fields appear publicly. Review every field and image for private
              information before publishing.
            </p>
            {(
              [
                ["display_name", "Creator name"],
                ["slug", "Unique profile slug"],
                ["city", "City only"],
                ["state", "State only"],
                ["specialization", "Content specialization"],
                ["portfolio_url", "Portfolio URL"],
              ] as const
            ).map(([key, label]) => (
              <div className="grid gap-2" key={key}>
                <Label htmlFor={`public-${key}`}>{label}</Label>
                <Input
                  id={`public-${key}`}
                  value={profile[key]}
                  onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="grid gap-2">
              <Label htmlFor="public-category">Category</Label>
              <select
                id="public-category"
                value={profile.category}
                onChange={(e) =>
                  setProfile({ ...profile, category: e.target.value as typeof profile.category })
                }
                className="h-10 rounded-md border border-input bg-background px-3"
              >
                {influencerCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            {(
              [
                ["biography", "Public biography"],
                ["journey", "Creator journey"],
                ["achievements", "Public achievements"],
                ["collaboration_intro", "Collaboration introduction"],
                ["partnership_description", "Approved partnership description"],
              ] as const
            ).map(([key, label]) => (
              <div className="grid gap-2" key={key}>
                <Label htmlFor={`public-${key}`}>{label}</Label>
                <Textarea
                  id={`public-${key}`}
                  value={profile[key]}
                  onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                />
              </div>
            ))}
            {(["instagram", "youtube", "facebook"] as const).map((platform) => (
              <div key={platform} className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor={`public-${platform}`}>{platform} URL</Label>
                  <Input
                    id={`public-${platform}`}
                    type="url"
                    value={profile.socials[platform]}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        socials: { ...profile.socials, [platform]: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`public-${platform}-count`}>{platform} audience count</Label>
                  <Input
                    id={`public-${platform}-count`}
                    type="number"
                    min={0}
                    step={1}
                    value={profile.socials[`${platform}_followers`] ?? ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        socials: {
                          ...profile.socials,
                          [`${platform}_followers`]:
                            e.target.value === "" ? null : Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            ))}
            <div className="grid gap-2">
              <Label htmlFor="public-other">Other public social URLs (one per line)</Label>
              <Textarea
                id="public-other"
                value={profile.socials.other.join("\n")}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socials: {
                      ...profile.socials,
                      other: e.target.value.split("\n").filter(Boolean),
                    },
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="public-videos">Approved video/content URLs (one per line)</Label>
              <Textarea
                id="public-videos"
                value={profile.video_urls.join("\n")}
                onChange={(e) =>
                  setProfile({ ...profile, video_urls: e.target.value.split("\n").filter(Boolean) })
                }
              />
            </div>
            <h4 className="font-semibold">Review and select public images</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {media.map((path) => (
                <div key={path} className="space-y-2 rounded-xl border border-border p-3">
                  <PrivateImage path={path} />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={profile.profile_image === path ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProfile({ ...profile, profile_image: path })}
                    >
                      Profile
                    </Button>
                    <Button
                      type="button"
                      variant={profile.cover_image === path ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProfile({ ...profile, cover_image: path })}
                    >
                      Cover
                    </Button>
                    <Button
                      type="button"
                      variant={profile.gallery.includes(path) ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setProfile({
                          ...profile,
                          gallery: profile.gallery.includes(path)
                            ? profile.gallery.filter((p) => p !== path)
                            : [...profile.gallery, path].slice(0, 6),
                        })
                      }
                    >
                      Gallery
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setProfile({ ...profile, profile_image: null })}
              >
                Clear profile image
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setProfile({ ...profile, cover_image: null })}
              >
                Clear cover image
              </Button>
            </div>
            {(["profile_image", "cover_image", "gallery"] as const).map((field) => (
              <div key={field} className="grid gap-2">
                <Label htmlFor={`upload-${field}`}>
                  Upload {field.replace("_", " ")} (JPG / PNG / WebP, max 3 MB)
                </Label>
                <Input
                  id={`upload-${field}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => void upload(e.target.files?.[0], field)}
                />
              </div>
            ))}
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={profile.consent_confirmed}
                disabled={!a.publication_consent}
                onChange={(e) => setProfile({ ...profile, consent_confirmed: e.target.checked })}
              />
              <span>
                I verified the applicant’s recorded consent and reviewed all public fields and
                media.
              </span>
            </label>
            <div className="grid gap-2">
              <Label htmlFor="publication-status">
                Publication status (separate from approval)
              </Label>
              <select
                id="publication-status"
                value={profile.publication_status}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    publication_status: e.target.value as typeof profile.publication_status,
                  })
                }
                className="h-10 rounded-md border border-input bg-background px-3"
              >
                <option value="draft">Draft</option>
                <option
                  value="published"
                  disabled={
                    status !== "approved" || !a.publication_consent || !profile.consent_confirmed
                  }
                >
                  Published
                </option>
                <option value="unpublished">Unpublished</option>
              </select>
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={profile.featured}
                onChange={(e) => setProfile({ ...profile, featured: e.target.checked })}
              />
              <span>Feature this partner on the program page and homepage when published</span>
            </label>
            {profile.publication_status === "published" && (
              <Link
                href={`/influencers/${profile.slug}`}
                target="_blank"
                className="block text-sm text-primary underline"
              >
                View public profile
              </Link>
            )}
          </section>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit">{save.isPending ? "Saving…" : "Save application & profile"}</Button>
          {a.publication_consent && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (
                  window.confirm(
                    "Record withdrawal of publication consent? The public profile and its images will become unavailable.",
                  )
                )
                  save.mutate(true);
              }}
            >
              Record consent withdrawal
            </Button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
