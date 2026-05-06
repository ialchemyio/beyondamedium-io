'use client'

import { useEffect, useState } from 'react'
import UpgradeModal from './UpgradeModal'

export default function GlobalUpgradeListener() {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<'credits' | 'projects'>('credits')
  const [needed, setNeeded] = useState<number | undefined>()

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail as { reason?: 'credits' | 'projects'; needed?: number } | undefined
      setReason(detail?.reason ?? 'credits')
      setNeeded(detail?.needed)
      setOpen(true)
    }
    window.addEventListener('bam:show-upgrade', handler)
    return () => window.removeEventListener('bam:show-upgrade', handler)
  }, [])

  return <UpgradeModal isOpen={open} onClose={() => setOpen(false)} reason={reason} needed={needed} />
}
