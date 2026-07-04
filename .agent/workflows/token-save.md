---
description: Token-saving mode for Antigravity. Activates strict minimal-context rules to conserve quota while maintaining capability.
---

# /token-save — Hemat Token, Tetap Dewa Mode

Gunakan workflow ini ketika quota hampir habis atau sesi kerja panjang.

---

## 🔋 Model Routing — Pakai Model yang Tepat

| Request | Model | Alasan |
|---------|-------|--------|
| Pertanyaan singkat, explain | **Gemini 3 Flash** | Tercepat, terhemat |
| Fix bug, rename, edit 1 file | **Gemini 3.1 Pro (Low)** | Balance hemat vs mampu |
| Fitur baru, multi-file, debug | **Gemini 3.1 Pro (High)** atau **Claude Sonnet 4.6** | Kapabel untuk tugas kompleks |
| Arsitektur, state management, API | **Claude Sonnet 4.6 (Thinking)** | Reasoning mendalam |
| Security audit, full refactor | **Claude Opus 4.6 (Thinking)** | Model paling kuat |
| Second opinion, validasi | **GPT-OSS 120B (Medium)** | Perspektif berbeda |

---

## ⚡ Rules Hemat Token (Selalu Aktif)

1. **Memory First** — File sudah dibaca sesi ini? Jangan baca ulang, recall dari konteks.
2. **No Redundant tsc** — Hanya run setelah semua multi-file edit selesai.
3. **Parallel Reads** — Butuh 3 file? Baca paralel, satu tool call.
4. **Skip Verbose** — NANO/MICRO = jawab langsung, tanpa header besar.
5. **Selective Skill** — Baca SKILL.md index → pilih section relevan saja.

---

## 🙋 Protokol Tanya Dulu

Sebelum implementasi apapun, minimal tanyakan:

- Fitur ini untuk komponen/halaman mana?
- Behaviour yang diharapkan seperti apa?
- Ada constraint atau edge case yang perlu diperhatikan?

---

## 💡 Saran Pengembangan Selanjutnya

**Format wajib di akhir setiap implementasi:**

```
---
💡 Saran Pengembangan Selanjutnya:
1. [High impact UX] — alasan
2. [Penting teknis] — alasan
3. [Nice-to-have] — alasan
```
