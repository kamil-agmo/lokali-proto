# Design systems the intake offers

The shell itself stays neutral. The design system answer decides how the **prototype's screens** are built, and goes into the project's `DESIGN.md` (`scaffold.py --design-system`). Use the "Pick it when" line in each option's description in the intake so the user understands the choice.

| Key | System | Pick it when | Key factors to explain |
|---|---|---|---|
| `material` | **Google Material Design 3** | Android-first apps, or a friendly, colourful, consistent look with little effort | One seed colour generates the whole palette (dynamic colour); rounded shapes; tone-based elevation; Roboto; bottom navigation bar + top app bar; ripple on press; Material Symbols icons |
| `hig` | **Apple Human Interface Guidelines** | iPhone-first apps, premium and minimal, content first | Clarity, deference, depth; translucent bars; SF Pro (system font on the web); large collapsing titles; 44 pt tap targets; tab bar at the bottom; sheets and spring motion; SF Symbols can't be used on the web, so use Phosphor or Bootstrap Icons |
| `fluent` | **Microsoft Fluent 2** | productivity, enterprise or Windows/Teams-style tools | Calm neutral greys, one brand colour ramp; Segoe UI; 4 px grid, small radii (4-8 px); soft layered shadows; strong keyboard focus; Fluent icons |
| `carbon` | **IBM Carbon** | dashboards, data-heavy and B2B tools | Square corners, flat surfaces, strict 2x grid and 8 px spacing; IBM Plex Sans; Gray themes with blue as the interactive colour; dense tables |
| `custom` | **Custom / brand guidelines** | the client has its own guidelines | Ask for the guideline file or link; record colours, type, radius and spacing in `DESIGN.md` |
| `none` | **No system** | a quick sketch | Nothing written; the screens follow the prototype's own CSS |

Others the user may name under "Other" (record them as `custom` with a link): Ant Design (enterprise web), Atlassian Design System, Shopify Polaris (commerce admin), Salesforce Lightning, GOV.UK (public services), Samsung One UI.

## Colour theme suggestions

Suggest four palettes that fit **the app being designed** (its category and mood), each as primary + secondary + background, and show the hex values in the option description. Starting points by category, to adapt:

| App type | Suggestions |
|---|---|
| Social / lifestyle | Violet→pink `#7C3AED`/`#EC4899`; Coral `#F97362`/`#FDBA74`; Electric blue `#2563EB`/`#22D3EE`; Mono black `#111111`/`#F5F5F5` |
| Finance / banking | Navy `#1E3A8A`/`#10B981`; Teal `#0F766E`/`#F59E0B`; Deep green `#14532D`/`#A3E635`; Graphite `#1F2937`/`#3B82F6` |
| Health / wellness | Sage `#4D7C0F`/`#A7F3D0`; Calm blue `#0EA5E9`/`#E0F2FE`; Lavender `#8B5CF6`/`#FDE68A`; Warm sand `#B45309`/`#FEF3C7` |
| Food / delivery | Tomato `#EF4444`/`#FBBF24`; Orange `#F97316`/`#16A34A`; Berry `#BE185D`/`#FDE68A`; Olive `#65A30D`/`#F5F5F4` |
| Productivity / B2B | Indigo `#4F46E5`/`#06B6D4`; Slate `#334155`/`#F59E0B`; Blue `#0F62FE`/`#F4F4F4` (Carbon); Fluent blue `#0F6CBD`/`#F5F5F5` |
| Travel / outdoors | Ocean `#0369A1`/`#FBBF24`; Forest `#166534`/`#FDE68A`; Sunset `#EA580C`/`#7C3AED`; Sky `#38BDF8`/`#0F172A` |

If the project already has screens, `suggest_theme.py` finds the colour they use: offer that as the first (Recommended) option.
