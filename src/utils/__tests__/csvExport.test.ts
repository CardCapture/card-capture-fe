import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadCSV } from '../csvExport';
import type { ProspectCard } from '@/types/card';

/**
 * Run an export and return the first data row keyed by column header. jsdom's
 * Blob has no .text(), so a stub stands in that keeps its constructor parts.
 */
function exportRow(
  cards: ProspectCard[],
  fieldOrder: string[]
): Record<string, string> {
  const parts: string[] = [];

  class CapturingBlob {
    constructor(blobParts: string[]) {
      parts.push(...blobParts);
    }
  }

  vi.stubGlobal('Blob', CapturingBlob);
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn().mockReturnValue('blob:mock'),
    revokeObjectURL: vi.fn(),
  });

  downloadCSV(cards, 'test.csv', 'Test Event', fieldOrder, new Map());

  if (parts.length === 0) throw new Error('no CSV produced');
  const [header, row] = parts.join('').split('\n');
  const headers = header.split(',');
  const values = row.split(',');
  return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
}

const card = (fields: Record<string, { value: string }>): ProspectCard =>
  ({ document_id: 'doc-1', fields } as unknown as ProspectCard);

const PARENT_COLUMNS = [
  'parent_guardian_first_name',
  'parent_guardian_last_name',
];

describe('downloadCSV parent name columns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the split fields when the card has them', () => {
    const row = exportRow(
      [
        card({
          parent_guardian_first_name: { value: 'Karen' },
          parent_guardian_last_name: { value: 'Wild' },
        }),
      ],
      PARENT_COLUMNS
    );

    expect(row['Parent Guardian First Name']).toBe('Karen');
    expect(row['Parent Guardian Last Name']).toBe('Wild');
  });

  // Cards scanned before the field was split only carry the combined value.
  it('falls back to splitting the combined field on older cards', () => {
    const row = exportRow(
      [card({ parent_guardian_name: { value: 'Karen Wild' } })],
      PARENT_COLUMNS
    );

    expect(row['Parent Guardian First Name']).toBe('Karen');
    expect(row['Parent Guardian Last Name']).toBe('Wild');
  });

  it('puts a multi-word surname entirely in the last name column', () => {
    const row = exportRow(
      [card({ parent_guardian_name: { value: 'Ana De La Cruz' } })],
      PARENT_COLUMNS
    );

    expect(row['Parent Guardian First Name']).toBe('Ana');
    expect(row['Parent Guardian Last Name']).toBe('De La Cruz');
  });

  // A split value already on the card wins over the stale combined one.
  it('prefers the split field over the combined field', () => {
    const row = exportRow(
      [
        card({
          parent_guardian_first_name: { value: 'Kathryn' },
          parent_guardian_last_name: { value: 'Wilder' },
          parent_guardian_name: { value: 'Karen Wild' },
        }),
      ],
      PARENT_COLUMNS
    );

    expect(row['Parent Guardian First Name']).toBe('Kathryn');
    expect(row['Parent Guardian Last Name']).toBe('Wilder');
  });

  it('exports blanks when neither field is present', () => {
    const row = exportRow([card({ first_name: { value: 'Jordan' } })], PARENT_COLUMNS);

    expect(row['Parent Guardian First Name']).toBe('');
    expect(row['Parent Guardian Last Name']).toBe('');
  });

  it('still exports the student name columns unchanged', () => {
    const row = exportRow(
      [
        card({
          first_name: { value: 'Jordan' },
          last_name: { value: 'Wild' },
          parent_guardian_name: { value: 'Karen Wild' },
        }),
      ],
      ['first_name', 'last_name', ...PARENT_COLUMNS]
    );

    expect(row['First Name']).toBe('Jordan');
    expect(row['Last Name']).toBe('Wild');
    expect(row['Parent Guardian First Name']).toBe('Karen');
  });
});
