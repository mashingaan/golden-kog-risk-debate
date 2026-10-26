# Golden Kog risk debate

A small TypeScript module for measured token structure risk. It never computes,
returns or changes the caller's level or points. Node 22, zero runtime dependencies.

Specification: [Golden Kog risk debate module](https://lax.kognai.ai/registry/jobs/7ab7ed65-bb61-4df6-a9d9-9c2f18d13fb5).

## Run

```sh
npm ci
npm test
npm run typecheck
npm run build
```

Only the initial development dependency installation needs network access.
Tests use Node's built in test runner and fake model adapters, without network.
There is no lint script. TypeScript checks strict types and unused declarations.

## Call flow

Import `debate` from `src/debate.ts` in a TypeScript project, or from
`dist/src/debate.js` after building. Its exported types describe the full contract.

1. In off mode, return an empty off result without calling route, check or log.
2. Otherwise call the sound and fragile advocates in parallel with complexity exec.
3. Validate each advocate. Replace a refused advocate with exactly
   `No case could be written from the measured facts.` and keep its reasons.
4. After both advocates finish, give the reviewer the facts_text, both accepted
   texts or replacement texts, known flag ids and caller supplied unknowns.
   The reviewer uses complexity apex and returns JSON.
5. Validate the reviewer structure and human text. Keep only weight ids that
   exactly match input.flag_ids. Return the reviewer's valid unknown array and
   optional tension. A refused or malformed review returns rejected with empty
   sound, fragile, reviewer, weight and unknown, and no tension.

Every route call uses task_type risk_debate, tier_class text,
constitutional_flag false and agent_id golden-kog. Each payload includes role,
system, prompt and max_tokens. context_tokens is an estimate of the supplied
system and prompt lengths divided by four, rounded up. The module does not assume
that model prompts enforce the rules. It validates returned content locally.

## Validation

All generated human text must use numeric strings present exactly in facts_text.
Numeric tokens preserve signs, decimal precision, comma grouping and exponents.
A smaller number cannot be justified by its occurrence within a larger number.
Latin digits only, with no dash characters, including ASCII hyphen, Unicode dash
characters, soft hyphen and hyphen bullet. Non ASCII numeric characters are refused.

The following whole words and phrases are refused, ignoring case and allowing
whitespace between phrase words:

```text
bull
bear
bullish
bearish
upside
downside target
undervalued
overvalued
accumulate
moon
buy now
sell now
price target
entry
exit
take profit
not financial advice
```

Word boundaries use Unicode letters, marks, numbers and underscore. Innocent
substrings such as bulletin, bearings and moonlight are permitted.
Words are nonempty whitespace separated tokens. Each advocate allows at most
180 words. The reviewer text allows at most 150 words. Reviewer unknown entries
and optional tension pass the same rules and caller guard, each with a 150 word
limit. Weight entries are identifiers checked against the caller's allowlist,
so a known flag id may contain a hyphen.

deps.check(text) can return extra refusal reasons. Exceptions from the guard are
treated as refusals. Empty arrays mean no extra problems. Route errors and invalid
route responses refuse the relevant part without throwing. Reviewer text, weight
and unknown are required with their declared types. tension is optional and must
be a string when present. Extra JSON keys are ignored. Markdown fences are not JSON.

## Modes, time and accounting

The default mode is shadow. It runs the complete debate, calls log with the Debate
once when supplied, and returns shown false. This also applies to rejected and
timeout results. on returns shown true. off returns shown false and status off.
A thrown logging callback is recorded in rejected without throwing away the result.

timeoutMs defaults to 45000 and applies separately to each call. A timeout stops
the flow with status timeout and empty debate texts. Invalid timeout values use
the default. Supported values are finite numbers from zero to the platform timer
maximum of 2147483647 milliseconds. Elapsed monotonic time is checked as well as
the timer, including when an adapter blocks the event loop. Timers are cleared.
Already running adapters cannot be cancelled because route has no cancellation
parameter. Their late resolutions cannot change the returned result. An adapter
that owns external sockets or timers remains responsible for releasing them.

usd sums finite numeric cost_usd values available from calls completed within
their deadlines, including calls whose content was refused. Missing or malformed
costs contribute zero. Costs and models from timed out calls are unavailable.
Models are kept when supplied. The rejected array retains role labeled reasons.
An advocate refusal alone does not reject an otherwise valid review.

## Example Debate

For facts_text containing `Holders 12` and flag_ids containing `concentration`,
an on mode result could be:

```json
{
  "status": "ok",
  "shown": true,
  "sound": "The measured structure is documented.",
  "fragile": "Only 12 holders are measured.",
  "reviewer": "Concentration remains a structural risk.",
  "weight": ["concentration"],
  "unknown": ["Lock duration unmeasured."],
  "tension": "Evidence remains incomplete.",
  "models": {},
  "usd": 0,
  "rejected": []
}
```

This is an illustrative result, not a live model run.

## Attribution

The two advocate and reviewer pattern is adapted from
[TradingAgents by TauricResearch](https://github.com/TauricResearch/TradingAgents),
licensed under Apache 2.0. This implementation credits that design inspiration.
No TradingAgents source code, trader or portfolio manager is included.

## Acceptance coverage

The test suite names every test A1 through A7. It covers concurrency and routing,
exact numbers, refused phrases and boundaries, Unicode digits and dash variants,
word limits, caller guards, reviewer structure, known ids, per call timeouts,
process exit, modes, logging, costs, input preservation and README content.
