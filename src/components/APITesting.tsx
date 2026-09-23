"use client";

import { useState, useCallback } from "react";

type CheckStatus = "idle" | "running" | "pass" | "fail";

type ApiCheck = {
  id: string;
  api: "Jira" | "Cypress";
  endpoint: string;
  method: "GET";
  assertion: string;
  status: CheckStatus;
  statusCode?: number;
  responseTime?: number;
  detail?: string;
};

const CHECKS_DEF: Omit<ApiCheck, "status" | "statusCode" | "responseTime" | "detail">[] = [
  { id: "jira-1", api: "Jira", endpoint: "/api/jira-sprints",   method: "GET", assertion: "Status 200" },
  { id: "jira-2", api: "Jira", endpoint: "/api/jira-sprints",   method: "GET", assertion: "`sprints` field present" },
  { id: "jira-3", api: "Jira", endpoint: "/api/jira-sprints",   method: "GET", assertion: "At least 1 sprint returned" },
  { id: "jira-4", api: "Jira", endpoint: "/api/jira-sprints",   method: "GET", assertion: "Sprint has `name` and `state`" },
  { id: "jira-5", api: "Jira", endpoint: "/api/jira-sprints",   method: "GET", assertion: "Response time < 5000ms" },
  { id: "ci-1",   api: "Cypress", endpoint: "/api/cypress-status", method: "GET", assertion: "Status 200" },
  { id: "ci-2",   api: "Cypress", endpoint: "/api/cypress-status", method: "GET", assertion: "`runs` field present" },
  { id: "ci-3",   api: "Cypress", endpoint: "/api/cypress-status", method: "GET", assertion: "Last run has `status` field" },
  { id: "ci-4",   api: "Cypress", endpoint: "/api/cypress-status", method: "GET", assertion: "Last run has `conclusion`" },
  { id: "ci-5",   api: "Cypress", endpoint: "/api/cypress-status", method: "GET", assertion: "Response time < 5000ms" },
];

type ConnStatus = "unknown" | "connected" | "error";

