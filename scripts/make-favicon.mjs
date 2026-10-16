// Draws src/app/favicon.ico from src/app/icon.svg (ADR 0020): 16, 32 and 48px PNGs in
// one ICO file, for browsers that read only /favicon.ico. Next.js cannot generate a
// favicon at build time, so the file is committed. Run `pnpm favicon` after changing
// icon.svg; logo-mark.test.ts checks the file's frames.
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const sizes = [16, 32, 48];
const svg = await readFile(new URL("../src/app/icon.svg", import.meta.url));
const src = `data:image/svg+xml;base64,${svg.toString("base64")}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 64, height: 64 } });
const frames = [];
for (const size of sizes) {
  await page.setContent(
    `<body style="margin:0;background:transparent"><img src="${src}" width="${String(size)}" height="${String(size)}" style="display:block"></body>`,
  );
  await page.locator("img").evaluate((img) => img.decode());
  frames.push(
    await page.screenshot({
      clip: { x: 0, y: 0, width: size, height: size },
      omitBackground: true,
    }),
  );
}
await browser.close();

// ICO layout: a 6-byte header, a 16-byte entry per image, then the PNG data.
const header = Buffer.alloc(6 + 16 * frames.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((png, index) => {
  const entry = 6 + 16 * index;
  header.writeUInt8(sizes[index], entry);
  header.writeUInt8(sizes[index], entry + 1);
  header.writeUInt8(0, entry + 2);
  header.writeUInt8(0, entry + 3);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
await writeFile(
  new URL("../src/app/favicon.ico", import.meta.url),
  Buffer.concat([header, ...frames]),
);
console.log(`Wrote src/app/favicon.ico (${sizes.join(", ")}px).`);
