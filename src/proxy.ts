import { NextResponse, type NextRequest } from "next/server";

// The local bank return shares the page URL. Preserve POST bodies and send
// them through signature verification and STATUS reconciliation before rendering.
export function proxy(request: NextRequest) {
  if (
    process.env.NODE_ENV === "development" &&
    process.env["ICICI_RETURN_URL"]?.trim() === "http://localhost:3000/consultation" &&
    request.nextUrl.pathname === "/consultation" &&
    request.method === "POST" &&
    request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/x-www-form-urlencoded")
  ) {
    const target = request.nextUrl.clone();
    target.pathname = "/api/payments/icici/callback";
    target.search = "";
    return NextResponse.rewrite(target);
  }
  return NextResponse.next();
}

export const config = { matcher: "/consultation" };
