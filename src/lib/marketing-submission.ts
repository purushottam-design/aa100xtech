export async function submitMarketingForm(kind: "creator" | "brand", body: FormData) {
  const response = await fetch(`/api/marketing/${kind}`, {
    method: "POST",
    headers: { "x-aa-rpc": "1" },
    body,
    signal: AbortSignal.timeout(30_000),
  });
  let result: { ok?: unknown; reference?: unknown; error?: unknown };
  try {
    result = await response.json();
  } catch {
    throw new Error(
      "The server returned an unexpected response. Your submission has not been confirmed. Please try again.",
    );
  }
  if (
    !response.ok ||
    result.ok !== true ||
    typeof result.reference !== "string" ||
    !result.reference
  )
    throw new Error(
      typeof result.error === "string"
        ? result.error
        : "Your submission could not be confirmed. Please try again.",
    );
  return { reference: result.reference };
}
