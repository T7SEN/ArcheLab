"use client";

import type { Piece } from "@/features/chat/engine";
import type { PortraitUrls } from "@/lib/nexon/descendants";
import { ChatIcon } from "./chat-icon";
import { chatRegistry } from "./chat-registry";
import { lookOf, stylePropsOf } from "./style-look";

interface ChatPreviewProps {
  /** What the game shows: the copied markup after the input box's cut, parsed. */
  pieces: readonly Piece[];
  channelHex: string;
  portraits: PortraitUrls;
}

/** The message as the game shows it, on the sampled chat background. */
export function ChatPreview({
  pieces,
  channelHex,
  portraits,
}: ChatPreviewProps) {
  return (
    <div
      className="chat-line"
      style={{
        backgroundColor: chatRegistry.data.chatBackground.hex,
        color: channelHex,
      }}
    >
      {pieces.length === 0 ? (
        <span className="text-muted-foreground">
          Your message appears here.
        </span>
      ) : (
        pieces.map((piece, index) =>
          piece.kind === "image" ? (
            <ChatIcon key={index} id={piece.id} portraits={portraits} />
          ) : (
            <span
              key={index}
              style={stylePropsOf(lookOf(piece.style, chatRegistry))}
            >
              {piece.text}
            </span>
          ),
        )
      )}
    </div>
  );
}
