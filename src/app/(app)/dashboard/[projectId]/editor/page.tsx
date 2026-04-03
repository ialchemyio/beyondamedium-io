'use client'

import { useParams } from 'next/navigation'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function EditorPage() {
  const params = useParams()
  const projectId = params.projectId as string

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center" style={{ zIndex: 9999 }}>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Visual Editor</h1>
        <p className="text-white/40 mb-2">The AI-powered drag-and-drop page builder is coming in the next phase.</p>
        <p className="text-white/30 text-sm mb-8">GrapeJS integration with 50+ elements, AI generation, code view, and more.</p>
        <Link
          href={`/dashboard/${projectId}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Project Settings
        </Link>
      </div>
    </div>
  )
}
