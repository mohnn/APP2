import React, { useMemo } from 'react';
import qrcode from 'qrcode-generator';

export const QrCodeSvg = ({ value, size = 160 }: { value: string; size?: number }) => {
  const { count, isDark } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value || ' ');
    qr.make();
    return { count: qr.getModuleCount(), isDark: (r: number, c: number) => qr.isDark(r, c) };
  }, [value]);
  const cells: string[] = [];
  for (let r = 0; r < count; r++)
    for (let c = 0; c < count; c++)
      if (isDark(r, c)) cells.push(`M${c + 2},${r + 2}h1v1h-1z`);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${count + 4} ${count + 4}`} shapeRendering="crispEdges" style={{ display: 'block', margin: '0 auto' }} role="img" aria-label="QR">
      <rect width="100%" height="100%" fill="#fff" />
      <path d={cells.join('')} fill="#000" />
    </svg>
  );
};
