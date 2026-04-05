export function validateRequired(value, label) {
  if (!String(value || '').trim()) return `${label} is required`;
  return '';
}

export function validateEmail(email) {
  if (!email) return 'Email is required';
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return isValid ? '' : 'Enter a valid email address';
}

export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return '';
}
