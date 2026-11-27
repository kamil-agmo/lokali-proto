/* figma.config.js for the GD Admin Portal (~/gd-admin-portal) — reference config.
   Reproduces the encoder output the GD design page was confirmed with in real Figma (2026-11-11/12).
   Pre-flight answers: Q1 by flow · Q3 page + flow + screen · Q4 design page · Q5 no library. */
const FIGMA_CONFIG = {
  name: 'GD Admin Portal Prototype', // fileKey GDAdminPortalPrototype
  storageKey: 'gd',                  // switches gd-fig-hug, gd-fig-props …
  frameWidth: 1440,
  organise: 'flow',
  copy: ['page', 'group', 'screen'],
  output: 'design',
  components: ['Button', 'IconButton', 'Chip', 'StatusChip', 'TierBadge', 'TBCTag', 'Count', 'Delta', 'Avatar', 'Checkbox', 'Radio', 'Toggle',
    'Tab', 'Tabs', 'Segmented', 'LanguageTabs', 'CoinGlyph', 'CoinAmount', 'ModuleIcon', 'TierMedallion', 'Input', 'Textarea', 'Breadcrumb', 'Pagination',
    'NavItem', 'NavSubItem', 'Topbar', 'Sidebar', 'TableRow', 'StatTile', 'TierCard', 'Toast', 'Banner', 'NotificationItem', 'AttentionRow', 'ListRow', 'RewardRow',
    'PermissionRow', 'TierBonusRow', 'SortableRow', 'TrailItem', 'FilterChips', 'Metric', 'DiffRow', 'Progress', 'ProfileMenu', 'EmptyState'],
  containers: ['Sidebar', 'Topbar', 'Tabs', 'Segmented', 'LanguageTabs', 'FilterChips', 'Pagination', 'Breadcrumb'],
  variantProps: {
    Button: ['Type', 'Size', 'State'], IconButton: ['Type', 'Size', 'Badge'], Input: ['Size', 'State'], Textarea: ['State'],
    Checkbox: ['Checked', 'State'], Radio: ['Checked'], Toggle: ['On', 'State'], Segmented: ['Type'], StatusChip: ['Status'], Chip: ['Type'],
    Count: ['Tone'], Delta: ['Direction'], Avatar: ['Size'], ModuleIcon: ['Module'], Tab: ['State'], NavItem: ['State'], NavSubItem: ['State'],
    Banner: ['Tone'], Toast: ['Tone'], NotificationItem: ['State'], TableRow: ['State'], StatTile: ['Tone'], AttentionRow: ['Tone'], TrailItem: ['Step'],
    TierBonusRow: ['State'], TierCard: ['Tier'], TierMedallion: ['Tier'], TierBadge: ['Tier'], CoinAmount: ['Tone'], SortableRow: ['State'],
    LanguageTabs: ['Active'], RewardRow: ['State'], PermissionRow: ['State'],
  },
  words: { neg: 'Negative', en: 'EN', zh: 'ZH' },
  // Every text is Poppins in Figma except monospace; Poppins TTFs (inline) draw all glyphs.
  fontFamily: (f) => (/mono/i.test(f) ? 'Roboto Mono' : 'Poppins'),
  glyphFallback: 'Poppins',
  styleFromFaces: false, // keep the confirmed naming: style from the CSS weight (Figma has every Poppins weight)
  transformHtml: (html) => fmtTimes(html), // DD/MM/YYYY HH:mm (components.js)
  sectionName: (g) => (g.key === '0' ? 'Design system' : `${g.key === '3.0' ? '' : `Flow ${g.key} · `}${g.name}`),
  screenName: (s) => s.figName,
};
