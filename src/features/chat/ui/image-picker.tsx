"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
      <h3
        id="image-picker-title"
        className="text-xs font-medium text-muted-foreground"
      >
        Icons
      </h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {chatRegistry.data.images.map((image) => {
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
                    className="flex h-10 items-center gap-2 rounded-md border border-input px-2 text-sm transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    style={{
                      backgroundColor: chatRegistry.data.chatBackground.hex,
                    }}
                  />
                }
              >
                <span aria-hidden="true" className="text-sm">
                  <ChatIcon id={image.id} portraits={portraits} />
                </span>
                <span
                  aria-hidden="true"
                  className="text-xs text-muted-foreground"
                >
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
    </div>
  );
}
