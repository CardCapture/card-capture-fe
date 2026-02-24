import { logger } from '@/utils/logger';

/**
 * Get a CAPTCHA token from hCaptcha for the given action.
 * Returns undefined if hCaptcha is not configured or not loaded.
 */
export async function getCaptchaToken(action: string): Promise<string | undefined> {
  const siteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

  if (!siteKey) {
    logger.log('hCaptcha skipped: VITE_HCAPTCHA_SITE_KEY not set');
    return undefined;
  }

  if (typeof window.hcaptcha === 'undefined') {
    logger.warn('hCaptcha script not loaded, proceeding without CAPTCHA token');
    return undefined;
  }

  try {
    const token = await window.hcaptcha.execute(siteKey, { action });
    return token;
  } catch (error) {
    logger.warn('hCaptcha execution failed:', error);
    return undefined;
  }
}

/**
 * Load the hCaptcha script tag if a site key is configured.
 * Returns a cleanup function that removes the script on unmount.
 */
export function loadHCaptchaScript(): () => void {
  const siteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;
  if (!siteKey) return () => {};

  if (document.querySelector('script[src*="hcaptcha.com"]')) return () => {};

  const script = document.createElement('script');
  script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  return () => {
    const existing = document.querySelector('script[src*="hcaptcha.com"]');
    if (existing) existing.remove();
  };
}
