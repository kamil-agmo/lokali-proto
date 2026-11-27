#!/usr/bin/env python3
"""Writes assets/manifest.json: every component, in plain words, with a live demo and a copy-paste snippet per style.
Run after changing a component: python3 manifest.py"""
import json, os

V = lambda s, cls: s.replace('{v}', cls)   # {v} = md | ios


def tab_items(v):
    on = ' is-on" aria-current="page'
    return ''.join('<a class="c-tab%s" href="#"><span class="c-ico">%s</span>%s</a>' % (on if i == 0 else '', ic, lb)
                   for i, (ic, lb) in enumerate([('home', 'Home'), ('search', 'Search'), ('favorite', 'Activity'), ('person', 'Profile')]))


FEED = '<div style="padding:16px;display:grid;gap:12px">' + ''.join('<div style="height:90px;border-radius:12px;background:var(--c-surface-2)"></div>' for _ in range(8)) + '</div>'

C = []
def add(id, group, name, what, when, files, md, ios, demo=None, extra=None):
    C.append({'id': id, 'group': group, 'name': name, 'what': what, 'when': when, 'files': files,
              'variants': {'md': md, 'ios': ios}, 'demo': demo or {}, 'extra': extra or {}})

add('tabbar', 'Navigation', 'Tab bar', 'The row of 3-5 main sections at the bottom of the screen.',
    'Use it when the app has a few top-level places people switch between all the time (Home, Search, Profile). In iOS 27, search goes back into the tab row as a tab.',
    {'css': ['tabbar.css'], 'js': ['tabbar.js']},
    {'label': 'Material 3 Expressive navigation bar', 'note': 'A 64 dp bar along the bottom; the active icon sits in a soft pill and fills in. Feels like current Android and Google apps.',
     'snippet': '<nav class="c-tabbar c-tabbar--md" aria-label="Main">' + tab_items('md') + '</nav>'},
    {'label': 'Apple tab bar (iOS 27)', 'note': 'A floating Liquid Glass capsule above the bottom edge; the chosen tab sits on a soft pill in your brand colour. Search can be one of the tabs, as in iOS 27.',
     'snippet': '<nav class="c-tabbar c-tabbar--ios" aria-label="Main">' + tab_items('ios') + '</nav>'},
    demo={'page': '<div style="flex:1"></div>{snippet}', 'layout': 'column'})

add('appbar', 'Navigation', 'App bar / navigation bar', 'The bar at the top with the screen title, a back button and a couple of actions.',
    'Use it on almost every screen that is not the very first one, so people know where they are and how to go back.',
    {'css': ['appbar.css'], 'js': ['appbar.js']},
    {'label': 'Material 3 Expressive top app bar', 'note': 'Title on the left in a 64 dp bar; it turns a soft tint once you scroll.',
     'snippet': '<header class="c-appbar c-appbar--md"><button class="c-iconbtn" aria-label="Back"><span class="c-ico">arrow_back</span></button><h1 class="c-appbar__title">Settings</h1><button class="c-iconbtn" aria-label="Search"><span class="c-ico">search</span></button><button class="c-iconbtn" aria-label="More"><span class="c-ico">more_vert</span></button></header>'},
    {'label': 'Apple navigation bar (iOS 27)', 'note': 'A see-through bar with a centred title; buttons float in Liquid Glass circles and capsules. Once you scroll, the edge blurs with a fine line (the iOS 27 default).',
     'snippet': '<header class="c-appbar c-appbar--ios"><button class="c-iconbtn" aria-label="Back"><span class="c-ico">chevron_left</span></button><h1 class="c-appbar__title">Settings</h1><span class="c-appbar__spacer"></span><button class="c-appbar__text">Edit</button></header>'},
    demo={'page': '{snippet}' + FEED, 'scroll': True})

add('largetitle', 'Navigation', 'Large title that shrinks on scroll', 'A big screen title that smoothly shrinks into the top bar as you scroll down.',
    'Use it on main screens (Inbox, Library, Settings) to give them presence, without wasting space once people start scrolling.',
    {'css': ['appbar.css', 'largetitle.css'], 'js': ['largetitle.js']},
    {'label': 'Material 3 Expressive large top app bar', 'note': 'A 28 px headline under the bar that fades up into the small left-aligned title.',
     'snippet': '<header class="c-large c-large--md"><div class="c-large__bar"><button class="c-iconbtn" aria-label="Menu"><span class="c-ico">menu</span></button><p class="c-large__small">Library</p><button class="c-iconbtn" aria-label="Search"><span class="c-ico">search</span></button></div><h1 class="c-large__title">Library</h1></header>'},
    {'label': 'Apple large title (iOS 27)', 'note': 'The 34 pt bold iPhone title that shrinks into the centred bar title; bar buttons sit in Liquid Glass circles and the edge blurs once it collapses.',
     'snippet': '<header class="c-large c-large--ios"><div class="c-large__bar"><span style="flex:1"></span><p class="c-large__small">Library</p><button class="c-iconbtn" aria-label="Add"><span class="c-ico">add</span></button></div><h1 class="c-large__title">Library</h1></header>'},
    demo={'page': '{snippet}' + FEED, 'scroll': True, 'autoscroll': True})

add('segmented', 'Navigation', 'Segmented control / tabs', 'A small switcher between 2-4 views of the same content (For you / Following).',
    'Use it to filter or switch views inside one screen, not to move between main sections (that is the tab bar).',
    {'css': ['segmented.css'], 'js': ['segmented.js']},
    {'label': 'Material 3 Expressive tabs', 'note': 'Text tabs with a sliding underline under the chosen one; full width under the top bar.',
     'snippet': '<div class="c-seg c-seg--md" role="tablist"><button class="c-seg__item is-on" role="tab" aria-selected="true">For you</button><button class="c-seg__item" role="tab">Following</button><button class="c-seg__item" role="tab">Saved</button></div>'},
    {'label': 'Apple segmented control (iOS 27)', 'note': 'A capsule track with a glass capsule thumb that springs to the chosen option.',
     'snippet': '<div class="c-seg c-seg--ios" role="tablist"><button class="c-seg__item is-on" role="tab" aria-selected="true">For you</button><button class="c-seg__item" role="tab">Following</button><button class="c-seg__item" role="tab">Saved</button></div>'},
    demo={'page': '<div style="padding-top:24px">{snippet}</div>'})

add('button', 'Actions', 'Buttons', 'The main tappable actions, in four strengths: filled, tonal, outlined and text.',
    'Use one filled button for the main action on a screen, tonal or outlined for secondary actions, text for the least important.',
    {'css': ['button.css'], 'js': []},
    {'label': 'Material 3 Expressive buttons', 'note': 'Round 40 dp buttons that square off their corners while pressed (the Expressive shape morph).',
     'snippet': '<button class="c-btn c-btn--md c-btn--filled">Follow</button> <button class="c-btn c-btn--md c-btn--tonal">Message</button> <button class="c-btn c-btn--md c-btn--outlined">Share</button> <button class="c-btn c-btn--md c-btn--text">Cancel</button>'},
    {'label': 'Apple buttons (iOS 27)', 'note': 'Capsule buttons: filled = prominent glass in your colour, tonal/outlined = frosted Liquid Glass with a clear edge; they shrink slightly when pressed.',
     'snippet': '<button class="c-btn c-btn--ios c-btn--filled c-btn--block">Follow</button> <button class="c-btn c-btn--ios c-btn--tonal c-btn--block">Message</button> <button class="c-btn c-btn--ios c-btn--outlined c-btn--block">Share</button> <button class="c-btn c-btn--ios c-btn--text c-btn--block">Cancel</button>'},
    demo={'page': '<div style="padding:24px 16px;display:flex;flex-wrap:wrap;gap:10px">{snippet}</div>'})

add('fab', 'Actions', 'Floating action button', 'A round button that floats above the content for the one main thing people create (new post, compose).',
    'Use it only when there is one clear "create" action. iPhone apps rarely use it; the Apple version is a simple round tinted button.',
    {'css': ['fab.css'], 'js': []},
    {'label': 'Material 3 Expressive FAB', 'note': 'A 56 dp rounded-square button with a soft tint and shadow; add a label to make it wide ("extended").',
     'snippet': '<button class="c-fab c-fab--md" aria-label="New post"><span class="c-ico">edit</span><span class="c-fab__label">New post</span></button>'},
    {'label': 'Apple-style floating button (iOS 27)', 'note': 'A round prominent-glass button in your brand colour (iOS has no official FAB).',
     'snippet': '<button class="c-fab c-fab--ios" aria-label="New post"><span class="c-ico">add</span></button>'},
    demo={'page': FEED + '{snippet}'})

