import React from 'react';

interface FooterProps {
  showZones?: boolean;
}

export default function Footer({ showZones = false }: FooterProps) {
  return (
    <footer className="mt-12 text-center text-xs text-secondary border-t border-border-custom pt-6 pb-4">
      {showZones && (
        <div className="flex items-center justify-center gap-3 mb-3 text-[10px] font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-primary/20 border border-primary/40" />
            Zona Champions League
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-danger/20 border border-danger/40" />
            Zona Degradasi
          </span>
        </div>
      )}
      <p>© 2026 PantauBola Pro Portfolio. Developed by Nurfajar Naufal.</p>
    </footer>
  );
}
