'use client';

import { useEffect, useRef } from 'react';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { canRenderAdSlot, getAdSlotId } from '@/lib/ads';

interface AdSlotProps {
  size?: string;
  label?: string;
  className?: string;
}

export default function AdSlot({ size = '728x90', className = '' }: AdSlotProps) {
  const { config } = useSiteConfig();
  const slotId = getAdSlotId(size);
  const shouldRender = canRenderAdSlot(config, size);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!shouldRender || !slotId || initializedRef.current) return;
    try {
      ((window as Window & { adsbygoogle?: unknown[] }).adsbygoogle = (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle || []).push({});
      initializedRef.current = true;
    } catch {
      // Silent fail: we keep the slot hidden by default when unavailable.
    }
  }, [shouldRender, slotId]);

  if (!shouldRender || !slotId) {
    return null;
  }

  const parts = size.split('x');
  const w = parts[0] ? parseInt(parts[0], 10) : 728;
  const h = parts[1] ? parseInt(parts[1], 10) : 90;

  return (
    <div
      className={`overflow-hidden rounded ${className}`}
      style={{ maxWidth: `${w}px`, width: '100%', minHeight: `${Math.min(h, 250)}px` }}
    >
      <ins
        className="adsbygoogle block h-full w-full"
        style={{ display: 'block', width: '100%', minHeight: `${Math.min(h, 250)}px` }}
        data-ad-client={config.ads.adsenseId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
