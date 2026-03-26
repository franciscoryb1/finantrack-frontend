export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type ApiOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// Promesa compartida para evitar múltiples refreshes simultáneos
let refreshPromise: Promise<void> | null = null;

async function attemptRefresh(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: getRefreshToken() }),
  }).then(async (res) => {
    if (!res.ok) throw new Error("UNAUTHORIZED");
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {},
  _retry = true,
): Promise<T> {
  const token = getAccessToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401 && _retry && !path.includes("/auth/refresh") && !path.includes("/auth/logout")) {
    try {
      await attemptRefresh();
      return apiFetch<T>(path, options, false);
    } catch {
      throw new Error("UNAUTHORIZED");
    }
  }

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = Array.isArray(data?.message)
      ? data.message[0]
      : (data?.message ?? "Error inesperado");
    throw new Error(message);
  }

  if (res.status === 204) {
    return null as T;
  }

  return res.json();
}
