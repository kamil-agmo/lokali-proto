/* figma.config.js for the GD member app (~/gd-mobile-app) — second reference config (phone frames, by module). */
const FIGMA_CONFIG = {
  name: 'GD Mobile App Prototype', // fileKey GDMobileAppPrototype
  storageKey: 'gdm',
  frameWidth: 1440, // the host is wide; each phone screen's root element is 390 px wide itself
  organise: 'module',
  copy: ['page', 'group', 'screen'],
  output: 'design',
  components: ['Button', 'IconButton', 'Chip', 'StatusChip', 'TierBadge', 'TBCTag', 'Count', 'Delta', 'Avatar', 'Checkbox', 'Radio', 'Toggle',
    'Tab', 'Tabs', 'Segmented', 'LanguageTabs', 'CoinGlyph', 'CoinAmount', 'ModuleIcon', 'TierMedallion', 'Input', 'Textarea', 'Breadcrumb', 'Pagination',
    'NavItem', 'NavSubItem', 'Topbar', 'Sidebar', 'TableRow', 'StatTile', 'TierCard', 'Toast', 'Banner', 'NotificationItem', 'AttentionRow', 'ListRow', 'RewardRow',
    'PermissionRow', 'TierBonusRow', 'SortableRow', 'TrailItem', 'FilterChips', 'Metric', 'DiffRow', 'Progress', 'ProfileMenu', 'EmptyState',
    'StatusBar', 'HomeIndicator', 'AppBar', 'TabBar', 'TabBarItem', 'Heart', 'Pill', 'OptionRow', 'PasswordRule', 'ServiceItem', 'QuickTile', 'TimelineItem', 'SearchTab', 'FlightRow', 'InfoTile'],
  containers: ['TabBar', 'Sidebar', 'Topbar', 'Tabs', 'Segmented', 'LanguageTabs', 'FilterChips', 'Pagination', 'Breadcrumb'],
  variantProps: {
    Button: ['Type', 'Size', 'State'], IconButton: ['Type'], Input: ['State'], Textarea: ['State'],
    Checkbox: ['Checked'], Radio: ['Checked'], Toggle: ['On', 'State'], Segmented: ['Type'], StatusChip: ['Status'], Chip: ['State'],
    Count: ['Tone'], Delta: ['Direction'], Avatar: ['Size'], ModuleIcon: ['Module'], Tab: ['State'], NavItem: ['State'], NavSubItem: ['State'],
    Banner: ['Tone'], Toast: ['Tone'], NotificationItem: ['State'], TableRow: ['State'], StatTile: ['Tone'], AttentionRow: ['Tone'], TrailItem: ['Step'],
    TierBonusRow: ['State'], TierCard: ['Tier'], TierMedallion: ['Tier'], TierBadge: ['Tier'], CoinAmount: ['Tone'], SortableRow: ['State'],
    LanguageTabs: ['Active'], RewardRow: ['State'], PermissionRow: ['State'], ListRow: ['Type'],
    TabBarItem: ['State'], Heart: ['State'], Pill: ['Tone', 'Size'], OptionRow: ['State'], PasswordRule: ['State'], AppBar: ['Type'], StatusBar: ['Type'],
    HomeIndicator: ['Type'], ServiceItem: ['Type'], QuickTile: ['Type'], TimelineItem: ['State'], SearchTab: ['State'], FlightRow: ['Type'], InfoTile: ['Type'],
  },
  words: { neg: 'Negative', en: 'EN', zh: 'ZH' },
  fontFamily: (f) => (/mono/i.test(f) ? 'Roboto Mono' : 'Poppins'),
  glyphFallback: 'Poppins',
  styleFromFaces: false, // keep the confirmed naming: style from the CSS weight (Figma has every Poppins weight)
  sectionName: (g) => g.name,
  screenName: (s) => s.figName,
};
