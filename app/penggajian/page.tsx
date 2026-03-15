"use client";

import * as React from "react";
import {
  useGroupedPenggajians,
  useGeneratePenggajian,
  useBatchPayment,
  useSinglePayment,
} from "@/hooks/usePenggajianNew";
import { useKaryawans } from "@/hooks/useKaryawans";
import { useRekenings } from "@/hooks/useRekenings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  CreditCard,
  Printer,
} from "lucide-react";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import dayjs from "@/lib/dayjs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  GroupedPenggajian,
  Penggajian,
} from "@/services/penggajianNewService";
import { Separator } from "@/components/ui/separator";
import { useConfirmPassword } from "@/components/dialog-confirm-password";

export default function PenggajianPage() {
  const router = useRouter();
  const { openConfirmPassword } = useConfirmPassword();

  // State untuk filter periode (bulan dan tahun)
  const [periodeBulan, setPeriodeBulan] = React.useState<number>(
    new Date().getMonth() + 1
  );
  const [periodeTahun, setPeriodeTahun] = React.useState<number>(
    new Date().getFullYear()
  );

  // State untuk dialog
  const [generateDialogOpen, setGenerateDialogOpen] = React.useState(false);
  const [batchPaymentDialogOpen, setBatchPaymentDialogOpen] =
    React.useState(false);
  const [singlePaymentDialogOpen, setSinglePaymentDialogOpen] =
    React.useState(false);
  const [selectedPenggajian, setSelectedPenggajian] = React.useState<string[]>(
    []
  );
  const [selectedPenggajianForPayment, setSelectedPenggajianForPayment] =
    React.useState<Penggajian | null>(null);
  // State untuk periode di dialog generate (terpisah dari filter utama)
  const [generateMode, setGenerateMode] = React.useState<"periode" | "rentang">("periode");
  const [generateTanggal, setGenerateTanggal] = React.useState<number>(18);
  const [generatePeriodeBulan, setGeneratePeriodeBulan] = React.useState<number>(new Date().getMonth() + 1);
  const [generatePeriodeTahun, setGeneratePeriodeTahun] = React.useState<number>(new Date().getFullYear());
  const [generateTanggalAwal, setGenerateTanggalAwal] = React.useState<string>("");
  const [generateTanggalAkhir, setGenerateTanggalAkhir] = React.useState<string>("");

  // State untuk pilihan karyawan (multi-select dengan checkbox)
  const [selectedKaryawanIds, setSelectedKaryawanIds] = React.useState<
    string[]
  >([]);
  const [selectAll, setSelectAll] = React.useState(false);

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      // Select all karyawan
      const allIds = karyawanData?.data?.map((k) => k.id) || [];
      setSelectedKaryawanIds(allIds);
    } else {
      // Deselect all
      setSelectedKaryawanIds([]);
    }
  };

  // Handle individual karyawan selection
  const handleKaryawanToggle = (karyawanId: string, checked: boolean) => {
    if (checked) {
      setSelectedKaryawanIds((prev) => [...prev, karyawanId]);
    } else {
      setSelectedKaryawanIds((prev) => prev.filter((id) => id !== karyawanId));
      // Jika ada yang di-uncheck, selectAll juga harus false
      setSelectAll(false);
    }
  };

  // Reset generate dialog state saat dibuka
  React.useEffect(() => {
    if (generateDialogOpen) {
      setGenerateMode("periode");
      setGenerateTanggal(18);
      setGeneratePeriodeBulan(new Date().getMonth() + 1);
      setGeneratePeriodeTahun(new Date().getFullYear());
      setGenerateTanggalAwal("");
      setGenerateTanggalAkhir("");
      setSelectedKaryawanIds([]);
      setSelectAll(false);
    }
  }, [generateDialogOpen]);

  // Data fetching
  const {
    data: groupedData,
    isLoading,
    error,
    refetch,
  } = useGroupedPenggajians({
    periodeBulan: periodeBulan,
    periodeTahun: periodeTahun,
  });

  const { data: karyawanData } = useKaryawans({ limit: 1000 });

  // Auto refetch ketika periode berubah
  React.useEffect(() => {
    if (periodeBulan && periodeTahun) {
      refetch();
    }
  }, [periodeBulan, periodeTahun, refetch]);

  // Update selectAll state ketika selectedKaryawanIds berubah
  React.useEffect(() => {
    const allIds = karyawanData?.data?.map((k) => k.id) || [];
    if (allIds.length > 0 && selectedKaryawanIds.length === allIds.length) {
      // Cek apakah semua ID terpilih
      const allSelected = allIds.every((id) =>
        selectedKaryawanIds.includes(id)
      );
      setSelectAll(allSelected);
    } else {
      setSelectAll(false);
    }
  }, [selectedKaryawanIds, karyawanData]);
  const { data: rekeningData } = useRekenings({ limit: 1000 });

  // Mutations
  const generatePenggajian = useGeneratePenggajian();
  const batchPayment = useBatchPayment();
  const singlePayment = useSinglePayment();

  // Handle generate penggajian
  const handleGenerate = async () => {
    if (generateMode === "rentang") {
      if (!generateTanggalAwal || !generateTanggalAkhir) {
        toast.error("Isi tanggal awal dan tanggal akhir");
        return;
      }
      if (generateTanggalAwal > generateTanggalAkhir) {
        toast.error("Tanggal awal tidak boleh lebih besar dari tanggal akhir");
        return;
      }
    } else if (!generatePeriodeBulan || !generatePeriodeTahun) {
      toast.error("Pilih bulan dan tahun untuk mode periode");
      return;
    }

    try {
      const payload: any =
        generateMode === "rentang"
          ? {
              tanggalAwal: generateTanggalAwal,
              tanggalAkhir: generateTanggalAkhir,
              karyawanIds:
                selectedKaryawanIds.length > 0 ? selectedKaryawanIds : undefined,
            }
          : {
              tanggal: generateTanggal,
              periodeBulan: generatePeriodeBulan,
              periodeTahun: generatePeriodeTahun,
              karyawanIds:
                selectedKaryawanIds.length > 0 ? selectedKaryawanIds : undefined,
            };

      const response = await generatePenggajian.mutateAsync(payload);

      // Response adalah array hasil generate (dari mutation response.data)
      if (Array.isArray(response)) {
        const skipped = response.filter((item: any) => item.skipped === true);
        const success = response.filter((item: any) => !item.skipped);

        if (skipped.length > 0) {
          const skippedNames = skipped
            .map((item: any) => item.karyawan?.nama || "Unknown")
            .join(", ");
          toast.warning(`${skipped.length} karyawan di-skip: ${skippedNames}`, {
            duration: 5000,
          });
        }

        if (success.length > 0) {
          toast.success(
            `Penggajian berhasil di-generate untuk ${success.length} karyawan`
          );
        } else if (skipped.length > 0) {
          toast.info("Semua penggajian sudah ada atau sudah LUNAS");
        } else {
          toast.info(
            "Tidak ada penggajian yang di-generate. Pastikan: (1) ada karyawan dengan gaji terisi, (2) ada absensi status HADIR di periode ini, (3) outlet dipilih di header."
          );
        }
      } else {
        toast.success("Penggajian berhasil di-generate");
      }

      setGenerateDialogOpen(false);
      // Reset state setelah generate
      setSelectedKaryawanIds([]);
      setSelectAll(false);
      refetch();
    } catch (error) {
      // Error sudah dihandle di hook
    }
  };

  // Handle batch payment
  const batchPaymentForm = useForm({
    defaultValues: {
      isCashless: false,
      rekeningId: "",
    } as any,
    onSubmit: async ({ value }) => {
      if (selectedPenggajian.length === 0) {
        toast.error("Pilih minimal satu penggajian");
        return;
      }
      return new Promise<void>((resolve, reject) => {
        openConfirmPassword({
          title: "Konfirmasi password",
          description: "Masukkan password Anda untuk pembayaran gaji batch.",
          onConfirm: async () => {
            try {
              await batchPayment.mutateAsync({
                penggajianIds: selectedPenggajian,
                isCashless: value.isCashless,
                rekeningId: value.isCashless ? value.rekeningId : null,
                catatan: "Pembayaran gaji batch dicatat secara otomatis oleh sistem.",
              });
              setBatchPaymentDialogOpen(false);
              setSelectedPenggajian([]);
              refetch();
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          onCancel: () => reject(new Error("cancelled")),
        });
      });
    },
  });

  // Toggle select penggajian
  const togglePenggajian = (penggajianId: string) => {
    setSelectedPenggajian((prev) =>
      prev.includes(penggajianId)
        ? prev.filter((id) => id !== penggajianId)
        : [...prev, penggajianId]
    );
  };

  // Select all penggajian yang belum lunas
  const selectAllBelumLunas = () => {
    if (!groupedData) return;
    const allIds: string[] = [];
    groupedData.forEach((group) => {
      group.penggajian.forEach((p) => {
        if (p.status !== "LUNAS") {
          allIds.push(p.id);
        }
      });
    });
    setSelectedPenggajian(allIds);
  };

  // Calculate totals
  const totals = React.useMemo(() => {
    if (!groupedData) return { totalGaji: 0, totalDibayar: 0, totalSisa: 0 };

    return groupedData.reduce(
      (acc, group) => ({
        totalGaji: acc.totalGaji + group.totalGaji,
        totalDibayar: acc.totalDibayar + group.totalDibayar,
        totalSisa: acc.totalSisa + group.sisa,
      }),
      { totalGaji: 0, totalDibayar: 0, totalSisa: 0 }
    );
  }, [groupedData]);

  // Rekening options
  const rekeningOptions = React.useMemo(() => {
    if (!rekeningData?.data) return [];
    return rekeningData.data
      .filter((r) => r.isActive)
      .map((r) => ({
        value: r.id,
        label: `${r.bank} - ${r.nama}`,
      }));
  }, [rekeningData]);

  // Print data gaji (laporan A4)
  const handlePrintDataGaji = () => {
    if (!groupedData || groupedData.length === 0) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const periodeLabel =
      dayjs().month(periodeBulan - 1).format("MMMM") + " " + periodeTahun;
    const currentDate = dayjs().format("DD MMMM YYYY HH:mm");

    const tableRows = groupedData
      .flatMap((group: GroupedPenggajian) =>
        group.penggajian.map(
          (p) => `
          <tr>
            <td>${group.karyawan?.nama ?? "-"}</td>
            <td>${dayjs().month(p.periodeBulan - 1).format("MMMM")} ${p.periodeTahun}</td>
            <td>Rp ${formatCurrency(Number(p.totalGaji))}</td>
            <td>Rp ${formatCurrency(Number(p.dibayar))}</td>
            <td>Rp ${formatCurrency(Number(p.totalGaji) - Number(p.dibayar))}</td>
            <td>${p.status ?? "-"}</td>
          </tr>`
        )
      )
      .join("");

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Data Penggajian - ${periodeLabel}</title>
          <style>
            @media print {
              @page { margin: 1.5cm; size: A4; }
              body { font-family: Arial, sans-serif; font-size: 10pt; }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              font-size: 11pt;
            }
            .header {
              text-align: center;
              margin-bottom: 24px;
              border-bottom: 2px solid #000;
              padding-bottom: 12px;
            }
            .header h1 { margin: 0; font-size: 20pt; }
            .header p { margin: 6px 0; font-size: 10pt; }
            .info {
              margin-bottom: 20px;
              padding: 12px;
              border: 1px solid #ddd;
              background-color: #f9f9f9;
              font-size: 10pt;
            }
            .info-row { margin-bottom: 6px; }
            .info-label { font-weight: bold; display: inline-block; min-width: 140px; }
            .summary {
              margin: 20px 0;
              padding: 14px;
              border: 1px solid #000;
              background-color: #f5f5f5;
            }
            .summary h3 { margin-top: 0; margin-bottom: 12px; font-size: 12pt; }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
            }
            .summary-item { text-align: center; }
            .summary-value { font-size: 13pt; font-weight: bold; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
              font-size: 9pt;
            }
            th, td {
              border: 1px solid #000;
              padding: 6px 8px;
              text-align: left;
            }
            th { background-color: #e8e8e8; font-weight: bold; }
            .footer {
              margin-top: 28px;
              text-align: center;
              font-size: 9pt;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DATA PENGGAJIAN</h1>
            <p>BJM - Kotamobagu</p>
            <p>Dicetak pada: ${currentDate}</p>
          </div>
          <div class="info">
            <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 12pt;">Periode</h3>
            <div class="info-row"><span class="info-label">Bulan / Tahun:</span> ${periodeLabel}</div>
          </div>
          <div class="summary">
            <h3>Ringkasan</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-value">${groupedData?.length ?? 0}</div>
                <div>Total Karyawan</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">Rp ${formatCurrency(totals.totalGaji)}</div>
                <div>Total Gaji</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">Rp ${formatCurrency(totals.totalDibayar)}</div>
                <div>Total Dibayar</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">Rp ${formatCurrency(totals.totalSisa)}</div>
                <div>Sisa</div>
              </div>
            </div>
          </div>
          <h3 style="margin-top: 20px; margin-bottom: 8px; font-size: 12pt;">Detail Penggajian</h3>
          <table>
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Periode</th>
                <th>Total Gaji</th>
                <th>Dibayar</th>
                <th>Sisa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div class="footer">
            <p>Halaman 1 dari 1</p>
            <p>Total: ${groupedData?.length ?? 0} karyawan</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  // Loading & Error states
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">
          Error: {error.message || "Gagal memuat data penggajian"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent>
          <div className="flex gap-2 items-end">
            <div>
              <Select
                value={String(periodeBulan)}
                onValueChange={(value) => setPeriodeBulan(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((bulan) => (
                    <SelectItem key={bulan} value={String(bulan)}>
                      {dayjs()
                        .month(bulan - 1)
                        .format("MMMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={String(periodeTahun)}
                onValueChange={(value) => setPeriodeTahun(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: 10 },
                    (_, i) => new Date().getFullYear() - 5 + i
                  ).map((tahun) => (
                    <SelectItem key={tahun} value={String(tahun)}>
                      {tahun}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setPeriodeBulan(new Date().getMonth() + 1);
                setPeriodeTahun(new Date().getFullYear());
                refetch();
              }}
            >
              Reset
            </Button>
            <Button onClick={() => setGenerateDialogOpen(true)}>
              <Plus className="mr-2 size-4" />
              Generate Penggajian
            </Button>
            <Button
              variant="outline"
              onClick={handlePrintDataGaji}
              disabled={!groupedData || groupedData.length === 0}
            >
              <Printer className="mr-2 size-4" />
              Print Data Gaji
            </Button>
          </div>
          <Separator className="my-3" />
          <div className="mb-2 leading-4">
            <h2 className=" font-bold">Ringkasan Summary</h2>
            <small>
              ini ada summary dari penggajian yang telah di generate
            </small>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Karyawan</p>
              <p className="text-2xl font-bold">
                {groupedData?.length ? groupedData?.length : 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Gaji</p>
              <p className="text-2xl font-bold">
                {totals.totalGaji ? formatCurrency(totals.totalGaji) : 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Dibayar</p>
              <p className="text-2xl font-bold text-green-600">
                {totals.totalDibayar ? formatCurrency(totals.totalDibayar) : 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sisa</p>
              <p className="text-2xl font-bold text-red-600">
                {totals.totalSisa ? formatCurrency(totals.totalSisa) : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Action Bar */}
      <div className="flex items-center  gap-2">
        {groupedData && groupedData.length > 0 && (
          <>
            <Button variant="outline" onClick={selectAllBelumLunas}>
              Pilih Semua Belum Lunas
            </Button>
            <Button variant="outline" onClick={() => setSelectedPenggajian([])}>
              Batal Pilih
            </Button>
          </>
        )}

        <Button
          disabled={selectedPenggajian.length === 0}
          onClick={() => setBatchPaymentDialogOpen(true)}
          variant="default"
        >
          <CreditCard className="mr-2 size-4" />
          Bayar Lunas ({selectedPenggajian.length})
        </Button>
      </div>

      {groupedData && groupedData.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        groupedData.length > 0 &&
                        groupedData.every((group) =>
                          group.penggajian.every((p) =>
                            selectedPenggajian.includes(p.id)
                          )
                        )
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const allIds: string[] = [];
                          groupedData.forEach((group) => {
                            group.penggajian.forEach((p) => {
                              if (p.status !== "LUNAS") {
                                allIds.push(p.id);
                              }
                            });
                          });
                          setSelectedPenggajian(allIds);
                        } else {
                          setSelectedPenggajian([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Total Gaji</TableHead>
                  <TableHead>Dibayar</TableHead>
                  <TableHead>Sisa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedData.flatMap((group: GroupedPenggajian) =>
                  group.penggajian.map((penggajian) => (
                    <TableRow key={penggajian.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPenggajian.includes(penggajian.id)}
                          onCheckedChange={() =>
                            togglePenggajian(penggajian.id)
                          }
                          disabled={penggajian.status === "LUNAS"}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {group.karyawan.nama}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {dayjs()
                          .month(penggajian.periodeBulan - 1)
                          .format("MMMM")}{" "}
                        {penggajian.periodeTahun}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(penggajian.totalGaji)}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(penggajian.dibayar)}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {penggajian.totalGaji - penggajian.dibayar > 0
                          ? formatCurrency(
                              penggajian.totalGaji - penggajian.dibayar
                            )
                          : 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            penggajian.status === "LUNAS"
                              ? "default"
                              : penggajian.status === "PARTIAL"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {penggajian.status === "LUNAS" ? (
                            <CheckCircle2 className="mr-1 size-3" />
                          ) : penggajian.status === "PARTIAL" ? (
                            <AlertCircle className="mr-1 size-3" />
                          ) : (
                            <XCircle className="mr-1 size-3" />
                          )}
                          {penggajian.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {penggajian.status !== "LUNAS" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSelectedPenggajianForPayment(penggajian);
                                setSinglePaymentDialogOpen(true);
                              }}
                            >
                              Bayar
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/penggajian/${penggajian.id}`
                              )
                            }
                          >
                            Detail
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Tidak ada data penggajian untuk periode ini. Klik "Generate
            Penggajian" untuk membuat penggajian baru.
          </CardContent>
        </Card>
      )}
      {/* Generate Dialog */}
      <Dialog open={generateDialogOpen}  onOpenChange={setGenerateDialogOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Generate Penggajian</DialogTitle>
            <DialogDescription>
              Generate penggajian: by periode (tanggal + bulan + tahun) atau manual by rentang tanggal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="generateMode"
                checked={generateMode === "periode"}
                onChange={() => setGenerateMode("periode")}
                className="rounded-full"
              />
              <span className="text-sm">Periode </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="generateMode"
                checked={generateMode === "rentang"}
                onChange={() => setGenerateMode("rentang")}
                className="rounded-full"
              />
              <span className="text-sm">Rentang tanggal manual</span>
            </label>
          </div>

          {generateMode === "periode" ? (
          <>
          <p className="text-xs text-muted-foreground border border-emerald-500 p-2 rounded-lg space-y-1.5">
            <span className="font-medium text-foreground block">Cara periode otomatis:</span>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>Isi <strong>tanggal, bulan, dan tahun</strong> sebagai <strong>hari terakhir periode gajian</strong>.</li>
              <li>Periode absen = <strong>tanggal yang sama di bulan sebelumnya</strong> s/d <strong>tanggal yang Anda pilih</strong>.</li>
            </ul>
            <span className="block pt-1 border-t border-emerald-500/40 mt-1.5"><strong>Contoh:</strong> Pilih 18 Januari 2025 → periode absen: <strong>18 Des 2024 s/d 18 Jan 2025</strong>.</span>
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tanggal (1-31)</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={generateTanggal}
                onChange={(e) => setGenerateTanggal(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
              />
            </div>
            <div className="space-y-2">
              <Label>Bulan</Label>
              <Select
                value={String(generatePeriodeBulan)}
                onValueChange={(v) => setGeneratePeriodeBulan(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((b) => (
                    <SelectItem key={b} value={String(b)}>
                      {dayjs().month(b - 1).format("MMMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tahun</Label>
              <Select
                value={String(generatePeriodeTahun)}
                onValueChange={(v) => setGeneratePeriodeTahun(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          </>
          ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Awal</Label>
              <Input
                type="date"
                value={generateTanggalAwal}
                onChange={(e) => setGenerateTanggalAwal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                value={generateTanggalAkhir}
                onChange={(e) => setGenerateTanggalAkhir(e.target.value)}
              />
            </div>
          </div>
          )}

            <div className="space-y-2">
              <Label>Pilih Karyawan </Label>
              <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                <div className="flex items-center space-x-2 pb-3 border-b mb-3">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Pilih Semuanya
                  </label>
                </div>
                <div className="space-y-2">
                  {karyawanData?.data?.map((k) => (
                    <div key={k.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`karyawan-${k.id}`}
                        checked={selectedKaryawanIds.includes(k.id)}
                        onCheckedChange={(checked) =>
                          handleKaryawanToggle(k.id, checked === true)
                        }
                      />
                      <label
                        htmlFor={`karyawan-${k.id}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {k.nama}
                      </label>
                    </div>
                  ))}
                  {(!karyawanData?.data || karyawanData.data.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Tidak ada karyawan
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={() =>
                openConfirmPassword({
                  title: "Konfirmasi password",
                  description: "Masukkan password Anda untuk generate penggajian.",
                  onConfirm: handleGenerate,
                })
              }
              disabled={
                generatePenggajian.isPending ||
                (generateMode === "periode"
                  ? !generatePeriodeBulan || !generatePeriodeTahun
                  : !generateTanggalAwal || !generateTanggalAkhir || generateTanggalAwal > generateTanggalAkhir)
              }
            >
              {generatePenggajian.isPending ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Batch Payment Dialog */}
      <Dialog
        open={batchPaymentDialogOpen}
        onOpenChange={setBatchPaymentDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Batch Payment</DialogTitle>
            <DialogDescription>
              Bayar {selectedPenggajian.length} penggajian sekaligus
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              batchPaymentForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <batchPaymentForm.Field name="isCashless">
              {(field) => (
                <Field>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value || false}
                      onCheckedChange={(checked) => {
                        field.handleChange(checked as boolean);
                        if (!checked) {
                          batchPaymentForm.setFieldValue("rekeningId", "");
                          batchPaymentForm.setFieldMeta("rekeningId", (prev: any) => ({
                            ...prev,
                            errors: [],
                            errorMap: {},
                          }));
                        }
                        field.handleBlur();
                      }}
                      onBlur={field.handleBlur}
                    />
                    <Label htmlFor={field.name}>Gunakan Cashless</Label>
                  </div>
                </Field>
              )}
            </batchPaymentForm.Field>

            <batchPaymentForm.Subscribe
              selector={(state) => [state.values.isCashless]}
              children={([isCashless]) => (
                <batchPaymentForm.Field
                  name="rekeningId"
                  validators={{
                    onChange: ({ value }: { value: string }) => {
                      if (isCashless && !value) {
                        return "Rekening wajib diisi jika menggunakan cashless";
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        Rekening Sumber {isCashless ? "*" : ""}
                      </FieldLabel>
                      <Select
                        disabled={!isCashless}
                        value={field.state.value || ""}
                        onValueChange={(value) => {
                          field.handleChange(value);
                          field.handleBlur();
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih rekening" />
                        </SelectTrigger>
                        <SelectContent>
                          {rekeningOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.state.meta.errors &&
                        field.state.meta.errors.length > 0 && (
                          <FieldError>{field.state.meta.errors[0]}</FieldError>
                        )}
                    </Field>
                  )}
                </batchPaymentForm.Field>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBatchPaymentDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  batchPaymentForm.state.isSubmitting || batchPayment.isPending
                }
              >
                {batchPaymentForm.state.isSubmitting || batchPayment.isPending
                  ? "Memproses..."
                  : "Bayar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Single Payment Dialog */}
      {selectedPenggajianForPayment && (
        <Dialog
          open={singlePaymentDialogOpen}
          onOpenChange={(open) => {
            setSinglePaymentDialogOpen(open);
            if (!open) setSelectedPenggajianForPayment(null);
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bayar Penggajian</DialogTitle>
              <DialogDescription>
                Bayar penggajian untuk{" "}
                {selectedPenggajianForPayment.karyawan?.nama} - Periode{" "}
                {dayjs()
                  .month(selectedPenggajianForPayment.periodeBulan - 1)
                  .format("MMMM")}{" "}
                {selectedPenggajianForPayment.periodeTahun}
              </DialogDescription>
            </DialogHeader>
            <SinglePaymentForm
              penggajian={selectedPenggajianForPayment}
              onSubmit={async (data) => {
                return new Promise<void>((resolve, reject) => {
                  openConfirmPassword({
                    title: "Konfirmasi password",
                    description: "Masukkan password Anda untuk pembayaran penggajian.",
                    onConfirm: async () => {
                      try {
                        await singlePayment.mutateAsync({
                          penggajianId: selectedPenggajianForPayment.id,
                          data,
                        });
                        setSinglePaymentDialogOpen(false);
                        setSelectedPenggajianForPayment(null);
                        refetch();
                        resolve();
                      } catch (e) {
                        reject(e);
                      }
                    },
                    onCancel: () => reject(new Error("cancelled")),
                  });
                });
              }}
              onCancel={() => {
                setSinglePaymentDialogOpen(false);
                setSelectedPenggajianForPayment(null);
              }}
              isSubmitting={singlePayment.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Single Payment Form Component
function SinglePaymentForm({
  penggajian,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  penggajian: Penggajian;
  onSubmit: (data: {
    pembayaran: number;
    isCashless: boolean;
    rekeningId: string | null;
    catatan: string | null;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const { data: rekeningData } = useRekenings({ limit: 1000 });
  const rekeningOptions = React.useMemo(() => {
    if (!rekeningData?.data) return [];
    return rekeningData.data
      .filter((r) => r.isActive)
      .map((r) => ({
        value: r.id,
        label: `${r.bank} - ${r.nama}`,
      }));
  }, [rekeningData]);

  const totalGaji = Number(penggajian.totalGaji);
  const dibayar = Number(penggajian.dibayar);
  const sisa = totalGaji - dibayar;

  const form = useForm({
    defaultValues: {
      pembayaran: sisa.toString(),
      isCashless: false,
      rekeningId: "",
    } as any,
    validators: {
      onChange: ({ value }: any) => {
        const pembayaranValue =
          typeof value.pembayaran === "string"
            ? parseFloat(value.pembayaran.replace(/[^\d]/g, "")) || 0
            : value.pembayaran || 0;

        if (pembayaranValue > sisa) {
          return `Pembayaran tidak boleh melebihi sisa (${formatCurrency(
            sisa
          )})`;
        }
        if (pembayaranValue <= 0) {
          return "Pembayaran harus lebih dari 0";
        }
        if (
          value.isCashless &&
          (!value.rekeningId || value.rekeningId.trim() === "")
        ) {
          return "Rekening sumber wajib diisi jika pembayaran non-tunai";
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      const pembayaranValue =
        typeof value.pembayaran === "string"
          ? parseFloat(value.pembayaran.replace(/[^\d]/g, "")) || 0
          : value.pembayaran || 0;

      await onSubmit({
        pembayaran: pembayaranValue,
        isCashless: value.isCashless || false,
        rekeningId:
          value.isCashless && value.rekeningId ? value.rekeningId : null,
        catatan: "Pembayaran gaji dicatat secara otomatis oleh sistem.",
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Total Gaji</Label>
            <div className="rounded-lg border p-1 mt-2 px-2 bg-muted/50">
              <div className="font-medium">{formatCurrency(totalGaji ?? 0)}</div>
            </div>
          </div>
          <div>
            <Label>Sudah Dibayar</Label>
            <div className="rounded-lg border p-1 px-2 mt-2 bg-muted/50">
              <div className="font-medium text-green-600">
                {dibayar ? formatCurrency(dibayar) : 0}
              </div>
            </div>
          </div>
        </div>
        <div>
          <Label>Sisa</Label>
          <div className="rounded-lg border p-1 px-2 mt-2 bg-muted/50">
            <div className="font-medium text-red-600">
              {formatCurrency(sisa ?? 0)}
            </div>
          </div>
        </div>

        <form.Field name="pembayaran">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            const pembayaranValue =
              typeof field.state.value === "string"
                ? parseFloat(field.state.value.replace(/[^\d]/g, "")) || 0
                : field.state.value || 0;
            const sisaSetelahBayar = sisa - pembayaranValue;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel>Pembayaran *</FieldLabel>
                <div className="relative">
                  <Input
                    id={field.name}
                    type="text"
                    placeholder="0"
                    value={formatCurrency(field.state.value || "")}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      const rawValue = parseCurrency(e.target.value);
                      const num = parseFloat(rawValue) || 0;
                      if (num > sisa) {
                        field.handleChange(String(sisa));
                        return;
                      }
                      field.handleChange(rawValue);
                    }}
                    className="pl-10"
                    autoComplete="off"
                    aria-invalid={isInvalid}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                    Rp
                  </span>
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                {sisaSetelahBayar > 0 && !isInvalid && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Sisa setelah pembayaran:{" "}
                    <span className="font-semibold text-destructive">
                      {formatCurrency(sisaSetelahBayar)}
                    </span>
                  </div>
                )}
                {sisaSetelahBayar === 0 &&
                  !isInvalid &&
                  pembayaranValue > 0 && (
                    <div className="text-sm text-green-600 mt-1">
                      ✓ Pembayaran lunas
                    </div>
                  )}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="isCashless">
          {(field) => {
            return (
              <Field>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value || false}
                    onCheckedChange={(checked) => {
                      field.handleChange(checked as boolean);
                      if (!checked) {
                        form.setFieldValue("rekeningId", "");
                        form.setFieldMeta("rekeningId", (prev: any) => ({
                          ...prev,
                          errors: [],
                          errorMap: {},
                        }));
                      }
                      field.handleBlur();
                    }}
                    onBlur={field.handleBlur}
                  />
                  <Label htmlFor={field.name}>Gunakan Cashless</Label>
                </div>
              </Field>
            );
          }}
        </form.Field>

        <form.Subscribe
          selector={(state) => [state.values.isCashless]}
          children={([isCashless]) => (
            <form.Field
              name="rekeningId"
              validators={{
                onChange: ({ value }: { value: string }) => {
                  if (isCashless && !value) {
                    return "Rekening wajib diisi jika menggunakan cashless";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel>
                    Rekening Sumber {isCashless ? "*" : ""}
                  </FieldLabel>
                  <Select
                    disabled={!isCashless}
                    value={field.state.value || ""}
                    onValueChange={(value) => {
                      field.handleChange(value);
                      field.handleBlur();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih rekening" />
                    </SelectTrigger>
                    <SelectContent>
                      {rekeningOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors &&
                    field.state.meta.errors.length > 0 && (
                      <FieldError>{field.state.meta.errors[0]}</FieldError>
                    )}
                </Field>
              )}
            </form.Field>
          )}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button
          type="submit"
          disabled={form.state.isSubmitting || isSubmitting}
        >
          {form.state.isSubmitting || isSubmitting ? "Memproses..." : "Bayar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