add('textfield', 'Inputs', 'Text field', 'A box for typing, with its label and an optional help or error line.',
    'Use it in forms: sign in, profile editing, checkout. Error lines tell people exactly what to fix.',
    {'css': ['textfield.css'], 'js': []},
    {'label': 'Material 3 Expressive outlined field', 'note': 'The label sits inside the box and floats up into the border when you type.',
     'snippet': '<label class="c-field c-field--md"><input type="email" placeholder=" "><span class="c-field__label">Email</span><small class="c-field__help">We never share it.</small></label>'},
    {'label': 'Apple field (iOS 27)', 'note': 'A small label above a soft filled field with rounder 14 pt corners; it outlines in your colour while typing.',
     'snippet': '<label class="c-field c-field--ios"><span class="c-field__label">Email</span><input type="email" placeholder="name@example.com"><small class="c-field__help">We never share it.</small></label>'},
    demo={'page': '<div style="padding:32px 16px;display:grid;gap:20px">{snippet}</div>'})

add('search', 'Inputs', 'Search bar', 'A search field with a magnifier icon.',
    'Use it at the top of lists or on a Search tab so people can find things quickly.',
    {'css': ['search.css'], 'js': []},
    {'label': 'Material 3 Expressive search bar', 'note': 'A tall rounded pill on a tinted surface.',
     'snippet': '<label class="c-search c-search--md"><span class="c-ico">search</span><input type="search" placeholder="Search people and posts" aria-label="Search"></label>'},
    {'label': 'Apple search field (iOS 27)', 'note': 'A Liquid Glass capsule field. In iOS 27 apps, search usually lives as a tab in the tab bar.',
     'snippet': '<label class="c-search c-search--ios"><span class="c-ico">search</span><input type="search" placeholder="Search" aria-label="Search"></label>'},
    demo={'page': '<div style="padding-top:24px">{snippet}</div>'})

add('switch', 'Inputs', 'Switch', 'An on/off toggle for a setting that takes effect right away.',
    'Use it for settings (notifications on/off). Use a checkbox instead when people confirm several choices with a Save button.',
    {'css': ['switch.css'], 'js': []},
    {'label': 'Material 3 Expressive switch', 'note': 'An outlined track; the thumb grows and slides when it turns on.',
     'snippet': '<label class="c-switch c-switch--md"><input type="checkbox" role="switch" checked><span class="c-switch__track"></span>Notifications</label>'},
    {'label': 'Apple switch (iOS 27)', 'note': 'The wider Liquid Glass-era toggle with a pill-shaped thumb that stretches while pressed; the track fills with your brand colour.',
     'snippet': '<label class="c-switch c-switch--ios"><input type="checkbox" role="switch" checked><span class="c-switch__track"></span>Notifications</label>'},
    demo={'page': '<div style="padding:32px 16px;display:grid;gap:20px">{snippet}{snippet_off}</div>', 'off': True})

add('checkbox', 'Inputs', 'Checkbox and radio', 'Tick boxes for picking several options, round radios for picking exactly one.',
    'Use checkboxes for "choose any", radios for "choose one" (for example a delivery speed).',
    {'css': ['checkbox.css'], 'js': []},
    {'label': 'Material 3 Expressive checkbox and radio', 'note': 'Square tick box and ring radio button.',
     'snippet': '<label class="c-check c-check--md"><input type="checkbox" checked><span class="c-check__box"></span>Photos</label> <label class="c-check c-check--md"><input type="checkbox"><span class="c-check__box"></span>Videos</label> <label class="c-check c-check--md"><input type="radio" name="r1" checked><span class="c-check__box"></span>Everyone</label> <label class="c-check c-check--md"><input type="radio" name="r1"><span class="c-check__box"></span>Friends</label>'},
    {'label': 'Apple selection (iOS 27)', 'note': 'Round ticks for picking several items; a trailing checkmark marks the one chosen option.',
     'snippet': '<label class="c-check c-check--ios"><input type="checkbox" checked><span class="c-check__box"></span>Photos</label> <label class="c-check c-check--ios"><input type="checkbox"><span class="c-check__box"></span>Videos</label> <label class="c-check c-check--ios"><input type="radio" name="r2" checked><span class="c-check__box"></span>Everyone</label> <label class="c-check c-check--ios"><input type="radio" name="r2"><span class="c-check__box"></span>Friends</label>'},
    demo={'page': '<div style="padding:32px 16px;display:grid;gap:16px">{snippet}</div>'})

add('slider', 'Inputs', 'Slider', 'Drag to pick a value in a range (volume, brightness, price).',
    'Use it when the exact number matters less than the feel; show the value next to it if it does matter.',
    {'css': ['slider.css'], 'js': ['slider.js']},
    {'label': 'Material 3 Expressive slider', 'note': 'A thick track with a tall thin handle.',
     'snippet': '<input class="c-slider c-slider--md" type="range" min="0" max="100" value="40" aria-label="Volume">'},
    {'label': 'Apple slider (iOS 27)', 'note': 'A 6 pt track with a white capsule thumb that grows a little while dragged.',
     'snippet': '<input class="c-slider c-slider--ios" type="range" min="0" max="100" value="40" aria-label="Volume">'},
    demo={'page': '<div style="padding:40px 20px">{snippet}</div>'})

add('card', 'Surfaces', 'Card', 'A rounded box that groups an image, a title, text and actions about one thing.',
    'Use it for feeds and grids of items (posts, products, places).',
    {'css': ['card.css', 'button.css'], 'js': []},
    {'label': 'Material 3 Expressive card', 'note': 'Soft tinted card with 12 dp corners (or outlined).',
     'snippet': '<article class="c-card c-card--md"><img class="c-card__media" src="https://picsum.photos/id/29/600/340" alt=""><div class="c-card__body"><h3>Mountain escape</h3><p>3 days in the highlands, from RM 499.</p></div><div class="c-card__actions"><button class="c-btn c-btn--md c-btn--text">Details</button><button class="c-btn c-btn--md c-btn--filled">Book</button></div></article>'},
    {'label': 'Apple card (iOS 27)', 'note': 'White card with large 26 pt corners and a clear edge instead of a heavy shadow, on a light grey page.',
     'snippet': '<article class="c-card c-card--ios"><img class="c-card__media" src="https://picsum.photos/id/29/600/340" alt=""><div class="c-card__body"><h3>Mountain escape</h3><p>3 days in the highlands, from RM 499.</p></div><div class="c-card__actions"><button class="c-btn c-btn--ios c-btn--text">Details</button><button class="c-btn c-btn--ios c-btn--filled" style="height:40px">Book</button></div></article>'},
    demo={'page': '<div style="padding:24px 16px">{snippet}</div>', 'grouped': True})

add('list', 'Surfaces', 'List rows', 'Rows of items with an optional icon or photo, a title, a subtitle and something on the right.',
    'Use it for settings, contacts, messages, any list people scan and tap.',
    {'css': ['list.css'], 'js': []},
    {'label': 'Material 3 Expressive list', 'note': 'Full-width rows with roomy spacing and no separators.',
     'snippet': '<ul class="c-list c-list--md"><li class="c-row"><span class="c-row__lead"><img src="https://picsum.photos/id/64/80" alt=""></span><span class="c-row__text"><b>Aina</b><small>See you tomorrow!</small></span><span class="c-row__trail">9:41</span></li><li class="c-row"><span class="c-row__lead"><img src="https://picsum.photos/id/91/80" alt=""></span><span class="c-row__text"><b>Hafiz</b><small>Sent a photo</small></span><span class="c-row__trail">8:02</span></li><li class="c-row"><span class="c-row__lead"><span class="c-ico">notifications</span></span><span class="c-row__text"><b>Notifications</b><small>On</small></span><span class="c-row__trail"><span class="c-ico">chevron_right</span></span></li></ul>'},
    {'label': 'Apple grouped list (iOS 27)', 'note': 'Inset group with large 26 pt corners, roomier rows, fine separators, coloured icon tiles and chevrons, like iPhone Settings today.',
     'snippet': '<p class="c-list__header">Account</p><ul class="c-list c-list--ios"><li class="c-row"><span class="c-row__lead"><span class="c-ico">notifications</span></span><span class="c-row__text"><b>Notifications</b></span><span class="c-row__trail">On<span class="c-ico">chevron_right</span></span></li><li class="c-row"><span class="c-row__lead"><span class="c-ico">lock</span></span><span class="c-row__text"><b>Privacy</b></span><span class="c-row__trail"><span class="c-ico">chevron_right</span></span></li><li class="c-row"><span class="c-row__lead"><span class="c-ico">help</span></span><span class="c-row__text"><b>Help</b></span><span class="c-row__trail"><span class="c-ico">chevron_right</span></span></li></ul>'},
    demo={'page': '<div style="padding:16px 0">{snippet}</div>', 'grouped_ios': True})

