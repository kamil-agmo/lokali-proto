# Animation export formats

All formats are generated from one **spec** (`DevMode.anim.buildSpec(element)`), read with the Web Animations API (`element.getAnimations({ subtree: true })`). That includes CSS animations and transitions and script-driven Web Animations. Only animations running at the moment of export are seen.

| Format | File | What it is | Fidelity and limits |
|---|---|---|---|
| **Flutter** | `<name>_animations.dart` | a class with one `AnimationController` per animation, `TweenSequence` tweens for opacity, translate X/Y, scale X/Y and rotate, and a `Widget name({required Widget child})` wrapper per animated element (`AnimatedBuilder` + `Opacity` + `Transform`) | Percent translations are converted to pixels; negative delays start part-way through the loop. Other properties are listed as `TODO match by hand`. Not compiled here: check in a sample app. |
| **SwiftUI** | `<Name>Animations.swift` | a `ViewModifier` per element with `TimelineView(.animation)`, an `.xxxAnimated()` extension, and a small runtime (`motionBezier`, `motionValue`, `motionProgress`) | Type-checked with `swiftc`. Needs iOS 15+. Delay, iterations, alternate and cubic-bezier easing supported. |
| **Jetpack Compose** | `<Name>Animations.kt` | a `@Composable fun Modifier.xxxAnimated()` per element: `rememberInfiniteTransition` / `Animatable`, `keyframes { v at ms using CubicBezierEasing(...) }`, `graphicsLayer` | Where Compose applies a keyframe's easing (segment before or after) was not verified: compare one animation in a preview. Not compiled here. |
| **React Native** | `<name>-animations.js` | a `useXxxAnimated()` hook per element for react-native-reanimated 3 (`withRepeat`, `withSequence`, `withTiming`, `Easing.bezier`, `withDelay`) returning an animated style | Syntax-checked. Negative delays become 0. `transformOrigin` needs a recent RN. |
| **Lottie** | `<name>.lottie.json` | one rectangle layer per animated element with position, scale, rotation and opacity keyframes (loops repeated to fill the longest) | Layers are coloured boxes carrying the motion, to be replaced with artwork. Not seamless if loop lengths differ. |
| **CSS** | `<name>.animation.css` | the `@keyframes`, the rules that style the element and its children, and the custom properties they read | Selectors are kept as in the prototype. |
| **HTML** | `<name>.animation.html` | one standalone file that plays on its own (images embedded; fonts via the page's Google Fonts links) | Script-driven parts are frozen at their current state. |
| **JSON spec** | `<name>.animation.json` | the neutral description: elements, rects, style, tokens, keyframes, timing, notes | The input for building other languages. |
| **WebM / GIF** | `<name>.animation.webm` / `.gif` | a recording of the element for 3 to 10 s (the longest loop) | Uses screen capture (the user must pick "This tab"); blocked in many embedded browsers. The GIF is encoded in the page: 216-colour palette with dithering, 12 fps, up to 420 px wide. Dev overlays are hidden while recording. |

## What no format captures

- Motion driven by timers or `requestAnimationFrame` (numbers counting up, charts drawing): the Web Animations API does not see them. The notes say so.
- Animated properties other than movement, scale, rotation and opacity (for example `background-position`, colour, size): listed as "match by hand" with their keyframe values.
- Animations on pseudo-elements are exported but flagged.
- Blur, glow and gradients are not translated.

## Spec shape (abridged)

```json
{ "name": "energy-flow", "generatedFrom": { "page": "...", "element": "..." }, "size": { "width": 370, "height": 420 },
  "elements": [ { "id": "streak1", "selector": "...", "rect": { "x": 0, "y": 0, "w": 2, "h": 60 },
    "style": { "background": "rgba(...)", "backgroundToken": "--surface", "borderRadius": "2px", "transformOrigin": [0.5, 0.5] },
    "animations": [ { "name": "flow-rise", "durationMs": 6600, "delayMs": -2600, "iterations": "infinite", "direction": "normal",
      "keyframes": [ { "offset": 0, "easing": "linear", "props": { "opacity": "0", "transform": "translateY(0px)" } } ] } ] } ],
  "notes": [ "..." ] }
```

`tests/spec.json` is a worked example with delays, alternate direction, finite iterations and an unsupported property.
