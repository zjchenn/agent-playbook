---
name: mastery-arc
description: >
  Run bounded, evidence-backed teaching sessions when the user explicitly
  wants to learn, understand, review, be quizzed, walk through code, or
  debrief completed work. Trigger phrases include 学习、理解、复习、考我、
  带我读、教学模式、learn, teach me, quiz me, walk me through, and debrief,
  as well as explicit $mastery-arc learn|coding|review|debrief invocations.
  Build a dependency map, explain without skipped reasoning, maintain explicit
  scope and stopping boundaries, close automatically, and save a session
  record.
  Do not use when the primary goal is implementation, debugging, editing,
  testing, or an answer-only response unless the user explicitly asks for a
  teaching session.
---

# Mastery Arc

Treat this file as the authoritative procedure. Before the first teaching
response, read `LEARNING.md` completely. Read
`references/session-note-template.md` when preparing the closing record.
Follow the user's current explicit instructions over this procedure.

## Run a bounded state machine

Use exactly this lifecycle:

```text
Scope -> Map -> (Teach -> Verify -> Advance unit or phase)* -> Close -> Persist -> Stop
```

Do not add new teaching after entering `Close`. Use either one question or a
compact series of related questions when a checkpoint benefits from them; do
not end every response with a checkpoint by default.

## Select one primary mode

Honor an explicitly requested mode. Otherwise select:

- `coding` for understanding source code, runtime behavior, architecture, or a
  patch rather than merely changing it;
- `review` for closed-book retrieval from an earlier session record;
- `debrief` for extracting lessons from work that is already complete;
- `learn` for every other new or incompletely understood topic.

Do not silently combine modes. A mode switch requires an explicit user request
and a revised session map.

## 1. Scope the session

Inspect the minimum sources needed to understand the requested boundary before
teaching details. Ask one compact diagnostic set only when the answers would
materially change the route. Group only questions about the same prerequisite
or starting-state decision. If the user has already stated their level or says
a prerequisite is unfamiliar, believe them and provide scaffolding instead of
asking them to guess.

Create a compact learning contract before the first detailed explanation:

- the primary mode and a finite set of objectives;
- the user's known starting point and any explicit assumptions;
- a dependency-ordered map of `must-cover` units, grouped into ordered phases
  when the scope is broad;
- an explicit `out-of-scope` list and an initially empty parking lot;
- a mastery check for each objective;
- any user-specified time or turn boundary and the intended record directory.

Show the contract and continue without waiting for confirmation unless genuine
ambiguity would produce materially different lessons.

Do not impose a numerical question or round limit by default. Derive the number
of rounds from the declared map. For a broad goal, build a multi-phase
curriculum: give every phase a finite boundary, dependency order, and mastery
evidence, then repeat `Teach -> Verify -> Advance map` until the declared scope
is complete. Do not close merely because the session has used many rounds.

A checkpoint may contain one question or a compact series of related
questions. Batch questions only when they test the same unit or objective, use
the same taught context, and do not require feedback between subquestions.
Split them across rounds when an earlier answer determines the next hint or
question. Honor a numerical or time boundary only when the user supplies one
or when an external task constraint requires it.

## 2. Maintain the coverage map

Track every unit as one of:

```text
planned -> teaching -> covered -> checked -> passed | needs-review | deferred
```

Mark at most one unit `teaching` at a time. Use `covered` when the explanation
is complete but the learner has not yet demonstrated it; a later synthesis may
check several covered units together. Briefly show the ledger after creating
or materially revising the map and at major milestones. Include the current
phase and unit, completed units, remaining planned units, parking-lot count,
and any user-specified time or turn boundary. This ledger is the session's
global state; use it to prevent local follow-ups from erasing the finish line.

Before advancing, run a continuity check:

- Define every new term before relying on it.
- Confirm or teach the prerequisites for the next unit.
- Connect the next unit to the previous one explicitly.
- Separate verified evidence, inference, and unverified assumptions.
- Ensure the next step still contributes to a declared objective.

