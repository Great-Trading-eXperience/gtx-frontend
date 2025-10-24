'use client';

import React from 'react';
import EmbeddedPanel from './embeded-panel/EmbeddedPanel';

interface EmbededPanelContainerProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmbededPanelContainer: React.FC<EmbededPanelContainerProps> = ({ isOpen, onClose }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/10 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose} // Close panel when overlay is clicked
        aria-hidden={!isOpen} // Hide from accessibility tree when invisible
      ></div>
      <EmbeddedPanel isOpen={isOpen} onClose={onClose} />
    </>
  );
};

export default EmbededPanelContainer;