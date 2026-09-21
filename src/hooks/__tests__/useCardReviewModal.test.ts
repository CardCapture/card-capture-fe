import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCardReviewModal } from '../useCardReviewModal';
import type { ProspectCard } from '@/types/card';

vi.mock('@/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: { access_token: 'token' } } }),
    },
  },
}));

const field = (overrides: Record<string, unknown> = {}) => ({
  value: 'x',
  reviewed: false,
  requires_human_review: false,
  review_notes: '',
  confidence: 1,
  bounding_box: [],
  enabled: true,
  required: false,
  review_confidence: 1,
  ...overrides,
});

/** Save a card and return the review status sent to the backend. */
async function statusSentForCard(
  card: ProspectCard,
  visibleFields: string[]
): Promise<string> {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  vi.stubGlobal('fetch', fetchMock);

  const { result } = renderHook(() =>
    useCardReviewModal([card], visibleFields, vi.fn().mockResolvedValue(undefined), new Map())
  );

  act(() => {
    result.current.setSelectedCardForReview(card);
  });

  await act(async () => {
    await result.current.handleReviewSave();
  });

  const [, options] = fetchMock.mock.calls[0];
  return JSON.parse(options.body).status;
}

describe('useCardReviewModal review completion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps a card in needs_review when a visible field is still flagged', async () => {
    const card = {
      document_id: 'doc-1',
      fields: {
        first_name: field(),
        email: field({ requires_human_review: true }),
      },
    } as unknown as ProspectCard;

    expect(await statusSentForCard(card, ['first_name', 'email'])).toBe('needs_review');
  });

  // A field the school turned off in Settings is never rendered, so counting it
  // would strand the card in "needs review" with nothing on screen to act on.
  it('ignores a flagged field the school has turned off', async () => {
    const card = {
      document_id: 'doc-1',
      fields: {
        first_name: field(),
        rank: field({ requires_human_review: true }),
      },
    } as unknown as ProspectCard;

    expect(await statusSentForCard(card, ['first_name'])).toBe('reviewed');
  });

  it('ignores flagged fields that are hidden from the form, such as ceeb_code', async () => {
    const card = {
      document_id: 'doc-1',
      fields: {
        high_school: field(),
        ceeb_code: field({ requires_human_review: true }),
      },
    } as unknown as ProspectCard;

    expect(await statusSentForCard(card, ['high_school'])).toBe('reviewed');
  });

  // Without a visible-field list there is nothing to filter on, so fall back to
  // counting everything rather than calling an unreviewed card done.
  it('counts every field when no visible field list is supplied', async () => {
    const card = {
      document_id: 'doc-1',
      fields: {
        first_name: field(),
        rank: field({ requires_human_review: true }),
      },
    } as unknown as ProspectCard;

    expect(await statusSentForCard(card, [])).toBe('needs_review');
  });
});
