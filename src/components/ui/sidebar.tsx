"use client";

import { Menu, X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const SIDEBAR_WIDTH = 272;
export const SIDEBAR_COLLAPSED_WIDTH = 84;
export const SIDEBAR_MOBILE_WIDTH = 288;

type SidebarContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleOpen: () => void;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMobile: () => void;
  isMobile: boolean;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mediaQuery = window.matchMedia(query);
    const handler = () => setMatches(mediaQuery.matches);
    handler();
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

type SidebarProviderProps = React.PropsWithChildren<{
  defaultOpen?: boolean;
}>;

export function SidebarProvider({
  children,
  defaultOpen = true,
}: SidebarProviderProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = React.useState(defaultOpen);
  const [openMobile, setOpenMobile] = React.useState(false);

  React.useEffect(() => {
    if (isDesktop) {
      setOpenMobile(false);
    }
  }, [isDesktop]);

  const toggleOpen = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, []);
  const toggleMobile = React.useCallback(() => {
    setOpenMobile((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      toggleOpen,
      openMobile,
      setOpenMobile,
      toggleMobile,
      isMobile: !isDesktop,
    }),
    [open, openMobile, isDesktop, toggleOpen, toggleMobile],
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

type SidebarProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: "left" | "right";
  collapsible?: "offcanvas" | "icon" | "none";
};

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      className,
      children,
      side = "left",
      collapsible = "icon",
      ...props
    }: SidebarProps,
    ref,
  ) => {
    const { open, openMobile, setOpenMobile, isMobile } = useSidebar();
    const isCollapsed = !isMobile && collapsible === "icon" && !open;
    const mobileClosedTranslate =
      side === "left" ? "-translate-x-full" : "translate-x-full";
    const widthClass =
      !isMobile && collapsible === "icon"
        ? open
          ? "md:[width:var(--den-sidebar-width)]"
          : "md:[width:var(--den-sidebar-collapsed-width)]"
        : "md:[width:var(--den-sidebar-width)]";

    return (
      <>
        <aside
          ref={ref}
          data-state={isCollapsed ? "collapsed" : "expanded"}
          data-collapsible={collapsible}
          style={
            {
              "--den-sidebar-width": `${SIDEBAR_WIDTH}px`,
              "--den-sidebar-collapsed-width": `${SIDEBAR_COLLAPSED_WIDTH}px`,
              "--den-sidebar-mobile-width": `${SIDEBAR_MOBILE_WIDTH}px`,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar pointer-events-auto border border-[#232a36] bg-[#05090f]/95 text-white shadow-[0_45px_120px_-80px_rgba(7,11,20,0.85)] backdrop-blur-xl transition-all duration-300",
            "fixed inset-y-3 z-40 flex w-[var(--den-sidebar-mobile-width)] max-w-[85vw] translate-x-0 flex-col rounded-2xl p-4 md:sticky md:top-3 md:z-auto md:h-[calc(100vh-2rem)]",
            isMobile
              ? openMobile
                ? "translate-x-0"
                : mobileClosedTranslate
              : "translate-x-0",
            widthClass,
            className,
          )}
          {...props}
        >
          {children}
        </aside>
        {isMobile ? (
          <div
            className={cn(
              "fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
              openMobile ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            onClick={() => setOpenMobile(false)}
          />
        ) : null}
      </>
    );
  },
);
Sidebar.displayName = "Sidebar";

type SidebarSectionProps = React.HTMLAttributes<HTMLDivElement>;

export function SidebarHeader({
  className,
  ...props
}: SidebarSectionProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-white/5 pb-4",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarContent({
  className,
  ...props
}: SidebarSectionProps) {
  return (
    <div
      className={cn(
        "mt-4 flex-1 space-y-6 overflow-y-auto pr-1",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarFooter({
  className,
  ...props
}: SidebarSectionProps) {
  return (
    <div
      className={cn(
        "border-t border-white/5 pt-4 text-[0.7rem] uppercase tracking-[0.3em] text-white/50",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroup({
  className,
  ...props
}: SidebarSectionProps) {
  return (
    <div className={cn(className)} {...props} />
  );
}

export function SidebarGroupLabel({
  className,
  ...props
}: SidebarSectionProps) {
  return (
    <div
      className={cn(
        "mb-3 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/60",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({
  className,
  ...props
}: SidebarSectionProps) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

type SidebarMenuProps = React.HTMLAttributes<HTMLUListElement>;

export function SidebarMenu({ className, ...props }: SidebarMenuProps) {
  return (
    <ul className={cn("space-y-1.5", className)} {...props} />
  );
}

export function SidebarMenuItem({
  className,
  ...props
}: React.LiHTMLAttributes<HTMLLIElement>) {
  return <li className={cn("list-none", className)} {...props} />;
}

type SidebarMenuButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  isActive?: boolean;
};

export function SidebarMenuButton({
  asChild,
  className,
  children,
  isActive,
  ...props
}: SidebarMenuButtonProps) {
  const { open, isMobile } = useSidebar();
  const collapsed = !open && !isMobile;
  const baseClasses = cn(
    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] transition",
    collapsed ? "justify-center px-2" : "justify-start",
    isActive
      ? "bg-[linear-gradient(140deg,#c8ff64,#5ae048)] text-[#0b1407] shadow-[0_15px_30px_rgba(122,255,118,0.25)]"
      : "text-white/70 hover:bg-white/5 hover:text-white",
    className,
  );

  if (asChild && React.isValidElement<Record<string, unknown>>(children)) {
    const childProps = children.props as { className?: string };
    return React.cloneElement(children, {
      ...props,
      className: cn(
        baseClasses,
        typeof childProps.className === "string" ? childProps.className : "",
      ),
    });
  }

  return (
    <button className={baseClasses} {...props}>
      {children}
    </button>
  );
}

type SidebarMenuSubProps = React.HTMLAttributes<HTMLUListElement>;

export function SidebarMenuSub({ className, ...props }: SidebarMenuSubProps) {
  return (
    <ul
      className={cn(
        "ml-2 mt-3 space-y-1 border-l border-white/10 pl-3",
        className,
      )}
      {...props}
    />
  );
}

type SidebarMenuSubItemProps = React.LiHTMLAttributes<HTMLLIElement>;

export function SidebarMenuSubItem({
  className,
  ...props
}: SidebarMenuSubItemProps) {
  return <li className={cn("list-none", className)} {...props} />;
}

type SidebarMenuSubButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
    isActive?: boolean;
  };

export function SidebarMenuSubButton({
  asChild,
  className,
  children,
  isActive,
  ...props
}: SidebarMenuSubButtonProps) {
  const { open, isMobile } = useSidebar();
  const collapsed = !open && !isMobile;
  const baseClasses = cn(
    "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-[0.7rem] font-medium tracking-[0.08em] transition",
    collapsed ? "justify-center" : "justify-start",
    isActive
      ? "bg-white/10 text-white"
      : "text-white/70 hover:bg-white/5 hover:text-white",
    className,
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(
        baseClasses,
        (children.props as Record<string, unknown>)?.className ?? "",
      ),
      ...props,
    });
  }

  return (
    <button className={baseClasses} {...props}>
      {children}
    </button>
  );
}

type SidebarInsetProps = React.HTMLAttributes<HTMLDivElement>;

export function SidebarInset({ className, ...props }: SidebarInsetProps) {
  return <div className={cn("flex-1", className)} {...props} />;
}

type SidebarTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ghost" | "solid";
  icon?: "menu" | "close";
};

export function SidebarTrigger({
  className,
  children,
  variant = "ghost",
  icon = "menu",
  ...props
}: SidebarTriggerProps) {
  const { isMobile, toggleMobile, toggleOpen } = useSidebar();
  const Icon = icon === "menu" ? Menu : X;
  const styles =
    variant === "solid"
      ? "bg-[#89e24a] text-[#0a130b] hover:bg-[#72cc36]"
      : "bg-white/5 text-white hover:bg-white/10";
  const showDefaultContent = children == null;

  return (
    <button
      type="button"
      onClick={() => (isMobile ? toggleMobile() : toggleOpen())}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] transition",
        styles,
        className,
      )}
      {...props}
    >
      {children ?? <Icon className="h-4 w-4" aria-hidden />}
      {showDefaultContent ? (
        <span className="hidden md:inline">
          {icon === "menu" ? "Menu" : "Close"}
        </span>
      ) : null}
    </button>
  );
}

type CollapsibleContextValue = {
  open: boolean;
  setOpen: (value: boolean | ((value: boolean) => boolean)) => void;
  disabled?: boolean;
};

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(
  null,
);

function useCollapsibleContext() {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error("Collapsible components must be used within Collapsible.");
  }
  return context;
}

type CollapsibleProps = React.HTMLAttributes<HTMLDivElement> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
};

export function Collapsible({
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  disabled = false,
  className,
  children,
  ...props
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = openProp != null;
  const open = isControlled ? Boolean(openProp) : internalOpen;

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      if (disabled) {
        return;
      }
      const nextValue =
        typeof value === "function" ? value(open) : Boolean(value);
      if (!isControlled) {
        setInternalOpen(nextValue);
      }
      onOpenChange?.(nextValue);
    },
    [disabled, isControlled, onOpenChange, open],
  );

  return (
    <CollapsibleContext.Provider value={{ open, setOpen, disabled }}>
      <div
        data-state={open ? "open" : "closed"}
        className={cn("group/collapsible", className)}
        {...props}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

type CollapsibleTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

export function CollapsibleTrigger({
  asChild,
  className,
  children,
  ...props
}: CollapsibleTriggerProps) {
  const { open, setOpen, disabled } = useCollapsibleContext();
  const { onClick, ...rest } = props;
  const sharedProps = {
    "aria-expanded": open,
    "data-state": open ? "open" : "closed",
    "data-disabled": disabled ? "true" : undefined,
  };
  const handleClick = (event: React.MouseEvent) => {
    onClick?.(event);
    if (!event.defaultPrevented) {
      setOpen((prev) => !prev);
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...rest,
      ...sharedProps,
      className: cn(
        (children.props as Record<string, unknown>)?.className ?? "",
        className,
      ),
      disabled:
        typeof (children.props as Record<string, unknown>)?.disabled ===
        "boolean"
          ? (children.props as Record<string, unknown>).disabled
          : disabled,
      onClick: (event: React.MouseEvent) => {
        if ((children.props as Record<string, unknown>).onClick) {
          (
            (children.props as Record<string, unknown>)
              .onClick as React.MouseEventHandler
          )(event);
        }
        if (!disabled) {
          handleClick(event);
        }
      },
    });
  }

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(className)}
      onClick={handleClick}
      {...sharedProps}
      {...rest}
    >
      {children}
    </button>
  );
}

type CollapsibleContentProps = React.HTMLAttributes<HTMLDivElement>;

export function CollapsibleContent({
  className,
  children,
  ...props
}: CollapsibleContentProps) {
  const { open } = useCollapsibleContext();
  return (
    <div
      data-state={open ? "open" : "closed"}
      className={cn(
        "overflow-hidden transition-all duration-200 ease-out data-[state=closed]:max-h-0 data-[state=closed]:opacity-0 data-[state=open]:max-h-[800px] data-[state=open]:opacity-100",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
