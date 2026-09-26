export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}

export function isRequired(value) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

export function minLength(value, len) {
  return String(value || "").trim().length >= len;
}

export function isPositiveNumber(value) {
  const n = Number(value);
  return !Number.isNaN(n) && n >= 0;
}

export function isOtp(value) {
  return /^[0-9]{6}$/.test(value || "");
}
