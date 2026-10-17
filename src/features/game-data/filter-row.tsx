import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** A filter chip in an index's toggle groups, filled while pressed. */
export const filterChipClass =
  "rounded-full px-3 aria-pressed:border-primary/60 aria-pressed:bg-primary/15 aria-pressed:text-foreground";

/** One row of an index's filters: its label, then its chips (ADR 0023, ADR 0024). */
export function FilterRow({
  id,
  label,
  children,
}: {
  /** The label's id, for the toggle group's `aria-labelledby`. */
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    // On phones every label sits above its chips, so the rows line up.
    <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-3">
      <span
        id={id}
        className="w-24 shrink-0 text-xs font-medium text-muted-foreground"
      >
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * An index's filter as a dropdown, for one with too many choices for chips: its label,
 * then the select (the modules' Type and Only for, the Cosmetics' Descendant).
 */
export function FilterSelect({
  id,
  label,
  items,
  value,
  onChange,
}: {
  id: string;
  label: string;
  items: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:flex sm:items-center sm:gap-x-3">
      <span
        id={id}
        className="w-24 shrink-0 text-xs font-medium text-muted-foreground"
      >
        {label}
      </span>
      <Select
        items={items}
        value={value}
        onValueChange={(next) => {
          if (typeof next === "string") {
            onChange(next);
          }
        }}
      >
        <SelectTrigger
          aria-labelledby={id}
          className="h-9 w-full min-w-0 bg-background/60 sm:flex-1"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
