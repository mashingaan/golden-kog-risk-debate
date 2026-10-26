import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import { debate, type DebateDeps, type DebateInput, type RouteArgs, type RouteResult } from '../src/debate.js'

const fallback = 'No case could be written from the measured facts.'
const input: DebateInput = {
  facts_text: 'Supply 1000\nHolders 12\nShare 12.50%\nRatio 0.5\nCount 1,234\nScale 1e3',
  level: 'elevated', points: 42, flag_ids: ['concentration', 'lock-risk'],
  unknown: ['Lock duration unmeasured.']
}
const review = { text: 'Concentration remains a structural risk.', weight: ['concentration'], unknown: ['Lock duration unmeasured.'] }

function fixture(options: Partial<DebateDeps> = {}, content: Partial<Record<RouteArgs['payload']['role'], string>> = {}) {
  const calls: RouteArgs[] = []
  const deps: DebateDeps = {
    mode: 'on',
    route: async args => {
      calls.push(args)
      return { content: content[args.payload.role] ?? (args.payload.role === 'reviewer' ? JSON.stringify(review) : 'Measured structure is documented.') }
    },
    ...options
  }
  return { calls, deps }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

test('A1 advocates run concurrently and reviewer waits for both with the exact routing contract', async () => {
  const sound = deferred<RouteResult>()
  const fragile = deferred<RouteResult>()
  const calls: RouteArgs[] = []
  const running = debate(input, {
    mode: 'on',
    route: async args => {
      calls.push(args)
      if (args.payload.role === 'sound') return sound.promise
      if (args.payload.role === 'fragile') return fragile.promise
      return { content: JSON.stringify(review) }
    }
  })
  await new Promise<void>(resolve => setImmediate(resolve))
  assert.deepEqual(calls.map(row => row.payload.role), ['sound', 'fragile'])
  sound.resolve({ content: 'Supply 1000 supports the case.' })
  await new Promise<void>(resolve => setImmediate(resolve))
  assert.equal(calls.length, 2)
  fragile.resolve({ content: 'Holders 12 limit the case.' })
  const result = await running
  assert.equal(result.status, 'ok')
  assert.equal(calls.length, 3)
  const prompt = JSON.parse(calls[2]!.payload.prompt) as Record<string, unknown>
  assert.equal(prompt.facts_text, input.facts_text)
  assert.equal(prompt.sound, result.sound)
  assert.equal(prompt.fragile, result.fragile)
  for (const [index, args] of calls.entries()) {
    assert.deepEqual(Object.keys(args).sort(), ['agent_id', 'complexity', 'constitutional_flag', 'context_tokens', 'payload', 'task_type', 'tier_class'])
    assert.equal(args.task_type, 'risk_debate')
    assert.equal(args.tier_class, 'text')
    assert.equal(args.complexity, index === 2 ? 'apex' : 'exec')
    assert.equal(args.constitutional_flag, false)
    assert.equal(args.agent_id, 'golden-kog')
    assert.ok(Number.isInteger(args.context_tokens) && args.context_tokens > 0)
    assert.deepEqual(Object.keys(args.payload).sort(), ['max_tokens', 'prompt', 'role', 'system'])
    assert.ok(args.payload.system.length > 0)
    assert.ok(args.payload.max_tokens > 0)
  }
})

for (const number of ['999', '12.5', '1.00', '234', '1E3', '+12']) {
  test(`A2 rejects unexpected or differently written number ${number}`, async () => {
    const { deps, calls } = fixture({}, { sound: `Measured ${number}.` })
    const result = await debate(input, deps)
    assert.equal(result.sound, fallback)
    assert.ok(result.rejected.some(reason => reason.includes('sound: number absent')))
    assert.equal((JSON.parse(calls[2]!.payload.prompt) as { sound: string }).sound, fallback)
  })
}

test('A2 accepts exact numeric lexemes and refuses substrings of other numbers', async () => {
  const { deps } = fixture({}, { sound: '1000 12 12.50% 0.5 1,234 1e3' })
  assert.equal((await debate(input, deps)).rejected.length, 0)
  const other = fixture({}, { fragile: 'There are 12 holders.' })
  assert.equal((await debate({ ...input, facts_text: '112\n12.50' }, other.deps)).fragile, fallback)
})

test('A2 invalid reviewer number clears every debate text and preserves costs and reasons', async () => {
  const { deps } = fixture({}, { reviewer: JSON.stringify({ ...review, text: 'There are 999 holders.' }) })
  const result = await debate(input, deps)
  assert.equal(result.status, 'rejected')
  assert.deepEqual([result.sound, result.fragile, result.reviewer], ['', '', ''])
  assert.deepEqual(result.weight, [])
  assert.deepEqual(result.unknown, [])
  assert.ok(result.rejected.some(reason => reason.includes('999')))
})

const forbidden = ['bull', 'bear', 'bullish', 'bearish', 'upside', 'downside target', 'undervalued', 'overvalued', 'accumulate', 'moon', 'buy now', 'sell now', 'price target', 'entry', 'exit', 'take profit', 'not financial advice']
for (const term of forbidden) {
  test(`A3 refuses the whole forbidden term ${term}`, async () => {
    const { deps } = fixture({}, { sound: `(${term.toUpperCase().replaceAll(' ', '\n')}).` })
    const result = await debate(input, deps)
    assert.equal(result.sound, fallback)
    assert.ok(result.rejected.some(reason => reason.includes(`forbidden phrase: ${term}`)))
  })
}

test('A3 allows innocent substrings and distinct phrases', async () => {
  const text = 'The bulletin describes bearings, moonlight, reentry, exits, and downside exposure.'
  const { deps } = fixture({}, { sound: text })
  assert.equal((await debate(input, deps)).sound, text)
})

for (const code of [0x2d, 0xad, 0x58a, 0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2015, 0x2043, 0x2212, 0xfe63, 0xff0d]) {
  test(`A3 refuses dash code point ${code}`, async () => {
    const { deps } = fixture({}, { fragile: `Measured${String.fromCodePoint(code)}facts.` })
    const result = await debate(input, deps)
    assert.equal(result.fragile, fallback)
    assert.ok(result.rejected.some(reason => reason.includes('dash character')))
  })
}

for (const code of [0x661, 0x6f2, 0x967, 0xff11, 0x1d7d9, 0xb2]) {
  test(`A3 refuses non Latin number code point ${code} even when present in facts`, async () => {
    const text = String.fromCodePoint(code)
    const { deps } = fixture({}, { sound: text })
    const result = await debate({ ...input, facts_text: text }, deps)
    assert.equal(result.sound, fallback)
    assert.ok(result.rejected.some(reason => reason.includes('non Latin digit')))
  })
}

for (const [role, limit] of [['sound', 180], ['fragile', 180], ['reviewer', 150]] as const) {
  test(`A3 ${role} accepts ${limit} words and rejects the next word`, async () => {
    for (const count of [limit, limit + 1]) {
      const text = ` \n${Array.from({ length: count }, () => 'fact').join('\t')}  `
      const { deps } = fixture({}, { [role]: role === 'reviewer' ? JSON.stringify({ ...review, text }) : text })
      const result = await debate(input, deps)
      assert.equal(result[role], count === limit ? text : role === 'reviewer' ? '' : fallback)
      assert.equal(result.status, role === 'reviewer' && count > limit ? 'rejected' : 'ok')
    }
  })
}

test('A3 caller checks apply to all generated human text and keep the reason', async () => {
  const checked: string[] = []
  const { deps } = fixture({ check: text => {
    checked.push(text)
    return text === 'custom refusal' ? ['caller policy'] : []
  } }, { sound: 'custom refusal' })
  const result = await debate(input, deps)
  assert.equal(result.sound, fallback)
  assert.ok(result.rejected.includes('sound: caller policy'))
  assert.ok(checked.includes(review.text))
  assert.ok(checked.includes(review.unknown[0]!))
})

for (const field of ['text', 'unknown', 'tension'] as const) {
  test(`A3 validates reviewer ${field}`, async () => {
    const { deps } = fixture({}, { reviewer: JSON.stringify({ ...review, [field]: field === 'unknown' ? ['buy now'] : 'buy now' }) })
    const result = await debate(input, deps)
    assert.equal(result.status, 'rejected')
    assert.equal(result.sound, '')
    assert.ok(result.rejected.some(reason => reason.includes('forbidden phrase')))
  })
}

test('A3 throwing caller checks fail closed without throwing', async () => {
  const { deps } = fixture({ check: () => { throw new Error('guard failed') } })
  const result = await debate(input, deps)
  assert.equal(result.status, 'rejected')
  assert.ok(result.rejected.includes('reviewer: check threw'))
})

test('A4 filters weight by exact ids and preserves unknown and optional tension', async () => {
  const { deps } = fixture({}, { reviewer: JSON.stringify({
    ...review, weight: ['concentration', 'invented', 'lock-risk', 'CONCENTRATION', '__proto__'],
    unknown: ['Unmeasured lock duration.', 'Unmeasured owner controls.'], tension: 'Evidence remains incomplete.'
  }) })
  const result = await debate(input, deps)
  assert.deepEqual(result.weight, ['concentration', 'lock-risk'])
  assert.deepEqual(result.unknown, ['Unmeasured lock duration.', 'Unmeasured owner controls.'])
  assert.equal(result.tension, 'Evidence remains incomplete.')
})

for (const malformed of ['no JSON', '```json\n{}\n```', 'null', '[]', 'true', '{}', '{',
  '{"text":3,"weight":[],"unknown":[]}', '{"text":"ok","weight":[3],"unknown":[]}',
  '{"text":"ok","weight":[],"unknown":[null]}', '{"text":"ok","weight":[]}',
  '{"text":"ok","weight":[],"unknown":[],"tension":null}']) {
  test(`A4 safely rejects malformed reviewer output ${malformed}`, async () => {
    const { deps } = fixture({}, { reviewer: malformed })
    const result = await debate(input, deps)
    assert.equal(result.status, 'rejected')
    assert.deepEqual([result.sound, result.fragile, result.reviewer], ['', '', ''])
    assert.ok(result.rejected.includes('reviewer: invalid JSON structure'))
  })
}

test('A4 missing optional fields and unknown extra keys are safe', async () => {
  const { deps } = fixture({}, { reviewer: JSON.stringify({ text: 'Measured facts.', weight: [], unknown: [], extra: { ignored: true } }) })
  const result = await debate(input, deps)
  assert.equal(result.status, 'ok')
  assert.equal(Object.hasOwn(result, 'tension'), false)
  assert.deepEqual(result.models, {})
  assert.equal(result.usd, 0)
})

for (const role of ['sound', 'fragile', 'reviewer'] as const) {
  test(`A5 never resolving ${role} times out without throwing`, async () => {
    const calls: string[] = []
    const result = await debate(input, {
      timeoutMs: 15, mode: 'on', route: async args => {
        calls.push(args.payload.role)
        if (args.payload.role === role) return new Promise<RouteResult>(() => {})
        return { content: args.payload.role === 'reviewer' ? JSON.stringify(review) : 'Measured facts.' }
      }
    })
    assert.equal(result.status, 'timeout')
    assert.ok(result.rejected.includes(`${role}: timeout`))
    assert.equal(calls.length, role === 'reviewer' ? 3 : 2)
  })
}

test('A5 elapsed time wins when synchronous route work blocks the timer callback', async () => {
  const result = await debate(input, { mode: 'on', timeoutMs: 5, route: async () => {
    const until = performance.now() + 15
    while (performance.now() < until) { /* Simulate synchronous model adapter work. */ }
    return { content: 'Measured facts.' }
  } })
  assert.equal(result.status, 'timeout')
})

test('A5 fractional deadlines cannot expire early due to timer rounding', async () => {
  const started = performance.now()
  const result = await debate(input, { timeoutMs: 25.75, route: () => new Promise<RouteResult>(() => {}) })
  assert.equal(result.status, 'timeout')
  assert.ok(performance.now() - started >= 25.75)
})

test('A5 each call gets its own deadline rather than one deadline for the debate', async () => {
  const result = await debate(input, { mode: 'on', timeoutMs: 150, route: async args => {
    await new Promise<void>(resolve => setTimeout(resolve, 90))
    return { content: args.payload.role === 'reviewer' ? JSON.stringify(review) : 'Measured facts.' }
  } })
  assert.equal(result.status, 'ok')
})

test('A5 late rejections are handled after a timeout', async () => {
  let reject!: (reason: Error) => void
  const late = new Promise<RouteResult>((_resolve, fail) => { reject = fail })
  const result = await debate(input, { timeoutMs: 5, route: () => late })
  reject(new Error('late adapter rejection'))
  await new Promise<void>(resolve => setImmediate(resolve))
  assert.equal(result.status, 'timeout')
})

test('A5 late route settlements cannot mutate the returned debate or cause unhandled rejection', async () => {
  const late = deferred<RouteResult>()
  const result = await debate(input, { timeoutMs: 5, route: () => late.promise })
  const snapshot = JSON.stringify(result)
  late.resolve({ content: 'Late.', model: 'late', cost_usd: 100 })
  await new Promise<void>(resolve => setImmediate(resolve))
  assert.equal(JSON.stringify(result), snapshot)
})

test('A5 settled timers and unresolved route promises do not keep a Node process alive', () => {
  const moduleUrl = new URL('../src/debate.js', import.meta.url).href
  const code = `import { debate } from ${JSON.stringify(moduleUrl)}\nconst input = ${JSON.stringify(input)}\nconst result = await debate(input, { timeoutMs: 10, route: () => new Promise(() => {}) })\nconsole.log(result.status)\n`
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', code], { timeout: 3000, encoding: 'utf8' })
  assert.equal(output.trim(), 'timeout')
})

test('A5 successful calls clear the default long deadline timers', () => {
  const moduleUrl = new URL('../src/debate.js', import.meta.url).href
  const code = `import { debate } from ${JSON.stringify(moduleUrl)}\nconst input = ${JSON.stringify(input)}\nconst result = await debate(input, { route: async args => ({ content: args.payload.role === 'reviewer' ? ${JSON.stringify(JSON.stringify(review))} : 'Measured facts.' }) })\nconsole.log(result.status)\n`
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', code], { timeout: 3000, encoding: 'utf8' })
  assert.equal(output.trim(), 'ok')
})

test('A5 zero deadline times out and invalid deadlines safely use the default', async () => {
  for (const timeoutMs of [0, -1, NaN, Infinity, 2_147_483_648]) {
    const { deps } = fixture({ timeoutMs })
    const result = await debate(input, deps)
    assert.equal(result.status, timeoutMs === 0 ? 'timeout' : 'ok')
  }
})

test('A5 synchronous and asynchronous route failures are contained', async () => {
  for (const route of [() => { throw new Error('route failure') }, () => Promise.reject(new Error('route failure'))]) {
    const result = await debate(input, { route })
    assert.equal(result.status, 'rejected')
    assert.ok(result.rejected.includes('reviewer: route failed'))
  }
})

test('A6 mode off makes zero route, check or log calls', async () => {
  const unexpected = () => { throw new Error('must not run') }
  const result = await debate(input, { mode: 'off', route: unexpected, check: unexpected, log: unexpected })
  assert.equal(result.status, 'off')
  assert.equal(result.shown, false)
  assert.equal(result.usd, 0)
  assert.deepEqual(result.models, {})
})

test('A6 default and explicit shadow log the returned Debate once and on is shown', async () => {
  for (const mode of [undefined, 'shadow', 'on'] as const) {
    const logged: object[] = []
    const { deps } = fixture({ ...(mode === undefined ? {} : { mode }), log: row => { logged.push(row) } })
    if (mode === undefined) delete deps.mode
    const result = await debate(input, deps)
    assert.equal(result.shown, mode === 'on')
    assert.equal(logged.length, mode === 'on' ? 0 : 1)
    if (mode !== 'on') assert.equal(logged[0], result)
  }
})

test('A6 shadow logs rejected and timed out debates too', async () => {
  for (const timeout of [false, true]) {
    const logged: object[] = []
    const { deps } = fixture({ mode: 'shadow', log: row => { logged.push(row) },
      ...(timeout ? { timeoutMs: 5, route: () => new Promise<RouteResult>(() => {}) } : {})
    }, { reviewer: 'malformed' })
    const result = await debate(input, deps)
    assert.equal(result.status, timeout ? 'timeout' : 'rejected')
    assert.deepEqual(logged, [result])
  }
})

test('A6 sums all available finite numeric costs and records models even for refused content', async () => {
  const result = await debate(input, { mode: 'on', route: async args => ({
    content: args.payload.role === 'reviewer' ? JSON.stringify(review) : 'buy now',
    model: `${args.payload.role} model`, cost_usd: args.payload.role === 'reviewer' ? 0.25 : 0.125
  }) })
  assert.equal(result.usd, 0.5)
  assert.equal(result.sound, fallback)
  assert.deepEqual(result.models, { sound: 'sound model', fragile: 'fragile model', reviewer: 'reviewer model' })
})

test('A6 malformed reviewer retains all settled costs and known models', async () => {
  const result = await debate(input, { route: async args => ({
    content: args.payload.role === 'reviewer' ? 'not JSON' : 'Measured facts.',
    model: args.payload.role, cost_usd: 0.25
  }) })
  assert.equal(result.status, 'rejected')
  assert.equal(result.usd, 0.75)
  assert.deepEqual(result.models, { sound: 'sound', fragile: 'fragile', reviewer: 'reviewer' })
})

test('A6 timeout retains costs of other settled calls', async () => {
  const result = await debate(input, { timeoutMs: 15, route: async args => {
    if (args.payload.role === 'fragile') return new Promise<RouteResult>(() => {})
    return { content: 'Measured facts.', cost_usd: 0.25, model: 'settled' }
  } })
  assert.equal(result.status, 'timeout')
  assert.equal(result.usd, 0.25)
  assert.deepEqual(result.models, { sound: 'settled' })
})

test('A6 malformed adapter responses fail closed and a throwing logger is contained', async () => {
  for (const value of [null, undefined, {}, { content: 12 }]) {
    const result = await debate(input, { route: async () => value as RouteResult, log: () => { throw new Error('logging failed') } })
    assert.equal(result.status, 'rejected')
    assert.ok(result.rejected.includes('reviewer: invalid route response'))
    assert.ok(result.rejected.includes('log: callback failed'))
  }
})

for (const invalid of [undefined, NaN, Infinity, -Infinity, '0.5', null]) {
  test(`A6 ignores invalid cost ${String(invalid)} without coercion`, async () => {
    const result = await debate(input, { mode: 'on', route: async args => ({
      content: args.payload.role === 'reviewer' ? JSON.stringify(review) : 'Measured facts.',
      cost_usd: invalid
    } as RouteResult) })
    assert.equal(result.usd, 0)
  })
}

test('A6 never changes or returns level or points and accepts frozen input', async () => {
  const frozen = Object.freeze({ ...input, flag_ids: Object.freeze([...input.flag_ids]), unknown: Object.freeze([...input.unknown]) })
  const before = JSON.stringify(frozen)
  const { deps } = fixture()
  const result = await debate(frozen as unknown as DebateInput, deps)
  assert.equal(JSON.stringify(frozen), before)
  assert.equal(Object.hasOwn(result, 'level'), false)
  assert.equal(Object.hasOwn(result, 'points'), false)
})

test('A7 README documents flow, validation, example and Apache 2.0 attribution with plain typography', () => {
  const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8')
  for (const text of ['parallel', 'reviewer', '180', '150', 'facts_text', 'deps.check', 'timeoutMs', 'shadow', '"status": "ok"', 'TradingAgents', 'TauricResearch', 'Apache 2.0']) {
    assert.ok(readme.includes(text), `README missing ${text}`)
  }
  assert.equal(/[^\x00-\x7f]/u.test(readme), false)
})
