"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Link } from "@/lib/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentGatewaySelector } from "@/components/payment-gateway-selector";
import { defaultPaymentGateway, type PaymentGateway } from "@/lib/payment-gateways";
import { Textarea } from "@/components/ui/textarea";
import {
  consultationPlans,
  consultationServices,
  getConsultationPlan,
  meetingPlatforms,
  timeZones,
  type ConsultationPlan,
} from "@/data/consultations";
import {
  createConsultationBooking,
  markConsultationPaymentFailed,
  verifyConsultationPayment,
} from "@/lib/consultations.functions";

type Step = "plans" | "details" | "summary" | "success" | "failed" | "cancelled" | "pending";
type PaymentVerification = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type BookingForm = {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  country: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  timezone: string;
  meetingPlatform: string;
  projectDescription: string;
};

type OrderInfo = {
  bookingId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

const emptyForm = (): BookingForm => ({
  fullName: "",
  companyName: "",
  email: "",
  phone: "",
  country: "India",
  service: "",
  preferredDate: "",
  preferredTime: "",
  timezone:
    (typeof Intl !== "undefined" && Intl.DateTimeFormat().resolvedOptions().timeZone) ||
    "Asia/Calcutta",
  meetingPlatform: "Google Meet",
  projectDescription: "",
});

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

type Ctx = { open: (planId?: string) => void };
const ConsultationContext = createContext<Ctx | null>(null);

export function useConsultationBooking() {
  const ctx = useContext(ConsultationContext);
  if (!ctx) throw new Error("useConsultationBooking must be used inside ConsultationProvider");
  return ctx;
}

let razorpayPromise: Promise<boolean> | null = null;
function loadRazorpay() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) return Promise.resolve(true);
  if (!razorpayPromise) {
    razorpayPromise = new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => {
        razorpayPromise = null;
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }
  return razorpayPromise;
}

