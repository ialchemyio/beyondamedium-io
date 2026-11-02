/**
 * Client-safe helpers for plan project limits. Enforcement lives in the DB
 * trigger (supabase/migrations/20261102_project_limits.sql); these only read
 * the quota and recognise the trigger's error.
 */

/** Prefix of the exception raised by public.enforce_project_limit(). */
export const PROJECT_LIMIT_CODE = 'project_limit_reached'

export interface ProjectQuota {
  used: number
  /** null = unlimited */
  max_projects: number | null
  plan?: string
}

export function isProjectLimitError(err: unknown): boolean {
  if (!err) return false
  const msg = typeof err === 'string' ? err : (err as { message?: unknown }).message
  return typeof msg === 'string' && msg.includes(PROJECT_LIMIT_CODE)
}

/** True when the user cannot create another project. Unknown quota never blocks. */
export function quotaReached(q: ProjectQuota | null | undefined): boolean {
  if (!q || q.max_projects == null) return false
  return q.used >= q.max_projects
}

export function quotaLabel(q: ProjectQuota): string {
  if (q.max_projects == null) return `${q.used} project${q.used === 1 ? '' : 's'} · unlimited`
  return `${q.used} of ${q.max_projects} project${q.max_projects === 1 ? '' : 's'} used`
}

/** Normalise the my_project_quota() RPC result (Supabase returns a row array). */
export function parseQuota(data: unknown): ProjectQuota | null {
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') return null
  const r = row as { used?: unknown; max_projects?: unknown; plan?: unknown }
  if (typeof r.used !== 'number') return null
  return {
    used: r.used,
    max_projects: typeof r.max_projects === 'number' ? r.max_projects : null,
    plan: typeof r.plan === 'string' ? r.plan : undefined,
  }
}
