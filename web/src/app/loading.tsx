'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center text-secondary gap-3 bg-[#f7f7f7] dark:bg-[#121212] transition-colors duration-300">
      <Loader2 className="w-10 h-10 animate-spin text-[#0071e3]" />
      <span className="text-xs font-semibold tracking-wider font-heading">
        Memuat Data PantauBola...
      </span>
    </div>
  );
}
