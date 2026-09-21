import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchoolService, type CardField } from '../SchoolService';
import { backendSchoolsApi } from '@/api/backend/schools';
import { schoolsApi } from '@/api/supabase/schools';

vi.mock('@/api/backend/schools', () => ({
  backendSchoolsApi: {
    updateCardFields: vi.fn().mockResolvedValue({ card_fields: [] }),
  },
}));

vi.mock('@/api/supabase/schools', () => ({
  schoolsApi: {
    updateCardFields: vi.fn(),
  },
}));

const fields: CardField[] = [
  { key: 'first_name', label: 'First Name', visible: true, required: false },
  { key: 'rank', label: 'Rank', visible: false, required: false },
];

describe('SchoolService.updateCardFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Writing card_fields straight to Supabase is silently rejected by RLS, which
  // is what made "Visible" toggles in Settings appear to save without saving.
  it('saves through the backend, never directly to Supabase', async () => {
    await SchoolService.updateCardFields('school-1', fields);

    expect(backendSchoolsApi.updateCardFields).toHaveBeenCalledTimes(1);
    expect(vi.mocked(schoolsApi.updateCardFields)).not.toHaveBeenCalled();
  });

  it('maps the UI "visible" flag onto the stored "enabled" flag', async () => {
    await SchoolService.updateCardFields('school-1', fields);

    const [, saved] = vi.mocked(backendSchoolsApi.updateCardFields).mock.calls[0];
    expect(saved).toEqual([
      expect.objectContaining({ key: 'first_name', enabled: true }),
      expect.objectContaining({ key: 'rank', enabled: false }),
    ]);
  });

  // Settings loads the config, then saves the whole array back. Anything the
  // round trip drops is silently deleted from the school's configuration.
  it('round-trips a real school config without losing options or custom labels', async () => {
    const stored = [
      { key: 'first_name', enabled: true, required: false, field_type: 'text' },
      {
        key: 'gender',
        enabled: true,
        required: false,
        field_type: 'select',
        options: ['Female', 'Male'],
      },
      {
        key: 'familiarity_with_acu',
        enabled: true,
        required: false,
        field_type: 'select',
        options: ['Familiar', 'Not familiar', 'Very familiar'],
      },
      {
        key: 'parent_guardian_email_address',
        label: 'Parent Guardian Email Address',
        enabled: true,
        required: false,
        field_type: 'email',
      },
      { key: 'major', enabled: false, required: false, field_type: 'text' },
    ] as never;

    const ui = SchoolService.transformCardFieldsForUI(stored);
    await SchoolService.updateCardFields('school-1', ui);

    const [, saved] = vi.mocked(backendSchoolsApi.updateCardFields).mock.calls[0];
    const byKey = Object.fromEntries(
      (saved as Array<Record<string, unknown>>).map((f) => [f.key, f])
    );

    expect(byKey.gender.options).toEqual(['Female', 'Male']);
    expect(byKey.familiarity_with_acu.options).toEqual([
      'Familiar',
      'Not familiar',
      'Very familiar',
    ]);
    expect(byKey.major.enabled).toBe(false);
    expect(byKey.parent_guardian_email_address.field_type).toBe('email');
    // Every configured key survives the trip.
    expect(Object.keys(byKey)).toEqual(
      (stored as unknown as Array<{ key: string }>).map((f) => f.key)
    );
  });

  it('propagates a failed save so the UI cannot report success', async () => {
    vi.mocked(backendSchoolsApi.updateCardFields).mockRejectedValueOnce(
      new Error('Access denied. You can only update your own school.')
    );

    await expect(SchoolService.updateCardFields('school-1', fields)).rejects.toThrow(
      'Access denied'
    );
  });
});
