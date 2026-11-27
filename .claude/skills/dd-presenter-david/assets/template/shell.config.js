/* The one file to edit. Everything the shell and the lock screen show comes from here.
   Every page loads this file (before js/shared/lock-guard.js), so the prefix and password are defined once.
   The password is checked in the browser, so it is a soft gate: it keeps casual visitors out, it is not security. */
window.SHELL = {
  name: {{NAME_JS}},
  tag: {{TAG_JS}},                      // the subtitle under the logo (or the name) in the left card; '' hides it
  version: "0.1.0",                    // the prototype's version, shown under the tag and linked to CHANGELOG.md: +0.0.1 small fix, +0.1 medium (layout, new screen), +1.0 large (redesign, new flow); bump it on every deploy
  logo: {{LOGO_JS}},                    // path to the logo shown at the top of the left card, relative to this file; null shows the name as text
  logoLock: {{LOGO_LOCK_JS}},           // logo for the lock screen's dark background (a light or white version); null uses `logo`
  password: {{PASSWORD_JS}},
  theme: {
    accent: {{ACCENT_JS}},              // the colour the shell highlights and the lock screen glow/tint come from: use the prototype's brand colour
    // accentStrong: '#1d4ed8',         // optional: the darker shade for text on tints (default: derived from accent)
    // lockBg: '#0b1b2b',               // optional: the lock screen's dark background (default: a dark tint of the accent)
    // font: '"Inter", system-ui, sans-serif',  // optional: font for the shell and lock screen (default: the system font)
    // fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap',   // optional: stylesheet that loads that font
    // radius: 16,                      // optional: corner radius (px) of the side cards (default 24)
    // pageBg: '#f4f2ff',               // optional: the shell page background (default a cool grey)
{{THEME_EXTRA_JS}}  },
  prefix: '{{PREFIX}}',                 // names the storage key and the messages: <prefix>-unlocked, <prefix>:page ...
  appearance: {{APPEARANCE_JS}},                    // true (set when the colour mode is both): a System | Light | Dark control in the left card for screens that have a dark mode (html.dark)
  startPage: 'home',                    // id of the first page, opened after unlocking
  replay: {{REPLAY_JS}},               // the Replay button in the left card; null hides it (use null when the prototype has no intro)
  devices: [],                        // device skills shown, in this order: 'iphone' (dd-iphone-david), 'duo' (dd-iphone-duo-kamil); their installers fill it. Empty: pages show in a plain screen
  lock: {
    taglines: {{TAGLINES_JS}},          // lines that rotate on the lock screen
    stats: {{STATS_JS}},                // three counters under the tagline: { n: number, s: suffix, label }; [] hides them
    footer: {{FOOTER_JS}}               // shown as "<name> · <footer>"
  },
  /* credits: a small "Credits" button under the right-hand card, one inline line: "Design by <designer> · <skills> by <makers> · ...".
     `made` lists the kit skills this prototype uses and who made them; scripts/credits.py fills it from each skill's author
     (run it again after adding a skill). Delete the block for no Credits button. */
  credits: {{CREDITS_JS}},
  /* pages: id -> where it lives. and what the right card says about it. `src` is relative to this file. */
  pages: {
    'home':    { group: 'Main', title: 'Home',    src: 'pages/home.html',    desc: 'The landing screen: a short summary and the main actions.',
                 parts: ['Header with the product name', 'A card with a moving indicator', 'Buttons that open the Details screen'] },
    'details': { group: 'Main', title: 'Details', src: 'pages/details.html', desc: 'A detail screen opened from Home.',
                 parts: ['Back arrow to Home', 'A list of items'] }
  },
  /* tree: the accordion in the left card; the order here is the order on screen. Every page id should appear once. */
  tree: [ { label: 'Main', children: ['home', 'details'] } ]
};
