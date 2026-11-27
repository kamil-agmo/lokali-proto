# Lokali — Admin portal plan

Source: admin only scope from the SOW sheet (Admin Portal rows) and Vendor Brief p2–3. Every screen traces to a requirement; no extra screens.

| Admin screen | Why (requirement) | Holds | Actions |
|---|---|---|---|
| a-login | S: Login + role based access | Email, password | Sign in, reset |
| a-dashboard | B p3 #8 reports; queues from S | KPIs, trend, needs attention, payouts, top listings | Jump to queues |
| a-approvals / a-review | S: Approve or reject host applications and listings, notes back | Hosts + listings queue, section checklist | Approve, request changes (note), reject |
| a-hosts / a-host | S: Create and edit hosts on a host's behalf; B p1 assisted onboarding | Hosts, onboarding type, docs, listings | Create host, edit, commission override |
| a-listings / a-listing | S: Edit host content and listing sections; staff can change policy | Listings, sections, policy | Edit on behalf, reorder optional sections, add field, feature |
| a-bookings / a-booking | S: View and search all bookings; manage cancellations and refunds | Bookings, payment split, timeline | Cancel on behalf, manual refund, hold payout |
| a-payouts | B p2 #4 payouts + commission; S Open Qs ~24 h | Scheduled, paid, on hold | Hold, release |
| a-moderation | S: Review and remove inappropriate reviews and messages; B disputes | Reports, disputes | Keep, hide, remove, resolve with refund |
| a-enquiries | S: View corporate enquiries | Enquiries pipeline | Change status, notes |
| a-content | S: Categories, featured, homepage, FAQs, listing fields | Content tabs | Add, rename, reorder, feature |
| a-reports | S: Basic reports, date filters, spreadsheet download | Bookings, revenue, commission, top listings | Filter, export .xlsx/.csv |
| a-fees | S: Commission and fees; 3 policies × 2 types | Rates, overrides, policy tables | Edit rates, set defaults |
| a-team | S: Role based access control | Staff, roles, permission matrix | Invite, change role |

**Roles (suggested, REQUIREMENTS Q8):** Super admin (all), Operations (approvals, bookings, moderation, hosts), Finance (payouts, refunds, fees, reports), Content (categories, homepage, FAQs, featured).
**Layout:** left sidebar, sticky top bar with search, content max 1440 px.
