import { useState } from "react";
import AppShell from "../components/AppShell";
import { JourneyTimeline } from "./Journey";
import { ProgressOverview } from "./Progress";

type JourneyTab = "timeline" | "overview";

export default function JourneyOverview() {
  const [tab, setTab] = useState<JourneyTab>("timeline");

  return (
    <AppShell>
      <div className="journey-merged">
        <div className="page-tabs" role="tablist" aria-label="Journey views">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "timeline"}
            className={`page-tab${tab === "timeline" ? " page-tab--on" : ""}`}
            onClick={() => setTab("timeline")}
          >
            Timeline
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "overview"}
            className={`page-tab${tab === "overview" ? " page-tab--on" : ""}`}
            onClick={() => setTab("overview")}
          >
            Overview
          </button>
        </div>
        <div
          className={`journey-tab-pane${
            tab === "timeline" ? " journey-tab-pane--active" : ""
          }`}
          role="tabpanel"
        >
          <JourneyTimeline />
        </div>
        <div
          className={`journey-tab-pane${
            tab === "overview" ? " journey-tab-pane--active" : ""
          }`}
          role="tabpanel"
        >
          <ProgressOverview />
        </div>
      </div>
    </AppShell>
  );
}
