import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '..', 'dist');
const cvHtmlPath = path.join(distDir, 'cv.html');
const html = await readFile(cvHtmlPath, 'utf8');

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox','--disable-setuid-sandbox']
});
const page = await browser.newPage();

// Serve the built file via data URL so assets resolve relative to /dist/
await page.goto('data:text/html;base64,' + Buffer.from(html).toString('base64'), {
  waitUntil: 'networkidle0'
});

// Force print CSS
await page.emulateMediaType('print');

// Print PDF
await page.pdf({
  path: path.join(distDir, 'cv.pdf'),
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true
});

await browser.close();
console.log('✅ Wrote dist/cv.pdf');
