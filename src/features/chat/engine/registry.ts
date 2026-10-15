import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9A-F]{6}$/, "Expected an uppercase #RRGGBB color");
const markupName = z
  .string()
  .regex(/^[A-Za-z0-9_.-]+$/, "Expected a tag or id name");
const label = z.string().min(1);
const factSource = z.enum(["community", "in-game-test"]);

const rulesSchema = z.strictObject({
  charLimit: z.number().int().positive().nullable(),
  tagsCountTowardLimit: z.boolean().nullable(),
  closeTag: z.string().nullable(),
  implicitSwitch: z.boolean().nullable(),
  spaceAfterTag: z
    .enum(["none", "optional", "required", "consumed"])
    .nullable(),
  caseSensitive: z.boolean().nullable(),
  unknownTagBehavior: z.enum(["literal", "stripped", "breaks"]).nullable(),
  countingUnit: z.enum(["utf16", "codepoint", "grapheme"]).nullable(),
});

const tagSchema = z.strictObject({
  name: markupName,
  label,
  kind: z.enum(["color", "style"]),
  hex: hexColor.nullable(),
  weight: z.enum(["regular", "bold"]),
  slant: z.enum(["normal", "italic"]),
  source: factSource,
  notes: z.string(),
});

const sizeSchema = z.strictObject({
  id: markupName,
  label,
  capHeightPx: z.number().int().positive(),
  hex: hexColor,
  source: factSource,
  notes: z.string(),
});

const imageArtSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("descendant"),
    descendant: z.string().min(1),
  }),
  z.strictObject({ kind: z.literal("placeholder") }),
]);

const imageSchema = z.strictObject({
  id: markupName,
  label,
  art: imageArtSchema,
  artVerified: z.boolean(),
  source: factSource,
  notes: z.string(),
});

const channelSchema = z.strictObject({
  name: z.string().regex(/^[a-z]+$/),
  label,
  hex: hexColor,
  source: factSource,
  notes: z.string(),
});

const chatBackgroundSchema = z.strictObject({
  hex: hexColor,
  source: factSource,
  notes: z.string(),
});

const charactersSchema = z.strictObject({
  verifiedSymbols: z.string(),
  refused: z.array(z.string().min(1)),
  refuseOutsideBmp: z.boolean(),
  source: factSource,
  notes: z.string(),
});

/** Schema of `src/data/chat-tags.json` (SKILL.md section 5.1). */
export const chatRegistrySchema = z.strictObject({
  version: z.number().int().positive(),
  status: z.enum(["provisional", "verified"]),
  verifiedPatch: z.string().min(1).nullable(),
  verifiedOn: z.iso.date().nullable(),
  rules: rulesSchema,
  tags: z.array(tagSchema).min(1),
  sizes: z.array(sizeSchema),
  images: z.array(imageSchema),
  channels: z.array(channelSchema).min(1),
  chatBackground: chatBackgroundSchema,
  characters: charactersSchema,
});

export type ChatRegistryData = z.infer<typeof chatRegistrySchema>;
export type TagEntry = ChatRegistryData["tags"][number];
export type SizeEntry = ChatRegistryData["sizes"][number];
export type ImageEntry = ChatRegistryData["images"][number];
export type ChannelEntry = ChatRegistryData["channels"][number];

/**
 * The markup rules this engine implements, each verified in game on 2026-10-15
 * (reports/TFD in-game chat tests.md). A registry that declares different rules is
 * rejected, so a game patch that changes the rules forces an engine change.
 */
const implementedRules = {
  tagsCountTowardLimit: true,
  closeTag: "</>",
  implicitSwitch: false,
  spaceAfterTag: "none",
  caseSensitive: false,
  unknownTagBehavior: "literal",
  countingUnit: "utf16",
} as const;

/** Tag names the engine reserves for images and text sizes. */
const reservedTagNames = new Set(["img", "a"]);

export interface ChatRegistry {
  readonly data: ChatRegistryData;
  readonly charLimit: number;
  /** Keyed by lowercase name: tag names ignore case in game (T12). */
  readonly tagsByName: ReadonlyMap<string, TagEntry>;
  /** Keyed by lowercase id. */
  readonly sizesById: ReadonlyMap<string, SizeEntry>;
  /** Keyed by lowercase id: image ids ignore case in game (T13). */
  readonly imagesById: ReadonlyMap<string, ImageEntry>;
}

function indexByLowercase<T>(
  entries: readonly T[],
  key: (entry: T) => string,
  kind: string,
): Map<string, T> {
  const index = new Map<string, T>();
  for (const entry of entries) {
    const lower = key(entry).toLowerCase();
    if (index.has(lower)) {
      throw new Error(`Duplicate ${kind} in the chat registry: ${key(entry)}`);
    }
    index.set(lower, entry);
  }
  return index;
}

/** Validates registry JSON and builds the lookups the engine needs. Throws on invalid data. */
export function createRegistry(input: unknown): ChatRegistry {
  const data = chatRegistrySchema.parse(input);
  const { rules } = data;

  const mismatches = Object.entries(implementedRules).filter(
    ([field, expected]) =>
      rules[field as keyof typeof implementedRules] !== expected,
  );
  if (mismatches.length > 0) {
    const fields = mismatches.map(([field]) => field).join(", ");
    throw new Error(
      `The chat registry declares rules this engine does not implement: ${fields}`,
    );
  }
  if (rules.charLimit === null) {
    throw new Error("The chat registry has no charLimit.");
  }

  const tagsByName = indexByLowercase(data.tags, (tag) => tag.name, "tag");
  for (const reserved of reservedTagNames) {
    if (tagsByName.has(reserved)) {
      throw new Error(
        `The tag name "${reserved}" is reserved for images and text sizes.`,
      );
    }
  }

  return {
    data,
    charLimit: rules.charLimit,
    tagsByName,
    sizesById: indexByLowercase(data.sizes, (size) => size.id, "size"),
    imagesById: indexByLowercase(data.images, (image) => image.id, "image"),
  };
}
