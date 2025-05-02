export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
export const PHONE_REGEX = /^\+?[0-9]{10,12}$/;
export const BOAT_ID_REGEX = /^[A-Z][0-9]{3}$/;

export interface ValidationResult {
  isValid: boolean;
  error: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  return { isValid: true, error: '' };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { 
      isValid: false, 
      error: 'Password must be at least 8 characters long and contain at least one letter and one number' 
    };
  }
  return { isValid: true, error: '' };
};

export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  return { isValid: true, error: '' };
};

export const validateName = (name: string, fieldName: string): ValidationResult => {
  if (!name) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  if (name.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters long` };
  }
  return { isValid: true, error: '' };
};

export const validatePhone = (phone: string): ValidationResult => {
  if (!phone) {
    return { isValid: true, error: '' }; // Phone is optional
  }
  if (!PHONE_REGEX.test(phone)) {
    return { isValid: false, error: 'Please enter a valid phone number (e.g., +94771234567)' };
  }
  return { isValid: true, error: '' };
};

export const validateBoatId = (boatId: string): ValidationResult => {
  if (!boatId) {
    return { isValid: true, error: '' }; // Boat ID is optional
  }
  if (!BOAT_ID_REGEX.test(boatId)) {
    return { isValid: false, error: 'Boat ID must be in format: B followed by 3 numbers (e.g., B001)' };
  }
  return { isValid: true, error: '' };
};

export const validateOtp = (otp: string): ValidationResult => {
  if (!otp) {
    return { isValid: false, error: 'OTP is required' };
  }
  if (!/^\d{5}$/.test(otp)) {
    return { isValid: false, error: 'OTP must be 5 digits' };
  }
  return { isValid: true, error: '' };
};

// Helper function to validate multiple fields
export const validateFields = (validations: ValidationResult[]): ValidationResult => {
  for (const validation of validations) {
    if (!validation.isValid) {
      return validation;
    }
  }
  return { isValid: true, error: '' };
};