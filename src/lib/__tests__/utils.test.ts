import { describe, it, expect } from 'vitest';
import {
  cn,
  normalizeName,
  normalizeEmail,
  normalizeAddress,
  normalizeSchoolName,
  normalizeMajor,
  formatPhoneNumber,
  escapeCsvValue,
} from '../utils';

describe('cn (className utility)', () => {
  it('merges classnames correctly', () => {
    expect(cn('base', 'additional')).toBe('base additional');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('merges Tailwind classes without conflict', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
  });
});

describe('normalizeName', () => {
  it('converts ALL CAPS to title case', () => {
    expect(normalizeName('JOHN DOE')).toBe('John Doe');
  });

  it('handles single word names', () => {
    expect(normalizeName('JOHN')).toBe('John');
  });

  it('handles null and undefined', () => {
    expect(normalizeName(null)).toBe('');
    expect(normalizeName(undefined)).toBe('');
  });

  it('preserves existing title case', () => {
    expect(normalizeName('john doe')).toBe('John Doe');
  });

  it('handles multiple spaces', () => {
    expect(normalizeName('JOHN  DOE')).toBe('John  Doe');
  });
});

describe('normalizeEmail', () => {
  it('converts email to lowercase', () => {
    expect(normalizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
  });

  it('trims whitespace', () => {
    expect(normalizeEmail('  test@example.com  ')).toBe('test@example.com');
  });

  it('handles null and undefined', () => {
    expect(normalizeEmail(null)).toBe('');
    expect(normalizeEmail(undefined)).toBe('');
  });
});

describe('normalizeAddress', () => {
  it('converts address to title case', () => {
    expect(normalizeAddress('123 MAIN STREET')).toBe('123 Main Street');
  });

  it('keeps direction abbreviations uppercase', () => {
    expect(normalizeAddress('123 N MAIN ST')).toBe('123 N Main ST');
    expect(normalizeAddress('456 NW OAK AVE')).toBe('456 NW Oak AVE');
  });

  it('handles null and undefined', () => {
    expect(normalizeAddress(null)).toBe('');
    expect(normalizeAddress(undefined)).toBe('');
  });
});

describe('normalizeSchoolName', () => {
  it('converts school name to title case', () => {
    expect(normalizeSchoolName('CENTRAL HIGH SCHOOL')).toBe('Central High School');
  });

  it('keeps school abbreviations uppercase', () => {
    expect(normalizeSchoolName('CENTRAL HS')).toBe('Central HS');
  });

  it('handles null and undefined', () => {
    expect(normalizeSchoolName(null)).toBe('');
    expect(normalizeSchoolName(undefined)).toBe('');
  });
});

describe('normalizeMajor', () => {
  it('converts major to title case', () => {
    expect(normalizeMajor('COMPUTER SCIENCE')).toBe('Computer Science');
  });

  it('keeps degree abbreviations uppercase', () => {
    expect(normalizeMajor('BS IN COMPUTER SCIENCE')).toBe('BS In Computer Science');
  });

  it('handles null and undefined', () => {
    expect(normalizeMajor(null)).toBe('');
    expect(normalizeMajor(undefined)).toBe('');
  });
});

describe('formatPhoneNumber', () => {
  it('formats 10-digit phone numbers', () => {
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
  });

  it('formats 7-digit phone numbers', () => {
    expect(formatPhoneNumber('1234567')).toBe('123-4567');
  });

  it('strips non-numeric characters before formatting', () => {
    expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567');
    expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
  });

  it('handles null and undefined', () => {
    expect(formatPhoneNumber(null)).toBe('');
    expect(formatPhoneNumber(undefined)).toBe('');
  });

  it('returns original for non-standard formats', () => {
    expect(formatPhoneNumber('+1 (555) 123-4567')).toBe('+1 (555) 123-4567');
  });
});

describe('escapeCsvValue', () => {
  it('returns value unchanged when no escaping needed', () => {
    expect(escapeCsvValue('simple value')).toBe('simple value');
  });

  it('wraps values with commas in quotes', () => {
    expect(escapeCsvValue('value, with comma')).toBe('"value, with comma"');
  });

  it('escapes double quotes', () => {
    expect(escapeCsvValue('value "with" quotes')).toBe('"value ""with"" quotes"');
  });

  it('handles newlines', () => {
    expect(escapeCsvValue('value\nwith newline')).toBe('"value\nwith newline"');
  });

  it('handles null and undefined', () => {
    expect(escapeCsvValue(null)).toBe('');
    expect(escapeCsvValue(undefined)).toBe('');
  });

  it('converts numbers to strings', () => {
    expect(escapeCsvValue(123)).toBe('123');
  });
});
