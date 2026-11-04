import "server-only";
import type { IciciOriginDiagnostics } from "./icici-origin.server";
import {
  signSortedFields,
  sameHash,
  signedJson,
  verifyJsonResponse,
  type BankPayload,
  type IciciSigningMode,
} from "./icici-signing.server";

/**
 * Compatibility export for the documented sorted-fields signing method.
 * Sort top-level keys only, retain nested JSON order, omit null/undefined,
 * exclude secureHash and emit lowercase hex from UTF-8 HMAC-SHA256.
 * JSON-v2 uses a separate implementation in icici-signing.server.ts.
 */
export function generateSecureHash(requestObj: Record<string, unknown>, secretKey: string): string {
  return signSortedFields(requestObj, secretKey);
}

/** Compatibility helper. Callback identity and STATUS verification are separate. */
export function verifyReferenceSecureHash(
  requestObj: Record<string, unknown>,
  hash: string,
  secretKey: string,
): boolean {
  if (!/^[a-f0-9]{64}$/.test(hash) || !secretKey) return false;
  return sameHash(signSortedFields(requestObj, secretKey), hash);
}

export class IciciPaymentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 503,
    public readonly diagnostics?: {
      missing?: string[];
      invalid?: string[];
      blocked?: string[];
      origins?: IciciOriginDiagnostics;
    },
  ) {
    super(message);
  }
}

export const iciciUatUrls = {
  initiate: "https://pgpayuat.icicibank.com/tsp/pg/api/v2/initiateSale",
  status: "https://pgpayuat.icicibank.com/tsp/pg/api/command?reqType=JSON",
} as const;

export function iciciUatConfig() {
  const mode = process.env["ICICI_SIGNING_MODE"]?.trim();
  const environment = process.env["ICICI_ENVIRONMENT"]?.trim();
  const merchantId = process.env["ICICI_MERCHANT_ID"]?.trim();
  const aggregatorID = process.env["ICICI_AGGREGATOR_ID"]?.trim();
  const secret = process.env["ICICI_SECRET_KEY"];
  const returnURL = process.env["ICICI_RETURN_URL"]?.trim();
  const flags = ["ICICI_UAT_ENABLED", "ICICI_UAT_MERCHANT_CONFIRMED"];
  const required = [
    "ICICI_MERCHANT_ID",
    "ICICI_SECRET_KEY",
    "ICICI_ENVIRONMENT",
    "ICICI_SIGNING_MODE",
    "ICICI_RETURN_URL",
    ...flags,
  ];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length)
    throw new IciciPaymentError(
      "ICICI_INTEGRATION_NOT_VERIFIED",
      missing.length === 1 ? `${missing[0]} is missing` : "Missing ICICI configuration",
      503,
      { missing },
    );
  if (!["uat", "sandbox"].includes(environment ?? ""))
    throw new IciciPaymentError(
      "ICICI_CONFIGURATION",
      "ICICI_ENVIRONMENT must be uat or sandbox; this adapter does not support production.",
      503,
      { invalid: ["ICICI_ENVIRONMENT"] },
    );
  if (mode !== "sorted-fields" && mode !== "json-v2")
    throw new IciciPaymentError(
      "ICICI_CONFIGURATION",
      "ICICI_SIGNING_MODE must be the bank-confirmed sorted-fields or json-v2 mode.",
      503,
      { invalid: ["ICICI_SIGNING_MODE"] },
    );
  const blocked = flags.filter((name) => process.env[name]?.trim() !== "true");
  if (blocked.length)
    throw new IciciPaymentError(
      "ICICI_INTEGRATION_NOT_VERIFIED",
      `${blocked.join(", ")} must be true after the corresponding UAT approval.`,
      503,
      { blocked },
    );
  let callback: URL;
  const localReturn =
    process.env["NODE_ENV"] === "development" && returnURL === "http://localhost:3000/consultation";
  try {
    callback = new URL(returnURL!);
  } catch {
    throw new IciciPaymentError(
      "ICICI_CONFIGURATION",
      "ICICI_RETURN_URL must be a valid HTTPS callback URL.",
      503,
      { invalid: ["ICICI_RETURN_URL"] },
    );
  }
  if (
    (!localReturn && callback.protocol !== "https:") ||
    callback.username ||
    callback.password ||
    callback.search ||
    callback.hash ||
    (!localReturn && callback.pathname !== "/api/payments/icici/callback") ||
    returnURL!.length > 128
  )
    throw new IciciPaymentError(
      "ICICI_CONFIGURATION",
      "ICICI_RETURN_URL must use HTTPS and /api/payments/icici/callback, be at most 128 characters, and have no credentials, query or fragment. Development also accepts http://localhost:3000/consultation.",
      503,
      { invalid: ["ICICI_RETURN_URL"] },
    );
  const invalid = [
    ...(merchantId!.length > 20 ? ["ICICI_MERCHANT_ID"] : []),
    ...((aggregatorID?.length ?? 0) > 20 ? ["ICICI_AGGREGATOR_ID"] : []),
    ...(process.env["ICICI_BASE_URL"]?.trim() &&
    process.env["ICICI_BASE_URL"]?.trim() !== iciciUatUrls.initiate
      ? ["ICICI_BASE_URL"]
      : []),
  ];
  if (invalid.length)
    throw new IciciPaymentError(
      "ICICI_CONFIGURATION",
      "ICICI IDs must be at most 20 characters and ICICI_BASE_URL, when set, must match the supported UAT initiation endpoint.",
      503,
      { invalid },
    );
  return {
    mode: mode as IciciSigningMode,
    merchantId: merchantId!,
    aggregatorID,
    // Validate presence without changing the bank-issued secret's bytes.
    secret: secret!,
    returnURL: returnURL!,
    origin: callback.origin,
  };
}
export type IciciUatConfig = ReturnType<typeof iciciUatConfig>;

