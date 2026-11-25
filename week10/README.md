# Final project proposal

Hello World final project · Week 11
Marin Chung

My main direction is **Atmos as a daily mood journal**. I also have four other directions at the end, about accessibility, the environment and money in everyday life, so I can talk them through with you and pick one. See [Other directions](#other-directions).

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

These are four other ideas, one about accessibility, one about the environment and two about money in everyday life. Each starts from something I noticed living in New York, uses data that's public or that I can collect myself, and fits in three weeks. They use the same kind of plan as Atmos, so they're easy to compare.

### B. Stairs only, my commute without stairs

**The problem.** Many New York subway stations still have no elevator. If you use a wheelchair, push a stroller or can't do stairs, a lot of the map just isn't there for you, and most riders never notice.
**The idea.** Pick a trip you take every day. The map redraws it as if you can't use stairs. Stations without step free access fade out one by one, and it shows how much longer the trip gets or whether you can make it at all.
**Who it's for.** Riders who have never thought about it, so they can feel the difference, and people who need step free trips and want to plan one.
**Data.** The MTA publishes a list of subway stations with which ones are ADA accessible ([MTA Subway Stations](https://catalog.data.gov/dataset/mta-subway-stations)). It's a fixed list, so no live data is needed.
**Must.** A map of my own line and a few common trips, accessible stations marked, the "without stairs" view, and the extra time or a clear "you can't get there" moment.
**Riskiest unknown.** Whether it makes people feel the problem without turning disability into a game.
**Spike.** Map my own trip from Long Island City to SVA both ways and show it to three classmates. Ask what they noticed and whether it felt respectful. I'd also like to show it to someone who uses a wheelchair or a stroller.

### C. Warmer in Manhattan, measuring my own commute

**The question.** I live in Long Island City, and every time I get to Manhattan, especially in winter, it feels warmer. Is that real, and why?
**What I know so far.** It's probably the urban heat island effect. Dense buildings and pavement hold heat and buildings leak heat outside, so very built up areas can stay warmer, even at night and in winter ([NYC Health](https://a816-dohbesp.nyc.gov/INDICATORPUBLIC/data-stories/urban-heat-island)). Long Island City is open and next to the river, so wind might also make it feel colder.
**The idea.** I carry a small temperature sensor (from Physical Computing) on my commute from home to SVA and log the temperature along the way. Then I make an interactive page that shows my measured line next to the official forecast, with the reasons it changes, like building density, trees and the river.
**Who it's for.** Anyone who's felt this and wondered, and people interested in how cities shape heat.
**Must.** Real measurements from at least five commutes, a map of the route colored by temperature, and short explanations at the points where it changes.
**Riskiest unknown.** Whether a cheap sensor is accurate enough to show a real difference, and not just my body heat or the subway.
**Spike.** Log two commutes this week and compare the readings with the forecast for each neighborhood. If the difference is bigger than the sensor's error, the project works.

### D. Tip screen, the pressure behind the buttons

**The problem.** Almost every café tablet now asks for 20%, 25% or 30%, even for a drip coffee. It's confusing, especially if you're new to the US, and a lot of it is design. The default, the order of the buttons and how hard "No tip" is to find all push you.
**The idea.** I collect real tip screens and rebuild them. You go through a few of them as a customer, then it shows you what nudged you, what other people chose, and where tips actually go in different kinds of places.
**Who it's for.** Anyone who's felt awkward at the tablet, and designers who make these screens.
**Why me.** I'm a UX designer, so I can point out the design patterns, and I'm still learning how tipping works here.
**Must.** Five to eight rebuilt tip screens, a short reveal of the nudges in each, and a summary of what people picked.
**Riskiest unknown.** Whether people act the way they would in real life when it's only a simulation.
**Spike.** Photograph ten tip screens around school, rebuild two, and have five classmates go through them. Compare their choices with what they say they usually tip.

### E. Coffee index, the price of one coffee by neighborhood

**The problem.** The same plain coffee can cost very different amounts a few stops apart. That gap says something about rent, who a neighborhood is for and how it's changing.
**The idea.** I collect the price of a plain drip coffee at 15 to 20 cafés and delis in Long Island City, Astoria and Manhattan, and put them on a map. You can compare new cafés with old delis, and see it as minutes of work at minimum wage.
**Who it's for.** People curious about cost of living and how neighborhoods change.
**Must.** At least 15 real prices with photos, a map, a simple comparison view, and the date each price was collected.
**Riskiest unknown.** Whether coffee prices alone say something meaningful, or if it needs one more thing like rent to make sense.
**Spike.** Collect prices from eight places on my way to school and see if a pattern shows up.

### How they compare

| | A. Atmos journal | B. Stairs only | C. Warmer in Manhattan | D. Tip screen | E. Coffee index |
|---|---|---|---|---|---|
| Area | Wellbeing | Accessibility | Environment | Economy and design | Economy |
| Starting point | Existing app with real users | Public MTA list | My own measurements | Photos I collect | Prices I collect |
| Riskiest part | Making it feel like a journal | Respectful, not a game | Sensor accuracy | Acting like real life | Whether coffee says enough |
| Easy to test with classmates | Yes | Yes | Yes | Yes | Yes |
| Fits in three weeks | Yes | Yes | Yes, if I start measuring now | Yes | Yes |

### What I'd like your thoughts on
- Is improving an existing project like Atmos enough for a final, or is a new project better?
- For B, how do I make sure it's respectful, and who could I ask for feedback?
- For C, is my own measurement enough evidence for a class project, or should I add public data?

## Working notes

- **Source.** Atmos is built in Claude Design and deployed on Netlify. I'll make changes there. Data is in Supabase (`posts`, `devices`, `metoo`, `visits`).
- **New data.** Photos would need Supabase Storage and a column for the photo and the feeling's strength. Weather is already saved with each post.
- **Privacy.** For the numbers above I only counted visits and posts in the database, not anyone's entries. Journal entries and photos will be private by default. Testers can choose Only me.
- **Accessibility.** Every step will work with a keyboard, photos will need a short description, and any motion will turn off with reduced motion.
- **Original project.** Atmos was first made for the SVA vibe coding "100 users in one week" assignment.
- **AI use.** I build Atmos by talking with Claude. For this proposal, Claude counted the font sizes, radii and spacing in the code and the visits and posts in the database, and helped me write up the ideas. I chose the direction, what to keep and how to test it.
