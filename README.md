# pakka. — the trip that actually leaves the group chat

Built by Ayush Arya Kashyap for the goSTOPS Build Sprint. Not an official goSTOPS product.

One link goes in the group chat. Everyone fills a 30-second card (city, private budget, free weekends, vibe, how committed they are).
Pakka picks the weekend most people are free, and the goSTOPS city that is fairest for *everyone* on travel time and budget,
even when friends live in different cities. The organiser locks it, everyone gets a countdown, a calendar invite, a story card,
and a deep link to goSTOPS beds for those exact dates. There's also a solo mode.

Why it should win on "real people used it": **every plan pulls 3–8 friends in by design.** One organiser = a whole group of users.

---

## 1. Run it locally (5 minutes)

Needs Node 18.18+ (`node -v`).

```bash
cd pakka
npm install
npm run dev
```

Open http://localhost:3000. With no env vars, data lives in memory (resets on restart). That's fine for testing.

## 2. Put it live (15 minutes)

1. **GitHub:** create an empty repo called `pakka`, then:
   ```bash
   git init && git add . && git commit -m "pakka v1"
   git branch -M main
   git remote add origin https://github.com/ayusharyakashyap/pakka.git
   git push -u origin main
   ```
2. **Vercel:** vercel.com → Add New → Project → import `pakka` → Deploy (no settings needed).
3. **Database:** in the Vercel project → **Storage** → Create → **Upstash for Redis** (free) → connect to the project
   (all environments). It adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
4. **Redeploy:** Deployments → ⋯ → Redeploy. (Env vars only apply to new deploys.)
5. **Analytics:** project → Analytics tab → Enable (Web Analytics, free). That's your second, independent source of numbers.
6. **Domain (optional, worth it):** Settings → Domains. Rename the project to something like `pakka-trip` so the URL is
   `pakka-trip.vercel.app`. Short URL = more shares.

Check it works:
- Create a gang plan on your phone, fill your card, open the link on a second phone/incognito, fill another card. Results should update live.
- Paste the link in WhatsApp to yourself. The preview should show the plan name + "x/y friends have filled their card".
- Open `/stats`. You should see your test numbers. **Before launch, start a fresh Upstash DB or just mention test counts in your write-up** so the numbers are clean.
- Click every "See beds at goSTOPS …" link once. If any city page 404s, fix the slug in `lib/data.ts` (`gostops:` field).

## 3. Where things are

| File | What it does |
|---|---|
| `lib/data.ts` | 17 goSTOPS cities (vibes, daily cost, seasons, solo notes), 18 origin cities |
| `lib/engine.ts` | Travel estimate, per-person fit, fairness ranking, Pakka meter |
| `lib/weekends.ts` | Next 12 weekends, long weekends flagged (Christmas, New Year, Republic Day) |
| `lib/store.ts` | Upstash Redis (or memory) storage + analytics counters |
| `app/page.tsx` | Landing page |
| `app/p/[id]/PlanClient.tsx` | Card form, live results, voting, lock, shares |
| `app/p/[id]/opengraph-image.tsx` | WhatsApp/LinkedIn link preview image |
| `app/p/[id]/story/route.tsx` | 1080×1920 Instagram story card |
| `app/stats/page.tsx` | Live numbers page (real users, visitors, plans, locks, shares, goSTOPS clicks) |

**How the pick works:** for each person and each place it estimates one-way travel (bus/train vs flight, whichever costs less once
you count time), total cost (return travel + nights × daily cost), and vibe match. Each person gets a 0–1 fit score.
The place's score = 55% average + 45% *worst* person's score (so nobody gets screwed), × season fit for that weekend, plus a small bump for votes.

**What counts as a "real user":** a unique device that submitted a card. Visitors are counted separately. Both on `/stats`.

---

## 4. Launch playbook (this is what actually wins)

The product is the multiplier; you still need the first sparks. Aim: 40–60 organisers → 200–400 card-fillers.

