import axiosInstance, { ApiResponse } from "@/lib/axios";

export interface LaporanParams {
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  status?: string;
  [key: string]: any;
}

export interface LaporanResponse<T = any> {
  data: T[];
  summary?: any;
  total: number;
}

export const laporanService = {
  // Master Data
  getLaporanPengguna: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/pengguna", { params });
    return response.data;
  },
  getLaporanPemasok: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/pemasok", { params });
    return response.data;
  },
  getLaporanOutlet: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/outlet", { params });
    return response.data;
  },
  getLaporanKaryawan: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/karyawan", { params });
    return response.data;
  },
  getLaporanPekerja: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/pekerja", { params });
    return response.data;
  },
  getLaporanGaji: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/gaji", { params });
    return response.data;
  },

  // Data Produk
  getLaporanProduk: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/produk", { params });
    return response.data;
  },
  getLaporanMutasiStok: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/mutasi-stok", { params });
    return response.data;
  },

  // Produksi
  getLaporanPenjemuran: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/penjemuran", { params });
    return response.data;
  },
  getLaporanPengupasan: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/pengupasan", { params });
    return response.data;
  },
  getLaporanPensortiran: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/pensortiran", { params });
    return response.data;
  },

  // Hutang Piutang
  getLaporanPiutang: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/piutang", { params });
    return response.data;
  },
  getLaporanHutang: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/hutang", { params });
    return response.data;
  },

  // Penggajian
  getLaporanAbsensi: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/absensi", { params });
    return response.data;
  },
  getLaporanPenggajian: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/penggajian", { params });
    return response.data;
  },

  // Jual Beli
  getLaporanPembelian: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/pembelian", { params });
    return response.data;
  },
  getLaporanPenjualan: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/penjualan", { params });
    return response.data;
  },

  // Pembayaran
  getLaporanPembayaran: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/pembayaran", { params });
    return response.data;
  },

  // Keuangan (uang masuk/keluar laci)
  getLaporanKeuangan: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/keuangan", { params });
    return response.data;
  },

  // Menunggu Approval
  getLaporanPendingApproval: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/pending-approval", {
      params,
    });
    return response.data;
  },

  // Settings
  getLaporanRekening: async (params?: LaporanParams): Promise<LaporanResponse> => {
    const response = await axiosInstance.get<LaporanResponse>("/laporan/rekening", { params });
    return response.data;
  },

  // Ringkasan
  getLaporanRingkasan: async (params?: LaporanParams): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get<ApiResponse<any>>("/laporan/ringkasan", { params });
    return response.data;
  },
};
