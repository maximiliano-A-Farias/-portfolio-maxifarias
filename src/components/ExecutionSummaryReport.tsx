"use client";

import { useEffect, useState } from "react";
import { workTranslations } from "@/data/workTranslations";

type RunData = {
  status: string;
  conclusion: string | null;
  runNumber: number;
  updatedAt: string;
  durationMs: number | null;
  htmlUrl: string;
  branch: string;
};

type TcCoverage = { total: number; automated: number; coverage: number };

type JiraIssue = {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  url: string;
};

type Sprint = {
  id: number;
  name: string;
  state: string;
  startDate: string | null;
  endDate: string | null;
  completeDate: string | null;
  issues: JiraIssue[];
};

function formatDuration(ms: number | null) {
  if (!ms) return "—";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
}

function runsForSprint(runs: RunData[], sprint: Sprint) {
  if (!sprint.startDate) return runs;
  const start = new Date(sprint.startDate).getTime();
  const end   = sprint.endDate ? new Date(sprint.endDate).getTime() : Date.now();
  return runs.filter((r) => {
    const t = new Date(r.updatedAt).getTime();
    return t >= start && t <= end;
  });
}

function Chip({ children, variant = "neutral" }: { children: React.ReactNode; variant?: "pass" | "fail" | "petrol" | "ocre" | "neutral" }) {
  const styles: Record<string, React.CSSProperties> = {
    pass:    { background: "var(--pass-dim)",   color: "var(--pass)"   },
    fail:    { background: "var(--fail-dim)",   color: "var(--fail)"   },
    petrol:  { background: "var(--petrol-dim)", color: "var(--petrol)" },
    ocre:    { background: "var(--ocre-dim)",   color: "var(--ocre)"   },
    neutral: { background: "var(--surface-2)",  color: "var(--text-2)" },
  };
  return (
    <span className="font-mono text-[0.6rem] uppercase tracking-[0.08em] px-[6px] py-[2px] rounded-[2px]" style={styles[variant]}>
      {children}
    </span>
  );
}

