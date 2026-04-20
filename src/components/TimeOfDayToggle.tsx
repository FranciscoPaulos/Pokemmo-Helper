import type { TimeOfDay } from "../types/pokemon";
import { OptionToggle } from "./OptionToggle";

interface TimeOfDayToggleProps {
  options: TimeOfDay[];
  selectedTime: TimeOfDay | "";
  onChange: (time: TimeOfDay | "") => void;
}

export function TimeOfDayToggle({ options, selectedTime, onChange }: TimeOfDayToggleProps) {
  return <OptionToggle label="Time" options={options} selectedValue={selectedTime} onChange={onChange} />;
}