export default function APITesting() {
  const [checks, setChecks] = useState<ApiCheck[]>(
    CHECKS_DEF.map(c => ({ ...c, status: "idle" }))
  );
  const [running, setRunning] = useState(false);
  const [jiraConn, setJiraConn] = useState<ConnStatus>("unknown");
  const [ciConn,   setCiConn]   = useState<ConnStatus>("unknown");
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const runChecks = useCallback(async () => {
    setRunning(true);
    setChecks(CHECKS_DEF.map(c => ({ ...c, status: "running" })));

    type JsonObj = Record<string, unknown>;

    let jiraData: JsonObj | null = null;
    let jiraCode = 0;
    let jiraTime = 0;
    try {
      const t0 = performance.now();
      const res = await fetch("/api/jira-sprints", { cache: "no-store" });
      jiraTime = Math.round(performance.now() - t0);
      jiraCode = res.status;
      if (res.ok) jiraData = (await res.json()) as JsonObj;
    } catch { /* network error */ }

    let ciData: JsonObj | null = null;
    let ciCode = 0;
    let ciTime = 0;
    try {
      const t0 = performance.now();
      const res = await fetch("/api/cypress-status", { cache: "no-store" });
      ciTime = Math.round(performance.now() - t0);
      ciCode = res.status;
      if (res.ok) ciData = (await res.json()) as JsonObj;
    } catch { /* network error */ }

    const sprints = Array.isArray(jiraData?.sprints)
      ? (jiraData!.sprints as JsonObj[])
      : [];
    const runs = Array.isArray(ciData?.runs)
      ? (ciData!.runs as JsonObj[])
      : [];

    type EvalResult = { status: CheckStatus; statusCode: number; responseTime: number; detail?: string };

    const evaluate = (id: string): EvalResult => {
      switch (id) {
        case "jira-1": return { status: jiraCode === 200 ? "pass" : "fail", statusCode: jiraCode, responseTime: jiraTime, detail: jiraCode === 200 ? "200 OK" : `Got ${jiraCode || "ERR"}` };
        case "jira-2": return { status: jiraData && "sprints" in jiraData ? "pass" : "fail", statusCode: jiraCode, responseTime: jiraTime };
        case "jira-3": return { status: sprints.length > 0 ? "pass" : "fail", statusCode: jiraCode, responseTime: jiraTime, detail: `${sprints.length} sprint(s)` };
        case "jira-4": return { status: sprints[0] && "name" in sprints[0] && "state" in sprints[0] ? "pass" : "fail", statusCode: jiraCode, responseTime: jiraTime };
        case "jira-5": return { status: jiraTime < 5000 ? "pass" : "fail", statusCode: jiraCode, responseTime: jiraTime, detail: `${jiraTime}ms` };
        case "ci-1":   return { status: ciCode === 200 ? "pass" : "fail", statusCode: ciCode, responseTime: ciTime, detail: ciCode === 200 ? "200 OK" : `Got ${ciCode || "ERR"}` };
        case "ci-2":   return { status: ciData && "runs" in ciData ? "pass" : "fail", statusCode: ciCode, responseTime: ciTime };
        case "ci-3":   return { status: runs[0] && "status" in runs[0] ? "pass" : "fail", statusCode: ciCode, responseTime: ciTime };
        case "ci-4":   return { status: runs[0] && "conclusion" in runs[0] ? "pass" : "fail", statusCode: ciCode, responseTime: ciTime };
        case "ci-5":   return { status: ciTime < 5000 ? "pass" : "fail", statusCode: ciCode, responseTime: ciTime, detail: `${ciTime}ms` };
        default:       return { status: "fail", statusCode: 0, responseTime: 0 };
      }
    };

    setChecks(CHECKS_DEF.map(c => ({ ...c, ...evaluate(c.id) })));
    setJiraConn(jiraCode === 200 ? "connected" : "error");
    setCiConn(ciCode === 200 ? "connected" : "error");
    setLastChecked(new Date().toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }));
    setRunning(false);
  }, []);

  const passed = checks.filter(c => c.status === "pass").length;
  const failed = checks.filter(c => c.status === "fail").length;
  const ran    = passed + failed;
  const total  = checks.length;

  const connDot = (s: ConnStatus) => (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{
        background: s === "connected" ? "var(--pass)" : s === "error" ? "var(--fail)" : "var(--text-2)",
        boxShadow:  s === "connected" ? "0 0 5px var(--pass)" : s === "error" ? "0 0 5px var(--fail)" : "none",
      }}
    />
  );

  return (
    <div data-testid="apiTestingPanel" className="flex flex-col gap-4">

      {/* Live environment banner */}
      <div
        data-testid="apiEnvBanner"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-[6px] border border-border"
        style={{ background: "var(--surface-2)" }}
      >
        <div className="flex flex-col gap-[3px]">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em]" style={{ color: "var(--petrol)" }}>
            Live Environment
          </span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1">
            <div className="flex items-center gap-2">
              {connDot(jiraConn)}
              <span className="font-mono text-[0.65rem] text-text-1">Jira API</span>
              <span
                className="font-mono text-[0.57rem] uppercase tracking-[0.08em]"
                style={{ color: jiraConn === "connected" ? "var(--pass)" : jiraConn === "error" ? "var(--fail)" : "var(--text-2)" }}
              >
                {jiraConn === "connected" ? "Connected" : jiraConn === "error" ? "Error" : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {connDot(ciConn)}
              <span className="font-mono text-[0.65rem] text-text-1">Cypress Runs</span>
              <span
                className="font-mono text-[0.57rem] uppercase tracking-[0.08em]"
                style={{ color: ciConn === "connected" ? "var(--pass)" : ciConn === "error" ? "var(--fail)" : "var(--text-2)" }}
              >
                {ciConn === "connected" ? "Connected" : ciConn === "error" ? "Error" : "—"}
              </span>
            </div>
          </div>
        </div>
        <span className="font-mono text-[0.6rem] text-text-2 flex-shrink-0">
          {lastChecked ? `Last checked: ${lastChecked}` : "Not checked yet"}
        </span>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {ran > 0 ? (
            <>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em]" style={{ color: "var(--pass)" }}>{passed} PASS</span>
              <span className="font-mono text-[0.6rem] text-text-2">·</span>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em]" style={{ color: failed > 0 ? "var(--fail)" : "var(--text-2)" }}>{failed} FAIL</span>
              <span className="font-mono text-[0.6rem] text-text-2">·</span>
              <span className="font-mono text-[0.65rem] text-text-2">{total} checks</span>
            </>
          ) : (
            <span className="font-mono text-[0.65rem] text-text-2">{total} checks ready — press Run</span>
          )}
        </div>
        <button
          data-testid="apiTestingRunBtn"
          onClick={runChecks}
          disabled={running}
          className="flex items-center gap-2 px-4 py-[9px] rounded-[4px] font-mono text-[0.68rem] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed self-start sm:self-auto"
          style={{ background: "var(--petrol)", color: "#fff", border: "none" }}
        >
          {running ? (
            <><span className="inline-block w-[6px] h-[6px] rounded-full bg-white animate-pulse" /> Running…</>
          ) : (
            <>▶ Run checks</>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[6px] border border-border">
        <table className="w-full border-collapse" style={{ minWidth: 560 }}>
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              {["API", "Endpoint", "Method", "Code", "Time", "Assertion", "Result"].map(h => (
                <th key={h} className="text-left px-4 py-3 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-text-2 font-normal whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {checks.map((check, i) => (
              <tr
                key={check.id}
                data-testid={`apiCheck-${check.id}`}
                style={{
                  background: i % 2 === 0 ? "transparent" : "var(--surface-2)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {/* API badge */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className="font-mono text-[0.57rem] uppercase tracking-[0.08em] px-[6px] py-[2px] rounded-[2px]"
                    style={{
                      background: check.api === "Jira" ? "var(--petrol-dim)" : "var(--ocre-dim)",
                      color:      check.api === "Jira" ? "var(--petrol)"     : "var(--ocre)",
                    }}
                  >
                    {check.api === "Jira" ? "JIRA" : "CYPRESS"}
                  </span>
                </td>

                {/* Endpoint */}
                <td className="px-4 py-3">
                  <span className="font-mono text-[0.62rem] text-text-2">{check.endpoint}</span>
                </td>

                {/* Method */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-mono text-[0.62rem]" style={{ color: "var(--sage)" }}>{check.method}</span>
                </td>

                {/* Status code */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className="font-mono text-[0.62rem]"
                    style={{
                      color: check.statusCode === 200
                        ? "var(--pass)"
                        : check.statusCode
                          ? "var(--fail)"
                          : "var(--text-2)",
                    }}
                  >
                    {check.statusCode ?? "—"}
                  </span>
                </td>

                {/* Response time */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-mono text-[0.62rem] text-text-2">
                    {check.responseTime != null && ran > 0 ? `${check.responseTime}ms` : "—"}
                  </span>
                </td>

                {/* Assertion */}
                <td className="px-4 py-3">
                  <span className="font-mono text-[0.65rem] text-text-1">{check.assertion}</span>
                  {check.detail && (
                    <span className="font-mono text-[0.58rem] text-text-2 ml-2">({check.detail})</span>
                  )}
                </td>

                {/* Result */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {check.status === "idle"    && <span className="font-mono text-[0.6rem] text-text-2">—</span>}
                  {check.status === "running" && <span className="font-mono text-[0.6rem] text-text-2 animate-pulse">…</span>}
                  {check.status === "pass"    && <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--pass)" }}>✓ PASS</span>}
                  {check.status === "fail"    && <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--fail)" }}>✗ FAIL</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary line */}
      {ran > 0 && failed === 0 && (
        <p className="font-mono text-[0.65rem] text-text-2">
          All {total} checks passed — both APIs are healthy and returning the expected shape.
        </p>
      )}
      {ran > 0 && failed > 0 && (
        <p className="font-mono text-[0.65rem]" style={{ color: "var(--fail)" }}>
          {failed} check(s) failed — see table above for details.
        </p>
      )}
    </div>
  );
}
