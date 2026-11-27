# Extending dev mode

## The `DevMode` object (from `devmode.js`)

| Member | Use |
|---|---|
| `DevMode.isOn()`, `doc()`, `win()` | state and the document/window of the page inside the phone (null when none) |
| `DevMode.pinned()` | the element pinned with Shift + click (or null) |
| `DevMode.on(name, fn)` | hooks: `attach` (a page was hooked), `detach`, `redraw` (scroll or resize), `load` (the iframe loaded), `pin` (pin changed), `on`, `off` |
| `DevMode.parts.push(fn)` | `fn()` returns an HTML string; it is rendered under the tips, in order. Re-render with `DevMode.renderTop()` |
| `DevMode.renderTop()` | re-render the tips and all parts |
| `DevMode.tokName(kind, value)` | the best token name for a value (`kind`: `color`, `sp`, `r`, `fs`, `lh`, `h`, `shadow`) |
| `DevMode.esc`, `r1`, `px` | helpers |

`DevMode.anim` (from `devanim.js`) has `addFormat`, `buildSpec(element)`, `tracks`, `nameOf`, `selOf`, `parseTransform`, `save(text, name, mime)`, `flash(message)`, `setBusy(key)`, `target()` (the pinned element or isolated section) and `gen` (pure generators by key, used by the tests).

## Add an export format

```js
DevMode.anim.addFormat({ k: 'xml', title: 'Android XML', sub: 'ObjectAnimator' }, function (target) {
  var spec = DevMode.anim.buildSpec(target);
  DevMode.anim.save(myGenerator(spec), spec.name + '.xml', 'text/xml');
});
DevMode.anim.gen.xml = myGenerator;      // optional: lets tests call it without a browser
```

Put the entry in the right group by adding its key to `GROUPS` in the dropdown in `devanim.js`. Use `tracks(el, animation)` to get per-property keyframes (opacity, tx, ty, sx, sy, rot in radians) with the easing of each segment.

## Add a tip

Add a line to the `TIPS` array in `devmode.js`: `['<kbd>Key</kbd>', 'what it does.']`.

## Add a block under the tips

```js
DevMode.parts.push(function () { return '<div class="dvimg"><button ...>My tool</button></div>'; });
```

Keep markup inside `#dvTop` styles (`.dvimg`, `.dvsec`, `.dvdrop`) so it matches. Listen for clicks on `#inspector` with event delegation, since the panel re-renders.

## Adding a generator test

Add an assertion to `tests/run_generators.sh` and, if needed, a case to `tests/spec.json`. Compilers for Kotlin and Dart are not assumed to be installed.
