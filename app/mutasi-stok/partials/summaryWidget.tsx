"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  XCircle,
  Package,
} from "lucide-react";
import { useMutasiStokSummary } from "@/hooks/useMutasiStoks";
import { type GetMutasiStoksParams } from "@/services/mutasiStokService";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryWidgetProps {
  filters?: Omit<GetMutasiStoksParams, "page" | "limit">;
}

export function SummaryWidget({ filters }: SummaryWidgetProps) {
  const { data, isLoading } = useMutasiStokSummary(filters);

  const summary = data?.data || {
    totalMasuk: 0,
    totalKeluar: 0,
    totalSusut: 0,
    totalHilang: 0,
    countMasuk: 0,
    countKeluar: 0,
    countSusut: 0,
    countHilang: 0,
  };

  const cards = [
    {
      title: "Masuk",
      value: summary.totalMasuk || 0,
      count: summary.countMasuk || 0,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      title: "Keluar",
      value: summary.totalKeluar || 0,
      count: summary.countKeluar || 0,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    {
      title: "Susut",
      value: summary.totalSusut || 0,
      count: summary.countSusut || 0,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    {
      title: "Hilang",
      value: summary.totalHilang || 0,
      count: summary.countHilang || 0,
      icon: XCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className={`${card.borderColor} border-2`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <Icon className={`${card.color} size-4`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value.toLocaleString("id-ID")}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.count} transaksi
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

