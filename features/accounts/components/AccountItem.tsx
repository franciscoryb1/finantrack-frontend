"use client";

import { Account } from "../api/accounts.api";
import { useToggleAccount } from "../hooks/useToggleAccount";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Building2, Smartphone } from "lucide-react";

const TYPE_CONFIG = {
  CASH: { label: "Efectivo", Icon: Wallet },
  BANK: { label: "Cuenta bancaria", Icon: Building2 },
  WALLET: { label: "Billetera virtual", Icon: Smartphone },
  CREDIT_CARD: { label: "Tarjeta de crédito", Icon: Wallet },
};

type Props = {
  account: Account;
};

export function AccountItem({ account }: Props) {
  const { mutate: toggle, isPending } = useToggleAccount();
  const config = TYPE_CONFIG[account.type] ?? TYPE_CONFIG.CASH;
  const Icon = config.Icon;

  return (
    <Card>
      <CardContent className="p-4 flex justify-between items-center gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="min-w-0 space-y-1">
            <div className="font-semibold truncate">{account.name}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{config.label}</Badge>
              {!account.isActive && (
                <Badge variant="outline" className="text-muted-foreground">
                  Inactiva
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(account.currentBalanceCents)}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() =>
              toggle({ id: account.id, activate: !account.isActive })
            }
          >
            {account.isActive ? "Desactivar" : "Activar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
