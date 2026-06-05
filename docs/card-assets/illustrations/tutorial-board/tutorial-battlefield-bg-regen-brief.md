# Tutorial Battlefield Board Background Regeneration Brief

## Target Asset

- File to improve: `docs/card-assets/illustrations/tutorial-board/tutorial-battlefield-bg.png`
- Current size: `1672 x 941`
- Output type: raster PNG game board background
- Intended use: tutorial battlefield board background behind card slots

## Core Direction

Regenerate the battlefield as a true playable board background. The image should read as a complete war scene from a strict top-down view, while keeping the card zones clean and readable.

The board itself should not be drawn with cinematic perspective tilt. If the app needs tilt, that should be handled later with a UI transform or rotation value. The image asset should be a flat top-view board.

## Must Keep

- Dark ink-and-parchment fantasy war-board mood.
- Siege warfare atmosphere with walls, gates, banners, torches, barricades, stone, mud, ash, and worn battlefield texture.
- Clearly visible rectangular card placeholders.
- The existing broad layout logic:
  - Left upper side zone
  - Left lower side zone
  - Main battlefield row
  - Lower allied/defense row
  - Right upper, middle, and lower side zones
  - A central lower gatekeeper or fortified position

## Major Problems To Fix

### 1. Perspective

Current image has strong cinematic depth and a tilted board feeling. The regenerated image should be a clean orthographic top-down board.

Requirements:

- Strict top-down view.
- Parallel card-slot edges.
- No horizon line.
- No vertical scenery that implies camera perspective.
- Walls, towers, tents, supplies, and terrain can have painted detail, but they should be readable as top-down board objects.

### 2. Zone Readability

Current placeholders exist, but their gameplay meaning is hard to read visually. Each non-battlefield zone should have clear environmental identity around the slot, without relying on text labels.

Zone mapping:

- Left upper: Forward Base
- Left lower: Rear Base
- Right upper: Recruitment Camp
- Right middle: Burial Ground
- Right lower: Wilds

Suggested visual language:

- Forward Base: watchtower silhouettes from above, spear racks, red command flags, field barricades, signal brazier, a route leading toward the battlefield.
- Rear Base: supply crates, wagons, tents, reserve banners, stacked provisions, repair tools, safer defensive camp layout.
- Recruitment Camp: muster yard marks, training dummies, weapon racks, roll-call banners, orderly camp geometry.
- Burial Ground: broken grave markers, ritual stones, ash, dark earth, subdued blue-gray or violet accents, fallen standards.
- Wilds: roots, dense brush, stones, animal tracks, green-black overgrowth, rough natural border that feels uncontrolled.

### 3. War Narrative And Board Cohesion

The image should feel like a single battle system, not disconnected decorated rectangles.

Required connective details:

- A supply road should connect Rear Base to Forward Base.
- A road or trampled combat path should connect Forward Base into the main battlefield row.
- The central lower fortified/gatekeeper position should include a clear wall-and-gate structure.
- The path to the gatekeeper position should feel defended by walls, palisades, barricades, or guard posts.
- Main battlefield slots should sit in a contested central lane, with churned mud, cracked stone, scorch marks, arrows, broken shields, and directional movement cues.
- Side zones should be visually distinct but still part of the same siege map.

## Card Placeholder Requirements

- Slots must remain functional, clean, and visually calm enough for cards to sit on top.
- Slot interiors should have lower contrast than their surrounding environmental details.
- Borders may use color accents, but the environment should carry most of the semantic meaning.
- Avoid adding text labels inside the image unless explicitly approved.
- Avoid large objects inside slot interiors that would compete with cards.
- Decorative objects should sit around or between slots, not on the card placement area.

## Composition Proposal

Use a strict top-down siege-board layout:

- Center: two horizontal rows of card slots representing battle lines.
- Top edge: enemy fortress wall with gate, battlements, banners, and siege damage, drawn top-down or near-symbolic enough not to create horizon perspective.
- Bottom center: allied gatekeeper/fortified platform with stone walls and a gate threshold.
- Left side:
  - Forward Base above, more exposed and militarized.
  - Rear Base below, more logistical and protected.
  - A visible supply road links Rear Base to Forward Base, then branches into the battlefield.
