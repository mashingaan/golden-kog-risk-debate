# Validation record

Date: 2026-10-26. Environment: Windows, Node 22.11.0, npm 10.9.0,
TypeScript 5.7.3. No runtime dependencies.

The implementation was compared manually against the published job specification:
https://lax.kognai.ai/registry/jobs/7ab7ed65-bb61-4df6-a9d9-9c2f18d13fb5

## Acceptance checklist

| Item | Implementation and evidence |
| --- | --- |
| A1 | Concurrent sound and fragile calls, reviewer after both. Gated promises prove call order and reviewer payload. Exact routing keys and fixed values checked. |
| A2 | Exact numeric token allowlist from facts_text. Advocates replaced on failure, reviewer failure clears texts, role labeled reasons retained. Decimal precision, grouping, exponent spelling and substring attacks tested. |
| A3 | All refused words and phrases, word boundaries, Unicode numbers, dash variants, 180 and 150 word boundaries and caller checks tested. Reviewer unknown and tension also validated. |
| A4 | Strict JSON shape validation, exact known id filtering, valid unknown and optional tension preserved. Malformed JSON, wrong field types, missing required fields and absent optional fields tested. |
| A5 | Separate monotonic deadlines for each route call. Never resolving calls, fractional and zero deadlines, early timer wakeups, event loop blocking, late settlements, route errors and process termination tested. Clock controlled tests verify independent deadlines without relying on tight host timings. |
| A6 | Off makes no calls, default shadow logs once, on is shown. Failed shadow results logged too. Costs, models, invalid costs and frozen input tested. |
| A7 | README explains flow, validation, modes, timing, accounting and an example Debate. TradingAgents and TauricResearch credited under Apache 2.0. Original code has an MIT LICENSE. ASCII typography checked. |

## Executed checks

```text
npm test
100 passed, 0 failed, 0 skipped, 0 todo

npm --offline test
100 passed, 0 failed, 0 skipped, 0 todo

npm run typecheck
Passed, exit 0

npm run build
Passed, exit 0

npm ls --omit=dev
Empty runtime dependency tree, exit 0

git diff --check
Passed, no whitespace errors

node --test --experimental-test-coverage dist/test/*.test.js
100 passed. Runtime module: 100% lines, 97.60% branches, 100% functions
```

Clean verification was also performed in a new directory on E with no existing
node_modules or dist. npm ci --offline --ignore-scripts --no-audit --no-fund,
npm run typecheck, npm --offline test and npm run build all passed. The complete
clean test run passed 100 tests. npm ls --omit=dev showed no runtime dependencies.

No lint script is provided. Strict TypeScript checks include unused declarations.
The complete diff was inspected. Searches for prohibited terminology found the
validator list, documentation, adversarial fixtures and innocent substrings.
No literal long dash characters or semicolon characters were found in source,
tests or README. Test fixtures construct Unicode characters from code points.

## Adversarial review

The review added regression coverage for fractional timer rounding, independent
call deadlines, late promise rejections, clearing successful default deadline
timers, zero and invalid timeout values, costs on rejected reviews and timeouts,
malformed adapter responses and throwing log callbacks. Fractional timer expiry
was corrected to recheck monotonic time before declaring a timeout.

A second audit reproduced a stack overflow from a large invalid response with
many numeric lexemes. Array argument spreading was replaced with iterative
appends, including caller guard problems, so all reasons are retained. Regression
tests cover 140000 distinct numeric lexemes and 140000 caller refusal reasons.

The audit also corrected accounting when an adapter has already returned a reply
over its deadline: status stays timeout, but its available cost and model are
retained. A still pending call has no available cost. Route invocation begins
inside the guarded timer scope, including synchronous exceptions.

## Planted bug verification

The compiled module and tests were copied to isolated directories on E. The
unmodified baseline passed all 100 tests. Twenty selected source mutations were
then applied one at a time. Each mutant passed node --check, and every mutant
caused assertion failures in the acceptance tests. No syntax error, process
timeout or missing dependency was counted as catching a mutation.

| Group | Planted faults detected |
| --- | --- |
| A1 | Sequential advocates |
| A2 | Missing numeric checks, retained refused reviewer texts |
| A3 | Missing phrase, dash, digit and guard checks, both word limits increased by one, wrong fallback |
| A4 | Invalid weight types, unknown weight ids, discarded unknown and tension |
| A5 | Wrong timeout status, premature timer expiry |
| A6 | Calls in off mode, missing shadow log, hidden on mode, overwritten costs |

Result: 20 of 20 selected mutations caught. This is a bounded test of test
effectiveness, not an exhaustive mutation score or a probability of acceptance.

## Delivery limits

The publisher's hidden tests and reviewer decisions are unavailable. The suite
uses mocked route adapters, with no live model or network dependency. Numeric
lexemes support signed decimals, comma grouping and scientific notation.
Word counts use whitespace separated tokens. context_tokens is an estimate.

The route interface has no cancellation parameter. The module releases its own
timers and handles late settlements, but cannot close an adapter's sockets or
stop synchronous work that never yields. Costs from calls still pending at
timeout are unknown.

## Reward readiness

The live registry was checked again on 2026-10-26: status open, selection null.
The public PACT endpoint returned that no agent is selected yet. The job ceiling
is 75 USDC and bids close on 2026-10-29 at 20:00 UTC, or 23:00 Moscow time.

The [official terms](https://www.kognai.ai/docs/hackathon) require a listed agent,
selection, an agreed PACT and accepted milestones. There is one winner per job.
The repository still needs a public HTTPS remote before a repository delivery.
No selection or payment entitlement can be inferred from local test results.

Engineering assessment: strong evidence for the published A1 through A7 contract,
with no known remaining defect found in this audit. Hidden tests, competing bids,
selection and reviewer judgments are unknown. An objective numerical probability
of receiving the reward cannot be calculated from the available evidence.

This is a local repository prepared for review and publication. No public remote,
bid, delivery submission, wallet action or payment transaction was created.
