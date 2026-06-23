# MCP Reliability Audit Guide

A practical guide for running reliability checks against the OpenSprout MCP server using AI agents (Claude Code, Hermes, Cursor).

## Prerequisites

### Required Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `OPENSPROUT_ACCESS_TOKEN` | Authenticates the MCP session to your account | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Used server-side for token hash lookup | Yes (server-side only) |

### Creating a Personal Access Token (PAT)

1. Open the OpenSprout web app and log in.
2. Navigate to **Settings → MCP Access Tokens**.
3. Click **Create Token**.
4. Give the token a label (e.g., "MCP reliability audit").
5. Copy the generated token (starts with `osp_`). **You will not see it again** — store it securely.
6. Set it as `OPENSPROUT_ACCESS_TOKEN` in your agent configuration.

### Test Account Assumptions

- Use a **dedicated test account** or a sandbox environment — do not run destructive checks against a production account.
- Create a **test plant** named `[TEST] MCP Reliability Plant` so you can easily find and clean up afterward.
- After the audit, **delete the test plant** and any test journal entries, care logs, or species that were created.
- Be mindful of rate limits: the `identify_plant` tool is limited to 10 calls per minute.

## Connecting Your Agent to the MCP Server

### Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "opensprout": {
      "command": "node",
      "args": ["/path/to/opensprout/apps/mcp/dist/index.js"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": "your-anon-key",
        "OPENSPROUT_ACCESS_TOKEN": "osp_your_token_here"
      }
    }
  }
}
```

### Hermes Agent

Add to `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  opensprout:
    command: "node"
    args: ["/path/to/opensprout/apps/mcp/dist/index.js"]
```

Set env vars in `~/.hermes/.env`:

```
OPENSPROUT_ACCESS_TOKEN=osp_your_token_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Cursor

1. Go to **Settings → MCP → Add Server**.
2. **Command**: `node /path/to/opensprout/apps/mcp/dist/index.js`
3. Add the three environment variables in the Cursor MCP server settings.

## Step-by-Step Reliability Checks

### 1. Authentication Verification

**MCP Prompt:**
> List all my plants to verify that the MCP connection is working.

**Expected Result:**
- Returns a JSON array of your plants (may be empty if you have none).
- No authentication errors.
- Response time under 2 seconds.

**Failure Indicators:**
- `OPENSPROUT_ACCESS_TOKEN is required` → token env var missing.
- `Authentication failed: Invalid or revoked token` → token is bad or revoked. Generate a new one.
- `Missing Supabase credentials` → Supabase URL or key is missing.

### 2. Plant CRUD Operations

#### 2a. Create a Test Plant

**MCP Prompt:**
> I need to create a new plant named "[TEST] MCP Reliability Plant" with species "Monstera deliciosa", location "Living Room", and notes "Created for MCP reliability audit". Use the test user ID.

*(Note: The MCP server currently supports `update_plant` but not `create_plant` — plant creation is an app-only flow. If the tool is unavailable, note it as a known limitation.)*

**Expected Result:**
- If `create_plant` is unavailable, the agent should report it as a gap.
- If available, the plant should be created and its ID returned.

#### 2b. List Plants

**MCP Prompt:**
> Show me all plants in my collection, including their species, health status, and location.

**Expected Result:**
- Returns a JSON array of all non-deleted plants.
- The test plant (if created) should appear in the list.
- Verify that the response includes `id`, `name`, `species`, `location`, `health_status`, `created_at`.

#### 2c. Get Plant Details

**MCP Prompt:**
> Show me the complete details for my test plant [TEST] MCP Reliability Plant.

**Expected Result:**
- Returns the full plant record with all fields.
- Fields include `id`, `name`, `species`, `species_id`, `cultivar`, `nickname`, `location`, `acquired_on`, `notes`, `health_status`, `created_at`, `updated_at`.

#### 2d. Update a Plant

**MCP Prompt:**
> Update the test plant's location to "Office" and notes to "Updated during MCP audit".

**Expected Result:**
- Returns the updated plant record.
- `location` should now be "Office".
- `notes` should now be "Updated during MCP audit".
- Other fields should remain unchanged.

### 3. Care Operations

#### 3a. List Care Schedules

**MCP Prompt:**
> Show me the care schedules for all my plants.

**Expected Result:**
- Returns an array of care schedules with `care_type`, `cadence_value`, `cadence_unit`, `next_due_at`.
- May be empty if no schedules are set up.

#### 3b. Log a Care Activity

**MCP Prompt:**
> Log that I watered my test plant [TEST] MCP Reliability Plant today. I used 200ml of water.

**Expected Result:**
- Returns the created care log entry.
- `care_type` should be `water`.
- `amount_ml` should be `200`.
- `plant_id` should match the test plant's ID.

#### 3c. List Care Logs

**MCP Prompt:**
> Show me the recent care logs for my test plant.

**Expected Result:**
- Returns an array of care logs.
- Should include the watering activity just logged.
- Logs are ordered by `occurred_at` descending.

#### 3d. List and Complete a Task

**MCP Prompt:**
> List any pending care tasks for my test plant, then mark the first one as done.

**Expected Result:**
- `list_task_instances` returns pending tasks (may be empty if no schedules exist).
- If a task exists, `complete_task` marks it as done and creates a corresponding care log.
- The completed task should have `status: "done"` and a `completed_at` timestamp.

### 4. Journal Operations

#### 4a. Create a Journal Entry

