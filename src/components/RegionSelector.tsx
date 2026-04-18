import type { RegionRouteGroup } from "../types/pokemon";

interface RegionSelectorProps {
  regions: RegionRouteGroup[];
  selectedRegionKey: string | undefined;
  onRegionSelect: (region: RegionRouteGroup) => void;
}

export function RegionSelector({ regions, selectedRegionKey, onRegionSelect }: RegionSelectorProps) {
  return (
    <div className="region-selector">
      <p className="eyebrow">Regions</p>
      <div className="region-list">
        {regions.map((region) => (
          <button
            key={region.regionKey}
            className={region.regionKey === selectedRegionKey ? "is-selected" : ""}
            type="button"
            onClick={() => onRegionSelect(region)}
          >
            <span>{region.displayName}</span>
            <strong>{region.routes.length}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
