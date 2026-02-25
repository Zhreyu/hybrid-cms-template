const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// ---------------------------------------------------------------------------
// Core fetcher
// ---------------------------------------------------------------------------

async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!res.ok) {
    throw new Error(`[client] ${res.status} ${res.statusText} — ${path}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Typed client
// ---------------------------------------------------------------------------

export const client = {
  get<T>(path: string) {
    return fetcher<T>(path);
  },

  post<T>(path: string, body: unknown) {
    return fetcher<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put<T>(path: string, body: unknown) {
    return fetcher<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  patch<T>(path: string, body: unknown) {
    return fetcher<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  delete<T>(path: string) {
    return fetcher<T>(path, { method: "DELETE" });
  },
};
