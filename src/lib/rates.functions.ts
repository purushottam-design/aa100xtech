import { createServerFn } from "@tanstack/react-start";

import { loadRates } from "./rates.server";

export const getExchangeRates = createServerFn({ method: "GET" }).handler(async () => loadRates());