add('sheet', 'Surfaces', 'Bottom sheet', 'A panel that slides up from the bottom with extra options or details; swipe down or tap outside to close.',
    'Use it for share menus, filters and quick details, so people keep their place on the screen underneath.',
    {'css': ['sheet.css', 'button.css', 'list.css'], 'js': ['overlay.js']},
    {'label': 'Material 3 Expressive bottom sheet', 'note': 'Tinted panel with big rounded top corners and a drag handle.',
     'snippet': '<button class="c-btn c-btn--md c-btn--filled" data-c-open="share-md">Share</button>\n<div class="c-sheet c-sheet--md" id="share-md" hidden><div class="c-sheet__panel" role="dialog" aria-modal="true" aria-label="Share"><span class="c-sheet__grab"></span><ul class="c-list c-list--md"><li class="c-row"><span class="c-row__lead"><span class="c-ico">link</span></span><span class="c-row__text"><b>Copy link</b></span></li><li class="c-row"><span class="c-row__lead"><span class="c-ico">send</span></span><span class="c-row__text"><b>Send to a friend</b></span></li></ul><button class="c-btn c-btn--md c-btn--text" data-c-close>Close</button></div></div>'},
    {'label': 'Apple sheet (iOS 27)', 'note': 'A floating Liquid Glass sheet inset from the screen edges with large corners; close sits on the leading edge of its top bar, as the HIG asks.',
     'snippet': '<button class="c-btn c-btn--ios c-btn--filled" data-c-open="share-ios">Share</button>\n<div class="c-sheet c-sheet--ios" id="share-ios" hidden><div class="c-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="share-ios-t"><span class="c-sheet__grab"></span><div class="c-sheet__head"><button class="c-sheet__close" data-c-close aria-label="Close"><span class="c-ico">close</span></button><h3 id="share-ios-t">Share</h3><span style="width:40px"></span></div><ul class="c-list c-list--ios" style="margin:0"><li class="c-row"><span class="c-row__lead"><span class="c-ico">link</span></span><span class="c-row__text"><b>Copy link</b></span></li><li class="c-row"><span class="c-row__lead"><span class="c-ico">send</span></span><span class="c-row__text"><b>Send to a friend</b></span></li></ul></div></div>'},
    demo={'page': '<div style="padding:32px 16px">{snippet}</div>', 'open': True})

add('dialog', 'Surfaces', 'Dialog / alert', 'A small box in the middle of the screen that asks people to confirm or decide something.',
    'Use it only for important, interrupting choices (delete, discard changes). Keep it to one sentence and two buttons.',
    {'css': ['dialog.css', 'button.css'], 'js': ['overlay.js']},
    {'label': 'Material 3 Expressive dialog', 'note': 'Tinted box with big rounded corners, a left-aligned headline and text buttons on the right.',
     'snippet': '<button class="c-btn c-btn--md c-btn--outlined" data-c-open="del-md">Delete post</button>\n<div class="c-dialog c-dialog--md" id="del-md" hidden><div class="c-dialog__box" role="alertdialog" aria-modal="true" aria-labelledby="del-md-t"><h2 id="del-md-t">Delete this post?</h2><p>It will be removed from your profile and feeds.</p><div class="c-dialog__actions"><button data-c-close>Cancel</button><button data-c-close class="is-danger">Delete</button></div></div></div>'},
    {'label': 'Apple alert (iOS 27)', 'note': 'A Liquid Glass alert with large corners, left-aligned text and capsule buttons side by side; the main action is filled, a destructive one is red.',
     'snippet': '<button class="c-btn c-btn--ios c-btn--outlined" data-c-open="del-ios">Delete post</button>\n<div class="c-dialog c-dialog--ios" id="del-ios" hidden><div class="c-dialog__box" role="alertdialog" aria-modal="true" aria-labelledby="del-ios-t"><h2 id="del-ios-t">Delete this post?</h2><p>It will be removed from your profile and feeds.</p><div class="c-dialog__actions"><button data-c-close>Cancel</button><button data-c-close class="is-danger">Delete</button></div></div></div>'},
    demo={'page': '<div style="padding:32px 16px">{snippet}</div>', 'open': True})

add('snackbar', 'Feedback', 'Snackbar / toast', 'A short message that pops up after an action ("Saved", "Post deleted - Undo") and disappears by itself.',
    'Use it to confirm something just happened, with an optional Undo. Do not use it for errors people must act on.',
    {'css': ['snackbar.css', 'button.css'], 'js': ['snackbar.js']},
    {'label': 'Material 3 Expressive snackbar', 'note': 'Dark bar near the bottom with an optional action like Undo.',
     'snippet': '<body data-c-toast="md"> … <button class="c-btn c-btn--md c-btn--tonal" onclick="C.toast(\'Post deleted\', { action: \'Undo\' })">Delete</button>'},
    {'label': 'Apple-style toast (iOS 27)', 'note': 'A Liquid Glass capsule that drops in at the top, like an iPhone system banner.',
     'snippet': '<body data-c-toast="ios"> … <button class="c-btn c-btn--ios c-btn--tonal" onclick="C.toast(\'Saved to Photos\')">Save</button>'},
    demo={'page': '<div style="padding:32px 16px"><button class="c-btn c-btn--{v} c-btn--tonal" onclick="C.toast(\'{msg}\'{opt})">Show message</button></div>', 'toast': True})

add('progress', 'Feedback', 'Progress and spinner', 'Shows that something is loading or how far along it is.',
    'Use the bar when you know how far along it is (uploading 60%), the spinner when you do not.',
    {'css': ['progress.css'], 'js': []},
    {'label': 'Material 3 Expressive progress', 'note': 'A wavy progress line and the shape-morphing loading indicator (Expressive replaces the plain spinner for short waits).',
     'snippet': '<div class="c-progress c-progress--md" style="--c-value:60%" role="progressbar" aria-valuenow="60"></div>\n<span class="c-spinner c-spinner--md" role="progressbar" aria-label="Loading"></span>'},
    {'label': 'Apple progress', 'note': 'Thin rounded bar and the eight-spoke iPhone activity indicator.',
     'snippet': '<div class="c-progress c-progress--ios" style="--c-value:60%" role="progressbar" aria-valuenow="60"></div>\n<span class="c-spinner c-spinner--ios" role="progressbar" aria-label="Loading"></span>'},
    demo={'page': '<div style="padding:40px 20px;display:grid;gap:28px;justify-items:center"><div style="width:100%">{bar}</div>{spin}<div style="width:100%"><div class="c-progress c-progress--{v}"></div></div></div>', 'progress': True})

add('skeleton', 'Feedback', 'Skeleton loading', 'Grey placeholder shapes shown where content will appear while it loads.',
    'Use it instead of a spinner for feeds and lists, so the screen feels faster and does not jump when content arrives.',
    {'css': ['skeleton.css'], 'js': []},
    {'label': 'Material shimmer', 'note': 'A soft light sweeps across the placeholders.',
     'snippet': '<div style="display:flex;gap:12px;align-items:center"><div class="c-skel c-skel--md c-skel--round" style="width:40px;height:40px"></div><div style="flex:1;display:grid;gap:8px"><div class="c-skel c-skel--md" style="height:12px;width:60%"></div><div class="c-skel c-skel--md" style="height:12px;width:40%"></div></div></div>'},
    {'label': 'Apple pulse', 'note': 'Placeholders gently pulse, like iOS redacted content.',
     'snippet': '<div style="display:flex;gap:12px;align-items:center"><div class="c-skel c-skel--ios c-skel--round" style="width:40px;height:40px"></div><div style="flex:1;display:grid;gap:8px"><div class="c-skel c-skel--ios" style="height:12px;width:60%"></div><div class="c-skel c-skel--ios" style="height:12px;width:40%"></div></div></div>'},
    demo={'page': '<div style="padding:32px 16px;display:grid;gap:24px">{snippet}{snippet}{snippet}<div class="c-skel c-skel--{v}" style="height:160px"></div></div>'})


