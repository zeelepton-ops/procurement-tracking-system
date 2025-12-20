
"use client"

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export type Suggestion = { id?: string; label: string; meta?: string; type?: string }

interface AutocompleteProps {
  value: string
  onChange: (val: string) => void
  suggestions: Suggestion[]
  placeholder?: string
  className?: string
  inputClassName?: string
}

export default function Autocomplete({ value, onChange, suggestions, placeholder, className, inputClassName }: AutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [filtered, setFiltered] = useState<Suggestion[]>([])
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const q = (value || '').trim().toLowerCase()
    if (!q) {
      setFiltered(suggestions.slice(0, 8))
      setOpen(false)
      setActiveIndex(-1)
      return
    }
    const f = suggestions
      .filter(s => s.label.toLowerCase().includes(q) || (s.meta || '').toLowerCase().includes(q))
      .slice(0, 8)
    setFiltered(f)
    setOpen(f.length > 0)
    setActiveIndex(-1)
  }, [value, suggestions])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(filtered.length - 1, i + 1))
      setOpen(true)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(0, i - 1))
      setOpen(true)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && filtered[activeIndex]) {
        select(filtered[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const select = (s: Suggestion) => {
    onChange(s.label)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(filtered.length > 0)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn('h-8 px-1 rounded-md border border-slate-300 text-xs', inputClassName)}
      />

      {open && filtered.length > 0 && (
        <ul role="listbox" className="absolute z-50 mt-1 w-full bg-white rounded-md border border-slate-200 shadow-sm max-h-56 overflow-auto text-sm">
          {filtered.map((s, i) => (
            <li
              key={`${s.type || 's'}-${s.id ?? s.label}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => { e.preventDefault(); select(s) }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`px-3 py-2 cursor-pointer flex justify-between items-center ${i === activeIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
            >
              <div>
                <div className="font-medium text-slate-800">{s.label}</div>
                {s.meta && <div className="text-xs text-slate-500">{s.meta}</div>}
              </div>
              {s.type && <div className="text-xs text-slate-400 ml-2">{s.type}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
