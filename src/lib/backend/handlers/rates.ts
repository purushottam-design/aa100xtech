import "server-only";
import { createServerFn } from "@/lib/backend/server";

import { loadRates } from "@/lib/rates.server";

export const getExchangeRates = createServerFn({ method: "GET" }).handler(async () => loadRates());
