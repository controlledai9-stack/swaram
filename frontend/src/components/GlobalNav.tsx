import { useAppState } from "../state";
import { CustomSelect } from "./CustomSelect";

export interface NavItem {
  id: string;
  path: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", path: "#/", label: "Dashboard" },
  { id: "live", path: "#/live", label: "Live Guard" },
  { id: "incidents", path: "#/incidents", label: "Incidents" },
  { id: "assurance", path: "#/assurance", label: "Assurance" },
  { id: "pipeline", path: "#/pipeline/simulator", label: "Pipeline" },
];

export function GlobalNav({ currentRoute }: { currentRoute: string }) {
  const { runs, selectedRunId, selectRun, health } = useAppState();

  const isCurrent = (id: string) => {
    if (id === "dashboard" || id === "overview") return currentRoute === "" || currentRoute === "dashboard" || currentRoute === "overview" || currentRoute === "/";
    if (id === "live") return currentRoute.startsWith("live") || currentRoute.startsWith("swarm");
    if (id === "incidents") return currentRoute.startsWith("incidents") || currentRoute.startsWith("responses");
    if (id === "assurance") return currentRoute.startsWith("assurance") || currentRoute.startsWith("owasp") || currentRoute.startsWith("coverage") || currentRoute.startsWith("evaluation");
    if (id === "pipeline") return currentRoute.startsWith("pipeline") || currentRoute.startsWith("simulator") || currentRoute.startsWith("collector") || currentRoute.startsWith("detection");
    return currentRoute.startsWith(id);
  };

  return (
    <header className="sticky top-0 z-40 h-12 w-full border-b border-[var(--hairline)]/60 bg-[var(--glass)] backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 sm:px-6">
        {/* Left Wordmark */}
        <a href="#/" className="shrink-0 flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[var(--text)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--text)] text-[var(--bg)]">
            <svg width="13" height="15" viewBox="0 0 16 18" fill="none" aria-hidden>
              <path d="M8 1.2l6 2.3v4.8c0 4-2.6 7.2-6 8.5-3.4-1.3-6-4.5-6-8.5V3.5l6-2.3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M5.3 9l1.9 1.9 3.6-3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>SwaramGuard</span>
        </a>

        {/* Center Nav Links */}
        <nav className="flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const active = isCurrent(item.id);
            return (
              <a
                key={item.id}
                href={item.path}
                aria-current={active ? "page" : undefined}
                className={`relative py-3 text-[14px] transition-colors ${
                  active
                    ? "font-medium text-[var(--text)]"
                    : "text-[var(--text-2)] hover:text-[var(--text)]"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--accent)]" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right Controls: Run Selector & Health Indicator */}
        <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
          {runs.length > 0 && (
            <div className="w-[150px] sm:w-[260px]">
              <CustomSelect
                value={selectedRunId ?? ""}
                onChange={(val) => selectRun(val || null)}
                options={runs.map((r) => ({
                  value: r.run_id,
                  label: `${r.run_id} (${r.scenario_id.replace(/_/g, " ")})`,
                  description: `${r.agent_count} agents · ${r.stages?.detected ? "detected" : "in progress"}`,
                }))}
                size="sm"
                variant="pill"
                align="right"
                ariaLabel="Select active run"
              />
            </div>
          )}

          {health && (
            <span
              className="h-2 w-2 rounded-full bg-[var(--ok)]"
              title={`Connected (${health.storage})`}
              aria-label="Database connected"
            />
          )}

        </div>
      </div>
    </header>
  );
}
