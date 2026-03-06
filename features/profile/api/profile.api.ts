import { apiFetch } from "@/lib/api";

export type UserProfile = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string;
  createdAt: string;
};

export function getProfile() {
  return apiFetch<UserProfile>("/users/me");
}

export function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}) {
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
