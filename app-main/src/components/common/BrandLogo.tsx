import React from 'react';
import { NurseryStorageService } from '../../services/storage';
import { DEFAULT_NURSERY_LOGO_DATA_URL, NURSERY_ROYAL_EMBLEM_SVG } from '../../services/mockData';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  iconOnly?: boolean;
  className?: string;
  customLogoUrl?: string;
  onClick?: () => void;
}

/**
 * Royal Emblem vector icon component
 */
export const RoyalEmblemSvgIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <div 
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      dangerouslySetInnerHTML={{ __html: NURSERY_ROYAL_EMBLEM_SVG }}
    />
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  iconOnly = false,
  className = '',
  customLogoUrl,
  onClick,
}) => {
  let logoUrl = customLogoUrl;
  if (!logoUrl) {
    try {
      logoUrl = NurseryStorageService.getInstance().settings.logoUrl;
    } catch (e) {
      logoUrl = DEFAULT_NURSERY_LOGO_DATA_URL;
    }
  }

  const iconDimensions = 
    size === 'xs' ? 'w-7 h-7' :
    size === 'sm' ? 'w-9 h-9' : 
    size === 'md' ? 'w-11 h-11' : 
    size === 'lg' ? 'w-16 h-16' : 
    'w-24 h-24';

  const titleSize = 
    size === 'xs' ? 'text-xs' :
    size === 'sm' ? 'text-xs sm:text-sm' : 
    size === 'md' ? 'text-sm sm:text-base' : 
    size === 'lg' ? 'text-lg sm:text-xl' : 
    'text-2xl';

  // Check if user uploaded a custom raster photo (e.g. from photo picker)
  const isCustomUploadedRaster = logoUrl && 
    logoUrl !== DEFAULT_NURSERY_LOGO_DATA_URL && 
    (logoUrl.startsWith('data:image/png') || logoUrl.startsWith('data:image/jpeg') || logoUrl.startsWith('data:image/jpg') || logoUrl.startsWith('data:image/webp') || logoUrl.startsWith('blob:') || logoUrl.startsWith('http'));

  return (
    <div 
      className={`flex items-center gap-2.5 ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* High-Resolution Emblem / Logo Container */}
      <div 
        className={`${iconDimensions} relative shrink-0 rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-950 to-blue-950 p-0.5 shadow-lg flex items-center justify-center border-2 border-amber-400 ring-2 ring-blue-500/20 overflow-hidden`}
        title="Modern British Kids Nursery Official Logo"
      >
        {isCustomUploadedRaster ? (
          <img
            src={logoUrl}
            alt="Modern British Kids Logo"
            className="w-full h-full object-cover rounded-xl select-none"
            onError={(e) => {
              // Fallback to inline SVG if custom image fails
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <RoyalEmblemSvgIcon className="w-full h-full p-0.5" />
        )}
      </div>

      {!iconOnly && (
        <div className="flex flex-col text-right">
          <div className={`font-black tracking-tight text-slate-900 dark:text-white leading-tight font-display ${titleSize}`}>
            Modern British Kids
          </div>
          {showSubtitle && (
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400">
              حضانة بريطانية دولية للغات
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Official circular rubber stamp component for receipts and financial reports
 */
export const OfficialNurseryStamp: React.FC<{ size?: number; className?: string }> = ({
  size = 110,
  className = '',
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 160 160"
        className="w-full h-full text-blue-900 drop-shadow-xs transform -rotate-6"
      >
        {/* Double border stamp ring */}
        <circle cx="80" cy="80" r="76" fill="none" stroke="#1e3a8a" strokeWidth="3" />
        <circle cx="80" cy="80" r="71" fill="none" stroke="#1e3a8a" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="80" cy="80" r="50" fill="none" stroke="#1e3a8a" strokeWidth="1.5" />

        {/* Circular text paths */}
        <path
          id="stampTextTop"
          d="M 22 80 A 58 58 0 0 1 138 80"
          fill="none"
        />
        <text fill="#1e3a8a" fontSize="11" fontWeight="bold" letterSpacing="1">
          <textPath href="#stampTextTop" startOffset="50%" textAnchor="middle">
            MODERN BRITISH KIDS
          </textPath>
        </text>

        <path
          id="stampTextBottom"
          d="M 138 80 A 58 58 0 0 1 22 80"
          fill="none"
        />
        <text fill="#1e3a8a" fontSize="10.5" fontWeight="bold">
          <textPath href="#stampTextBottom" startOffset="50%" textAnchor="middle">
            ★ معتمد مالياً وإدارياً ★
          </textPath>
        </text>

        {/* Center Crown & Stamp text */}
        <g transform="translate(80, 72) scale(0.65)">
          {/* Crown */}
          <path
            d="M-24 -15 L-18 0 L0 -16 L18 0 L24 -15 L20 8 H-20 Z"
            fill="#1e3a8a"
          />
          <circle cx="-24" cy="-18" r="3" fill="#1e3a8a" />
          <circle cx="0" cy="-19" r="3.5" fill="#1e3a8a" />
          <circle cx="24" cy="-18" r="3" fill="#1e3a8a" />
        </g>

        <text x="80" y="88" fill="#1e3a8a" fontSize="9.5" fontWeight="900" textAnchor="middle">
          OFFICIAL
        </text>
        <text x="80" y="99" fill="#1e3a8a" fontSize="8" fontWeight="bold" textAnchor="middle">
          خزينة كاش
        </text>
      </svg>
    </div>
  );
};
