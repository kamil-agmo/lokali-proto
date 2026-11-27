# Lokali — Requirements brief

Sources: **[B]** = `Lokali — Vendor Brief (2).pdf` (Nov 16 2026, @Ken) · **[S]** = `Design Request_Lokali Online Booking Platform.xlsx` (SOW / costing sheet, incl. Open Questions tab) · **[W]** = thehabitat.my (brand cues) · **[R]** = quick research / common patterns (Airbnb Experiences, Klook, GetYourGuide).
Tags: **Stated** (with source) · **Inferred** (from which items) · **Suggested** (why). Nothing Suggested is the client's requirement.

## 1. Summary

- **What:** Lokali, a two-sided marketplace to discover, book and pay for sustainable local experiences in Malaysia. *"Airbnb Experiences, but every listing is good for nature and local communities."* [B p1]
- **For whom:** tourists (guests), local hosts, corporate clients, Lokali admin team. [B p1]
- **Why:** tourists can't find or trust responsible experiences; rural operators lack reach and booking tools. [B p1]
- **Platform:** Phase 1 = mobile-first responsive web app; native iOS/Android later on same backend. [B p1, p2; S Phase 2]
- **Success measure (Suggested):** guest books in ≤ 3 min from listing on phone; hosts paid ~24 h after experience; admin approves a listing in < 5 min.

## 2. Users and roles

| Role | Who | Needs | Device / context |
|---|---|---|---|
| Guest | Intl + domestic tourists, solo or small groups [B p1] | Find, trust, book fast; pay online [B p1] | Phone, on the move, often roaming data [B p5 "most guests book on phones"] |
| Host | Small rural operators (kampung, NGOs, farms) + established tour operators [B p1] | Simple listing + calendar, bookings, messaging, reliable payouts [B p1] | Phone (Inferred: rural hosts, mobile-first brief); some with limited digital skills [B p1] |
| Corporate client | Companies booking team-building / CSR [B p1] | Submit enquiry, get custom quote offline [B p2] | Desktop or phone |
| Lokali admin | Lokali staff, non-technical [B p5] | Approve, onboard on behalf, manage bookings, payouts, refunds, disputes [B p1] | Desktop |

## 3. Goals

1. Trust: every listing shows impact + where the money goes [B p3 "strongest trust signal"].
2. Speed: discover → pay on phone without friction [B p1, p5].
3. Host simplicity: guided listing, no blank page [B p3].
4. Ops control without developers: categories, content, fees, policies editable [B p2, p4; S].

## 4. Features by priority (MoSCoW)

### Guest
| Feature | P | Tag | Source |
|---|---|---|---|
| Homepage: featured experiences + category browsing | Must | Stated | S Guest › Discovery |
| Search + filter: location, date, category, price, group size | Must | Stated | S; B p2 G1 |
| Results list + map view, mobile-first | Must | Stated | S |
| Listing page in fixed 18-section order (hook → FAQs) | Must | Stated | S; B p3–4 |
| Gallery (min 5), optional video, meeting-point map, sticky booking box (desktop) | Must | Stated | S; B p3 |
| Sign up / log in: email+password, Google, Apple | Must | Stated | S; B p2 G3 |
| Book: date + time slot, adults/children pricing, private option, pay in MYR | Must | Stated | S |
| Price summary incl. guest service fee before paying | Must | Stated | S |
| Payment: Visa, Mastercard, FPX, e-wallet | Must | Stated | S Open Qs ("is a must") — overrides B p4 "nice to have" |
| Booking confirmed instantly after payment | Must | Stated | S Open Qs |
| My bookings: view, manage, cancel; refund shown before confirming | Must | Stated | S |
| Emails: confirmation + reminders | Must | Stated | S; B p2 G5 |
| Guest–host inbox, before + after booking ("like Grab") | Must | Stated | S; B p2 G6 |
| Star rating + written review; host replies shown on listing | Must | Stated | S |
| Guest photos in reviews | Should | Stated | B p4 #19 (not in S) |
| Corporate enquiry form (company, group size, dates, budget, interests) | Must | Stated | S; B p2 |
| Approx. price in guest's currency | Could | Stated | B p4 "nice to have" |
| Browse without account; sign in at checkout | Should | Suggested | Avoids sign-in too early [R] |
| Delete account / manage personal data | Should | Suggested | PDPA [B p5] |
| Wishlist, vouchers, multi-language, impact tracking | Won't (MVP) | Stated | B p5; S Phase 2 |

