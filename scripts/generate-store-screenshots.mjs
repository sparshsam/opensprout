/**
 * OpenSprout — Store Screenshot Generator
 *
 * Generates HTML-based store screenshots using Puppeteer.
 * Run: node scripts/generate-store-screenshots.mjs
 *
 * Prerequisites: Install puppeteer: npm install -g puppeteer
 *
 * This script opens the OpenSprout PWA at the production URL,
 * takes screenshots at Play Store and Microsoft Store required resolutions,
 * and saves them to docs/assets/store-screenshots/.
 *
 * Play Store required sizes:
 *   - Phone: 1240 x 2480px (portrait) — 2–8 screenshots
 *   - Tablet: 2048 x 2732px (landscape) — optional
 *   - Feature Graphic: 1024 x 500px
 *   - Icon: 512 x 512px
 *
 * Microsoft Store required:
 *   - Screenshots: 1366 x 768px or 1920 x 1080px
 *   - Feature Graphic: 1350 x 540px
 *   - Icon: 300 x 300px
 */

const OUTPUT_DIR = "docs/assets/store-screenshots";
const PRODUCTION_URL = "https://sprout.kovina.org";

async function main() {
  console.log("=== OpenSprout Store Screenshot Generator ===\n");
  console.log(`Target URL: ${PRODUCTION_URL}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  const fs = await import("fs");
  const path = await import("path");

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let puppeteer;
  try {
    puppeteer = await import("puppeteer");
  } catch {
    console.log(`
  Puppeteer not installed. To generate actual screenshots:
    npm install -g puppeteer
    node scripts/generate-store-screenshots.mjs

  For now, creating placeholder files for the expected screenshots.
  Open each page in a browser and take screenshots at the specified resolutions.
`);
  }

  const screenshots = [
    // Play Store — Phone (portrait 1240x2480)
    { name: "play-phone-dashboard", width: 1240, height: 2480, url: PRODUCTION_URL },
    { name: "play-phone-plants", width: 1240, height: 2480, url: `${PRODUCTION_URL}/plants` },
    { name: "play-phone-identify", width: 1240, height: 2480, url: `${PRODUCTION_URL}/identify` },
    { name: "play-phone-plant-detail", width: 1240, height: 2480, url: `${PRODUCTION_URL}/plants/example` },

    // Play Store — Feature Graphic
    { name: "play-feature-graphic", width: 1024, height: 500, url: PRODUCTION_URL },

    // Microsoft Store
    { name: "ms-store-screenshot", width: 1920, height: 1080, url: PRODUCTION_URL },
    { name: "ms-store-plants", width: 1920, height: 1080, url: `${PRODUCTION_URL}/plants` },
    { name: "ms-feature-graphic", width: 1350, height: 540, url: PRODUCTION_URL },

    // PWA screenshots (for manifest)
    { name: "desktop-dashboard", width: 1920, height: 1080, url: PRODUCTION_URL },
    { name: "mobile-plants", width: 750, height: 1334, url: `${PRODUCTION_URL}/plants` },
  ];

  for (const shot of screenshots) {
    const filePath = path.join(OUTPUT_DIR, `${shot.name}.png`);

    if (puppeteer) {
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
      await page.setViewport({ width: shot.width, height: shot.height });
      await page.goto(shot.url, { waitUntil: "networkidle2", timeout: 30000 });
      await page.screenshot({ path: filePath, fullPage: false });
      await browser.close();
      console.log(`  ✓ ${shot.name} (${shot.width}x${shot.height})`);
    } else {
      // Create placeholder
      fs.writeFileSync(filePath, `Placeholder for ${shot.name} — ${shot.width}x${shot.height}\n`);
      console.log(`  ~ ${shot.name} (${shot.width}x${shot.height}) — placeholder created`);
    }
  }

  console.log("\n=== Done ===");
  console.log(`\nScreenshots saved to: ${OUTPUT_DIR}`);
  console.log("\nNext steps:");
  console.log("  1. Open each screenshot file to verify");
  console.log("  2. Upload to Play Console → Store presence → Store listing");
  console.log("  3. Upload to Partner Center → Products → OpenSprout → App setup");
}

main().catch(console.error);