export function ConsultationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("plans");
  const [planId, setPlanId] = useState<string | null>(null);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof BookingForm, string>>>({});
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>(defaultPaymentGateway);
  const [pendingVerification, setPendingVerification] = useState<PaymentVerification | null>(null);

  const plan = planId ? (getConsultationPlan(planId) ?? null) : null;

  const open = useCallback((id?: string) => {
    setIsOpen(true);
    if (id) {
      setPlanId(id);
      setStep("details");
    } else {
      setStep("plans");
    }
  }, []);

  const value = useMemo<Ctx>(() => ({ open }), [open]);

  const reset = () => {
    setPaymentGateway(defaultPaymentGateway);
    setPendingVerification(null);
    setStep("plans");
    setPlanId(null);
    setOrder(null);
    setPaymentId(null);
    setErrors({});
  };

  const validate = () => {
    const e: Partial<Record<keyof BookingForm, string>> = {};
    if (form.fullName.trim().length < 2) e.fullName = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      e.email = "Enter a valid email address.";
    if (!/^[+\d][\d\s()-]{5,19}$/.test(form.phone.trim()))
      e.phone = "Enter a valid phone number with country code.";
    if (form.country.trim().length < 2) e.country = "Country is required.";
    if (!form.service) e.service = "Select the service you need.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.preferredDate)) e.preferredDate = "Pick a date.";
    else if (new Date(`${form.preferredDate}T23:59:59`) < new Date())
      e.preferredDate = "Pick a future date.";
    if (!/^\d{2}:\d{2}$/.test(form.preferredTime)) e.preferredTime = "Pick a time.";
    if (!form.timezone) e.timezone = "Time zone is required.";
    if (!form.meetingPlatform) e.meetingPlatform = "Select a meeting platform.";
    if (form.projectDescription.trim().length < 10)
      e.projectDescription = "Tell us a bit more (min 10 characters).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const proceedToPayment = async () => {
    if (!plan || creating) return;
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setCreating(true);
    try {
      const res = await createConsultationBooking({
        data: {
          planId: plan.id,
          fullName: form.fullName.trim(),
          companyName: form.companyName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          country: form.country.trim(),
          service: form.service,
          preferredDate: form.preferredDate,
          preferredTime: form.preferredTime,
          timezone: form.timezone,
          meetingPlatform: form.meetingPlatform,
          projectDescription: form.projectDescription.trim(),
        },
      });
      if (!res.ok) {
        if (process.env.NODE_ENV === "development") {
          console.error("Razorpay order creation failed", { code: res.code, message: res.error });
        }
        toast.error(res.error);
        return;
      }
      setOrder({
        bookingId: res.bookingId,
        orderId: res.orderId,
        amount: res.amount,
        currency: res.currency,
        keyId: res.keyId,
      });
      setStep("summary");
    } catch (err) {
      if (process.env.NODE_ENV === "development") console.error("Consultation payment initialization failed", err);
      toast.error(err instanceof Error ? err.message : "Could not start the payment.");
    } finally {
      setCreating(false);
    }
  };

  const confirmPayment = async (response: PaymentVerification) => {
    if (!order) return;
    setPaying(true);
    setPendingVerification(response);
    try {
      const result = await verifyConsultationPayment({
        data: {
          bookingId: order.bookingId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        },
      });
      setPaymentId(result.paymentId ?? response.razorpay_payment_id);
      setStep(
        result.status === "pending" ? "pending" : result.status === "failed" ? "failed" : "success",
      );
      if (result.status === "paid") setPendingVerification(null);
    } catch (error) {
      if (process.env.NODE_ENV === "development")
        console.error("Razorpay payment verification failed", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Payment verification is pending. Please check again.",
      );
      setStep("pending");
    } finally {
      setPaying(false);
    }
  };

  const payNow = async () => {
    if (!order || !plan || paying) return;
    if (paymentGateway !== "razorpay") {
      toast.error("ICICI Bank payments are currently unavailable. Please choose Razorpay.");
      return;
    }
    setPaying(true);
    const ok = await loadRazorpay();
    if (!ok) {
      setPaying(false);
      if (process.env.NODE_ENV === "development") console.error("Razorpay Checkout SDK failed to load");
      toast.error("Could not load the secure checkout. Check your connection and try again.");
      return;
    }

    const RazorpayCtor = (
      window as unknown as {
        Razorpay?: new (o: unknown) => {
          open: () => void;
          on: (e: string, cb: (r: unknown) => void) => void;
        };
      }
    ).Razorpay;
    if (!RazorpayCtor) {
      setPaying(false);
      if (process.env.NODE_ENV === "development")
        console.error("Razorpay Checkout SDK loaded without window.Razorpay");
      toast.error("Secure checkout could not be initialized. Please try again.");
      return;
    }

    const rzp = new RazorpayCtor({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "AA100XTech",
      description: `${plan.name} · ${plan.duration}`,
      prefill: { name: form.fullName, email: form.email, contact: form.phone },
      notes: { booking_id: order.bookingId },
      theme: { color: "#e0912f" },
      modal: {
        ondismiss: () => {
          setPaying(false);
          setStep("cancelled");
        },
      },
      handler: confirmPayment,
    });

    rzp.on("payment.failed", async () => {
      setPaying(false);
      setStep("failed");
      try {
        await markConsultationPaymentFailed({ data: { bookingId: order.bookingId } });
      } catch {
        /* non-blocking */
      }
    });

    rzp.open();
  };

  const setField = (key: keyof BookingForm, v: string) => {
    setForm((f) => ({ ...f, [key]: v }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  return (
    <ConsultationContext.Provider value={value}>
      {children}
      <FloatingButton />

      <Dialog
        open={isOpen}
        onOpenChange={(next) => {
          setIsOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl overflow-y-auto">
          {step === "plans" ? (
            <PlansStep
              onSelect={(p) => {
                setPlanId(p.id);
                setStep("details");
              }}
            />
          ) : null}

          {step === "details" && plan ? (
            <div>
              <DialogTitle className="font-display text-2xl">Booking Details</DialogTitle>
              <DialogDescription>
                Selected plan:{" "}
                <span className="font-medium text-foreground">
                  {plan.name} · {plan.duration} · {inr(plan.price)}
                </span>
              </DialogDescription>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" required error={errors.fullName}>
                  <Input
                    value={form.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                    placeholder="Your name"
                  />
                </Field>
                <Field label="Company Name" error={undefined}>
                  <Input
                    value={form.companyName}
                    onChange={(e) => setField("companyName", e.target.value)}
                    placeholder="Optional"
                  />
                </Field>
                <Field label="Email Address" required error={errors.email}>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="you@company.com"
                  />
                </Field>
                <Field label="Phone Number" required error={errors.phone}>
                  <Input
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="+91 90000 00000"
                  />
                </Field>
                <Field label="Country" required error={errors.country}>
                  <Input
                    value={form.country}
                    onChange={(e) => setField("country", e.target.value)}
                  />
                </Field>
                <Field label="Service Required" required error={errors.service}>
                  <NativeSelect
                    value={form.service}
                    onChange={(v) => setField("service", v)}
                    options={consultationServices}
                    placeholder="Select a service"
                  />
                </Field>
                <Field label="Selected Consultation Plan">
                  <Input readOnly value={`${plan.name} · ${inr(plan.price)}`} />
                </Field>
                <Field label="Consultation Duration">
                  <Input readOnly value={plan.duration} />
                </Field>
                <Field label="Preferred Date" required error={errors.preferredDate}>
                  <Input
                    type="date"
                    value={form.preferredDate}
                    onChange={(e) => setField("preferredDate", e.target.value)}
                    className="date-input-white-icon"
                  />
                </Field>
                <Field label="Preferred Time" required error={errors.preferredTime}>
                  <Input
                    type="time"
                    value={form.preferredTime}
                    onChange={(e) => setField("preferredTime", e.target.value)}
                    className="time-input-white-icon"
                  />
                </Field>
                <Field label="Time Zone" required error={errors.timezone}>
                  <NativeSelect
                    value={form.timezone}
                    onChange={(v) => setField("timezone", v)}
                    options={Array.from(new Set([form.timezone, ...timeZones]))}
                  />
                </Field>
                <Field label="Meeting Platform" required error={errors.meetingPlatform}>
                  <NativeSelect
                    value={form.meetingPlatform}
                    onChange={(v) => setField("meetingPlatform", v)}
                    options={meetingPlatforms}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Project Description" required error={errors.projectDescription}>
                    <Textarea
                      rows={5}
                      value={form.projectDescription}
                      onChange={(e) => setField("projectDescription", e.target.value)}
                      placeholder="Share goals, challenges, timeline, and what you want from this consultation..."
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setStep("plans")} disabled={creating}>
                  Change Plan
                </Button>
                <Button onClick={proceedToPayment} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Creating Secure Payment...
                    </>
                  ) : (
                    <>
                      Proceed to Payment <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}

          {step === "summary" && plan && order ? (
            <div>
              <div className="flex flex-col items-center text-center">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <CreditCard className="size-6" />
                </span>
                <DialogTitle className="mt-4 font-display text-2xl">Proceed to Payment</DialogTitle>
                <DialogDescription>
                  Booking ID: <span className="font-mono text-foreground">{order.bookingId}</span>
                </DialogDescription>
              </div>

              <dl className="surface-card mt-6 space-y-3 p-5 text-sm">
                <Row label="Plan" value={plan.name} />
                <Row label="Duration" value={plan.duration} />
                <Row label="Amount" value={inr(plan.price)} />
                <Row
                  label="Schedule"
                  value={`${form.preferredDate} · ${form.preferredTime} (${form.timezone})`}
                />
                <Row label="Platform" value={form.meetingPlatform} />
              </dl>

              <PaymentGatewaySelector
                selected={paymentGateway}
                onChange={setPaymentGateway}
                amount={order.amount}
                disabled={paying}
              />

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setStep("details")} disabled={paying}>
                  Back
                </Button>
                <Button onClick={payNow} disabled={paying}>
                  {paying ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Opening Secure Checkout...
                    </>
                  ) : (
                    <>
                      Pay with Razorpay {inr(plan.price)} <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}

          {step === "success" && plan && order ? (
            <div className="text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-signal/15 text-signal">
                <Check className="size-6" />
              </span>
              <DialogTitle className="mt-4 font-display text-2xl">Payment Successful</DialogTitle>
              <DialogDescription>Your consultation has been booked successfully.</DialogDescription>
              <dl className="surface-card mt-6 space-y-3 p-5 text-left text-sm">
                <Row label="Booking ID" value={order.bookingId} />
                <Row label="Payment ID" value={paymentId ?? "—"} />
                <Row label="Plan" value={plan.name} />
                <Row label="Duration" value={plan.duration} />
                <Row label="Amount" value={inr(plan.price)} />
                <Row label="Date" value={form.preferredDate} />
                <Row label="Time" value={`${form.preferredTime} (${form.timezone})`} />
                <Row label="Meeting Platform" value={form.meetingPlatform} />
              </dl>
              <Button
                className="mt-6 w-full sm:w-auto"
                onClick={() => {
                  setIsOpen(false);
                  reset();
                }}
              >
                Done
              </Button>
            </div>
          ) : null}

          {step === "pending" && order ? (
            <div className="text-center">
              <DialogTitle className="font-display text-2xl">Payment Pending</DialogTitle>
              <DialogDescription className="mt-3">
                We’re waiting for confirmed payment status. Check this payment before attempting
                another one.
              </DialogDescription>
              <dl className="surface-card mt-6 space-y-3 p-5 text-left text-sm">
                <Row label="Booking ID" value={order.bookingId} />
                <Row label="Payment ID" value={pendingVerification?.razorpay_payment_id ?? "—"} />
              </dl>
              <Button
                className="mt-6"
                disabled={paying || !pendingVerification}
                onClick={() => {
                  if (pendingVerification) void confirmPayment(pendingVerification);
                }}
              >
                {paying ? "Checking payment…" : "Check payment status"}
              </Button>
            </div>
          ) : null}

          {step === "failed" && plan && order ? (
            <div className="text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <XCircle className="size-6" />
              </span>
              <DialogTitle className="mt-4 font-display text-2xl">Payment Failed</DialogTitle>
              <DialogDescription>Your payment could not be completed.</DialogDescription>
              <dl className="surface-card mt-6 space-y-3 p-5 text-left text-sm">
                <Row label="Booking ID" value={order.bookingId} />
                <Row label="Plan" value={plan.name} />
                <Row label="Amount" value={inr(plan.price)} />
              </dl>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                <Button variant="outline" onClick={() => setStep("plans")}>
                  Change Plan
                </Button>
                <Button onClick={() => setStep("summary")}>Try Again</Button>
              </div>
            </div>
          ) : null}

          {step === "cancelled" && order ? (
            <div className="text-center">
              <DialogTitle className="font-display text-2xl">Payment Cancelled</DialogTitle>
              <DialogDescription>
                Your booking {order.bookingId} is saved — you can complete the payment now.
              </DialogDescription>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                <Button variant="outline" onClick={() => setStep("details")}>
                  Edit Details
                </Button>
                <Button onClick={() => setStep("summary")}>Try Payment Again</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </ConsultationContext.Provider>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {required ? <span className="text-primary">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {placeholder ? (
        <option value="" className="text-black">
          {placeholder}
        </option>
      ) : null}
      {options.map((o) => (
        <option key={o} value={o} className="text-black">
          {o}
        </option>
      ))}
    </select>
  );
}

function PlansStep({ onSelect }: { onSelect: (p: ConsultationPlan) => void }) {
  const standard = consultationPlans.filter((p) => p.category === "standard");
  const premium = consultationPlans.filter((p) => p.category === "premium");

  return (
    <div>
      <DialogTitle className="font-display text-2xl">Book a Consultation</DialogTitle>
      <DialogDescription>
        Pick a session length that fits the depth of guidance you need.
      </DialogDescription>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {standard.map((p) => (
          <PlanCard key={p.id} plan={p} onSelect={onSelect} />
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-primary/30 bg-surface-2/60 p-5">
        <h3 className="font-display text-xl font-bold">Enterprise-Level Strategic Consultation</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Designed for businesses, startups, enterprises, investors, and organizations looking for
          in-depth planning and senior-level technical consultation.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {premium.map((p) => (
            <PlanCard key={p.id} plan={p} onSelect={onSelect} premium />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  onSelect,
  premium,
}: {
  plan: ConsultationPlan;
  onSelect: (p: ConsultationPlan) => void;
  premium?: boolean;
}) {
  return (
    <div
      className={`surface-card relative flex flex-col p-5 ${
        plan.featured ? "border-primary/50 glow-ring" : ""
      } ${premium ? "bg-background/60" : ""}`}
    >
      {plan.badge ? (
        <Badge className="absolute -top-2.5 left-4 text-[10px]">{plan.badge}</Badge>
      ) : null}
      <h4 className="font-display text-lg font-semibold">{plan.name}</h4>
      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{plan.duration}</p>
      <p className="mt-3 font-display text-2xl font-bold text-primary">
        ₹{plan.price.toLocaleString("en-IN")}
      </p>
      <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-signal" />
            {f}
          </li>
        ))}
      </ul>
      <Button
        className="mt-5"
        variant={plan.featured ? "default" : "outline"}
        onClick={() => onSelect(plan)}
      >
        {plan.buttonLabel} <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

function FloatingButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Link
      to="/consultation"
      aria-label="Book Consultation"
      className="fixed bottom-5 left-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:bottom-8 sm:left-6"
    >
      <CalendarDays className="size-4" />
      <span className="hidden xs:inline sm:inline">Book Consultation</span>
    </Link>
  );
}
