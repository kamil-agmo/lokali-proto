# Install flows

What the visitor sees, how to place the controls, the settings, and how to test.

Contents: who sees what · placing the controls · settings · how it remembers · translating the steps · testing

## Who sees what

| Situation | Result |
|---|---|
| Android phone, Chrome / Edge / Samsung Internet, install offered by the browser | the banner's button says **Install** and opens the browser's own dialog (the prompt can be used once; if the visitor dismisses it, the button falls back to the steps) |
| Android phone before the browser has offered install, or in a browser that never does | the button says **How to install** and opens a three-step sheet (browser menu > Install app / Add to Home screen > confirm) |
| iPhone or iPad (iPadOS reports itself as a Mac but has touch; that is detected) | there is no install API, so the sheet explains Share > Add to Home Screen > Add |
| Inside another app's browser (Facebook, Instagram, TikTok, WeChat and similar) | the sheet starts with "open this in your browser first", because those views cannot add to the home screen |
| Desktop browser | nothing (use `?install` to force it for testing) |
| Already installed (`display-mode: standalone`, or iOS `navigator.standalone`) | nothing |
| Inside the presenter's frame | nothing |

Chrome offers install only on https (or localhost) with a valid manifest and a service worker; it also applies its own engagement rules, so the native dialog may not be available on the very first visit. That is why the steps sheet is always the fallback.

## Placing the controls

- **Banner:** put `data-install-banner` on `<body>` of the one entry page (the installer does this for the lock screen or `index.html`). It appears about 1.4 s after load as a card at the top, and "Not now" hides it for 7 days. One entry page is enough; on several pages it would nag.
- **Row:** any element with `[data-install-row]` is hidden unless installing is possible, and a tap runs the same flow. Use it for an "Install as app" row on a profile or settings screen (`assets/snippets/install-row.html`). The page must load `js/shared/install.js` (the installer does that for pages that contain a row when you run it again; `check.py` errors if one is missing). If your CSS gives the row class a `display` value, add `.row[hidden] { display: none; }`: a class's `display` beats the `hidden` attribute.
- **From your own code:** `window.AppInstall` has `eligible()`, `open()` (runs the flow), `banner()` (shows the banner ignoring the snooze), `installed()`, `platform()` (`ios`, `android`, `mobile` or `desktop`) and `canPrompt()`.

## Settings

Set `window.APP_INSTALL` in a script before `install.js`. Everything is optional.

| Key | Default | Meaning |
|---|---|---|
| `name` | `SHELL.name`, else the page title | the app name in the texts |
| `icon` | `assets/icons/icon-192.png` | the icon shown in the banner, relative to the site root |
| `prefix` | `SHELL.prefix`, else `app` | storage key prefix (`<prefix>-install-dismissed`) |
| `snoozeDays` | 7 | how long "Not now" hides the banner |
| `bannerDelayMs` | 1400 | delay before the banner appears |
| `sw` | `sw.js` | service worker path, relative to the site root |
| `text` | English | `title`, `body`, `install`, `how`, `notNow`, `gotIt`, `sheetTitle`, `sheetBody`, `stepsIos`, `stepsAndroid`, `openInSafari`, `openInBrowser` |

Colours and font come from CSS variables on the page: `--install-accent` (button and step numbers), `--install-accent-ink` (button text), `--install-font`.

## How it remembers

- "Not now" stores a timestamp in `localStorage` under `<prefix>-install-dismissed`; after `snoozeDays` the banner returns. The `appinstalled` event (or an accepted native prompt) stores `installed` there, and the banner never returns.
- `localStorage` is used on purpose: the presenter shell's reset clears `sessionStorage` only, so a reviewer who resets the prototype is not asked to install again.
- To see the banner again while testing, remove that key (in DevTools, or `localStorage.clear()` in the console) and reload.

## Translating the steps

The banner and sheet texts are plain strings in `text`. The steps are arrays of HTML strings that replace the built-in ones; `{share}` is the Share icon, `{menu}` the three-dots icon and `{name}` the app name:

```html
<script>
  window.APP_INSTALL = { name: 'Acme', text: {
    title: 'Pasang Acme', how: 'Cara memasang', notNow: 'Bukan sekarang', gotIt: 'Faham',
    stepsIos: ['Ketik butang Kongsi {share} di bar alat.', 'Pilih <b>Tambah ke Skrin Utama</b>.', 'Ketik <b>Tambah</b>. {name} muncul di skrin utama.'],
    openInSafari: 'Halaman ini dibuka dalam apl lain. Buka menu dan pilih <b>Buka dalam Safari</b> dahulu.'
  } };
</script>
<script src="js/shared/install.js"></script>
```

The same arrays are the place to correct wording when a new iOS or Android release renames a menu item. Steps are inserted as HTML, so they are the developer's own text, never visitor input.

## Testing

- **Logic, without a browser:** `node tests/test_install_logic.js` runs 17 checks against `assets/js/install.js` with a small fake browser (devices, snooze, installed, frames, settings, escaping). To test a project's own copy, run it with `INSTALL_JS=<path> node tests/test_install_logic.js`.
- **In a browser:** serve over http, make the window phone-sized (or an Android user agent), open the entry page. The banner appears after the delay. On a desktop add `?install`. Click through "How to install", the sheet, "Got it", and "Not now"; reload to confirm the snooze.
- **Faking iOS in a desktop browser:** run `install.js` again with a stand-in `navigator`, then call `AppInstall.open()`. Define every property the script reads, because inherited ones throw when read through a copy: `new Function('navigator', code)(Object.create(navigator, { userAgent: { value: '<an iPhone user agent>' }, maxTouchPoints: { value: 5 }, serviceWorker: { value: undefined } }))`, where `code` is the text of `js/shared/install.js`.
- **What a browser pane or emulator cannot show:** the service worker registering, the native Android dialog, the home-screen icon, the installed launch. Those need a real phone over https. State that when you hand over.
