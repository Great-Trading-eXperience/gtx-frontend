import { usePrivy } from '@privy-io/react-auth';
import { Key, LogOut } from 'lucide-react';

export function WalletFooter() {
  const { logout, exportWallet } = usePrivy();

  return (
    <div className="p-4 border-t border-gray-700 flex gap-3">
      <button
        onClick={exportWallet}
        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <Key size={16} />
        Export Key
      </button>
      <button
        onClick={logout}
        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <LogOut size={16} />
        Disconnect
      </button>
    </div>
  );
}
