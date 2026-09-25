import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Groups page views into visits (one per browser session) and emails a
// summary every VISIT_ALERT_EVERY visits. Storage: Upstash Redis REST API.
// Email: Resend REST API. If any variable is missing, the route is a no-op.

const REDIS_URL   = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const RESEND_KEY  = process.env.RESEND_API_KEY;
const ALERT_TO    = process.env.VISIT_ALERT_EMAIL;
const ALERT_EVERY = Number(process.env.VISIT_ALERT_EVERY ?? 5);
const MAX_MAILS_PER_DAY = 20;

const SESSION_TTL_S = 24 * 60 * 60;
const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|curl|wget|python|axios|node-fetch/i;

type Visit = {
  ts: number;
  ref: string;
  device: string;
  browser: string;
  country: string;
  city: string;
  pages: string[];
};

async function redis<T = unknown>(...command: (string | number)[]): Promise<T> {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis ${command[0]} → ${res.status}`);
  return ((await res.json()) as { result: T }).result;
}

function describeUserAgent(ua: string) {
  const device = /iPad|Tablet/i.test(ua) ? "Tablet" : /Mobi|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop";
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /OPR\//.test(ua) ? "Opera" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Safari\//.test(ua) ? "Safari" : "Other";
  return { device, browser };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function buildEmail(visits: Visit[], total: number) {
  const rows = visits
    .map((v) => {
      const time = new Date(v.ts).toLocaleString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        dateStyle: "short",
        timeStyle: "short",
        hourCycle: "h23",
      });
      const place = [v.city, v.country].filter(Boolean).join(", ") || "—";
      return `<tr>
        <td>${escapeHtml(time)}</td>
        <td>${escapeHtml(place)}</td>
        <td>${escapeHtml(v.ref || "Directo")}</td>
        <td>${escapeHtml(`${v.device} · ${v.browser}`)}</td>
        <td>${escapeHtml(v.pages.join(" → "))}</td>
      </tr>`;
    })
    .join("");

  return `<div style="font-family:Arial,sans-serif;color:#1c2b2b">
    <h2 style="margin:0 0 4px">Tu portfolio tuvo ${visits.length} visitas nuevas</h2>
    <p style="margin:0 0 16px;color:#52605f">Total acumulado: ${total} visitas</p>
    <table cellpadding="6" style="border-collapse:collapse;font-size:13px" border="1">
      <tr style="background:#f3f5f4"><th>Fecha</th><th>Ubicación</th><th>Llegó desde</th><th>Dispositivo</th><th>Páginas</th></tr>
      ${rows}
    </table>
    <p style="margin-top:16px;font-size:12px;color:#7d8a88">Más detalle en Vercel → Analytics.</p>
  </div>`;
}

async function sendAlert(total: number) {
  const day = new Date().toISOString().slice(0, 10);
  const mailsToday = await redis<number>("INCR", `va:mails:${day}`);
  if (mailsToday === 1) await redis("EXPIRE", `va:mails:${day}`, SESSION_TTL_S * 2);
  if (mailsToday > MAX_MAILS_PER_DAY) return;

  const ids = await redis<string[]>("LRANGE", "va:pending", 0, -1);
  await redis("DEL", "va:pending");
  if (!ids.length) return;

  const raw = await redis<(string | null)[]>("MGET", ...ids.map((id) => `va:s:${id}`));
  const visits = raw.filter((v): v is string => Boolean(v)).map((v) => JSON.parse(v) as Visit);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Portfolio <onboarding@resend.dev>",
      to: [ALERT_TO],
      subject: `Portfolio: ${visits.length} visitas nuevas (${total} en total)`,
      html: buildEmail(visits, total),
    }),
  });
  if (!res.ok) throw new Error(`Resend → ${res.status}`);
}

export async function POST(req: NextRequest) {
  if (!REDIS_URL || !REDIS_TOKEN || !RESEND_KEY || !ALERT_TO) {
    return new NextResponse(null, { status: 204 });
  }

  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) return new NextResponse(null, { status: 204 });

  try {
    const body = (await req.json()) as { sid?: unknown; path?: unknown; ref?: unknown };
    const sid  = typeof body.sid === "string" ? body.sid : "";
    const path = typeof body.path === "string" ? body.path.slice(0, 100) : "";
    const ref  = typeof body.ref === "string" ? body.ref.slice(0, 100) : "";
    if (!/^[0-9a-f-]{36}$/i.test(sid) || !path.startsWith("/")) {
      return new NextResponse(null, { status: 204 });
    }

    const key = `va:s:${sid}`;
    const existing = await redis<string | null>("GET", key);

    if (existing) {
      const visit = JSON.parse(existing) as Visit;
      if (!visit.pages.includes(path) && visit.pages.length < 20) {
        visit.pages.push(path);
        await redis("SET", key, JSON.stringify(visit), "EX", SESSION_TTL_S);
      }
      return new NextResponse(null, { status: 204 });
    }

    const { device, browser } = describeUserAgent(ua);
    const visit: Visit = {
      ts: Date.now(),
      ref,
      device,
      browser,
      country: req.headers.get("x-vercel-ip-country") ?? "",
      city: decodeURIComponent(req.headers.get("x-vercel-ip-city") ?? ""),
      pages: [path],
    };
    await redis("SET", key, JSON.stringify(visit), "EX", SESSION_TTL_S);
    await redis("RPUSH", "va:pending", sid);
    const total = await redis<number>("INCR", "va:count");

    if (total % ALERT_EVERY === 0) await sendAlert(total);
  } catch (err) {
    console.error("visit tracking failed:", err instanceof Error ? err.message : "unknown error");
  }

  return new NextResponse(null, { status: 204 });
}
