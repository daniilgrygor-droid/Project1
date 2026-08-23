export default function FallingLeaves() {
  const leaves = ["🍃","🍂","🍁","🌿","🍃","🍂","🍁","🌿","🍃","🍂","🍁","🌿","🍃","🍂","🍁","🌿","🍃","🍂"];
  const lefts = [2, 8, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 91, 96, 5, 18, 33];
  const sizes = [15, 19, 13, 17, 20, 14, 16, 18, 12, 21, 15, 17, 13, 20, 16, 14, 18, 15];
  const durations = [10, 12, 9, 11, 13, 10, 12, 9, 11, 13, 10, 12, 9, 11, 10, 12, 9, 11];
  const sways = [2.8, 3.2, 2.5, 3, 2.9, 2.6, 3.1, 2.7, 3.3, 2.4, 2.8, 3, 2.6, 3.2, 2.7, 2.9, 2.5, 3.1];
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
            animationDelay: `${(i * 0.65) % 11}s, ${(i * 0.35) % 3}s`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}
