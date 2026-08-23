export default function FallingLeaves() {
  const leaves = ["🍃", "🍂", "🍁", "🌿", "🍃", "🍂"];
  return (
    <div className="falling-leaves-global" aria-hidden="true">
      {leaves.map((emoji, i) => (
        <span
          key={i}
          className="falling-leaf"
          style={{
            left: `${[6, 22, 38, 56, 72, 88][i]}%`,
            fontSize: `${[18, 14, 22, 16, 20, 15][i]}px`,
            animationDuration: `${[14, 12, 16, 13, 15, 17][i]}s, ${[3.2, 2.8, 3.6, 3, 3.4, 2.9][i]}s`,
            animationDelay: `${[0, 1.1, 0.5, 1.8, 0.3, 2][i]}s, ${[0, 0.2, 0.1, 0.4, 0.3, 0.5][i]}s`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}
