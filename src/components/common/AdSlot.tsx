'use client';

import { useSiteConfig } from '@/hooks/useSiteConfig';

interface AdSlotProps {
  size?: string;
  label?: string;
  className?: string;
}

export default function AdSlot({ size = '728x90', label = 'Advertisement', className = '' }: AdSlotProps) {
  const { config } = useSiteConfig();
  if (!config.features.enableAds) {
    return null;
  }

  const parts = size.split('x');
  const h = parts[1] ? parseInt(parts[1], 10) : 90;

  return (
    <div
      className={`flex items-center justify-center bg-gray-100 border border-dashed border-gray-300 rounded text-gray-400 text-xs ${className}`}
      style={{ minHeight: Math.min(h, 250), maxWidth: '100%' }}
    >
      <div className="text-center p-2">
        <p className="font-medium">{label}</p>
        <p className="text-gray-300">{size}</p>
      </div>
    </div>
  );
}
