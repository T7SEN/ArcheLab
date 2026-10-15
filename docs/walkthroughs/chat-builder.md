# Chat builder

The builder at `/tools/chat` composes one line of chat, previews it the way the game shows it, and copies markup that fits the chat limit. The UI lives in `src/features/chat/ui`. Every game fact it shows comes from `src/data/chat-tags.json` through the engine (`docs/walkthroughs/chat-engine.md`).

## Code path

1. **Page.** `src/app/tools/chat/page.tsx` is a server component, prerendered as a static page. While it renders, `fetchPortraitUrls` (`src/lib/nexon/descendants.ts`, server-only) reads NEXON's `descendant.json` once and returns the base Descendant portrait URL for each portrait icon in the registry (ADR 0008). The page passes those URLs to the client component `ChatBuilder`.
2. **State.** `ChatBuilder` holds one message: the markup panel's text and the engine pieces. Everything else is derived from them on each render:
   - the copy text: the shorter of the optimizer's output and the text as written;
   - the count, with `count`;
   - what the game shows: the copy text after `truncateToLimit`, parsed;
   - the hints.
3. **Editor.** `ChatEditor` mounts ProseMirror (ADR 0007) into a `div` that React never touches.
   - `editor-schema.ts` defines one line of inline content, one `style` mark, and inline atom images.
   - `editor-model.ts` converts between editor content and pieces.
   - Every change goes up as pieces. When the pieces change from outside, the editor replaces its content, unless the content already serializes the same.
4. **Commands and plugins.** `editor-plugins.ts`:
   - `applyStyle` removes the old style and adds the new one to text only. With no selection, it sets the style for what is typed next.
   - `insertImage` inserts an unstyled image.
   - `normalizePlugin` runs after every change. It removes refused characters and line breaks, and strips any style from images.
   - `overflowPlugin` highlights what the game will not show as written.
   - The keymap blocks Enter and adds undo and redo.
5. **Markup panel.** `MarkupPanel` is a textarea over a backdrop that repeats the text with the same metrics and marks the part past the input box's cut. Panel input goes through `cleanMarkup` (line breaks become spaces, refused characters are removed), then `parse`.
6. **Picker.** `styleGroups` (`style-options.ts`) lists each look once, under the shortest of the tags that render it, grouped by the look's first registry entry. Each option carries its cost, its contrast against the chat background, and the longer names it replaces. Picker buttons keep the editor's focus (`keepEditorFocus`), so the selection survives a click.
7. **Preview.** `ChatPreview` draws the parsed, cut message on the sampled chat background, with untagged text in the chosen channel's color. Sizes scale by their measured cap heights against untagged text. `ChatIcon` shows the portrait, or the labeled placeholder when there is no portrait or it fails to load.

## Why it is shaped this way

- **Pieces are the only source of truth.** The editor and the panel both write pieces, and everything else reads them. Two-way sync then never compares DOM or strings ad hoc (`SKILL.md` landmine 10). It goes through `parse` and `serialize`.
- **One style per run is enforced at two levels.** ProseMirror marks of one type exclude each other, so a run cannot hold two styles. `addMark` would still style an image (the test "lets addMark style an image" pins this), so `applyStyle` styles text nodes only and `normalizePlugin` strips styles from images that arrive by paste.
- **Pickers read the visible selection first.** ProseMirror reads native selection changes only while it has focus. A keyboard user who selects with Shift+Home and tabs straight to a picker button can blur the editor before that read happens, and the style would land on the old cursor. `syncSelectionFromDom` maps the browser's selection back with `posAtDOM` before each picker command. The e2e test "a style can be applied with the keyboard alone" failed without it.
- **Normalization is a plugin, not input handlers.** Typing, paste, drop and composed input (IME) all reach the document through transactions. Checking the result after each change catches refused characters whatever their route.
- **The copy text is the shorter one.** The optimizer escapes every `<` that could start a tag. Typed text such as an unclosed `<cash>` already shows literally, so what was written can be shorter than the optimizer's output, and both render the same.
- **The overflow highlight compares renderings.** The input box cuts markup, not text. Cutting inside a closing tag leaves the whole run unclosed and shown as typed (T4). The editor therefore highlights from the first glyph where the cut message renders differently from the full one, not from a character count.
- **Icon height is an approximation.** T8 records only that icons are much taller than text, so `iconHeightEm` (2em) is a guess, and the preview says the size is approximate.

## What would break it

- **A registry change without an engine change.** New fields need the Zod schema in `registry.ts`. New rules fail `createRegistry` on purpose.
- **Removing `normalizePlugin`.** Pasted emoji would reach the copy text, and styled images could appear. The unit tests in `editor-plugins.test.ts` and the e2e test for refused characters fail.
- **Letting React render inside the editor's mount point.** ProseMirror owns that DOM, so React would fight it.
- **Changing the markup panel's or backdrop's font, padding or wrapping on one side only.** The overflow highlight stops lining up with the text.
- **A NEXON outage at build time.** The page still builds, and every icon shows its placeholder. The weekly scheduled deploy tries again.
