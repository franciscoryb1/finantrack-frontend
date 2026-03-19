import { apiFetch } from "./api";

export type MeResponse = {
  user: {
    userId: number;
    email: string;
  };
};

export async function login(email: string, password: string) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
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
  return apiFetch("/auth/logout", {
    method: "POST",
  });
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