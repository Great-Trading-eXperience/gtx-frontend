import { useState, useEffect } from "react";

interface GTXSliderProps {
  quantity: string;
  setQuantity: (amount : string) => void;
}

const GTXSlider = ({quantity, setQuantity}: GTXSliderProps)  => {

    const [percentage, setPercentage] = useState(0);
    const [inputValue, setInputValue] = useState('');

    const presetValues: number[] = [0, 25, 50, 75, 100];

    useEffect(() => {
        setInputValue(percentage.toString());

        const amount = (Number(quantity) / 100) * percentage;
        setQuantity(amount.toString());
    }, [percentage, quantity]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value;
        setInputValue(value);
        
        if (!/^\d*$/.test(value)) return;
        
        const numValue = parseFloat(value);
        
        if (numValue >= 0 && numValue <= 100) {
            setPercentage(numValue);
            setInputValue(value);
        } else if (numValue > 100) {
            setPercentage(100);
            setInputValue('100');
        }
    };

    const handlePresetClick = (value: number): void => {
    setPercentage(value);
    setInputValue(value.toString());
    };
    return (
        <div className='flex flex-row gap-2 items-start'>
            <div className="relative w-full mt-1">
              {/* Slider Track */}
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={percentage}
                  onChange={(e) => setPercentage(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${percentage}%, #475569 ${percentage}%, #475569 100%)`
                  }}
                />
                
                {/* Preset Dots */}
                {/* <div className="absolute top-[9px] left-0 w-full h-2 pointer-events-none">
                  {presetValues.map((value, index) => (
                    <div
                      key={value}
                      className={`absolute w-3 h-3 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 top-1/2 ${
                        percentage >= value ? 'bg-cyan-400 border-cyan-400' : 'bg-slate-700 border-slate-600'
                      }`}
                      style={{ left: `${value}%` }}
                    />
                  ))}
                </div> */}
              </div>

              {/* Preset Buttons */}
              <div className="flex justify-between mt-2">
                {presetValues.map((value) => (
                  <button
                    key={value}
                    type='button'
                    onClick={() => handlePresetClick(value)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      percentage === value
                        ? 'text-cyan-400 bg-cyan-400/10'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 rounded-lg p-2 border border-gray-700/50">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                maxLength={3}
                className="flex-1 bg-transparent text-white text-sm font-medium outline-none w-7"
                placeholder="0"
              />
              <span className="text-gray-400 text-sm">%</span>
            </div>
        </div>
    )
}

export default GTXSlider;