function SprintCard({ sprint, runs, tc, defaultOpen }: {
  sprint: Sprint;
  runs: RunData[];
  tc: TcCoverage | null;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [issuesOpen, setIssuesOpen] = useState(true);

  useEffect(() => {
    if (!open) setIssuesOpen(false);
  }, [open]);

  const completed   = runs.filter((r) => r.status === "completed");
  const passed      = completed.filter((r) => r.conclusion === "success");
  const successRate = completed.length > 0 ? Math.round((passed.length / completed.length) * 100) : null;
  const avgDuration = completed.length > 0
    ? Math.round(completed.reduce((a, r) => a + (r.durationMs ?? 0), 0) / completed.length)
    : null;
  const latestRun = completed[0];

  const tcs      = workTranslations.en.testCases;
  const bugs     = workTranslations.en.bugDetails;
  const tcPass   = tcs.filter((t) => t.status === "PASS").length;
  const tcFail   = tcs.filter((t) => t.status !== "PASS").length;
  // All bugDetails in the portfolio are resolved (documented after fix)
  const bugsFixed = bugs.length;
  const bugsOpen  = 0;

  const isActive = sprint.state === "active";
  const allPass  = successRate === 100 && completed.length > 0;

  return (
    <div className="rounded-[6px] border border-border overflow-hidden" style={{ background: "var(--surface)" }}>

      {/* Sprint header — toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer transition-opacity hover:opacity-80"
        style={{ background: "var(--surface-2)", borderBottom: open ? "1px solid var(--border)" : "none" }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="w-[7px] h-[7px] rounded-full flex-shrink-0"
            style={{
              background: isActive ? "var(--ocre)" : allPass ? "var(--pass)" : completed.length === 0 ? "var(--text-2)" : "var(--fail)",
              boxShadow: isActive ? "0 0 6px var(--ocre)" : allPass ? "0 0 6px var(--pass)" : "none",
            }}
          />
          <span className="font-mono text-[0.68rem] text-text-1 uppercase tracking-[0.1em]">{sprint.name}</span>
          <span className="font-mono text-[0.6rem] text-text-2">
            {formatDate(sprint.startDate)} → {formatDate(sprint.endDate ?? sprint.completeDate)}
          </span>
          {isActive && <Chip variant="ocre">active</Chip>}
          {!isActive && allPass && <Chip variant="pass">✓ all pass</Chip>}
          {!isActive && successRate !== null && !allPass && <Chip variant="fail">✕ failures</Chip>}
          {completed.length === 0 && <Chip variant="neutral">no runs</Chip>}
        </div>
        <span className="font-mono text-[0.7rem] text-text-2 transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          ↓
        </span>
      </button>

      {/* Sprint body */}
      {open && (
        <div>

          {/* 1 — Sprint Issues (trabajo del sprint) */}
          {sprint.issues.length > 0 && (
            <div className="border-b border-border">
              <button
                onClick={() => setIssuesOpen(!issuesOpen)}
                className="w-full flex items-center justify-between px-5 py-3 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: "transparent" }}
              >
                <span className="font-mono text-[0.58rem] text-text-2 uppercase tracking-[0.12em]">
                  Sprint Issues · {sprint.issues.length}
                </span>
                <span className="font-mono text-[0.65rem] text-text-2 transition-transform duration-200"
                  style={{ transform: issuesOpen ? "rotate(180deg)" : "rotate(0deg)" }}>↓</span>
              </button>
              {issuesOpen && <div className="px-5 pb-3 flex flex-col">
                {sprint.issues.map((issue) => {
                  const isDone   = issue.statusCategory === "done";
                  const isInProg = issue.statusCategory === "indeterminate";
                  return (
                    <div key={issue.key} className="flex items-baseline gap-3 py-[8px] border-b border-border last:border-0">
                      <a href={issue.url} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-[0.62rem] text-petrol flex-shrink-0 w-[72px] hover:opacity-70 transition-opacity">
                        {issue.key} ↗
                      </a>
                      <a href={issue.url} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-[0.68rem] text-text-1 flex-1 min-w-0 truncate hover:opacity-70 transition-opacity"
                        title={issue.summary}>
                        {issue.summary}
                      </a>
                      <span
                        className="font-mono text-[0.58rem] uppercase tracking-[0.08em] px-[6px] py-[2px] rounded-[2px] flex-shrink-0"
                        style={{
                          background: isDone ? "var(--pass-dim)" : isInProg ? "var(--ocre-dim)" : "var(--surface-2)",
                          color:      isDone ? "var(--pass)"     : isInProg ? "var(--ocre)"     : "var(--text-2)",
                        }}
                      >
                        {issue.status}
                      </span>
                    </div>
                  );
                })}
              </div>}
            </div>
          )}

          {/* 2 — Stats grid (resultados del sprint) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border">

            <div className="flex flex-col gap-2 p-5 border-r border-border border-b sm:border-b-0">
              <span className="font-mono text-[0.58rem] text-text-2 uppercase tracking-[0.12em]">Test Cases</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[1.5rem] font-semibold leading-none text-text-1" style={{ fontVariantNumeric: "tabular-nums" }}>{tcs.length}</span>
                <span className="font-mono text-[0.65rem] text-text-2">/ {tcs.length} total</span>
              </div>
              <div className="flex gap-[5px] flex-wrap">
                <Chip variant="pass">✓ {tcPass} pass</Chip>
                {tcFail > 0 && <Chip variant="fail">✕ {tcFail} fail</Chip>}
              </div>
            </div>

            <div className="flex flex-col gap-2 p-5 border-r border-border border-b sm:border-b-0">
              <span className="font-mono text-[0.58rem] text-text-2 uppercase tracking-[0.12em]">Bugs Tracked</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[1.5rem] font-semibold leading-none text-text-1" style={{ fontVariantNumeric: "tabular-nums" }}>{bugs.length}</span>
                <span className="font-mono text-[0.65rem] text-text-2">reported</span>
              </div>
              <div className="flex gap-[5px] flex-wrap">
                <Chip variant="pass">✓ {bugsFixed} fixed</Chip>
                {bugsOpen > 0 ? <Chip variant="fail">{bugsOpen} open</Chip> : <Chip variant="neutral">0 open</Chip>}
              </div>
            </div>

            <div className="flex flex-col gap-2 p-5">
              <span className="font-mono text-[0.58rem] text-text-2 uppercase tracking-[0.12em]">Automation Coverage</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[1.5rem] font-semibold leading-none text-text-1">{tc ? `${tc.coverage}%` : "—"}</span>
              </div>
              {tc && (
                <>
                  <div className="flex gap-[5px] flex-wrap">
                    <Chip variant="petrol">{tc.automated}/{tc.total} TCs</Chip>
                    <Chip variant="ocre">Cypress E2E</Chip>
                  </div>
                  <div className="h-[3px] rounded-[2px] overflow-hidden mt-1" style={{ background: "var(--border)" }}>
                    <div className="h-full rounded-[2px] transition-all duration-700"
                      style={{ width: `${tc.coverage}%`, background: tc.coverage === 100 ? "var(--pass)" : "var(--ocre)" }} />
                  </div>
                </>
              )}
            </div>

          </div>

          {/* 3 — CI + env details */}
          <div className="flex items-baseline gap-5 px-5 py-3 flex-wrap" style={{ background: "var(--surface-2)" }}>
            {[
              { label: "ci rate",  value: successRate !== null ? `${successRate}% (${passed.length}/${completed.length})` : "—", accent: successRate === 100 },
              { label: "avg dur",  value: formatDuration(avgDuration) },
              { label: "browser",  value: "Chrome" },
              { label: "viewport", value: "390 × 844" },
              { label: "env",      value: "Production · Vercel" },
            ].map(({ label, value, accent }) => (
              <div key={label} className="flex items-baseline gap-[5px]">
                <span className="font-mono text-[0.57rem] text-text-2 uppercase tracking-[0.1em]">{label}</span>
                <span className="font-mono text-[0.65rem]" style={{ color: accent ? "var(--pass)" : "var(--text-2)" }}>{value}</span>
              </div>
            ))}
            {latestRun && (
              <a href={latestRun.htmlUrl} target="_blank" rel="noopener noreferrer"
                className="font-mono text-[0.65rem] text-petrol underline underline-offset-2 decoration-dotted hover:opacity-70 ml-auto">
                CI run #{latestRun.runNumber} ↗
              </a>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default function ExecutionSummaryReport() {
  const [sprints, setSprints]   = useState<Sprint[]>([]);
  const [runs, setRuns]         = useState<RunData[]>([]);
  const [tc, setTc]             = useState<TcCoverage | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let jiraInterval: ReturnType<typeof setInterval> | null = null;

    const loadJira = () =>
      fetch("/api/jira-sprints", { cache: "no-store" })
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((jira) => {
          const incoming = jira.sprints ?? [] as Sprint[];
          setSprints((prev) => {
            // skip re-render if data is identical
            if (JSON.stringify(prev) === JSON.stringify(incoming)) return prev;
            return incoming;
          });
          // stop polling when no active sprint (closed sprints don't change)
          const hasActive = incoming.some((s: Sprint) => s.state === "active");
          if (!hasActive && jiraInterval) { clearInterval(jiraInterval); jiraInterval = null; }
        })
        .catch(() => {});

    const loadCi = () =>
      fetch("/api/cypress-status", { cache: "no-store" })
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((ci) => { setRuns(ci.runs ?? []); setTc(ci.tcCoverage ?? null); })
        .catch(() => {});

    Promise.all([loadJira(), loadCi()]).finally(() => setLoading(false));

    // Jira: poll every 60s while there's an active sprint, then stop
    jiraInterval = setInterval(loadJira, 60_000);

    // CI: poll every 30s while runs are in progress, then stop
    let ciInterval: ReturnType<typeof setInterval> | null = setInterval(() => {
      loadCi().then(() => {
        setRuns((prev) => {
          const allDone = prev.every((r) => r.status === "completed");
          if (allDone && ciInterval) { clearInterval(ciInterval); ciInterval = null; }
          return prev;
        });
      });
    }, 30_000);

    return () => {
      if (jiraInterval) clearInterval(jiraInterval);
      if (ciInterval) clearInterval(ciInterval);
    };
  }, []);

  if (loading) {
    return (
      <p className="font-mono text-[0.75rem] text-text-2 animate-pulse py-6">
        fetching sprints…
      </p>
    );
  }

  if (sprints.length === 0) {
    return (
      <p className="font-mono text-[0.75rem] text-text-2 py-6">
        — no sprints found in Jira
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sprints.map((sprint, i) => (
        <SprintCard
          key={sprint.id}
          sprint={sprint}
          runs={runsForSprint(runs, sprint)}
          tc={tc}
          defaultOpen={i === 0}
        />
      ))}
    </div>
  );
}
