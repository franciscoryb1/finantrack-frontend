import { useMutation } from "@tanstack/react-query";
import { changePassword } from "../api/profile.api";
import { toast } from "sonner";

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Contraseña actualizada");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
