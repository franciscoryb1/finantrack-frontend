"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreditCardForm } from "./CreditCardForm";
import { useUpdateCreditCard } from "../hooks/useUpdateCreditCard";
import { CreditCard } from "../api/credit-cards.api";
import { CreditCardFormValues } from "@/features/credit-cards/schemas/schema";

type Props = {
    card: CreditCard;
};

export function EditCreditCardDialog({ card }: Props) {
    const [open, setOpen] = useState(false);
    const mutation = useUpdateCreditCard(card.id);

    async function handleSubmit(values: CreditCardFormValues) {
        const payload = {
            name: values.name,
            brand: values.brand,
            bankAccountId: values.bankAccountId,
            limitCents: values.limit * 100,
            cardLast4: values.cardLast4,
            cardExpiresAt: new Date(values.expiryYear, values.expiryMonth - 1, 1).toISOString(),
            isActive: values.isActive,
            backgroundColor: values.backgroundColor || undefined,
        };

        try {
          await mutation.mutateAsync(payload);
          setOpen(false);
        } catch {
          // el toast de error lo muestra el hook
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Editar</Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar tarjeta</DialogTitle>
                </DialogHeader>

                <CreditCardForm
                    defaultValues={{
                        name: card.name,
                        brand: (card.brand as "VISA" | "MASTERCARD") ?? "VISA",
                        limit: card.limitCents / 100,
                        cardLast4: card.cardLast4,
                        bankAccountId: card.bankAccount.id,
                        expiryMonth: new Date(card.cardExpiresAt).getUTCMonth() + 1,
                        expiryYear: new Date(card.cardExpiresAt).getUTCFullYear(),
                        backgroundColor: card.backgroundColor ?? "",
                    }}
                    onSubmit={handleSubmit}
                    submitLabel="Guardar cambios"
                />
            </DialogContent>
        </Dialog>
    );
}