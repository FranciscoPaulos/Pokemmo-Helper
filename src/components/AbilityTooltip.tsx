import { useRef, useState } from "react";
import { formatAbilityName } from "../features/pokemon/formatPokemon";
import { getAbilityDescription } from "../lib/abilityDescriptions";

interface AbilityTooltipProps {
  abilityName: string;
}

type TooltipStatus = "idle" | "loading" | "loaded" | "error";

interface TooltipPosition {
  left: number;
  top: number;
  placement: "above" | "below";
}

const tooltipWidth = 290;
const viewportPadding = 12;
const tooltipOffset = 8;

export function AbilityTooltip({ abilityName }: AbilityTooltipProps) {
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TooltipStatus>("idle");
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  function updatePosition() {
    const button = buttonRef.current;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - tooltipWidth / 2, viewportPadding),
      window.innerWidth - tooltipWidth - viewportPadding
    );
    const hasRoomAbove = rect.top > 150;
    const top = hasRoomAbove ? rect.top - tooltipOffset : rect.bottom + tooltipOffset;

    setPosition({ left, top, placement: hasRoomAbove ? "above" : "below" });
  }

  async function loadDescription() {
    updatePosition();

    if (status === "loading" || status === "loaded") {
      return;
    }

    setStatus("loading");

    try {
      setDescription(await getAbilityDescription(abilityName));
      setStatus("loaded");
    } catch {
      setDescription("No description available yet.");
      setStatus("error");
    }
  }

  return (
    <span className="ability-tooltip-wrap" onMouseEnter={loadDescription} onFocus={loadDescription}>
      <button ref={buttonRef} className="ability-chip" type="button">
        {formatAbilityName(abilityName)}
      </button>
      <span
        className={`ability-tooltip ability-tooltip--${position?.placement ?? "above"}`}
        role="tooltip"
        style={
          position
            ? {
                left: `${position.left}px`,
                top: `${position.top}px`
              }
            : undefined
        }
      >
        <strong>{formatAbilityName(abilityName)}</strong>
        <span>
          {status === "idle" ? "Hover to load description." : null}
          {status === "loading" ? "Loading description..." : null}
          {status === "loaded" || status === "error" ? description : null}
        </span>
      </span>
    </span>
  );
}
