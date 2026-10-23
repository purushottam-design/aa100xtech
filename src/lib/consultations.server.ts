import { createHmac, timingSafeEqual, randomBytes } from "crypto";

type RazorpayErrorPayload = {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
    source?: string;
    step?: string;
  };
};

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status?: string;
};

function credentials() {
  const rawKeyId = (
    process.env["RAZORPAY_RUNTIME_KEY_ID"] ?? process.env["RAZORPAY_KEY_ID"]
  )?.trim();
  const rawKeySecret = (
    process.env["RAZORPAY_RUNTIME_KEY_SECRET"] ?? process.env["RAZORPAY_KEY_SECRET"]
  )?.trim();
  const keyId = rawKeyId?.match(/rzp_(?:test|live)_[A-Za-z0-9]+/)?.[0];
  const keySecret = normalizeSecretValue(rawKeySecret, "RAZORPAY_(?:RUNTIME_)?KEY_SECRET");
  const keyPrefix = keyId?.startsWith("rzp_live_")
    ? "rzp_live_"
    : keyId?.startsWith("rzp_test_")
      ? "rzp_test_"
      : "unknown";
  console.info("Razorpay runtime configuration", {
    keyIdExists: Boolean(keyId),
    keySecretExists: Boolean(keySecret),
    keyPrefix,
    environment:
      keyPrefix === "rzp_live_" ? "live" : keyPrefix === "rzp_test_" ? "test" : "unknown",
    clientInitialized: Boolean(keyId && keySecret),
  });
  if (!keyId || !keySecret) {
    console.error("Razorpay configuration missing", {
      keyIdConfigured: Boolean(keyId),
      keySecretConfigured: Boolean(keySecret),
    });
    return { ok: false as const, code: "CONFIGURATION_MISSING" as const };
  }
  if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId)) {
    console.error("Razorpay configuration invalid", { reason: "Unexpected key ID format" });
    return { ok: false as const, code: "CONFIGURATION_INVALID" as const };
  }
  const configuredCurrency = process.env["RAZORPAY_CURRENCY"]?.trim().toUpperCase() || "INR";
  if (configuredCurrency !== "INR") {
    console.error("Razorpay configuration invalid", { reason: "Currency must be INR" });
    return { ok: false as const, code: "CONFIGURATION_INVALID" as const };
  }
  return { ok: true as const, keyId, keySecret, currency: "INR" as const };
}

function normalizeSecretValue(value: string | undefined, variableName: string) {
  if (!value) return undefined;
  const assignment = new RegExp(`^${variableName}\\s*[:=]\\s*(.+)$`).exec(value);
  return (assignment?.[1] ?? value).trim().replace(/^['"]|['"]$/g, "");
}

export function generateBookingId() {
  return `CONS-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export async function createRazorpayOrder(input: {
  amountInPaise: number;
  receipt: string;
  notes: Record<string, string>;
}) {
  const config = credentials();
  if (!config.ok) {
    return {
      ok: false as const,
      code: config.code,
      message: "Online payment is not configured. Please contact us for assistance.",
    };
  }

  let res: Response;
  try {
    res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: input.amountInPaise,
        currency: config.currency,
        receipt: input.receipt,
        notes: input.notes,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error("Razorpay order request failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return {
      ok: false as const,
      code: "GATEWAY_UNAVAILABLE" as const,
      message: "Could not connect to the payment gateway. Please try again.",
    };
  }

  if (!res.ok) {
    const payload = await readRazorpayError(res);
    console.error("Razorpay order creation failed", {
      httpStatus: res.status,
      requestId: res.headers.get("x-request-id") ?? undefined,
      code: payload.error?.code,
      description: payload.error?.description,
      reason: payload.error?.reason,
      source: payload.error?.source,
      step: payload.error?.step,
    });
    return res.status === 401
      ? {
          ok: false as const,
          code: "INVALID_CREDENTIALS" as const,
          message:
            "Online payment is temporarily unavailable. Please contact us or try again later.",
        }
      : {
          ok: false as const,
          code: "GATEWAY_UNAVAILABLE" as const,
          message: "Could not start the payment. Please try again.",
        };
  }

  const order = (await res.json()) as RazorpayOrder;
  if (
    !order.id?.startsWith("order_") ||
    order.amount !== input.amountInPaise ||
    order.currency !== config.currency
  ) {
    console.error("Razorpay returned an invalid order response", {
      hasOrderId: Boolean(order.id),
      amountMatches: order.amount === input.amountInPaise,
      currencyMatches: order.currency === config.currency,
    });
    return {
      ok: false as const,
      code: "INVALID_GATEWAY_RESPONSE" as const,
      message: "Could not validate the payment order. Please try again.",
    };
  }
  return { ok: true as const, ...order, keyId: config.keyId };
}

export function verifyRazorpaySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const config = credentials();
  if (!config.ok) return false;
  const expected = createHmac("sha256", config.keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(input.signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function fetchRazorpayPayment(paymentId: string) {
  const config = credentials();
  if (!config.ok) throw new Error("Payment gateway configuration is unavailable.");
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: {
      accept: "application/json",
      authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const payload = await readRazorpayError(res);
    console.error("Razorpay payment fetch failed", {
      httpStatus: res.status,
      requestId: res.headers.get("x-request-id") ?? undefined,
      code: payload.error?.code,
      description: payload.error?.description,
    });
    throw new Error("Could not confirm the payment. Please contact support.");
  }
  return (await res.json()) as {
    id: string;
    order_id: string;
    status: string;
    amount: number;
    currency: string;
  };
}

async function readRazorpayError(response: Response): Promise<RazorpayErrorPayload> {
  try {
    return (await response.json()) as RazorpayErrorPayload;
  } catch {
    return {};
  }
}
