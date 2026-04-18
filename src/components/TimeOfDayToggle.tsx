import type { TimeOfDay } from "../types/pokemon";

interface TimeOfDayToggleProps {
  options: TimeOfDay[];
  selectedTime: TimeOfDay | "";
  onChange: (time: TimeOfDay | "") => void;
}

export function TimeOfDayToggle({ options, selectedTime, onChange }: TimeOfDayToggleProps) {
  if (!options.length) {
    return null;
  }

  return (
    <div className="time-toggle" aria-label="Time of day filter">
      <button className={selectedTime === "" ? "is-selected" : ""} type="button" onClick={() => onChange("")}>
        All
      </button>
      {options.map((time) => (
        <button
          key={time}
          className={selectedTime === time ? "is-selected" : ""}
          type="button"
          onClick={() => onChange(time)}
        >
          {time}
        </button>
      ))}
    </div>
  );
}
