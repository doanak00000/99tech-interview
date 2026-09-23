import { useState } from "react";
import { iconUrl } from "../lib/tokens";

interface Props {
  symbol: string;
  size?: number;
}

/** Token logo with a lettered fallback when the icon repo has no image. */
export function TokenIcon({ symbol, size = 28 }: Props) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };

  if (failed) {
    return (
      <span className="token-icon token-icon--fallback" style={style} aria-hidden="true">
        {symbol.replace(/^[a-z]+/, "").slice(0, 2) || symbol.slice(0, 2)}
      </span>
    );
  }
  return (
    <img
      className="token-icon"
      style={style}
      src={iconUrl(symbol)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