PIC = lambda i, w=600, h=400: 'https://picsum.photos/id/%d/%d/%d' % (i, w, h)
ROWS = lambda v: ''.join('<li class="c-row"><span class="c-row__text"><b>%s</b><small>%s</small></span></li>' % (a, b) for a, b in [('Aina', 'See you tomorrow!'), ('Hafiz', 'Sent a photo'), ('Mei Ling', 'Dinner on Friday?')])

add('toolbar', 'Navigation', 'Toolbar', 'A floating bar of actions for what is on screen right now (share, edit, delete a photo).',
    'Use it on detail or editing screens instead of a tab bar. Put the main action in the middle or at the end.',
    {'css': ['toolbar.css', 'appbar.css'], 'js': []},
    {'label': 'Material 3 Expressive floating toolbar', 'note': 'A 64 dp pill that floats above the content; the main action is a filled, squarish button.',
     'snippet': '<div class="c-toolbar c-toolbar--md" role="toolbar" aria-label="Photo actions"><button class="c-iconbtn" aria-label="Share"><span class="c-ico">share</span></button><button class="c-iconbtn" aria-label="Favourite"><span class="c-ico">favorite</span></button><button class="c-iconbtn c-toolbar__main" aria-label="Edit"><span class="c-ico">edit</span></button><button class="c-iconbtn" aria-label="Delete"><span class="c-ico">delete</span></button></div>'},
    {'label': 'Apple toolbar (iOS 27)', 'note': 'A floating Liquid Glass capsule with glass buttons; the main action is tinted in your colour.',
     'snippet': '<div class="c-toolbar c-toolbar--ios" role="toolbar" aria-label="Photo actions"><button class="c-iconbtn" aria-label="Share"><span class="c-ico">ios_share</span></button><button class="c-iconbtn" aria-label="Favourite"><span class="c-ico">favorite</span></button><button class="c-iconbtn c-toolbar__main" aria-label="Edit"><span class="c-ico">edit</span></button><button class="c-iconbtn" aria-label="Delete"><span class="c-ico">delete</span></button></div>'},
    demo={'page': '<img src="' + PIC(29, 600, 900) + '" alt="" style="display:block;width:100%;height:100%;object-fit:cover;position:fixed;inset:0">{snippet}'})

add('drawer', 'Navigation', 'Side menu', 'A panel that slides in from the left with all the app sections, opened from a menu button.',
    'Use it when there are more sections than fit in a tab bar (6+), or for secondary places like Settings and Help.',
    {'css': ['drawer.css', 'avatar.css'], 'js': ['overlay.js']},
    {'label': 'Material 3 navigation drawer', 'note': 'A tinted panel with a rounded edge; the current section sits on a soft pill.',
     'snippet': '<button class="c-iconbtn" data-c-open="nav-md" aria-label="Open menu"><span class="c-ico">menu</span></button>\n<div class="c-drawer c-drawer--md" id="nav-md" hidden><nav class="c-drawer__panel" aria-label="Sections"><p class="c-drawer__head">Mail</p><a class="c-drawer__item is-on" href="#"><span class="c-ico">inbox</span>Inbox<span class="c-badge-num">3</span></a><a class="c-drawer__item" href="#"><span class="c-ico">send</span>Sent</a><a class="c-drawer__item" href="#"><span class="c-ico">archive</span>Archive</a><a class="c-drawer__item" href="#"><span class="c-ico">settings</span>Settings</a></nav></div>'},
    {'label': 'Apple side menu (iOS 27 sidebar style)', 'note': 'A floating glass panel with large corners, 17 pt rows and icons in your colour (on iPhone, Apple prefers a tab bar; use this for many sections).',
     'snippet': '<button class="c-iconbtn" data-c-open="nav-ios" aria-label="Open menu"><span class="c-ico">menu</span></button>\n<div class="c-drawer c-drawer--ios" id="nav-ios" hidden><nav class="c-drawer__panel" aria-label="Sections"><p class="c-drawer__head">Mail</p><a class="c-drawer__item is-on" href="#"><span class="c-ico">inbox</span>Inbox<span class="c-badge-num">3</span></a><a class="c-drawer__item" href="#"><span class="c-ico">send</span>Sent</a><a class="c-drawer__item" href="#"><span class="c-ico">archive</span>Archive</a><a class="c-drawer__item" href="#"><span class="c-ico">settings</span>Settings</a></nav></div>'},
    demo={'page': '<div style="padding:16px">{snippet}</div>', 'open': True})

add('pagedots', 'Navigation', 'Page indicator', 'Small dots that show which page you are on in a carousel or a welcome walkthrough.',
    'Use it under swipeable pages (onboarding, photo galleries) with 2-8 pages.',
    {'css': ['pagedots.css'], 'js': ['pagedots.js']},
    {'label': 'Material 3 page indicator', 'note': 'Dots; the current page stretches into a short pill in your colour.',
     'snippet': '<div class="c-dots c-dots--md" role="tablist" aria-label="Pages"><button class="c-dot is-on" aria-label="Page 1"></button><button class="c-dot" aria-label="Page 2"></button><button class="c-dot" aria-label="Page 3"></button><button class="c-dot" aria-label="Page 4"></button></div>'},
    {'label': 'Apple page control (iOS 27)', 'note': 'Small dots on a Liquid Glass capsule; the current one is darker and longer.',
     'snippet': '<div class="c-dots c-dots--ios" role="tablist" aria-label="Pages"><button class="c-dot is-on" aria-label="Page 1"></button><button class="c-dot" aria-label="Page 2"></button><button class="c-dot" aria-label="Page 3"></button><button class="c-dot" aria-label="Page 4"></button></div>'},
    demo={'page': '<div style="padding:40px 0">{snippet}</div>'})

add('iconbutton', 'Actions', 'Icon buttons', 'Round buttons with just an icon (like, share, more), in four strengths; some can toggle on and off.',
    'Use them for familiar actions where the icon is clear. Always give them a label for screen readers.',
    {'css': ['iconbutton.css'], 'js': ['iconbutton.js']},
    {'label': 'Material 3 Expressive icon buttons', 'note': 'Standard, filled, tonal and outlined 40 dp buttons; corners square off while pressed. The heart toggles.',
     'snippet': '<button class="c-icon c-icon--md c-icon--standard" aria-label="Like" aria-pressed="false"><span class="c-ico">favorite</span></button><button class="c-icon c-icon--md c-icon--filled" aria-label="Add"><span class="c-ico">add</span></button><button class="c-icon c-icon--md c-icon--tonal" aria-label="Edit"><span class="c-ico">edit</span></button><button class="c-icon c-icon--md c-icon--outlined" aria-label="More"><span class="c-ico">more_vert</span></button>'},
    {'label': 'Apple icon buttons (iOS 27)', 'note': 'Glass circles; filled = prominent glass in your colour. The heart toggles.',
     'snippet': '<button class="c-icon c-icon--ios c-icon--tonal" aria-label="Like" aria-pressed="false"><span class="c-ico">favorite</span></button><button class="c-icon c-icon--ios c-icon--filled" aria-label="Add"><span class="c-ico">add</span></button><button class="c-icon c-icon--ios c-icon--tonal" aria-label="Edit"><span class="c-ico">edit</span></button><button class="c-icon c-icon--ios c-icon--outlined" aria-label="More"><span class="c-ico">more_horiz</span></button>'},
    demo={'page': '<div style="padding:32px 20px;display:flex;gap:14px">{snippet}</div>'})

