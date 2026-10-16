import type { Metadata } from "next";

/** The site's only public address (ADR 0005). Link previews and the sitemap use it. */
export const siteUrl = "https://arche-lab.tech";

export const siteName = "ArcheLab";

/** The home page's description, and the default for pages without their own. */
export const siteDescription =
  "Free, fan-made tools for The First Descendant, built on NEXON's game data. Start with the chat message builder.";

/**
 * The site's link preview image, drawn by `src/app/opengraph-image.tsx`. Pages without
 * an `opengraph-image` file of their own show it.
 */
export const siteImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "ArcheLab: tools for The First Descendant",
  type: "image/png",
};

/**
 * A page's canonical address and link preview (ADR 0020). Every page calls this:
 * Next.js replaces nested metadata such as `openGraph` instead of merging it, so a page
 * that set only its title would lose the layout's preview fields, and with them the
 * image Next.js takes from the root `opengraph-image` file. So the site image is set
 * here. A page with an `opengraph-image` file in its own folder passes `ownImage`: an
 * image set here would replace the file's (checked on Next.js 16.4.1).
 */
export function pageMetadata({
  path,
  title,
  description,
  ownImage = false,
}: {
  path: string;
  /** The page's title; the home page has none and shows the site name. */
  title?: string;
  description: string;
  /** True when the page's folder has its own `opengraph-image` file. */
  ownImage?: boolean;
}): Metadata {
  const images = ownImage ? {} : { images: [siteImage] };
  return {
    ...(title === undefined ? {} : { title }),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName,
      locale: "en_US",
      url: path,
      title: title ?? siteName,
      description,
      ...images,
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? siteName,
      description,
      ...images,
    },
  };
}
