export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type ApiOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

// Promesa compartida para evitar múltiples refreshes simultáneos
let refreshPromise: Promise<void> | null = null;

async function attemptRefresh(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }).then((res) => {
    if (!res.ok) throw new Error("UNAUTHORIZED");
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
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  // Si es 401 y no es el propio endpoint de refresh/logout, intentamos renovar
  if (res.status === 401 && _retry && !path.includes("/auth/refresh") && !path.includes("/auth/logout")) {
    try {
      await attemptRefresh();
      return apiFetch<T>(path, options, false); // reintento sin retry
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
