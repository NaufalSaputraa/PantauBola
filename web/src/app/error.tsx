'use client';

import React, { useEffect } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Next.js App Router error:', error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-[#f7f7f7] dark:bg-[#121212]">
      <div className="max-w-md p-8 bg-white dark:bg-[#1c1c1e] border border-[#e8e8ed] dark:border-[#2c2c2e] rounded-2xl shadow-sm flex flex-col items-center gap-5">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30 text-red-500">
          <ShieldAlert className="w-6 h-6" />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-[#e8e8ed] font-heading">
            Terjadi Kesalahan
          </h2>
          <p className="text-xs text-[#8e8e93] leading-relaxed">
            Gagal memuat konten halaman. Ini mungkin disebabkan masalah koneksi ke server atau database Supabase.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
          <button
            onClick={() => reset()}
            className="flex-1 px-4 py-2 text-xs font-bold text-white bg-[#0071e3] hover:bg-[#0071e3]/90 rounded-full flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Coba Lagi
          </button>
          
          <Link
            href="/"
            className="flex-1 px-4 py-2 text-xs font-bold text-[#1d1d1f] dark:text-[#e8e8ed] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full flex items-center justify-center transition-all"
          >
            Kembali ke Home
          </Link>
        </div>
      </div>
    </div>
  );
}
