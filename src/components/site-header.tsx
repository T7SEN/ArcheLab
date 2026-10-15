import { SiteNav } from "@/components/site-nav";

export function SiteHeader() {
  return (
    // The navbar floats over the page: only its pills take clicks. The height is fixed
    // (--site-header-height) because the home hero slides up under it by that much.
    <header className="pointer-events-none sticky top-0 z-40 flex h-(--site-header-height) items-start justify-center px-4 pt-3">
      <SiteNav />
    </header>
  );
}
