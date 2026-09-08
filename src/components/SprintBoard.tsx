"use client";

import { useEffect, useState } from "react";
import type { BugDetail, TestCase } from "@/data/workTranslations";

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

type JiraDefect = {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  priority: string;
  url: string;
  linkedTickets: string[];
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function isResolved(statusCategory: string) {
  return statusCategory === "done";
}

function BugSummaryRow({
  defect,
  sprintName,
  tcRef,
}: {
  defect: JiraDefect;
  sprintName: string;
  tcRef?: string;
}) {
  const [open, setOpen] = useState(false);
  const resolved = isResolved(defect.statusCategory);
  const ticketRef = defect.linkedTickets[0];

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-[10px] cursor-pointer hover:opacity-80 text-left"
        style={{ background: "transparent" }}
      >
        <a
          href={defect.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-[0.62rem] text-petrol flex-shrink-0 w-[72px] hover:opacity-70 transition-opacity"
        >
          {defect.key} ↗
        </a>
        <span
          className="font-mono text-[0.68rem] text-text-1 flex-1 min-w-0 truncate"
          title={defect.summary}
        >
          {defect.summary}
        </span>
        <div className="flex items-center gap-[5px] flex-shrink-0 flex-wrap justify-end">
          <span
            className="font-mono text-[0.57rem] uppercase tracking-[0.08em] px-[6px] py-[2px] rounded-[2px]"
            style={{ background: "var(--ocre-dim)", color: "var(--ocre)" }}
          >
            {defect.priority}
          </span>
          <span
            className="font-mono text-[0.57rem] uppercase tracking-[0.08em] px-[6px] py-[2px] rounded-[2px]"
            style={{
              background: resolved ? "var(--pass-dim)" : "var(--fail-dim)",
              color:      resolved ? "var(--pass)"     : "var(--fail)",
            }}
          >
            {defect.status}
          </span>
          {ticketRef && (
            <span
              className="hidden sm:inline font-mono text-[0.57rem] px-[6px] py-[2px] rounded-[2px]"
              style={{ background: "var(--petrol-dim)", color: "var(--petrol)" }}
            >
              {ticketRef}
            </span>
          )}
          <span
            className="font-mono text-[0.7rem] text-text-2 inline-block transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▾
          </span>
        </div>
      </button>

      {open && (
        <div
          className="px-5 pb-4 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3"
          style={{ background: "var(--surface-2)" }}
        >
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[0.57rem] uppercase tracking-[0.1em] text-text-2 opacity-60">Sprint</span>
            <span className="font-mono text-[0.68rem] text-text-1">{sprintName}</span>
          </div>
          {tcRef && (
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[0.57rem] uppercase tracking-[0.1em] text-text-2 opacity-60">Found in</span>
              <span className="font-mono text-[0.68rem] text-petrol">{tcRef}</span>
            </div>
          )}
          {ticketRef && (
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[0.57rem] uppercase tracking-[0.1em] text-text-2 opacity-60">Reference</span>
              <span className="font-mono text-[0.68rem] text-petrol">{ticketRef}</span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[0.57rem] uppercase tracking-[0.1em] text-text-2 opacity-60">Priority</span>
            <span className="font-mono text-[0.68rem]" style={{ color: "var(--ocre)" }}>{defect.priority}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[0.57rem] uppercase tracking-[0.1em] text-text-2 opacity-60">Status</span>
            <span
              className="font-mono text-[0.68rem]"
              style={{ color: resolved ? "var(--pass)" : "var(--fail)" }}
            >
              {defect.status}
            </span>
          </div>
          {defect.linkedTickets.length > 1 && (
            <div className="flex flex-col gap-1 col-span-2">
              <span className="font-mono text-[0.57rem] uppercase tracking-[0.1em] text-text-2 opacity-60">All linked tickets</span>
              <span className="font-mono text-[0.68rem] text-petrol">{defect.linkedTickets.join(", ")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SprintRow({
  sprint,
  defaultOpen,
  defects,
  ticketToTC,
}: {
  sprint: Sprint;
  defaultOpen: boolean;
  defects: JiraDefect[];
  ticketToTC: Record<string, string>;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const done    = sprint.issues.filter((i) => i.statusCategory === "done").length;
  const inProg  = sprint.issues.filter((i) => i.statusCategory === "indeterminate").length;
  const toDo    = sprint.issues.filter((i) => i.statusCategory === "new").length;
  const total   = sprint.issues.length;
  const doneW   = total > 0 ? (done / total) * 100 : 0;
  const inProgW = total > 0 ? (inProg / total) * 100 : 0;
  const toDoW   = total > 0 ? (toDo / total) * 100 : 0;
  const isActive = sprint.state === "active";

  const resolvedDefects = defects.filter((d) => isResolved(d.statusCategory)).length;
  const openDefects     = defects.length - resolvedDefects;

  return (
    <div data-testid={`sprintRow-${sprint.id}`} className="rounded-[6px] border border-border overflow-hidden" style={{ background: "var(--surface)" }}>
      {/* Sprint header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-4 cursor-pointer transition-opacity hover:opacity-80 text-left"
        style={{ background: "var(--surface-2)", borderBottom: open ? "1px solid var(--border)" : "none" }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: isActive ? "var(--ocre)" : doneW === 100 && total > 0 ? "var(--pass)" : "var(--text-2)",
              boxShadow:  isActive ? "0 0 6px var(--ocre)" : doneW === 100 && total > 0 ? "0 0 5px var(--pass)" : "none",
            }}
          />
          <div className="flex flex-col gap-[2px] flex-1 min-w-0">
            <span className="font-mono text-[0.68rem] text-text-1 uppercase tracking-[0.08em] truncate">{sprint.name}</span>
            <span className="font-mono text-[0.58rem] text-text-2">
              {formatDate(sprint.startDate)} → {formatDate(sprint.endDate ?? sprint.completeDate)}
            </span>
          </div>
          {isActive && (
            <span
              className="font-mono text-[0.57rem] uppercase tracking-[0.1em] px-2 py-[2px] rounded-[2px] flex-shrink-0"
              style={{ background: "var(--ocre-dim)", color: "var(--ocre)" }}
            >
              active
            </span>
          )}
        </div>

        <div className="flex items-center gap-[5px] flex-shrink-0 pl-5 sm:pl-0">
          {total > 0 && (
            <>
              <span className="font-mono text-[0.6rem]" style={{ color: "var(--pass)" }}>{done} done</span>
              <span className="font-mono text-[0.6rem] text-text-2">·</span>
              <span className="font-mono text-[0.6rem]" style={{ color: "var(--ocre)" }}>{inProg} in progress</span>
              <span className="font-mono text-[0.6rem] text-text-2">·</span>
              <span className="font-mono text-[0.6rem] text-text-2">{toDo} to do</span>
            </>
          )}
          {defects.length > 0 && (
            <>
              <span className="font-mono text-[0.6rem] text-text-2">·</span>
              <span className="font-mono text-[0.6rem]" style={{ color: "var(--ocre)" }}>
                {defects.length} {defects.length === 1 ? "defect" : "defects"}
              </span>
            </>
          )}
          {total === 0 && defects.length === 0 && (
            <span className="font-mono text-[0.6rem] text-text-2">no issues</span>
          )}
          <span
            className="font-mono text-[0.7rem] text-text-2 inline-block transition-transform duration-200 ml-1"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ↓
          </span>
        </div>
      </button>

      {open && (
        <div>
          {/* Tickets subsection */}
          {total > 0 && (
            <>
              <div className="h-[3px] w-full flex overflow-hidden">
                <div style={{ width: `${doneW}%`, background: "var(--pass)", transition: "width 0.6s ease" }} />
                <div style={{ width: `${inProgW}%`, background: "var(--ocre)", transition: "width 0.6s ease" }} />
                <div style={{ width: `${toDoW}%`, background: "var(--border)" }} />
              </div>

              <div
                className="px-5 py-2 flex items-center gap-2"
                style={{ background: "var(--petrol-dim)", borderBottom: "1px solid var(--border)" }}
              >
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em]" style={{ color: "var(--petrol)" }}>
                  Tickets
                </span>
                <span
                  className="font-mono text-[0.57rem] px-[6px] py-[1px] rounded-[2px]"
                  style={{ background: "var(--petrol)", color: "white" }}
                >
                  {total}
                </span>
                <span className="font-mono text-[0.57rem] text-text-2 ml-auto">
                  {done} completed · {inProg} in progress · {toDo} to do
                </span>
              </div>

              <div className="flex flex-col border-b border-border">
                {sprint.issues.map((issue, i) => {
                  const isDone   = issue.statusCategory === "done";
                  const isInProg = issue.statusCategory === "indeterminate";
                  return (
                    <div
                      key={issue.key}
                      data-testid={`sprintIssue-${issue.key}`}
                      className="flex items-center gap-3 px-5 py-[10px] border-b border-border last:border-0"
                      style={{ background: i % 2 === 0 ? "transparent" : "var(--surface-2)" }}
                    >
                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[0.62rem] text-petrol flex-shrink-0 w-[80px] hover:opacity-70 transition-opacity"
                      >
                        {issue.key} ↗
                      </a>
                      <span className="font-mono text-[0.68rem] text-text-1 flex-1 min-w-0 truncate" title={issue.summary}>
                        {issue.summary}
                      </span>
                      <span
                        className="font-mono text-[0.57rem] uppercase tracking-[0.08em] px-[6px] py-[2px] rounded-[2px] flex-shrink-0"
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
              </div>
            </>
          )}

          {/* Defects subsection */}
          {defects.length > 0 && (
            <>
              <div
                className="px-5 py-2 flex items-center gap-2"
                style={{ background: "var(--ocre-dim)", borderBottom: "1px solid var(--border)" }}
              >
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em]" style={{ color: "var(--ocre)" }}>
                  Defects
                </span>
                <span
                  className="font-mono text-[0.57rem] px-[6px] py-[1px] rounded-[2px]"
                  style={{ background: "var(--ocre)", color: "white" }}
                >
                  {defects.length}
                </span>
                <span className="font-mono text-[0.57rem] text-text-2 ml-auto">
                  {resolvedDefects} resolved · {openDefects} open
                </span>
              </div>
              <div className="flex flex-col">
                {defects.map((d) => {
                  const tc = d.linkedTickets.map((k) => ticketToTC[k]).find(Boolean);
                  return (
                    <BugSummaryRow key={d.key} defect={d} sprintName={sprint.name} tcRef={tc} />
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const POLL_MS = 5_000;

export default function SprintBoard({ bugReports = [], testCases = [] }: { bugReports?: BugDetail[]; testCases?: TestCase[] }) {
  const [sprints,  setSprints]  = useState<Sprint[]>([]);
  const [defects,  setDefects]  = useState<JiraDefect[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      try {
        const [s, d] = await Promise.all([
          fetch("/api/jira-sprints", { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data: { sprints: Sprint[] }) => data.sprints ?? []),
          fetch("/api/jira-defects", { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : { defects: [] }))
            .then((data: { defects: JiraDefect[] }) => data.defects ?? []),
        ]);
        if (cancelled) return;
        setSprints((prev) => (JSON.stringify(prev) === JSON.stringify(s) ? prev : s));
        setDefects((prev) => (JSON.stringify(prev) === JSON.stringify(d) ? prev : d));
        setLastSync(new Date());
      } catch { /* network error — keep previous state */ }
    };

    fetchAll().finally(() => { if (!cancelled) setLoading(false); });
    const id = setInterval(fetchAll, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (loading) {
    return <p className="font-mono text-[0.72rem] text-text-2 animate-pulse py-4">fetching sprints…</p>;
  }

  if (!sprints.length) {
    return <p className="font-mono text-[0.72rem] text-text-2 py-4">— no sprints found</p>;
  }

  // Map each SCRUM issue key → sprint name for defect linking
  const issueToSprint: Record<string, string> = {};
  for (const sprint of sprints) {
    for (const issue of sprint.issues) {
      issueToSprint[issue.key] = sprint.name;
    }
  }

  // Map SCRUM ticket → TC id (from testCases data)
  const ticketToTC: Record<string, string> = {};
  for (const tc of testCases) {
    if (tc.ticketRef && tc.id) ticketToTC[tc.ticketRef] = tc.id;
  }

  // Assign each defect to a sprint via its linked SCRUM tickets
  const defectsBySprint: Record<string, JiraDefect[]> = {};
  for (const defect of defects) {
    const sprintName = defect.linkedTickets.map((k) => issueToSprint[k]).find(Boolean);
    if (sprintName) {
      defectsBySprint[sprintName] = [...(defectsBySprint[sprintName] ?? []), defect];
    }
  }

  return (
    <div data-testid="sprintBoard" className="flex flex-col gap-3">
      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--pass)" }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--pass)" }} />
        </span>
        <span className="font-mono text-[0.58rem] text-text-2 uppercase tracking-[0.1em]">
          live · syncs every {POLL_MS / 1000}s
          {lastSync && ` · last ${lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
        </span>
      </div>

      {sprints.map((s, i) => (
        <SprintRow
          key={s.id}
          sprint={s}
          defaultOpen={i === 0}
          defects={defectsBySprint[s.name] ?? []}
          ticketToTC={ticketToTC}
        />
      ))}
    </div>
  );
}
