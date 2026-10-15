"use client";

import { imageTag } from "@/features/chat/engine/serialize";
import type { PortraitUrls } from "@/lib/nexon/descendants";
import { ChatIcon } from "./chat-icon";
import { chatRegistry } from "./chat-registry";
import { keepEditorFocus } from "./style-picker";

interface ImagePickerProps {
  portraits: PortraitUrls;
  onPick: (id: string) => void;
}

/** The image ids verified in game. Each one inserts at the cursor, outside any run (T26). */
export function ImagePicker({ portraits, onPick }: ImagePickerProps) {
  return (
    <div role="group" aria-labelledby="image-picker-title">
      <p
        id="image-picker-title"
        className="text-xs font-semibold tracking-wider text-ink-muted uppercase"
      >
        Icons
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {chatRegistry.data.images.map((image) => {
          const cost = imageTag(image.id).length;
          return (
            <button
              key={image.id}
              type="button"
              aria-label={`${image.label} icon, adds ${String(cost)} characters`}
              title={`${image.label} icon (${image.id}), adds ${String(cost)} characters`}
              onMouseDown={keepEditorFocus}
              onClick={() => {
                onPick(image.id);
              }}
              className="flex items-center gap-2 border border-line px-2 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              style={{ backgroundColor: chatRegistry.data.chatBackground.hex }}
            >
              <span aria-hidden="true">
                <ChatIcon id={image.id} portraits={portraits} />
              </span>
              <span className="text-ink-muted">+{cost}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
