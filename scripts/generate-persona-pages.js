/**
 * Post-build script to generate persona-specific HTML pages
 * with correct meta tags while preserving Vite's generated script tags.
 *
 * Run after `vite build`: node scripts/generate-persona-pages.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

const personas = {
  'for-coordinators': {
    title: 'CardCapture | The Easiest Way to Run a College Fair',
    description: 'The only college fair registration system that works with or without phones. Support QR codes and paper inquiry cards with one platform.',
    url: 'https://cardcapture.io/for-coordinators',
    imageAlt: 'CardCapture - The Easiest Way to Run a College Fair'
  },
  'for-students': {
    title: 'CardCapture | Get Your Free College Fair QR Code',
    description: 'Register once and share your info instantly at every college fair booth. No more filling out forms at each table.',
    url: 'https://cardcapture.io/for-students',
    imageAlt: 'CardCapture - Get Your Free College Fair QR Code'
  }
};

function generatePersonaPage(persona, meta) {
  // Read the main index.html (with Vite's generated script tags)
  const indexPath = path.join(distDir, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');

  // Replace meta tags
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${meta.title}</title>`
  );

  html = html.replace(
    /<meta name="description" content=".*?" \/>/,
    `<meta name="description" content="${meta.description}" />`
  );

  html = html.replace(
    /<meta property="og:title" content=".*?" \/>/,
    `<meta property="og:title" content="${meta.title}" />`
  );

  html = html.replace(
    /<meta property="og:description" content=".*?" \/>/,
    `<meta property="og:description" content="${meta.description}" />`
  );

  html = html.replace(
    /<meta property="og:url" content=".*?" \/>/,
    `<meta property="og:url" content="${meta.url}" />`
  );

  html = html.replace(
    /<meta property="og:image:alt" content=".*?" \/>/,
    `<meta property="og:image:alt" content="${meta.imageAlt}" />`
  );

  // Create directory and write file
  const personaDir = path.join(distDir, persona);
  if (!fs.existsSync(personaDir)) {
    fs.mkdirSync(personaDir, { recursive: true });
  }

  fs.writeFileSync(path.join(personaDir, 'index.html'), html);
  console.log(`✓ Generated ${persona}/index.html`);
}

// Generate all persona pages
console.log('Generating persona-specific pages...\n');

for (const [persona, meta] of Object.entries(personas)) {
  generatePersonaPage(persona, meta);
}

console.log('\nDone!');
