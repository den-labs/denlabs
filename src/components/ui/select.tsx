"use client";

import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  type SelectHTMLAttributes,
  useContext,
} from "react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
}

const SelectContext = createContext<SelectContextValue>({});

export function Select({
  value,
  onValueChange,
  children,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  // Extract the SelectContent children (the options)
  let selectOptions: React.ReactNode = null;

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === SelectContent) {
      selectOptions = (
        child as React.ReactElement<{ children: React.ReactNode }>
      ).props.children;
    }
  });

  return (
    <SelectContext.Provider
      value={{ value, onValueChange, children: selectOptions }}
    >
      {children}
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps
  extends SelectHTMLAttributes<HTMLSelectElement> {}

export const SelectTrigger = forwardRef<HTMLSelectElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = useContext(SelectContext);
    const { value, onValueChange, children: options } = context;

    return (
      <select
        ref={ref}
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-wolf-emerald focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {options}
      </select>
    );
  },
);

SelectTrigger.displayName = "SelectTrigger";

export function SelectValue(_props: { placeholder?: string }) {
  return null; // Value is handled by select element
}

export function SelectContent(_props: { children: React.ReactNode }) {
  // This component's children are extracted by the Select component
  // and passed to SelectTrigger, so we return null here to avoid
  // rendering the options twice
  return null;
}

export function SelectItem({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return <option value={value}>{children}</option>;
}
