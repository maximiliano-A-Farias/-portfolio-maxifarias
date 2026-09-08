import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type CacheEntry = { data: unknown; ts: number };
let cache: CacheEntry | null = null;
const TTL = 6_000;

const BASE  = process.env.JIRA_BASE_URL!;
const EMAIL = process.env.JIRA_EMAIL!;
const TOKEN = process.env.JIRA_API_TOKEN!;
const BOARD = process.env.JIRA_BOARD_ID!;

function jiraAuth() {
  return "Basic " + Buffer.from(`${EMAIL}:${TOKEN}`).toString("base64");
}

async function jiraFetch(path: string) {
  const res = await fetch(`${BASE}/rest/agile/1.0${path}`, {
    headers: {
      Authorization: jiraAuth(),
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Jira ${path} → ${res.status}`);
  return res.json();
}

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const data = await jiraFetch(`/board/${BOARD}/sprint?maxResults=10&state=active,closed,future`);

    const rawSprints = (data.values as Record<string, unknown>[])
      .filter((s) => s.state !== "future")
      .sort((a, b) => {
        const da = new Date((a.startDate as string) ?? 0).getTime();
        const db = new Date((b.startDate as string) ?? 0).getTime();
        return db - da;
      });

    const sprints = await Promise.all(
      rawSprints.map(async (s) => {
        let issues: { key: string; summary: string; status: string; statusCategory: string }[] = [];
        try {
          const issueData = await jiraFetch(`/sprint/${s.id}/issue?maxResults=50&fields=summary,status`);
          issues = (issueData.issues as Record<string, unknown>[]).map((issue) => {
            const fields = issue.fields as Record<string, unknown>;
            const statusObj = fields.status as Record<string, unknown>;
            const statusCat = (statusObj.statusCategory as Record<string, unknown>)?.key as string ?? "";
            const key = issue.key as string;
            return {
              key,
              summary: fields.summary as string,
              status: statusObj.name as string,
              statusCategory: statusCat,
              url: `${BASE}/browse/${key}`,
            };
          });
        } catch { /* skip if issues fail */ }

        return {
          id:           s.id,
          name:         s.name,
          state:        s.state,
          startDate:    s.startDate ?? null,
          endDate:      s.endDate ?? null,
          completeDate: s.completeDate ?? null,
          issues,
        };
      })
    );

    const result = { sprints };
    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[jira-sprints]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
