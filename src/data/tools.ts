import {
  Crosshair,
  MessageSquareText,
  UserRound,
  type LucideIcon,
} from "lucide-react";

/** A tool on the home page: live with its route, or announced as coming soon. */
export type Tool =
  | {
      readonly slug: string;
      readonly name: string;
      readonly description: string;
      readonly icon: LucideIcon;
      readonly status: "live";
      readonly href: string;
      /** The label of the link into the tool. */
      readonly cta: string;
      /** What it does, one line each, for its card. */
      readonly features: readonly string[];
    }
  | {
      readonly slug: string;
      readonly name: string;
      readonly description: string;
      readonly icon: LucideIcon;
      readonly status: "coming-soon";
    };

/**
 * The tool registry (docs/SPEC.md section 5, ADR 0018): the home page's tool cards
 * render from it, in this order. Adding a tool is one entry here and one route;
 * `tools.test.ts` checks that every live tool's route is also in the navbar.
 */
export const tools: readonly Tool[] = [
  {
    slug: "chat",
    name: "Chat message builder",
    description:
      "Color your chat messages and copy markup that pastes right into the game.",
    icon: MessageSquareText,
    status: "live",
    href: "/tools/chat",
    cta: "Open the builder",
    features: [
      "Every verified color, rarity color and text size",
      "Icons, with portraits for Descendants",
      "Counts the way the game does, against the chat limit",
    ],
  },
  {
    slug: "descendant-builds",
    name: "Descendant builds",
    description: "Plan builds for your Descendants.",
    icon: UserRound,
    status: "coming-soon",
  },
  {
    slug: "weapon-builds",
    name: "Weapon builds",
    description: "Plan builds for your weapons.",
    icon: Crosshair,
    status: "coming-soon",
  },
];
