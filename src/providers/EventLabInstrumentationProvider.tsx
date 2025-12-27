"use client";

import { usePathname } from "next/navigation";
import {
  Component,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  attachClickTracking,
  attachErrorTracking,
  EventLabInstrumentation,
} from "@/lib/instrumentation";

// =====================================================
// CONTEXT
// =====================================================

interface EventLabInstrumentationContext {
  instrumentation: EventLabInstrumentation | null;
  trackAction: (action: string, metadata?: Record<string, unknown>) => void;
  trackError: (
    error: Error | string,
    metadata?: Record<string, unknown>,
  ) => void;
  trackPageView: (route?: string) => void;
}

const InstrumentationContext = createContext<EventLabInstrumentationContext>({
  instrumentation: null,
  trackAction: () => {},
  trackError: () => {},
  trackPageView: () => {},
});

export function useEventLabInstrumentation() {
  return useContext(InstrumentationContext);
}

// =====================================================
// PROVIDER
// =====================================================

interface EventLabInstrumentationProviderProps {
  labSlug: string | null;
  children: ReactNode;
}

export function EventLabInstrumentationProvider({
  labSlug,
  children,
}: EventLabInstrumentationProviderProps) {
  const pathname = usePathname();
  const instrumentationRef = useRef<EventLabInstrumentation | null>(null);
  const hasAttachedHandlers = useRef(false);

  // Initialize instrumentation if labSlug is provided
  useEffect(() => {
    if (!labSlug) {
      // Clean up if labSlug is removed
      if (instrumentationRef.current) {
        instrumentationRef.current.destroy();
        instrumentationRef.current = null;
      }
      return;
    }

    // Create instrumentation instance
    if (!instrumentationRef.current) {
      instrumentationRef.current = new EventLabInstrumentation(labSlug);

      // Attach global handlers (only once)
      if (!hasAttachedHandlers.current) {
        attachClickTracking(instrumentationRef.current);
        attachErrorTracking(instrumentationRef.current);
        hasAttachedHandlers.current = true;
      }
    }

    // Clean up on unmount
    return () => {
      if (instrumentationRef.current) {
        instrumentationRef.current.destroy();
        instrumentationRef.current = null;
      }
    };
  }, [labSlug]);

  // Track route changes
  useEffect(() => {
    if (instrumentationRef.current && pathname) {
      instrumentationRef.current.trackPageView(pathname);
    }
  }, [pathname]);

  // Create context value
  const contextValue: EventLabInstrumentationContext = {
    instrumentation: instrumentationRef.current,
    trackAction: (action, metadata) => {
      instrumentationRef.current?.trackAction(action, metadata);
    },
    trackError: (error, metadata) => {
      instrumentationRef.current?.trackError(error, metadata);
    },
    trackPageView: (route) => {
      instrumentationRef.current?.trackPageView(route);
    },
  };

  return (
    <InstrumentationContext.Provider value={contextValue}>
      {children}
    </InstrumentationContext.Provider>
  );
}

// =====================================================
// ERROR BOUNDARY INTEGRATION
// =====================================================

interface EventLabErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class EventLabErrorBoundary extends Component<
  EventLabErrorBoundaryProps,
  { hasError: boolean }
> {
  static contextType = InstrumentationContext;
  context!: EventLabInstrumentationContext;

  constructor(props: EventLabErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track error via instrumentation
    this.context?.trackError(error, {
      componentStack: errorInfo.componentStack?.slice(0, 500),
      boundary: "EventLabErrorBoundary",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white">
                Something went wrong
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Please refresh the page or try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-wolf-emerald px-4 py-2 text-sm font-medium text-black hover:bg-wolf-emerald/90"
                type="button"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