- Right side:
  - Recruitment Camp above with ordered training/muster elements.
  - Burial Ground in the middle with grave and ritual motifs.
  - Wilds below with organic terrain and overgrowth.
- Use roads, trenches, wall segments, banners, debris trails, and terrain transitions to bind every zone into one war map.

## Style Prompt Notes

- Style: dark tactical fantasy board-game illustration, hand-painted ink texture, parchment-stained stone and mud, Korean dark-fantasy siege mood.
- Camera: orthographic top-down.
- Mood: grim, strategic, immersive, war in progress.
- Color: restrained earth, stone gray, soot black, muted red/yellow/blue/green/violet zone accents.
- Lighting: subtle torch glow and ember highlights, but no dramatic side-lit perspective.
- Avoid: text, labels, UI buttons, characters dominating the board, photorealism, tilted perspective, isometric camera, horizon, overly busy slot interiors.

## Open Questions Before Generation

1. Should the regenerated image replace `tutorial-battlefield-bg.png` directly, or should it first be saved as a sibling candidate such as `tutorial-battlefield-bg-v2.png`?
2. Should the card slot count and exact slot positions stay identical to the current image, or may the layout be slightly adjusted for better top-down readability?
3. Should the final image contain zero text, or are tiny symbolic markings/icons inside zone borders acceptable?
4. Do you want the existing color coding preserved closely, or should the new image lean more on environmental identity and use color only as subtle accents?

## My Recommended Answers

1. Generate a sibling candidate first: `tutorial-battlefield-bg-v2.png`.
2. Keep the current slot count and broad positions, but allow small alignment/spacing refinements.
3. Use zero readable text. Allow only symbols, sigils, scratches, and faction-like marks.
4. Keep color accents, but make environmental identity the main readability mechanism.

## Approved Decisions

- Save the regenerated asset as a sibling candidate first: `tutorial-battlefield-bg-v2.png`.
- Preserve the current slot count and broad layout, with minor alignment and spacing refinements allowed for top-down readability.
- Do not include readable text in the image.
- Symbolic markings, sigils, scratches, and faction-like marks are allowed.
- Use color accents as secondary cues; make environmental objects and terrain identity the primary way to read each zone.

## Feedback After V2

The V2 battlefield illustration is clearer and more top-down, but the stronger direction should be a war-room strategy map concept rather than a literal battlefield scene.

New conceptual direction:

- Treat the asset as a tactical campaign board laid out on a command table during a war council.
- The surface should feel like a strategic siege map: parchment, inked terrain, fortress diagrams, supply routes, unit markers, command pins, wax seals, small wooden/metal tokens, string lines, and marked battle lanes.
- It should still feel dark fantasy and siege-focused, but more like officers are planning the battle over a map than like the camera is hovering above the actual battlefield.
- This should improve board readability because zones can be represented as map regions, symbols, tokens, and tactical objects rather than dense scenic terrain.

Strict slot-count and layout correction:

- Do not add any extra card slots.
- Only field-soldier slots are square.
- Field soldiers must use exactly 5 square slots.
- Gatekeepers must use exactly 4 horizontal landscape slots.
- The lord/castle ruler slot must be horizontal landscape.
- All remaining support zones are vertical portrait card zones.
- Field-soldier and gatekeeper slots should follow the previous board's formation logic: the 5 square field-soldier positions form the forward battle line, and the 4 horizontal gatekeeper positions sit behind them in a staggered diagonal relationship rather than forming an extra row of square battlefield slots.
- Side/support zones should remain represented as their own zones, but must not accidentally create additional playable card-slot rectangles.

Implications for the next generation:

- Use clearly intentional slot placeholders only where gameplay requires them.
- Decorative map panels, labels, borders, boxes, or terrain regions must not look like extra playable slots.
- The strategic-map treatment should use roads, arrows, supply routes, command strings, and token clusters to show relationships between zones.
- Forward Base and Rear Base can be connected by an inked supply road or string line with tokens.
- Forward Base can connect into the field-soldier lane with attack arrows or troop-route markings.
- Gatekeeper positions should feel like defensive checkpoints around the fortress/gate approach, not a single large scenic platform.