function assertBankIdentity(payload: BankPayload, config: IciciUatConfig, reference: string) {
  const merchant = payload["merchantId"] ?? payload["merchantID"];
  if (
    merchant !== config.merchantId ||
    payload["merchantTxnNo"] !== reference ||
    (config.aggregatorID && payload["aggregatorID"] !== config.aggregatorID)
  )
    throw new IciciPaymentError(
      "ICICI_REFERENCE_MISMATCH",
      "The bank response could not be matched to this booking.",
    );
}

async function bankJson(url: string, payload: BankPayload, config: IciciUatConfig, form = false) {
  const request = form
    ? {
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          ...payload,
          secureHash: signSortedFields(payload, config.secret),
        } as Record<string, string>).toString(),
      }
    : signedJson(payload, config.secret, config.mode);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      ...request,
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new IciciPaymentError(
      "ICICI_STATUS_UNKNOWN",
      "Payment status is pending. Check this booking before attempting another payment.",
    );
  }
  if (!response.ok)
    throw new IciciPaymentError(
      "ICICI_STATUS_UNKNOWN",
      "The bank could not confirm this request. Please check payment status.",
    );
  const text = await response.text();
  if (text.length > 65_536)
    throw new IciciPaymentError(
      "ICICI_INVALID_RESPONSE",
      "The bank response could not be verified.",
    );
  let data: BankPayload;
  try {
    data = JSON.parse(text);
  } catch {
    throw new IciciPaymentError(
      "ICICI_INVALID_RESPONSE",
      "The bank response could not be verified.",
    );
  }
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !verifyJsonResponse(data, response.headers, config.secret, form ? "sorted-fields" : config.mode)
  )
    throw new IciciPaymentError(
      "ICICI_INVALID_SIGNATURE",
      "The bank response could not be verified.",
    );
  return data;
}

export async function initiateIciciSale(
  input: {
    reference: string;
    amountPaise: number;
    email: string;
    name: string;
    phone?: string;
  },
  config = iciciUatConfig(),
) {
  if (
    !/^[A-Za-z0-9]{1,20}$/.test(input.reference) ||
    !Number.isSafeInteger(input.amountPaise) ||
    input.amountPaise <= 0 ||
    input.email.length > 48
  )
    throw new IciciPaymentError(
      "ICICI_INVALID_BOOKING",
      "This booking's details cannot be sent to ICICI Bank.",
      400,
    );
  const txnDate = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(txnDate.map(({ type, value }) => [type, value]));
  const data = await bankJson(
    iciciUatUrls.initiate,
    {
      merchantId: config.merchantId,
      ...(config.aggregatorID ? { aggregatorID: config.aggregatorID } : {}),
      merchantTxnNo: input.reference,
      amount: (input.amountPaise / 100).toFixed(2),
      currencyCode: "356",
      payType: 0,
      transactionType: "SALE",
      customerEmailID: input.email,
      customerName: input.name.slice(0, 45),
      ...(input.phone ? { customerMobileNo: input.phone } : {}),
      returnURL: config.returnURL,
      txnDate: ["year", "month", "day", "hour", "minute", "second"]
        .map((k) => dateParts[k])
        .join(""),
    },
    config,
  );
  assertBankIdentity(data, config, input.reference);
  if (data["responseCode"] !== "R1000")
    throw new IciciPaymentError(
      "ICICI_INITIATION_REJECTED",
      "The bank did not accept this request. Check payment status before retrying.",
    );
  if (
    data["showOTPCapturePage"] === "Y" ||
    typeof data["redirectURI"] !== "string" ||
    typeof data["tranCtx"] !== "string" ||
    !data["tranCtx"]
  )
    throw new IciciPaymentError("ICICI_INVALID_RESPONSE", "Hosted ICICI checkout is unavailable.");
  const redirect = new URL(data["redirectURI"]);
  if (
    redirect.protocol !== "https:" ||
    !["pgpayuat.icicibank.com", "pgpayuat.icici.bank.in"].includes(redirect.hostname) ||
    redirect.pathname !== "/tsp/pg/api/v2/authRedirect" ||
    redirect.port ||
    redirect.username ||
    redirect.password ||
    redirect.search ||
    redirect.hash
  )
    throw new IciciPaymentError(
      "ICICI_INVALID_REDIRECT",
      "The bank's checkout URL could not be verified.",
    );
  redirect.searchParams.set("tranCtx", data["tranCtx"]);
  return { redirectUrl: redirect.href };
}

