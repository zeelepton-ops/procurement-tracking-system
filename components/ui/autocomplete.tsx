
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
  const inputRef = useRef<HTMLInputElement | null>(null)
  const menuRef = useRef<HTMLUListElement | null>(null)
  const [position, setPosition] = useState<{ left: number; top: number; width: number } | null>(null)

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

  // update menu position based on input rect
  const updatePosition = () => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    // allow menu to be wider than the input for better readability
    const minMenuWidth = 280
    let width = Math.max(rect.width, minMenuWidth)
    let left = rect.left + window.scrollX
    // prevent overflow off the right edge
    const overflowRight = left + width - (window.innerWidth - 12)
    if (overflowRight > 0) left = Math.max(12, left - overflowRight)
    setPosition({ left, top: rect.bottom + window.scrollY, width })
  }

  // handle outside clicks (works even though menu is rendered in body)
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (inputRef.current && inputRef.current.contains(target)) return
      if (menuRef.current && menuRef.current.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const [menuMounted, setMenuMounted] = useState(false)

  // update position when open and on resize/scroll
  useEffect(() => {
    if (!open) {
      setMenuMounted(false)
      return
    }
    updatePosition()
    // small delay to allow portal mount, then enable animation
    requestAnimationFrame(() => setMenuMounted(true))

    const onScroll = () => updatePosition()
    const onResize = () => updatePosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, filtered])

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
    inputRef.current?.focus()
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(filtered.length > 0)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn('h-7 px-1 rounded-md border border-slate-300 text-[11px] focus:z-10 focus:ring-2 focus:ring-blue-400 focus:outline-none', inputClassName)}
      />
      { (function renderPortal() {
          const content = (
            <ul
              ref={menuRef}
              role="listbox"
              className={"bg-white rounded-md border border-slate-200 shadow-sm max-h-56 overflow-auto text-xs transition-opacity duration-150 ease-out transform-gpu" + (menuMounted ? ' opacity-100 translate-y-0' : ' opacity-0 -translate-y-1')}
              style={{ position: 'absolute', left: position?.left, top: position?.top, width: position?.width, zIndex: 9999 }}
            >
              {filtered.map((s, i) => (
                <li
                  key={`${s.type || 's'}-${s.id ?? s.label}-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseDown={(e) => { e.preventDefault(); select(s) }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`px-2 py-1 cursor-pointer flex justify-between items-center ${i === activeIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 text-xs whitespace-nowrap overflow-hidden truncate">{s.label}</div>
                    {s.meta && <div className="text-[11px] text-slate-500 whitespace-nowrap overflow-hidden truncate">{s.meta}</div>}
                  </div>
                  {s.type && <div className="text-[11px] text-slate-400 ml-2">{s.type}</div>}
                </li>
              ))}
            </ul>
          )
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { createPortal } = require('react-dom')
          return createPortal(content, document.body)
        })()
      }
    </div>
  )
}
