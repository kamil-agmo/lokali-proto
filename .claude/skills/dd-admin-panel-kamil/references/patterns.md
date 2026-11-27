# Admin screen patterns

How each kind of evidence becomes an admin screen: in the phone app, or (admin only) in the brief. Name things in the app's or the brief's own words.

| In the phone app | In the brief (admin only) | Admin screen | Holds | Actions |
|---|---|---|---|---|
| Numbers shown to users (followers, posts, orders, balance) | Goals, success measures, KPIs | Dashboard | KPI cards with the change over 7 / 30 days, one trend chart, "needs attention" list | Open the list behind each card |
| A feed, list or grid people add to | "Manage / create / edit X" | Management table for that thing | Search, filters (status, date, author), sortable columns from what each item shows, bulk select | View, edit, hide, remove, feature; mirror the phone's own actions |
| Sign in, sign up, profiles | Roles, accounts, staff, permissions | Users | Name, handle, status, joined, last active, counts; profile detail | Verify, suspend, reset password, message |
| Report, block, hide, flag | "Report a post", flag, ban, abuse | Moderation queue | Reported item, reason, reporter, count of reports, age | Keep, remove, warn the author; history of decisions |
| Submit for review, verify, request | Approve, reject, verify, pending | Approvals | Pending items with what was asked | Approve, reject with a note |
| Pay, order, subscribe | Payments, refunds, invoices, billing | Orders and payments | Orders, status, amount, refunds, revenue summary | Refund, cancel, resend receipt |
| Comments, messages | Enquiries, tickets, support, feedback | Conversations and comments | Search, flagged ones | Remove, hide, contact |
| Settings, notifications | Configuration, templates, announcements | App settings | App-wide switches, feature flags, announcements | Save, schedule an announcement |
| Anything an admin changes | Audit trail, history of changes | Activity log | Time, admin, action, item | Undo where it makes sense |
| - | Reports, exports, analytics, Excel / CSV | Reports and exports | Filters by date and type, charts | Export CSV / Excel, schedule |

## Layout

- Sidebar on the left (220-260 px) with the screens in the order above; a sticky top bar with search and the admin's avatar.
- Tables: 48-56 px rows, the item's thumbnail and title first, status as a chip, actions on the right (icons with labels on hover).
- Empty, loading and "only on screen" states: say so in words.

## Roles

One admin by default. With roles (owner, moderator), show the role in the top bar and grey out what a role cannot do, with a note why.
