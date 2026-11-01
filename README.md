# سندي · Sanady
سندك اللي جواك — Your inner companion.

A voice-first personal AI agent in Egyptian Arabic for adults with ADHD (and anyone with a crowded life). Say everything on your mind; Sanady sorts it, reminds you at the right moment, starts the first step with you, and checks whether you can afford what you want to buy.

- Live: https://nrg1c3.github.io/Sanady/ · Demo day: https://nrg1c3.github.io/Sanady/?demo=1
- Entry for the Create AI Agents Championship (Dubai), Best Personal AI Agent.
- Data stays on the phone. Not therapy, not medical or financial advice.

## What it does
- **Brain dump by voice** → tasks, ideas, shopping, bills, appointments, medicine times, calls, money updates, item locations and expiring documents, each in the right life area (work, money, people, shopping, home, health, papers, travel, study, me).
- **One next step at a time**: the home card picks what matters now; big tasks are split into 5-minute steps; focus timer with calming sounds; sleep mode.
- **Proactive follow-up**: leave-now alerts for appointments (learns your travel time), bills, medicine, forgotten tasks, people you haven't talked to, ideas vault, body care (water, movement, food), bedtime summary, weekly review.
- **Papers**: tell it "the passport expires in March" and it reminds you to renew a month before.
- **Money advisor**: "can I buy this?" against balance, bills and payday; never decides for you.
- **Hard-day mode, crisis safety, family reminders by link, doctor's diary export.**
- **Alarms that ring**: full-screen ringing with sound and vibration inside the app; when the app is closed, a signed web push wakes the phone and it shows its own reminder (snooze 10 min from the notification). Calendar export (.ics) too.
- **Calming sounds** made in the app: white, pink and brown noise, rain, waves, forest, fire, fan, with a sleep timer.
- **Backup** to a file and restore on a new phone.
- **Two separate apps from one code**: *Sanady ADHD* at the root and *Sanady* for everyone at `/app/` (built by `tools/build-app.py`). Each has its own install, data, device id, alarms and service-worker cache.
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