## Final Slot Layout For Next Generation

Use the previous board as the layout reference, but correct the slot semantics:

- Field soldier area: exactly 5 square slots. These are the only square playable slots in the image.
- Gatekeeper area: exactly 4 horizontal landscape slots. Place them behind the field-soldier line in a staggered diagonal formation, echoing the previous board's lower defensive row relationship to the forward row.
- Lord/castle ruler area: exactly 1 horizontal landscape slot, visually protected behind or within the gatekeeper defensive formation.
- Forward Base: 1 vertical portrait support zone on the upper-left side.
- Rear Base: 1 vertical portrait support zone on the lower-left side.
- Recruitment Camp: 1 vertical portrait support zone on the upper-right side.
- Burial Ground: 1 vertical portrait support zone on the middle-right side.
- Wilds: 1 vertical portrait support zone on the lower-right side.
- Do not create any other rectangular regions that could be mistaken for playable slots.
- Decorative tactical-map elements such as parchment panels, route boxes, fortress diagrams, folded map edges, token trays, and terrain regions must stay visually subordinate and must not read as card slots.

Recommended strategic-map composition:

- Overall concept: a war-room strategy map on a command table, not a literal battlefield flyover.
- Center-forward: 5 square field-soldier slots, arranged as the main contested line.
- Center-rear: 4 horizontal gatekeeper slots, staggered diagonally behind the field soldiers as defensive checkpoints.
- Rear-center: 1 horizontal lord slot, nested behind the gatekeeper formation with fortress/gate symbolism.
- Left side: Forward Base above Rear Base, connected by a supply route line, red pins, cord, and command tokens.
- Right side: Recruitment Camp, Burial Ground, and Wilds as three vertical support zones, separated by map symbols and objects rather than extra box frames.
- Use inked arrows, thread, pins, command markers, and supply-route markings to show that Rear Base feeds Forward Base, Forward Base feeds the field soldiers, and the gatekeepers defend the route to the lord.

## Feedback After V3

V3 successfully moved toward a war-room table map, but the result is too beige and visually flat. The support zones still do not communicate their meaning strongly enough, and model-drawn placeholder proportions are unreliable.

V4 direction:

- Keep the war-table strategy-map concept, but add clearer color temperature and zone contrast.
- Make each support zone immediately readable through surrounding props, map symbols, terrain tint, and token clusters.
- Do not rely on AI-drawn slot borders for exact card geometry.
- Prefer leaving clean empty placement areas where the UI or a deterministic overlay can place exact placeholders.
- Avoid decorative rectangles that could be confused with playable card slots.

Exact slot geometry from the current field board CSS:

- Overall field-board coordinate system: `600mm x 300mm`, aspect ratio `2:1`.
- Standard card portrait footprint: `63mm x 88mm`.
- Standard card landscape footprint: `88mm x 63mm`.
- Field soldier footprint: `88mm x 88mm`; square side length equals standard card width.
- Field soldiers: 5 exact square positions, each `88mm x 88mm`.
- Gatekeepers: 4 exact landscape positions, each `88mm x 63mm`.
- Lord/castle ruler: 1 exact landscape position, `88mm x 63mm`.
- Forward Base, Rear Base, Recruitment Camp, Burial Ground, Wilds: each exact portrait position, `63mm x 88mm`.

Recommended V4 asset strategy:

- Generate the background with clean reserved placement areas rather than hard placeholder boxes.
- Reserve each placement area as a quiet, low-detail patch of parchment/table-map texture.
- Put the identifying objects and color accents around the reserved areas, not inside them.
- Let the UI or a later deterministic overlay draw the exact placeholder borders and labels.

V4 zone readability targets:

- Forward Base: red command cluster, watchtower marker, spear pins, red attack cord, signal-fire token.
- Rear Base: warmer yellow supply cluster, crates, wagons, sacks, repair tools, reserve tokens, cord route to Forward Base.
- Recruitment Camp: saturated blue muster cluster, formation tokens, weapon racks, training target marker, orderly pin grid.
- Burial Ground: orange-violet ash area, bone/marker tokens, black candles, broken standard, grave diagram marks.
- Wilds: saturated green-black overgrowth area, roots, stones, trail marks, irregular terrain wash, scout tokens.
- Field soldiers: contested red-brown battle lane, attack arrows and troop markers around the five clean square spaces.
- Gatekeepers and lord: gold/green fortress defense band, wall diagram, gate diagram, shield tokens, defended route into the lord area.

