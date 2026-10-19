import { cn } from "cn";
import { sitePages } from "@/data/site-pages";
import { coreEquipment, type CoreEquipment } from "./core-filters";

/** What a core goes in, with that index's icon from the navbar (ADR 0044). */
export function EquipmentBadge({
  equipment,
  size = "sm",
}: {
  equipment: CoreEquipment;
  size?: "sm" | "md";
}) {
  const entry = coreEquipment.find((item) => item.equipment === equipment);
  const Icon = sitePages.find((page) => page.href === entry?.href)?.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border whitespace-nowrap text-muted-foreground",
        size === "sm"
          ? "px-1.5 text-[0.6875rem] [&_svg]:size-3"
          : "px-2 py-0.5 text-xs [&_svg]:size-3.5",
      )}
    >
      {Icon === undefined ? null : (
        <Icon aria-hidden="true" className="text-primary" />
      )}
      {entry?.label}
    </span>
  );
}
