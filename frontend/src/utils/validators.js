/**
 * Input validation utilities
 */

export function validateReportDescription(description) {
  if (!description || typeof description !== 'string') {
    return 'Description is required.';
  }
  const trimmed = description.trim();
  if (trimmed.length === 0) {
    return 'Description cannot be empty or whitespace only.';
  }
  if (trimmed.length > 500) {
    return 'Description cannot exceed 500 characters.';
  }
  return null;
}

export function validateLoginForm({ email, password }) {
  const errors = {};
  if (!email || !email.trim()) {
    errors.email = 'Staff email or username is required.';
  }
  if (!password || !password.trim()) {
    errors.password = 'Password is required.';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
