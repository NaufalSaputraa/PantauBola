---
name: rtk
description: >
  Rust Token Killer (RTK) integration. High-performance filtering and compression 
  architecture for minimizing LLM token consumption.
when_to_use: "Always active for command execution and large file reads. Use when token saving is a priority or session is long."
---

# RTK — Rust Token Killer Integration

> Filter and compress command outputs before they reach the LLM context.

## Core Strategy

RTK reduces token consumption by 60-90% using four main strategies:

1. **Smart Filtering**: Removes noise lines (headers, footers, decorations).
2. **Grouping**: Aggregates similar items (e.g., files by directory).
3. **Truncation**: Keeps relevant context (first/last N lines), cuts redundancy.
4. **Deduplication**: Collapses repeated log lines with counts.

---

## Command Filters (Implementation Guide)

When executing shell commands, apply these RTK-inspired filters:

### 1. Git Operations
- **`git status`**: Group by status (modified, untracked). Remove long hint messages.
- **`git log`**: Use `--oneline`. Filter to show only relevant commits.
- **`git diff`**: Remove unchanged context lines. Focus on changed hunks.

### 2. File Reads
- **Large Files**: If >200 lines, use `head` and `tail` or a summary.
- **Codebase Map**: Use `rtk-ls` pattern: summarize directories instead of listing every file.

### 3. Test Runners (Jest/Vitest/Pytest)
- **Failures Only**: Strip passing test lines. Keep only failure stack traces and summaries.
- **Deduplicate Errors**: If multiple tests fail with the same error, show it once with a count.

### 4. Build/Lint/Tooling (Turbo/NPM/Vite)
- **Turbo**: Strip cache hit/miss noise, keep task output.
- **NPM**: Strip notice/warn boilerplates, focus on results.
- **Generic**: Automatically truncates if output exceeds 40 lines.

---

## Script: rtk_filter.py

Use `python .agent/skills/rtk/scripts/rtk_filter.py` to process long outputs.

### Usage Examples

1. **Turbo Filter**:
   ```powershell
   npm run build | python .agent/skills/rtk/scripts/rtk_filter.py --mode turbo
   ```

2. **Nx Filter**:
   ```powershell
   npx nx build | python .agent/skills/rtk/scripts/rtk_filter.py --mode nx
   ```

3. **NPM Noise Reduction**:
   ```powershell
   npm install | python .agent/skills/rtk/scripts/rtk_filter.py --mode npm
   ```

4. **Generic Truncation**:
   ```powershell
   ls -R | python .agent/skills/rtk/scripts/rtk_filter.py --max-lines 50
   ```

---

## Verification & Tracking

RTK tracking is integrated into the session summary:
> **Token Save**: ~80% via RTK Filter. Mode: [git-status|test-failure|generic].
