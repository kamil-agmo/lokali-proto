# Design System Components → Figma — team install

One folder = the whole skill. `SKILL.md` is the instructions; `engine/` is the code it installs into a prototype; `tools/` checks the result. **Share the folder or `dd-figma-components-sebastian.zip`. Never share `SKILL.md` on its own**: Claude then has the instructions but no engine, and stops with "this skill needs its full folder".

## Install (pick one)

**Claude Code, for you on every project**
```bash
unzip dd-figma-components-sebastian.zip -d ~/.claude/skills/
# result: ~/.claude/skills/dd-figma-components-sebastian/SKILL.md
```

**Claude Code, for everyone working in one repo**
```bash
mkdir -p .claude/skills && unzip dd-figma-components-sebastian.zip -d .claude/skills/
# commit .claude/skills/dd-figma-components-sebastian/ (not tools/figma-check/node_modules)
```

**claude.ai / Claude desktop app**: upload `dd-figma-components-sebastian.zip` as a custom skill in the Skills settings. Code execution must be on, so Claude can copy the engine files into your project.

**No install, one chat only**: attach `dd-figma-components-sebastian.zip` to the chat (code execution on) and say: *"Follow SKILL.md in the attached zip to add the copy-to-Figma panel to this prototype."* Attach the zip, not SKILL.md.

Restart Claude Code (or start a new chat) after installing.

## Use

In the prototype's folder, ask Claude: *"Add the copy-to-Figma side panel to this prototype"* (or type `/dd-figma-components-sebastian`). Claude asks five set-up questions, copies the engine into the project's `figma/` folder, writes `figma/figma.config.js`, marks up components and runs the checks.

After that the prototype carries its own engine: anyone can open `index.html` in Chrome, click **Copy** in the side panel, click the Figma canvas and press ⌘V. Opening and copying don't need Claude or this skill.

## Requirements

- A static HTML prototype that opens from disk in Chrome (`file://`).
- For the checks (`tools/check.sh`): Chrome or Chromium, Node 18+, Python 3. The first run runs `npm install` (needs internet once). The checks run on macOS and Linux; `grab.sh` (reading the real clipboard) is macOS only.
- Fonts: static `.ttf` files of every family the screens use (see SKILL.md Step 4).

## Try it first

Open `examples/starter/index.html` in Chrome. It is a 5-screen demo with the panel already wired. Copy one screen and paste it into a Figma file.

## Update

Replace the whole folder with the newer zip. Projects keep their own `figma/` engine copy until someone asks Claude to update it. `CHANGELOG.md` lists the changes.
