/* Lokali spot illustrations: flat vector scenes drawn with colour tokens.
   Use: <div data-art="nightRiver"></div> (lokali.js injects on load) or L.art.nightRiver() in JS. Load after lokali.js. */
(function () {
  var L = window.L = window.L || {};
  function f(v) { return ' style="fill:var(' + v + ')"'; }
  function svg(vb, body, label) { return '<svg viewBox="' + vb + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + label + '" xmlns="http://www.w3.org/2000/svg">' + body + '</svg>'; }
  function flies(list) { return list.map(function (p) { return '<g class="firefly"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (p[2] * 3) + '" style="fill:var(--glow);opacity:.18"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '"' + f('--glow') + '/></g>'; }).join(''); }
  function palm(x, y, s) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M0 0 C2 -30 4 -60 2 -90" stroke-width="4" fill="none" style="stroke:var(--deep)"/><path d="M2 -90 C-20 -100 -40 -92 -52 -78 C-30 -86 -12 -86 2 -90 Z M2 -90 C24 -102 44 -96 56 -82 C34 -88 16 -88 2 -90 Z M2 -90 C-8 -112 -26 -122 -40 -122 C-22 -112 -10 -102 2 -90 Z M2 -90 C14 -114 32 -122 46 -120 C28 -110 14 -100 2 -90 Z"' + f('--deep') + '/></g>'; }
  function tree(x, y, s, v) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><rect x="-2" y="-14" width="4" height="16"' + f(v || '--deep') + '/><path d="M0 -60 C18 -52 22 -30 14 -16 C8 -12 -8 -12 -14 -16 C-22 -30 -18 -52 0 -60Z"' + f(v || '--deep') + '/></g>'; }

  L.art = {
    /* hero: mangrove river at dusk with fireflies */
    nightRiver: function () {
      return svg('0 0 400 300',
        '<rect width="400" height="300"' + f('--deep') + '/>' +
        '<g class="moon"><circle cx="196" cy="66" r="20"' + f('--glow') + ' opacity=".9"/><circle cx="206" cy="60" r="18"' + f('--deep') + '/></g>' +
        '<path d="M0 170 C60 130 110 150 160 138 C220 122 260 150 320 132 C360 120 390 130 400 128 V300 H0Z"' + f('--deep-2') + '/>' +
        '<path d="M0 200 C50 176 100 190 150 182 C210 172 250 196 310 184 C350 176 380 182 400 180 V300 H0Z"' + f('--primary') + ' opacity=".55"/>' +
        palm(40, 214, .9) + palm(352, 210, .8) + tree(90, 214, 1) + tree(110, 214, .7) + tree(300, 212, .9) + tree(322, 212, .6) +
        '<path d="M0 214 H400 V300 H0Z"' + f('--deep') + '/>' +
        '<g opacity=".35" style="stroke:var(--glow)" stroke-width="1.4"><path d="M120 236 H170"/><path d="M220 250 H290"/><path d="M60 262 H100"/><path d="M300 228 H330"/></g>' +
        '<path d="M170 246 C190 238 230 238 250 246 L244 252 H176Z"' + f('--accent') + '/><rect x="206" y="226" width="3" height="20"' + f('--accent') + '/>' +
        flies([[70, 120, 2.2], [130, 96, 1.6], [180, 150, 2], [240, 110, 1.8], [270, 160, 2.4], [210, 80, 1.4], [100, 170, 1.6], [350, 150, 2], [160, 120, 1.2], [300, 96, 1.6], [50, 160, 1.4], [380, 110, 1.6]]),
        'Mangrove river at dusk with fireflies');
    },
    /* category spots */
    nature: function () {
      return svg('0 0 200 140', '<rect width="200" height="140"' + f('--primary-tint') + '/><circle cx="150" cy="38" r="16"' + f('--accent') + '/>' +
        '<path d="M0 96 C40 70 80 84 120 74 C150 66 180 76 200 72 V140 H0Z"' + f('--olive') + ' opacity=".5"/><path d="M0 112 C50 92 110 108 200 96 V140 H0Z"' + f('--primary') + '/>' +
        tree(40, 112, .9, '--primary-strong') + tree(60, 112, .6, '--primary-strong') + tree(160, 104, .8, '--primary-strong') +
        '<path d="M96 54 l10 -4 l6 2 l-6 3 l4 6 l-8 -3 z"' + f('--deep') + '/>', 'Rainforest hills');
    },
    culture: function () {
      return svg('0 0 200 140', '<rect width="200" height="140"' + f('--accent-tint') + '/><rect x="38" y="20" width="124" height="6" rx="3"' + f('--deep') + '/>' +
        '<path d="M46 26 H154 V108 C130 118 70 118 46 108Z"' + f('--primary') + '/>' +
        '<g fill="none" style="stroke:var(--accent)" stroke-width="2"><path d="M100 38 L124 62 L100 86 L76 62Z"/><path d="M100 50 L112 62 L100 74 L88 62Z"/><path d="M58 40 l10 10 l-10 10 l-10 -10z"/><path d="M142 40 l10 10 l-10 10 l-10 -10z"/><path d="M58 80 l10 10 l-10 10 l-10 -10z"/><path d="M142 80 l10 10 l-10 10 l-10 -10z"/></g>' +
        '<circle cx="100" cy="62" r="3"' + f('--accent') + '/>', 'Batik cloth');
    },
    farm: function () {
      return svg('0 0 200 140', '<rect width="200" height="140"' + f('--accent-tint') + '/><circle cx="46" cy="38" r="18"' + f('--accent') + '/>' +
        '<path d="M0 70 C60 58 140 62 200 54 V140 H0Z"' + f('--olive') + ' opacity=".55"/><path d="M0 88 C60 76 140 82 200 72 V140 H0Z"' + f('--olive') + '/>' +
        '<path d="M0 106 C60 96 140 100 200 92 V140 H0Z"' + f('--primary') + '/><path d="M0 124 C60 116 140 120 200 112 V140 H0Z"' + f('--primary-strong') + '/>' +
        '<g style="stroke:var(--primary-tint)" stroke-width="1.5" opacity=".7"><path d="M20 98 v-6 M30 97 v-6 M40 96 v-6 M150 90 v-6 M160 89 v-6 M170 88 v-6"/></g>', 'Paddy terraces');
    },
    retreat: function () {
      return svg('0 0 200 140', '<rect width="200" height="140"' + f('--deep') + '/><circle cx="150" cy="36" r="14"' + f('--glow') + '/><circle cx="156" cy="32" r="12"' + f('--deep') + '/>' +
        '<path d="M0 104 C50 86 120 98 200 88 V140 H0Z"' + f('--deep-2') + '/>' + tree(30, 106, 1, '--primary') + tree(176, 100, .9, '--primary') +
        '<path d="M70 112 L100 60 L130 112Z"' + f('--accent') + '/><path d="M100 60 L108 112 H92Z"' + f('--deep') + ' opacity=".55"/>' +
        flies([[60, 60, 1.4], [90, 40, 1.2], [130, 70, 1.6], [40, 80, 1.2]]), 'Tent under the moon');
    },
    /* success / empty scenes */
    celebrate: function () {
      var leaves = [[40, 40, -30], [160, 36, 30], [24, 96, -60], [176, 92, 60], [100, 18, 0], [70, 120, -15], [132, 122, 15]];
      return svg('0 0 200 140', '<circle cx="100" cy="72" r="40"' + f('--primary-tint') + '/><circle cx="100" cy="72" r="26"' + f('--primary') + '/>' +
        '<path d="M88 72 l8 8 l16 -16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
        leaves.map(function (l, i) { return '<path transform="translate(' + l[0] + ' ' + l[1] + ') rotate(' + l[2] + ')" d="M0 -10 C7 -6 7 6 0 10 C-7 6 -7 -6 0 -10Z" style="fill:var(' + (i % 2 ? '--accent' : '--olive') + ')"/>'; }).join(''), 'Confirmed');
    },
    trail: function () {
      return svg('0 0 200 140', '<rect width="200" height="140"' + f('--sand') + '/><path d="M10 120 C60 120 50 70 100 70 S150 24 190 24" fill="none" style="stroke:var(--olive)" stroke-width="2.5" stroke-dasharray="6 6"/>' +
        '<circle cx="10" cy="120" r="6"' + f('--primary') + '/><path d="M190 8 C200 8 202 22 190 34 C178 22 180 8 190 8Z"' + f('--accent') + '/><circle cx="190" cy="18" r="3"' + f('--deep') + '/>', 'Trail to a destination');
    }
  };
})();
