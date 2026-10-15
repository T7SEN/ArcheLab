"use client";

import { useState } from "react";
import type { PortraitUrls } from "@/lib/nexon/descendants";
import { portraitOf } from "./chat-icons";
import { chatRegistry } from "./chat-registry";

interface ChatIconProps {
  id: string;
  portraits: PortraitUrls;
}

/**
 * A chat icon: the NEXON portrait for Descendant ids, otherwise a labeled placeholder.
 * A portrait that fails to load falls back to the placeholder too (ADR 0008).
 */
export function ChatIcon({ id, portraits }: ChatIconProps) {
  const [failed, setFailed] = useState(false);
  const image = chatRegistry.imagesById.get(id.toLowerCase());
  const label = image?.label ?? id;
  const src = failed ? null : portraitOf(image, portraits);
  if (src === null) {
    return (
      <span className="chat-icon chat-icon-placeholder" title={`${label} icon`}>
        {label}
      </span>
    );
  }
  return (
    <span className="chat-icon" title={`${label} icon`}>
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
