import type { EventType } from "./eventLabs";
import {
  getSurfaceLabel,
  isObservedSurface,
} from "./labMode";

// =====================================================
// CLIENT-SIDE EVENT INSTRUMENTATION
// =====================================================

export interface EventPayload {
  event_type: EventType;
  route?: string;
  metadata?: Record<string, unknown>;
}

export interface EnrichedEventPayload extends EventPayload {
  lab_slug: string;
  is_observed_surface?: boolean;
  surface_label?: string;
  locale?: string;
  referrer?: string;
}

export class EventLabInstrumentation {
  private labSlug: string;
  private surfaces: string[];
  private eventQueue: EnrichedEventPayload[] = [];
  private batchInterval: ReturnType<typeof setInterval> | null = null;
  private readonly BATCH_INTERVAL_MS = 30000; // 30 seconds
  private readonly MAX_QUEUE_SIZE = 50;
  private isShuttingDown = false;

  constructor(labSlug: string, surfaces: string[] = []) {
    this.labSlug = labSlug;
    this.surfaces = surfaces;
    this.startBatching();
    this.registerUnloadHandler();
  }

  /**
   * Track a custom event with Lab Mode enrichment
   */
  track(event: EventPayload): void {
    if (this.isShuttingDown) return;

    const route = event.route || window.location.pathname;
    const referrer = document.referrer || undefined;

    // Extract locale from pathname (e.g., /en/labs -> "en")
    const localeMatch = route.match(/^\/([a-z]{2})\//);
    const locale = localeMatch?.[1];

    // Enrich event with Lab Mode context
    const enrichedEvent: EnrichedEventPayload = {
      ...event,
      lab_slug: this.labSlug,
      route,
      is_observed_surface: isObservedSurface(route, this.surfaces),
      surface_label: getSurfaceLabel(route, this.surfaces),
      locale,
      referrer,
    };

    this.eventQueue.push(enrichedEvent);

    // Send immediately if queue is full
    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flush();
    }
  }

  /**
   * Track a page view event
   */
  trackPageView(route?: string): void {
    this.track({
      event_type: "page_view",
      route: route || window.location.pathname,
      metadata: {
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track an action click event
   */
  trackAction(action: string, metadata?: Record<string, unknown>): void {
    this.track({
      event_type: "action_click",
      metadata: {
        action,
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track an error event
   */
  trackError(error: Error | string, metadata?: Record<string, unknown>): void {
    const errorMessage = typeof error === "string" ? error : error.message;
    const errorStack =
      typeof error === "string" ? undefined : error.stack?.slice(0, 500);

    this.track({
      event_type: "error_flag",
      metadata: {
        error: errorMessage,
        stack: errorStack,
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Send all queued events immediately
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send events in batches
      for (const event of eventsToSend) {
        await fetch(`/api/labs/${this.labSlug}/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
          // Use keepalive for requests during page unload
          keepalive: this.isShuttingDown,
        });
      }
    } catch (error) {
      // Silently fail - don't break user experience
      console.warn("Failed to send event tracking batch", error);

      // Re-queue events if not shutting down
      if (!this.isShuttingDown) {
        this.eventQueue.push(...eventsToSend);
      }
    }
  }

  /**
   * Start periodic batching
   */
  private startBatching(): void {
    this.batchInterval = setInterval(() => {
      this.flush();
    }, this.BATCH_INTERVAL_MS);
  }

  /**
   * Register beforeunload handler to send events on page exit
   */
  private registerUnloadHandler(): void {
    const handleUnload = () => {
      this.isShuttingDown = true;
      this.flush();
    };

    // Use multiple events to catch different browser behaviors
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        handleUnload();
      }
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.isShuttingDown = true;

    if (this.batchInterval) {
      clearInterval(this.batchInterval);
      this.batchInterval = null;
    }

    // Final flush
    this.flush();
  }
}

// =====================================================
// CLICK TRACKING UTILITIES
// =====================================================

/**
 * Attach click tracking to elements with [data-track-action] attribute
 */
export function attachClickTracking(
  instrumentation: EventLabInstrumentation,
): void {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const trackableElement = target.closest("[data-track-action]");

    if (trackableElement) {
      const action =
        trackableElement.getAttribute("data-track-action") || "unknown";
      const metadata: Record<string, unknown> = {};

      // Capture additional data attributes
      const dataAttributes = trackableElement.attributes;
      for (let i = 0; i < dataAttributes.length; i++) {
        const attr = dataAttributes[i];
        if (
          attr.name.startsWith("data-track-") &&
          attr.name !== "data-track-action"
        ) {
          const key = attr.name.replace("data-track-", "");
          metadata[key] = attr.value;
        }
      }

      instrumentation.trackAction(action, metadata);
    }
  });
}

// =====================================================
// ERROR TRACKING UTILITIES
// =====================================================

/**
 * Attach global error tracking
 */
export function attachErrorTracking(
  instrumentation: EventLabInstrumentation,
): void {
  window.addEventListener("error", (event) => {
    instrumentation.trackError(event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    instrumentation.trackError(`Unhandled Promise Rejection: ${event.reason}`, {
      type: "unhandledrejection",
    });
  });
}
