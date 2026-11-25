# Final project directions

Hello World final project · Week 11
Marin Chung

I have six directions I'd be happy to make. I haven't picked one yet, so I'd like to talk them through with you and choose. Each one uses the same plan, the problem, the idea, who it's for, what I must build, the riskiest unknown and a small experiment, so they're easy to compare.

- **A. Atmos, a mood journal for noticing how you feel** (mental wellbeing)
- **B. Stairs only, my commute without stairs** (accessibility)
- **C. Warmer in Manhattan, measuring my own commute** (environment)
- **D. Tip screen, the pressure behind the buttons** (economy and design)
- **E. Coffee index, the price of one coffee by neighborhood** (economy)
- **F. Who decided? What I give up when I design with AI** (AI and how I decide)

### A. Atmos, a mood journal for noticing how you feel

**The problem.** A lot of us go through the day without stopping to notice how we actually feel. Research shows that just putting a feeling into words can make it a little less intense ([Lieberman et al., 2007](https://pubmed.ncbi.nlm.nih.gov/17576282/)). But most mood apps feel like a form or a health tracker, so people don't stick with them.
**The idea.** I'd grow Atmos, my weather and mood app from September, into a small daily check in for your mind. The weather is the starting point, *what's the weather inside you today?*, which makes it easier to name a feeling. You pick a mood, answer a gentle question that fits it, can add a photo, and look back at your own weeks to see patterns.
**Who it's for.** People who want a small daily moment to check in with themselves, without it feeling like therapy homework.
**Starting point.** [Atmos](https://atmos-cd-347fa3dcbb.netlify.app/) is live. 162 devices visited, but only 31 people posted and only 3 posted more than once. Right now the weather takes up most of the screen and the journal part is thin.
**Must.** Journal first layout, a gentle prompt for each mood, entries private by default, and a view of my own past entries.
**Riskiest unknown.** Whether naming a feeling through weather actually helps people reflect, or just feels cute.
**Spike.** Five classmates check in for three days, then I ask whether it helped them notice anything about how they felt.
**Care.** It's a journal, not therapy, so it won't give advice or diagnose. Entries stay private unless shared, and it will point gently to real support if someone needs more.

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

### F. Who decided? What I give up when I design with AI

**The question.** I build most of my projects by talking with Claude. It's fast, but I've started to notice I'm not always the one deciding. When I design with AI, which decisions do I actually make, which ones does the AI make quietly, and what does that cost me?
**Why AI is different.** Working with a person or a reference image is not the same as working with AI. AI makes things that look finished, very fast, so it's easy to accept "good enough." It fills in everything I didn't ask for, like spacing, fonts and wording, so many decisions happen without me noticing. It also tends to agree with me, so my ideas rarely get pushed back. A 2025 study found that knowledge workers who trusted AI more did less critical thinking of their own ([Lee et al., CHI 2025](https://www.microsoft.com/en-us/research/?p=1135061)). I want to look at this in my own design work.
**My study.** I use my own projects as the data.
- I take Atmos and list around 40 visible design choices, like the layout, the fonts, the six moods, the copy and the colors.
- For each one I go back through my Claude conversations and mark who decided it. I asked for it, AI suggested it and I agreed, or AI did it and I never noticed.
- I also mark the moments where AI just agreed with me, where I changed my mind because of it, and the parts I still can't explain myself.
- One clue is already there. When I counted Atmos's styles I found 22 font sizes and 13 corner radius values. I never chose most of those. They piled up quietly.
**The website.** Two parts.
- **Decision x-ray.** Atmos with a toggle. Turn it on and every part is colored by who decided it. Click a part to see the moment in the conversation where it happened.
- **What I'd change.** Based on what I find, a small way of working I'd design for myself and other designers, like a decision log or a short check before accepting an AI result. I'd use it on a small new piece and compare.
**Who it's for.** Designers who use AI every day, and anyone curious about who is really making the choices.
**Must.** At least 40 traced decisions from Atmos, the x-ray view, a summary of the patterns and limits I found, and one tested change to how I work.
**Riskiest unknown.** Whether my conversation history is complete enough to trace each decision, and whether I can judge my own process honestly.
**Spike.** Trace 15 parts of Atmos back to the conversations this week and see how many I can actually place.
**Care.** The data is my own conversations, and I'll only show parts I'm comfortable sharing.

### How they compare

| | A. Atmos | B. Stairs only | C. Warmer in Manhattan | D. Tip screen | E. Coffee index | F. Sketch first |
|---|---|---|---|---|---|---|
| Area | Mental wellbeing | Accessibility | Environment | Economy and design | Economy | AI and how I decide |
| Starting point | Existing app with real users | Public MTA list | My own measurements | Photos I collect | Prices I collect | My own Claude conversations |
| Riskiest part | Helps reflection, not just cute | Respectful, not a game | Sensor accuracy | Acting like real life | Whether coffee says enough | Tracing decisions honestly |
| Easy to test with classmates | Yes | Yes | Yes | Yes | Yes | Yes |
| Fits in three weeks | Yes | Yes | Yes, if I start measuring now | Yes | Yes | Yes |

### What I'd like your thoughts on
- Which of these feels most worth spending three weeks on, and which riskiest part would I learn the most from?
- For A, is growing an existing project enough for a final? And how careful should a class project be with mental health?
- For B, how do I make sure it's respectful, and who could I ask for feedback?
- For C, is my own measurement enough evidence, or should I add public data?
- For F, is studying my own process enough for a final, or should I add other designers' experience too?

## Working notes

- **Tools.** I build by vibe coding with Claude, and I'd use p5.js or plain HTML, CSS and JavaScript. C would also use an Arduino and a temperature sensor.
- **Privacy.** For A I only counted visits and posts in the Atmos database, not anyone's entries. For D and E I'd only photograph screens and price boards, not people.
- **Accessibility.** Whatever I pick will work with a keyboard and on a phone, with motion turned off for reduced motion.
- **AI use.** Claude helped me find data sources, count things in the Atmos code and database, and write up these directions. I chose the topics from things I noticed myself, and I'll choose one with you.