**Day 1 (Mon 23 Nov) — ship + seed**
- Deploy by afternoon. Test on 2 phones.
- Make 5 real plans with real groups: college batch, IIIT hostel wing, SUTD friends (solo mode), family cousins, school friends.
  Don't say "check out my project". Say "we keep saying we'll go somewhere in Jan, fill this, 30 sec".
- Post in IIIT Bangalore batch/club groups, with a real plan link, not the homepage.

**Day 2 (Tue 24 Nov) — go wide**
- LinkedIn post (tag goSTOPS, draft below) with a screen recording of a real group's plan.
- Instagram story with your story card + tag @gostops.
- Reddit: r/IndianTravel style "built a free thing that kills the Goa-plan problem" (read each sub's self-promo rules first),
  r/bangalore / r/delhi weekend-trip threads where people ask "where should we go".
- DM 15 college club leads (travel / trekking / photography clubs). Clubs have trip plans every semester.
- Watch `/stats`. Whatever source converts best, double down.

**Day 3 (Wed 25 Nov) — numbers + submit by 10 pm**
- Morning: one more push (LinkedIn update with real numbers, "X people used it in 48 hours").
- 6 pm: screenshot `/stats` + Vercel Analytics. Record Loom. Send by 9 pm, not 9:59.

**LinkedIn draft:**
> Every friend group in India has a Goa plan that never left the WhatsApp group.
> I got 72 hours for the goSTOPS Build Sprint, so I built Pakka: drop one link in the group, everyone fills a 30-second card
> (city, budget that stays private, free weekends, vibe) and it picks the weekend and the place that's fair for everyone,
> even if you're in five different cities. Then you lock it and there's no backing out.
> Try it with your group: <link>
> Built for the goSTOPS Build Sprint. Not an official goSTOPS product. @goSTOPS

---

## 5. Half-page write-up (fill in the brackets on Wednesday)

**What I built:** Pakka, a free tool that turns "we should go somewhere" in a group chat into a locked trip. One link, everyone fills a
30-second card, and it picks the weekend and the goSTOPS city that works for the whole group. Solo mode gives a solo traveller their best
weekend in the same 30 seconds.

**How I thought about it:** You asked for goSTOPS to show up *before* someone needs a bed. For Gen Z the trip usually dies before that
moment, in the group chat: friends are in different cities after college, nobody wants to say their budget out loud, and nobody wants to
be the one who decides. So I built for that moment instead of another planner. Two choices came from your brief: (1) judged on real
users, so the product needs its own distribution. Every plan needs 3–8 friends to fill a card, so each organiser brings a group.
(2) Usefulness earlier in the funnel, but ending at a booking: every pick is a goSTOPS city, and the final step links to goSTOPS beds
for the exact dates. Fairness ranking (it weighs the worst-off friend) and private budgets solve the two awkward conversations.
Solo mode covers your solo guests and the "everyone flaked" case.

**Numbers (as of [time], Wed 25 Nov):** [X] real users (unique devices that filled a card) · [X] unique visitors · [X]% visitor→user ·
[X] plans ([X] group / [X] solo) · avg [X] cards per group plan · [X] trips locked · [X] clicks to goSTOPS pages · top traffic source: [X].

**What I'd do next:** live goSTOPS bed prices and availability in the result card, a group booking deposit ("everyone pays ₹500 to lock"),
and WhatsApp reminders to the people who haven't filled their card.

## 6. 3-minute Loom script

- **0:00–0:20** "Every friend group has a Goa plan that never happened. That's the moment goSTOPS isn't in yet. This is Pakka."
- **0:20–1:30** Live demo on phone screen: create plan → WhatsApp preview → fill card → second person fills → results update live →
  show the per-friend travel rows ("Riya's from Delhi, Kabir's from Chandigarh, both under 11 hours") → vote → lock → countdown,
  calendar, story card, goSTOPS beds link with dates filled in.
- **1:30–2:15** Numbers: open `/stats`, walk through real users, cards per plan (the multiplier), locked trips, goSTOPS clicks.
- **2:15–2:50** Why it's built this way: virality is the product, fairness + private budgets, every result is a goSTOPS city.
- **2:50–3:00** "What I'd add next: live goSTOPS prices and group deposits. Thanks Vishal."
