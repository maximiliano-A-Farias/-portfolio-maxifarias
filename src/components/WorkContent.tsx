"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { workTranslations, type BugDetail, type JiraDefect, type GherkinLine, type TestCase } from "@/data/workTranslations";
import RevealSection from "./RevealSection";
import CypressStatusWidget from "./CypressStatusWidget";
import SprintBoard from "./SprintBoard";
import QAAnalytics from "./QAAnalytics";
import APITesting from "./APITesting";

const SECTION_COLORS: Record<string, { bg: string; border: string }> = {
  sprintBoard: { bg: "var(--petrol-dim)", border: "var(--petrol)" },
  testCases:   { bg: "var(--sage-dim)",   border: "var(--sage)"   },
  bugReports:  { bg: "var(--ocre-dim)",   border: "var(--ocre)"   },
  automation:  { bg: "var(--petrol-dim)", border: "var(--petrol)" },
  apiTesting:  { bg: "var(--sage-dim)",   border: "var(--sage)"   },
  analytics:   { bg: "var(--sage-dim)",   border: "var(--sage)"   },
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
  sprintBoard: (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--petrol)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  testCases: (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  bugReports: (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--ocre)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx={12} cy={12} r={10} />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  automation: (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--petrol)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  apiTesting: (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 6h16M4 12h10M4 18h7" />
      <circle cx="19" cy="17" r="3" />
      <path d="m21.5 19.5-1.5-1.5" />
    </svg>
  ),
  analytics: (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
};

const SECTION_KEYS = ["sprintBoard", "testCases", "bugReports", "automation", "apiTesting", "analytics"] as const;

function GherkinLines({ lines }: { lines: GherkinLine[] }) {
  return (
    <>
      {lines.map((line, i) => {
        if (line.keyword === "blank") return <span key={i}>{"\n"}</span>;
        if (line.keyword === "feature")
          return <span key={i} style={{ color: "var(--petrol)", fontWeight: 600 }}>{line.text}{"\n"}</span>;
        if (line.keyword === "scenario")
          return <span key={i} style={{ color: "var(--petrol)" }}>{line.text}{"\n"}</span>;
        const match = line.text.match(/^(\s*)(Given|When|Then|But|And)(\s+)(.*)$/i);
        if (match) {
          return (
            <span key={i}>
              <span style={{ color: "var(--text-2)" }}>{match[1]}</span>
              <span style={{ color: "var(--sage)", fontWeight: 600 }}>{match[2]}</span>
              <span style={{ color: "var(--text-2)" }}>{match[3]}</span>
              <span style={{ color: "var(--text-1)" }}>{match[4]}</span>
              {"\n"}
            </span>
          );
        }
        return <span key={i} style={{ color: "var(--text-1)" }}>{line.text}{"\n"}</span>;
      })}
    </>
  );
}

function GherkinMobileList({ lines }: { lines: GherkinLine[] }) {
  return (
    <div className="font-mono text-[0.72rem] leading-[1.9] flex flex-col">
      {lines.map((line, i) => {
        if (line.keyword === "blank") return <div key={i} className="h-[0.6em]" />;
        if (line.keyword === "feature")
          return (
            <div key={i} style={{ color: "var(--petrol)", fontWeight: 600 }}>
              {line.text.trim()}
            </div>
          );
        if (line.keyword === "scenario")
          return (
            <div key={i} style={{ color: "var(--petrol)", paddingLeft: "1rem" }}>
              {line.text.trim()}
            </div>
          );
        const match = line.text.trim().match(/^(Given|When|Then|But|And)(\s+)(.*)$/i);
        if (match) {
          return (
            <div key={i} style={{ paddingLeft: "1.5rem", display: "flex", gap: "0.35em", alignItems: "flex-start" }}>
              <span style={{ color: "var(--sage)", fontWeight: 600, flexShrink: 0, minWidth: "3.5rem" }}>{match[1]}</span>
              <span style={{ color: "var(--text-1)", wordBreak: "break-word" }}>{match[3]}</span>
            </div>
          );
        }
        return (
          <div key={i} style={{ paddingLeft: "1.5rem", color: "var(--text-1)", wordBreak: "break-word" }}>
            {line.text.trim()}
          </div>
        );
      })}
    </div>
  );
}

function GherkinBlock({ lines }: { lines: GherkinLine[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop: inline */}
      <pre data-testid="gherkinBlock" className="hidden sm:block font-mono text-[0.75rem] leading-[1.9] overflow-x-auto p-4 rounded-[4px] border border-border" style={{ background: "var(--surface-2)" }}>
        <GherkinLines lines={lines} />
      </pre>

      {/* Mobile: trigger button */}
      <button
        data-testid="gherkinMobileTrigger"
        onClick={() => setOpen(true)}
        className="sm:hidden w-full flex items-center justify-between px-4 py-3 rounded-[4px] border border-border font-mono text-[0.72rem] text-petrol uppercase tracking-[0.08em] cursor-pointer transition-opacity duration-150 hover:opacity-70"
        style={{ background: "var(--surface-2)" }}
      >
        <span>View Gherkin scenario</span>
        <span>↗</span>
      </button>

      {/* Mobile modal — centrado */}
      {open && (
        <div
          data-testid="gherkinSheetOverlay"
          className="sm:hidden fixed inset-0 z-[200] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setOpen(false)}
        >
          <div
            data-testid="gherkinSheet"
            className="rounded-[14px] border border-border flex flex-col max-h-[80vh] w-full"
            style={{ background: "var(--surface)", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border flex-shrink-0">
              <span className="font-mono text-[0.7rem] text-petrol uppercase tracking-[0.1em]">Gherkin scenario</span>
              <button
                data-testid="gherkinSheetClose"
                onClick={() => setOpen(false)}
                className="font-mono text-[0.7rem] text-text-2 border border-border rounded-[3px] px-3 py-1 bg-transparent cursor-pointer"
              >
                close ×
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              <GherkinMobileList lines={lines} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type MergedBug = JiraDefect & Partial<BugDetail> & { tcRef?: string };

function BugReportCard({ bug, defaultOpen = true }: { bug: MergedBug; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const resolved = bug.statusCategory === "done";

  return (
    <div data-testid={`bugReportCard-${bug.key}`} className="rounded-[6px] border border-border overflow-hidden" style={{ background: "var(--surface)" }}>
      {/* Header */}
      <button
        data-testid={`bugReportToggle-${bug.key}`}
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 cursor-pointer transition-opacity duration-150 hover:opacity-80"
        style={{ background: "transparent", borderBottom: open ? "1px solid var(--border)" : "none" }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2 flex-shrink-0 flex-wrap">
              <a
                href={bug.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-mono text-[0.68rem] text-petrol tracking-[0.1em] uppercase hover:opacity-70 transition-opacity"
              >
                {bug.key} ↗
              </a>
              {bug.linkedTickets[0] && (
                <span className="font-mono text-[0.62rem] px-2 py-[1px] rounded-[2px]" style={{ background: "var(--petrol-dim)", color: "var(--petrol)" }}>
                  {bug.linkedTickets[0]}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="font-mono text-[0.65rem] uppercase tracking-[0.1em] px-2 py-[2px] rounded-[2px]"
                style={{
                  background: resolved ? "var(--pass-dim)" : "var(--fail-dim)",
                  color:      resolved ? "var(--pass)"     : "var(--fail)",
                }}
              >
                {resolved ? "✓ " : ""}{bug.status}
              </span>
              <span className="font-mono text-[0.7rem] text-text-2 transition-transform duration-200 inline-block" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.08em] px-2 py-[2px] rounded-[2px]" style={{ background: "var(--petrol-dim)", color: "var(--petrol)" }}>
              Priority: {bug.priority}
            </span>
          </div>
          <p className="font-display text-[0.98rem] text-text-1 leading-[1.35]">{bug.summary}</p>
        </div>
      </button>

      {/* Collapsible body */}
      {open && (
        <div data-testid={`bugReportBody-${bug.key}`} className="px-5 py-4">
          {(bug.environment || bug.device || bug.browser) && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 mb-5">
              {[["Env", bug.environment], ["Device", bug.device], ["Browser", bug.browser]].map(([k, v]) =>
                v ? (
                  <p key={k} className="font-mono text-[0.68rem] text-text-2">
                    <span className="opacity-60">{k}: </span>{v}
                  </p>
                ) : null
              )}
            </div>
          )}

          {bug.gherkin && <GherkinBlock lines={bug.gherkin} />}

          {/* Steps to reproduce */}
          {bug.stepsToReproduce && bug.stepsToReproduce.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-petrol">Steps to Reproduce</span>
              <div className="flex flex-col gap-0">
                {bug.stepsToReproduce.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center flex-shrink-0" style={{ width: 24 }}>
                      <div className="w-6 h-6 rounded-full border flex items-center justify-center font-mono text-[0.55rem] font-bold flex-shrink-0"
                        style={{ borderColor: "var(--petrol)", background: "var(--petrol-dim)", color: "var(--petrol)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      {i < bug.stepsToReproduce!.length - 1 && (
                        <div className="w-px flex-1 min-h-[16px]" style={{ background: "var(--border)" }} />
                      )}
                    </div>
                    <div className="pb-3 flex-1">
                      <p className="font-mono text-[0.72rem] text-text-1 leading-[1.4]">{step.action}</p>
                      {step.detail && <p className="font-mono text-[0.62rem] text-text-2 leading-[1.5] mt-[2px]">{step.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actual + Expected result */}
          {(bug.actualResult || bug.expectedResult) && (
            <div className="mt-2 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bug.actualResult && (
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em]" style={{ color: "var(--fail)" }}>Actual Result</span>
                  <p className="font-mono text-[0.7rem] text-text-2 leading-[1.6]">{bug.actualResult}</p>
                </div>
              )}
              {bug.expectedResult && (
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em]" style={{ color: "var(--pass)" }}>Expected Result</span>
                  <p className="font-mono text-[0.7rem] text-text-2 leading-[1.6]">{bug.expectedResult}</p>
                </div>
              )}
            </div>
          )}

          {bug.fix && (
            <div className="mt-4 pt-4 border-t border-border flex gap-2 items-baseline">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-sage flex-shrink-0">Fix</span>
              <p data-testid={`bugReportFix-${bug.key}`} className="font-mono text-[0.72rem] text-text-2 leading-[1.6]">{bug.fix}</p>
            </div>
          )}

          {/* Traceability */}
          {(bug.linkedTickets[0] || bug.tcRef) && (
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-2">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-petrol flex-shrink-0">Traceability</span>
              {bug.linkedTickets[0] && (
                <span className="font-mono text-[0.62rem] px-2 py-[2px] rounded-[2px]" style={{ background: "var(--petrol-dim)", color: "var(--petrol)" }}>
                  {bug.linkedTickets[0]}
                </span>
              )}
              {bug.tcRef && (
                <>
                  <span className="font-mono text-[0.6rem] text-text-2">→</span>
                  <span className="font-mono text-[0.62rem] px-2 py-[2px] rounded-[2px]" style={{ background: "var(--sage-dim)", color: "var(--sage)" }}>
                    {bug.tcRef}
                  </span>
                </>
              )}
              <>
                <span className="font-mono text-[0.6rem] text-text-2">→</span>
                <span className="font-mono text-[0.62rem] px-2 py-[2px] rounded-[2px]" style={{ background: "var(--ocre-dim)", color: "var(--ocre)" }}>
                  {bug.key}
                </span>
              </>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TestCaseCard({ tc }: { tc: TestCase }) {
  const [open, setOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);

  return (
    <div data-testid={`tcCard-${tc.id}`} className="rounded-[6px] border border-border overflow-hidden" style={{ background: "var(--surface)" }}>
      {/* Header */}
      <button
        data-testid={`tcToggle-${tc.id}`}
        onClick={() => {
          if (open) { setStepsOpen(false); setResultOpen(false); }
          setOpen(!open);
        }}
        className="w-full text-left px-5 py-4 cursor-pointer transition-opacity duration-150 hover:opacity-80"
        style={{ background: "transparent", borderBottom: open ? "1px solid var(--border)" : "none" }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2 flex-shrink-0 flex-wrap">
              <span className="font-mono text-[0.68rem] text-petrol tracking-[0.1em] uppercase">{tc.id}</span>
              <span className="font-mono text-[0.65rem] px-2 py-[2px] rounded-[2px]" style={{ background: "var(--sage-dim)", color: "var(--sage)" }}>
                Bug: {tc.bugId}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-mono text-[0.65rem] px-2 py-[2px] rounded-[2px]" style={{ background: "var(--pass-dim)", color: "var(--pass)" }}>
                ✓ {tc.status}
              </span>
              <span className="font-mono text-[0.7rem] text-text-2 transition-transform duration-200 inline-block" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="font-mono text-[0.65rem] px-2 py-[2px] rounded-[2px]" style={{ background: "var(--petrol-dim)", color: "var(--petrol)" }}>Env: {tc.environment}</span>
            <span className="font-mono text-[0.65rem] px-2 py-[2px] rounded-[2px]" style={{ background: "var(--petrol-dim)", color: "var(--petrol)" }}>{tc.device}</span>
            <span className="font-mono text-[0.65rem] px-2 py-[2px] rounded-[2px]" style={{ background: "var(--petrol-dim)", color: "var(--petrol)" }}>Browser: {tc.browser}</span>
          </div>
          <p className="font-display text-[0.98rem] text-text-1 leading-[1.35]">{tc.title}</p>
        </div>
      </button>

      {open && (
        <div className="flex flex-col">
          {/* Metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-border" style={{ background: "var(--surface-2)" }}>
            {[
              ["Discoverer", tc.discoverer],
              ["Test data", tc.testData],
              ["Fix commit", tc.fixCommit],
              ["Browser", tc.browser],
              ...(tc.ticketRef ? [["Ticket", tc.ticketRef]] : []),
              ...(tc.bugId     ? [["Defect",      tc.bugId]]   : []),
            ].map(([label, val]) => (
              <div key={label} className="px-4 py-3 flex flex-col gap-1 border-r border-border last:border-r-0">
                <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] opacity-60" style={{ color: "var(--text-2)" }}>{label}</span>
                <span className="font-mono text-[0.7rem] text-text-1">{val}</span>
              </div>
            ))}
          </div>

          {/* Preconditions */}
          <div className="px-5 py-4 border-b border-border">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.1em] mb-3" style={{ color: "var(--sage)" }}>Precondition</p>
            <ul className="flex flex-col gap-2">
              {tc.preconditions.map((p, i) => (
                <li key={i} data-testid={`tcPrecondition-${tc.id}-${i}`} className="font-mono text-[0.7rem] text-text-2 leading-[1.5] pl-4 relative">
                  <span className="absolute left-0" style={{ color: "var(--sage)" }}>→</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Steps collapsible */}
          <div className="border-b border-border">
            <button data-testid={`tcStepsToggle-${tc.id}`} onClick={() => setStepsOpen(!stepsOpen)} className="w-full flex items-center justify-between px-5 py-3 cursor-pointer hover:opacity-80" style={{ background: "var(--surface-2)", border: "none" }}>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-petrol">Steps to Reproduce</span>
              <span className="font-mono text-[0.7rem] text-text-2 transition-transform duration-200 inline-block" style={{ transform: stepsOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
            </button>
            {stepsOpen && (
              <div data-testid={`tcSteps-${tc.id}`} className="px-5 py-4 flex flex-col gap-0">
                {tc.steps.map((step, i) => (
                  <div key={i} data-testid={`tcStep-${tc.id}-${i}`} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center flex-shrink-0" style={{ width: 24 }}>
                      <div className="w-6 h-6 rounded-full border flex items-center justify-center font-mono text-[0.55rem] font-bold flex-shrink-0" style={{ borderColor: "var(--petrol)", background: "var(--petrol-dim)", color: "var(--petrol)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      {i < tc.steps.length - 1 && <div className="w-px flex-1 min-h-[20px]" style={{ background: "var(--border)" }} />}
                    </div>
                    <div className="pb-4 flex-1">
                      <p className="font-mono text-[0.72rem] text-text-1 leading-[1.4]">{step.action}</p>
                      <p className="font-mono text-[0.62rem] text-text-2 leading-[1.5] mt-1">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expected result collapsible */}
          <div>
            <button data-testid={`tcResultToggle-${tc.id}`} onClick={() => setResultOpen(!resultOpen)} className="w-full flex items-center justify-between px-5 py-3 cursor-pointer hover:opacity-80" style={{ background: "var(--surface-2)", border: "none" }}>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em]" style={{ color: "var(--pass)" }}>Expected Result</span>
              <span className="font-mono text-[0.7rem] text-text-2 transition-transform duration-200 inline-block" style={{ transform: resultOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
            </button>
            {resultOpen && (
              <div data-testid={`tcResult-${tc.id}`} className="px-5 py-4">
                <ul className="flex flex-col gap-2">
                  {tc.expectedResult.map((r, i) => (
                    <li key={i} data-testid={`tcExpectedResult-${tc.id}-${i}`} className="font-mono text-[0.7rem] text-text-2 leading-[1.5] pl-5 relative">
                      <span className="absolute left-0 font-bold" style={{ color: "var(--pass)" }}>✓</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkContent() {
  const { lang } = useLanguage();
  const t = workTranslations[lang];

  const [defects, setDefects] = useState<JiraDefect[]>([]);
  const [loadingDefects, setLoadingDefects] = useState(true);

  useEffect(() => {
    const fetchDefects = () =>
      fetch("/api/jira-defects")
        .then((r) => (r.ok ? r.json() : { defects: [] }))
        .then((d) => {
          const next = d.defects ?? [];
          setDefects((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
        })
        .catch(() => {});

    fetchDefects().finally(() => setLoadingDefects(false));
    const id = setInterval(fetchDefects, 8_000);
    return () => clearInterval(id);
  }, []);

  const detailByKey = Object.fromEntries(t.bugDetails.map((d) => [d.defKey, d]));
  const defToTC: Record<string, string> = {};
  for (const tc of t.testCases) {
    if (tc.bugId) defToTC[tc.bugId] = tc.id;
  }

  return (
    <>
      {/* Hero — fullscreen */}
      <section
        data-testid="workHeroSection"
        className="flex flex-col sm:flex-row border-b border-border"
        style={{ height: "100svh", overflow: "hidden" }}
      >
        {/* Left panel — teal */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-center gap-2 sm:gap-6
                     h-[80px] w-full sm:h-full sm:w-[clamp(160px,30%,300px)]"
          style={{ background: "#1B4242", padding: "1rem 1.5rem" }}
        >
          <div className="hidden sm:block"><WorkMark size={88} /></div>
          <div className="sm:hidden"><WorkMark size={38} /></div>
          <p className="hidden sm:block font-mono text-[0.6rem] uppercase tracking-[0.2em] text-center"
             style={{ color: "rgba(255,255,255,0.45)" }}>
            QA · WORK
          </p>
        </div>

        {/* Right panel — cream */}
        <div
          className="flex-1 flex flex-col justify-between overflow-hidden"
          style={{
            background: "#FAF5EE",
            padding: "clamp(1.8rem,6vw,4.5rem) clamp(1.5rem,5vw,4.5rem)",
          }}
        >
          <div className="flex flex-col justify-center flex-1">
            {/* Label + heading */}
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] mb-3"
               style={{ color: "#C96A2A" }}>
              {t.hero.label}
            </p>
            <h1
              data-testid="workHeroHeading"
              className="font-display leading-[1.08] tracking-[-0.02em] mb-4"
              style={{ fontSize: "clamp(2rem,5vw,3.8rem)", color: "#1A1A1A", maxWidth: "16ch" }}
            >
              {t.hero.heading}
            </h1>

            {/* Orange rule */}
            <div style={{ width: "3rem", height: "3px", background: "#C96A2A", borderRadius: "2px", marginBottom: "1.2rem" }} />

            {/* Subtitle */}
            <p
              data-testid="workHeroSubtitle"
              className="font-mono leading-[1.75] tracking-[0.01em] mb-8"
              style={{ fontSize: "clamp(0.8rem,1.2vw,0.88rem)", color: "#4A5A50", maxWidth: "48ch" }}
            >
              {t.hero.subtitle}
            </p>

            {/* Section preview cards — desktop only */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-[0.6rem] max-w-[640px]">
              {SECTION_KEYS.map((key) => {
                const section = t.sections[key];
                const { border } = SECTION_COLORS[key];
                const icon = SECTION_ICONS[key];
                return (
                  <a
                    key={key}
                    href={`#${key}`}
                    data-testid={`workHeroCard-${key}`}
                    className="flex items-start gap-3 p-4 rounded-[4px] border border-border no-underline transition-colors duration-150 hover:border-petrol group"
                    style={{ background: "rgba(27,66,66,0.04)", borderLeftColor: border, borderLeftWidth: 3 }}
                  >
                    <div className="flex-shrink-0 mt-[2px]">{icon}</div>
                    <div className="flex flex-col gap-[0.2rem]">
                      <p className="font-mono text-[0.63rem] uppercase tracking-[0.12em]"
                         style={{ color: "#1B4242" }}>
                        {section.label}
                      </p>
                      <p className="font-mono text-[0.67rem] leading-[1.55]"
                         style={{ color: "#4A5A50" }}>
                        {section.description}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Scroll cue — desktop only */}
          <div className="hidden sm:flex items-center gap-2 pt-4">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.15em]"
                  style={{ color: "#C96A2A", opacity: 0.65 }}>
              Scroll to explore
            </span>
            <span style={{ color: "#C96A2A", opacity: 0.65, fontSize: "0.8rem" }}>↓</span>
          </div>
        </div>
      </section>

      {/* Sections */}
      {SECTION_KEYS.map((key) => {
        const section = t.sections[key];
        const { bg, border } = SECTION_COLORS[key];
        const icon = SECTION_ICONS[key];

        return (
          <section
            key={key}
            id={key}
            data-testid={`workSection${key[0].toUpperCase() + key.slice(1)}`}
            className="py-14 sm:py-20 border-b border-border"
            style={{ background: bg }}
          >
            <div className="max-w-[920px] mx-auto px-5 sm:px-10">
              <RevealSection>
                <p className="font-mono text-[0.72rem] text-petrol uppercase tracking-[0.14em] mb-2">
                  {section.label}
                </p>
                <h2 data-testid={`workSectionHeading${key[0].toUpperCase() + key.slice(1)}`} className="font-display text-[1.9rem] sm:text-[2.25rem] leading-[1.12] tracking-[-0.015em] text-text-1 mb-3">
                  {section.heading}
                </h2>
                <p data-testid={`workSectionDesc${key[0].toUpperCase() + key.slice(1)}`} className="font-mono text-[0.8rem] text-text-2 mb-10 max-w-[50ch] leading-[1.7]">
                  {section.description}
                </p>

                {key === "sprintBoard" ? (
                  <SprintBoard bugReports={t.bugDetails} testCases={t.testCases} />
                ) : key === "testCases" ? (
                  <div className="flex flex-col gap-3">
                    {t.testCases.map((tc) => (
                      <TestCaseCard key={tc.id} tc={tc} />
                    ))}
                  </div>
                ) : key === "bugReports" ? (
                  <div className="flex flex-col gap-3">
                    {loadingDefects && defects.length === 0 ? (
                      <p className="font-mono text-[0.72rem] text-text-2 animate-pulse py-4">loading defects…</p>
                    ) : (
                      (defects.length > 0 ? defects : t.bugDetails.map((d) => ({
                        key: d.defKey, summary: d.defKey, status: "—", statusCategory: "",
                        priority: "—", url: "", linkedTickets: [] as string[],
                      } satisfies JiraDefect))).map((jiraDef) => {
                        const detail = detailByKey[jiraDef.key];
                        const merged: MergedBug = { ...jiraDef, ...detail, tcRef: defToTC[jiraDef.key] };
                        return <BugReportCard key={jiraDef.key} bug={merged} defaultOpen={false} />;
                      })
                    )}
                  </div>
                ) : key === "automation" ? (
                  <CypressStatusWidget />
                ) : key === "apiTesting" ? (
                  <APITesting />
                ) : key === "analytics" ? (
                  <QAAnalytics />
                ) : (
                  <div
                    className="rounded-[6px] border-2 border-dashed flex flex-col items-center justify-center py-16 gap-4"
                    style={{ borderColor: border }}
                  >
                    <div
                      className="w-12 h-12 rounded-[6px] flex items-center justify-center"
                      style={{ background: "var(--surface)" }}
                    >
                      {icon}
                    </div>
                    <p className="font-mono text-[0.75rem] text-text-2 tracking-[0.06em]">
                      {section.empty}
                    </p>
                  </div>
                )}
              </RevealSection>
            </div>
          </section>
        );
      })}
    </>
  );
}

function WorkMark({ size = 88 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="none" aria-hidden>
      <style>{`
        @keyframes wm-draw  { to { stroke-dashoffset: 0; } }
        @keyframes wm-fade  { to { opacity: 1; } }
        @keyframes wm-state {
          0%   { opacity: 0; }
          15%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes wm-center-color {
          0%   { fill: #C96A2A; }
          35%  { fill: #C96A2A; }
          42%  { fill: #6B1A1A; }
          70%  { fill: #6B1A1A; }
          77%  { fill: #64731e; }
          100% { fill: #64731e; }
        }
        @keyframes wm-spin-cw  { to { transform: rotate(360deg);  } }
        @keyframes wm-spin-ccw { to { transform: rotate(-360deg); } }

        .wm-group-outer, .wm-group-inner {
          transform-box: fill-box;
          transform-origin: center;
        }
        .wm-group-outer { animation: wm-spin-cw  1.05s cubic-bezier(0.4,0,0.05,1) 0.96s forwards; }
        .wm-group-inner { animation: wm-spin-ccw 1.05s cubic-bezier(0.4,0,0.05,1) 0.96s forwards; }

        .wm-orbit-outer {
          stroke-dasharray: 1; stroke-dashoffset: 1;
          animation: wm-draw 0.53s cubic-bezier(0.4,0,0.2,1) 0.09s forwards;
        }
        .wm-orbit-inner {
          stroke-dasharray: 1; stroke-dashoffset: 1;
          animation: wm-draw 0.44s cubic-bezier(0.4,0,0.2,1) 0.48s forwards;
        }
        .wm-center {
          opacity: 0;
          animation:
            wm-fade         0.24s ease-out    0.89s forwards,
            wm-center-color 1.61s ease-in-out 0.89s forwards;
        }
        .wm-dot { opacity: 0; }
        .wm-dot-1 { animation: wm-fade 0.15s ease-out 0.28s forwards; }
        .wm-dot-2 { animation: wm-fade 0.15s ease-out 0.60s forwards; }
        .wm-dot-3 { animation: wm-fade 0.15s ease-out 0.76s forwards; }
        .wm-dot-4 { animation: wm-fade 0.15s ease-out 0.84s forwards; }

        /* Magnifier — searching */
        .wm-lupa { opacity: 0; animation: wm-state 0.60s ease-in-out 0.96s forwards; }
        /* Bug — found */
        .wm-bug  { opacity: 0; animation: wm-state 0.56s ease-in-out 1.45s forwards; }
        /* Success — resolved */
        .wm-win  {
          opacity: 0;
          animation: wm-fade 0.49s cubic-bezier(0.22,1,0.36,1) 2.01s forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .wm-orbit-outer, .wm-orbit-inner { stroke-dashoffset: 0 !important; animation: none; }
          .wm-group-outer, .wm-group-inner { animation: none; }
          .wm-center { opacity: 1 !important; fill: #64731e !important; animation: none; }
          .wm-dot { opacity: 1 !important; animation: none; }
          .wm-lupa, .wm-bug { display: none; }
          .wm-win { opacity: 1 !important; animation: none; }
        }
      `}</style>

      {/* Outer orbit + dots — clockwise */}
      <g className="wm-group-outer">
        <circle className="wm-orbit-outer" cx="44" cy="44" r="40"
          stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" pathLength="1" />
        <circle className="wm-dot wm-dot-1" cx="44" cy="4"  r="2.5" fill="rgba(255,255,255,0.4)" />
        <circle className="wm-dot wm-dot-2" cx="84" cy="44" r="2"   fill="rgba(255,255,255,0.25)" />
        <circle className="wm-dot wm-dot-3" cx="44" cy="84" r="2"   fill="rgba(255,255,255,0.2)" />
        <circle className="wm-dot wm-dot-4" cx="4"  cy="44" r="2"   fill="rgba(255,255,255,0.2)" />
      </g>

      {/* Inner orbit — counter-clockwise */}
      <g className="wm-group-inner">
        <circle className="wm-orbit-inner" cx="44" cy="44" r="30"
          stroke="rgba(255,255,255,0.08)" strokeWidth="1" pathLength="1" />
      </g>

      {/* Center — orange → bordeaux → olive green */}
      <circle className="wm-center" cx="44" cy="44" r="22" fill="#C96A2A" />

      {/* Magnifier — searching for bug */}
      <g className="wm-lupa">
        <circle cx="41" cy="41" r="7" stroke="white" strokeWidth="2" />
        <line x1="46.5" y1="46.5" x2="53" y2="53" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* 🐛 BUG — encontrado */}
      <g className="wm-bug">
        {/* Head */}
        <circle cx="44" cy="37" r="4" stroke="#FF9090" strokeWidth="1.75" />
        {/* Body */}
        <ellipse cx="44" cy="48" rx="6" ry="7" stroke="#FF9090" strokeWidth="1.75" />
        {/* Antennae */}
        <line x1="41" y1="33" x2="38" y2="29" stroke="#FF9090" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="47" y1="33" x2="50" y2="29" stroke="#FF9090" strokeWidth="1.5" strokeLinecap="round" />
        {/* Left legs */}
        <line x1="38" y1="44" x2="33" y2="42" stroke="#FF9090" strokeWidth="1.25" strokeLinecap="round" />
        <line x1="38" y1="48" x2="33" y2="49" stroke="#FF9090" strokeWidth="1.25" strokeLinecap="round" />
        <line x1="38" y1="52" x2="33" y2="54" stroke="#FF9090" strokeWidth="1.25" strokeLinecap="round" />
        {/* Right legs */}
        <line x1="50" y1="44" x2="55" y2="42" stroke="#FF9090" strokeWidth="1.25" strokeLinecap="round" />
        <line x1="50" y1="48" x2="55" y2="49" stroke="#FF9090" strokeWidth="1.25" strokeLinecap="round" />
        <line x1="50" y1="52" x2="55" y2="54" stroke="#FF9090" strokeWidth="1.25" strokeLinecap="round" />
      </g>

      {/* Success — medal/badge */}
      <g className="wm-win">
        {/* Círculo de medalla */}
        <circle cx="44" cy="41" r="8" stroke="#C4D96E" strokeWidth="1.75" />
        {/* Left ribbon */}
        <line x1="39" y1="48" x2="35" y2="56" stroke="#C4D96E" strokeWidth="2" strokeLinecap="round" />
        {/* Right ribbon */}
        <line x1="49" y1="48" x2="53" y2="56" stroke="#C4D96E" strokeWidth="2" strokeLinecap="round" />
        {/* Inner check */}
        <polyline points="40,41 43,44 50,36" stroke="#C4D96E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
