import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import Plant from "../components/Plant";
import { LeafIcon } from "../components/icons";

export default function NotFound() {
  return (
    <AppShell>
      <div className="notfound">
        <div className="notfound-art">
          <Plant steps={0} size={150} showLabel={false} />
        </div>
        <span className="head-eyebrow">
          <LeafIcon size={13} />
          Off the path
        </span>
        <h1>This path wandered off.</h1>
        <p>
          There's nothing planted here — but your journal is right back that
          way.
        </p>
        <div className="notfound-actions">
          <Link to="/check-in" className="btn btn--primary">
            Back to the journal
          </Link>
          <Link to="/" className="btn btn--ghost">
            Go home
          </Link>
        </div>
      </div>
    </AppShell>
  );
}