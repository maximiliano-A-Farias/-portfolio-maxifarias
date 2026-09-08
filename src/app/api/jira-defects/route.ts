import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type CacheEntry = { data: unknown; ts: number };
let cache: CacheEntry | null = null;
const TTL = 6_000;

const BASE         = process.env.JIRA_BASE_URL!;
const EMAIL        = process.env.JIRA_EMAIL!;
const TOKEN        = process.env.JIRA_API_TOKEN!;
const DEFECT_BOARD = process.env.JIRA_DEFECT_BOARD_ID;

function jiraAuth() {
  return "Basic " + Buffer.from(`${EMAIL}:${TOKEN}`).toString("base64");
}

async function jiraFetch(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: jiraAuth(), Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Jira ${path} → ${res.status}`);
  return res.json();
}

export async function GET() {
  if (!DEFECT_BOARD) {
    return NextResponse.json({ defects: [] });
  }

  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const issueData = await jiraFetch(
      `/rest/agile/1.0/board/${DEFECT_BOARD}/issue?maxResults=50&fields=summary,status,priority,issuelinks`
    );

    const defects = (issueData.issues as Record<string, unknown>[]).map((issue) => {
      const fields    = issue.fields as Record<string, unknown>;
      const statusObj = fields.status as Record<string, unknown>;
      const statusCat = ((statusObj.statusCategory as Record<string, unknown>)?.key as string) ?? "";
      const priority  = ((fields.priority as Record<string, unknown>)?.name as string) ?? "Medium";
      const links     = (fields.issuelinks as Record<string, unknown>[]) ?? [];

      const linkedTickets = links
        .map((link) => {
          const out = link.outwardIssue as Record<string, unknown> | undefined;
          const inn = link.inwardIssue  as Record<string, unknown> | undefined;
          return (out?.key ?? inn?.key) as string | undefined;
        })
        .filter((k): k is string => Boolean(k));

      return {
        key:            issue.key as string,
        summary:        fields.summary as string,
        status:         statusObj.name as string,
        statusCategory: statusCat,
        priority,
        url:            `${BASE}/browse/${issue.key as string}`,
        linkedTickets,
      };
    });

    const result = { defects };
    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[jira-defects]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