add('chips', 'Actions', 'Chips / filters', 'Small rounded options in a row to filter a list or pick tags (Nearby, Open now, Under RM 50).',
    'Use them above a list or results to narrow it down; they scroll sideways if there are many.',
    {'css': ['chips.css'], 'js': ['chips.js']},
    {'label': 'Material 3 filter chips', 'note': 'Outlined chips with small corners; a selected filter fills and shows a tick.',
     'snippet': '<div class="c-chips c-chips--md" aria-label="Filters"><button class="c-chip" aria-pressed="true">Nearby</button><button class="c-chip" aria-pressed="false">Open now</button><button class="c-chip" aria-pressed="false">Under RM 50</button><button class="c-chip" aria-pressed="false">Top rated</button></div>'},
    {'label': 'Apple filter capsules (iOS 27)', 'note': 'Soft grey capsules; the selected ones fill with your colour.',
     'snippet': '<div class="c-chips c-chips--ios" aria-label="Filters"><button class="c-chip" aria-pressed="true">Nearby</button><button class="c-chip" aria-pressed="false">Open now</button><button class="c-chip" aria-pressed="false">Under RM 50</button><button class="c-chip" aria-pressed="false">Top rated</button></div>'},
    demo={'page': '<div style="padding-top:24px">{snippet}</div>'}, extra={'cssicons': ['check']})

add('menu', 'Actions', 'Menu', 'A short list of actions that pops up from a button (Sort by, More options, Report).',
    'Use it to tuck away 3-7 secondary actions. Put destructive ones (Delete) last, in red.',
    {'css': ['menu.css', 'appbar.css'], 'js': ['menu.js']},
    {'label': 'Material 3 Expressive menu', 'note': 'A tinted card with rounded corners and roomy rows.',
     'snippet': '<button class="c-iconbtn" data-c-menu="m-md" aria-haspopup="menu" aria-label="More options"><span class="c-ico">more_vert</span></button>\n<div class="c-menu c-menu--md" id="m-md" role="menu" hidden><button role="menuitem"><span class="c-ico">edit</span>Edit</button><button role="menuitem"><span class="c-ico">share</span>Share</button><button role="menuitem"><span class="c-ico">bookmark</span>Save</button><hr><button role="menuitem" class="is-danger"><span class="c-ico">delete</span>Delete</button></div>'},
    {'label': 'Apple menu (iOS 27)', 'note': 'A Liquid Glass context menu with large corners; icons sit on the left, as in iOS 26 and later.',
     'snippet': '<button class="c-iconbtn" data-c-menu="m-ios" aria-haspopup="menu" aria-label="More options"><span class="c-ico">more_horiz</span></button>\n<div class="c-menu c-menu--ios" id="m-ios" role="menu" hidden><button role="menuitem"><span class="c-ico">edit</span>Edit</button><button role="menuitem"><span class="c-ico">ios_share</span>Share</button><button role="menuitem"><span class="c-ico">bookmark</span>Save</button><hr><button role="menuitem" class="is-danger"><span class="c-ico">delete</span>Delete</button></div>'},
    demo={'page': '<div style="padding:16px;display:flex;justify-content:flex-end">{snippet}</div>', 'menu': True})

add('actions', 'Actions', 'Action choices', 'A set of actions offered at once: Apple uses an action sheet from the bottom, Material 3 Expressive a menu that springs out of the floating button.',
    'Use it when someone needs to pick one of several actions (Take photo / Choose from library / Cancel).',
    {'css': ['actions.css', 'sheet.css', 'fab.css'], 'js': ['actions.js', 'overlay.js']},
    {'label': 'Material 3 Expressive FAB menu', 'note': 'The floating button turns into a close button and opens labelled actions above it.',
     'snippet': '<div class="c-fabmenu c-fabmenu--md"><div class="c-fabmenu__items" hidden><button><span class="c-ico">photo_camera</span>Take photo</button><button><span class="c-ico">photo_library</span>Choose photo</button><button><span class="c-ico">edit</span>Write a post</button></div><button class="c-fab c-fab--md c-fabmenu__toggle" aria-expanded="false" aria-label="Create"><span class="c-ico">add</span></button></div>'},
    {'label': 'Apple action sheet (iOS 27)', 'note': 'Glass groups of actions from the bottom with a separate Cancel; destructive actions in red.',
     'snippet': '<button class="c-btn c-btn--ios c-btn--tonal" data-c-open="as-ios">Change photo</button>\n<div class="c-asheet c-asheet--ios c-sheet" id="as-ios" hidden><div class="c-asheet__group"><p class="c-asheet__title">Profile photo</p><button data-c-close>Take photo</button><button data-c-close>Choose from library</button><button data-c-close class="is-danger">Remove photo</button></div><button class="c-asheet__cancel" data-c-close>Cancel</button></div>'},
    demo={'page': FEED + '<div style="position:fixed;left:16px;top:44px">{snippet}</div>', 'open': True, 'fabmenu': True})

add('buttongroup', 'Actions', 'Button group', '2-5 joined buttons where you pick one (Day / Week / Month) or a set of related actions.',
    'Use it for a small, always-visible choice inside a screen. For switching whole views, the segmented control also works.',
    {'css': ['buttongroup.css'], 'js': ['buttongroup.js']},
    {'label': 'Material 3 Expressive connected buttons', 'note': 'Joined buttons with small inner corners; the chosen one turns fully round and filled.',
     'snippet': '<div class="c-bgroup c-bgroup--md" role="radiogroup" aria-label="Range"><button role="radio" aria-checked="true">Day</button><button role="radio" aria-checked="false">Week</button><button role="radio" aria-checked="false">Month</button></div>'},
    {'label': 'Apple button group (iOS 27)', 'note': 'Capsule buttons inside one glass capsule; the chosen one fills with your colour.',
     'snippet': '<div class="c-bgroup c-bgroup--ios" role="radiogroup" aria-label="Range"><button role="radio" aria-checked="true">Day</button><button role="radio" aria-checked="false">Week</button><button role="radio" aria-checked="false">Month</button></div>'},
    demo={'page': '<div style="padding:32px 16px">{snippet}</div>'})

add('stepper', 'Inputs', 'Stepper (+ / -)', 'Minus and plus buttons around a number for small amounts (guests, quantity).',
    'Use it for numbers people change by one or two (1-10). For bigger ranges, use a slider or a text field.',
    {'css': ['stepper.css'], 'js': ['stepper.js']},
    {'label': 'Material 3 stepper', 'note': 'Round outlined buttons around a bold number; they dim at the limits.',
     'snippet': '<div class="c-stepper c-stepper--md" data-min="1" data-max="8"><button data-step="-1" aria-label="Fewer guests"><span class="c-ico">remove</span></button><output aria-live="polite">2</output><button data-step="1" aria-label="More guests"><span class="c-ico">add</span></button></div>'},
    {'label': 'Apple stepper (iOS 27)', 'note': 'The number, then the classic joined - | + capsule.',
     'snippet': '<div class="c-stepper c-stepper--ios" data-min="1" data-max="8"><output aria-live="polite">2</output><span class="c-stepper__pair"><button data-step="-1" aria-label="Fewer guests"><span class="c-ico">remove</span></button><button data-step="1" aria-label="More guests"><span class="c-ico">add</span></button></span></div>'},
    demo={'page': '<div style="padding:32px 20px;display:flex;align-items:center;justify-content:space-between;font-family:var(--c-font)"><span>Guests</span>{snippet}</div>'})

add('select', 'Inputs', 'Dropdown / select', 'A field that opens a list to pick one value (country, size, category).',
    'Use it for 5+ options. For 2-4, show them all (segmented control, radios or a button group).',
    {'css': ['select.css'], 'js': []},
    {'label': 'Material 3 exposed dropdown', 'note': 'An outlined field with its label in the border and a down arrow; the phone opens its own list.',
     'snippet': '<label class="c-select c-select--md"><span class="c-select__label">Country</span><select><option>Malaysia</option><option>Singapore</option><option>Indonesia</option><option>Thailand</option></select></label>'},
    {'label': 'Apple pop-up button (iOS 27)', 'note': 'A settings row with the chosen value and up/down chevrons in your colour.',
     'snippet': '<label class="c-select c-select--ios"><span class="c-select__label">Country</span><select><option>Malaysia</option><option>Singapore</option><option>Indonesia</option><option>Thailand</option></select></label>'},
    demo={'page': '<div style="padding:32px 16px">{snippet}</div>', 'grouped_ios': True}, extra={'cssicons': ['expand_more', 'unfold_more']})

