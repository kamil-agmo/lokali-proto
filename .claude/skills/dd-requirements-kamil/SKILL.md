---
name: dd-requirements-kamil
description: 'By Kamil · Study requirement files before designing: reads the designer''s documents (PDF, Word, Excel, PowerPoint, CSV, text, sketches, links), researches the domain if wanted, and writes REQUIREMENTS.md and USER_STORY.md with every item traced to its source. Asks first, as explained options, and never invents requirements. Use when the user shares or mentions requirements, a PRD, BRD, SRS, spec, RFP, tender, feature list, client brief, meeting notes or a features spreadsheet, or says "design from these requirements".'
metadata:
  author: Kamil
  version: 1.0.1
  tier: Start
  summary: 'Reads client documents and writes the brief and user stories.'
  requires: ''
---

# Read requirements (files → design-ready brief)

**Made by Kamil**

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

Reads every file the client or team provided and writes one brief a designer can start from, with every item traced to its source, and gaps listed instead of guessed.

## Step 0: ask first (do not guess)

AskUserQuestion, recommended first, every option explained (wording: `references/details.md`): **Files** (folder, attached, links, pasted) · **Research** (documents + quick research, documents only, deep) · **Output** (brief + stories, plus flows and screens, or brief then start the prototype) · **Gaps** (list with suggested answers, ask now, ignore).

## Workflow

1. **Extract:** `python3 <skill>/scripts/req_extract.py --out <scratch dir>/req <folder or files...>` (text with page/sheet/slide markers, PDFs and images listed). Say in one line what was found.
2. **Read in order of authority:** specs first, then spreadsheets, slides, notes, images (PDFs 20 pages at a time). Note each finding's source as `file › page/sheet/slide`.
3. **Research** only if chosen; cite every link and keep it separate from the client's documents.
4. **Analyse:**
   - **Never invent requirements.** Tag each item **Stated** (with source), **Inferred** (from which items) or **Suggested** (why).
   - Make vague wording testable ("fast" → "within 2 s", marked as a suggestion).
   - Flag contradictions and gaps in Open questions.
   - Prioritise with **MoSCoW**, using the documents' own priorities when given.
5. **Write** `REQUIREMENTS.md` and `USER_STORY.md` in the project folder (sections: `references/details.md`).
6. **Show the brief** briefly (summary, Must features, design implications, top open questions) with the file paths. If chosen, run **dd-prototype-kit-kamil**; its brief step is already answered.

## Last step: make things make sense

Also flag, as questions: sign-in asked too early, no way to delete the account, screens that can be empty without a next step.
- Every Must feature is in a flow, a screen and a story; every screen serves a story.
- Nothing is called the client's requirement without a source; inferred and suggested items are labelled.
- Open questions are real decisions, each with a suggested answer, not answered elsewhere.

Report what was read (and what couldn't be, with the fix), what was researched, the files written, and the most urgent questions.

## Keep it light

Run `req_extract.py` first; open only what's needed, long files in parts; summarise sources into notes as you go; for very large sets read contents pages and requirement sections first.
