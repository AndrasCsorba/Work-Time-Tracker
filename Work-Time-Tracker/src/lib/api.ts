// src/lib/api.ts
export const API = "https://work-time-tracker-api.onrender.com";

export async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function sendJSON<T>(
  path: string,
  method: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