export function amountInPaise(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{1,9}(?:\.\d{1,2})?$/.test(value)) return null;
  const [rupees, fraction = ""] = value.split(".");
  return Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
}

export async function queryIciciStatus(
  input: { reference: string; amountPaise: number; transactionId?: string },
  config = iciciUatConfig(),
) {
  // Interface v0.5 p40: command requests are form-encoded and use field hashing.
  // reqType=JSON selects the response format; it does not select Hash Calculation v2.
  const data = await bankJson(
    iciciUatUrls.status,
    {
      merchantId: config.merchantId,
      ...(config.aggregatorID ? { aggregatorID: config.aggregatorID } : {}),
      merchantTxnNo: input.reference,
      originalTxnNo: input.reference,
      transactionType: "STATUS",
    },
    config,
    true,
  );
  assertBankIdentity(data, config, input.reference);
  const code = data["responseCode"];
  if (code !== "000" && code !== "0000") return { status: "pending" as const, transactionId: null };
  const transactionId = data["txnID"];
  if (
    typeof transactionId !== "string" ||
    !/^[A-Za-z0-9]{1,24}$/.test(transactionId) ||
    (input.transactionId && transactionId !== input.transactionId) ||
    amountInPaise(data["amount"]) !== input.amountPaise ||
    (data["currencyCode"] !== undefined && data["currencyCode"] !== "356") ||
    (data["currency"] !== undefined && data["currency"] !== "INR" && data["currency"] !== "356") ||
    (data["transactionType"] !== undefined && data["transactionType"] !== "SALE")
  )
    throw new IciciPaymentError(
      "ICICI_PAYMENT_MISMATCH",
      "The verified bank transaction does not match this booking.",
    );
  const status = data["txnStatus"];
  const transactionCode = data["txnResponseCode"];
  if (status === "SUC" && (transactionCode === "000" || transactionCode === "0000"))
    return { status: "paid" as const, transactionId };
  if (status === "REJ") return { status: "failed" as const, transactionId };
  // ERR, REQ, expiry/timeouts and unknown codes remain pending for reconciliation.
  return { status: "pending" as const, transactionId };
}

export function verifyIciciCallback(fields: Record<string, string>, config = iciciUatConfig()) {
  if (!sameHash(signSortedFields(fields, config.secret), fields["secureHash"]))
    throw new IciciPaymentError(
      "ICICI_INVALID_SIGNATURE",
      "The bank response could not be verified.",
      400,
    );
  const reference = fields["merchantTxnNo"];
  if (!reference)
    throw new IciciPaymentError("ICICI_INVALID_CALLBACK", "Invalid bank response.", 400);
  assertBankIdentity(fields, config, reference);
  return reference;
}

export function iciciErrorResponse(error: unknown): Response {
  if (error instanceof IciciPaymentError)
    return Response.json(
      { ok: false, code: error.code, message: error.message },
      { status: error.status, headers: { "cache-control": "no-store" } },
    );
  return Response.json(
    {
      ok: false,
      code: "ICICI_UNAVAILABLE",
      message: "Payment status could not be confirmed. Please check again before paying.",
    },
    { status: 503, headers: { "cache-control": "no-store" } },
  );
}

// An environment variable must not turn an unverified integration into a live
// payment option. Replace this gate only with a reviewed, sandbox-tested adapter.
export function iciciUnavailableResponse(): Response {
  return Response.json(
    {
      ok: false,
      code: "ICICI_INTEGRATION_NOT_VERIFIED",
      message: "ICICI Bank payments are currently unavailable. Please choose Razorpay.",
    },
    { status: 503, headers: { "cache-control": "no-store" } },
  );
}
export function assertPaymentOrigin(
  request: Request,
  requestOrigin = new URL(request.url).origin,
): Response | null {
  const origin = request.headers.get("origin");
  if (
    request.headers.get("x-aa-rpc") !== "1" ||
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin !== null && origin !== requestOrigin)
  )
    return Response.json(
      { ok: false, error: "Cross-site request rejected." },
      { status: 403, headers: { "cache-control": "no-store" } },
    );
  return null;
}
