import { Copy, QrCode, Edit3 } from 'lucide-react';
import { shortenAddress } from '../utils/address';

interface WalletHeaderProps {
  externalAddress: string;
  embeddedAddress: string;
  externalWalletIcon?: string;
  currentChainName: string;
  onCopy: (text: string) => void;
}

export function WalletHeader({
  externalAddress,
  embeddedAddress,
  externalWalletIcon,
  currentChainName,
  onCopy,
}: WalletHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-300">Login wallet</span>
        <div className="flex items-center gap-2">
          {externalWalletIcon && (
            <img src={externalWalletIcon} alt="Wallet" height={20} width={20} />
          )}
          <span className="text-sm text-gray-300">{shortenAddress(externalAddress)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-300 font-medium">GTX wallet</span>
          <QrCode size={16} className="text-gray-400" />
          <Edit3 size={16} className="text-gray-400" />
        </div>
        <div className="text-xs text-gray-400">{currentChainName}</div>
      </div>

      <div className="mt-3 border border-gray-600 rounded-lg p-3 flex items-center justify-between">
        <span className="text-sm text-gray-300 font-mono break-all">
          {embeddedAddress}
        </span>
        <button
          onClick={() => onCopy(embeddedAddress)}
          className="ml-2 p-1 hover:bg-gray-700 rounded"
        >
          <Copy size={16} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}
