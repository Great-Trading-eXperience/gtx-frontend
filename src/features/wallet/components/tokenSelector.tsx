import { ChevronDown, Copy } from 'lucide-react';
import { Token } from '../types/wallet.types';
import { TokenSymbol } from './tokenSymbol';

interface TokenSelectorProps {
  tokens: Token[];
  selected: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (address: string) => void;
  onCopy: (address: string) => void;
  showAddress?: boolean;
}

export function TokenSelector({
  tokens,
  selected,
  isOpen,
  onToggle,
  onSelect,
  onCopy,
  showAddress = true,
}: TokenSelectorProps) {
  const currentToken = tokens.find(t => t.address === selected);

  return (
    <div className="relative">
      <div
        className="flex items-center gap-3 cursor-pointer hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors"
        onClick={onToggle}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium`}
        >
          <TokenSymbol symbol={currentToken?.symbol || ''} />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-medium">{currentToken?.symbol}</span>
          {showAddress && currentToken?.address && (
            <span className="text-gray-400 text-xs font-mono">
              {`${currentToken.address.slice(0, 6)}...${currentToken.address.slice(-4)}`}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 min-w-[230px] z-10">
          {tokens.map(token => (
            <div
              key={token.address}
              className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer first:rounded-t-lg last:rounded-b-lg transition-colors"
              onClick={() => onSelect(token.address)}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium`}
              >
                <TokenSymbol symbol={token.symbol} />
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{token.symbol}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onCopy(token.address);
                    }}
                    className="p-1 hover:bg-gray-600 rounded opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <Copy size={10} className="text-gray-400" />
                  </button>
                </div>
                {showAddress && (
                  <span className="text-gray-400 text-xs font-mono">
                    {`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}
                  </span>
                )}
              </div>
              {selected === token.address && (
                <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
