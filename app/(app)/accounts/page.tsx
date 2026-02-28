"use client";

import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { CreateAccountDialog } from "@/features/accounts/components/CreateAccountDialog";
import { AccountItem } from "@/features/accounts/components/AccountItem";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountsPage() {
  const { data, isLoading, error } = useAccounts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive">Error al cargar cuentas.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mis cuentas</h1>
        <CreateAccountDialog />
      </div>

      {data?.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No tenés cuentas creadas todavía.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {data?.map((account) => (
          <AccountItem key={account.id} account={account} />
        ))}
      </div>
    </div>
  );
}
