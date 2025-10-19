"use client"

interface TimeframeSelectorProps {
  timeframe: string
  onTimeframeChange: (timeframe: string) => void
  className?: string
}

const TimeframeSelector = ({ timeframe, onTimeframeChange, className = "" }: TimeframeSelectorProps) => {
  const timeframes = [
    { value: "24h", label: "24h" },
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" }
  ]

  return (
    <div className={`flex bg-gray-700 border border-gray-600 rounded-lg p-1 ${className}`}>
      {timeframes.map((option) => (
        <button
          key={option.value}
          onClick={() => onTimeframeChange(option.value)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            timeframe === option.value
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white hover:bg-gray-600'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default TimeframeSelector