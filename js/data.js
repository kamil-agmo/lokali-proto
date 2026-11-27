/* Lokali sample data — one source so the same listing, host, booking and amount look identical on guest, host and admin screens.
   Fees (configurable in admin › Fees & policies): guest service fee 5%, host commission 15%. Currency MYR. Today in the prototype: Wed 2 Dec 2026. */
(function () {
  var L = window.L = window.L || {};
  L.fees = { service: 0.05, commission: 0.15 };
  L.cats = [
    { key: 'nature', name: 'Nature & eco-tours', icon: 'ph-tree-evergreen', count: 42 },
    { key: 'culture', name: 'Culture, craft & heritage', icon: 'ph-palette', count: 31 },
    { key: 'farm', name: 'Farm & food', icon: 'ph-plant', count: 24 },
    { key: 'retreat', name: 'Retreats & stays', icon: 'ph-tent', count: 9 }   // 4th category assumed (brief says four, lists three) — REQUIREMENTS Q1
  ];
  /* Featured this month: set in Admin › Content › Featured listings; Home shows them in this order */
  L.featured = ['mangrove', 'reef', 'orangutan', 'nyonya', 'batik'];
  L.people = {
    // hosts
    rahim:  { name: 'Pak Rahim Osman', first: 'Rahim', img: '1763219069500-e4c9b49f308f', home: 'Kampung Kuantan, Kuala Selangor', since: 2025, lang: 'English, Malay' },
    siti:   { name: 'Siti Aminah Yusof', first: 'Siti', img: '1586682643135-060f061868b6', home: 'Marang, Terengganu', since: 2025, lang: 'English, Malay' },
    kumar:  { name: 'Kumar Selvaraj', first: 'Kumar', img: '1531339413195-cc6c17163974', home: 'Air Itam, Penang', since: 2024, lang: 'English, Malay, Tamil' },
    meiling:{ name: 'Lim Mei Ling', first: 'Mei Ling', img: '1758600587815-b654d1405e83', home: 'Sekinchan, Selangor', since: 2025, lang: 'English, Mandarin, Malay' },
    jenny:  { name: 'Jenny Tan', first: 'Jenny', img: '1773899337978-b8d83bd9b783', home: 'Balik Pulau, Penang', since: 2025, lang: 'English, Hokkien' },
    jaineh: { name: 'Jaineh Mosiun', first: 'Jaineh', img: '1731375817631-dff8d5db12fc', home: 'Bilit, Kinabatangan, Sabah', since: 2025, lang: 'English, Malay, Kadazan' },
    vinod:  { name: 'Vinod Raj', first: 'Vinod', img: '1638368349569-e49499196d9f', home: 'Kampung Juara, Pulau Tioman', since: 2025, lang: 'English, Malay, Tamil' },
    rusli:  { name: 'Bah Rusli', first: 'Rusli', img: '1776612977754-42c61550a89f', home: 'Pulau Banding, Royal Belum', since: 2025, lang: 'Malay, Temiar' },
    // guests
    aina:   { name: 'Aina Rahman', first: 'Aina', img: '1545266241-3516e2a6e016', home: 'Petaling Jaya', hosts: 'Kampung Sungai Lui, Hulu Langat', since: 2026, lang: 'English, Malay' },   // guest (lives in PJ); since 20 Nov 2026 also hosts on her grandmother's farm (host mode)
    daniel: { name: 'Daniel Wong', first: 'Daniel', img: '1701980889802-55ff39e2e973', home: 'Ipoh' },
    aisyah: { name: 'Nur Aisyah Kamal', first: 'Aisyah', img: '1613447895817-e617a4093f50', home: 'Shah Alam' }
  };
  L.exp = {
    mangrove: { id: 'mangrove', title: 'Mangrove & fireflies by kampung boat', promise: 'Paddle the Selangor River at dusk and watch the mangroves light up.', cat: 'nature', place: 'Kuala Selangor, Selangor',
      img: '1773904594755-6c25ab2ef6c9', gallery: ['1773904594755-6c25ab2ef6c9', '1779399642977-7c6bfd7bc472', '1589556183130-530470785fab', '1784751449882-c2c28ca2dd78', '1646513378626-23493fccf7c9', '1786717667687-2f05e422d6f9'],
      price: 145, child: 95, priv: 980, rating: 4.96, reviews: 128, duration: '3.5 hours', group: '2–10', host: 'rahim', policy: 'Moderate', type: 'day', impact: '20% of each ticket plants mangroves', lang: 'English, Malay' },
    batik: { id: 'batik', title: 'Natural-dye batik in a kampung', promise: 'Dye cloth with leaves and bark from the village, then wax your own piece with Kak Siti.', cat: 'culture', place: 'Marang, Terengganu',
      img: '1762111908768-f49f42610859', gallery: ['1762111908768-f49f42610859', '1695306441929-0082158cfc27', '1761516659766-c092d4b1209d', '1604973104381-870c92f10343', '1743210343060-97602cbcc04d'],
      price: 120, child: 80, priv: 720, rating: 4.92, reviews: 86, duration: '3 hours', group: '1–8', host: 'siti', policy: 'Flexible', type: 'day', impact: 'Plant dyes only, nothing toxic in the river' },
    canopy: { id: 'canopy', title: 'Rainforest canopy walk & hornbill watch', promise: 'Walk a 130-million-year-old forest with a naturalist at first light.', cat: 'nature', place: 'Penang Hill, Penang',
      img: '1786530876393-8ad44d32e2de', gallery: ['1786530876393-8ad44d32e2de', '1657463420259-1c92c609f89e', '1592080231635-58456a85c693', '1698802933641-b185747ae391', '1760044604355-458eef15ac64'],
      price: 180, child: 120, priv: 1150, rating: 4.89, reviews: 214, duration: '4 hours', group: '2–12', host: 'kumar', policy: 'Moderate', type: 'day', impact: '15% of each ticket aids research' },
    paddy: { id: 'paddy', title: 'Paddy-to-plate farm day', promise: 'Plant rice knee-deep in the field, then eat what the farm grows.', cat: 'farm', place: 'Sekinchan, Selangor',
      img: '1595974482597-4b8da8879bc5', gallery: ['1595974482597-4b8da8879bc5', '1505471768190-275e2ad7b3f9', '1530507629858-e4977d30e9e0', '1633410195091-bd66114cef5f', '1528693404014-b13ebe6e723e'],
      price: 160, child: 90, priv: 950, rating: 4.85, reviews: 63, duration: '5 hours', group: '2–15', host: 'meiling', policy: 'Moderate', type: 'day', impact: 'Supports 6 local family farms' },
    nyonya: { id: 'nyonya', title: 'Wild herb walk & Nyonya farm lunch', promise: 'Walk a nutmeg and durian orchard, pick wild herbs, then cook a Nyonya lunch from them.', cat: 'farm', place: 'Balik Pulau, Penang',
      img: '1722995690313-9ef561d30143', gallery: ['1722995690313-9ef561d30143', '1679541946014-a47f1ec0dc1a', '1778439800378-6f67fd8ec219', '1789475387509-8e62ba3beb09', '1658218615053-955e8af55947'],
      price: 210, child: 140, priv: 1300, rating: 4.97, reviews: 152, duration: '4 hours', group: '2–8', host: 'jenny', policy: 'Firm', type: 'day', impact: 'Kitchen scraps compost back into the orchard' },
    reef: { id: 'reef', title: 'Reef restoration snorkel', promise: 'Help plant coral fragments on a living reef nursery.', cat: 'nature', place: 'Pulau Tioman, Pahang',
      img: '1708649290066-5f617003b93f', gallery: ['1708649290066-5f617003b93f', '1637308109237-4ea1a7dd22f5', '1682686581663-179efad3cd2f', '1651871756929-09d7bde4e97d', '1637308107080-82cf40953742'],
      price: 260, child: 180, priv: 1600, rating: 4.9, reviews: 97, duration: '5 hours', group: '2–8', host: 'vinod', policy: 'Moderate', type: 'day', impact: '25% of each ticket regrows the reef' },
    orangutan: { id: 'orangutan', title: 'Orangutan & river safari, Kinabatangan', promise: 'Look for wild orangutans and pygmy elephants from a quiet electric boat.', cat: 'nature', place: 'Kinabatangan, Sabah',
      img: '1690668107430-6529392858b0', gallery: ['1690668107430-6529392858b0', '1705332441014-4315b1bd7deb', '1495434350527-8f3d63bf008f', '1727079183356-9a24f87a3f70', '1646513378626-23493fccf7c9'],
      price: 320, child: 220, priv: 2100, rating: 4.98, reviews: 71, duration: '6 hours', group: '2–6', host: 'jaineh', policy: 'Moderate', type: 'day', impact: 'Pays the wages of 2 village rangers' },
    weaving: { id: 'weaving', title: 'Mengkuang weaving & kampung lunch', promise: 'Weave a pandan-leaf mat and share lunch in a village home.', cat: 'culture', place: 'Marang, Terengganu',
      img: '1534953342533-7711c98712be', gallery: ['1534953342533-7711c98712be', '1598967350872-db48a9d86a2c', '1599303000936-1cf21eac4456', '1591015744878-793b76c1163e', '1569909115134-a0426936c879'],
      price: 95, child: 60, priv: 560, rating: 4.88, reviews: 44, duration: '3 hours', group: '1–10', host: 'siti', policy: 'Flexible', type: 'day', impact: 'All craft sales go to the weavers' },
    retreat: { id: 'retreat', title: '3-day rainforest retreat, Belum', promise: 'Two nights deep in one of the oldest rainforests on earth.', cat: 'retreat', place: 'Royal Belum, Perak',
      img: '1581253563647-3ebad3c2f559', gallery: ['1581253563647-3ebad3c2f559', '1721151599824-ca38a4b73292', '1495434350527-8f3d63bf008f', '1698802933641-b185747ae391', '1592080231635-58456a85c693'],
      price: 1450, child: 980, priv: 9800, rating: 4.95, reviews: 28, duration: '3 days', group: '4–12', host: 'rusli', policy: 'Firm', type: 'retreat', deposit: 0.3, impact: 'Pays local Orang Asli guides' }
  };
  /* Aina's own listing (host mode, 27 Nov): she books Pak Rahim's mangrove trip as a guest and hosts this class as a host.
     Photos reuse food / farm photo IDs already in this file (swap for kuih photos when browsing for photos). */
  L.exp.kuih = { id: 'kuih', title: 'Forest-edge farm walk & kuih morning', promise: 'Walk the forest edge of a kampung farm, pick pandan and banana leaves, then steam kuih from the harvest.', cat: 'farm', place: 'Hulu Langat, Selangor',
    img: '1505471768190-275e2ad7b3f9', gallery: ['1505471768190-275e2ad7b3f9', '1530507629858-e4977d30e9e0', '1658218615053-955e8af55947', '1778439800378-6f67fd8ec219', '1679541946014-a47f1ec0dc1a'],
    price: 85, child: 55, priv: 480, rating: 5.0, reviews: 3, duration: '2.5 hours', group: '2–8', host: 'aina', policy: 'Flexible', type: 'day', impact: '10% plants native trees on the forest edge', lang: 'English, Malay', when: 'Saturdays 9:00 AM' };
  /* Aina as a host: approved Fri 20 Nov 2026; classes Sat 21 Nov (4 guests) and Sat 28 Nov (7 guests); next Sat 5 Dec 9:00–11:30 AM.
     Money: 15% commission; payout ~24 h after each class. */
  L.hosting = {
    host: 'aina', exp: 'kuih', approved: 'Fri, 20 Nov 2026', place: 'Kebun Nenek, Kampung Sungai Lui, 43100 Hulu Langat',
    next: { ref: 'LK-24852', date: 'Sat, 5 Dec', time: '9:00 – 11:30 AM', guests: 6, cap: 8, allergy: '1 peanut allergy', gross: 480, commission: 72, payout: 408, payoutDate: 'Sun, 6 Dec' },
    guests: [ // Sat 5 Dec
      { name: 'Nur Aisyah Kamal', who: 'aisyah', ref: 'LK-24852', adults: 2, children: 1, note: 'Son is allergic to peanuts', paid: 225, booked: 'Tue, 1 Dec' },
      { name: 'Priya Nair', ref: 'LK-24858', adults: 2, children: 0, note: '', paid: 170, booked: 'Tue, 1 Dec' },
      { name: 'Hafiz Ismail', ref: 'LK-24861', adults: 1, children: 0, note: 'Vegetarian', paid: 85, booked: 'Wed, 2 Dec' } ],
    past: [ { date: 'Sat, 28 Nov', guests: 7, gross: 565, payout: 480.25, paid: 'Sun, 29 Nov' }, { date: 'Sat, 21 Nov', guests: 4, gross: 340, payout: 289, paid: 'Sun, 22 Nov' } ],
    reviews: [ { name: 'Daniel Wong', who: 'daniel', date: 'Nov 2026', stars: 5, text: 'Walking the forest edge, picking pandan, then eating kuih we steamed ourselves. My kids loved it.', reply: '' },
      { name: 'Chloe Lim', date: 'Nov 2026', stars: 5, text: 'Aina explains every step and sends you home with a recipe card. Lovely morning.', reply: 'Thank you, Chloe! See you at the next harvest.' },
      { name: 'Suresh Kumar', date: 'Nov 2026', stars: 5, text: 'Good to know part of it plants trees on the forest edge. Small group, very relaxed.', reply: 'Thanks Suresh, 42 trees so far!' } ],
    bank: 'CIMB •• 3307', paidNov: 769.25, treesPlanted: 42 };

  // The booking that runs through the whole prototype (guest books it, host sees it, admin manages it)
  L.booking = { ref: 'LK-24817', exp: 'mangrove', guest: 'aina', date: 'Sun, 6 Dec 2026', time: '5:00 PM – 8:30 PM', adults: 2, children: 1,
    subtotal: 385, fee: 19.25, total: 404.25, commission: 57.75, payout: 327.25, method: 'Visa •• 4242', status: 'Confirmed',
    meet: 'Jeti Kampung Kuantan, Jalan Kuantan, 45000 Kuala Selangor', dietary: '1 vegetarian' };
  L.policies = {
    day: {
      Flexible: { full: '24 hours or more before start', partial: null, none: 'Under 24 hours' },
      Moderate: { full: '72 hours or more before start', partial: null, none: 'Under 72 hours', default: true },
      Firm:     { full: '12 days or more before start', partial: '50% from 5 to under 12 days', none: 'Under 5 days' }
    },
    retreat: {
      Flexible: { full: '7 days or more before start', partial: null, none: 'Under 7 days' },
      Moderate: { full: '30 days or more before start', partial: '50% at 14–29 days', none: 'Under 14 days' },
      Firm:     { full: '60 days or more before start', partial: '50% at 30–59 days', none: 'Under 30 days', default: true }
    }
  };
  L.stamps = { mangrove: ['20%', 'to trees'], batik: ['0', 'toxic dye'], canopy: ['15%', 'research'], paddy: ['6', 'farms'], nyonya: ['100%', 'composted'],
    reef: ['25%', 'to reef'], orangutan: ['2', 'rangers'], weaving: ['100%', 'weavers'], retreat: ['10%', 'guides'], kuih: ['42', 'trees'] };
  /* heart on cards: toggles red and shows a toast, without opening the card */
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('.exp-card__fav'); if (!b) return;
    ev.preventDefault(); ev.stopPropagation();
    var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on);
    b.querySelector('i').className = (on ? 'ph-fill' : 'ph') + ' ph-heart';
    L.toast && L.toast(on ? 'Saved to your likes' : 'Removed from your likes', on ? 'ph-heart' : 'ph-heart-break');
  }, true);
  L.cardHTML = function (key, opts) {
    var e = L.exp[key], o = opts || {}, st = L.stamps[key] || ['', ''];
    var c = L.cats.filter(function (x) { return x.key === e.cat; })[0];
    var hp = L.people && L.people[e.host], hn = hp ? (/^(Pak|Mak|Kak|Abang|Cik|Bah)\s/.test(hp.name) ? hp.name.split(' ').slice(0, 2).join(' ') : hp.first) : '';
    var catName = { nature: 'Nature', culture: 'Culture', farm: 'Food & farm', retreat: 'Retreat' }[e.cat] || '';
    return '<a class="exp-card' + (o.full ? ' full' : '') + '" href="g-listing.html" data-go="g-listing" onclick="L.state.set(\'exp\', \'' + key + '\')">' +
      '<div class="exp-card__img"><img src="' + L.img(e.img, o.full ? 900 : 600) + '" alt="" loading="lazy">' +
      '<span class="exp-card__rate ' + (e.rating >= 4.5 ? 'r-hi' : e.rating >= 3.5 ? 'r-mid' : 'r-lo') + '" aria-label="Rated ' + e.rating.toFixed(2) + '"><i class="ph-fill ph-star" aria-hidden="true"></i>' + e.rating.toFixed(2) + '</span>' +
      '<button type="button" class="exp-card__fav" aria-pressed="false" aria-label="Save ' + e.title + '"><i class="ph ph-heart" aria-hidden="true"></i></button>' +
      '<div class="exp-card__over">' +
        (o.badge !== false ? '<span class="exp-card__give"><i class="ph-fill ph-leaf" aria-hidden="true"></i>' + e.impact + '</span>' : '') +
        (c ? '<span class="exp-card__tag"><i class="ph ' + c.icon + '" aria-hidden="true"></i>' + c.name + '</span>' : '') +
      '</div>' + (hp ? '<img class="exp-card__host" src="' + L.img(hp.img, 96) + '" alt=""><span class="exp-card__verified" role="img" aria-label="Verified host"><i class="ph-fill ph-seal-check" aria-hidden="true"></i></span>' : '') + '</div>' +
      '<div class="exp-card__body">' +
      (hp ? '<div class="exp-card__with">with ' + hn + ' · ' + e.place.split(',')[0] + '</div>' : '') +
      '<div class="exp-card__title">' + e.title + '</div>' +
      '<div class="exp-card__facts"><span><i class="ph-fill ph-map-pin" aria-hidden="true"></i>' + e.place.split(',')[0] + '</span><span><i class="ph-fill ph-clock" aria-hidden="true"></i>' + e.duration + '</span></div>' +
      (o.badge !== false ? '<span class="exp-card__impact"><i class="ph-fill ph-leaf" aria-hidden="true"></i>' + e.impact + '</span>' : '') +
      '<div class="exp-card__price"><span class="exp-card__score" aria-label="Rated ' + e.rating.toFixed(2) + '"><i class="ph-fill ph-star" aria-hidden="true"></i>' + e.rating.toFixed(2) + '</span><span class="exp-card__dot" aria-hidden="true">·</span>From <b>' + L.rm(e.price) + '</b> <small>/ adult</small></div>' +
      '</div></a>';
  };

  /* The booking flow (listing → book → sign in → checkout → confirmed) is written for Mangrove & fireflies.
     When another experience was opened, swap its title, host, place, prices, photos and group size into the page. */
  L.curExp = function () { var k = L.state.get('exp', 'mangrove'); return L.exp[k] ? k : 'mangrove'; };
  L.swapExp = function (root) {
    var k = L.curExp(); if (k === 'mangrove') return;
    var e = L.exp[k], m = L.exp.mangrove, h = L.people[e.host] || {}, mh = L.people.rahim;
    var hn = /^(Pak|Mak|Kak|Abang|Cik|Bah)\s/.test(h.name || '') ? h.name.split(' ').slice(0, 2).join(' ') : (h.first || h.name);
    var max = String(e.group || '').split(/[–-]/).pop() || '10';
    var P = [[m.title, e.title], ['Mangrove &amp; fireflies by kampung boat', e.title], ['Mangrove & fireflies', e.title], [mh.name, h.name], ['Pak Rahim', hn], ['Rahim', h.first],
      ['Kuala Selangor, Selangor', e.place], ['Kuala Selangor', e.place.split(',')[0]], ['Jeti Kampung Kuantan', e.place.split(',')[0]], ['RM 145', 'RM ' + e.price], ['RM 95', 'RM ' + e.child], ['RM 980', 'RM ' + e.priv.toLocaleString('en-MY')],
      ['3.5 hours', e.duration], ['2–10 guests', e.group + ' guests'], ['up to 10', 'up to ' + max], ['Book the whole boat', 'Book privately'], ['Whole boat', 'Private group'], ['whole boat', 'private group'], ['Private boat', 'Private group'], ['private boat', 'private group']];
    var w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) { var t = n.nodeValue, t0 = t; P.forEach(function (x) { if (t.indexOf(x[0]) > -1) t = t.split(x[0]).join(x[1]); }); if (t !== t0) n.nodeValue = t; }
    var ids = [m.img].concat(m.gallery, ['1589556183130-530470785fab']);
    (root || document).querySelectorAll('img').forEach(function (im) {
      var di = im.getAttribute('data-img'); if (di && ids.indexOf(di) > -1) { im.setAttribute('data-img', e.img); }
      if (im.src && ids.some(function (id) { return im.src.indexOf(id) > -1; })) im.src = L.img(e.img, 600);
      if (im.src && im.src.indexOf(mh.img) > -1) im.src = L.img(h.img, 120);
      if (di === mh.img) im.setAttribute('data-img', h.img);
    });
  };
})();
