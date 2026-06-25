# OpenSprout — Frequently Asked Questions

**Version:** 0.9.14

---

### General

**Q: What is OpenSprout?**  
A: OpenSprout is a free, open-source plant care companion. Track watering, fertilizing, and care schedules. Log care activities. Journal plant health. Identify plants via AI. All without subscriptions or ads.

**Q: Is OpenSprout really free?**  
A: Yes. No subscriptions, no in-app purchases, no ads. It's open-source under AGPLv3.

**Q: Do I need an account?**  
A: Yes, you need a free account to save your plants and data. Sign up with email and password.

**Q: What platforms are supported?**  
A: Web (sprout.kovina.org), Android (APK/AAB from GitHub releases), Windows (PWA via Edge/Chrome).

---

### Plants & Care

**Q: How do I add a plant?**  
A: Go to the Plants tab → tap the + button → enter the name, select a species, and optionally add a photo.

**Q: Can I set custom care schedules?**  
A: Yes. Each plant has customizable watering, fertilizing, misting, and pruning schedules.

**Q: How do I identify a plant?**  
A: Go to the Identify tab → take or upload a photo → the AI identifies the species via PlantNet.

**Q: How many plants can I track?**  
A: No limit. OpenSprout handles 1 to 100+ plants.

---

### Privacy & Data

**Q: Where is my data stored?**  
A: In your own Supabase instance. You control the data.

**Q: Is my data shared with third parties?**  
A: No. No analytics, no ad tracking, no data sharing. Camera access is used only when you take a plant photo.

**Q: Can I export my data?**  
A: Yes. Go to Profile → Export Data to download all your data as JSON.

**Q: Can I delete my account?**  
A: Yes. Profile → Delete Account removes all your data permanently.

---

### Technical

**Q: What is MCP integration?**  
A: OpenSprout has an MCP server (28 tools) that lets AI agents (Claude Code, Cursor, etc.) interact with your plant data via secure API tokens.

**Q: Can I self-host?**  
A: Yes. The entire stack is open-source. You need Supabase (database, auth, storage) and Vercel or your own hosting.

**Q: How do I get an MCP token?**  
A: Go to Settings → AI Access → Generate Token.

**Q: Does OpenSprout work offline?**  
A: Partially. The app shell loads offline, and cached data is readable. Actions performed offline are queued and synced when reconnected.

---

### Troubleshooting

**Q: I can't log in.**  
A: Check your email/password. Use "Forgot password" on the login page. If you just signed up, check for a confirmation email.

**Q: My plant photo won't upload.**  
A: Check your internet connection. Photo upload requires Supabase storage access.

**Q: Notifications aren't working.**  
A: On Android 13+, you need to grant notification permission. On web/PWA, notifications are not supported.

**Q: Where can I get help?**  
A: Visit the Support page at sprout.kovina.org/support or open a GitHub issue.
