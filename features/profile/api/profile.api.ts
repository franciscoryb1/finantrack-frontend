import { apiFetch } from "@/lib/api";

export type UserProfile = {
  id: number;
  email: string;
  phoneNumber: string;
  createdAt: string;
};

export function getProfile() {
  return apiFetch<UserProfile>("/users/me");
}

export function updateProfile(data: { email?: string; phoneNumber?: string }) {
  return apiFetch<UserProfile>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiFetch<{ message: string }>("/users/me/password", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
