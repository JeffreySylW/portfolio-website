@AGENTS.md

## Model routing
Main session follows the vault's Playbook/Model Routing note. Subagents in `.claude/agents/`:
- `content-guard` (opus): visible facts, resume, NASA card, Bob claims, and the gate before merging to main. Mistakes are public and the NASA card has burned us before (Lessons 2026-10-11).
- `builder` (sonnet): one ticket at a time, test-first, reversible branch work.
- `test-runner` (haiku): run tests/build/e2e and report.
- `vault-scribe` (haiku): dated vault bookkeeping.