### Host
| Feature | P | Tag | Source |
|---|---|---|---|
| Self-serve sign-up: profile (photo, story, contact, business details, documents) | Must | Stated | S Host; B p2 H1 |
| Guided listing form in guest-page order, writing tips, "Meet your guide" prompts | Must | Stated | S; B p3 |
| Photos (min 5) + optional video, per-person price, optional group + child price, capacity, sustainability info | Must | Stated | S; B p2 H2 |
| Required fields enforced; save draft; submit for review | Must | Stated | S; B p3 |
| One cancellation policy per listing (Flexible / Moderate / Firm) | Must | Stated | S |
| Calendar: recurring slots, one-off slots, blocked dates; capacity per slot; auto-close when full | Must | Stated | S; B p2 H3 |
| Upcoming/past bookings with guest list (names, group size, dietary notes) | Must | Stated | S |
| Email per new booking / cancellation | Must | Stated | S |
| Guest inbox | Must | Stated | S |
| Reply to reviews | Must | Stated | S; B p2 H7 |
| Earnings: commission deducted, payout status + history, payout ~24 h after experience | Must | Stated | S; S Open Qs |
| Bank details | Must | Stated | S; B p2 H6 |
| See status + admin notes on rejected application/listing | Must | Inferred | from admin "notes back to the host" [S] |

### Admin
| Feature | P | Tag | Source |
|---|---|---|---|
| Admin login + role-based access | Must | Stated | S Admin |
| Configure host commission % + guest service fee % | Must | Stated | S; B p4 |
| Commission per host / listing override | Should | Stated | B p4 "ideally" |
| 3 cancellation policies × 2 experience types, auto refunds; staff can change a listing's policy; manual refunds/exceptions | Must | Stated | S Refunds |
| Approve / reject host applications + listings with notes | Must | Stated | S; B p2 A1 |
| Create/edit hosts + listings on host's behalf (assisted onboarding) | Must | Stated | S; B p1, p2 |
| View/search all bookings; cancellations + refunds | Must | Stated | S |
| Payouts to hosts; commission earned | Must | Stated | B p2 A4; S |
| Moderate reviews + messages; disputes | Must | Stated | S; B p3 A5 |
| Categories: add, rename, reorder | Must | Stated | S; B p2 |
| Featured listings, homepage content, FAQs | Must | Stated | S |
| Edit host content + listing sections; reorder optional sections; add fields later | Should | Stated | S "where possible"; B p4 |
| Reports: bookings, revenue, commission, top listings; date filters; spreadsheet export | Must | Stated | S; B p3 |
| Corporate enquiries list | Must | Stated | S; B p3 |

## 5. Key flows

1. **Discover → book (guest):** Home → search/filter → results (list ⇄ map) → listing → choose date, slot, guests, private? → sign in (if not) → checkout (summary + fee + method) → pay → confirmed (instant) → email.
   *Errors:* slot fills during checkout → "Slot is full" + pick another; payment fails → retry/other method. *Empty:* no results → widen filters / clear dates.
2. **Cancel (guest):** My bookings → booking → Cancel → refund preview per policy & time left → confirm → refund status.
3. **Message:** listing "Message host" or booking → thread. *Empty:* "No messages yet."
4. **Review:** after experience, email/My bookings prompt → stars + text (+photos) → shows on listing; host can reply.
5. **Host onboarding (self-serve):** Sign up → profile + business + documents → submit → "In review" → approved / changes requested (with admin notes).
6. **Assisted onboarding:** Admin → Hosts → Create host → create listing on behalf → publish.
7. **Create listing (host):** Listings → New → guided 14 steps (guest-page order) → progress + required checks → save draft → submit → admin review → live / changes requested.
8. **Availability:** Calendar → add recurring slot / one-off slot / block date; capacity; full slots close automatically.
9. **Run an experience (host):** Booking notification → booking detail → guest list (dietary notes) → after experience payout "Scheduled ~24 h after end".
10. **Admin approvals:** Approvals queue → open item → approve / request changes (note) / reject.
11. **Admin refund exception:** Bookings → booking → manual refund (amount, reason) → guest notified.

## 6. Screen inventory

**Guest (mobile web, iPhone frame)**
| # | Screen | Purpose / key actions |
|---|---|---|
| G1 | Home | Search, categories, featured, corporate CTA |
| G2 | Search & filters | Location, dates, guests, category, price |
| G3 | Results (list ⇄ map) | Compare, open listing |
| G4 | Listing | 18 sections, sticky "Check availability" bar |
| G5 | Choose date & guests | Slot, adults/children, private |
| G6 | Sign in | Email, Google, Apple (at checkout) |
| G7 | Checkout | Summary incl. service fee, payment method |
| G8 | Booking confirmed | Next steps, message host |
| G9 | My bookings | Upcoming / past |
| G10 | Booking detail | Meeting point, message, cancel, review |
| G11 | Cancel booking | Refund preview, confirm |
| G12 | Inbox | Threads |
| G13 | Chat | Messages with host |
| G14 | Write review | Stars, text, photos |
| G15 | Corporate enquiry | Form + sent |
| G16 | Account | Profile, payment, delete account |
| G17 | Email: booking confirmed | Confirmation + reminder template |

