---
name: agent-router
description: >-
  Route a task to a local Codex, Claude, Kimi, DSH, or Pi agent when the user
  explicitly asks for delegation, another agent, or a second opinion, or when
  independent agent work would materially improve a complex task. Use Codex,
  Claude, or Kimi for exploration and factual judgment. Use DSH or Pi only for
  closed-world, deterministic work with complete inputs and directly verifiable
  output. Do not use for routine work the current agent can finish directly.
---

# Agent Router

Use prompting to choose and brief one local Agent. The parent Agent owns scope,
verification, synthesis, and the final answer.

## Route the task

1. Honor an explicit Agent or effort request when it stays within the safety
   boundary below. Do not silently substitute another Agent.
2. Delegate only when it adds useful independent work. Otherwise complete the
   task directly.
3. Classify the task before choosing an Agent:
   - **Open-world:** discovery, fact verification, repository exploration,
     root-cause diagnosis, open-ended design, cross-file implementation, or
     strict review. Choose only Codex, Claude, or Kimi.
   - **Closed-world:** all inputs, files, changes, and acceptance criteria are
     supplied; the result is deterministic and directly checkable. DSH or Pi
     may be used for the limited tasks below.
4. Choose one Agent by default. If independent review is genuinely needed,
   choose multiple Agents only from Codex, Claude, and Kimi.
5. Choose effort, give a bounded task contract, then verify the result before
   using it.

## Agent pools

### Core trusted pool

Codex, Claude, and Kimi may perform open-world work and make independent factual
judgments. Prefer the Agent whose tools and context best fit the task.

- Codex: use a native subagent when available and pass the tool-supported
  `reasoning_effort`. If only a broken or unavailable Codex CLI exists, skip it
  and report that it was not run.
- Claude: invoke the local CLI non-interactively with `--effort <level>` and
  only the permissions required by the task.
- Kimi: use the local CLI and its configured model. If the requested effort
  cannot be set, keep the local default and report the actual effort as
  `provider default / unknown`.

### DeepSeek Flash utility pool

DSH and Pi are different frontends to DeepSeek V4 Flash. They are not two
independent opinions. Never call both for cross-validation or count their
agreement as corroboration.

Automatically use DSH or Pi only for:

- formatting, classification, extraction, or fixed-template generation;
- rewriting or summarizing only the material already provided;
- a small mechanical edit whose file, exact change, and acceptance criteria are
  all explicit.

Never give DSH or Pi:

- fact finding, repository reconnaissance, or call-chain exploration;
- root-cause diagnosis, open-ended design/review, or independent factual judgment;
- an edit with incomplete context or permission to discover or expand its scope.

Choose between them by required tool access and effort-control capability. When
both fit equally, prefer Pi because it exposes `--thinking`. Never route an
automatic DSH/Pi task above `medium` effort. An explicit user effort may override
that cap for an otherwise eligible closed-world task; it does not relax the task
boundary.

## Choose effort

| Effort | Use when |
| --- | --- |
| `low` | Deterministic text processing or a simple lookup over supplied input |
| `medium` | Scoped analysis or a small, well-defined change |
| `high` | Complex diagnosis, cross-file work, or strict review |
| `max` | The user explicitly requests it, or a high-risk task prioritizes quality |

If an Agent does not expose the requested level, use the closest supported level
only when that does not violate user intent. Record both requested and actual
effort and warn about every downgrade or unknown.

## Invoke with minimum capability

Use native delegation tools when available. Otherwise invoke the local CLI
non-interactively without shell-interpolating untrusted prompt text.

- Claude: `claude -p --effort <level> --no-session-persistence ...`
- Kimi: `kimi --prompt <task> ...`; effort may remain provider-default.
- DSH: `dsh --profile headless <task>`; use its current DeepSeek V4 Flash
  headless entry. If exact effort cannot be confirmed, report it as
  `provider default / unknown`.
- Pi: always select `opencode-go/deepseek-v4-flash` and use:
  `pi -p --provider opencode-go --model deepseek-v4-flash --thinking <low|medium>
  --no-session --no-skills --no-extensions --no-context-files ...`

For Pi, grant the smallest tool set:

- pure text work: `--no-tools`;
- a known-file read: `--tools read`;
- an exact edit: `--tools read,edit`;
- add `write` only when the authorized task explicitly creates a file.

Do not give Pi skills, extensions, sessions, context-file discovery, or other
tools. Apply the same minimum-capability principle to every Agent.

## Write the delegation prompt

Include only:

- the goal and supplied facts;
- allowed files, tools, and read/write mode;
- exact deliverable and acceptance criteria;
- required evidence and unresolved-boundary reporting.

End every delegated prompt with:

> Complete this task directly. Do not invoke `agent-router` or delegate it again.

Do not expose secrets or unrelated context. A read/review request stays read-only;
modify files or external state only when the user's task authorizes it.

## Verify and report

The parent Agent must inspect evidence, changes, and acceptance criteria. Never
turn a fact newly asserted by DSH or Pi into a conclusion until the parent or a
core-pool Agent independently verifies it.

In the final response, report:

- Agent actually run and the model when known;
- requested effort and actual effort, or `provider default / unknown`;
- failures, skipped Agents, substitutions, and capability/effort downgrades;
- what the parent verified and what remains unverified.

Never claim an Agent ran when its tool or CLI was unavailable or failed.
