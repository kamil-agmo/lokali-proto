# Finding references

## Where to look (free, public)

- **App Store / Google Play listings:** official screenshots of shipped apps; best for mobile.
- **The product's own site:** feature pages often show real screens.
- **Public design galleries:** Dribbble and Behance (concept work: label it "concept", it is not shipped), Apple Design Award winners, Google Play's "Best of" lists, Material Design case studies.
- **Malaysian and regional apps** when the brief is local: Grab, Touch 'n Go eWallet, Shopee, Lazada, Maybank MAE, MySejahtera-era government apps, foodpanda.

Paid galleries (Mobbin, Page Flows) need the user's own login: only when the user offers.

## Picking

- Same users and platform as the brief first (an iPhone app for older users → references for older users on iOS).
- Mix: at least one direct competitor and one best-in-class app from another field.
- Skip anything that only looks good in a Dribbble shot but would not survive real content.

## The JSON for make_board.py

```json
{
  "title": "Food delivery: home screen",
  "brief": "Office workers ordering lunch in KL, iPhone first",
  "items": [
    {"id": "A", "name": "Grab Food", "url": "https://apps.apple.com/...", "image": "https://...png",
     "kind": "shipped", "take": "Big category chips, price always visible",
     "avoid": "Dense promo carousels", "fits": "Fast lunch decision"}
  ]
}
```

`kind` is `shipped` or `concept`. `image` may be empty (the card then shows the link). Keep every note under about 60 characters.

## Rules

- References inspire; nothing is copied: no logos, illustrations, photos or exact layouts in the prototype.
- Cite each link on the board and in `DESIGN.md`.
- Don't download images into the project.
