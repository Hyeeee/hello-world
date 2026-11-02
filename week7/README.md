# Bungeoppang Master 🐟

A one-button 3D game: run a night-time street stall in Seoul, bake *bungeoppang* (fish-shaped bread) on a rotating 8-mold machine, and serve the customers in line.

**▶ Play:** https://hyeeee.github.io/hello-world/week7/
**Also live at:** https://bungeoppang.netlify.app

## How to play (120 seconds)

One button: **SPACE / click / tap**. `M` mutes, `L` switches Korean / English.

1. **Hold → release** to pour batter. Let go in the green zone.
2. **Hold → release** to pipe red bean from head to tail. Let go at the flag.
3. The lid closes and the wheel turns to the next empty mold.
4. Molds keep cooking, flip on their own, and pop out when golden.
5. Once the rack holds enough fish for the first customer's order, it is bagged and served automatically. Customers who wait too long walk away.

## How it works

- **State machine:** `S.fs` tracks the front mold (`opening → pour → bean → cover → closing → rotating`). The single button does something different in each state.
- **Rotating wheel:** 8 molds sit on one rotor group, so turning the wheel is a single `rotation.y`. Each mold has its own cooking value. `autoTake()` pops a mold out when it turns golden, and `nextFrontStep()` skips molds that are still busy.
- **Fish shape:** blurring the fish silhouette gives a thickness map that lifts a dense mesh. The body ends up plump and the fins and tail thin. Scales use a bump map.
- **Red bean:** a `TubeGeometry` grows from the head toward the nozzle while the button is held.
- **Customers:** a queue with a patience bar per customer. HTML speech bubbles follow the 3D heads using `project(camera)`.
- **Sound:** all music and sound effects are synthesized with the Web Audio API, with no audio files.

## Files

| File | Role |
|---|---|
| `index.html`, `style.css` | 3D canvas and HTML UI |
| `js/main.js` | Game loop, input, state, UI |
| `js/stall.js` | Street stall, rotating wheel, cooling rack, customers |
| `js/models.js` | Fish, batter, red bean, kettle, piping bag, paper bag |
| `js/textures.js`, `js/art2d.js` | Textures drawn in code, fish outline |
| `sound.js`, `i18n.js` | Sound and Korean/English text |

**Built with:** Three.js (r170). Use a local server (e.g. Live Server) to run it, because ES modules don't load from `file://`.