**MCP Prompt:**
> Create a journal entry for my test plant with the title "MCP Audit Entry", body "Testing journal creation via MCP. Plant looks healthy.", health score 8, and tags ["test", "mcp-audit"].

**Expected Result:**
- Returns the created journal entry.
- `title` should be "MCP Audit Entry".
- `body` should contain the provided text.
- `health_score` should be `8`.
- `tags` should be `["test", "mcp-audit"]`.

#### 4b. List Journal Entries

**MCP Prompt:**
> List the journal entries for my test plant.

**Expected Result:**
- Returns an array of journal entries.
- Should include the entry just created.
- Entries are ordered by `observed_at` descending.

#### 4c. Get a Specific Journal Entry

**MCP Prompt:**
> Get the full details of the journal entry I just created for my test plant.

**Expected Result:**
- Returns the full journal entry with all fields (`id`, `plant_id`, `title`, `body`, `health_score`, `tags`, `observed_at`, `created_at`).

### 5. Species Search

#### 5a. Search by Common Name

**MCP Prompt:**
> Search for plant species matching "monstera".

**Expected Result:**
- Returns species records with `common_name`, `scientific_name`, and care data.
- At least one result (e.g., "Monstera deliciosa").
- Should include `light_preference`, `watering_min_days`, `watering_max_days`, `difficulty`, `pet_safe`.

#### 5b. Get Species Details

**MCP Prompt:**
> Give me the full care guide and any knowledge articles for the Monstera species.

**Expected Result:**
- Returns the species record with all care details.
- Includes associated knowledge articles (may be empty).
- Should show `care_summary`, `common_problems`, `propagation_methods`, `toxicity`.

### 6. Knowledge & Diagnosis

#### 6a. Search Knowledge Base

**MCP Prompt:**
> Search the knowledge base for articles about yellow leaves.

**Expected Result:**
- Returns knowledge articles matching the query.
- Each article has `title`, `body`, `category`, `tags`.

#### 6b. Diagnose a Symptom

**MCP Prompt:**
> My plant has yellow leaves and wilting stems. What could be wrong?

**Expected Result:**
- Returns diagnosis entries matching the symptom.
- Each entry has `symptom`, `cause`, `solution`, `severity`, `category`.
- Results are ordered by `sort_order`.

### 7. Rate Limiting Test

**MCP Prompt:**
> Test the rate limiter by attempting to identify 12 plants in quick succession.

**Expected Result:**
- The first 10 calls should succeed (or return appropriate identify errors if the function is not configured).
- Call 11 and 12 should return:
  ```
  Rate limit exceeded. Max 10 identify calls per minute. Retry in ~Xs.
  ```
- After waiting ~60 seconds, calls should succeed again.

**Note:** The `identify_plant` tool requires a base64-encoded image. If you don't have test images, you can verify rate limiting by sending 10+ rapid calls with a dummy base64 string.

### 8. Error Handling Verification

**MCP Prompt (invalid token):**
> Disconnect the MCP server, set OPENSPROUT_ACCESS_TOKEN to "osp_invalid", restart, and verify the connection.

**Expected Result:**
- Server starts but returns: `Authentication failed: Invalid or revoked token`.
- All tool calls fail with a clear authentication error.

**MCP Prompt (missing env):**
> Remove OPENSPROUT_ACCESS_TOKEN from your configuration and restart the MCP server.

**Expected Result:**
- Server fails to start with: `OPENSPROUT_ACCESS_TOKEN is required`.

## Cleanup Steps

After completing the audit, run the following cleanup:

**MCP Prompt:**
> Delete the test plant "[TEST] MCP Reliability Plant" and all associated journal entries and care logs created during this audit.

**Expected Result:**
- The test plant is deleted (soft-deleted via `deleted_at`).
- Verify deletion by listing all plants — the test plant should no longer appear.

If `delete_plant` is not available as an MCP tool (app-only flow), note it as a limitation and delete manually via the web app.

## Known Limitations

| Limitation | Details |
|---|---|
| **Photo upload** | Adding/updating plant photos is a mobile/web app-only flow. No MCP tool exists for image upload. |
| **Plant creation** | Creating new plants (`create_plant`) is not currently available as an MCP tool. Use the web or mobile app. |
| **Plant deletion** | Soft-deleting plants (`delete_plant` / `archive_plant`) is not exposed as an MCP tool. Clean up via the web app. |
| **Photo-based identify** | `identify_plant` requires a base64-encoded image passed inline. There is no file-upload or URL-based flow. |
| **Identify rate limit** | Hard limit of 10 calls per minute. The limit resets on a rolling 60-second window. |
| **No bulk operations** | All CRUD operations are single-entity only. Bulk imports/exports require the web app. |
| **No user management** | Cannot create users, manage profiles, or change account settings via MCP. |
| **No analytics** | The MCP server does not expose any analytics, statistics, or summary endpoints. |

## Audit Completion Checklist

- [ ] Auth verification passed
- [ ] Plant list retrieved successfully
- [ ] Test plant details retrieved by ID
- [ ] Plant location and notes updated successfully
- [ ] Care schedules listed (or empty confirmed)
- [ ] Care activity logged and verified
- [ ] Care logs returned recent activity
- [ ] Task instances listed and a task completed (if tasks existed)
- [ ] Journal entry created, listed, and retrieved by ID
- [ ] Species search returned results
- [ ] Species guide returned care data + articles
- [ ] Knowledge base search returned articles
- [ ] Diagnosis search returned causes/solutions
- [ ] Rate limiter enforced correctly
- [ ] All test data cleaned up
