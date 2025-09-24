// components/Tooltip.jsx
import React, { useState } from 'react';

interface GTXTooltipProps {
    children: React.ReactNode;
    text: string;
    width?: number;
    position?: "left" | "center" | "right";
}

const GTXTooltip = ({ children, text, width, position } : GTXTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const getWidthStyle = () => {
    return typeof width === 'number' ? { width: `${width}px` } : {};
  };

  let positionClass = 'left-1/2 -translate-x-1/2';
  let positionArrow = 'left-1/2 -translate-x-1/2';
  if (position == 'left') {
    positionClass = 'left-0';
    positionArrow = 'left-3';
  } else if (position == 'right') {
    positionClass = 'right-0';
    positionArrow = 'right-3';
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-pointer"
      >
        {children}
      </div>
      {isVisible && (
        <div 
            className={`absolute bottom-full ${positionClass} mb-2 px-3 py-1 bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-9`}
            style={getWidthStyle()}
        >
          <span className="text-wrap">{text}</span>
          <div className={`absolute transform ${positionArrow} bottom-[-4px] w-2 h-2 bg-gray-700 rotate-45`}></div>
        </div>
      )}
    </div>
  );
};

export default GTXTooltip;