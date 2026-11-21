# Atmos final proposal

Hello World final project · Week 11 (Nov 23)
Marin Chung

**Atmos:** https://atmos-cd-347fa3dcbb.netlify.app/

## The project

Atmos is a small web app I made in September. It puts live weather and mood journaling in the same place and asks one question, *What's the weather inside you today?* Everyone's answers show up on a shared globe.

For the final I want to keep Atmos and make it better, not start something new. I'm focusing on two things, the design system and the check in.

## Where it is now

![Atmos today](img/atmos-before.jpg)

**The design system isn't consistent.** I built Atmos fast while vibe coding, so the same kind of thing often looks a little different.
- There are 22 different font sizes, including half pixels like 8.5, 11.5 and 15.5.
- There are 13 different corner radius values and 18 spacing values.
- Toggles look different. Most fill with black when selected, but Public / Only me uses a raised white style.
- Inputs look different. The nickname is a dashed underline and the journal is a box.
- Mood names look different. It says "Cozy" in the picker but "COZY" in the feed.

**The check in is easy to miss.** It's the main thing I want people to do, but it doesn't stand out.
- It's a static form. The moods, nickname, text box, location, visibility and Post button all have the same weight, so it's not clear where to start.
- On a phone it sits below the weather, the forecast, the timeline and the globe. You have to scroll 3 or 4 screens to find it.
- 162 devices visited Atmos, but only 31 people posted.

![Atmos on a phone, the check in is in the middle column](img/atmos-phone-before.jpg)

## How I'll improve it

**1. One design system**
- Set a small type scale (around 7 sizes), a radius scale (around 4) and a spacing scale, and save them as tokens.
- Make every toggle, input and tag use one shared style.
- Keep the rule that's already there and write it down. Serif is for people's words and feelings, and sans is for the interface and data.

**2. A check in you can't miss**
- Show it one step at a time. Pick a mood first, then write a line, then add a nickname and post.
- Make the moods bigger and a little more alive so it's clear that's where you start.
- After you pick a mood, the text box asks a question that fits it, like "What's keeping things calm?"
- On phones, make the check in easier to reach without scrolling so far.

**Scope**

| Priority | What |
|---|---|
| Must | Type, radius and spacing tokens applied across Atmos |
| Must | Same style for toggles, inputs and tags |
| Must | Step by step check in, in English and Korean |
| Should | Check in easier to reach on phones |
| Should | Dark mode check for everything I change |
| Nice | A small page that documents the design system |

**Stopping point.** Someone new can find the check in and post without help, on a phone and on a laptop.
**What I'd cut first.** The design system page.

## How I'll test it

**Small experiment for this week.** Before changing anything, I'll watch 3 people who have never used Atmos try it on their phones. I'll only say "this is Atmos, try leaving how you feel today" and won't help.

- Did they find the check in? How long did it take?
- Where did they get stuck or hesitate?
- Did they finish posting?

**Prediction.** I think people will scroll past the check in on a phone, and when they find it they'll start typing before choosing a mood or a nickname.

**Results.** *(to fill in after testing)*

| # | Found the check in | Time | Got stuck at | Finished |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

**For the prototype (Nov 30).** I'll do the same test with the improved version and compare it with these results.

## Working notes

- **Source.** Atmos is built in Claude Design and deployed on Netlify. I'll make changes there.
- **Privacy.** For the numbers above I only counted visits and posts in the database, not anyone's entries. Testers can choose Only me if they don't want their post to be public.
- **Accessibility.** Every step will work with a keyboard, and any motion will turn off with reduced motion.
- **Original project.** Atmos was first made for the SVA vibe coding "100 users in one week" assignment.
- **AI use.** I build Atmos by talking with Claude. For this proposal, Claude counted the font sizes, radii and spacing in the code and the visits and posts in the database. I chose what to improve and how to test it.
