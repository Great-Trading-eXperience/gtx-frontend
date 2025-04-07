"use client"

import { Slider } from "@/components/ui/slider"

type PercentageSliderProps = {
  value: number;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
  markers?: number[];
  activeColor?: string;
  trackColor?: string;
  markerColor?: string;
  thumbColor?: string;
}

/**
 * A customizable percentage slider with markers
 */
const PercentageSlider = ({
  value,
  onChange,
  onCommit,
  markers = [0, 25, 50, 75, 100],
  activeColor = "bg-blue-500/70",
  trackColor = "bg-gray-700/50",
  markerColor = "bg-gray-600",
  thumbColor = "bg-blue-500",
}: PercentageSliderProps) => {
  const handleSliderChange = (val: number[]) => {
    onChange(val[0]);
  };

  const handleSliderCommit = (val: number[]) => {
    if (onCommit) {
      onCommit(val[0]);
    }
  };

  const handleMarkerClick = (mark: number) => {
    onChange(mark);
    if (onCommit) {
      onCommit(mark);
    }
  };

  return (
    <div className="w-full relative">
      {/* Custom slider track with markers */}
      <div className="w-full h-5 flex items-center relative">
        {/* Background Track */}
        <div className={`absolute w-full h-1 ${trackColor} rounded-full`}></div>
        
        {/* Markers */}
        {markers.map((mark) => (
          <div 
            key={mark} 
            className={`absolute w-1 h-3 ${markerColor} rounded-full z-10 cursor-pointer`}
            style={{ left: `${mark}%`, transform: 'translateX(-50%)' }}
            onClick={() => handleMarkerClick(mark)}
          />
        ))}
        
        {/* Filled Track */}
        <div 
          className={`absolute h-1 ${activeColor} rounded-full`} 
          style={{ width: `${value}%` }}
        ></div>
        
        {/* Thumb */}
        <div 
          className={`absolute h-5 w-5 rounded-full ${thumbColor} border-2 border-gray-800 shadow-lg z-20 cursor-pointer`}
          style={{ 
            left: `${value}%`, 
            transform: 'translateX(-50%)',
          }}
        ></div>

        {/* Actual slider (invisible, handles interaction) */}
        <Slider
          value={[value]}
          max={100}
          step={1}
          onValueCommit={(val) => handleSliderCommit(val)}
          onValueChange={(val) => handleSliderChange(val)}
          className="absolute inset-0 z-30 opacity-0 cursor-pointer" // Invisible but handles interaction
        />
      </div>
    </div>
  );
};

export default PercentageSlider;