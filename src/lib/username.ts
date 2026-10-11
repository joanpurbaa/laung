import "server-only";

export function normalizeUsername(input: string): string {
  return input
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

export function usernameBaseFrom(name: string, email: string): string {
  const local = email.split("@")[0] ?? "";
  return normalizeUsername(name) || normalizeUsername(local);
}