'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  isModal?: boolean;
  onClose?: () => void;
  rightAction?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  backHref,
  isModal = false,
  onClose,
  rightAction,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) router.push(backHref);
    else router.back();
  };

  const handleClose = () => {
    if (onClose) onClose();
    else router.back();
  };

  return (
    <header className="sticky top-0 z-20 bg-[#FDFBF7] border-b border-gray-100">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="w-10 flex items-center">
          {showBack && !isModal && (
            <button
              onClick={handleBack}
              className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
        <div className="w-10 flex items-center justify-end">
          {isModal ? (
            <button
              onClick={handleClose}
              className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          ) : rightAction}
        </div>
      </div>
    </header>
  );
}

export default PageHeader;