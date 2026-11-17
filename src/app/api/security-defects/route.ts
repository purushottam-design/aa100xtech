import {
  securityDefectRequest,
  listSecurityDefects,
  createSecurityDefect,
  updateSecurityDefect,
} from "@/lib/security-defects.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = (request: Request) =>
  securityDefectRequest(request, (session) => listSecurityDefects(request, session));
export const POST = (request: Request) =>
  securityDefectRequest(request, (session) => createSecurityDefect(request, session));
export const PATCH = (request: Request) =>
  securityDefectRequest(request, (session) => updateSecurityDefect(request, session));
