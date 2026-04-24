declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = "G-KT4W6S409F";

function track(eventName: string, params: Record<string, unknown>) {
  window.gtag?.("event", eventName, params);
}

export function trackPageView(pagePath: string, pageTitle: string) {
  track("page_view", {
    page_title: pageTitle,
    page_path: pagePath,
    page_location: `${window.location.origin}${pagePath}`,
    send_to: measurementId
  });
}

export {};
