"use client";

import { useState } from "react";
import type { PortraitUrls } from "@/lib/nexon/descendants";
import { artUrlOf, chatIconClass } from "./chat-icons";
import { chatRegistry } from "./chat-registry";

interface ChatIconProps {
  id: string;
  portraits: PortraitUrls;
}

/**
 * A chat icon: the NEXON art for its id (a Descendant's API portrait, or an image from
 * NEXON's site), otherwise a labeled placeholder. Art that fails to load falls back to
 * the placeholder too (ADR 0008, ADR 0012).
 */
export function ChatIcon({ id, portraits }: ChatIconProps) {
  const [failed, setFailed] = useState(false);
  const image = chatRegistry.imagesById.get(id.toLowerCase());
  const label = image?.label ?? id;
  const src = failed ? null : artUrlOf(image, portraits);
  if (src === null) {
    return (
      <span className="chat-icon chat-icon-placeholder" title={`${label} icon`}>
        {label}
      </span>
    );
  }
  return (
    <span className={chatIconClass(image)} title={`${label} icon`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
      <img
        src={src}
        alt={`${label} icon`}
        draggable={false}
        onError={() => {
          setFailed(true);
        }}
      />
    </span>
  );
}
