# Background

Moved out of SKILL.md to keep it short; nothing here is needed for a normal run.

## Decisions worth knowing (so you can adapt without breaking them)

- **The lock is an iframe cover plus `inert`, not a hidden page.** `inert` takes the whole shell out of keyboard and pointer reach, which is what "cannot navigate anything" means. A cover without `inert` can be tabbed through.
- **Reset clears what screens stored in `sessionStorage`** (keys not starting with the shell prefix). Screens keep their state there, so one call resets everything and no screen needs its own reset code. Per-visitor conveniences that should survive a reset (for example "dismissed this banner") belong in `localStorage`.
- **One config file is the source of truth.** The prefix and password are read from `shell.config.js` by the shell, the lock screen, the guard and the embed script, so changing them there is enough.
- **Messages are prefixed and checked.** Types are `<prefix>:page`, `:unlocked`, `:reset`, `:relock`, `:replay`, `:nudge`. The shell accepts them only from its own two iframes and only from the same origin.
- **Add-ons hook in through a window event.** On a lock the shell dispatches `<prefix>:relock` (dev mode switches itself off); on Reset, `<prefix>:reset`.
- **The phone is scaled with `transform`,** and the stage width is set to the scaled width, so the side cards stay level with it. Below 1380 px the right card hides; below 800 px the left card hides.

## Extending the shell

- **Intro or onboarding:** add a screen, point `replay.query` at it (for example `?intro`), and have the screen play when it sees that query.
- **Prototype controls on a screen** (Replay, Reset prototype) help reviewers who have no side card, for instance on a phone. Label the group as not part of the design, ask for confirmation before resetting, and keep it out of design reviews. Pattern in `assets/template/pages/home.html`.
- **Different phone size:** change `--phone-w` and `--phone-h` in `prototype.css`.

---
