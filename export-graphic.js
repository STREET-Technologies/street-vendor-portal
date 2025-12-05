// Quick script to export HTML to PNG using Puppeteer
// Run: node export-graphic.js

const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('🎨 Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set viewport to exact dimensions
  await page.setViewport({
    width: 1600,
    height: 900,
    deviceScaleFactor: 2, // High DPI for crisp image
  });

  // Load the HTML file
  const htmlPath = 'file://' + path.resolve(__dirname, 'feature-graphic.html');
  console.log('📄 Loading HTML:', htmlPath);
  await page.goto(htmlPath, { waitUntil: 'networkidle0' });

  // Wait for fonts to load
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Take screenshot
  console.log('📸 Capturing screenshot...');
  await page.screenshot({
    path: 'street-retail-integration-feature.png',
    fullPage: false,
  });

  await browser.close();
  console.log('✅ Done! Saved as: street-retail-integration-feature.png');
})();
