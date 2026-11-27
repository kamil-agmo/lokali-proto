# Credits

Credits are their own skill now: **dd-credits-kamil** (always installed with the kit) writes the line, `credits.html`, `CREDITS.md` and the pill for pages without the presenter. This shell shows the line in its Credits button; `scripts/credits.py` here forwards to it.

One inline line in the Credits note, from `credits` in `shell.config.js`:

> Design by Aisyah Rahman · Presenter by David · Dev mode by Kamil & Norman · Design system by Kamil & Tze Yong · Designer mode, Typography & Icons by Kamil · Kit compiled by Kamil

- `design`: who designed this prototype, always asked (round 4) and always first.
- `made`: the kit skills this prototype uses and who made them. Never typed by hand: `scripts/credits.py --project <project>` fills it from each skill's SKILL.md header (`metadata: author, credit, marker`). The add-on installers run it; run it again at the end of a kit run or after adding any skill. Skills made by exactly the same people share one "by".
- `thanks`: anyone else; a name already credited above is left out.
- `credits: null` (or `--no-credits`) means no Credits button.

A new skill (from anyone) is credited once its SKILL.md has `metadata: author` (who made it), `credit` (its name in the credits) and `marker` (a file only it creates in a project; `glob::regex` looks inside files; `*` means always). Nothing in the presenter needs editing.
