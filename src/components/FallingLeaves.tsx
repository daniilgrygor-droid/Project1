export default function FallingLeaves() {
  const leaves = ["🍃", "🍂", "🍁", "🌿", "🍃", "🍂", "🍁", "🌿", "🍃", "🍂", "🍁", "🌿"];
  const lefts = [3, 11, 19, 27, 35, 44, 53, 62, 71, 79, 87, 95];
  const sizes = [16, 20, 14, 18, 12, 22, 15, 19, 13, 17, 21, 14];
  const durations = [9, 11, 8, 10, 12, 9, 11, 10, 13, 8, 12, 10];
  const sways = [2.6, 3, 2.4, 3.2, 2.8, 2.5, 3.1, 2.7, 3.3, 2.4, 2.9, 3];
  const delays = [0, 0.7, 0.3, 1.2, 0.5, 1.5, 0.2, 0.9, 1.8, 0.4, 1, 0.6];
  return (
    <div className="falling-leaves-global" aria-hidden="true">
      {leaves.map((emoji, i) => (
        <span
          key={i}
          className="falling-leaf"
          style={{
            left: `${lefts[i]}%`,
            fontSize: `${sizes[i]}px`,
            animationDuration: `${durations[i]}s, ${sways[i]}s`,
            animationDelay: `${delays[i]}s, ${delays[i] * 0.4}s`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}
