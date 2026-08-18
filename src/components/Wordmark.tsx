import { SproutIcon } from "./icons";

export default function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className={`wordmark${light ? " wordmark--light" : ""}`}>
      <SproutIcon size={20} />
      Small Steps
    </span>
  );
}
