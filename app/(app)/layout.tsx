import { AuthProvider } from "@/components/auth/AuthProvider";
import { AppShell } from "@/components/layout/AppShell";
import { EmailVerificationGate } from "@/components/auth/EmailVerificationGate";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <EmailVerificationGate>
        <AppShell>
          {children}
        </AppShell>
      </EmailVerificationGate>
    </AuthProvider>
  );
}