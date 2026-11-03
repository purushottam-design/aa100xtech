"use client";

import { Link } from "@/lib/navigation";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
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
import { globalCohort } from "@/data/careers";
import { submitWebsiteRequest } from "@/lib/website-requests";
import { site } from "@/data/site";

const title = "Candidate Task Submission — Careers | AA100XTech";
const description =
  "Interviewing with AA100XTech? Submit your brief plan here: the task you are taking on, hours needed, availability, your cost, deliverables and your work files.";

export default CandidateApplyPage;

function CandidateApplyPage() {
  const [submitting, setSubmitting] = useState(false);
  const openedAt = useRef(Date.now());
  const requestId = useRef<string | null>(null);
  const [role, setRole] = useState("");
  const [fileName, setFileName] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (submitting) return;
    const value = (key: string) => String(fd.get(key) ?? "").trim();
    const file = fd.get("file");
    requestId.current ??= crypto.randomUUID();
    setSubmitting(true);
    try {
      await submitWebsiteRequest(
        {
          id: requestId.current,
          startedAt: openedAt.current,
          kind: "career",
          name: value("full_name"),
          email: value("email"),
          phone: value("phone"),
          role,
          requirements: value("task_title"),
          hours: value("hours_needed"),
          availability: value("availability"),
          expectedCost: value("expected_cost"),
          portfolio: value("portfolio_url"),
          experience: value("experience"),
          message: value("deliverables"),
        },
        file instanceof File && file.size ? file : undefined,
      );
      toast.success("Your application has been saved for HR review.");
      form.reset();
      setRole("");
      setFileName("");
      requestId.current = null;
      openedAt.current = Date.now();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save your application. Please contact " + site.hrEmail,
      );
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
            to="/careers"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Careers
          </Link>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl">
            Candidate task submission
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            No interview rounds. Tell us which brief you are taking, how long it will take, when you
            can work, what you charge and exactly what you will hand over — then upload your files.
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
                <Label htmlFor="role_applied">Role you are applying for</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role_applied">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {globalCohort.roles.map((r) => (
                      <SelectItem key={r.title} value={r.title}>
                        {r.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task_title">Task / brief you are taking on *</Label>
              <Input
                id="task_title"
                name="task_title"
                required
                placeholder="e.g. Cinematic tour from 18 listing photos"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="hours_needed">Time needed</Label>
                <Input id="hours_needed" name="hours_needed" placeholder="e.g. 14 hours / 3 days" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="availability">Working hours / timezone</Label>
                <Input id="availability" name="availability" placeholder="10am–7pm IST, Mon–Sat" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expected_cost">Your cost / rate</Label>
                <Input
                  id="expected_cost"
                  name="expected_cost"
                  placeholder="₹ per task or per month"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deliverables">What exactly will you deliver? *</Label>
              <Textarea
                id="deliverables"
                name="deliverables"
                required
                rows={5}
                placeholder="List the files, formats, revisions and the day-by-day plan you will follow."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="experience">Experience</Label>
              <Textarea
                id="experience"
                name="experience"
                maxLength={1000}
                rows={3}
                placeholder="Describe your relevant experience"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="portfolio_url">Portfolio / previous work link</Label>
              <Input id="portfolio_url" name="portfolio_url" placeholder="https://" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="file">Resume / work sample (PDF, max 5 MB)</Label>
              <label
                htmlFor="file"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border/70 bg-surface-2/50 px-4 py-5 text-sm text-muted-foreground transition-colors hover:border-primary/50"
              >
                <Upload className="size-5 shrink-0 text-primary" />
                <span>{fileName || "Choose a file — video, PDF, zip, deck or image"}</span>
              </label>
              <input
                id="file"
                name="file"
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              />
              <p className="text-xs text-muted-foreground">
                Larger files? Upload to Drive or WeTransfer and paste the link in the portfolio
                field.
              </p>
            </div>

            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitting ? "Sending..." : "Submit task plan"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