**Host (mobile web, iPhone frame)**
| # | Screen | Purpose |
|---|---|---|
| H1 | Become a host (sign-up steps) | Account, business, documents |
| H2 | Application status | In review / changes requested |
| H3 | Host home | Today, next bookings, payouts, to-dos |
| H4 | My listings | Draft / in review / live / changes requested |
| H5 | Listing builder (overview) | 14 sections, progress, submit |
| H6 | Builder: Meet your guide | Guided prompts + tips |
| H7 | Builder: Price & policy | Adult/child/private price, capacity, policy |
| H8 | Calendar | Month, slots, blocked dates |
| H9 | Add time slot | Recurring / one-off, capacity |
| H10 | Bookings | Upcoming / past |
| H11 | Booking & guest list | Names, group size, dietary |
| H12 | Inbox / chat | (shares G12/G13 pattern) |
| H13 | Reviews | Reply |
| H14 | Earnings | Scheduled, paid, commission |
| H15 | Bank details | Payout account |

**Admin portal (desktop)**
| # | Screen | Purpose |
|---|---|---|
| A1 | Sign in | Email + password |
| A2 | Dashboard | KPIs, queues needing action |
| A3 | Approvals | Hosts + listings queue, review with notes |
| A4 | Hosts | List, detail, create on behalf |
| A5 | Listings | List, edit on behalf, change policy |
| A6 | Bookings | Search, detail, cancel, manual refund |
| A7 | Payouts | Scheduled / paid / held |
| A8 | Moderation | Reviews + messages flagged, disputes |
| A9 | Corporate enquiries | List + detail |
| A10 | Content | Categories, featured, homepage, FAQs, listing fields |
| A11 | Fees & policies | Commission, service fee, cancellation policies |
| A12 | Reports | Date filter, export |
| A13 | Team & roles | Staff, roles, permissions |

## 7. Content and data

- **Categories at launch:** Nature & eco-tours · Culture, Craft & Heritage · Farm & food [B p2] (brief says "four" — see Q1).
- **Listing fields (order):** 1 Hook · 2 Quick facts · 3 Narrative · 4 Itinerary · 5 Included/not · 6 Meet your guide · 7 Impact story · 8 Where your money goes · 10 Getting there · 11 What to bring · 12 Etiquette (opt) · 13 Food & dietary (if food) · 14 Accessibility · 16 Price · 17 Cancellation policy · 18 Group/private/corporate (opt) · 19 Reviews (auto) · 20 FAQs (opt) [B p3–4].
- **Money:** MYR, e.g. "RM 180 / adult". Service fee shown as its own line.
- **Sample data:** Malaysian names, places (Kuala Selangor, Penang Hill, Kinabatangan, Kampung Kuala Muda), +60 numbers.

## 8. Rules and constraints

