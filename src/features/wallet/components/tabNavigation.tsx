type WalletTab = 'Asset' | 'Deposit' | 'Withdraw' | 'History';

interface TabNavigationProps {
  activeTab: WalletTab;
  onTabChange: (tab: WalletTab) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: WalletTab[] = ['Asset', 'Deposit', 'Withdraw', 'History'];

  return (
    <div className="flex border-b border-gray-700">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === tab
              ? 'text-[#00B4C8] border-b-2 border-[#00B4C8]'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
