# OpenSprout MCP — Agent-Ready Prompt Pack

Ready-to-use natural-language prompts for AI agents connected to the OpenSprout MCP server. Copy-paste these directly into your agent conversation.

---

## Daily Plant Care Check

```
Run a daily plant care check for me:
1. List all my plants to see what I have.
2. For each plant, list its care schedules to see what's due today or overdue.
3. List any pending task instances across all plants.
4. For any plant with "struggling" or "watch" health status, search the knowledge base for relevant care tips.
5. Summarize everything in a friendly, readable format organized by plant.
```

**What it does:** Cross-references plants, schedules, and tasks to give a complete morning briefing. Knowledge search adds helpful context for plants that need extra attention.

---

## Adding a New Plant

```
Create a journal entry for my new plant. Here are the details:
- Plant name: "Snake Plant — Living Room"
- Species: Sansevieria trifasciata
- Notes: "Just bought from the nursery, repotted into a terracotta pot"
- Tags: ["new-plant", "nursery"]

First, search the species "sansevieria" to confirm the species ID. Then create the journal entry with today's observed date and a health score of 8.
```

**What it does:** Searches species data for accurate matching, then creates a journal entry that documents the acquisition. Note: this uses `create_journal_entry` since no `create_plant` MCP tool exists yet; the actual plant should be created via the web/mobile app first.

---

## Editing Plant Details

```
I just moved my "Monstera Deliciosa" from the living room to the bedroom and it's thriving now. Please:
1. Look up my plant named "Monstera Deliciosa" by listing all plants and finding it.
2. Update its location to "Bedroom — East Window".
3. Update its health_status to "thriving".
4. Also create a journal entry noting the move with tags ["relocated", "thriving"].
```

**What it does:** Locates the plant by name, updates location and health status in one call, and documents the change with a journal entry for future reference.

---

## Logging Care (Water, Fertilize, etc.)

```
I just watered my "Fiddle Leaf Fig" with about 500ml of water. Please:
1. Find my Fiddle Leaf Fig plant.
2. Log a watering with 500ml and note "Weekly watering — soil was dry to first knuckle".
3. Check if there's a pending watering task for this plant and mark it complete.
```

**What it does:** Finds the plant, logs the care activity with details, and completes any associated pending task in one workflow. The task completion step is optional — omit it if you're just logging outside a schedule.

For fertilizing:

```
Log that I fertilized my "Pothos" today. Use care_type "fertilize" and note "Diluted liquid fertilizer at half strength — spring feeding schedule".
```

---

## Completing a Care Task

```
Show me all my pending care tasks, then mark the first overdue one as done with the note "Completed early morning — plant looked great".
```

**What it does:** Lists all pending tasks across all plants, finds the most urgent one (ordered by `due_at`), and completes it with a care log entry. Remove "overdue" filter if you want the first pending task regardless.

---

## Creating a Journal Entry

```
Create a journal entry for my "Monstera Deliciosa":
- Title: "New leaf unfurling!"
- Body: "The biggest leaf yet — it has 7 fenestrations. Growth is really taking off with the new grow light."
- Health score: 9
- Tags: ["new-leaf", "growth", "fenestrations"]
```

**What it does:** Creates a detailed journal entry with optional title, health score, and tags. Use this to document observations, milestones, concerns, or changes.

---

## Diagnosing a Plant Issue

```
My "Peace Lily" has drooping leaves and brown tips. Please:
1. Search the knowledge base for articles about drooping leaves or brown tips on peace lilies.
2. Run a diagnosis lookup for "drooping leaves" and "brown tips".
3. Check my care logs to see when it was last watered.
4. Summarize the possible causes and recommended actions.
```

**What it does:** Combines knowledge base search, diagnosis lookup, and care history review to give a comprehensive health assessment. The diagnosis tool returns structured cause/solution pairs.

---

## Searching Species Knowledge

```
I'm thinking of getting a "Calathea orbifolia". Search the species database and tell me:
1. What are its care requirements (light, water, humidity)?
2. Is it pet-safe?
3. What difficulty level is it?
4. What common problems should I watch out for?
5. Are there any knowledge articles about calatheas in the database?
```

**What it does:** First searches species by common name, then retrieves the full care guide including knowledge articles. Great for plant research before buying.

---

## Auditing Account Data

```
Run a full audit of my OpenSprout data:
1. List all my plants with their health status, location, and species.
2. For each plant, show:
   a. The most recent 3 care logs.
   b. Any active care schedules.
   c. Any pending tasks.
   d. The most recent journal entry.
3. Identify any plants that haven't had care logged in more than 14 days.
4. Flag any plants with "struggling" or "watch" health status.
5. Present the results in a structured report.
```

**What it does:** Walks through every plant's full data profile to produce a comprehensive account audit. Useful for catching neglected plants or spotting data issues.

---

## Running Reliability Checks

```
Run MCP reliability checks for my test environment:
1. List all plants to verify connectivity.
2. Get the details of my test plant by its ID.
3. Update my test plant's location to "Audit — verified" and confirm the change.
4. Log a test watering for my test plant.
5. List care logs for my test plant to verify the log was created.
6. List pending tasks for my test plant.
7. Create a test journal entry for my test plant.
8. List journal entries to verify it was recorded.
9. Search species for "monstera" to verify the species database.
10. Search the knowledge base for "yellow leaves".
11. Run a diagnosis for "wilting".
12. Restore my test plant's location to its original value.
13. Delete the test journal entry (if deletion is available).
14. Report any failures or unexpected results.
```

**What it does:** Runs a comprehensive end-to-end test of all MCP tools. See `docs/mcp-reliability-audit.md` for the full audit protocol with expected results and cleanup steps.
