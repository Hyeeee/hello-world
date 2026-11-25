# Final project proposal

Hello World final project · Week 11
Marin Chung

My main direction is **Atmos as a daily mood journal**. I also have four other directions at the end that help with small everyday problems, so I can talk them through with you and pick one. See [Other directions](#other-directions).

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

These are four other ideas that help with small, everyday problems. I picked ones that don't depend on live outside data, that classmates and friends can test, and that fit in three weeks. Each one uses the same kind of plan as Atmos, so they're easy to compare.

### B. Which bin, a quick recycling helper

**The problem.** New York's recycling rules are confusing. Is a pizza box paper? Does a coffee cup go in recycling? Most people guess, and a lot of recycling ends up in the trash or the wrong bin.
**The idea.** Type or tap an item and it tells you which bin it goes in, blue, green or brown, with a short reason. Things you look up often are saved for next time.
**Who it's for.** Anyone living in New York, especially people who just moved here.
**Must.** Search for about 50 common items, a clear bin answer with a picture, and the reason in one line.
**Riskiest unknown.** Whether people find it faster than just guessing, so they'd actually use it.
**Spike.** Ten classmates sort ten tricky items first by guessing, then with the app. Compare how many they got right.

### C. Borrow board, share things with your neighbors

**The problem.** Most of us own a drill or a ladder we use twice a year, and the person next door buys the same one. It wastes money and space.
**The idea.** A simple board for one building or one class. You list things you're happy to lend, and others can ask to borrow them and mark when they're returned.
**Who it's for.** People in the same building, dorm or class.
**Must.** List an item with a photo, ask to borrow it, and mark it as lent and returned.
**Riskiest unknown.** Whether people feel comfortable lending to neighbors they don't know well.
**Spike.** Try it with our class for a week and see what people list and what they borrow.

### D. Use it first, less food thrown away at home

**The problem.** Food goes bad in the back of the fridge because we forget what we bought.
**The idea.** After grocery shopping, you add items with a quick tap. The app shows what to use first, with a gentle reminder before something goes bad.
**Who it's for.** People who cook at home, roommates sharing a fridge, students.
**Must.** Quick add with common items, a "use first" list sorted by days left, and marking things as eaten or thrown away.
**Riskiest unknown.** Whether adding food is fast enough that people keep doing it after the first day.
**Spike.** Three friends log their groceries for five days. I count how many items they add and when they stop.

### E. Give it away, where your old things can go

**The problem.** When you have clothes, books or furniture you don't need, it's hard to know where to take them, so a lot of it just goes in the trash.
**The idea.** Pick what you have and roughly where you live, and it suggests a few places to donate or drop it off, with what each place takes.
**Who it's for.** People moving, cleaning out a closet, or graduating.
**Must.** About five categories, a short list of places in each with what they accept, and a simple map.
**Riskiest unknown.** Whether a short, curated list is enough, since I'd put the places in by hand.
**Spike.** Collect 15 places for clothes and books, then ask five people with something to give whether they'd go to one of them.

### How they compare

| | A. Atmos journal | B. Which bin | C. Borrow board | D. Use it first | E. Give it away |
|---|---|---|---|---|---|
| Helps with | Noticing how you feel each day | Recycling right | Sharing instead of buying | Food waste | Donating instead of throwing away |
| Starting point | Existing app with real users | New | New | New | New |
| Data | Already have | A list I write | What people add | What people add | A list I write |
| Riskiest part | Making it feel like a journal | Faster than guessing | Trusting neighbors | Adding food quickly | A short list being enough |
| Easy to test with classmates | Yes | Yes | Yes | Yes | Yes |

### What I'd like your thoughts on
- Is improving an existing project like Atmos enough for a final, or is a new project better?
- Which of these feels most worth making in three weeks?

## Working notes

- **Source.** Atmos is built in Claude Design and deployed on Netlify. I'll make changes there. Data is in Supabase (`posts`, `devices`, `metoo`, `visits`).
- **New data.** Photos would need Supabase Storage and a column for the photo and the feeling's strength. Weather is already saved with each post.
- **Privacy.** For the numbers above I only counted visits and posts in the database, not anyone's entries. Journal entries and photos will be private by default. Testers can choose Only me.
- **Accessibility.** Every step will work with a keyboard, photos will need a short description, and any motion will turn off with reduced motion.
- **Original project.** Atmos was first made for the SVA vibe coding "100 users in one week" assignment.
- **AI use.** I build Atmos by talking with Claude. For this proposal, Claude counted the font sizes, radii and spacing in the code and the visits and posts in the database, and helped me write up the ideas. I chose the direction, what to keep and how to test it.
