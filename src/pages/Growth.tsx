import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import Plant from "../components/Plant";
import { DotIcon, LeafIcon } from "../components/icons";
import type { Step } from "../lib/types";
import { PLANT_STAGES, plantStageIndexFor } from "../lib/constants";
import { fetchSteps } from "../lib/steps";
import { showedUpDaysThisMonth } from "../lib/stats";

interface Milestone {
  minSteps: number;
  label: string;
  reachedAt: string | null;
  reached: boolean;
}

export default function Growth() {
  const [steps, setSteps] = useState<Step[] | null>(null);

  useEffect(() => {
    void fetchSteps().then(setSteps);
  }, []);

  const milestones = useMemo<Milestone[] | null>(() => {
    if (!steps) return null;
    const sorted = [...steps].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    return PLANT_STAGES.map((stage) => {
      const at = sorted.find((_, i) => i + 1 >= stage.minSteps);
      return {
        minSteps: stage.minSteps,
        label: stage.label,
        reached: steps.length >= stage.minSteps,
        reachedAt: at?.created_at ?? null,
      };
    });
  }, [steps]);

  const stageIndex = useMemo(
    () => (steps ? plantStageIndexFor(steps.length) : -1),
    [steps],
  );

  const total = steps?.length ?? 0;
  const daysThisMonth = useMemo(
    () => (steps ? showedUpDaysThisMonth(steps) : 0),
    [steps],
  );

  const loading = !steps;
  const currentStage = stageIndex >= 0 ? PLANT_STAGES[stageIndex] : null;
  const nextStage = stageIndex >= 0 ? PLANT_STAGES[stageIndex + 1] : PLANT_STAGES[0];
  const toNext = nextStage ? nextStage.minSteps - total : 0;

  return (
    <AppShell>
      <div className="growth">
        <div className="growth-head">
          <span className="head-eyebrow">
            <LeafIcon size={13} />
            Becoming
          </span>
          <h1>Growth</h1>
          <p>
            A quiet metaphor: small actions, over time, become something
            visible.
          </p>
        </div>

        {loading ? (
          <div
            className="sk-growth"
            aria-busy="true"
            aria-label="Loading your plant"
          >
            <span className="skeleton sk-plant-disc" />
            <span className="skeleton skeleton--head" />
            <div className="sk-stage-dots">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="skeleton sk-stage-dot" />
              ))}
            </div>
          </div>
        ) : total === 0 ? (
          <div className="steps-empty steps-empty--story">
            <span className="steps-empty-plant">
              <LeafIcon size={20} />
            </span>
            <p>Nothing planted yet — your plant starts here.</p>
            <Link className="btn btn--primary btn--sm steps-empty-cta" to="/check-in">
              Mark your first step
            </Link>
          </div>
        ) : (
          <>
            <div className="growth-plant">
              <Plant steps={total} size={320} />
            </div>

            <p className="growth-stage" key={stageIndex}>
              {currentStage?.label}.{" "}
              <span className="growth-stage-desc">
                {currentStage?.description}
              </span>
            </p>

            {total < 50 && nextStage ? (
              <div className="growth-stages" aria-label="Growth stages">
                <div className="growth-stages-track">
                  {PLANT_STAGES.map((st, i) => (
                    <span
                      key={st.minSteps}
                      className={`growth-stage-dot${
                        i <= stageIndex
                          ? " growth-stage-dot--reached"
                          : i === stageIndex + 1
                            ? " growth-stage-dot--current"
                            : ""
                      }`}
                      style={{ animationDelay: `${i * 0.06}s` }}
                      title={st.label}
                    />
                  ))}
                </div>
                <div className="growth-stage-labels" aria-hidden="true">
                  {PLANT_STAGES.map((st, i) => (
                    <span
                      key={st.minSteps}
                      className={i <= stageIndex ? "growth-stage-label--reached" : undefined}
                    >
                      {st.label.replace(/^A /, "")}
                    </span>
                  ))}
                </div>
                <p className="growth-next">
                  {toNext} step{toNext === 1 ? "" : "s"} to go — until{" "}
                  {nextStage.label.toLowerCase()}. No rush.
                </p>
              </div>
            ) : (
              <p className="growth-next">Quietly thriving. No rush.</p>
            )}

            <p className="progress-gentle">
              {total} small step{total === 1 ? "" : "s"} so far · you showed up
              on {daysThisMonth} day{daysThisMonth === 1 ? "" : "s"} this month.
            </p>

            <section className="growth-history">
              <h2>Growth so far</h2>
              {milestones && (
                <ol className="milestone-timeline">
                  {milestones.map((m) => (
                    <li
                      key={m.minSteps}
                      className={`milestone-node${
                        m.reached ? " milestone-node--reached" : ""
                      }`}
                    >
                      <span className="milestone-node-marker">
                        {m.reached ? (
                          <LeafIcon size={15} />
                        ) : (
                          <DotIcon size={12} />
                        )}
                      </span>
                      <div className="milestone-node-body">
                        <span className="milestone-node-label">{m.label}</span>
                        <span className="milestone-node-meta">
                          {m.reached
                            ? m.reachedAt
                              ? `reached on ${new Date(
                                  m.reachedAt,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}`
                              : "reached"
                            : `${total} of ${m.minSteps} steps`}
                        </span>
                        {!m.reached && (
                          <span className="milestone-node-track">
                            <span
                              className="milestone-node-fill"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (total / m.minSteps) * 100,
                                )}%`,
                              }}
                            />
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}