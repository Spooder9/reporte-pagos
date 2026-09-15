import React from 'react'

export default function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-red-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