**Cancellation policies** (times count back from start in the listing's local time) [S Refunds + policy image]:

| Type | Flexible | Moderate | Firm |
|---|---|---|---|
| Day experience (pay in full) | 100% ≥ 24 h | **Default** · 100% ≥ 72 h | 100% ≥ 12 d · 50% 5–<12 d · 0 < 5 d |
| Multi-day retreat (deposit, balance later; % of amount paid) | 100% ≥ 7 d | 100% ≥ 30 d · 50% 14–29 d | **Default** · 100% ≥ 60 d · 50% 30–59 d |

- Booking confirmed instantly after payment [S Open Qs].
- Lokali holds funds; host paid ~24 h after experience ends [S Open Qs].
- Commission % from host + guest service fee % at checkout, both configurable [S; B p4].
- Full address can be hidden until booked (host choice) [B p3].
- PCI gateway, no card data stored; PDPA [B p5]. Admin usable by non-technical staff [B p5].
- Language: English only in MVP [B p5].
- **Payment gateway (Suggested, for proposal):** Stripe Connect (MY: cards, FPX, GrabPay; split payouts) or a local option such as Billplz / iPay88 / Razer MS + manual payouts. Design stays gateway-neutral.

## 9. Design implications

- **Mobile-first web**; guest + host shown in iPhone frame, admin as full-width desktop. Desktop guest listing needs sticky booking box (Inferred; shown as note — mobile uses sticky bottom bar).
- **Brand:** Lokali sits under The Habitat Group [W] → earthy, nature-led palette: forest/olive green primary, sand/gold accents, warm off-white; Montserrat (Habitat's web font). Big imagery; calm, trustworthy.
- **Trust signals** up front: "Where your money goes" bar, impact badge, verified host, policy in plain words.
- **Hosts with low digital skills:** large tap targets, one section per step, progress, tips, save as draft everywhere.
- **Admin:** dense tables, filters, status chips, side detail panels; light theme.

## 10. Open questions and assumptions

| # | Question | Suggested answer (used in design) |
|---|---|---|
| Q1 | Brief says **four** categories but lists three. Is the 4th "Wellness & retreats" or similar? | Show 3 + placeholder "Retreats & stays"; admin can add/rename. |
| Q2 | Are **multi-day retreats** (deposit + balance) in MVP? Policies exist for them, but the SOW lists them without effort. | Design day experiences fully; show retreat as a listing type with deposit line in checkout/policies. |
| Q3 | Listing sections **9 and 15** are missing in the numbering. | Assume removed; keep order as given. |
| Q4 | Payout timing: brief says "on a schedule (e.g. weekly)", Open Qs say ~24 h after. | ~24 h after the experience (latest client answer); admin can hold a payout. |
| Q5 | FPX/e-wallet: "nice to have" (brief) vs "must" (Open Qs). | Must. |
| Q6 | Who pays commission? | Both: host commission (e.g. 15%) + guest service fee (e.g. 5%), configurable globally + per host/listing override. |
| Q7 | If the **host cancels**, does the guest always get 100%? | Yes, automatic full refund; admin notified. |
| Q8 | Admin **roles**? | Super admin, Operations, Finance, Content (read/edit matrix). |
| Q9 | Who can message whom; is contact info masked in chat? | In-app only; phone/email shown after booking. |
| Q10 | Can guests delete their account (PDPA)? | Yes, from Account. |
| Q11 | Booking reminders: when? | 48 h and 3 h before start (email). |
| Q12 | Dispute handling flow? | Guest reports issue from booking → admin dispute queue → manual refund. |
| Q13 | Can one person be both a guest and a host? Not stated in the brief or SOW. | Suggested: one Lokali account with two modes (Airbnb model). Hosting unlocks after approval; "Switch to hosting" / "Switch to guest"; host sign-up fills in name, mobile and email; inboxes split by mode. Hosts onboarded by staff need no guest account. Still to confirm: hosts can't book their own listings; reviews kept per role; deleting the account also closes the host profile once payouts are settled (PDPA). May add backend effort; confirm scope. Prototype (27 Nov): a Hosting pill top-right of guest Home (approved hosts, red dot when something waits), a one-second "Switching to hosting / guest" moment, "Hosting · date" on host Today with a Switch to guest pill in the same corner; Account and Menu rows stay. Prototype: Aina is both guest and host (her own kuih class); her own listing can't be booked ("Your listing" bar), and Preview as guest shows it without Book. |
| Q14 | Show platform impact totals on Home? Not in the brief ("impact tracking" is Won't for MVP). | Suggested: an "Impact so far" band (money to hosts, mangroves replanted). Numbers in the prototype are samples; confirm the source (admin-entered or computed). |
| Q15 | A public host profile page? Not in the brief; the listing has "Meet your guide". | Suggested: host profile (photo of their place, round profile photo, Message, guests hosted, rating, reply time, what guests say about them, Q&A), opened from the Guide row on the listing. Trust signal; confirm scope. |
| Q16 | Boat or equipment rental on its own? Not in the brief (only experiences, with a private option). | Not designed. Would need a different booking model (by hour/day, per item, deposit, pick-up/return). |
| Q17 | Corporate enquiry: extra fields beyond the brief (company, group size, dates, budget, interests)? | Suggested: Preferred area, Experience (optional, filled in when coming from a listing) and Anything else, to make the quote faster. Confirm scope. |

## 11. Sources

- `/Users/user/Downloads/Lokali — Vendor Brief (2).pdf` (5 pages)
- `/Users/user/Downloads/Design Request_Lokali Online Booking Platform.xlsx - Google Sheets.pdf` (1 page; Guest/Host/Admin modules, Phase 2, Open Questions, policy image)
- https://www.thehabitat.my/ — colours rgb(97,114,47) olive, rgb(210,183,46) gold, rgb(216,190,122) sand, rgb(41,53,77) navy; Montserrat / Gotham
- Common patterns [R]: Airbnb Experiences (listing order, sticky booking, host prompts), Klook / GetYourGuide (slot picker, instant confirmation, refund preview)
