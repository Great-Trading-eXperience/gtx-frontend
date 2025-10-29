import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface SlippageSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  slippageValue: string;
  autoSlippage: boolean;
  onSlippageChange: (value: string) => void;
  onAutoSlippageChange: (value: boolean) => void;
}

const SlippageSettings: React.FC<SlippageSettingsProps> = ({
  isOpen,
  onClose,
  slippageValue,
  autoSlippage,
  onSlippageChange,
  onAutoSlippageChange,
}) => {
  const [tempValue, setTempValue] = useState(slippageValue);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) return;

    const numValue = parseFloat(value);
    if (numValue >= 0 && numValue <= 99) {
      setTempValue(value);
    } else if (numValue > 99) {
      setTempValue('99');
    }
  };

  const handleConfirm = () => {
    onSlippageChange(tempValue);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border border-gray-800/30 text-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-semibold">Slippage Setting</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-1 mb-8">
          <div className="flex justify-between items-center">
            <label className="text-sm text-gray-300 flex items-center gap-1.5 ml-1">
              <span>Slippage</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs">Auto-slippage</span>
              <button
                onClick={() => onAutoSlippageChange(!autoSlippage)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  autoSlippage ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${
                    autoSlippage ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2 rounded-lg p-2 border border-gray-700/50">
            <input
              type="text"
              value={tempValue}
              onChange={handleValueChange}
              disabled={autoSlippage}
              className="flex-1 bg-transparent text-gray-400 text-sm outline-none w-7 text-right"
              placeholder="2"
            />
            <span className="text-white text-md font-medium">%</span>
          </div>
        </div>

        <button
          className="w-full bg-blue-600 hover:bg-blue-700 font-semibold py-3 rounded-xl transition-colors"
          onClick={handleConfirm}
        >
          Confirm Settings
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default SlippageSettings;
