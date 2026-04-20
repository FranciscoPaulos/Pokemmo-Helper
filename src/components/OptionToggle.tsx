interface OptionToggleProps<Value extends string> {
  label: string;
  options: Value[];
  selectedValue: Value | "";
  onChange: (value: Value | "") => void;
}

export function OptionToggle<Value extends string>({ label, options, selectedValue, onChange }: OptionToggleProps<Value>) {
  if (!options.length) {
    return null;
  }

  return (
    <div className="toggle-filter">
      <span>{label}</span>
      <div className="time-toggle" aria-label={`${label} filter`}>
        <button className={selectedValue === "" ? "is-selected" : ""} type="button" onClick={() => onChange("")}>
          All
        </button>
        {options.map((option) => (
          <button
            key={option}
            className={selectedValue === option ? "is-selected" : ""}
            type="button"
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
