# Week 5 — Orbital Cleaner 3D

A virtual creature built with p5.js classes, rendered in 3D (WEBGL).

## Concept

Year 2087. Earth's orbit is choking on space debris. You are a young **Orbital Guardian** —
a creature born to eat space junk and keep Earth safe. But the **Void Maw**, a rival monster
that feeds on the same debris, has awakened. Eat junk, evolve, fight the Maw, and clean
100 debris across 10 zones to restore the orbit.

## How to run

1. Go to https://editor.p5js.org/
2. Create a new sketch, replace the contents of `sketch.js` with this file.
3. Press Play.

## Controls

- **Move mouse** — a light follows your cursor and lures the guardian toward it.
- **Click the Void Maw** — zap it (costs 5 energy). It shrinks, calms down, and spits out debris.
- **Click empty space** — drop debris to feed the guardian (classmates can feed it too).
- **R** — restart after winning.

## Classes

- `Star` — twinkling background stars at different depths.
- `Debris` — tumbling 3D space junk in 4 kinds: satellite (solar panels + blinking beacon),
  rocket stage, crystal shard, bolt.
- `Creature` — the guardian. Follows the mouse light, eats debris, slowly gains energy and
  size (capped). Evolves through 3 life stages (Whelp → Guardian → Elder Guardian):
  body color blends blue → teal → gold, spikes grow 3 → 12, halo ring at 3 meals,
  ward orbs from 6 meals, inner ring at 9 meals. Eyes follow the mouse; mouth opens
  when food is near.
- `Maw` — the rival Void Maw. Competes for the same debris; after 6 meals it gets
  enraged and hunts you. Ramming it costs you energy. Zap it by clicking to fight back.

## Game systems

- **10 stages** — every 10 debris advances to a new zone: Earth Orbit, Lunar Pass,
  Mars Approach, Asteroid Belt, Jupiter, Saturn, Deep Field, Nebula, Black Hole,
  Galactic Core. The Maw gets slightly faster in later stages.
- **HUD** — cleanup progress (x/100), energy bar, next-evolution progress bar,
  Maw threat status (Calm / Hungry / Enraged).
- **Win** — clean 100 debris → "Orbit Clean" screen.

## AI usage (as required by the assignment)

I used an AI assistant while building this. I had it explain every line I didn't
understand and applied the code in small steps. The key prompts I used:

1. "Create a virtual creature with classes in p5.js — a creature that eats floating
   space debris, grows as it eats, and is lured by the mouse light."
2. "Make it look like a space guardian, not just a circle — halo, spikes, glowing core."
3. "Limit how fast it grows; instead change its shape more often. Add eyes and a mouth,
   and make the debris more detailed, like real trash."
4. "Add a story and game-like UI: show progress toward the next stage, and add a
   space monster it has to fight while eating."
5. "Add 10 stages — a new background every 10 debris eaten."
6. "Can p5.js do 3D instead of flat 2D? Convert the sketch to WEBGL."
7. "The 3D version looks flat/white — debug the materials and lighting."
   (Fixes found: in WEBGL, `fill()` sets the base color while `specularMaterial()`
   only tints highlights; light intensities add up, so they must be balanced;
   leftover material state must be reset before drawing a 2D HUD texture.)