Insert a labeled bridge unit when a missing prerequisite blocks the path.
Revise the map explicitly; if the bridge is substantial, make it a new planned
phase or replace a lower-priority unit instead of silently expanding scope.

## 3. Teach continuous units

Complete a coherent causal unit before checking understanding:

1. Locate the unit in the global map.
2. State the prerequisite or bridge from the previous unit.
3. Explain the mechanism with a concrete example.
4. Show the reasoning chain as `evidence -> intermediate mechanism ->
   conclusion -> boundary`.
5. Ask a milestone question or related question set only when the answers test
   a declared objective.
6. Correct the answers and update the ledger with the evidence gained.

Do not make the user infer from facts or syntax that have not been taught. Do
not split one missing explanation into a long sequence of micro-questions.
Require generation before revealing an answer only at declared checkpoints;
do not withhold prerequisites or direct clarifications.

Never repeat the same checkpoint unchanged. When the learner struggles, change
the scaffold, example, representation, or question type. If successive rounds
stop producing new evidence or forward progress, mark the unit `needs-review`,
defer it, or close as `partial` instead of continuing an unproductive loop.

For evidence-backed claims:

- Call a claim `verified` only when a cited file/symbol, test, trace, log, or
  experiment directly supports it.
- Call a runtime claim inferred from static code an inference, not verified
  behavior.
- When evidence is unavailable, state the assumption and the smallest useful
  verification step instead of presenting a conclusion as fact.
- Ground debrief conclusions in the actual diff, files, tests, or logs from the
  completed work.

### Coding continuity rules

First establish the relevant version or revision and trace one representative
path end to end before teaching variants. Cover the applicable parts of this
ordered lens:

```text
trigger and entry
-> dispatch or branch selection
-> caller/callee chain
-> data and shape transformations
-> state owner and lifecycle
-> output, persistence, or side effect
-> failure boundary and tests
```

For every semantic edge across functions or files, name:

- the caller and callee;
- the control condition that selects the edge;
- the data or state passed across it;
- the transformation performed there;
- the evidence for the edge and why it matters.

Collapse transparent forwarding only when it performs no meaningful binding,
dispatch, mapping, mutation, synchronization, persistence, or export. Name the
omitted region and say why collapsing it is safe. Never use “then,” “eventually,”
or an ellipsis to skip a semantic edge.

Keep versions and mutually exclusive branches separate. Use a version or path
matrix before comparing them. When the user asks “where did that happen?” or
points out a missing step, treat it as a continuity failure: rewind to the last
understood node, repair the edge, update the map, and do not append another
unrelated checkpoint in the same response. A focused repair question set is
allowed when it directly verifies the repaired edge.

## 4. Control scope

Classify each follow-up before answering:

- A clarification inside a must-cover unit: answer it within that unit without
  creating another objective, then resume the current unit or close.
- A required prerequisite: add a labeled bridge and revise the map.
- An adjacent but nonessential topic: give at most a brief orientation and put
  it in the parking lot.
- An explicit request to expand scope: show what will be added or replaced and
  revise the map and phase boundaries before teaching it.

A user's ordinary follow-up question is not by itself permission to keep
expanding the course. Never invent “one more key point” after the original
completion criteria are met. If the user says they need an out-of-scope topic
now, accept that as explicit expansion after one concise impact statement; do
not repeatedly resist them.

## 5. Close automatically

Enter `Close` when any of these conditions holds:

- every must-cover phase and unit in the declared scope has been addressed and
  the final integration check is complete;
- a user-specified time or turn boundary is reached;
- repeated, changed scaffolds on the same blocking gap no longer produce new
  evidence or forward progress;
- necessary evidence cannot be obtained;
- the user asks to stop, requests a direct answer, or returns to delivery work.

If a checkpoint remains unresolved but does not block later units, mark it
`needs-review` and continue through the remaining planned map. If it blocks
later units and a different scaffold no longer creates progress, explain the
missing bridge and close with `partial` status.

