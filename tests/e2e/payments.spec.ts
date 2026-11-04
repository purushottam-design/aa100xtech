import { test, expect, type Locator, type Page } from "@playwright/test";

async function openPaymentSummary(
  page: Page,
  premium = false,
  doubleSubmit = false,
  beforeProceed?: (dialog: Locator) => Promise<void>,
) {
  await page.route("**/api/rpc/consultations/createConsultationBooking", async (route) => {
    if (doubleSubmit) await new Promise((resolve) => setTimeout(resolve, 300));
    return route.fulfill({
      json: {
        data: {
          ok: true,
          bookingId: "CONS-TEST1234",
          orderId: "order_test",
          amount: 250000,
          currency: "INR",
          keyId: "rzp_test_fixture",
          planName: "Quick Consultation",
          duration: "15 Minutes",
        },
      },
    });
  });
  await page.goto("/consultation", { waitUntil: "domcontentloaded" });
  await page
    .getByRole("button", {
      name: premium ? "Book Premium" : "Book Now",
      exact: true,
    })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Your name", { exact: true }).fill("Test Customer");
  await dialog.getByPlaceholder("you@company.com", { exact: true }).fill("test@example.test");
  await dialog.getByPlaceholder("+91 90000 00000", { exact: true }).fill("+910000000000");
  await dialog.locator("select").nth(0).selectOption({ index: 1 });
  await dialog
    .locator('input[type="date"]')
    .fill(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  await dialog.locator('input[type="time"]').fill("11:00");
  await dialog
    .getByPlaceholder(
      "Share goals, challenges, timeline, and what you want from this consultation...",
      { exact: true },
    )
    .fill("A test consultation project with clearly defined scope.");
  const proceed = dialog.getByRole("button", {
    name: "Proceed to Payment",
    exact: true,
  });
  await beforeProceed?.(dialog);
  if (doubleSubmit)
    await proceed.evaluate((button) => {
      button.click();
      button.click();
    });
  else await proceed.click();
  await expect(
    dialog.getByRole("heading", { name: "Proceed to Payment", exact: true }),
  ).toBeVisible();
  return dialog;
}

for (const width of [1440, 390]) {
  test(`existing Razorpay checkout remains default and ICICI stays unavailable at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const dialog = await openPaymentSummary(page);
    await expect(dialog.getByRole("radio", { name: /Pay with Razorpay/ })).toBeChecked();
    await expect(dialog.getByRole("radio", { name: /Pay with ICICI Bank/ })).toBeDisabled();
    await expect(dialog.getByText("Currently unavailable", { exact: true })).toBeVisible();
    await dialog.getByRole("radio", { name: /Pay with Razorpay/ }).press("ArrowRight");
    await expect(dialog.getByRole("radio", { name: /Pay with Razorpay/ })).toBeChecked();
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`payment-options-${width}.png`),
    });
    let requestBody: unknown;
    await page.route("**/api/rpc/consultations/verifyConsultationPayment", async (route) => {
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        json: {
          data: {
            ok: true,
            status: "paid",
            bookingId: "CONS-TEST1234",
            paymentId: "pay_test",
            duplicate: false,
          },
        },
      });
    });
    await page.evaluate(() => {
      const w = window as unknown as {
        Razorpay: new (options: {
          order_id: string;
          key: string;
          handler: (value: unknown) => void;
        }) => unknown;
        testRazorpayOptions: unknown;
      };
      w.Razorpay = class {
        constructor(
          private options: {
            order_id: string;
            key: string;
            handler: (value: unknown) => void;
          },
        ) {
          w.testRazorpayOptions = {
            order_id: options.order_id,
            key: options.key,
          };
        }
        on() {}
        open() {
          this.options.handler({
            razorpay_order_id: "order_test",
            razorpay_payment_id: "pay_test",
            razorpay_signature: "test_signature",
          });
        }
      };
    });
    await dialog.getByRole("button", { name: /Pay with Razorpay/ }).click();
    await expect(
      dialog.getByRole("heading", { name: "Payment Successful", exact: true }),
    ).toBeVisible();
    expect(requestBody).toEqual({
      data: {
        bookingId: "CONS-TEST1234",
        razorpayOrderId: "order_test",
        razorpayPaymentId: "pay_test",
        razorpaySignature: "test_signature",
      },
    });
    expect(errors).toEqual([]);
  });
}

test("pending Razorpay verification rechecks the same transaction without reopening checkout", async ({
  page,
}) => {
  const dialog = await openPaymentSummary(page);
  let checks = 0;
  await page.route("**/api/rpc/consultations/verifyConsultationPayment", (route) =>
    route.fulfill({
      json: {
        data: {
          ok: true,
          status: ++checks === 1 ? "pending" : "paid",
          paymentId: "pay_test",
        },
      },
    }),
  );
  await page.evaluate(() => {
    const w = window as unknown as {
      Razorpay: unknown;
      testCheckoutOpens: number;
    };
    w.testCheckoutOpens = 0;
    w.Razorpay = class {
      constructor(private options: { handler: (value: unknown) => void }) {}
      on() {}
      open() {
        w.testCheckoutOpens++;
        this.options.handler({
          razorpay_order_id: "order_test",
          razorpay_payment_id: "pay_test",
          razorpay_signature: "test_signature",
        });
      }
    };
  });
  await dialog.getByRole("button", { name: /Pay with Razorpay/ }).click();
  await expect(dialog.getByRole("heading", { name: "Payment Pending", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Check payment status", exact: true }).click();
  await expect(
    dialog.getByRole("heading", { name: "Payment Successful", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as unknown as { testCheckoutOpens: number }).testCheckoutOpens,
    ),
  ).toBe(1);
});

for (const outcome of ["failed", "cancelled"]) {
  test(`existing Razorpay ${outcome} feedback is retained`, async ({ page }) => {
    const dialog = await openPaymentSummary(page);
    await page.route("**/api/rpc/consultations/markConsultationPaymentFailed", (route) =>
      route.fulfill({ json: { data: { ok: true } } }),
    );
    await page.evaluate((outcome) => {
      const w = window as unknown as { Razorpay: unknown };
      w.Razorpay = class {
        private failed?: () => void;
        constructor(private options: { modal: { ondismiss: () => void } }) {}
        on(event: string, callback: () => void) {
          if (event === "payment.failed") this.failed = callback;
        }
        open() {
          if (outcome === "cancelled") this.options.modal.ondismiss();
          else this.failed?.();
        }
      };
    }, outcome);
    await dialog.getByRole("button", { name: /Pay with Razorpay/ }).click();
    await expect(
      dialog.getByRole("heading", {
        name: outcome === "failed" ? "Payment Failed" : "Payment Cancelled",
        exact: true,
      }),
    ).toBeVisible();
  });
}

test("ICICI endpoints reject cross-site requests and forged callbacks, and payment administration remains protected", async ({
  request,
}) => {
  const availability = await request.get("/api/payments/icici/availability");
  expect(availability.status()).toBe(200);
  expect(availability.headers()["cache-control"]).toBe("no-store");
  const readiness = await availability.json();
  expect(typeof readiness.available).toBe("boolean");
  expect(readiness.icici).toBe(readiness.available);
  for (const endpoint of ["checkout", "initiate", "status"]) {
    const response = await request.post(`/api/payments/icici/${endpoint}`, {
      headers: { "x-aa-rpc": "1", origin: "https://attacker.example.test" },
      data: { paymentStatus: "SUCCESS", secureHash: "0".repeat(64) },
    });
    expect(response.status()).toBe(403);
    expect((await response.json()).error).toBe("Cross-site request rejected.");
  }
  const callback = await request.post("/api/payments/icici/callback", {
    form: { paymentStatus: "SUCCESS", secureHash: "forged" },
  });
  const failure = await callback.json();
  // A disabled/misconfigured adapter rejects before signature validation. With
  // valid UAT config, this malformed hash always fails before storage/bank work.
  if (failure.code === "ICICI_INVALID_SIGNATURE") expect(callback.status()).toBe(400);
  else {
    expect(callback.status()).toBe(503);
    expect(["ICICI_INTEGRATION_NOT_VERIFIED", "ICICI_CONFIGURATION"]).toContain(failure.code);
  }
  expect(failure.ok).toBe(false);
  expect((await request.post("/api/payments/icici/initiate", { data: {} })).status()).toBe(403);
  expect(
    (
      await request.post("/api/rpc/payments/listPayments", {
        headers: { "x-aa-rpc": "1" },
        data: { data: {} },
      })
    ).status(),
  ).toBe(401);
});

test("mocked confirmed UAT checkout selects ICICI at the unchanged premium price without creating a Razorpay order", async ({
  page,
}) => {
  let booking: Record<string, unknown> = {};
  let razorpayOrders = 0;
  let initiations = 0;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("/consultations/createConsultationBooking")) razorpayOrders++;
  });
  await page.route("**/api/payments/icici/availability", (route) =>
    route.fulfill({ json: { available: true, environment: "uat" } }),
  );
  await page.route("**/api/payments/icici/checkout", (route) => {
    const input = route.request().postDataJSON();
    booking = input.booking;
    expect(input.token).toMatch(/^[a-f0-9]{64}$/);
    expect(booking.planId).toBe("premium");
    return route.fulfill({
      json: {
        ok: true,
        amount: 2000000,
        currency: "INR",
        reference: "ICUATFIXTURE123456789",
      },
    });
  });
  await page.route("**/api/payments/icici/initiate", (route) => {
    initiations++;
    expect(route.request().postDataJSON().gateway).toBe("icici");
    return route.fulfill({
      json: {
        ok: true,
        gateway: "icici",
        pending: true,
        bookingId: "CONS-UATFIXTURE",
      },
    });
  });
  await page.route("**/api/payments/icici/status", (route) =>
    route.fulfill({
      json: {
        ok: true,
        gateway: "icici",
        status: "paid",
        bookingId: "CONS-UATFIXTURE",
        paymentId: "UAT-TXN-FIXTURE",
        amount: 2000000,
        currency: "INR",
        reference: "ICUATFIXTURE123456789",
        booking,
      },
    }),
  );
  const dialog = await openPaymentSummary(page, true);
  await expect(dialog.getByRole("radio", { name: /Pay with ICICI Bank/ })).toBeEnabled();
  await dialog.getByRole("radio", { name: /Pay with ICICI Bank/ }).check();
  await dialog.getByRole("button", { name: "Pay with ICICI Bank ₹20,000", exact: false }).click();
  await expect(dialog.getByRole("heading", { name: "Payment Pending", exact: true })).toBeVisible();
  await expect(dialog.getByText("CONS-UATFIXTURE", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Check payment status", exact: true }).click();
  await expect(
    dialog.getByRole("heading", { name: "Payment Successful", exact: true }),
  ).toBeVisible();
  expect(razorpayOrders).toBe(0);
  expect(initiations).toBe(1);
  expect(errors).toEqual([]);
});

test("booking waits for availability before deciding which checkout to prepare", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let preparations = 0;
  await page.route("**/api/payments/icici/availability", async (route) => {
    await gate;
    await route.fulfill({ json: { available: true } });
  });
  await page.route("**/api/payments/icici/checkout", (route) => {
    preparations++;
    return route.fulfill({
      json: { ok: true, amount: 250000, currency: "INR", reference: "ICWAIT" },
    });
  });
  const dialog = await openPaymentSummary(page, false, false, async (details) => {
    await expect(
      details.getByRole("button", {
        name: "Proceed to Payment",
        exact: true,
      }),
    ).toBeDisabled();
    expect(preparations).toBe(0);
    release();
  });
  await expect(dialog.getByRole("radio", { name: /Pay with ICICI Bank/ })).toBeEnabled();
  expect(preparations).toBe(1);
});

for (const failure of ["wrong-origin", "http-error", "canonical-false", "uat-access", "storage"]) {
  test(`ICICI ${failure} keeps its radio disabled and Razorpay available`, async ({ page }) => {
    await page.route("**/api/payments/icici/availability", (route) =>
      route.fulfill({
        status: failure === "http-error" ? 503 : 200,
        json:
          failure === "wrong-origin"
            ? {
                available: false,
                code: "ICICI_WRONG_ORIGIN",
                reason: "must-not-render-raw-server-data",
              }
            : failure === "uat-access" || failure === "storage"
              ? {
                  available: false,
                  code:
                    failure === "uat-access"
                      ? "ICICI_UAT_TEST_ACCESS_REQUIRED"
                      : "CHECKOUT_STORAGE_UNAVAILABLE",
                  reason: "must-not-render-raw-server-data",
                }
              : { available: failure === "http-error", icici: true },
      }),
    );
    const dialog = await openPaymentSummary(page);
    await expect(dialog.getByRole("radio", { name: /Pay with ICICI Bank/ })).toBeDisabled();
    await expect(dialog.getByRole("radio", { name: /Pay with Razorpay/ })).toBeChecked();
    await expect(dialog.getByRole("button", { name: /Pay with Razorpay/ })).toBeEnabled();
    await expect(dialog.getByText("must-not-render-raw-server-data")).toHaveCount(0);
    if (failure === "wrong-origin")
      await expect(
        dialog.getByText("Open the configured HTTPS website to use ICICI Bank."),
      ).toBeVisible();
    if (failure === "uat-access")
      await expect(
        dialog.getByText(
          "Sign in as a Super Administrator on this website to test ICICI Bank UAT.",
        ),
      ).toBeVisible();
    if (failure === "storage")
      await expect(
        dialog.getByText("ICICI Bank booking preparation is temporarily unavailable."),
      ).toBeVisible();
  });
}

test("a selected ICICI method cannot pay after refreshed availability is lost", async ({
  page,
}) => {
  let available = true;
  let initiations = 0;
  await page.route("**/api/payments/icici/availability", (route) =>
    route.fulfill({
      json: { available, code: available ? undefined : "ICICI_WRONG_ORIGIN" },
    }),
  );
  await page.route("**/api/payments/icici/checkout", (route) =>
    route.fulfill({
      json: {
        ok: true,
        amount: 250000,
        currency: "INR",
        reference: "ICREFRESH",
      },
    }),
  );
  await page.route("**/api/payments/icici/initiate", (route) => {
    initiations++;
    return route.fulfill({ status: 503, json: { ok: false } });
  });
  const dialog = await openPaymentSummary(page);
  const icici = dialog.getByRole("radio", { name: /Pay with ICICI Bank/ });
  await icici.check();
  await expect(dialog.getByRole("button", { name: /Pay with ICICI Bank/ })).toBeEnabled();
  available = false;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(icici).toBeDisabled();
  await expect(icici).toBeChecked();
  await expect(dialog.getByRole("button", { name: /Pay with ICICI Bank/ })).toBeDisabled();
  await expect(
    dialog.getByText("Open the configured HTTPS website to use ICICI Bank."),
  ).toBeVisible();
  expect(initiations).toBe(0);
  await dialog.getByRole("radio", { name: /Pay with Razorpay/ }).check();
  await expect(dialog.getByRole("button", { name: /Pay with Razorpay/ })).toBeEnabled();
});

test("booking storage failure keeps the form and never opens payment checkout", async ({
  page,
}) => {
  const message =
    "Your booking could not be saved. No payment was started. Please try again shortly.";
  let checkoutLoads = 0;
  page.on("request", (request) => {
    if (request.url().includes("checkout.razorpay.com")) checkoutLoads++;
  });
  await page.route("**/api/rpc/consultations/createConsultationBooking", (route) =>
    route.fulfill({
      json: {
        data: {
          ok: false,
          code: "BOOKING_STORAGE_UNAVAILABLE",
          error: message,
        },
      },
    }),
  );
  await page.goto("/consultation", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Book Now", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Your name", { exact: true }).fill("Database Failure Test");
  await dialog.getByPlaceholder("you@company.com", { exact: true }).fill("failure@example.test");
  await dialog.getByPlaceholder("+91 90000 00000", { exact: true }).fill("+910000000000");
  await dialog.locator("select").nth(0).selectOption({ index: 1 });
  await dialog
    .locator('input[type="date"]')
    .fill(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  await dialog.locator('input[type="time"]').fill("11:00");
  await dialog
    .getByPlaceholder(
      "Share goals, challenges, timeline, and what you want from this consultation...",
      { exact: true },
    )
    .fill("Synthetic booking for a database failure scenario.");
  await dialog.getByRole("button", { name: "Proceed to Payment", exact: true }).click();
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Booking Details", exact: true })).toBeVisible();
  await expect(dialog.getByPlaceholder("Your name", { exact: true })).toHaveValue(
    "Database Failure Test",
  );
  expect(checkoutLoads).toBe(0);
});

test("double submit sends one request and unchanged details reuse its request key", async ({
  page,
}) => {
  const keys: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/consultations/createConsultationBooking"))
      keys.push(request.postDataJSON().data.idempotencyKey);
  });
  const dialog = await openPaymentSummary(page, false, true);
  expect(keys).toHaveLength(1);
  expect(keys[0]).toMatch(/^[a-f0-9-]{36}$/i);
  await dialog.getByRole("button", { name: "Back", exact: true }).click();
  await dialog.getByRole("button", { name: "Proceed to Payment", exact: true }).click();
  await expect(
    dialog.getByRole("heading", { name: "Proceed to Payment", exact: true }),
  ).toBeVisible();
  expect(keys).toHaveLength(2);
  expect(keys[1]).toBe(keys[0]);
});
