// Local tunnel settings are scoped to this development process. Normal dev,
// production builds, deployment settings and .env files remain independent.
const origin = "https://tractor-nautical-snowbird.ngrok-free.dev";
process.env.NODE_ENV = "development";
process.env.DEV_TUNNEL_ORIGIN = origin;
process.env.ICICI_RETURN_URL = `${origin}/api/payments/icici/callback`;
process.env.ICICI_TRUST_PROXY = "true";

// Forwarding is trusted only with a loopback backend behind the ngrok agent.
// Keep bank activation, authentication and completed-UAT flags as configured.
process.argv = [
  process.execPath,
  __filename,
  "dev",
  "--webpack",
  "--hostname",
  "127.0.0.1",
  "--port",
  "3000",
];
require("./next.cjs");
