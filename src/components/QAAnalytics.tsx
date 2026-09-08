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

function MetricCard({
  label,
  value,
  subtext,
  barPct,
  barColor,
  detail,
}: {
  label: string;
  value: string;
  subtext?: string;
  barPct?: number;
  barColor?: string;
  detail?: string;
}) {
  return (
    <div
      className="flex flex-col gap-3 p-5 rounded-[6px] border border-border"
      style={{ background: "var(--surface)" }}
    >
      <span className="font-mono text-[0.57rem] text-text-2 uppercase tracking-[0.14em]">{label}</span>
      <span
        className="font-mono font-semibold leading-none text-text-1"
        style={{ fontSize: "2rem", fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </span>
      {subtext && <span className="font-mono text-[0.62rem] text-text-2">{subtext}</span>}
      {barPct !== undefined && (
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${barPct}%`, background: barColor ?? "var(--sage)" }}
          />
        </div>
      )}
      {detail && (
        <span className="font-mono text-[0.58rem] text-text-2 opacity-60">{detail}</span>
      )}
    </div>
  );
}

export default function QAAnalytics() {
  const [runs, setRuns]   = useState<RunData[]>([]);
  const [tc, setTc]       = useState<TcCoverage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cypress-status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setRuns(data.runs ?? []);
        setTc(data.tcCoverage ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tcs   = workTranslations.en.testCases;
  const bugs  = workTranslations.en.bugDetails;

  const tcPass     = tcs.filter((t) => t.status === "PASS").length;
  const tcPassRate = tcs.length > 0 ? Math.round((tcPass / tcs.length) * 100) : 0;

  // All bugDetails in the portfolio are resolved (they're documented after fix)
  const bugsFixed  = bugs.length;
  const bugFixRate = bugs.length > 0 ? 100 : 0;

  const completed = runs.filter((r) => r.status === "completed");
  const passed    = completed.filter((r) => r.conclusion === "success");
  const ciRate    = completed.length > 0 ? Math.round((passed.length / completed.length) * 100) : null;

  if (loading) {
    return (
      <p className="font-mono text-[0.72rem] text-text-2 animate-pulse py-4">
        loading analytics…
      </p>
    );
  }

  const maxMs = Math.max(...runs.filter((r) => r.durationMs).map((r) => r.durationMs ?? 0), 1);

  return (
    <div className="flex flex-col gap-8">
      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="TC Pass Rate"
          value={`${tcPassRate}%`}
          subtext={`${tcPass} of ${tcs.length} test cases`}
          barPct={tcPassRate}
          barColor={tcPassRate === 100 ? "var(--pass)" : "var(--ocre)"}
        />
        <MetricCard
          label="Bug Fix Rate"
          value={`${bugFixRate}%`}
          subtext={`${bugsFixed} of ${bugs.length} resolved`}
          barPct={bugFixRate}
          barColor={bugFixRate === 100 ? "var(--pass)" : "var(--ocre)"}
        />
        <MetricCard
          label="Automation"
          value={tc ? `${tc.coverage}%` : "—"}
          subtext={tc ? `${tc.automated}/${tc.total} TCs automated` : undefined}
          barPct={tc?.coverage}
          barColor="var(--sage)"
          detail="Cypress E2E"
        />
        <MetricCard
          label="CI Success"
          value={ciRate !== null ? `${ciRate}%` : "—"}
          subtext={ciRate !== null ? `${passed.length}/${completed.length} runs passed` : "no runs yet"}
          barPct={ciRate ?? 0}
          barColor={
            ciRate === 100
              ? "var(--pass)"
              : ciRate !== null && ciRate >= 80
              ? "var(--ocre)"
              : "var(--fail)"
          }
          detail={completed.length > 0 ? `last ${completed.length} runs` : undefined}
        />
      </div>

      {/* CI Run History */}
      {runs.length > 0 && (
        <div
          className="flex flex-col gap-4 p-5 rounded-[6px] border border-border"
          style={{ background: "var(--surface)" }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-mono text-[0.57rem] text-text-2 uppercase tracking-[0.14em]">
              CI Run History — last {runs.length}
            </span>
            <div className="flex items-center gap-4">
              {[
                { label: "pass",        color: "var(--pass)"   },
                { label: "fail",        color: "var(--fail)"   },
                { label: "in progress", color: "var(--border)" },
              ].map(({ label, color }) => (
                <span key={label} className="flex items-center gap-[5px] font-mono text-[0.57rem] text-text-2">
                  <span className="w-[8px] h-[8px] rounded-full inline-block" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Dots sparkline */}
          <div className="flex items-center gap-[6px] flex-wrap">
            {[...runs].reverse().map((run, i) => {
              const color =
                run.status !== "completed"
                  ? "var(--border)"
                  : run.conclusion === "success"
                  ? "var(--pass)"
                  : "var(--fail)";
              return (
                <a
                  key={i}
                  href={run.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`#${run.runNumber} · ${run.conclusion ?? run.status}`}
                  className="flex flex-col items-center gap-1 group transition-opacity hover:opacity-80"
                >
                  <span
                    className="w-[10px] h-[10px] rounded-full block transition-transform duration-150 group-hover:scale-125"
                    style={{ background: color }}
                  />
                  <span className="font-mono text-[0.5rem] text-text-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    #{run.runNumber}
                  </span>
                </a>
              );
            })}
          </div>

          {/* Duration bar chart */}
          <div className="flex items-end gap-[3px] h-[36px]">
            {[...runs].reverse().map((run, i) => {
              const h = run.durationMs
                ? Math.max(4, Math.round((run.durationMs / maxMs) * 36))
                : 4;
              const color =
                run.status !== "completed"
                  ? "var(--border)"
                  : run.conclusion === "success"
                  ? "var(--pass)"
                  : "var(--fail)";
              return (
                <div
                  key={i}
                  className="flex-1 rounded-[2px] transition-all duration-500"
                  style={{ height: h, background: color, opacity: 0.6 }}
                />
              );
            })}
          </div>
          <span className="font-mono text-[0.52rem] text-text-2 opacity-50">
            run duration (relative)
          </span>
        </div>
      )}

      {/* Coverage breakdown */}
      {tc && (
        <div
          className="flex flex-col gap-5 p-5 rounded-[6px] border border-border"
          style={{ background: "var(--surface)" }}
        >
          <span className="font-mono text-[0.57rem] text-text-2 uppercase tracking-[0.14em]">
            Coverage Breakdown
          </span>
          <div className="flex flex-col gap-3">
            {[
              { label: "Total TCs",    val: tc.total,               max: tc.total, color: "var(--petrol)" },
              { label: "Automated",    val: tc.automated,           max: tc.total, color: "var(--sage)"   },
              { label: "Manual only",  val: tc.total - tc.automated, max: tc.total, color: "var(--ocre)"   },
            ].map(({ label, val, max, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="font-mono text-[0.62rem] text-text-2 w-[90px] flex-shrink-0">{label}</span>
                <div
                  className="flex-1 h-[4px] rounded-full overflow-hidden"
                  style={{ background: "var(--border)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${max > 0 ? (val / max) * 100 : 0}%`,
                      background: color,
                    }}
                  />
                </div>
                <span
                  className="font-mono text-[0.62rem] text-text-1 w-[24px] text-right"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
