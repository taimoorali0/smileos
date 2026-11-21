// Renders build/icon.svg to build/icon.png (512px) using the Playwright/Chromium already on the build machine.
const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
  const svg = fs.readFileSync(__dirname + '/build/icon.svg', 'utf8');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  await p.setContent(`<style>body{margin:0;background:transparent}</style>${svg}`);
  await p.locator('svg').screenshot({ path: __dirname + '/build/icon.png', omitBackground: true });
  await b.close();
  console.log('build/icon.png written');
})();
