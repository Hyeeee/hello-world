# Final project directions

Hello World final project · Week 11
Marin Chung

I have six directions I'd be happy to make. I haven't picked one yet, so I'd like to talk them through with you and choose. Each one uses the same plan, the problem, the idea, who it's for, what I must build, the riskiest unknown and a small experiment, so they're easy to compare.

- **A. Atmos, a mood journal for noticing how you feel** (mental wellbeing)
- **B. Stairs only, my commute without stairs** (accessibility)
- **C. Warmer in Manhattan, measuring my own commute** (environment)
- **D. Tip screen, the pressure behind the buttons** (economy and design)
- **E. Coffee index, the price of one coffee by neighborhood** (economy)
- **F. Decision x-ray, see how you decide when you design with AI** (AI and how we decide)

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

### F. Decision x-ray, see how you decide when you design with AI

**The question.** More and more designers build by talking with AI. It's fast, but it's hard to tell which decisions are really yours. When you design with AI, which choices do you make, which ones does the AI make quietly, and how often do you just accept what it gives you?
**Why AI is different.** AI makes things that look finished, very fast, so it's easy to accept "good enough." It fills in everything you didn't ask for, like spacing, fonts and wording, so many decisions happen without you noticing. It also tends to agree with you, so your ideas rarely get pushed back. A 2025 study found that knowledge workers who trusted AI more did less critical thinking of their own ([Lee et al., CHI 2025](https://www.microsoft.com/en-us/research/?p=1135061)). I noticed this in my own work too. My Atmos app ended up with 22 font sizes and 13 corner radius values, and I never chose most of them.
**The idea.** A website where you bring your AI conversation from a project, like an exported Claude or ChatGPT chat, plus a few screenshots of what you made. It goes through the conversation and shows you how you decided.
- Every decision gets marked as **you asked for it**, **AI suggested it and you agreed**, or **AI did it and you never mentioned it**.
- It also finds the moments where AI just agreed with you, where you pushed back, and where you changed your mind.
- AI suggests these labels, but you confirm or fix each one, so the final call stays with you.
**What you get.**
- **Your decision profile.** For example, "You accepted 7 out of 10 suggestions without changes. Most of the quiet decisions were spacing and wording."
- **A timeline** of the project showing where your decisions and AI's decisions happened.
- **An x-ray of your screenshots.** You tag parts of the screen and they're colored by who decided them, with a link back to that moment in the chat.
**Who it's for.** Designers and students who use AI every day and want to see their own habits, like my classmates.
**Must.** Upload or paste a conversation, decisions labeled with your confirmation, the decision profile and the timeline.
**Should.** The screenshot x-ray.
**Nice.** Comparing your profile with other people's, anonymously.
**Riskiest unknown.** Whether AI can label "who decided" accurately enough that people trust the result. It would be ironic if the tool made the same quiet decisions it's trying to reveal.
**Spike.** Take one of my own conversations, label 100 turns by hand, then have AI label the same turns and see how often we agree.
**Test.** Three or four classmates bring a real conversation from one of their projects. I ask whether their profile feels true, and what surprised them.
**Care.** Conversations can be personal. Nothing is saved unless the person chooses to share it, and they can remove anything before analysis.

### How they compare

| | A. Atmos | B. Stairs only | C. Warmer in Manhattan | D. Tip screen | E. Coffee index | F. Decision x-ray |
|---|---|---|---|---|---|---|
| Area | Mental wellbeing | Accessibility | Environment | Economy and design | Economy | AI and how we decide |
| Starting point | Existing app with real users | Public MTA list | My own measurements | Photos I collect | Prices I collect | People's own AI conversations |
| Riskiest part | Helps reflection, not just cute | Respectful, not a game | Sensor accuracy | Acting like real life | Whether coffee says enough | AI labeling decisions accurately |
| Easy to test with classmates | Yes | Yes | Yes | Yes | Yes | Yes |
| Fits in three weeks | Yes | Yes | Yes, if I start measuring now | Yes | Yes | Yes |

### What I'd like your thoughts on
- Which of these feels most worth spending three weeks on, and which riskiest part would I learn the most from?
- For A, is growing an existing project enough for a final? And how careful should a class project be with mental health?
- For B, how do I make sure it's respectful, and who could I ask for feedback?
- For C, is my own measurement enough evidence, or should I add public data?
- For F, can I use the course's AI access for the labeling, and is it okay to ask classmates for their conversations?

## Working notes

- **Tools.** I build by vibe coding with Claude, and I'd use p5.js or plain HTML, CSS and JavaScript. C would also use an Arduino and a temperature sensor.
- **Privacy.** For A I only counted visits and posts in the Atmos database, not anyone's entries. For D and E I'd only photograph screens and price boards, not people.
- **Accessibility.** Whatever I pick will work with a keyboard and on a phone, with motion turned off for reduced motion.
- **AI use.** Claude helped me find data sources, count things in the Atmos code and database, and write up these directions. I chose the topics from things I noticed myself, and I'll choose one with you.
