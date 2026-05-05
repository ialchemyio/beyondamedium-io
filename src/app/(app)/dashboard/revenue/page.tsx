'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, TrendingUp, ShoppingBag, Percent, Clock } from 'lucide-react'

interface Transaction {
  id: string
  restaurant_id: string
  amount_total: number
  bam_cut: number
  client_cut: number
  status: string
  created_at: string
  restaurants: { name: string; slug: string } | null
}

export default function RevenuePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [orderCount, setOrderCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d')

  async function load() {
    const supabase = createClient()

    // Date filter
    let since: Date | null = null
    if (period === '7d') since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    if (period === '30d') since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    let q = supabase.from('transactions').select('*, restaurants(name, slug)').order('created_at', { ascending: false })
    if (since) q = q.gte('created_at', since.toISOString())

    const { data } = await q.limit(200)
    setTransactions((data ?? []) as unknown as Transaction[])

    // Order count for conversion calc
    const { count } = await supabase.from('restaurant_orders').select('*', { count: 'exact', head: true })
    setOrderCount(count ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [period])

  const completedTxns = transactions.filter(t => t.status === 'completed')
  const totalRevenue = completedTxns.reduce((s, t) => s + Number(t.amount_total), 0)
  const bamRevenue = completedTxns.reduce((s, t) => s + Number(t.bam_cut), 0)
  const clientRevenue = completedTxns.reduce((s, t) => s + Number(t.client_cut), 0)
  const totalOrders = completedTxns.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const stats = [
    { label: 'Total Orders', value: totalOrders.toString(), icon: ShoppingBag, color: 'text-cyan-400' },
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'BAM Revenue (14%)', value: `$${bamRevenue.toFixed(2)}`, icon: Percent, color: 'text-amber-400' },
    { label: 'Restaurant Revenue', value: `$${clientRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-violet-400' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue</h1>
          <p className="text-sm text-white/40 mt-1">Track orders, revenue, and platform earnings</p>
        </div>
        <div className="flex gap-1 bg-white/[0.02] border border-white/[0.05] rounded-xl p-1">
          {(['7d', '30d', 'all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${period === p ? 'bg-white/[0.06] text-white' : 'text-white/30 hover:text-white/60'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              <span className="text-[10px] text-white/30 uppercase tracking-wider">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* AOV indicator */}
      {totalOrders > 0 && (
        <div className="bg-cyan-500/[0.04] border border-cyan-500/15 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <div>
            <p className="text-xs text-cyan-400 font-medium">Avg Order Value: ${avgOrderValue.toFixed(2)}</p>
            <p className="text-[10px] text-white/40">{totalOrders} completed orders this period</p>
          </div>
        </div>
      )}

      {/* Transactions table */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]"><h3 className="text-sm font-semibold text-white/70">Recent Transactions</h3></div>
        {loading ? (
          <div className="p-8 text-center text-white/20 text-sm">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">No transactions yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-white/[0.02] border-b border-white/[0.04]">
              <tr>
                <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Restaurant</th>
                <th className="text-right px-5 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Total</th>
                <th className="text-right px-5 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">BAM Cut</th>
                <th className="text-right px-5 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Restaurant</th>
                <th className="text-right px-5 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-b border-white/[0.03]">
                  <td className="px-5 py-3 text-xs text-white/60">{t.restaurants?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-xs text-emerald-400 font-mono text-right">${Number(t.amount_total).toFixed(2)}</td>
                  <td className="px-5 py-3 text-xs text-amber-400 font-mono text-right">${Number(t.bam_cut).toFixed(2)}</td>
                  <td className="px-5 py-3 text-xs text-violet-400 font-mono text-right">${Number(t.client_cut).toFixed(2)}</td>
                  <td className="px-5 py-3 text-[10px] text-white/30 text-right">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
