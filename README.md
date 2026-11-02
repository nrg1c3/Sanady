# Sayvo · سايفو

Say it once. Sayvo sorts it. A voice-first personal AI agent for adults with a crowded life: say everything on your mind; Sayvo sorts it into tasks, appointments, bills and home needs, reminds you at the right moment (alarms ring even with the app closed), starts the first step with you, and replans your day when you fall behind. Egyptian Arabic first, plus Gulf Arabic, English, French, Spanish and German.

**Focus+** is the paid add-on for people who find it hard to start, focus or keep track of time (with or without ADHD): the simple screen, body double, waiting mode, 2-minute starts, weekly accountability buddy, energy picker. It is what used to be the separate Sanady ADHD app.

- Live: https://sayvo.nrg-egypt.com (the old https://nrg1c3.github.io/Sanady/ forwards here) · Focus+ link: `?focus=1` · Demo: `?demo=1`
- The old links /Sanady/ and /mudabbir/ forward here (redirect pages in the nrg1c3.github.io repo).
- Languages: the code is written in Egyptian Arabic; `i18n.js` translates the screen from `i18n/strings.json` (`python3 tools/build-i18n.py` builds the word lists, `--check` lists new Arabic text that needs a translation).
- n8n on NRG's server (all "Sayvo - …"): Brain, Voice (`sayvo-tts`), Device Register (`sayvo-register`), Push Alarms, Backup, Home Sync, Pilot Stats, Waitlist. Separate from Wasl.

---

## History (Sanady)

# سندي · Sanady
سندك اللي جواك — Your inner companion.

A voice-first personal AI agent in Egyptian Arabic for adults with ADHD (and anyone with a crowded life). Say everything on your mind; Sanady sorts it, reminds you at the right moment, starts the first step with you, and checks whether you can afford what you want to buy.

- Live: https://nrg1c3.github.io/Sanady/ · Demo day: https://nrg1c3.github.io/Sanady/?demo=1
- Entry for the Create AI Agents Championship (Dubai), Best Personal AI Agent.
- Data stays on the phone. Not therapy, not medical or financial advice.

## What it does
- **It acts on its own (agent.js)**, and logs every action with an undo:
  - replans the day when you fall behind (late tasks move to the next free slots; on a hard day, to tomorrow),
  - breaks a big task into small steps by itself and spreads them one per day with their own alarms,
  - follows up the day after you call or message someone, and drafts the reminder,
  - spots a task pushed 3 times and offers to cut it smaller or drop it.
- **Simple ADHD screen (adhd.js)**: the time left, one thing now, one big mic; everything else behind "كل الأدوات". Weekly accountability partner message. Self-talk prompt at the start of a task.
- **Trust (trust.js)**: alarm health check with a test ring and calendar backup for medicine and appointments; encrypted daily cloud backup opened only with the user's recovery code; opt-in anonymous pilot numbers with a weekly 3-question check-in; conversation language Egyptian, Gulf or English.
- **Privacy by design**: phone numbers, emails, card and ID numbers are masked on the phone before the brain sees them and restored after; shared home and cloud backup are encrypted on the phone (AES-GCM, key from a code only the user has); strict Content-Security-Policy.
- **Brain dump by voice** → tasks, ideas, shopping, bills, appointments, medicine times, calls, money updates, item locations and expiring documents, each in the right life area (work, money, people, shopping, home, health, papers, travel, study, me).
- **One next step at a time**: the home card picks what matters now; big tasks are split into 5-minute steps; focus timer with calming sounds; sleep mode.
- **Proactive follow-up**: leave-now alerts for appointments (learns your travel time), bills, medicine, forgotten tasks, people you haven't talked to, ideas vault, body care (water, movement, food), bedtime summary, weekly review.
- **Papers**: tell it "the passport expires in March" and it reminds you to renew a month before.
- **Money advisor**: "can I buy this?" against balance, bills and payday; never decides for you.
- **Hard-day mode, crisis safety, family reminders by link, doctor's diary export.**
- **Alarms that ring**: full-screen ringing with sound and vibration inside the app; when the app is closed, a signed web push wakes the phone and it shows its own reminder (snooze 10 min from the notification). Calendar export (.ics) too.
- **Calming sounds** made in the app: white, pink and brown noise, rain, waves, forest, fire, fan, with a sleep timer.
- **Backup** to a file and restore on a new phone.
- **Two separate apps from one code**: *Sanady ADHD* at `/Sanady/` and *Mudabbir (مُدبّر)* for everyone at `/mudabbir/` (built by `tools/build-app.py` into the nrg1c3.github.io repo). Each has its own install, data, device id, alarms and service-worker cache.
- **ADHD home modes, the user picks**: *One thing* (time bar to leaving, "start 2 minutes", "I can't start", energy picker), *With you* (body double: timer, quiet check-ins every 10 minutes, blame-free "I drifted", hyperfocus guard after an hour), *Waiting* (tasks that fit before leaving for an appointment, 10-minute warning, then the leave alarm).
- **Everyone edition layouts, the user picks**: blocks, day timeline, chat, or one thing.
- **Mom mode** (both editions): today's plan, cleaning rotation (lighter on work days), house needs list shared on WhatsApp, quick meals from what's at home, and each child's medicine times (no doses), doctor, school and events.
- **Child phone**: parents set it up with a PIN; big routine steps, homework sent by link, stars and rewards, and one-tap "arrived at school / home / I'm OK" messages to the parent by WhatsApp or SMS. No location, no recording, no free chat with AI.
- **Interests**: prayer times computed on the phone (Egypt, UAE, KSA, Kuwait, Qatar cities) with alarms and the user's own adhan recording, morning/evening adhkar with counters, Quran recitation (alquran.cloud), Friday Al-Kahf; Christian prayer, Bible reading and mass reminders; pets (feeding, walks, vaccines, vet); any custom hobby reminder.
- **Daily life hub (حياتي)**: interests, habits with streaks, occasions (gift reminder 3 days before + greeting), subscriptions with monthly total and "still using it?", car (oil, licence, insurance), gam'iya (installments and your turn), money lent/borrowed with polite reminders, health (water, sleep, doctor visits).
- **ADHD-only tools**: dopamine reward menu, focus window around the user's own medicine time (no doses), leave-the-house check, idea parking inside body-double, plus the One thing / With you / Waiting modes, energy picker and "I can't start".
- **Three color themes**: night (default, yellow accent), warm, light.

## How it runs
- Static PWA (this repo) on GitHub Pages.
- n8n on NRG's server: `Sanady - Brain` (Claude), `Wasl - Egyptian Voice` (speech) and `Sanady - Push Alarms` (web push, VAPID signed in plain JS). Every request carries the app key and a signed device token.

## Developing
- Code: `app.js` (core), `family.js`, `life.js`, `sync.js` (shared home), `work.js` (bill pay, business, parents), `agent.js`, `adhd.js`, `trust.js`, `sw.js` (offline + alarms). One code base, two editions (`ED` = `adhd` | `main`).
- After editing `index.html`, `sw.js` or the manifest: `python3 tools/build-app.py` (writes `/mudabbir/` in the nrg1c3.github.io repo cloned next to this one), bump `SHELL` in `sw.js` when shipped files change.
- Tests: `bash tests/run.sh` runs every Playwright browser test against both apps with the server mocked. CI runs them on every push (`.github/workflows/tests.yml`).
- Server: n8n workflows (Brain, Push Alarms, Home Sync, Backup, Pilot Stats, Device Register, Voice) on `api.nrg-egypt.com`; every request carries the app key and a signed device token, is origin-locked and rate-limited.
