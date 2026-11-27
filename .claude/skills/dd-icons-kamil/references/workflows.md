# Icons: workflow details

## Workflow A: convert an existing prototype

1. **Inventory.** Find every icon in the screens: `<img src="*.svg">`, inline `<svg>`, icon `background-image`s, emoji and symbol characters in HTML **and in JS strings that build markup**. Run:
   ```bash
   python3 <skill>/scripts/icons.py scan --project <project> [--dir pages --dir js]
   ```
   It lists candidates by file and line. Logos and photos are not icons: leave them.
2. **Map** each one to an icon name in the chosen library (name search links are in `references/libraries.md`). Material examples: ✉ → `mail`, ♡/♥ → `favorite`, ⋯ → `more_horiz`, ☰ → `menu`, ✕ → `close`, ↗ → `send`, 🔖 → `bookmark`, 💬 → `chat_bubble`, ⌂ → `home`, ⌕ → `search`/`explore`, 🔔 → `notifications`, ◉ → `person`, ↑ → `arrow_upward`, 🚧 → `construction`. Show the mapping to the user if any is a judgment call.
3. **Load the font.** For a library other than Material Symbols, follow its section in `references/libraries.md` (and its subsetting steps if the user chose to subset), then skip to step 5. For Material, **build the link** from the answers and the names (the script sorts and de-duplicates the names, which Google requires, and prints the font's download size):
   ```bash
   python3 <skill>/scripts/icons.py link --style rounded --opsz 24 --wght 400 --fill 0 --grade 0 [--fill-range] home favorite mail ...
   ```
   `--fill-range` requests FILL 0..1 (only when the user wants filled active states). Paste the printed `<link>` tags into every screen's `<head>` (before the screen's stylesheet). Use `display=block` so icon names never flash as text.
4. **Add the CSS** (Material: the one the script prints, an `.ms` base class with the chosen axes and a `.ms--fill` modifier when filled states are on; other libraries: the sizing and fill rules from their section). Material icons are `<span class="ms" aria-hidden="true">name</span>`, the others `<i class="..." aria-hidden="true"></i>`; the button keeps its `aria-label`. Remove old `font-size` hacks that were sizing emoji.
5. **Replace** every icon, including the ones built in JS. For toggles (like buttons), toggle a class (`.on`) that switches FILL in CSS instead of swapping text characters.
6. **Verify** in a browser over http: `document.fonts.check('24px "<font family>"')` is true, an icon measures the baseline size, no icon name shows as plain text, and a screenshot looks right. Re-run `icons.py scan` and confirm no leftovers, then run `icons.py check` (icons built in JS need a `/* icons: ... */` comment in that file).
7. **Write the choice into `DESIGN.md`** under "## Icons": library, style, size, fill and active state, and how to add an icon. Later skills read it, and the credits use it to see that this skill was used.
8. **Tell the user** the library and font size, any attribution it needs (Flaticon), the list of icons in `icon_names`, and that **adding an icon later means adding its name to `icon_names`** in every page (or re-running `icons.py link`). Say which icons use filled or non-baseline sizes, and what was left alone (logos, shell).

## Workflow B: start of a project

1. **Load the font with a starter set**, plus any icons the user already knows they need (Material):
   ```bash
   python3 <skill>/scripts/icons.py link --style rounded --opsz 24 --wght 400 --fill 0 --grade 0 [--fill-range] --starter [extra names...]
   ```
   The starter set is 15 common icons (add, arrow_back, check, chevron_right, close, delete, edit, favorite, home, menu, more_vert, notifications, person, search, settings), about 6 KB. Other libraries: their section in `references/libraries.md`; subset only near the end of the project, since the icon list is still changing.
2. **Put the link and CSS in every screen**, including the scaffold's template screens, so new screens copied from them already have it. If the project has its own stylesheet for screens, the `.ms` CSS goes there.
3. **Leave a usage note** for whoever builds the screens, at the top of that stylesheet: how to write an icon (`<span class="ms" aria-hidden="true">name</span>` inside a button with an `aria-label`), that **every new icon name must be added to `icon_names` in alphabetical order in every page**, and that icons built in JS need a `/* icons: name name */` comment in that file.
4. **Check before each review or deploy:**
   ```bash
   python3 <skill>/scripts/icons.py check --project <project>
   ```
   It lists icons used but missing from `icon_names` (they would show as words), pages whose lists differ, lists not in alphabetical order, and unused names (notes only). Fix every error. Before the final deploy, drop unused starter icons to save a few bytes.
5. **Write the choice into `DESIGN.md`** under "## Icons" (library, style, size, fill, active state, how to add one).
6. **Tell the user** the starter set, the font size, how to add an icon, and to run `check` before deploys.
