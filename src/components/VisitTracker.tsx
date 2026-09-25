"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Sends one lightweight beacon per page view to /api/visit, which groups them
// into visits and emails a summary every N visits. Renders nothing.
// Visiting any page with ?notrack=1 excludes this browser (owner's devices);
// ?notrack=0 re-enables it.

const SESSION_KEY = "mf-visit";
const NOTRACK_KEY = "mf-notrack";
const SESSION_TTL = 30 * 60 * 1000;

type StoredSession = { id: string; ts: number };

function getSessionId(): { id: string; isNew: boolean } {
  const now = Date.now();
  const raw = localStorage.getItem(SESSION_KEY);
  const stored: StoredSession | null = raw ? JSON.parse(raw) : null;
  const isNew = !stored || now - stored.ts > SESSION_TTL;
  const id = isNew ? crypto.randomUUID() : stored!.id;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: now }));
  return { id, isNew };
}

function externalReferrer(): string {
  const params = new URLSearchParams(window.location.search);
  const utm = params.get("utm_source");
  if (utm) return utm;
  if (!document.referrer) return "";
  try {
    const host = new URL(document.referrer).hostname;
    return host === window.location.hostname ? "" : host;
  } catch {
    return "";
  }
}

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const flag = new URLSearchParams(window.location.search).get("notrack");
      if (flag === "1") localStorage.setItem(NOTRACK_KEY, "1");
      if (flag === "0") localStorage.removeItem(NOTRACK_KEY);
      if (localStorage.getItem(NOTRACK_KEY) === "1") return;
      if (navigator.webdriver) return;

      const { id, isNew } = getSessionId();
      const body = JSON.stringify({
        sid: id,
        path: pathname,
        ref: isNew ? externalReferrer() : "",
      });
      const blob = new Blob([body], { type: "application/json" });
      if (!navigator.sendBeacon?.("/api/visit", blob)) {
        fetch("/api/visit", { method: "POST", body, keepalive: true }).catch(() => {});
      }
    } catch {
      // Tracking must never break the page.
    }
  }, [pathname]);

  return null;
}
