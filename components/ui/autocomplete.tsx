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
}

// Autocomplete component retained for future use; currently per-item Reason uses a select-style dropdown (as requested).
