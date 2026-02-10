import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Global setup for Playwright tests
 *
 * This script runs once before all tests to:
 * 1. Create auth directory if needed
 * 2. Authenticate and save session state (if credentials provided)
 */
async function globalSetup(config: FullConfig) {
  const authDir = path.join(__dirname, '.auth');
  const authFile = path.join(authDir, 'user.json');

  // Create auth directory if it doesn't exist
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Check if we have test credentials
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.log('No test credentials provided. Creating empty auth state.');
    // Create an empty storage state
    fs.writeFileSync(
      authFile,
      JSON.stringify({
        cookies: [],
        origins: [],
      })
    );
    return;
  }

  // Check if auth file already exists and is recent (less than 1 hour old)
  if (fs.existsSync(authFile)) {
    const stats = fs.statSync(authFile);
    const ageInHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    if (ageInHours < 1) {
      console.log('Using existing auth state (less than 1 hour old)');
      return;
    }
  }

  console.log('Authenticating test user...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
    await page.goto(`${baseURL}/login`);

    // Fill in credentials
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for successful login (redirect away from login page)
    await page.waitForURL(
      (url) => !url.pathname.includes('login'),
      { timeout: 30000 }
    );

    console.log('Login successful. Saving auth state...');

    // Save storage state
    await context.storageState({ path: authFile });
  } catch (error) {
    console.error('Login failed:', error);
    // Create empty auth state so tests can still run
    fs.writeFileSync(
      authFile,
      JSON.stringify({
        cookies: [],
        origins: [],
      })
    );
  } finally {
    await browser.close();
  }
}

export default globalSetup;
