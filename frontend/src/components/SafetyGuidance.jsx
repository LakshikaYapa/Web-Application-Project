const guides = [
  {
    id: "before", title: "Before a flood", description: "Get ready early",
    icon: "M8 4h8v4H8zM8 6H5v15h14V6h-3M8 12h8M8 16h6",
    tips: [
      "Pack drinking water, ready-to-eat food, medicines and a torch.",
      "Keep important documents in a waterproof bag.",
      "Choose a safe place on higher ground and plan how to get there.",
      "Charge your phone and follow local flood warnings.",
    ],
  },
  {
    id: "during", title: "During a flood", description: "Move to safety",
    icon: "M2 7c3-4 5 4 8 0s5 4 8 0 4 0 4 0M2 12c3-4 5 4 8 0s5 4 8 0 4 0 4 0M2 17c3-4 5 4 8 0s5 4 8 0 4 0 4 0",
    tips: [
      "Move to higher ground. Follow evacuation instructions promptly.",
      "Do not walk, swim or drive through floodwater.",
      "Keep children away from floodwater and drains.",
      "Stay away from fallen power lines and wet electrical equipment.",
    ],
  },
  {
    id: "after", title: "After a flood", description: "Return carefully",
    icon: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6z",
    tips: [
      "Return home only when local authorities say it is safe.",
      "Avoid damaged buildings and standing floodwater.",
      "Use safe bottled water until authorities confirm tap water is safe.",
      "Have a qualified electrician check flooded wiring before using it.",
    ],
  },
  {
    id: "emergency", title: "Get emergency help", description: "Explain where you are",
    icon: "M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 5a2 2 0 0 1 2-2Z",
    tips: [
      "In Sri Lanka, call the Disaster Management Centre on 117 for disaster assistance.",
      "Give your location, a nearby landmark and the number of people needing help.",
      "If trapped, move to the highest safe place and signal for help.",
      "Do not enter floodwater to attempt a rescue. Call trained rescuers.",
    ],
  },
];

export default function SafetyGuidance() {
  return (
    <section className="safety-section" aria-labelledby="safety-title">
      <div className="volunteers-heading">
        <div>
          <h2 id="safety-title">Safety guidance</h2>
          <p>Simple steps to help you and your family stay safe.</p>
        </div>
      </div>
      <ul className="safety-grid">
        {guides.map(({ id, title, description, icon, tips }) => (
          <li className={`safety-card safety-${id}`} key={id}>
            <div className="safety-card-heading">
              <span className="safety-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg></span>
              <div className="safety-card-text"><h3>{title}</h3><span>{description}</span></div>
            </div>
            <ul className="safety-tips">
              {tips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          </li>
        ))}
      </ul>
      <p className="volunteers-note">Always follow current instructions from local authorities. Flood conditions can change quickly.</p>
    </section>
  );
}
