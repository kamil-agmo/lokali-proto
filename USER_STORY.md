# Lokali — User stories

Grouped by role, priority order. Feature names match `REQUIREMENTS.md` §4. Sources: [B] Vendor Brief, [S] SOW sheet.

## Guest

1. **Discover (Must)** — As a guest, I want to browse featured experiences and categories, so that I can find something without knowing what to search for. [S]
   - Home shows search, categories (admin-managed), featured listings.
2. **Search & filter (Must)** — As a guest, I want to filter by location, date, category, price and group size, so that I only see what I can actually book. [S; B]
   - Results show count; list ⇄ map toggle; empty state offers "Clear filters".
3. **Trust a listing (Must)** — As a guest, I want to see impact and where my money goes, so that I know the experience is genuinely sustainable. [B p3]
   - Listing shows all required sections in the fixed order; money bar adds up to 100%.
4. **Book (Must)** — As a guest, I want to pick a date, slot, number of adults/children and private option, so that I can book for my group. [S]
   - Full slots can't be selected; child price applied; private price shown when toggled.
5. **Pay (Must)** — As a guest, I want to see the total incl. service fee and pay by card, FPX or e-wallet in MYR, so that there are no surprises. [S]
   - Fee is its own line; booking confirmed instantly after payment; confirmation email sent.
6. **Sign in late (Should, Suggested)** — As a guest, I want to sign in only when I book, using Google, Apple or email, so that browsing is quick. [S; R]
7. **Manage bookings (Must)** — As a guest, I want to see upcoming and past bookings, so that I have all details in one place. [S]
8. **Cancel with clarity (Must)** — As a guest, I want to see exactly how much I'll get back before I confirm a cancellation, so that I can decide. [S]
   - Refund amount follows the listing's policy and time left.
9. **Message host (Must)** — As a guest, I want to message the host before and after booking, so that I can ask questions. [S; B]
10. **Review (Must)** — As a guest, I want to rate and review after the experience, so that others can trust it. [S]
11. **Corporate enquiry (Must)** — As a company, I want to send an enquiry with group size, dates, budget and interests, so that Lokali can quote me. [S; B]
12. **Delete account (Should, Suggested)** — As a guest, I want to delete my account, so that my data is removed (PDPA). [B p5]

## Host

0. **Guest who also hosts (Should, Suggested — Q13)** — As a guest who runs experiences, I want to use the same Lokali account to host, so that I don't need a second sign-in. 
   - Account shows "Become a host", then "In review", then "Switch to hosting"; Menu shows "Switch to guest"; my details are filled in on host sign-up.

1. **Apply (Must)** — As an operator, I want to sign up with my business details and documents, so that I can start listing. [S; B]
   - Status visible: In review / Changes requested (with admin notes) / Approved.
2. **Guided listing (Must)** — As a host, I want a step-by-step form in the same order guests read, with tips and prompts, so that I never face a blank page. [B p3]
   - Required fields block "Submit for review"; draft saved anytime.
3. **Price & policy (Must)** — As a host, I want to set adult, child and private prices, capacity and a cancellation policy, so that bookings match how I operate. [S]
4. **Availability (Must)** — As a host, I want recurring and one-off slots and blocked dates, so that guests only book when I'm free. [S]
   - Capacity per slot; full slots close automatically.
5. **Bookings & guest list (Must)** — As a host, I want upcoming bookings with names, group size and dietary notes, so that I can prepare. [S]
   - Email for each new booking / cancellation.
6. **Message guests (Must)** — As a host, I want to chat with guests, so that I can share directions and answer questions. [S]
7. **Reply to reviews (Must)** — As a host, I want to reply publicly to reviews. [S; B]
8. **Earnings (Must)** — As a host, I want to see commission deducted and when each payout arrives (~24 h after), so that I can trust Lokali. [S]
9. **Bank details (Must)** — As a host, I want to add my Malaysian bank account, so that I get paid. [B]

## Admin

1. **Sign in with roles (Must)** — As an admin, I want role-based access, so that staff only see what they need. [S]
2. **Approvals (Must)** — As an admin, I want to approve, reject or request changes on hosts and listings with notes, so that only quality listings go live. [S; B]
3. **Assisted onboarding (Must)** — As an admin, I want to create hosts and listings on a host's behalf, so that low-digital hosts can join. [B p1]
4. **Bookings & refunds (Must)** — As an admin, I want to search all bookings and issue manual refunds, so that I can resolve host cancellations and disputes. [S]
5. **Payouts (Must)** — As an admin, I want to see scheduled, paid and held payouts, so that hosts are paid correctly. [B; S]
6. **Fees & policies (Must)** — As an admin, I want to set commission and service fee %, and see the cancellation policy rules, so that pricing can change without a developer. [S; B]
7. **Moderation (Must)** — As an admin, I want to hide inappropriate reviews and messages. [S]
8. **Content (Must)** — As an admin, I want to manage categories, featured listings, homepage and FAQs. [S]
9. **Corporate enquiries (Must)** — As an admin, I want to see and track corporate enquiries. [S]
10. **Reports (Must)** — As an admin, I want bookings, revenue, commission and top listings by date, exportable to a spreadsheet. [S]
