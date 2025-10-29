import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed md:hidden inset-0 bg-black/60 transition-opacity duration-300 z-[60] ${
          isOpen ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed md:hidden bottom-0 left-0 right-0 bg-black rounded-t-3xl border-t border-white/20 shadow-2xl z-[70] transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-end px-6 pt-2 pb-0">
          <button onClick={onClose}><X/></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </>
  );
};

export default BottomSheet;
