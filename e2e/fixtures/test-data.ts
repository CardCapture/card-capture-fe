/**
 * Test data fixtures for E2E tests
 */

export const testUsers = {
  recruiter: {
    email: process.env.TEST_RECRUITER_EMAIL || 'test-recruiter@example.com',
    password: process.env.TEST_RECRUITER_PASSWORD || 'testpassword123',
    firstName: 'Test',
    lastName: 'Recruiter',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'test-admin@example.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'testpassword123',
    firstName: 'Test',
    lastName: 'Admin',
  },
  student: {
    email: process.env.TEST_STUDENT_EMAIL || 'test-student@university.edu',
    firstName: 'Test',
    lastName: 'Student',
  },
};

export const testSchools = {
  existing: {
    name: 'Test University',
    domain: 'test.edu',
  },
  new: {
    name: `New Test School ${Date.now()}`,
  },
};

export const testEvents = {
  sample: {
    name: `Test Event ${new Date().toISOString().split('T')[0]}`,
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    location: 'Test Location',
  },
};

export const testCards = {
  sample: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@student.edu',
    phone: '555-123-4567',
    highSchool: 'Central High School',
    address: '123 Main St',
    city: 'Anytown',
    state: 'TX',
    zipCode: '12345',
  },
};

/**
 * Generate a unique email for testing
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  return `${prefix}+${Date.now()}@example.com`;
}

/**
 * Generate a unique event name for testing
 */
export function generateUniqueEventName(prefix: string = 'Test Event'): string {
  return `${prefix} ${new Date().toISOString().split('T')[0]} ${Date.now().toString(36)}`;
}

/**
 * Format a date for input fields
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get a date N days from now
 */
export function getDateFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateForInput(date);
}
