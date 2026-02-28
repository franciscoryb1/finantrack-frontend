"use client";

import { useParams } from "next/navigation";
import { useCardPeriodDetail } from "@/features/installments/hooks/useCardPeriodDetail";
import { useCardPeriods } from "@/features/installments/hooks/useCardPeriods";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

export default function CardInstallmentsPage() {
    const params = useParams();
    const cardId = Number(params.cardId);

    const { data: periods, isLoading: loadingPeriods } =
        useCardPeriods(cardId);

    const [selectedPeriod, setSelectedPeriod] = useState<{
        year: number;
        month: number;
    } | null>(null);

    // 👉 Si no hay período seleccionado y ya cargaron los períodos,
    // seleccionar automáticamente el primero (el más reciente)
    useEffect(() => {
        if (!selectedPeriod && periods && periods.length > 0) {
            setSelectedPeriod({
                year: periods[0].year,
                month: periods[0].month,
            });
        }
    }, [periods, selectedPeriod]);

    const { data, isLoading, error } = useCardPeriodDetail(
        cardId,
        selectedPeriod?.year,
        selectedPeriod?.month
    );


    function formatInstallmentStatus(status: string) {
        switch (status) {
            case "PENDING":
                return { label: "Pendiente", className: "bg-amber-500 text-white" };
            case "BILLED":
                return { label: "Facturada", className: "bg-yellow-500 text-white" };
            case "PAID":
                return { label: "Pagada", className: "bg-green-600 text-white" };
            default:
                return { label: status, className: "" };
        }
    }

    function formatStatementStatus(status: string) {
        switch (status) {
            case "OPEN":
                return { label: "Abierto", className: "bg-blue-500 text-white" };
            case "CLOSED":
                return { label: "Cerrado", className: "bg-yellow-500 text-white" };
            case "PAID":
                return { label: "Pagado", className: "bg-green-600 text-white" };
            default:
                return { label: status, className: "" };
        }
    }

    function InstallmentsTimeline({
        total,
        paid,
        currentNumber,
    }: {
        total: number;
        paid: number;
        currentNumber: number;
    }) {
        return (
            <div className="flex flex-wrap items-center gap-1.5">
                {Array.from({ length: total }).map((_, idx) => {
                    const n = idx + 1;
                    const isPaid = n <= paid;
                    const isCurrent = n === currentNumber;

                    return (
                        <div
                            key={n}
                            className={[
                                "h-2.5 w-6 rounded-full transition-all duration-300",
                                isPaid
                                    ? "bg-green-600"
                                    : isCurrent
                                        ? "bg-blue-500"
                                        : "bg-gray-200 dark:bg-gray-700",
                            ].join(" ")}
                            title={`Cuota ${n}/${total}`}
                        />
                    );
                })}
            </div>
        );
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case "OPEN":
                return (
                    <Badge className="bg-blue-500 hover:bg-blue-500 text-white">
                        Abierto
                    </Badge>
                );
            case "CLOSED":
                return (
                    <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white">
                        Cerrado
                    </Badge>
                );
            case "PAID":
                return (
                    <Badge className="bg-green-600 hover:bg-green-600 text-white">
                        Pagado
                    </Badge>
                );
            default:
                return <Badge>{status}</Badge>;
        }
    }

    if (loadingPeriods || isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    if (error || !data) {
        return <div>Error cargando período</div>;
    }

    const totalToPay = data.purchases.reduce(
        (sum, p) =>
            sum + p.installmentForThisPeriod.amountCents,
        0
    );

    return (
        <div className="space-y-8">

            <Card className="p-6 space-y-6 shadow-sm" style={{ background: data.card.backgroundColor }}>
                {/* Selector arriba (igual que ya lo tenés) */}

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-semibold">{data.card.name}</h1>
                        <p className="text-muted-foreground">
                            Período {data.period.month}/{data.period.year}
                        </p>
                    </div>

                    <Badge className={formatStatementStatus(data.period.status).className}>
                        {formatStatementStatus(data.period.status).label}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="col-span-2 md:col-span-1 rounded-xl border p-4 bg-white dark:bg-slate-950">
                        <p className="text-muted-foreground text-sm">Total a pagar</p>
                        <p className="text-2xl md:text-3xl font-bold">{formatCurrency(totalToPay)}</p>
                        <p className="text-xs text-muted-foreground">
                            {data.purchases.length} compra(s) en este período
                        </p>
                    </div>

                    <div className="rounded-xl border p-4 bg-white dark:bg-slate-950">
                        <p className="text-muted-foreground text-sm">Cierre</p>
                        <p className="font-medium">
                            {new Date(data.period.closingDate).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="rounded-xl border p-4 bg-white dark:bg-slate-950">
                        <p className="text-muted-foreground text-sm">Vencimiento</p>
                        <p className="font-medium">
                            {new Date(data.period.dueDate).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Compras del período */}
            <div className="space-y-4">

                {[...data.purchases]
                    .sort(
                        (a, b) =>
                            b.installmentForThisPeriod.amountCents -
                            a.installmentForThisPeriod.amountCents
                    )
                    .map((purchase) => {

                        const installmentsProgress =
                            purchase.installmentForThisPeriod.installmentNumber;

                        const progressPercent =
                            Math.round(
                                (installmentsProgress /
                                    purchase.installmentsCount) *
                                100
                            );

                        return (
                            <Card
                                key={purchase.purchaseId}
                                className="rounded-lg border p-3 bg-gray-100 dark:bg-gray-900"
                            >

                                {/* Título compra */}
                                <div>
                                    <h2 className="font-semibold text-lg">
                                        {purchase.description ??
                                            "Compra sin descripción"}
                                    </h2>
                                </div>

                                {/* Progreso */}
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>
                                            {installmentsProgress} / {purchase.installmentsCount}
                                        </span>
                                    </div>

                                    <div className="h-2 bg-white dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all"
                                            style={{
                                                width: `${progressPercent}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Cuota del período */}
                                <div className="grid grid-cols-3 gap-2 text-sm mt-1">

                                    <div>
                                        <p className="text-muted-foreground">
                                            Cuota #
                                        </p>
                                        <p className="font-medium">
                                            {
                                                purchase.installmentForThisPeriod
                                                    .installmentNumber
                                            }
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground">
                                            Monto
                                        </p>
                                        <p className="font-medium">
                                            {formatCurrency(
                                                purchase.installmentForThisPeriod
                                                    .amountCents
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        {getStatusBadge(
                                            purchase.installmentForThisPeriod.status
                                        )}
                                    </div>

                                </div>

                            </Card>
                        );
                    })}

            </div>

        </div>
    );
}