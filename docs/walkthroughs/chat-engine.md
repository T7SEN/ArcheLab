# Chat engine

The engine in `src/features/chat/engine` reads, writes, counts, shortens and shares The First Descendant chat markup. It is pure TypeScript: no React, DOM or Next. Every rule it follows was verified in game on 2026-10-15 (`reports/TFD in-game chat tests.md`, local only).

## Code path

1. **Registry.** `registry.ts` validates `src/data/chat-tags.json` with Zod (`createRegistry`) and builds lookups keyed by lowercase name, because tag names, image ids and attribute names all ignore case (T12, T13, T15). It throws if the JSON declares rules the engine does not implement: if a game patch changes a rule, the registry update fails loudly instead of silently mis-rendering.
2. **Parse.** `parse.ts` scans the markup with the regular expression of Unreal Engine's standard rich-text parser (`FDefaultRichTextMarkupParser`):
   - Each match is a well-formed tag: `<name attrs/>` or `<name attrs>content</>`.
   - Known tags become styled text, a text size (`<a id>`) or an image (`<img id>`). Anything unknown is shown exactly as typed.
   - Text between matches is untagged. Escapes (`&lt;` and friends) are decoded last.
3. **Render.** `render.ts` turns pieces into glyphs: each character with its look, or an image id. "Renders identically" compares glyph lists. A visible character's look is its color plus its shape (weight, slant, size). A whitespace character's look is only its shape.
4. **Serialize.** `serialize.ts` writes canonical markup: every run closed with `</>`, every `<` escaped.
5. **Count.** `count.ts` counts the raw markup in UTF-16 units, the way the input box does, and finds where the box cuts it. It also flags characters the game refuses (emoji and some symbols) or that are untested.
6. **Optimize.** `optimize.ts` simplifies the pieces in three steps:
   - It swaps each tag for its shortest same-looking equivalent: `<default>` and `<QuestEvent>` become `<Plain>`.
   - It merges same-style neighbors, and lets whitespace join a neighboring run when its shape is unchanged.
   - It emits the result with minimal escaping.

   It then parses its own output and compares glyphs. If anything differs, it tries full escaping, then falls back to `serialize`.
7. **Share.** `share.ts` writes the character `1` (the format version), then the message as WTF-8 bytes in unpadded base64url. Decoding is strict and wrapped so it can never throw.

## Why it is shaped this way

- **The parser mirrors Unreal's instead of a grammar of our own.** Every syntax result in Parts 1 and 2 matched Unreal's standard parser exactly:
  - `</>` is the only closer, and the first `</>` ends a run, so runs never nest.
  - An unclosed tag shows as typed, and a space inside the brackets breaks a tag.
  - An image inside a color run shows raw.

  Copying the regular expression reproduces all of these at once, including untested corners. Those corners are marked "inferred" in the code: an unknown tag swallowing the tags inside it, and an image tag's content being ignored.
- **Whitespace looks only at shape.** A space in red and a space in blue look identical, but a bold or larger space is wider. Ignoring color but keeping shape lets the optimizer merge `<red>A</> <red>B</>` into `<red>A B</>` without changing what anyone sees.
- **The optimizer checks itself.** Minimal escaping is a heuristic: it escapes `<` only where it could open a tag (untagged text) or close a run (`</>` inside a run). Instead of proving the heuristic correct for every input, the optimizer verifies each output by parsing it. That makes invariants 2 and 3 hold by construction.
- **Counting includes markup.** The game counts tags and image markup toward the 100-character limit (T20, T21). Counting raw UTF-16 units matches the input box exactly, including emoji counting as 2 (T23).
- **The share codec handles any JavaScript string.** WTF-8, unlike UTF-8, can carry unpaired surrogates, so `decodeShare(encodeShare(m)) === m` holds for every string, not only well-formed ones.
- **No image URLs in the registry.** Nexon's API terms limit keeping Nexon Game Data to 30 days (§8.7). The registry stores the Descendant's name for portrait art, and the URL is fetched when pages are built.

## What would break it

- **A game patch that changes the markup rules.** `createRegistry` then fails on purpose. Update the engine first, then the registry, and re-run the in-game tests.
- **Changing `markupPattern` in `parse.ts`.** The parse tests replay every in-game result (T1 to T42), so a behavior change fails a named test.
- **Adding a tag whose name collides with another in case only, or naming a tag `img` or `a`.** `createRegistry` rejects both.
- **Treating whitespace look as color-dependent, or color as shape.** The optimizer stays correct, because it verifies its output, but its merges stop saving characters. The optimize unit tests catch that.
- **Line breaks.** Chat is a single line. The parser never matches a tag across a line break, and line breaks are outside the invariants.
