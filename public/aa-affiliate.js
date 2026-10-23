/*!
 * AA100XTech Unified Affiliate SDK (v1)
 * Drop on any website/landing page under aa100xtech.com:
 *   <script src="https://aa100xtech.com/aa-affiliate.js" defer></script>
 * Optional: data-endpoint="https://aa100xtech.com" data-product="your-catalog-slug"
 */
(function () {
  var script = document.currentScript || (function () {
    var all = document.getElementsByTagName("script");
    return all[all.length - 1];
  })();

  var BASE = (script && script.getAttribute("data-endpoint")) || "https://aa100xtech.com";
  var DEFAULT_PRODUCT = (script && script.getAttribute("data-product")) || null;
  var COOKIE = "aa_ref";
  var DAYS = 30;

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 864e5);
    document.cookie =
      name + "=" + encodeURIComponent(value) + ";expires=" + d.toUTCString() + ";path=/;SameSite=Lax";
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function readRef() {
    var raw = getCookie(COOKIE);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return { a: raw };
    }
  }

  // 1. Capture affiliate from the URL (?aa_ref=AA100X-XXXX&aa_item=slug)
  var params = new URLSearchParams(window.location.search);
  var urlRef = params.get("aa_ref") || params.get("ref");
  var urlItem = params.get("aa_item") || DEFAULT_PRODUCT;

  if (urlRef) {
    setCookie(COOKIE, JSON.stringify({ a: urlRef, i: urlItem, t: Date.now() }), DAYS);
  }

  var ref = readRef();

  // 2. Fire a page-view click event (deduplicated server-side)
  function track(product) {
    if (!ref || !ref.a) return Promise.resolve(null);
    return fetch(BASE + "/api/public/v1/track/click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        affiliate_id: ref.a,
        product_id: product || ref.i || DEFAULT_PRODUCT || undefined,
        source: document.referrer || undefined,
      }),
    }).catch(function () {
      return null;
    });
  }

  // 3. Validate a coupon code from any checkout
  function validateCoupon(code, productId, orderValue) {
    return fetch(BASE + "/api/public/v1/coupons/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: code,
        product_id: productId || DEFAULT_PRODUCT || undefined,
        order_value: orderValue,
      }),
    }).then(function (r) {
      return r.json();
    });
  }

  window.AAAffiliate = {
    version: "1.0.0",
    ref: ref,
    affiliateId: ref && ref.a ? ref.a : null,
    track: track,
    validateCoupon: validateCoupon,
    /**
     * Attribution payload to send from YOUR backend to
     * POST /api/public/v1/conversions (never send the API key from the browser).
     */
    conversionPayload: function (opts) {
      return {
        affiliate_id: ref && ref.a ? ref.a : undefined,
        coupon_code: opts && opts.couponCode ? opts.couponCode : undefined,
        product_id: (opts && opts.productId) || (ref && ref.i) || DEFAULT_PRODUCT,
        order_id: opts && opts.orderId,
        order_value: opts && opts.orderValue,
        currency: (opts && opts.currency) || "INR",
        event_type: (opts && opts.eventType) || "sale",
      };
    },
  };

  if (ref && ref.a) track(urlItem);
})();
