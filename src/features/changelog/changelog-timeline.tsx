"use client";

import { useEffect, useRef, useState } from "react";
import {
  BranchedMenu,
  type BranchedMenuItem,
} from "@/components/react-bits/branched-menu";
import { changelog, changelogDate, changelogGroupId } from "@/data/changelog";

/**
 * Each update as a section of the menu, its groups as rows linking to them; an update
 * that shipped a version says so after its date.
 */
const items: readonly BranchedMenuItem[] = changelog.map((entry) => ({
  label:
    entry.version === undefined
      ? changelogDate(entry.date)
      : `${changelogDate(entry.date)} · v${entry.version}`,
  value: entry.date,
  children: entry.groups.map((group) => {
    const id = changelogGroupId(entry.date, group.title);
    return { value: id, label: group.title, href: `#${id}` };
  }),
}));

const groupIds = items.flatMap(
  (item) => item.children?.map((child) => child.value) ?? [],
);

/** How long a jump may take before the scroll spy takes over again. */
const jumpWindowMs = 1200;

/**
 * The Changelog's timeline (ADR 0036): React Bits' BranchedMenu, a section per update
 * that opens into its groups, each a link to its place on the page. The newest update
 * starts open. The traced line follows the group being read: a scroll spy picks the
 * first group in the top part of the screen, and a picked row holds while its jump
 * scrolls the page.
 */
export function ChangelogTimeline() {
  const [active, setActive] = useState(groupIds.at(0) ?? "");
  const jumping = useRef<number | undefined>(undefined);

  useEffect(() => {
    const seen = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          seen.set(entry.target.id, entry.isIntersecting);
        }
        if (jumping.current !== undefined) return;
        const first = groupIds.find((id) => seen.get(id) === true);
        if (first !== undefined) setActive(first);
      },
      // The band under the navbar, down to 40% of the screen.
      { rootMargin: "-96px 0px -60% 0px" },
    );
    for (const id of groupIds) {
      const target = document.getElementById(id);
      if (target !== null) observer.observe(target);
    }
    return () => {
      observer.disconnect();
      window.clearTimeout(jumping.current);
    };
  }, []);

  return (
    <BranchedMenu
      items={items}
      active={active}
      defaultOpen={0}
      ariaLabel="Updates"
      width={260}
      onSelect={(value) => {
        setActive(value);
        window.clearTimeout(jumping.current);
        jumping.current = window.setTimeout(() => {
          jumping.current = undefined;
        }, jumpWindowMs);
      }}
    />
  );
}
