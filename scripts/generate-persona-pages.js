/**
 * Post-build script to generate route-specific HTML pages
 * with correct OG meta tags for link previews / social sharing.
 *
 * Crawlers (iMessage, Slack, Twitter, etc.) don't execute JS,
 * so each shareable route needs its own index.html with the
 * right tags baked in at build time.
 *
 * Run after `vite build`: node scripts/generate-persona-pages.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

const routes = {
  'for-recruiters': {
    title: 'CardCapture | Turn Inquiry Cards Into CRM Leads Instantly',
    description: 'Scan and digitize handwritten inquiry cards 12x faster. Follow up with students within 24 hours instead of weeks.',
    url: 'https://cardcapture.io/for-recruiters',
    imageAlt: 'CardCapture - Turn Inquiry Cards Into CRM Leads Instantly',
  },
  'for-coordinators': {
    title: 'CardCapture | The Easiest Way to Run a College Fair',
    description: 'The only college fair registration system that works with or without phones. Support QR codes and paper inquiry cards with one platform.',
    url: 'https://cardcapture.io/for-coordinators',
    imageAlt: 'CardCapture - The Easiest Way to Run a College Fair',
  },
  'for-students': {
    title: 'CardCapture | Get Your Free College Fair QR Code',
    description: 'Register once and share your info instantly at every college fair booth. No more filling out forms at each table.',
    url: 'https://cardcapture.io/for-students',
    imageAlt: 'CardCapture - Get Your Free College Fair QR Code',
  },
  'register': {
    title: 'CardCapture | Create Your Student Profile',
    description: 'Register in seconds and get a personal QR code for college fairs. One profile, used everywhere. Secure, private, and always under your control.',
    url: 'https://cardcapture.io/register',
    imageAlt: 'CardCapture - Create Your Student Profile',
  },
  'register/verify': {
    title: 'CardCapture | Complete Your Registration',
    description: 'Tap to finish signing up and get your QR code.',
    url: 'https://cardcapture.io/register/verify',
    imageAlt: 'CardCapture - Complete Your Registration',
  },
};

function generateRoutePage(route, meta) {
  const indexPath = path.join(distDir, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');

  // Replace all meta tags
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
  const routeDir = path.join(distDir, route);
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }

  fs.writeFileSync(path.join(routeDir, 'index.html'), html);
  console.log(`  ${route}/index.html`);
}

// Generate all route pages
console.log('Generating route-specific OG pages:\n');

for (const [route, meta] of Object.entries(routes)) {
  generateRoutePage(route, meta);
}

console.log('\nDone!');
