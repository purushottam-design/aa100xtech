"use client";

import { Link } from "@/lib/navigation";
import { ArrowLeft } from "lucide-react";
import { CandidateApplicationForm } from "@/components/candidate-application-form";

const title = "Candidate Task Submission — Careers | AA100XTech";
const description =
  "Interviewing with AA100XTech? Submit your brief plan here: the task you are taking on, hours needed, availability, your cost, deliverables and your work files.";

export default CandidateApplyPage;

function CandidateApplyPage() {
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
          <CandidateApplicationForm />
        </div>
      </section>
    </div>
  );
}
