# Final project proposal

Hello World final project · Week 11
Marin Chung

My main direction is **Atmos as a daily mood journal**. I also have four other directions at the end, so I can talk them through with you and pick one. See [Other directions](#other-directions).

**Atmos:** https://atmos-cd-347fa3dcbb.netlify.app/

## A. Atmos as a daily mood journal (main)

Atmos is a small web app I made in September. It puts live weather and mood journaling in the same place and asks one question, *What's the weather inside you today?* Everyone's answers show up on a shared globe.

For the final I want to keep Atmos but change what it's mainly for. Right now it feels like a weather app with a mood line added. I want it to become **a mood journal you can use every day, where the weather is the background of each entry** instead of the main thing on the screen.

**Why.** People already check the weather in their weather app before they go out, so Atmos doesn't need to compete with that. What no weather app does is help you notice how you feel and keep it. That's the part I want to grow.

**Who it's for.** People who'd like a small daily habit of writing down how they feel, without it feeling like a big diary. Classmates and friends who haven't used Atmos can help test it.

## Where it is now

![Atmos today](img/atmos-before.jpg)

**Weather takes most of the screen.** The big temperature, the 7-day forecast, the timeline, the globe and the weather modes come first. The journal is a small panel on the side, and on a phone it's below all of that, 3 or 4 screens down.

![Atmos on a phone, the check in is in the middle column](img/atmos-phone-before.jpg)

**The journal part is thin.**
- You pick one of six moods and write up to 240 characters. That's it.
- There's no way to add a photo or say how strong the feeling is.
- You can't look back at your own entries over time, so there's no reason to keep a journal here.
- 162 devices visited Atmos, but only 31 people posted, and only 3 posted more than once.

**The design system isn't consistent.** I built Atmos fast while vibe coding, so the same kind of thing often looks a little different.
- There are 22 different font sizes, 13 corner radius values and 18 spacing values.
- Toggles, inputs and mood tags each look different in different places.

## How I'll improve it

**1. Make the journal the main thing**
- The first screen opens on today's entry, not the temperature.
- The forecast, timeline and weather modes fold away or move back. The globe stays as an "Under the same sky" view of other people's entries.
- Each entry saves the weather automatically, like "Nov 23, New York, Cloudy 48°, I feel Foggy."

**2. More ways to express how you feel**
- **Writing.** A prompt that fits your mood helps you start, like "What feels a little blurry right now?" for Foggy. You can write a line or keep going.
- **Photo.** Add one photo of the sky or a moment from the day.
- **How strong.** Show how much you feel it, from a little to a lot, so two Calm days don't look the same.

**3. A place to look back**
- My entries on a calendar or timeline, each day shown as its mood glyph with the weather next to it.
- Tap a day to read what you wrote and see the photo.

**4. Private first**
- Entries are only for you by default. You can choose to share one to "Under the same sky."

**5. One design system**
- A small type scale, radius scale and spacing scale saved as tokens.
- The same style for every toggle, input and tag.
- Keep the rule that's already there. Serif is for people's words and feelings, and sans is for the interface and data.

**Scope**

| Priority | What |
|---|---|
| Must | Journal first layout, weather moved to the background of each entry |
| Must | Writing with a prompt that fits your mood, longer entries allowed |
| Must | My entries view (calendar or timeline) |
| Must | Design tokens and shared styles applied across Atmos |
| Should | One photo per entry, private only at first |
| Should | How strong the feeling is |
| Should | Works well on a phone without long scrolling |
| Nice | Better ways to share an entry to the globe |

**Stopping point.** Someone new can write an entry with a mood, a few lines and the weather saved, and find it again later in their own entries, on a phone and on a laptop.
**What I'd cut first.** Photos, since they need storage and raise privacy questions. The journal still works without them.

## How I'll test it

I can't prove that people will use it every day in three weeks, so I'm testing whether writing in Atmos feels like journaling.

**Small experiment for this week.** Before changing anything, I'll watch 3 people who have never used Atmos try it on their phones. I'll only say "this is Atmos, try writing down how you feel today" and won't help. Then I'll ask two questions.

- Did they find where to write? How long did it take?
- Where did they get stuck or hesitate?
- Did they finish?
- "Does this feel more like a weather app or a journal?"
- "What else would you want to add to say how you feel?"

**Prediction.** I think people will read it as a weather app first, scroll past the journal on a phone, and say one line isn't enough to feel like a journal.

**Results.** *(to fill in after testing)*

| # | Found where to write | Time | Got stuck at | Finished | Weather app or journal? | Would want to add |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

**For the prototype (Nov 30).** I'll do the same test with the journal first version and compare.

## Other directions

These are four other ideas I'd also be happy to make. Each one uses the same kind of plan as Atmos, so they're easy to compare.

### B. Bungeoppang stall, a slow multiplayer street food game

**The idea.** A calm web game where you open a 붕어빵 (Korean fish shaped pastry) stall on a map of Seoul or set out as a customer and buy from other people's stalls. There's no timer or score. You pour batter, add red bean or custard and wait for it to turn golden.
**Who it's for.** Anyone who misses winter street food in Korea, and people who've never tried it.
**Why me.** I already made a one button 붕어빵 game for Week 7. This takes it further, and the culture is something I know well.
**Must.** Making 붕어빵 with touch on a phone, one shared map where you can see other stalls, and buying from someone else.
**Riskiest unknown.** Whether real time multiplayer works smoothly on phones.
**Spike.** Two phones that show each other's stall and a sale happening live, using Supabase.

### C. Leather pattern maker, a small design tool

**The idea.** A tool where you set the size of a card wallet or pouch and it draws the sewing pattern for you, with stitch holes and seam allowance, ready to print at real size.
**Who it's for.** People starting leather craft, like I was when I began Lof Archive.
**Why me.** I taught myself leather craft and made my own label, so I know where beginners get stuck. It's also the "build a design tool" path from the course.
**Must.** Two or three item types, size controls, a live preview and a print at 100% scale.
**Riskiest unknown.** Whether the printed pattern is accurate enough to actually cut and sew.
**Spike.** Make a card wallet pattern, print it, cut it from scrap leather and measure where it's off.

### D. Hangul blocks, an interactive type study

**The idea.** A playful way to see how Korean letters stack into syllable blocks. You drag consonants and vowels together and the block reshapes itself live, with variable type and motion.
**Who it's for.** Classmates and friends who see Hangul all the time but don't know how it's built.
**Why me.** I'm a native speaker and a designer, so I can explain the system and care about how it looks. It's the typography and generative graphics path.
**Must.** Building any basic syllable by dragging, smooth reshaping when a letter is added, and a short guided first try.
**Riskiest unknown.** Whether the block can reshape cleanly for every combination without looking broken.
**Spike.** Ten common syllables built in p5.js or SVG, then checking which ones look wrong.

### E. Interview rehearsal partner

**The idea.** A small voice app for practicing interview answers out loud. You answer a common design interview question, then see your answer as text with the filler words, long pauses and the parts you rushed.
**Who it's for.** People practicing interviews in a second language, like me getting ready for summer internships.
**Why me.** It's a real problem I have right now, and I'd be the first tester. It's the voice and character path.
**Must.** One question at a time, record and transcribe, and a simple view of fillers and pace.
**Riskiest unknown.** Whether speech recognition handles a non native accent well enough to be useful and not discouraging.
**Spike.** Record five of my own answers with the browser's speech recognition and check how many words it gets wrong.

### How they compare

| | A. Atmos journal | B. Bungeoppang stall | C. Leather patterns | D. Hangul blocks | E. Interview partner |
|---|---|---|---|---|---|
| Course path | Website or small app | Game | Design tool | Typography | Voice |
| Starting point | Existing app with real users | Week 7 game | New | New | New |
| Riskiest part | Making it feel like a journal | Real time multiplayer | Print accuracy | Every letter combination | Accent recognition |
| Easy to test with people | Yes | Yes, needs 2+ people | Needs leather and time | Yes | Yes |
| Fits in three weeks | Yes | Tight | Yes | Yes | Yes |

### What I'd like your thoughts on
- Is improving an existing project like Atmos enough for a final, or is a new project better?
- Which riskiest part sounds most worth learning from?
- Is B too big for three weeks if I cut multiplayer to a Should?

## Working notes

- **Source.** Atmos is built in Claude Design and deployed on Netlify. I'll make changes there. Data is in Supabase (`posts`, `devices`, `metoo`, `visits`).
- **New data.** Photos would need Supabase Storage and a column for the photo and the feeling's strength. Weather is already saved with each post.
- **Privacy.** For the numbers above I only counted visits and posts in the database, not anyone's entries. Journal entries and photos will be private by default. Testers can choose Only me.
- **Accessibility.** Every step will work with a keyboard, photos will need a short description, and any motion will turn off with reduced motion.
- **Original project.** Atmos was first made for the SVA vibe coding "100 users in one week" assignment.
- **AI use.** I build Atmos by talking with Claude. For this proposal, Claude counted the font sizes, radii and spacing in the code and the visits and posts in the database, and helped me write up the ideas. I chose the direction, what to keep and how to test it.
