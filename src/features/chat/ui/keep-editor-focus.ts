import type { MouseEvent } from "react";

/** Keeps the editor's focus and selection while a picker button is clicked. */
export function keepEditorFocus(event: MouseEvent): void {
  event.preventDefault();
}
