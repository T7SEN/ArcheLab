"use client";

import type { Piece } from "@/features/chat/engine";
import type { PortraitUrls } from "@/lib/nexon/descendants";
import { ChatIcon } from "./chat-icon";
import { chatRegistry } from "./chat-registry";
import { lookOf, stylePropsOf } from "./style-look";

interface ChatLineProps {
  /** Parsed markup: what the game shows. */
  pieces: readonly Piece[];
  /** Untagged text takes the channel's color. */
  channelHex: string;
  portraits: PortraitUrls;
}

/** One line of chat in game colors, read-only. The home page uses it for samples. */
export function ChatLine({ pieces, channelHex, portraits }: ChatLineProps) {
  return (
    <p className="chat-line" style={{ color: channelHex }}>
      {pieces.map((piece, index) =>
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
      )}
    </p>
  );
}
