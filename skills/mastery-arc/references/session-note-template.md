# Session record template

Use this structure for the Markdown body passed to
`scripts/save_learning_note.py`. Omit sections that are genuinely not
applicable, but never omit unresolved gaps or evidence status.

```markdown
# <Topic>

## Learning contract

- Goal:
- Starting point:
- In scope:
- Out of scope:
- Completion evidence:

## Coverage map

- [passed] ...
- [covered] ...
- [needs-review] ...
- [deferred] ...

## Mental model

Compress the final model in the learner's language. Distinguish the learner's
successful reconstruction from added corrections.

## Causal or source walkthrough

For code, preserve the continuous trigger-to-output path and the important
data, shape, state, and branch transitions. For conceptual learning, preserve
the causal chain and boundary conditions.

## Evidence and confidence

- Verified:
- Inferred:
- Assumptions to verify:

## Misconceptions corrected

- Earlier model -> why it failed -> corrected model

## Unresolved gaps and parking lot

- ...

## Closed-book retrieval prompts

1. ...
2. ...
3. ...

## Answer key

Keep answers separate from prompts so a later review can retrieve before
revealing them.

## Suggested next review

- Date:
- Focus:
```
