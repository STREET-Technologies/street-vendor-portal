type Step = "store" | "password" | "hours" | "live";

const STEPS: { id: Step; label: string }[] = [
  { id: "store", label: "Your store" },
  { id: "password", label: "Set password" },
  { id: "hours", label: "Operating hours" },
  { id: "live", label: "Go live" },
];

export default function OnboardingSidebar({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <aside className="apply-side">
      <h3>Onboarding</h3>
      <ol>
        <li className="done"><span>Install Shopify app</span></li>
        {STEPS.map((step, i) => {
          const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "";
          return (
            <li key={step.id} className={state}>
              <span>{step.label}</span>
            </li>
          );
        })}
      </ol>
      <p className="save-note"><b>Progress saved.</b> You can close this tab and continue later from the same browser.</p>
    </aside>
  );
}
