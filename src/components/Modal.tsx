
import React from 'react'

export default function Modal({ open, onClose, children }: { open: boolean, onClose: ()=>void, children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full">
        <div className="flex justify-end p-2">
          <button className="btn btn-outline" onClick={onClose}>Tutup</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