## Feedback After V4

V4 made the zones more colorful and readable, but leaving clean parchment card spaces caused the image model to draw visible patch-like placeholders with unreliable proportions.

V5 direction:

- Do not leave blank placement patches.
- Do not draw placeholder boxes, empty rectangles, or card-shaped reserved spaces.
- Build a complete natural war-table map background where each gameplay zone is suggested by terrain, objects, color accents, command tokens, and route lines.
- The DOM/UI layer will draw transparent or semi-transparent card overlays with exact geometry.
- The background should support the known board layout, but it should not itself try to define exact slot boundaries.
- Keep the underlying detail moderate so transparent overlays remain readable, but avoid obvious empty areas.

V5 composition intent:

- Upper central battle lane: five implied field-soldier positions represented by a continuous contested red-brown route with five subtle command-token clusters, attack arrows, and troop marks, not square boxes.
- Middle defensive lane: four implied gatekeeper positions represented by four fortress/shield checkpoint clusters in a staggered defensive line, not horizontal boxes.
- Lower center: lord/castle ruler region represented by a fortified castle plan, command seal, gate diagram, banners, and defended route, not a landscape card patch.
- Upper-left: Forward Base as a red forward command outpost region.
- Lower-left: Rear Base as an ochre supply/logistics region.
- Upper-right: Recruitment Camp as a blue muster/training region.
- Middle-right: Burial Ground as an orange-violet ash/grave region.
- Lower-right: Wilds as a green-black overgrown/exile region.

## Feedback After V5

V5 removed placeholder patches and made the regions readable, but it became too ornamented and visually busy for a TCG playmat background.

V6 direction:

- Remember this is a TCG mat background first, not a full illustration packed with objects.
- Reduce object count heavily.
- Use broad, quiet map texture, subtle terrain washes, and a few readable landmark objects per region.
- Keep enough negative space and low-contrast texture for cards and transparent DOM overlays.
- The zone identities should be visible at a glance, but not noisy.
- Prefer 1-3 clear props or symbols per support zone instead of many small tokens.
- Center battle and gate lanes should be mostly calm parchment/terrain with subtle route lines, not crowded with pins and figures.

V6 visual density target:

- 70% quiet map/table surface.
- 20% soft colored region washes and route lines.
- 10% landmark props and tokens.

V6 zone landmark targets:

- Forward Base: one watchtower symbol, one red banner/standard, one signal brazier or red route line.
- Rear Base: one wagon or crate stack, one ochre supply route, a few sacks.
- Recruitment Camp: one weapon rack or target marker, one small blue formation mark.
- Burial Ground: a few grave markers, ash stain, one broken standard or candle.
- Wilds: root shapes, stones, green wash, one scout trail.
- Battle lane: subtle red-brown route with five faint positional marks, no crowded unit clusters.
- Gate/lord lane: simple fortress plan, four subdued shield/checkpoint marks, one castle seal.

## Feedback After V6

V6 reduced clutter enough for a TCG mat, but it became too simplified and too dark. The war-table fantasy should be more present and the image should read more clearly at a glance.

V7 direction:

- Balance V5 and V6: clearly a war council table, but not a cluttered miniature battlefield.
- Increase overall brightness and readability.
- Use warmer parchment, clearer midtones, and visible colored zones.
- Bring back a few larger war-table props: map weights, wax seals, compass, dagger, scroll edge, command cords, and a few distinct tokens.
- Avoid many tiny figures, dense pin clusters, or high-frequency texture.
- Keep the center card-play lanes readable under DOM overlays.

V7 visual density target:

- 55-60% quiet readable map surface.
- 25-30% broad colored region washes, route lines, and fortress/battle diagrams.
- 10-15% larger readable war-table props and landmark objects.

V7 lighting target:

- Brighter than V6.
- Warm candlelit parchment with clear midtones, not a dark vignette.
- Edges may be darker wood, but the play area should remain readable.