add('datetime', 'Inputs', 'Date and time', 'Fields to pick a date or a time; phones open their own calendar or wheel.',
    'Use it for bookings, reminders and birthdays. Show the date in words people expect (24 Oct 2026).',
    {'css': ['datetime.css'], 'js': []},
    {'label': 'Material 3 date and time fields', 'note': 'Outlined fields with the label in the border.',
     'snippet': '<label class="c-date c-date--md"><span class="c-date__label">Check-in</span><input type="date" value="2026-10-24"></label>\n<label class="c-date c-date--md"><span class="c-date__label">Time</span><input type="time" value="15:30"></label>'},
    {'label': 'Apple compact date picker (iOS 27)', 'note': 'A label on the left and the date in a soft grey capsule on the right, like Calendar and Reminders.',
     'snippet': '<label class="c-date c-date--ios"><span class="c-date__label">Check-in</span><input type="date" value="2026-10-24"></label>\n<label class="c-date c-date--ios"><span class="c-date__label">Time</span><input type="time" value="15:30"></label>'},
    demo={'page': '<div style="padding:32px 16px;display:grid;gap:22px">{snippet}</div>', 'grouped_ios': True})

add('textarea', 'Inputs', 'Text area', 'A bigger box for several lines of text (bio, comment, message) with a character counter.',
    'Use it whenever the answer may be longer than one line.',
    {'css': ['textarea.css'], 'js': ['textarea.js']},
    {'label': 'Material 3 outlined text area', 'note': 'Outlined box with the label in the border; the counter updates as you type.',
     'snippet': '<label class="c-area c-area--md"><span class="c-area__label">Bio</span><textarea rows="4" maxlength="150">Professional time waster</textarea><small class="c-area__count">24/150</small></label>'},
    {'label': 'Apple text area (iOS 27)', 'note': 'Label above a soft filled box with 14 pt corners; the counter updates as you type.',
     'snippet': '<label class="c-area c-area--ios"><span class="c-area__label">Bio</span><textarea rows="4" maxlength="150">Professional time waster</textarea><small class="c-area__count">24/150</small></label>'},
    demo={'page': '<div style="padding:32px 16px">{snippet}</div>'})

add('otp', 'Inputs', 'Code input', 'One box per digit for a sign-in or verification code; it jumps to the next box and accepts a pasted code.',
    'Use it on "Enter the code we sent you" screens (4-6 digits).',
    {'css': ['otp.css'], 'js': ['otp.js']},
    {'label': 'Material 3 code boxes', 'note': 'Outlined boxes; the active one gets a thick outline in your colour.',
     'snippet': '<div class="c-otp c-otp--md" role="group" aria-label="Verification code">' + ''.join('<input inputmode="numeric" maxlength="1" aria-label="Digit %d">' % (i + 1) for i in range(6)) + '</div>'},
    {'label': 'Apple code boxes (iOS 27)', 'note': 'Soft filled rounded boxes; the active one rings in your colour.',
     'snippet': '<div class="c-otp c-otp--ios" role="group" aria-label="Verification code">' + ''.join('<input inputmode="numeric" maxlength="1" aria-label="Digit %d">' % (i + 1) for i in range(6)) + '</div>'},
    demo={'page': '<div style="padding:40px 8px">{snippet}</div>'})

add('tooltip', 'Surfaces', 'Tooltip and popover', 'A tiny hint that appears on a button, or a small card of extra info that opens when you tap an info icon.',
    'Use a tooltip to name an icon, a popover to explain something without leaving the screen.',
    {'css': ['tooltip.css', 'menu.css', 'iconbutton.css'], 'js': ['tooltip.js']},
    {'label': 'Material 3 tooltip and rich tooltip', 'note': 'A dark plain tooltip and a tinted info card with rounded corners.',
     'snippet': '<span class="c-tip c-tip--md is-on" data-tip="Copy link"><button class="c-icon c-icon--md c-icon--tonal" aria-label="Copy link"><span class="c-ico">link</span></button></span>\n<button class="c-icon c-icon--md c-icon--standard" data-c-pop="pop-md" aria-label="About ratings"><span class="c-ico">info</span></button><div class="c-pop c-pop--md" id="pop-md" hidden><b>How ratings work</b><p>Stars come from people who visited in the last 12 months.</p></div>'},
    {'label': 'Apple tooltip and popover (iOS 27)', 'note': 'A glass capsule hint and a Liquid Glass popover card with large corners.',
     'snippet': '<span class="c-tip c-tip--ios is-on" data-tip="Copy link"><button class="c-icon c-icon--ios c-icon--tonal" aria-label="Copy link"><span class="c-ico">link</span></button></span>\n<button class="c-icon c-icon--ios c-icon--tonal" data-c-pop="pop-ios" aria-label="About ratings"><span class="c-ico">info</span></button><div class="c-pop c-pop--ios" id="pop-ios" hidden><b>How ratings work</b><p>Stars come from people who visited in the last 12 months.</p></div>'},
    demo={'page': '<div style="padding:70px 24px 0;display:flex;gap:40px;align-items:center">{snippet}</div>', 'pop': True})

add('accordion', 'Surfaces', 'Expandable sections', 'Rows that open to show more detail and close again (FAQs, order details, settings groups).',
    'Use it to keep long pages short; put the most asked questions first.',
    {'css': ['accordion.css'], 'js': []},
    {'label': 'Material 3 expandable list', 'note': 'Full-width rows with lines between them and a turning arrow.',
     'snippet': '<div class="c-acc c-acc--md"><details open><summary>How do I change my username?</summary><div class="c-acc__body">Go to Profile, tap Edit profile and type a new one.</div></details><details><summary>Can I make my account private?</summary><div class="c-acc__body">Yes, in Settings, under Privacy.</div></details><details><summary>How do I delete a post?</summary><div class="c-acc__body">Tap the three dots on the post and choose Delete.</div></details></div>'},
    {'label': 'Apple disclosure group (iOS 27)', 'note': 'An inset group with large corners; the chevron in your colour turns down when open.',
     'snippet': '<div class="c-acc c-acc--ios"><details open><summary>How do I change my username?</summary><div class="c-acc__body">Go to Profile, tap Edit profile and type a new one.</div></details><details><summary>Can I make my account private?</summary><div class="c-acc__body">Yes, in Settings, under Privacy.</div></details><details><summary>How do I delete a post?</summary><div class="c-acc__body">Tap the three dots on the post and choose Delete.</div></details></div>'},
    demo={'page': '<div style="padding:24px 0">{snippet}</div>', 'grouped_ios': True}, extra={'cssicons': ['expand_more', 'chevron_right']})

add('carousel', 'Surfaces', 'Carousel', 'A row of photos or cards you swipe through sideways, with page dots underneath.',
    'Use it for featured items, photo sets or onboarding; keep it to 3-10 items.',
    {'css': ['carousel.css', 'pagedots.css'], 'js': ['carousel.js', 'pagedots.js']},
    {'label': 'Material 3 Expressive carousel', 'note': 'One big item and narrower ones peeking in, with large 28 dp corners.',
     'snippet': '<div class="c-carousel c-carousel--md" aria-label="Featured">' + ''.join('<div class="c-carousel__item"><img src="%s" alt=""><span>%s</span></div>' % (PIC(i), t) for i, t in [(10, 'Lakes'), (28, 'Forests'), (29, 'Peaks'), (42, 'Cafes')]) + '</div><div class="c-dots c-dots--md"><button class="c-dot is-on" aria-label="Item 1"></button><button class="c-dot" aria-label="Item 2"></button><button class="c-dot" aria-label="Item 3"></button><button class="c-dot" aria-label="Item 4"></button></div>'},
    {'label': 'Apple paging cards (iOS 27)', 'note': 'Full-width cards with large corners that snap one by one, with a glass page control.',
     'snippet': '<div class="c-carousel c-carousel--ios" aria-label="Featured">' + ''.join('<div class="c-carousel__item"><img src="%s" alt=""><span>%s</span></div>' % (PIC(i), t) for i, t in [(10, 'Lakes'), (28, 'Forests'), (29, 'Peaks'), (42, 'Cafes')]) + '</div><div class="c-dots c-dots--ios"><button class="c-dot is-on" aria-label="Item 1"></button><button class="c-dot" aria-label="Item 2"></button><button class="c-dot" aria-label="Item 3"></button><button class="c-dot" aria-label="Item 4"></button></div>'},
    demo={'page': '<div style="padding-top:24px">{snippet}</div>'})

