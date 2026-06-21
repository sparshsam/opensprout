#!/usr/bin/env node

/**
 * OpenSprout Icon Generator
 *
 * Uses the committed source icon (apps/web/public/icons/icon.png) to generate
 * all required app icon sizes deterministically.
 *
 * Usage:  node scripts/generate-icons.mjs
 */

import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const SRC = path.join(ROOT, "apps/web/public/icons/icon.png");
const WEB_PUBLIC = path.join(ROOT, "apps/web/public");
const ANDROID_RES = path.join(ROOT, "apps/web/android/app/src/main/res");

if (!fs.existsSync(SRC)) {
  console.error(`Source icon not found at ${SRC}`);
  process.exit(1);
}

function mkdir(dir) { fs.mkdirSync(dir, { recursive: true }); }

async function resize(out, w, h) {
  mkdir(path.dirname(out));
  await sharp(SRC).resize(w, h, { fit: "cover" }).png().toFile(out);
  console.log(`  ${path.relative(ROOT, out)}  ${w}×${h}`);
}

async function main() {
  console.log("\n★ Generating OpenSprout icons …\n");

  // ── 1. Web / PWA icons ───────────────────────────────────────────
  console.log("  ── Web / PWA ──");
  // Favicons
  await resize(path.join(WEB_PUBLIC, "icons/favicon-16x16.png"), 16, 16);
  await resize(path.join(WEB_PUBLIC, "icons/favicon-32x32.png"), 32, 32);
  await resize(path.join(WEB_PUBLIC, "favicon.png"), 32, 32);
  // App icons
  await resize(path.join(WEB_PUBLIC, "icons/icon-48x48.png"), 48, 48);
  await resize(path.join(WEB_PUBLIC, "icons/icon-64x64.png"), 64, 64);
  await resize(path.join(WEB_PUBLIC, "icons/icon-128x128.png"), 128, 128);
  await resize(path.join(WEB_PUBLIC, "icons/icon-192.png"), 192, 192);
  await resize(path.join(WEB_PUBLIC, "icons/icon-512.png"), 512, 512);

  // ── 2. Android mipmap icons ──────────────────────────────────────
  const mipmapDirs = [
    { dir: "mipmap-mdpi", scale: 1 },
    { dir: "mipmap-hdpi", scale: 1.5 },
    { dir: "mipmap-xhdpi", scale: 2 },
    { dir: "mipmap-xxhdpi", scale: 3 },
    { dir: "mipmap-xxxhdpi", scale: 4 },
  ];

  // Launcher icons (48dp base)
  console.log("\n  ── Android Launcher Icons ──");
  for (const { dir, scale } of mipmapDirs) {
    const s = 48 * scale;
    const dst = path.join(ANDROID_RES, dir);
    mkdir(dst);
    await sharp(SRC).resize(s, s).png().toFile(path.join(dst, "ic_launcher.png"));
    await sharp(SRC).resize(s, s).png().toFile(path.join(dst, "ic_launcher_round.png"));
    console.log(`  ${dir}/ic_launcher{,_round}.png  ${s}×${s}`);
  }

  // Adaptive icon foregrounds (108dp base → the full icon rendered inside)
  console.log("\n  ── Adaptive Icon Foregrounds ──");
  for (const { dir, scale } of mipmapDirs) {
    const s = Math.round(108 * scale);
    const dst = path.join(ANDROID_RES, dir);
    mkdir(dst);
    await sharp(SRC).resize(s, s).png().toFile(path.join(dst, "ic_launcher_foreground.png"));
    console.log(`  ${dir}/ic_launcher_foreground.png  ${s}×${s}`);
  }

  // ── 3. Splash screens ────────────────────────────────────────────
  const splashSizes = [
    { dir: "drawable-port-mdpi", w: 320, h: 480 },
    { dir: "drawable-port-hdpi", w: 480, h: 800 },
    { dir: "drawable-port-xhdpi", w: 720, h: 1280 },
    { dir: "drawable-port-xxhdpi", w: 960, h: 1600 },
    { dir: "drawable-port-xxxhdpi", w: 1280, h: 1920 },
    { dir: "drawable-land-mdpi", w: 480, h: 320 },
    { dir: "drawable-land-hdpi", w: 800, h: 480 },
    { dir: "drawable-land-xhdpi", w: 1280, h: 720 },
    { dir: "drawable-land-xxhdpi", w: 1600, h: 960 },
    { dir: "drawable-land-xxxhdpi", w: 1920, h: 1280 },
    { dir: "drawable", w: 512, h: 512 },
  ];

  console.log("\n  ── Splash Screens ──");
  for (const { dir, w, h } of splashSizes) {
    const dst = path.join(ANDROID_RES, dir, "splash.png");
    mkdir(path.join(ANDROID_RES, dir));
    await sharp(SRC).resize(w, h, { fit: "cover" }).png().toFile(dst);
    console.log(`  ${dir}/splash.png  ${w}×${h}`);
  }

  // ── 4. Update manifest ──────────────────────────────────────────
  console.log("\n  ── Updating manifest ──");
  const manifestPath = path.join(WEB_PUBLIC, "manifest.webmanifest");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  manifest.icons = [
    {
      src: "/icons/icon.png",
      sizes: "1024x1024",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable",
    },
  ];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`  manifest.webmanifest updated`);

  console.log("\n★ Done.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
