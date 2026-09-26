import { delay, getCollection, setCollection } from "./api";

const SESSION_KEY = "stocksense_session";

export async function login(email, password) {
  await delay();
  const users = getCollection("users");
  const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || user.password !== password) {
    throw new Error("Incorrect email or password.");
  }
  const session = { id: user.id, name: user.name, email: user.email, role: user.role };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function signup({ name, email, password }) {
  await delay();
  const users = getCollection("users");
  if (users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    throw new Error("An account with this email already exists.");
  }
  const user = { id: `u${users.length + 1}`, name, email, password, role: "Inventory Manager" };
  setCollection("users", [...users, user]);
  const session = { id: user.id, name: user.name, email: user.email, role: user.role };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function requestOtp(email) {
  await delay();
  const users = getCollection("users");
  const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) throw new Error("No account found with this email.");
  // In production this triggers an email/SMS OTP. Fixed code here for demo purposes.
  return { otp: "123456" };
}

export async function verifyOtp(email, otp) {
  await delay();
  if (otp !== "123456") throw new Error("That code isn't right. Check and try again.");
  return { verified: true };
}

export async function resetPassword(email, newPassword) {
  await delay();
  const users = getCollection("users");
  const idx = users.findIndex((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (idx === -1) throw new Error("No account found with this email.");
  users[idx].password = newPassword;
  setCollection("users", users);
  return { success: true };
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}
