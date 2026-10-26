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
| A5 | Separate monotonic deadlines for each route call. Never resolving calls, fractional and zero deadlines, event loop blocking, late resolution and rejection, route errors and process termination tested. |
| A6 | Off makes no calls, default shadow logs once, on is shown. Failed shadow results logged too. Costs, models, invalid costs and frozen input tested. |
| A7 | README explains flow, validation, modes, timing, accounting and an example Debate. TradingAgents and TauricResearch credited under Apache 2.0. ASCII typography checked. |

## Executed checks

```text
npm test
95 passed, 0 failed, 0 skipped, 0 todo

npm --offline test
95 passed, 0 failed, 0 skipped, 0 todo

npm run typecheck
Passed, exit 0

npm run build
Passed, exit 0

npm ls --omit=dev
Empty runtime dependency tree, exit 0

git diff --check
Passed, no whitespace errors
```

No lint script is provided. Strict TypeScript checks include unused declarations.
The complete diff was inspected. Searches for prohibited terminology found the
validator list, documentation, adversarial fixtures and innocent substrings.
No literal long dash characters or semicolon characters were found in source,
tests or README. Test fixtures construct Unicode characters from code points.

## Final adversarial review

The review added regression coverage for fractional timer rounding, independent
call deadlines, late promise rejections, clearing successful default deadline
timers, zero and invalid timeout values, costs on rejected reviews and timeouts,
malformed adapter responses and throwing log callbacks. Fractional timer expiry
was corrected to recheck monotonic time before declaring a timeout.

## Delivery limits

The publisher's hidden tests and reviewer decisions are unavailable. The suite
uses mocked route adapters, with no live model or network dependency. Numeric
lexemes support signed decimals, comma grouping and scientific notation.
Word counts use whitespace separated tokens. context_tokens is an estimate.

The route interface has no cancellation parameter. The module releases its own
timers and handles late settlements, but cannot close an adapter's sockets or
stop synchronous work that never yields. Costs from timed out calls are unknown.

This is a local repository prepared for review and publication. No public remote,
bid, delivery submission, wallet action or payment transaction was created.
