import { useEffect, useState } from "react";
import { getPokeMmoClockState } from "../lib/pokemmoClock";

export function WorldTracker() {
  const [clockState, setClockState] = useState(() => getPokeMmoClockState());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockState(getPokeMmoClockState());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="world-tracker" aria-label="Current PokeMMO world state">
      <div>
        <span>Season</span>
        <strong>{clockState.season}</strong>
        <small>{clockState.seasonMonth}</small>
      </div>
      <div>
        <span>In-game time</span>
        <strong>{clockState.gameTime}</strong>
        <small>
          {clockState.phase} · {clockState.nextPhase} in {clockState.nextPhaseIn}
        </small>
      </div>
    </section>
  );
}
