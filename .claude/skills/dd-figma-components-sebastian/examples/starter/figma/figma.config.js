/* figma.config.js — per-project settings for the Copy-to-Figma side panel.
   Load it BEFORE figma-assets.js / figma-export.js / figma-native.js / figma-panel.js.
   Every key is optional; defaults are listed in engine/figma-export.js (FIGMA_DEFAULTS).
   Pre-flight answers (SKILL.md §0.1) decide organise / copy / output — record them in the project's CLAUDE.md. */
const FIGMA_CONFIG = {
  name: 'Starter prototype',               // panel title + clipboard fileKey
  storageKey: 'starter',              // localStorage prefix for switches and panel state (unique per project)
  frameWidth: 1440,                     // render width = Figma frame width; 390 for a phone app whose screens are fluid

  // Q1 — 'flow' (Flow → Screen; needs FLOWS) or 'module' (Module → Function → Screen; needs MODULES + screen.fn)
  organise: 'module',
  // Q3 — buttons the panel shows: 'page' (everything, one paste), 'group' (one module/flow), 'screen'
  copy: ['page', 'group', 'screen'],
  // Q4 — what the page button pastes: 'design' (components + instances) or 'plain' (frames only)
  output: 'design',
  groupCopy: 'plain',                   // group/screen copies: 'plain' frames, or 'design' (each paste brings its own mains)

  // R6 — which data-component names become main components: '*' (all except frameOnly) or an explicit list
  components: '*',
  frameOnly: ['Frame', 'Screen', 'Card', 'Dialog', 'Drawer', 'Sheet', 'Table', 'PageHeader', 'Field', 'Section', 'Modal'],
  // R5 — containers: one main built from child instances (nav bars, tab bars, tabs, pagination…)
  containers: ['Sidebar', 'Topbar', 'TabBar', 'Tabs', 'Segmented', 'FilterChips', 'Pagination', 'Breadcrumb'],
  // R1 — data-variant="a/b/c" segments → property names, per component. This list REPLACES the default list.
  variantProps: {
    Button: ['Type', 'Size', 'State'], IconButton: ['Type', 'Size'], Input: ['Size', 'State'], Textarea: ['State'], Select: ['Size', 'State'],
    Checkbox: ['Checked', 'State'], Radio: ['Checked', 'State'], Toggle: ['On', 'State'], Chip: ['Type'], Badge: ['Tone'], StatusChip: ['Status'],
    Tab: ['State'], NavItem: ['State'], NavSubItem: ['State'], TabBarItem: ['State'], Segmented: ['Type'], Banner: ['Tone'], Toast: ['Tone'],
    Avatar: ['Size'], Count: ['Tone'], TableRow: ['State'], ListRow: ['Type'], StatTile: ['Tone'],
  },
  words: {},                            // extra value words, e.g. { neg: 'Negative', en: 'EN' } (sm/md/lg/xs/on/off built in)

  // Fonts — Figma needs the same family/style names its font picker shows
  // fontFamily: (cssFamily) => cssFamily,   // default maps system-ui → Inter, monospace → Roboto Mono
  fontStyles: {},                       // e.g. { Inter: { 600: 'Semi Bold', 800: 'Extra Bold' } } if Figma names differ
  // glyphFallback: 'Inter',            // draw glyphs for un-inlined families with this inline family (approximation)

  // Naming (defaults: section = module/flow name; frame = "<Module or Flow> / <Function> / <Screen — State> · Positive|Negative")
  // sectionName: (group) => group.name,
  // screenName: (screen, group) => `${group.name} / ${screen.title}`,
  // transformHtml: (html, screen) => html,   // e.g. format dates before render
  // panel: false,                      // keep your own viewer; call FigmaPanel.copyPage(btn) etc.
};
