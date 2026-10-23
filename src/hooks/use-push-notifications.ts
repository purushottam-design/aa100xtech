import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { registerPushDevice, setPushEnabled } from "@/lib/push.functions";
import { listMyNotifications } from "@/lib/super-admin-plus.functions";

const TOKEN_KEY = "aa100x.push.token";
const SEEN_KEY = "aa100x.push.seen";

function deviceToken() {
  if (typeof window === "undefined") return "";
  let token = window.localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = `web_${crypto.randomUUID()}`;
    window.localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

function readSeen(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);
  const primed = useRef(false);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  const enabled = supported && permission === "granted";

  const feed = useQuery({
    queryKey: ["my-notifications"],
    queryFn: () => listMyNotifications(),
    refetchInterval: 45000,
    retry: false,
  });

  // Surface newly sent announcements as device notifications.
  useEffect(() => {
    if (!enabled || !feed.data) return;
    const rows = (feed.data.rows ?? []) as Array<{ id: string; title: string; body: string; link_url?: string | null }>;
    const seen = readSeen();
    if (!primed.current) {
      primed.current = true;
      window.localStorage.setItem(SEEN_KEY, JSON.stringify(rows.map((r) => r.id)));
      return;
    }
    const fresh = rows.filter((r) => !seen.includes(r.id));
    if (fresh.length === 0) return;
    navigator.serviceWorker.ready.then((reg) => {
      for (const row of fresh) {
        reg.active?.postMessage({
          type: "aa-notify",
          payload: { id: row.id, title: row.title, body: row.body, url: row.link_url || "/app/notifications" },
        });
      }
    });
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(rows.map((r) => r.id)));
  }, [enabled, feed.data]);

  const enable = useCallback(async () => {
    if (!supported) return false;
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return false;
      await navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      await registerPushDevice({
        data: {
          token: deviceToken(),
          platform: /android|iphone|ipad|mobile/i.test(navigator.userAgent) ? "mobile-web" : "web",
          userAgent: navigator.userAgent.slice(0, 380),
          enabled: true,
        },
      });
      return true;
    } finally {
      setBusy(false);
    }
  }, [supported]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      await setPushEnabled({ data: { token: deviceToken(), enabled: false } });
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    supported,
    permission,
    enabled,
    busy,
    enable,
    disable,
    notifications: (feed.data?.rows ?? []) as Array<{
      id: string;
      title: string;
      body: string;
      link_url?: string | null;
      sent_at?: string | null;
    }>,
    isLoading: feed.isLoading,
    error: feed.error as Error | null,
  };
}
