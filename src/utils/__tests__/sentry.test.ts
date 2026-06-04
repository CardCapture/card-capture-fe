import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/react';
import { reportError, reportMessage } from '../sentry';

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

describe('reportError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards the error and context to Sentry.captureException', () => {
    const err = new Error('boom');
    reportError(err, { tags: { feature: 'camera_init' }, extra: { a: 1 } });

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(err, {
      tags: { feature: 'camera_init' },
      extra: { a: 1 },
    });
  });

  it('works with no context', () => {
    const err = new Error('boom');
    reportError(err);

    expect(Sentry.captureException).toHaveBeenCalledWith(err, {
      tags: undefined,
      extra: undefined,
    });
  });

  it('handles non-Error values', () => {
    reportError('just a string');
    expect(Sentry.captureException).toHaveBeenCalledWith('just a string', {
      tags: undefined,
      extra: undefined,
    });
  });
});

describe('reportMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards the message with a default warning level', () => {
    reportMessage('something odd', { tags: { feature: 'camera_capture' }, extra: { b: 2 } });

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    expect(Sentry.captureMessage).toHaveBeenCalledWith('something odd', {
      level: 'warning',
      tags: { feature: 'camera_capture' },
      extra: { b: 2 },
    });
  });

  it('respects an explicit level', () => {
    reportMessage('fatal-ish', { level: 'error' });
    expect(Sentry.captureMessage).toHaveBeenCalledWith('fatal-ish', {
      level: 'error',
      tags: undefined,
      extra: undefined,
    });
  });
});
