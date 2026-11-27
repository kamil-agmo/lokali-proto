/* The one file to edit. Everything the shell and the lock screen show comes from here.
   Every page loads this file (before js/shared/lock-guard.js), so the prefix and password are defined once.
   The password is checked in the browser, so it is a soft gate: it keeps casual visitors out, it is not security. */
window.SHELL = {
  name: "Lokali",
  tag: "Booking platform · Prototype v1",                      // the subtitle under the logo (or the name) in the left card; '' hides it
  version: "0.38.0",                    // the prototype's version, shown under the tag and linked to CHANGELOG.md: +0.0.1 small fix, +0.1 medium (layout, new screen), +1.0 large (redesign, new flow); bump it on every deploy
  logo: "assets/habitat-logo.png",                    // path to the logo shown at the top of the left card, relative to this file; null shows the name as text
  logoLock: null,           // logo for the lock screen's dark background (a light or white version); null uses `logo`
  password: null,
  theme: {
    accent: "#2F5D3A",              // the colour the shell highlights and the lock screen glow/tint come from: use the prototype's brand colour
    // accentStrong: '#1d4ed8',         // optional: the darker shade for text on tints (default: derived from accent)
    // lockBg: '#0b1b2b',               // optional: the lock screen's dark background (default: a dark tint of the accent)
    // font: '"Inter", system-ui, sans-serif',  // optional: font for the shell and lock screen (default: the system font)
    // fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap',   // optional: stylesheet that loads that font
    // radius: 16,                      // optional: corner radius (px) of the side cards (default 24)
    // pageBg: '#f4f2ff',               // optional: the shell page background (default a cool grey)
  },
  prefix: 'lokali',                 // names the storage key and the messages: <prefix>-unlocked, <prefix>:page ...
  appearance: false,                    // true (set when the colour mode is both): a System | Light | Dark control in the left card for screens that have a dark mode (html.dark)
  startPage: 'g-home',                    // id of the first page, opened after unlocking
  replay: null,               // the Replay button in the left card; null hides it (use null when the prototype has no intro)
  devices: ['iphone'],   // device skills shown, in this order: 'iphone' (dd-iphone-david), 'duo' (dd-iphone-duo-kamil); tabs appear when there is more than one
  lock: {
    taglines: ["Sustainable experiences, booked in minutes.", "Good for nature. Good for local communities.", "Guests, hosts and the Lokali team in one place."],          // lines that rotate on the lock screen
    stats: [{"n": 3, "s": "", "label": " apps"}, {"n": 55, "s": "", "label": " screens"}, {"n": 18, "s": "", "label": "listing sections"}],                // three counters under the tagline: { n: number, s: suffix, label }; [] hides them
    footer: "Lokali · Agmo Studio prototype"               // shown as "<name> · <footer>"
  },
  /* credits: a small "Credits" button under the right-hand card, one inline line: "Design by <designer> · <skills> by <makers> · ...".
     `made` lists the kit skills this prototype uses and who made them; scripts/credits.py fills it from each skill's author
     (run it again after adding a skill). Delete the block for no Credits button. */
  credits: {
    design: "Cheryl",
    made: [{"skill": "Presenter", "by": "David"}, {"skill": "iPhone", "by": "David"}, {"skill": "Icons", "by": "Kamil"}, {"skill": "Desktop", "by": "Kamil"}, {"skill": "Accessibility", "by": "Kamil"}, {"skill": "Admin panel", "by": "Kamil"}, {"skill": "UX writing", "by": "Kamil"}],                         // filled by scripts/credits.py from the kit skills in use
    thanks: []
  },
  /* pages: id -> where it lives. and what the right card says about it. `src` is relative to this file. */
  desktop: { contentMax: 1440, dock: true },   // dd-desktop-kamil: desktop pages. contentMax = max content width in px (null = full width); dock = keep the panels docked on ultrawide windows
  pages: {
    /* ---------- Guest: discover ---------- */
    'g-home': { group: 'Guest', title: 'Home', src: 'pages/g-home.html', desc: 'Where tourists start: search, browse the four categories and featured experiences. Browsing needs no account.',
      parts: ['Hosting pill, top right: approved hosts only, red dot when something waits (suggestion, Q13; shows after Switch to guest or Account › Approved)', 'Search pill (where · when · who)', 'Category chips', 'Featured this month (admin-picked, mangrove first)', 'Impact so far (suggestion, Q14)', 'More to explore', 'Team days banner (corporate enquiry)', 'Tab bar'] },
    'g-search': { group: 'Guest', title: 'Search & filters', src: 'pages/g-search.html', desc: 'Airbnb-style search: Where first, then When, Who, Category and Price. Dates, guests and price open in bottom sheets; each choice shows on the right of its row.',
      parts: ['Where with place suggestions', 'When (bottom sheet)', 'Who (bottom sheet)', 'Category pills, pick several', 'Price range (bottom sheet)', 'Show N experiences'] },
    'g-results': { group: 'Guest', title: 'Results (list ⇄ map)', src: 'pages/g-results.html', desc: 'Search results as a list with a Map / List switch; filters stay one tap away.',
      parts: ['Search summary + filter button', 'Active filter chips + sort', '"18 trips" title', 'Result cards', 'Map / List switch (white floating pill)', 'Map with price pins + preview card'] },
    'g-listing': { group: 'Guest', title: 'Experience page', src: 'pages/g-listing.html', desc: 'The experience page in the order a guest decides: hook, quick facts, story, itinerary, what\'s included, guide, impact, getting there, good to know, price, reviews, FAQs. Detail sits one tap away (sheets, Host profile, All reviews); a bottom bar keeps price and Book now in reach.',
      parts: ['Hook: gallery, title, impact line, rating, promise', 'Quick facts', 'What to expect (photos)', 'The story (full story in a sheet)', 'Itinerary (text)', 'What\'s included', 'Guide row › Host profile', 'Impact: money split + one line', 'Getting there (map sheet with drive / bus / pickup)', 'Good to know (4 sheets)', 'Price + one-line cancellation (dates in a sheet)', 'Groups and companies', 'Reviews + Show all', 'FAQs', 'Scrolled header: name, ⋯ menu, 5 tabs', 'Bottom bar: price + Book now'] },
    'g-host': { group: 'Guest', title: 'Host profile', src: 'pages/g-host.html', desc: 'Suggestion (not in the brief): Pak Rahim\'s profile, opened from Guide on the experience page. A photo of his river with the hill edge, his round photo overlapping it, Message, guests hosted / rating / reply time, what guests say about him, and Q&A.', parts: ['River photo + round profile photo', 'Message', 'Guests hosted, rating, reply time', 'What guests say about him', 'Get to know Pak Rahim'] },
    'g-reviews': { group: 'Guest', title: 'Reviews', src: 'pages/g-reviews.html', desc: 'All reviews for an experience, opened from the experience page. Overall rating, sort, and a With photos filter.', parts: ['Overall rating and number of reviews', 'Sort: newest, highest, lowest', 'With photos filter', 'Reviews with guest photos and host replies', 'Show more reviews'] },

    /* ---------- Guest: book & pay ---------- */
    'g-book': { group: 'Guest', title: 'Choose date & guests', src: 'pages/g-book.html', desc: 'Pick a date, a time slot, adults and children, and whether to book privately. Full slots cannot be chosen.',
      parts: ['Month calendar with available days', 'Time slots with spots left / Full', 'Adults + children counters (error only when over the spots left)', 'Book privately switch', 'Total before service fee + Go to checkout'] },
    'g-signin': { group: 'Guest', title: 'Sign in to book', src: 'pages/g-signin.html', desc: 'Sign-in appears only when the guest books, not while browsing. Google, Apple or email.',
      parts: ['Continue with Apple / Google', 'Email + password', 'Create account link', 'PDPA consent note'] },
    'g-checkout': { group: 'Guest', title: 'Checkout', src: 'pages/g-checkout.html', desc: 'Everything before paying: the booking, the price with the guest service fee as its own line, the cancellation policy and the payment method (card, FPX, e-wallet).',
      parts: ['Ticket: experience, date, time, guests + Edit; price breakdown incl. service fee and total', 'Impact line', 'Free cancellation date + policy line', 'Payment method: card / FPX / e-wallet', 'Message for the host (dietary)', 'Pay RM … bar'] },
    'g-confirmed': { group: 'Guest', title: 'Booking confirmed', src: 'pages/g-confirmed.html', desc: 'Instant confirmation after payment, with what happens next.',
      parts: ['Confirmed + booking ref', 'Date, time, meeting point', 'What happens next (email, reminder, messages, cancellation)', 'View booking, Message', 'Add to calendar (suggestion)'] },
    'g-email': { group: 'Guest', title: 'Email: confirmation & reminder', src: 'pages/g-email.html', desc: 'The confirmation email sent after paying, and the reminder sent before the experience.',
      parts: ['Confirmation / Reminder pills', 'Confirmation email', 'Reminder email (48 h before)', 'Booking details + meeting point', 'Manage booking button'] },

    /* ---------- Guest: after booking ---------- */
    'g-bookings': { group: 'Guest', title: 'My bookings', src: 'pages/g-bookings.html', desc: 'Upcoming and past bookings in one place.',
      parts: ['Upcoming / Past pills', 'Booking cards (photo, host, date)', 'Leave a review prompt on past', 'Cancelled bookings under Past'] },
    'g-booking': { group: 'Guest', title: 'Booking details', src: 'pages/g-booking.html', desc: 'One upcoming booking: date, guests, host (Message, Call), meeting point with directions, what to bring, receipt, and Cancel set apart at the bottom.',
      parts: ['In N days + booking ref', 'Date, time, guests', 'Host: Message, Call', 'Meeting point + directions', 'Bring', 'Receipt + Download', 'Cancellation · Cancel booking (danger, set apart)', 'Report a problem'] },
    'g-cancel': { group: 'Guest', title: 'Cancel booking', src: 'pages/g-cancel.html', desc: 'Shows exactly what the guest gets back before they confirm, based on the listing policy and time left.',
      parts: ['You get back + booking', 'Policy bar with "you are here"', 'Refund breakdown', 'Reason (optional)', 'Keep booking / Confirm cancellation', 'Cancelled + refund status'] },
    'g-inbox': { group: 'Guest', title: 'Inbox', src: 'pages/g-inbox.html', desc: 'All conversations with hosts, before and after booking.',
      parts: ['One thread list, newest first', 'Unread dot', 'Status line: trip date, past trip or enquiry'] },
    'g-chat': { group: 'Guest', title: 'Chat with host', src: 'pages/g-chat.html', desc: 'A chat tied to a booking or an enquiry: booking strip docked under the header, messages, one quick reply, safety line.',
      parts: ['Header: host, reply time, ⋯ report / block', 'Booking strip docked under the header', 'Messages + Booking confirmed line', 'Safety line: keep payments on Lokali', 'Quick reply: Running late', 'Composer: photo + send'] },
    'g-review': { group: 'Guest', title: 'Write a review', src: 'pages/g-review.html', desc: 'After the experience: star rating, written review and optional photos.',
      parts: ['Experience + host', 'Star rating', 'Written review', 'Add photos (optional)', 'Public note: host can reply', 'Post review + posted state'] },
    'g-corporate': { group: 'Guest', title: 'Corporate enquiry', src: 'pages/g-corporate.html', desc: 'For companies booking team-building or CSR: an enquiry form; Lokali replies with a quote offline.',
      parts: ['Why book with Lokali for teams', 'Company + contact', 'Group size, preferred dates, budget', 'Interests', 'Preferred area, experience, anything else (suggestion, Q17)', 'Send enquiry + sent state'] },
    'g-account': { group: 'Guest', title: 'Account', src: 'pages/g-account.html', desc: 'Her profile in the Host profile style: trip photo, round photo, Edit profile, trips / reviews / given back, Become a host (highlighted), settings, help, and Delete account set apart (PDPA).',
      parts: ['Trip photo + round profile photo', 'Edit profile', 'Trips taken, review written, given back', 'Become a host (highlighted); when approved: Switch to hosting', 'Settings', 'Help', 'Download data, Sign out', 'Delete account (danger, set apart)'] },

    /* ---------- Host ---------- */
    'h-intro': { group: 'Become a host', title: 'Intro', src: 'pages/h-intro.html', desc: "Aina, a guest, starts becoming a host: what the 4 sign-up steps are, how Lokali is paid, one Start button.",
      parts: ["Photo of kuih", "4 steps (name, mobile and email come from her account)", "15% commission, paid ~24 h after each experience", "Start application → step 1", "Close → Account"] },
    'h-signup': { group: 'Become a host', title: 'Sign-up', src: 'pages/h-signup.html', desc: "Self-serve sign-up in 4 short steps. Aina's name, mobile and email are filled in from her guest account (Q13).",
      parts: ["Step 1 About you: photo, name, mobile, email, story", "Step 2 Your business: type, name, SSM, where she'll host, first experience idea", "Step 3 Documents: SSM, food handling certificate, IC, insurance (optional)", "Step 4 Check and submit, with Edit on each part", "Save and exit → Account"] },
    'h-status': { group: 'Become a host', title: 'Application status', src: 'pages/h-status.html', desc: "Aina's host application after submitting: in review, changes requested with the Lokali team's note, approved.",
      parts: ["Prototype chips to switch the state", "Changes requested: note from Nurul, Fix and resubmit → Documents step", "Timeline: submitted 16 Nov, approved 20 Nov", "Approved: Switch to hosting → Listings"] },
    'h-home': { group: 'Host', title: 'Today', src: 'pages/h-home.html', desc: "Aina's host home (tab root): her next class, things to do and the next payout.",
      parts: ["Hosting · date line + Switch to guest", "Next class: Sat 5 Dec, 6 of 8 guests, 1 peanut allergy → guest list", "To do: new booking from Hafiz Ismail · reply to Daniel's review", "Next payout: RM 408.00 on Sun 6 Dec to CIMB •• 3307"] },
    'h-calendar': { group: 'Host', title: 'Calendar', src: 'pages/h-calendar.html', desc: "Month view of the class slots: recurring Saturdays, one-off slots, blocked dates, capacity per slot; full slots close.",
      parts: ["Every Saturday 9:00 AM · 8 guests per class", "Dots: open, booked, full (closed); struck-out = blocked (Sat 26 Dec)", "One-off slot Sun 20 Dec", "Chosen day: slot with places left → guest list; Block this date", "Add slot"] },
    'h-slot': { group: 'Host', title: 'Add time slots', src: 'pages/h-slot.html', desc: "Add a weekly or one-date slot with a capacity; it closes to new bookings when full. Save returns to Calendar with the new slots.",
      parts: ["Repeats weekly / One date", "Days, From–Until dates, start time (end time from the listing)", "Guests per slot 2–8", "Summary of the slots it will add", "Save slots → Calendar"] },
    'h-bookings': { group: 'Host', title: 'Bookings', src: 'pages/h-bookings.html', desc: "All bookings, grouped by class: upcoming and past. Cancelled bookings stay under their class.",
      parts: ["Upcoming / Past pills", "Sat 5 Dec: 3 bookings (6 of 8) + 1 cancelled (opens its email)", "Sat 12 Dec: no bookings yet", "Past: Sat 28 Nov (7 guests) and Sat 21 Nov (4 guests) with payouts"] },
    'h-email': { group: 'Host', title: 'Email: new booking / cancelled', src: 'pages/h-email.html', desc: "The emails Aina gets for every new booking and every cancellation (Must). Opens from Bookings.",
      parts: ["New booking: Hafiz Ismail, LK-24861, 1 adult, vegetarian, payout RM 72.25", "Cancellation: Lim Wei Jie, LK-24855, Flexible policy, RM 178.50 refunded, 2 places reopened"] },
    'h-booking': { group: 'Host', title: 'Booking & guest list', src: 'pages/h-booking.html', desc: "The Sat 5 Dec class: guest list with names, group size and dietary notes (H11), what Aina earns, and cancelling the class.",
      parts: ["6 of 8 places · 5 adults, 1 child · closes at 8", "Guests: Nur Aisyah Kamal (peanut allergy), Priya Nair, Hafiz Ismail (new, vegetarian), each with Message", "You earn: RM 480.00 − 15% = RM 408.00 on Sun 6 Dec", "Cancel class (set apart, full refunds)"] },
    'h-inbox': { group: 'Host', title: 'Inbox', src: 'pages/h-inbox.html', desc: "Messages with guests, newest first. Each thread says what it is about: the booking (date and group) or an enquiry.",
      parts: ["4 threads: Nur Aisyah (peanut allergy, unread), Hafiz, Priya, Farah (enquiry)", "Plain status line per thread, no filters", "Link to her guest-mode messages"] },
    'h-chat': { group: 'Host', title: 'Chat with guest', src: 'pages/h-chat.html', desc: "Chat with Nur Aisyah Kamal about her son's peanut allergy before the Sat 5 Dec class, from the host side.",
      parts: ["Guest header with call", "Booking strip docked under it: Sat, 5 Dec · 9:00 AM · LK-24852", "Booking confirmed line and the allergy question", "Saved replies: No peanuts, Directions, What to bring"] },
    'h-reviews': { group: 'Host', title: 'Reviews', src: 'pages/h-reviews.html', desc: "Reviews of the forest-edge farm morning, with public replies. Daniel's still needs one.",
      parts: ["5.0 · 3 reviews", "Daniel Wong first, with Reply", "Chloe and Suresh with her replies", "Reply sheet: replies are public on the listing"] },
    'h-listings': { group: 'Host', title: 'My listings', src: 'pages/h-listings.html', desc: "Aina's listings: her live kuih class and one draft.",
      parts: ["Live: Forest-edge farm walk & kuih morning (★ 5.0, RM 85, next Sat 5 Dec 6 of 8) → builder", "Preview as guest → guest listing in preview", "Draft: Pandan dye workshop, 6 of 11 required", "New listing"] },
    'h-builder': { group: 'Host', title: 'Listing builder', src: 'pages/h-builder.html', desc: "The guided listing builder: 14 sections in the order guests see them, each done / required / optional. Live listings open here to edit; drafts show progress, Save draft and Submit for review.",
      parts: ["Live view: Preview as guest, edits go back to review", "14 sections with what's done or missing", "Draft: progress line, required checks block Submit", "Meet your guide and Price and policy open their steps"] },
    'h-step-guide': { group: 'Host', title: 'Builder: Meet your guide', src: 'pages/h-step-guide.html', desc: "Builder section 6: personal prompts so a host never faces a blank page, shown with Aina's answers.",
      parts: ["Photo, name guests see, hometown", "4 prompts, answer 3+, 60 words each", "An example on the empty prompt", "Optional intro video", "Save → builder"] },
    'h-step-price': { group: 'Host', title: 'Builder: Price & policy', src: 'pages/h-step-price.html', desc: "Builder section 13: adult, child and private prices, group size and one cancellation policy (Aina: Flexible).",
      parts: ["RM 85 adult, with what she earns after 15%", "Child RM 55, private RM 480 (switches)", "Group size 2–8", "Flexible / Moderate / Firm, Flexible chosen", "Save → builder"] },
    'h-earnings': { group: 'Host', title: 'Earnings', src: 'pages/h-earnings.html', desc: "Next payout with the 15% commission taken off, paid history and the payout account. Payouts arrive about 24 hours after each class.",
      parts: ["Next payout RM 408: RM 480 minus RM 72, Sun 6 Dec", "Paid: RM 769.25 in November (29 Nov RM 480.25, 22 Nov RM 289)", "Breakdown sheet per payout", "Paid to CIMB •• 3307"] },
    'h-bank': { group: 'Host', title: 'Bank details', src: 'pages/h-bank.html', desc: "The Malaysian bank account payouts go to, and how to change it.",
      parts: ["CIMB •• 3307, verified Fri 20 Nov", "Bank, holder name, account number", "Payouts pause until a new account is verified"] },
    'h-menu': { group: 'Host', title: 'Menu', src: 'pages/h-menu.html', desc: "Aina's host profile and everything else for hosting: money, bookings, reviews, help, switch to guest.",
      parts: ["Her photo with the verified tick; 5.0 · 11 guests · 42 trees planted", "Money: Earnings, Bank details", "Hosting: Bookings, Reviews, Host profile", "Help", "Switch to guest, Sign out"] },

    /* ---------- Admin portal (desktop) ---------- */
    'a-login': { group: 'Admin', title: 'Admin sign in', src: 'pages/a-login.html', device: 'desktop', desc: 'Staff sign-in; access depends on role.', parts: ['Email + password', 'Forgot password', 'Brand panel'] },
    'a-dashboard': { group: 'Admin', title: 'Dashboard', src: 'pages/a-dashboard.html', device: 'desktop', desc: 'The day at a glance: bookings, revenue, commission, and the queues that need staff.',
      parts: ['KPI cards', 'Bookings & revenue trend', 'Needs attention (approvals, refunds, reports, enquiries)', 'Upcoming payouts', 'Top listings'] },
    'a-approvals': { group: 'Admin', title: 'Approvals', src: 'pages/a-approvals.html', device: 'desktop', desc: 'Host applications and listings waiting for review before they go live.',
      parts: ['Hosts / Listings tabs', 'Queue with waiting time', 'Open to review'] },
    'a-review': { group: 'Admin', title: 'Review a listing', src: 'pages/a-review.html', device: 'desktop', desc: 'Check a submitted listing section by section, then approve, request changes with a note, or reject.',
      parts: ['Listing preview (guest view)', 'Section checklist', 'Notes to host', 'Approve / Request changes / Reject'] },
    'a-bookings': { group: 'Admin', title: 'Bookings', src: 'pages/a-bookings.html', device: 'desktop', desc: 'Search and filter every booking.', parts: ['Search + filters', 'Bookings table', 'Status chips', 'Export'] },
    'a-booking': { group: 'Admin', title: 'Booking detail & refund', src: 'pages/a-booking.html', device: 'desktop', desc: 'One booking end to end: payment, policy, timeline; cancel on behalf or issue a manual refund.',
      parts: ['Booking + guest + host', 'Payment breakdown (fee, commission, payout)', 'Timeline', 'Manual refund modal', 'Hold payout'] },
    'a-hosts': { group: 'Admin', title: 'Hosts', src: 'pages/a-hosts.html', device: 'desktop', desc: 'All hosts, self-serve and assisted, with status.', parts: ['Hosts table', 'Onboarding type', 'Create host (assisted)'] },
    'a-host': { group: 'Admin', title: 'Host profile (assisted)', src: 'pages/a-host.html', device: 'desktop', desc: 'Create or edit a host on their behalf, see their listings, payouts and documents.',
      parts: ['Profile + business', 'Documents', 'Listings', 'Commission override', 'Create listing for host'] },
    'a-listings': { group: 'Admin', title: 'Listings', src: 'pages/a-listings.html', device: 'desktop', desc: 'All listings with state, policy and performance.', parts: ['Listings table', 'Feature on homepage', 'Change policy'] },
    'a-listing': { group: 'Admin', title: 'Edit listing (on behalf)', src: 'pages/a-listing.html', device: 'desktop', desc: 'Staff edit any listing section for a host, reorder optional sections and change the cancellation policy.',
      parts: ['Section list (drag optional ones)', 'Section editor', 'Policy override', 'Commission override', 'Save / Publish'] },
    'a-payouts': { group: 'Admin', title: 'Payouts', src: 'pages/a-payouts.html', device: 'desktop', desc: 'Host payouts: scheduled ~24 h after each experience, paid, on hold.',
      parts: ['Scheduled / Paid / On hold', 'Payout table', 'Commission earned', 'Hold / release'] },
    'a-moderation': { group: 'Admin', title: 'Moderation & disputes', src: 'pages/a-moderation.html', device: 'desktop', desc: 'Reported reviews and messages, and guest disputes.',
      parts: ['Reviews / Messages / Disputes', 'Report reason', 'Keep / Hide / Remove', 'Resolve dispute with refund'] },
    'a-enquiries': { group: 'Admin', title: 'Corporate enquiries', src: 'pages/a-enquiries.html', device: 'desktop', desc: 'Enquiries from the corporate form, tracked until a quote is sent offline.',
      parts: ['Enquiries table', 'Status: New / Contacted / Quoted / Won / Lost', 'Detail drawer'] },
    'a-content': { group: 'Admin', title: 'Content', src: 'pages/a-content.html', device: 'desktop', desc: 'Change the site without a developer: categories, featured listings, homepage, FAQs and listing fields.',
      parts: ['Categories (add, rename, reorder)', 'Featured listings', 'Homepage hero', 'FAQs', 'Listing fields'] },
    'a-reports': { group: 'Admin', title: 'Reports', src: 'pages/a-reports.html', device: 'desktop', desc: 'Bookings, revenue, commission and top listings for a date range, downloadable as a spreadsheet.',
      parts: ['Date range', 'Report cards', 'Charts', 'Top listings', 'Download .xlsx / .csv'] },
    'a-fees': { group: 'Admin', title: 'Fees & policies', src: 'pages/a-fees.html', device: 'desktop', desc: 'Commission from hosts, service fee for guests (with a live example), and the six cancellation policy rules.',
      parts: ['Host commission %', 'Guest service fee %', 'Live price example', 'Day experience policies', 'Multi-day retreat policies', 'Default per type'] },
    'a-team': { group: 'Admin', title: 'Team & roles', src: 'pages/a-team.html', device: 'desktop', desc: 'Staff accounts and what each role can do.',
      parts: ['Staff table', 'Roles: Super admin, Operations, Finance, Content', 'Permission matrix', 'Invite staff'] }
  },
  tree: [
    { label: 'Guest · Discover', children: ['g-home', 'g-search', 'g-results', 'g-listing', 'g-host', 'g-reviews'] },
    { label: 'Guest · Book & pay', children: ['g-book', 'g-signin', 'g-checkout', 'g-confirmed', 'g-email'] },
    { label: 'Guest · After booking', children: ['g-bookings', 'g-booking', 'g-cancel', 'g-inbox', 'g-chat', 'g-review', 'g-corporate', 'g-account'] },
    { label: 'Become a host', children: ['h-intro', 'h-signup', 'h-status'] },
    { label: 'Host · Run', children: ['h-home', 'h-calendar', 'h-slot', 'h-bookings', 'h-email', 'h-booking', 'h-inbox', 'h-chat', 'h-reviews'] },
    { label: 'Host · Listings', children: ['h-listings', 'h-builder', 'h-step-guide', 'h-step-price'] },
    { label: 'Host · Money', children: ['h-earnings', 'h-bank', 'h-menu'] },
    { label: 'Admin portal', device: 'desktop', children: ['a-login', 'a-dashboard', 'a-approvals', 'a-review', 'a-bookings', 'a-booking', 'a-hosts', 'a-host', 'a-listings', 'a-listing', 'a-payouts', 'a-moderation', 'a-enquiries', 'a-content', 'a-reports', 'a-fees', 'a-team'] }
  ]
};

/* Cache busting (27 Nov): every page opens as page.html?v=<version>, so a new deploy shows at once on GitHub Pages (it caches files for 10 minutes) */
(function (S) { if (!S || !S.version) return; for (var k in S.pages) { var u = S.pages[k].src; if (u.indexOf('v=') < 0) S.pages[k].src = u + (u.indexOf('?') > -1 ? '&' : '?') + 'v=' + S.version; } })(window.SHELL);
