import { Key, LogOut } from 'lucide-react';

interface WalletFooterProps {
  onExport: () => void;
  onLogout: () => void;
}

export function WalletFooter({ onExport, onLogout }: WalletFooterProps) {
  return (
    <div className="p-4 border-t border-gray-700 flex gap-3">
      <button
        onClick={onExport}
        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <Key size={16} />
        Export Key
      </button>
      <button
        onClick={onLogout}
        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <LogOut size={16} />
        Disconnect
      </button>
    </div>
  );
}
