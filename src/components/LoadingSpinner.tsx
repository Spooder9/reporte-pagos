import React from 'react'

export default function LoadingSpinner({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  )
}
