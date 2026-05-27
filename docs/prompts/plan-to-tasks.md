# Prompt: Convert Plan to Tracked Task List

Use this prompt to convert `docs/plan-applayout-drawer-refactor.md` into an executable, trackable task list.

⏺ Done. I saved the full plan details to signup-refactor.md in memory. In your new conversation, just say something like:

"Implement the signup 3-repo refactor — see memory/signup-refactor.md for the plan"

---

## Prompt

```
Read @docs/plan-applayout-drawer-refactor.md in full.

Convert it into a flat, ordered task list where each task is:
- A single atomic unit of work (one file changed, one command run, one section created)
- Assigned a short ID: T-01, T-02, T-03, ...
- Labelled with its status: [ ] todo | [x] done | [~] in-progress | [!] blocked
- Tagged with its group: SETUP | TYPES | API  | WIRE
- Order the tasks in a logical sequence, but they don't have to be strictly linear — if some tasks can be done in parallel, that's fine.
- Include dependencies between tasks if one must be done before another can start.
- Each task should be actionable and specific, with clear instructions on what to do and where (file paths, commands, etc.)
- Each task should be implemented by an subagent

Format each task as:

  [status] T-NN [GROUP] Short description
             └─ Detail: what exactly to do (file path, command, or specific change)
             └─ Depends on: T-NN (if applicable)

After listing all tasks, print a summary table:

  | Group         | Total | Done | Remaining |
  |---------------|-------|------|-----------|
  | SETUP         |       |      |           |
  | TYPES         |       |      |           |
  | API           |       |      |           |
  | WIRE          |       |      |           |

Then ask me: "Which task do you want to start with?"

When I tell you a task ID, execute it. After completing it, mark it done in the list, reprint
the updated summary table, and ask which task is next.

Do not execute any task until I confirm which one to start.
```

---

## How to use

1. Paste the prompt above into a new Claude conversation (or start a `/clear` session)
2. Claude will print the full task list + summary table
3. Tell it which task to start (e.g. "start T-01" or "do the SETUP group first")
4. After each task completes, Claude reprints the updated table so you always know where you are
5. If you need to stop mid-session, copy the printed task list — the status markers (`[x]`, `[~]`)
   are your checkpoint. Paste it at the top of the next session with:
   "Here is my current task state — continue from the first non-done task."
