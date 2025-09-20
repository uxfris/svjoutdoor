export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          level: number; // 1 = Admin, 2 = Cashier
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          level: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          level?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      kategori: {
        Row: {
          id_kategori: number;
          nama_kategori: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id_kategori?: number;
          nama_kategori: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id_kategori?: number;
          nama_kategori?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      produk: {
        Row: {
          id_produk: number;
          id_kategori: number;
          nama_produk: string;
          merk: string | null;
          harga_beli: number;
          diskon: number;
          harga_jual: number;
          stok: number;
          kode_produk: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id_produk?: number;
          id_kategori: number;
          nama_produk: string;
          merk?: string | null;
          harga_beli: number;
          diskon?: number;
          harga_jual: number;
          stok: number;
          kode_produk?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id_produk?: number;
          id_kategori?: number;
          nama_produk?: string;
          merk?: string | null;
          harga_beli?: number;
          diskon?: number;
          harga_jual?: number;
          stok?: number;
          kode_produk?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      member: {
        Row: {
          id_member: number;
          kode_member: string;
          nama: string;
          alamat: string | null;
          telepon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id_member?: number;
          kode_member: string;
          nama: string;
          alamat?: string | null;
          telepon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id_member?: number;
          kode_member?: string;
          nama?: string;
          alamat?: string | null;
          telepon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      supplier: {
        Row: {
          id_supplier: number;
          nama: string;
          alamat: string | null;
          telepon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id_supplier?: number;
          nama: string;
          alamat?: string | null;
          telepon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id_supplier?: number;
          nama?: string;
          alamat?: string | null;
          telepon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      penjualan: {
        Row: {
          id_penjualan: number;
          id_member: number | null;
          total_item: number;
          total_harga: number;
          diskon: number;
          bayar: number;
          diterima: number;
          id_user: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id_penjualan?: number;
          id_member?: number | null;
          total_item: number;
          total_harga: number;
          diskon?: number;
          bayar?: number;
          diterima?: number;
          id_user: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id_penjualan?: number;
          id_member?: number | null;
          total_item?: number;
          total_harga?: number;
          diskon?: number;
          bayar?: number;
          diterima?: number;
          id_user?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      penjualan_detail: {
        Row: {
          id_penjualan_detail: number;
          id_penjualan: number;
          id_produk: number;
          harga_jual: number;
          jumlah: number;
          diskon: number;
          subtotal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id_penjualan_detail?: number;
          id_penjualan: number;
          id_produk: number;
          harga_jual: number;
          jumlah: number;
          diskon?: number;
          subtotal: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id_penjualan_detail?: number;
          id_penjualan?: number;
          id_produk?: number;
          harga_jual?: number;
          jumlah?: number;
          diskon?: number;
          subtotal?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      pembelian: {
        Row: {
          id_pembelian: number;
          id_supplier: number;
          total_item: number;
          total_harga: number;
          diskon: number;
          bayar: number;
          id_user: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id_pembelian?: number;
          id_supplier: number;
          total_item: number;
          total_harga: number;
          diskon?: number;
          bayar?: number;
          id_user: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id_pembelian?: number;
          id_supplier?: number;
          total_item?: number;
          total_harga?: number;
          diskon?: number;
          bayar?: number;
          id_user?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      pembelian_detail: {
        Row: {
          id_pembelian_detail: number;
          id_pembelian: number;
          id_produk: number;
          harga_beli: number;
          jumlah: number;
          subtotal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id_pembelian_detail?: number;
          id_pembelian: number;
          id_produk: number;
          harga_beli: number;
          jumlah: number;
          subtotal: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id_pembelian_detail?: number;
          id_pembelian?: number;
          id_produk?: number;
          harga_beli?: number;
          jumlah?: number;
          subtotal?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      pengeluaran: {
        Row: {
          id_pengeluaran: number;
          deskripsi: string;
          nominal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id_pengeluaran?: number;
          deskripsi: string;
          nominal: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id_pengeluaran?: number;
          deskripsi?: string;
          nominal?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      setting: {
        Row: {
          id_setting: number;
          nama_perusahaan: string;
          alamat: string | null;
          telepon: string | null;
          path_logo: string | null;
          path_kartu_member: string | null;
          diskon: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id_setting?: number;
          nama_perusahaan: string;
          alamat?: string | null;
          telepon?: string | null;
          path_logo?: string | null;
          path_kartu_member?: string | null;
          diskon?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id_setting?: number;
          nama_perusahaan?: string;
          alamat?: string | null;
          telepon?: string | null;
          path_logo?: string | null;
          path_kartu_member?: string | null;
          diskon?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
