---
name: photos-as-links
description: "Load prototype photos by link (Unsplash URLs), never download or save them into the project"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 401356a4-0c59-43d8-bba9-36556ce10d36
  modified: 2026-11-27T04:44:12.783Z
---

Use photo links (e.g. `images.unsplash.com/photo-<id>`, via `L.img()` / `data-img`) for every photo in prototypes. Do not download photos into `assets/`.

**Why:** the user wants to save tokens; downloading and handling files costs far more than pasting a link. (Said 2026-11-27, Lokali.)

**How to apply:** find photos by searching unsplash.com in the browser and keep only the photo ID; when checking candidates, view them small and side by side in one screenshot. Related: [[be-brief]].
