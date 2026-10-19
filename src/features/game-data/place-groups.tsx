import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { groupPlaces, isWideBox, splitPlace } from "./places";

// Pure, so it lives with `groupPlaces` and its tests; the Cores page imports it here.
export { isWideBox };

/**
 * Boxes that flow down columns as wide as their space allows, by container query: three
 * across a details row, one in a narrow column (T7SEN, 2026-10-18; ADR 0045). Columns,
 * not rows, so a long box leaves no gaps beside it. Its children are `Box`es.
 */
export function BoxColumns({ children }: { children: ReactNode }) {
  return (
    <div className="@container">
      <ul className="gap-3 @2xl:columns-2 @4xl:columns-3">{children}</ul>
    </div>
  );
}

/**
 * One box in `BoxColumns`: a muted title, when it has one, over its lines. Its children
 * are `<li>`s: places, or links such as the weapons that take a core. A wide box
 * (`isWideBox`) spans every column, its lines flowing in columns of their own.
 */
export function Box({
  title,
  wide = false,
  children,
}: {
  title: string | null;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <li
      className={`mb-3 grid break-inside-avoid gap-1.5 rounded-xl border bg-background/40 p-3 last:mb-0 ${wide ? "@container [column-span:all]" : ""}`}
    >
      {title === null ? null : (
        <span className="text-xs font-medium text-muted-foreground">
          {title}
        </span>
      )}
      <ul
        className={
          wide
            ? "gap-x-6 text-sm @2xl:columns-2 @4xl:columns-3 [&>li]:mb-1.5 [&>li]:break-inside-avoid"
            : "grid gap-1.5 text-sm"
        }
      >
        {children}
      </ul>
    </li>
  );
}

/** A place's key for its link: its box's title and its name. */
const lineKey = (title: string | null, place: string) =>
  JSON.stringify([title, place]);

/**
 * Where an item drops, in boxes by shared place: "[Axion Plains] [Hard]" over its
 * missions, each with its ways (`places.ts`). Renders nothing for no places; the caller
 * says so in its own words. A place whose name, with any of its ways, has a page in
 * `links` links it (ADR 0050).
 */
export function PlaceGroups({
  names,
  links = {},
}: {
  names: readonly string[];
  /** Pages by place name as the game words it, way and all. */
  links?: Readonly<Record<string, string>>;
}) {
  const groups = groupPlaces(names);
  if (groups.length === 0) {
    return null;
  }
  const total = groups.reduce((sum, group) => sum + group.places.length, 0);
  const lineLinks = new Map(
    Object.entries(links).map(([name, href]) => {
      const { title, place } = splitPlace(name);
      return [lineKey(title, place), href];
    }),
  );
  return (
    <BoxColumns>
      {groups.map((group) => (
        <Box
          key={group.title ?? ""}
          title={group.title}
          wide={isWideBox(group.places.length, total)}
        >
          {group.places.map((place) => (
            // A wrapped line hangs under the name, so it doesn't read as a place.
            <li key={place.name} className="pl-3 -indent-3">
              <PlaceName
                name={place.name}
                href={lineLinks.get(lineKey(group.title, place.name))}
              />
              {/* Each way its own tag, in the game's words: joined, "Support Complete
                  · complete" read as one phrase. A real space before each, so copied
                  or read-aloud text says "[Sepulcher] complete". */}
              {place.ways.map((way) => (
                <Fragment key={way}>
                  {" "}
                  <span className="ml-1 inline-block rounded-md bg-secondary px-1.5 py-0.5 indent-0 align-[0.0625rem] text-[0.6875rem] leading-snug text-muted-foreground">
                    {way}
                  </span>
                </Fragment>
              ))}
            </li>
          ))}
        </Box>
      ))}
    </BoxColumns>
  );
}

/** A place's name, or a link to its page when it has one. */
function PlaceName({ name, href }: { name: string; href: string | undefined }) {
  return href === undefined ? (
    name
  ) : (
    <Link
      href={href}
      prefetch={false}
      className="rounded-sm underline decoration-muted-foreground/60 decoration-dotted underline-offset-4 outline-none hover:text-primary hover:decoration-current hover:decoration-solid focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {name}
    </Link>
  );
}
