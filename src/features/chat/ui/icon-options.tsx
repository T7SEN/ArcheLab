"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ImageEntry } from "@/features/chat/engine";
import { imageTag } from "@/features/chat/engine/serialize";
import type { PortraitUrls } from "@/lib/nexon/descendants";
import { ChatIcon } from "./chat-icon";
import { chatRegistry } from "./chat-registry";
import { keepEditorFocus } from "./keep-editor-focus";

/** The verified image ids matching a search by label or id, ignoring case. */
export function filterImages(query: string): ImageEntry[] {
  const needle = query.trim().toLowerCase();
  return chatRegistry.data.images.filter(
    (image) =>
      needle === "" ||
      [image.label, image.id, "icon"].some((text) =>
        text.toLowerCase().includes(needle),
      ),
  );
}

interface IconOptionsProps {
  images: readonly ImageEntry[];
  portraits: PortraitUrls;
  onPick: (id: string) => void;
}

/** Icon buttons. Each icon inserts at the cursor, outside any run (T26). */
export function IconOptions({ images, portraits, onPick }: IconOptionsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {images.map((image) => {
        const cost = imageTag(image.id).length;
        return (
          <Tooltip key={image.id}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label={`${image.label} icon, adds ${String(cost)} characters`}
                  onMouseDown={keepEditorFocus}
                  onClick={() => {
                    onPick(image.id);
                  }}
                  className="flex h-9 items-center gap-1.5 rounded-md border border-input px-1.5 text-xs transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  style={{
                    backgroundColor: chatRegistry.data.chatBackground.hex,
                  }}
                />
              }
            >
              <span aria-hidden="true">
                <ChatIcon id={image.id} portraits={portraits} />
              </span>
              <span aria-hidden="true" className="text-muted-foreground">
                +{cost}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <span className="grid gap-0.5">
                <span className="font-medium">{image.label} icon</span>
                <span className="font-mono">
                  {imageTag(image.id)} · +{cost} characters
                </span>
              </span>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