At the end of each planned phase, use a closed-book synthesis prompt to
consolidate that phase. It may contain several tightly related subquestions or
required elements that jointly reconstruct the target mental model. If planned
phases remain, update the ledger and continue to the next one. After the final
phase, correct briefly and close immediately. Do not invent another phase,
offer an open-ended continuation, or ask “what next?” Closing with incomplete
mastery is allowed; boundaryless remediation is not.

Produce a closing synthesis containing:

- status: `complete`, `partial`, `stopped`, or `blocked`;
- the final coverage map;
- a compact mental model and, in coding mode, the continuous source path;
- verified evidence, explicit inferences, and unresolved assumptions;
- misconceptions corrected;
- parking-lot items and remaining gaps;
- a compact set of closed-book retrieval prompts and a suggested review date.

## 6. Persist the session record

Persist every substantive session automatically when entering `Close`, unless
the user explicitly forbids file writes.

Choose the record location in this order:

1. an explicit user-provided directory;
2. `<workspace-root>/learning-notes/<YYYY>/`, where the workspace root is the
   relevant Git root or otherwise the current working directory.

Create one immutable file per session. Use the filename pattern:

```text
YYYY-MM-DD-HHMMSS-<topic-slug>-<mode>.md
```

Never overwrite or append to an earlier record. For review sessions, create a
new record and link the earlier record with `review_of`.

Read `references/session-note-template.md`, synthesize the record rather than
copying the transcript, and avoid secrets, environment values, or large raw
logs. Preserve source revisions and evidence paths when code is involved.

Resolve `scripts/save_learning_note.py` relative to this skill directory and
pass the finished Markdown body through standard input or `--body-file`. The
script creates directories, selects a collision-free name, writes atomically,
and prints the absolute path. Supply `--source-revision`, `--review-of`, and
`--next-review` when applicable.

If the script is unavailable, use the normal file-editing tool with the same
path, schema, and no-overwrite rule. If writing fails, report the real error,
show the intended path, and include the complete Markdown in the response so
the user can save it. Never claim that a record was saved when it was not.

End the final response with the actual saved path and no teaching question.
Do not modify `LEARNING.md`, alter `.gitignore`, commit, or push records during
a study session unless the user explicitly requests it.

## Mode-specific adjustments

### Learn

- For an unfamiliar topic, teach a complete worked example before retrieval.
- For partial familiarity, use hints and partial completion.
- For strong familiarity, emphasize derivation, comparison, and transfer.

### Review

- Locate the user-selected or latest relevant session record.
- Read metadata, retrieval prompts, and unresolved gaps first; do not reveal
  the mental model or answer key before the user's attempt.
- Ask the relevant retrieval prompts in coherent batches across as many rounds
  as the declared review scope needs.
- Give corrective feedback after each response; change the scaffold rather
  than repeating an unproductive prompt unchanged.
- Create a new review record with the result and next review date.

### Coding

- Let the user predict only after the necessary source context is visible.
- Verify predictions with the smallest useful test, trace, or experiment.
- Finish each planned phase with a closed-code reconstruction or diagram.

### Debrief

- Enter only after the implementation task has been completed and verified.
- Ask focused, related Why and What-if questions across the planned debrief
  scope; use multiple rounds when the scope genuinely requires them.
- Record only evidence-backed design lessons, corrected misconceptions,
  reusable conclusions, and review prompts.

## Hard constraints

- Batch questions only when they belong to the same unit or objective; split
  them when feedback from one answer is needed before asking the next.
- Never quiz an unstated prerequisite or use repeated explanation as retrieval.
- Every checkpoint must advance a named unit in the declared map; never extend
  the map silently.
- Do not use round count alone as a reason to stop a large, still-progressing
  planned curriculum.
- Never cross a missing semantic edge in a source walkthrough.
- Never present an inference or assumption as verified evidence.
- Never continue teaching after `Close`; persist and stop.