add('avatar', 'Surfaces', 'Avatars and badges', 'Round profile photos (or initials), a stack of people, unread counts and "new" dots.',
    'Use avatars wherever people appear; badges for counts that need attention (keep them under 99+).',
    {'css': ['avatar.css'], 'js': []},
    {'label': 'Material 3 avatars and badges', 'note': '40 dp avatars, initials on a soft tint, small badges.',
     'snippet': '<span class="c-avatar c-avatar--md"><img src="https://picsum.photos/id/64/100" alt="Aina"><i class="c-status" aria-label="Online"></i></span> <span class="c-avatar c-avatar--md">KA</span> <span class="c-stack"><span class="c-avatar c-avatar--md"><img src="https://picsum.photos/id/91/80" alt=""></span><span class="c-avatar c-avatar--md"><img src="https://picsum.photos/id/65/80" alt=""></span><span class="c-avatar c-avatar--md">+5</span></span> <span class="c-badge-num c-badge-num--md">3</span> <span class="c-badge-dot" aria-label="New"></span>'},
    {'label': 'Apple avatars and badges (iOS 27)', 'note': 'Photos with a thin clear edge, grey initials, iOS red badges.',
     'snippet': '<span class="c-avatar c-avatar--ios"><img src="https://picsum.photos/id/64/100" alt="Aina"><i class="c-status" aria-label="Online"></i></span> <span class="c-avatar c-avatar--ios">KA</span> <span class="c-stack"><span class="c-avatar c-avatar--ios"><img src="https://picsum.photos/id/91/80" alt=""></span><span class="c-avatar c-avatar--ios"><img src="https://picsum.photos/id/65/80" alt=""></span><span class="c-avatar c-avatar--ios">+5</span></span> <span class="c-badge-num">3</span> <span class="c-badge-dot" aria-label="New"></span>'},
    demo={'page': '<div style="padding:32px 16px;display:flex;flex-wrap:wrap;gap:14px;align-items:center">{snippet}</div>'})

add('banner', 'Feedback', 'Notice banner', 'A message inside the page that stays until dealt with (offline, update available, please verify your email).',
    'Use it for things that matter but are not urgent enough for a dialog; give one clear action.',
    {'css': ['banner.css'], 'js': ['banner.js']},
    {'label': 'Material 3 banner', 'note': 'Full-width tinted strip under the top bar with text buttons.',
     'snippet': '<div class="c-banner c-banner--md" role="status"><span class="c-ico">wifi_off</span><div><b>You are offline</b><p>New posts will send when you are back online.</p></div><div class="c-banner__actions"><button data-c-dismiss>Dismiss</button><button class="is-main">Retry</button></div></div>'},
    {'label': 'Apple notice card (iOS 27)', 'note': 'An inset rounded card with a clear edge and capsule buttons.',
     'snippet': '<div class="c-banner c-banner--ios" role="status"><span class="c-ico">wifi_off</span><div><b>You are offline</b><p>New posts will send when you are back online.</p></div><div class="c-banner__actions"><button data-c-dismiss>Dismiss</button><button class="is-main">Retry</button></div></div>'},
    demo={'page': '<div style="padding-top:12px">{snippet}</div>' + FEED, 'grouped_ios': True})

add('emptystate', 'Feedback', 'Empty state', 'What a screen shows when there is nothing yet (no messages, no results), with one helpful action.',
    'Use it on every list that can be empty: say why it is empty and what to do next.',
    {'css': ['emptystate.css', 'button.css'], 'js': []},
    {'label': 'Material 3 Expressive empty state', 'note': 'The icon sits in a soft expressive shape, with a headline, a line of help and a tonal button.',
     'snippet': '<div class="c-empty c-empty--md"><span class="c-empty__art"><span class="c-ico">inbox</span></span><h3>No messages yet</h3><p>When friends message you, it shows up here.</p><button class="c-btn c-btn--md c-btn--tonal">Find friends</button></div>'},
    {'label': 'Apple empty state (iOS 27)', 'note': 'A large grey symbol, a bold title and a short line, like Apple\'s "content unavailable" screens.',
     'snippet': '<div class="c-empty c-empty--ios"><span class="c-empty__art"><span class="c-ico">inbox</span></span><h3>No Messages</h3><p>When friends message you, it shows up here.</p><button class="c-btn c-btn--ios c-btn--tonal">Find Friends</button></div>'},
    demo={'page': '<div style="padding-top:40px">{snippet}</div>'})

add('swipe', 'Surfaces', 'Swipe actions', 'Drag a row to the left to reveal quick actions (Archive, Delete), like in Mail.',
    'Use it in lists for the 1-2 most common actions; keep the same actions visible elsewhere too, since swipes are hidden.',
    {'css': ['swipe.css', 'list.css'], 'js': ['swipe.js']},
    {'label': 'Material swipe actions', 'note': 'Square action areas appear behind the row (the first one in your colour).',
     'snippet': '<div class="c-swipe c-swipe--md"><div class="c-swipe__actions"><button class="c-swipe__btn">Archive</button><button class="c-swipe__btn is-danger">Delete</button></div><div class="c-swipe__row"><ul class="c-list c-list--md"><li class="c-row"><span class="c-row__text"><b>Aina</b><small>See you tomorrow!</small></span><span class="c-row__trail">9:41</span></li></ul></div></div>'},
    {'label': 'Apple swipe actions (iOS 27)', 'note': 'Rounded capsule actions appear behind the row; in iOS 27 any item in a scrolling view can have them.',
     'snippet': '<div class="c-swipe c-swipe--ios"><div class="c-swipe__actions"><button class="c-swipe__btn">Archive</button><button class="c-swipe__btn is-danger">Delete</button></div><div class="c-swipe__row"><ul class="c-list c-list--ios" style="margin:0;border-radius:0"><li class="c-row"><span class="c-row__text"><b>Aina</b><small>See you tomorrow!</small></span><span class="c-row__trail">9:41</span></li></ul></div></div>'},
    demo={'page': '<div style="padding-top:32px">{snippet}{snippet}</div>', 'swipe': True})

ICONS = sorted({'archive', 'bookmark', 'check', 'chevron_right', 'delete', 'expand_more', 'inbox', 'info', 'ios_share', 'more_horiz', 'photo_camera', 'photo_library', 'remove', 'settings', 'share', 'unfold_more', 'wifi_off', 'add', 'arrow_back', 'chevron_left', 'close', 'chevron_right', 'edit', 'favorite', 'help', 'home', 'link', 'lock', 'menu', 'more_vert', 'notifications', 'person', 'search', 'send'})

