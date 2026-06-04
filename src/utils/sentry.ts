/**
 * Thin wrappers around @sentry/react so we can report handled errors and
 * notable conditions with consistent tags/context. Sentry is only active when
 * VITE_SENTRY_DSN is set (see src/main.tsx); when it isn't, these calls are
 * no-ops aside from local logging.
 *
 * Usage:
 *   import { reportError, reportMessage } from '@/utils/sentry';
 *   reportError(err, { tags: { feature: 'camera_init' }, extra: { ... } });
 *   reportMessage('Camera capture attempted with no video frame', { extra: { ... } });
 */
import * as Sentry from '@sentry/react';
import { logger } from './logger';

type Extra = Record<string, unknown>;

interface ReportContext {
  tags?: Record<string, string>;
  extra?: Extra;
}

interface MessageContext extends ReportContext {
  level?: Sentry.SeverityLevel;
}

/**
 * Report a handled exception to Sentry (and the console in development).
 */
export function reportError(error: unknown, context: ReportContext = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message, context.extra);
  Sentry.captureException(error, {
    tags: context.tags,
    extra: context.extra,
  });
}

/**
 * Report a notable, non-exception condition to Sentry. Useful for "this
 * shouldn't normally happen" states that otherwise fail silently, such as a
 * capture firing before the camera stream produced any frames.
 */
export function reportMessage(message: string, context: MessageContext = {}): void {
  logger.warn(message, context.extra);
  Sentry.captureMessage(message, {
    level: context.level ?? 'warning',
    tags: context.tags,
    extra: context.extra,
  });
}
