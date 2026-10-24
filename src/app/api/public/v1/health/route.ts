import { handlers } from "@/routes/api/public/v1/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const OPTIONS = handlers.OPTIONS;
export const GET = handlers.GET;
