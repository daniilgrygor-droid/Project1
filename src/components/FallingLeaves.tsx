import { LeafIcon } from "./icons";

export default function FallingLeaves() {
  return (
    <div className="falling-leaves-global" aria-hidden="true">
      <span className="falling-leaf" style={{ left: "4%", animationDuration: "15s, 3.5s", animationDelay: "0s, 0s" }}>
        <LeafIcon size={16} />
      </span>
      <span className="falling-leaf" style={{ left: "18%", animationDuration: "13s, 2.8s", animationDelay: "1.2s, 0.3s" }}>
        <LeafIcon size={12} />
      </span>
      <span className="falling-leaf" style={{ left: "32%", animationDuration: "16s, 3.8s", animationDelay: "0.6s, 0.1s" }}>
        <LeafIcon size={20} />
      </span>
      <span className="falling-leaf" style={{ left: "52%", animationDuration: "14s, 3.2s", animationDelay: "2.1s, 0.6s" }}>
        <LeafIcon size={14} />
      </span>
      <span className="falling-leaf" style={{ left: "68%", animationDuration: "12s, 2.5s", animationDelay: "0.3s, 0.2s" }}>
        <LeafIcon size={18} />
      </span>
      <span className="falling-leaf" style={{ left: "84%", animationDuration: "17s, 4s", animationDelay: "1.8s, 0.4s" }}>
        <LeafIcon size={13} />
      </span>
    </div>
  );
}
