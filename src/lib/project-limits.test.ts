import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isProjectLimitError, quotaReached, quotaLabel, PROJECT_LIMIT_CODE } from './project-limits'
import { PLANS } from './stripe'

test('isProjectLimitError recognises the trigger error in any shape', () => {
  assert.ok(isProjectLimitError({ message: `${PROJECT_LIMIT_CODE}: your starter plan allows 1 project` }))
  assert.ok(isProjectLimitError(new Error(`insert failed: ${PROJECT_LIMIT_CODE}`)))
  assert.ok(isProjectLimitError(`${PROJECT_LIMIT_CODE}`))
  assert.ok(!isProjectLimitError({ message: 'duplicate key value violates unique constraint' }))
  assert.ok(!isProjectLimitError(null))
  assert.ok(!isProjectLimitError(undefined))
})

test('quotaReached treats null max as unlimited', () => {
  assert.equal(quotaReached({ used: 1, max_projects: 1 }), true)
  assert.equal(quotaReached({ used: 0, max_projects: 1 }), false)
  assert.equal(quotaReached({ used: 7, max_projects: 5 }), true) // grandfathered over-limit
  assert.equal(quotaReached({ used: 999, max_projects: null }), false)
  assert.equal(quotaReached(null), false) // unknown quota never blocks; the DB still enforces
})

test('quotaLabel reads naturally', () => {
  assert.equal(quotaLabel({ used: 1, max_projects: 1 }), '1 of 1 project used')
  assert.equal(quotaLabel({ used: 2, max_projects: 5 }), '2 of 5 projects used')
  assert.equal(quotaLabel({ used: 12, max_projects: null }), '12 projects · unlimited')
})

// The SQL trigger is the enforcement; PLANS.maxProjects is what pricing shows.
// Fail the build if they ever disagree.
test('SQL plan_project_limit matches PLANS.maxProjects', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20261102_project_limits.sql'), 'utf8')
  const fn = sql.slice(sql.indexOf('function public.plan_project_limit'), sql.indexOf('$$;', sql.indexOf('function public.plan_project_limit')))
  for (const [plan, def] of Object.entries(PLANS)) {
    const m = fn.match(new RegExp(`when '${plan}' then (\\w+)`))
    const sqlLimit = m ? (m[1] === 'null' ? -1 : Number(m[1])) : NaN
    assert.equal(sqlLimit, def.maxProjects, `plan ${plan}: SQL says ${m?.[1]}, PLANS says ${def.maxProjects}`)
  }
})
