/* Dev mode settings. Loaded after shell.config.js and before the dev mode scripts. */
window.DEV_MODE = {
  password: {{PASSWORD_JS}},        // soft gate: it is readable in this file. Without a password dev mode cannot be switched on
{{PASSWORD_LATER}}
  prefix: {{PREFIX_JS}},            // must match the shell's prefix (it names the dev flag in sessionStorage and the relock event)
  // Design-token chips are optional and need no particular naming: every custom property on :root / html in a same-origin stylesheet is read and matched by value.
  // tokens: false,                 // switch the chips off
  // tokenFiles: 'tokens\\.css',     // optional regex on the stylesheet URL; by default every same-origin stylesheet is read
  // tokenHints: { sp: '(^--|-)(space|gap)(-|\\d|$)' },   // optional: tell which names mean spacing (sp), radius (r), font size (fs), line height (lh), size (h), weight (fw)
  // paletteTokens: '^--[a-z]+(-[a-z]+)*-\\d{2,3}$',   // optional: raw palette steps (--blue-500). Chips list them after the semantic names
  // legacyTokens: '^--(ink|grey|muted)$',               // optional: old alias names. Chips list them last
{{CREDITS_BLOCK}}
  sections: {                       // selectors the Sections tool uses to find the parts of a screen (first match wins within each list)
    bar: '.appbar, header.bar, header',
    content: 'main, .main, .app, .content',
    nav: 'nav.tabbar, nav.nav, nav',
    sub: '.segnav, .subnav'
    // skip: '.toast, .intro',                           // optional: extra transient overlays to leave out of the parts list
    // names: { hero: 'Hero banner', cfilter: 'Filter bar' }   // optional: class name -> label shown for a part
  }
};
