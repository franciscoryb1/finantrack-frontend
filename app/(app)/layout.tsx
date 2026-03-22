import { AuthProvider } from "@/components/auth/AuthProvider";
import { AppShell } from "@/components/layout/AppShell";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <EmailVerificationBanner />
      <AppShell>
        {children}
      </AppShell>
    </AuthProvider>
  );
}