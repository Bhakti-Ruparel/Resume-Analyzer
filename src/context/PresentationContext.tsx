import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface PresentationContextValue {
  currentSection: string
  setCurrentSection: (section: string) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

const PresentationContext = createContext<PresentationContextValue | null>(null)

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [currentSection, setCurrentSection] = useState('/')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <PresentationContext.Provider
      value={{ currentSection, setCurrentSection, sidebarCollapsed, setSidebarCollapsed }}
    >
      {children}
    </PresentationContext.Provider>
  )
}

export function usePresentationContext(): PresentationContextValue {
  const ctx = useContext(PresentationContext)
  if (!ctx) throw new Error('usePresentationContext must be used inside PresentationProvider')
  return ctx
}
