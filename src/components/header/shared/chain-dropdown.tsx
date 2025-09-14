"use client"

import { appchainTestnet, arbitrumSepolia } from "@/configs/wagmi";
import { useSwitchAndAddChain } from "@/hooks/useSwitchAndAddChain";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Chain } from 'viem/chains';
import { useChainId } from "wagmi";

const ChainDropdown: React.FC = () => {
  const networks: Chain[] = [
    appchainTestnet,
    arbitrumSepolia
  ];

  const chainId = useChainId();
  const usedNetwork = networks.find(network => network.id === chainId);
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<Chain>(usedNetwork || networks[0]);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { switchAndAddChain } = useSwitchAndAddChain();

  // Sync selectedNetwork with actual chainId when wallet chain changes
  useEffect(() => {
    const actualNetwork = networks.find(network => network.id === chainId);
    if (actualNetwork && actualNetwork.id !== selectedNetwork.id) {
      setSelectedNetwork(actualNetwork);
    }
  }, [chainId, networks, selectedNetwork.id]);

  const handleSwitchChain = async (selectedChain : Chain) => {
    try {
      const result = await switchAndAddChain(selectedChain);
      console.log(result.message);
      // Only update UI state if switch was successful
      setSelectedNetwork(selectedChain);
    } catch (error) {
      // TypeScript knows 'error' is of type 'unknown', so we can check it
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error('An unknown error occurred.');
      }
      // Don't update selectedNetwork if switch failed
    }

    setIsOpen(false);
  }

  const handleToggle = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        // Check if click is on dropdown
        const dropdownElement = document.getElementById('dropdown-portal');
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Update button position on scroll/resize
  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef.current && isOpen) {
        setButtonRect(buttonRef.current.getBoundingClientRect());
      }
    };

    if (isOpen) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const DropdownContent = () => {
    if (!buttonRect) return null;

    return (
      <div
        id="dropdown-portal"
        style={{
          position: 'fixed',
          top: buttonRect.bottom + 4,
          left: buttonRect.left,
          width: buttonRect.width,
          zIndex: 9999,
        }}
        className="bg-black/60 border border-gray-600 rounded-lg shadow-xl"
      >
        <div>
          {networks.map((network) => (
            <button
              key={network.id}
              onClick={() => handleSwitchChain(network)}
              className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center justify-between group transition-colors duration-150 text-sm"
            >
              <span className="text-white font-medium">{network.name}</span>
              {selectedNetwork.id === network.id && (
                <Check className="w-4 h-4 text-green-400" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Main Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="bg-black/60 border border-white/20 text-white px-4 py-2 rounded-lg flex items-center justify-between transition-colors duration-200 min-w-[200px]"
      >
        <div className="flex items-center space-x-3">
          <span className="font-medium text-sm">{selectedNetwork.name}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ml-2 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Portal Dropdown */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
          />
          <DropdownContent />
        </>,
        document.body
      )}
    </>
  );
};

export default ChainDropdown;