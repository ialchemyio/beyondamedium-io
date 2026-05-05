import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string; orderId: string }>
}

export default async function OrderConfirmation({ params }: PageProps) {
  const { slug, orderId } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('restaurant_orders').select('*, restaurants(name, primary_color)').eq('id', orderId).single()

  if (!order) notFound()

  const accent = (order.restaurants as { primary_color?: string })?.primary_color || '#dc2626'

  return (
    <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: `${accent}15` }}>
          <Check className="w-8 h-8" style={{ color: accent }} />
        </div>

        <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-sm text-slate-500 mb-6">{(order.restaurants as { name?: string })?.name} received your order.</p>

        <div className="bg-slate-50 rounded-2xl p-5 mb-6 text-left">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-3">Order #{order.id.slice(0, 8)}</p>
          <div className="space-y-1.5">
            {(order.items as Array<{name: string; quantity: number; price: number}>).map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-700">{item.quantity}× {item.name}</span>
                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between text-base font-bold">
            <span>Total</span>
            <span style={{ color: accent }}>${Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-2">A confirmation email has been sent to <span className="font-medium text-slate-700">{order.customer_email}</span></p>

        <Link href={`/r/${slug}`} className="inline-flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: accent }}>
          Back to menu <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
