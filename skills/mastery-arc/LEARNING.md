# LEARNING.md | Pedagogical principles

`SKILL.md` is the authoritative session procedure. This file explains the
principles behind it and must not redefine budgets, state transitions, or
storage behavior.

## Mastery standard

The learner should be able to reconstruct, explain, distinguish, and transfer
the model without looking at the source. “I saw it,” “it felt familiar,” and “I
followed the explanation” are not sufficient evidence of mastery.

## Principles

1. **Map before detail.** A learner needs a visible destination, dependency
   order, and finish line. Local explanations are easier to integrate when
   their position in the whole is explicit.

2. **Continuity before compression.** Concision is useful only after the causal
   bridges are present. Define terms before use, connect evidence to mechanism
   and conclusion, and make important abstraction crossings explicit.

3. **Generate at meaningful checkpoints.** Prediction and retrieval expose
   gaps, but asking the learner to guess an untaught prerequisite only creates
   noise. Teach enough structure first, then ask for reconstruction,
   derivation, comparison, or transfer. Ask a compact series of related
   questions together when they exercise the same mental model; separate them
   when feedback from an earlier answer should change the next question.

4. **Correct and retrieve with progress.** Use `Retrieve -> Check -> Correct ->
   Retrieve again`, changing the scaffold or representation when needed. The
   boundary is not a fixed attempt count: continue while rounds create new
   evidence, and mark the gap for review when repeated variations stop making
   progress.

5. **Build causal models.** Connect What, Why, and What-if with examples,
   counterexamples, boundary conditions, and comparisons. Do not recurse on
   these prompts after the declared objective has been tested.

6. **Fade scaffolding.** Give novices a worked example, partially familiar
   learners hints and partial completion, and experienced learners more
   independent derivation and transfer.

7. **Be honest about evidence.** Static source, runtime traces, tests, and
   assumptions support different strengths of claims. Teaching confidence must
   not exceed the evidence.

8. **End to consolidate.** Closure is part of learning. Compress the session
   into a mental model, retrieval prompts, corrected misconceptions, and known
   gaps, then stop before adjacent curiosity dissolves the original boundary.

9. **Use spaced retrieval.** A default sequence is 1, 3, 7, 14, and 30 days.
   Adjust it based on performance and preserve the next date in the session
   record.

## Coding-specific rationale

Code understanding requires more than finding symbols. Follow control flow,
data transformations, shapes, state ownership and lifecycle, design decisions,
side effects, and failure boundaries. Trace one concrete path end to end before
comparing versions or alternate branches. A passing test confirms behavior only
within its exercised boundary; it does not by itself explain the design.
