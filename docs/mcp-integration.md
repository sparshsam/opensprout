# OpenSprout MCP Server

AI agents (Claude Code, Hermes Agent, Cursor, etc.) can read your plant data and perform actions on your behalf through the OpenSprout MCP server. The server exposes 25 tools covering plant management, care tracking, journal entries, species knowledge, and plant identification.

## Quick Start

1. **Generate an access token** in OpenSprout Settings → MCP Access Tokens → Create Token
2. **Configure your AI agent** to connect to the MCP server (see below)
3. **Start using natural-language commands** like "Show me plants that need watering today" or "Log that I watered my monstera"

### Claude Code

```json
// ~/.claude/settings.json
{
  "mcpServers": {
    "opensprout": {
      "command": "node",
      "args": ["/path/to/opensprout/apps/mcp/dist/index.js"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "https://rbdyrymtgfqqkdemicdo.supabase.co",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": "your-anon-key",
        "OPENSPROUT_ACCESS_TOKEN": "osp_abc123..."
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

Set env vars in the Hermes `.env`:

```
OPENSPROUT_ACCESS_TOKEN=osp_abc123...
NEXT_PUBLIC_SUPABASE_URL=https://rbdyrymtgfqqkdemicdo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Cursor

Settings → MCP → Add server → Command: `node /path/to/opensprout/apps/mcp/dist/index.js`

Then add the environment variables in the Cursor MCP server settings.

## Available Tools (25)

| Tool | Description | Auth Required |
||---|---|---|
| `list_plants` | List all your plants | Yes |
| `get_plant` | Get complete details for one plant | Yes |
| `add_plant` | Add a new plant to your collection | Yes |
| `update_plant` | Update a plant's name, location, notes, or health | Yes |
| `delete_plant` | Soft-delete a plant | Yes |
| `archive_plant` | Archive a plant (hide from active list) | Yes |
| `restore_plant` | Restore an archived plant | Yes |
| `search_species` | Search plant species by name | Yes |
| `get_species` | Get care guide + knowledge for a species | Yes |
| `create_care_schedule` | Create a recurring care schedule | Yes |
| `list_care_schedules` | List care schedules | Yes |
| `list_care_logs` | List recent care activity | Yes |
| `list_task_instances` | List pending/completed care tasks | Yes |
| `log_care_activity` | Log watering, fertilizing, etc. | Yes |
| `complete_task` | Mark a care task as done | Yes |
| `skip_task` | Skip a pending care task | Yes |
| `snooze_task` | Snooze a task until a specific date | Yes |
| `list_journal_entries` | List journal entries for a plant | Yes |
| `get_journal_entry` | Get a specific journal entry | Yes |
| `create_journal_entry` | Create a journal entry | Yes |
| `update_journal_entry` | Update an existing journal entry | Yes |
| `delete_journal_entry` | Soft-delete a journal entry | Yes |
| `search_knowledge` | Search plant knowledge base | Yes |
| `diagnose_plant` | Get diagnosis for a symptom | Yes |
| `identify_plant` | Identify a plant from a photo | Yes (rate-limited) |

## Example Queries

Here are things you can ask your AI agent once OpenSprout MCP is connected:

> "What plants do I have and when was my monstera last watered?"

> "Log that I watered my snake plant today."

> "My pothos has yellow leaves, what could be wrong?"

> "Create a journal entry for my fiddle leaf fig noting it grew 3 new leaves."

> "Identify this plant from the photo I just took."

## Rate Limiting

The `identify_plant` tool is rate-limited to **10 calls per minute** because PlantNet API calls incur costs.

## Security

- Tokens are scoped to your user account only — agents can only access your data
- The MCP server uses the same Row-Level Security (RLS) policies as the web app
- You can revoke tokens at any time from Settings → MCP Access Tokens
- The server never exposes the PlantNet API key or Supabase service role key
- Only SHA-256 hashes of tokens are stored in the database — never the raw token
- Tokens are passed via environment variables, not command-line arguments

## Troubleshooting

**"OPENSPROUT_ACCESS_TOKEN is required"** — The token env var is missing. Generate one from Settings.

**"Authentication failed"** — The token is invalid or has been revoked. Generate a new one.

**"Rate limit exceeded"** — You've made 10 identify calls in the last minute. Wait and try again.

**"Missing Supabase credentials"** — The `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` env vars need to be set.

## Local Development

```bash
cd apps/mcp

# Install dependencies
npm install

# Build
npm run build

# Run (will fail without token)
OPENSPROUT_ACCESS_TOKEN="your-token" \
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-anon-key" \
node dist/index.js
```
