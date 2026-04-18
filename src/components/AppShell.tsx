import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

interface AppShellProps {
  sidebar: ReactNode;
  map: ReactNode;
  details: ReactNode;
}

const sidebarBounds = {
  min: 190,
  max: 430,
  default: 280
};

const rightPanelBounds = {
  min: 360,
  max: 980,
  default: 430
};

const minimumContentWidth = 520;
const storageKey = "pokemmo-layout-columns";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getStoredColumns(): { sidebarWidth: number; detailsWidth: number } {
  try {
    const stored = window.localStorage.getItem(storageKey);

    if (!stored) {
      return {
        sidebarWidth: sidebarBounds.default,
        detailsWidth: rightPanelBounds.default
      };
    }

    const parsed = JSON.parse(stored) as Partial<{ sidebarWidth: number; detailsWidth: number }>;

    return {
      sidebarWidth: parsed.sidebarWidth ?? sidebarBounds.default,
      detailsWidth: parsed.detailsWidth ?? rightPanelBounds.default
    };
  } catch {
    return {
      sidebarWidth: sidebarBounds.default,
      detailsWidth: rightPanelBounds.default
    };
  }
}

export function AppShell({ sidebar, map, details }: AppShellProps) {
  const [sidebarWidth, setSidebarWidth] = useState(() => getStoredColumns().sidebarWidth);
  const [detailsWidth, setDetailsWidth] = useState(() => getStoredColumns().detailsWidth);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ sidebarWidth, detailsWidth }));
  }, [detailsWidth, sidebarWidth]);

  const gridTemplateColumns = useMemo(
    () => `${sidebarWidth}px 8px minmax(${minimumContentWidth}px, 1fr) 8px ${detailsWidth}px`,
    [detailsWidth, sidebarWidth]
  );

  function resizeSidebar(startX: number, startSidebarWidth: number) {
    function handlePointerMove(event: PointerEvent) {
      const maxSidebarWidth = Math.max(
        sidebarBounds.min,
        Math.min(sidebarBounds.max, window.innerWidth - detailsWidth - minimumContentWidth - 16)
      );
      setSidebarWidth(clamp(startSidebarWidth + event.clientX - startX, sidebarBounds.min, maxSidebarWidth));
    }

    function stopResize() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      document.body.classList.remove("is-resizing-layout");
    }

    document.body.classList.add("is-resizing-layout");
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
  }

  function resizeDetails(startX: number, startDetailsWidth: number) {
    function handlePointerMove(event: PointerEvent) {
      const maxDetailsWidth = Math.max(
        rightPanelBounds.min,
        Math.min(rightPanelBounds.max, window.innerWidth - sidebarWidth - minimumContentWidth - 16)
      );
      setDetailsWidth(clamp(startDetailsWidth + startX - event.clientX, rightPanelBounds.min, maxDetailsWidth));
    }

    function stopResize() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      document.body.classList.remove("is-resizing-layout");
    }

    document.body.classList.add("is-resizing-layout");
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
  }

  function resetColumns() {
    setSidebarWidth(sidebarBounds.default);
    setDetailsWidth(rightPanelBounds.default);
  }

  return (
    <div className="app-shell" style={{ gridTemplateColumns }}>
      <aside className="sidebar">{sidebar}</aside>
      <button
        className="layout-resizer"
        type="button"
        aria-label="Resize routes section"
        title="Drag to resize routes"
        onDoubleClick={resetColumns}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          resizeSidebar(event.clientX, sidebarWidth);
        }}
      />
      <main className="details-panel details-panel--center">{details}</main>
      <button
        className="layout-resizer"
        type="button"
        aria-label="Resize route details section"
        title="Drag to resize route details"
        onDoubleClick={resetColumns}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          resizeDetails(event.clientX, detailsWidth);
        }}
      />
      <section className="map-panel route-info-panel">{map}</section>
    </div>
  );
}
