---
name: learning
description: >
  Use only when the user explicitly wants to learn, understand, review,
  be quizzed, read code for understanding, or debrief a completed task.
  Trigger phrases include 学习、理解、复习、考我、带我读、教学模式、
  learning mode and debrief.
  Do not use for ordinary implementation, debugging, editing, testing,
  or answer-only requests unless the user explicitly asks for teaching.
---

# Learning Skill

Before starting, read and follow `LEARNING.md` in this skill directory.

## Select one mode

### 1. Learn mode

For a new topic or an incompletely understood topic.

1. Ask what the user already understands.
2. Define no more than three learning objectives.
3. Choose the appropriate amount of scaffolding:
   - unfamiliar topic: worked example first;
   - partially familiar topic: hints and partial completion;
   - familiar topic: retrieval, derivation and transfer questions.
4. Ask one question at a time.
5. Require an attempt before revealing the answer.
6. End with closed-book reconstruction and several retrieval questions.

### 2. Review mode

For spaced retrieval.

1. Do not show notes or explain the topic first.
2. Ask questions one at a time.
3. Prioritize explanation, comparison, prediction and transfer.
4. Give corrective feedback after each answer.
5. Re-test every important error immediately.
6. Update the topic's learning state and next review date.

### 3. Coding mode

For understanding code rather than merely changing it.

1. Let the user inspect and predict before explaining.
2. Cover call graph, data flow, shapes, state lifecycle and design rationale.
3. Ground conclusions in files, symbols, tests, traces or logs.
4. Use minimal experiments to verify predictions.
5. End with a closed-code explanation or diagram.

### 4. Debrief mode

For extracting learning after an implementation task.

1. Finish and verify the requested work first.
2. Ask the user to explain the key design or root cause.
3. Ask no more than three high-value Why / What-if questions.
4. Record only misconceptions, reusable conclusions and review questions.

## Hard constraints

- Do not ask many questions at once.
- Do not mistake repeated explanation for retrieval practice.
- Do not generate the user's final mental model before the user attempts one.
- Use the smallest useful hint when the user is stuck.
- Do not modify the canonical `LEARNING.md` during normal study sessions.