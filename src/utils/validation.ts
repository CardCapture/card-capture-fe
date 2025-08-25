export const validators = {
  required: (value: string) => {
    return value.trim() ? null : 'This field is required';
  },

  email: (value: string) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Please enter a valid email address';
  },

  phone: (value: string) => {
    if (!value) return null;
    const phoneRegex = /^[\+]?[(]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(value.replace(/\s/g, '')) ? null : 'Please enter a valid phone number';
  },

  name: (value: string) => {
    if (!value) return validators.required(value);
    if (value.length < 2) return 'Name must be at least 2 characters';
    if (value.length > 50) return 'Name must be less than 50 characters';
    return null;
  },

  gpa: (value: string) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return 'Please enter a valid GPA';
    if (num < 0 || num > 5) return 'GPA must be between 0 and 5';
    return null;
  },

  testScore: (value: string, type: 'SAT' | 'ACT') => {
    if (!value) return null;
    const num = parseInt(value);
    if (isNaN(num)) return `Please enter a valid ${type} score`;
    
    if (type === 'SAT') {
      if (num < 400 || num > 1600) return 'SAT score must be between 400 and 1600';
    } else {
      if (num < 1 || num > 36) return 'ACT score must be between 1 and 36';
    }
    return null;
  },

  zipCode: (value: string) => {
    if (!value) return null;
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(value) ? null : 'Please enter a valid zip code';
  },

  graduationYear: (value: string) => {
    if (!value) return null;
    const year = parseInt(value);
    const currentYear = new Date().getFullYear();
    if (isNaN(year)) return 'Please enter a valid year';
    if (year < currentYear || year > currentYear + 10) {
      return `Graduation year must be between ${currentYear} and ${currentYear + 10}`;
    }
    return null;
  }
};

export const combineValidators = (...validatorFns: Array<(value: string) => string | null>) => {
  return (value: string) => {
    for (const validator of validatorFns) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  };
};