# ---------- Fluent 2, Carbon and Ant Design versions (styles generated by systems.py into sys-<style>.css) ----------
SYSNAME = {'fluent': 'Fluent 2', 'carbon': 'Carbon', 'ant': 'Ant Design'}
# which existing markup each system reuses (the structure that matches it best)
BASE = {'segmented': {'fluent': 'md', 'carbon': 'ios', 'ant': 'ios'}, 'textfield': 'ios', 'sheet': 'ios', 'actions': 'ios', 'textarea': 'ios'}
NOTES = {
 'tabbar': ('White bar with a hairline; the active tab turns your colour with a small top indicator.', 'A dark Gray 100 bar, like the Carbon UI shell; a blue line marks the active tab.', 'A plain white bar; the active tab simply turns your colour.'),
 'appbar': ('A white bar with a hairline, left-aligned semibold title and square-ish icon buttons.', 'The dark Carbon shell header: Gray 100 background, small product title, 48 px icon buttons.', 'A white header with a hairline and a semibold 18 px title.'),
 'largetitle': ('A 28 px semibold title under the bar that slides into it as you scroll.', 'A large light-weight (300) Plex title, Carbon\'s expressive heading style, that collapses on scroll.', 'A 28 px title under a white bar that collapses into it on scroll.'),
 'segmented': ('Fluent tab list: text tabs with a short rounded underline under the selected one.', 'Carbon content switcher: joined square buttons; the selected one turns dark.', 'Ant Segmented: a light grey track with a white thumb that slides to the choice.'),
 'button': ('40 px buttons with 4 px corners: primary in your colour, secondary white with a grey edge, outline, subtle.', 'Square 48 px buttons with the label on the left: primary, secondary (dark grey), tertiary (outline), ghost.', '40 px buttons with 8 px corners: primary with a soft shadow, default white, dashed, link.'),
 'fab': ('A floating button with 8 px corners and a soft Fluent shadow.', 'A square 48 px primary button floating above the content.', 'Ant FloatButton: a round floating button in your colour.'),
 'textfield': ('Semibold label above a 40 px field whose bottom edge turns your colour while typing.', 'Small grey label above a 48 px grey field with a bottom border; a 2 px outline shows focus.', 'Label above a 40 px field with an 8 px border that glows softly in your colour on focus.'),
 'search': ('Fluent SearchBox: 4 px corners, darker bottom edge that turns your colour on focus.', 'Carbon search: a 48 px grey field with a bottom border, square corners.', 'Ant search input: white field with 8 px corners and a soft focus glow.'),
 'switch': ('Fluent toggle: an outlined 40 x 20 track whose knob fills and slides when on.', 'Carbon toggle: a 48 x 24 track that turns green (support-success) when on.', 'Ant Switch: a 44 x 22 pill that fills with your colour when on.'),
 'checkbox': ('Small rounded squares and circles that fill with your colour.', 'Carbon checkboxes fill dark (not blue), with square-ish 2 px corners; radios show a dark dot.', 'Ant checkboxes with 4 px corners that fill with your colour; ring radios.'),
 'slider': ('A thin track with a round knob ringed in your colour.', 'A 2 px track with a small 14 px knob in your colour.', 'A thin track with a white knob ringed in your colour.'),
 'card': ('White card with 8 px corners and the soft Fluent depth shadow (deeper when pressed).', 'Carbon tile: a flat grey square with no shadow.', 'Ant Card: white with an 8 px border, no shadow.'),
 'list': ('Rows split by hairlines with 15 px medium titles.', 'Carbon structured list: flat rows split by subtle lines, regular-weight text.', 'Ant List: rows split by lines with roomy 12 px padding.'),
 'sheet': ('A white panel with 8 px top corners, deep Fluent shadow, title on the left and close on the right.', 'A square panel with the title on the left and close on the right, no rounding.', 'Ant bottom Drawer: 8 px top corners, title on the left, close on the right.'),
 'dialog': ('Fluent dialog: 8 px corners, 20 px semibold title, buttons bottom right (primary last).', 'Carbon modal: square, regular-weight title, full-width split buttons along the bottom.', 'Ant Modal: 8 px corners, buttons bottom right (default, then primary).'),
 'snackbar': ('Fluent toast: a white card with 4 px corners and a soft shadow near the bottom.', 'Carbon toast: dark Gray 80 with a blue stripe on the left, square corners.', 'Ant message: a small white card that drops in at the top with a green tick.'),
 'progress': ('A 4 px bar and a round spinner in your colour.', 'An 8 px square bar and the bold Carbon loading ring.', 'Ant Progress: an 8 px rounded bar, and a slim spinner.'),
 'skeleton': ('Rounded grey placeholders with a soft shimmer.', 'Square grey placeholders with a shimmer.', 'Ant Skeleton: rounded grey bars with a moving gradient.'),
 'toolbar': ('A white floating bar with 8 px corners and a Fluent shadow.', 'A dark Gray 100 bar of 48 px icon buttons.', 'A white floating bar with 8 px corners and a soft shadow.'),
 'drawer': ('Fluent nav drawer: rows with 4 px corners; the current one gets a short accent bar on the left.', 'Carbon side nav: grey panel; the current row gets a blue edge on the left.', 'Ant Menu: the current row turns a light tint of your colour.'),
 'pagedots': ('Small dots; the current one stretches in your colour.', 'Small square dots; the current one stretches in your colour.', 'Ant carousel dots: short bars; the current one is longer.'),
 'iconbutton': ('40 px icon buttons with 4 px corners: subtle, primary, secondary, outline.', 'Square icon buttons: ghost, primary, secondary (dark), tertiary (outline).', '40 px icon buttons with 8 px corners: text, primary, default, outline.'),
 'chips': ('Fluent tags with 4 px corners; selected ones fill with your colour.', 'Carbon tags: small 24 px pills; selected ones turn dark.', 'Ant checkable tags: plain text; selected ones fill with your colour.'),
 'menu': ('A white menu with 8 px corners and a Fluent shadow.', 'A square white menu with a light shadow.', 'Ant Dropdown: 8 px corners and Ant\'s soft layered shadow.'),
 'actions': ('A white action list with 8 px corners and a separate Cancel.', 'A square action list with a separate Cancel.', 'A white action list with 8 px corners and a separate Cancel.'),
 'buttongroup': ('Joined buttons with 4 px outer corners; the chosen one fills.', 'Joined square buttons; the chosen one turns dark.', 'Ant Radio.Button group: joined with 8 px outer corners; the chosen one fills.'),
 'stepper': ('Fluent SpinButton style: - value + inside one field.', 'Carbon number input: - value + inside a grey field with a bottom border.', 'Ant InputNumber style: - value + inside one bordered field.'),
 'select': ('Fluent Dropdown: label above, 4 px field, arrow on the right.', 'Carbon dropdown: label above, 48 px grey field with a bottom border.', 'Ant Select: label above, 8 px field with a soft focus glow.'),
 'datetime': ('Fluent date and time fields with the label above.', 'Carbon date and time fields: 48 px grey fields.', 'Ant DatePicker / TimePicker style fields.'),
 'textarea': ('Label above a field whose bottom edge turns your colour while typing.', 'Grey 48 px-style area with a bottom border; a 2 px outline shows focus.', 'Bordered 8 px area with a soft focus glow.'),
 'otp': ('One small field per digit, Fluent style.', 'One grey square field per digit.', 'One bordered 8 px field per digit.'),
 'tooltip': ('A dark 4 px tooltip and a white popover card with a Fluent shadow.', 'A dark square-ish tooltip and a flat grey popover.', 'Ant Tooltip (dark) and Popover (white, 8 px corners).'),
 'accordion': ('Rows split by hairlines with semibold titles.', 'Carbon accordion: lines above and below, chevron on the right.', 'Ant Collapse: a bordered box with 8 px corners and grey headers.'),
 'carousel': ('Cards with 8 px corners and a soft shadow.', 'Square image tiles.', 'Cards with 8 px corners.'),
 'avatar': ('Round 40 px avatars on a light grey.', 'Round 40 px avatars on a light grey.', 'Ant Avatar: grey circles with white initials.'),
 'banner': ('Fluent MessageBar: a lightly tinted strip with 4 px corners and a border.', 'Carbon inline notification: tinted, with a coloured stripe on the left.', 'Ant Alert: a tinted box with 8 px corners and a border.'),
 'emptystate': ('The icon in a soft grey circle, semibold title.', 'The icon in a grey circle, regular-weight title.', 'Ant Empty: a large faint icon and a short grey line.'),
 'swipe': ('Square action areas in your colour and red.', 'Square action areas in your colour and red.', 'Square action areas in your colour and red.'),
}
for c in C:
    for k, x in enumerate(['fluent', 'carbon', 'ant']):
        b = BASE.get(c['id'], 'md'); b = b[x] if isinstance(b, dict) else b
        src = c['variants'][b]['snippet']
        snip = src.replace('--' + b, '--' + x).replace('data-c-toast="%s"' % b, 'data-c-toast="%s"' % x)
        c['variants'][x] = {'label': '%s %s' % (SYSNAME[x], c['name'].lower() if not c['name'][0].isupper() else c['name']), 'note': NOTES[c['id']][k], 'snippet': snip, 'base': b}

ORDER = ['Navigation', 'Actions', 'Inputs', 'Surfaces', 'Feedback']
C.sort(key=lambda c: ORDER.index(c['group']))   # stable: keeps the order within a group
out = {'version': 1, 'icons': ICONS, 'components': C}
here = os.path.dirname(os.path.abspath(__file__))
json.dump(out, open(os.path.join(here, '..', 'assets', 'manifest.json'), 'w'), indent=1, ensure_ascii=False)
print('%d components, %d icons' % (len(C), len(ICONS)))
