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
- **Reminders while closed**: whole calendar export (.ics); Telegram reminders (server ready, bot pending).
- **Backup** to a file and restore on a new phone.

## How it runs
- Static PWA (this repo) on GitHub Pages.
- n8n on NRG's server: `Sanady - Brain` (Claude), `Wasl - Egyptian Voice` (speech), `Sanady - Reminders API` and `Sanady - Telegram Bot` (Telegram reminders). Every request carries the app key and a signed device token.
