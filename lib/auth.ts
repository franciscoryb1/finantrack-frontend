import { apiFetch, setTokens, clearTokens } from "./api";

export type MeResponse = {
  user: {
    userId: number;
    email: string;
    emailVerified: boolean;
  };
};

export async function login(email: string, password: string) {
  const data = await apiFetch<{ access_token: string; refresh_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function me() {
  return apiFetch<MeResponse>("/auth/me", {
    method: "GET",
  });
}

export async function refresh() {
  return apiFetch("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function logout() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } finally {
    clearTokens();
  }
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function verifyEmail(token: string) {
  return apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: "GET",
  });
}

export async function resendVerification() {
  return apiFetch("/auth/resend-verification", {
    method: "POST",
  });
}

export async function forgotPassword(email: string) {
  return apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}
