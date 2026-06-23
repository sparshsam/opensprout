import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { Bot, Terminal, Settings, Key, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Access \u2014 OpenSprout",
  description:
    "Connect AI agents like Claude, Hermes, and Cursor to your OpenSprout plant data through MCP. Generate a token, configure your agent, and start using natural language.",
};

const claudeConfig = [
  String.raw`{`,
  String.raw`  "mcpServers": {`,
  String.raw`    "opensprout": {`,
  String.raw`      "command": "node",`,
  String.raw`      "args": ["/path/to/opensprout/apps/mcp/dist/index.js"],`,
  String.raw`      "env": {`,
  String.raw`        "OPENSPROUT_ACCESS_TOKEN": "osp_your_token_here"`,
  String.raw`      }`,
  String.raw`    }`,
  String.raw`  }`,
  String.raw`}`,
].join("\n");

const hermesConfig = [
  "# ~/.hermes/config.yaml",
  "mcp_servers:",
  '  opensprout:',
  '    command: "node"',
  '    args: ["/path/to/opensprout/apps/mcp/dist/index.js"]',
  "",
  "# ~/.hermes/.env",
  "OPENSPROUT_ACCESS_TOKEN=osp_yo...ter"];

const cursorConfig = [
  "Command: node /path/to/opensprout/apps/mcp/dist/index.js",
  "",
  "Environment variables:",
  "OPENSPROUT_ACCESS_TOKEN=osp_yo...ter"];

const gitCommands = [
  "git clone https://github.com/sparshsam/opensprout.git",
  "cd opensprout",
  "npm install",
  "npm run build",
].join("\n");

const examplePrompts = [
  {
    prompt: '"Show me all my plants that need watering today."',
    result: "Lists every plant with a pending care schedule, sorted by urgency.",
  },
  {
    prompt: '"Log that I watered my Monstera with 300ml."',
    result: "Creates a care log entry and marks any pending watering task as done.",
  },
  {
    prompt: '"My Peace Lily has drooping leaves \u2014 what could be wrong?"',
    result: "Searches the diagnosis library and returns possible causes and solutions.",
  },
  {
    prompt: '"Create a journal entry for my Fiddle Leaf Fig \u2014 it grew 3 new leaves!"',
    result: "Saves an observation with tags, timestamp, and optional health score.",
  },
  {
    prompt: '"Set up a weekly watering schedule for my Snake Plant starting Monday."',
    result: "Creates a recurring care schedule that generates tasks automatically.",
  },
  {
    prompt: '"Export all my plant data as JSON."',
    result: "Downloads your full collection \u2014 plants, schedules, logs, and journal entries.",
  },
  {
    prompt: '"Search for Monstera care tips in the knowledge base."',
    result: "Returns care guides, propagation instructions, and common problems.",
  },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border/40 bg-muted p-4 text-sm leading-relaxed text-foreground">
      {children}
    </pre>
  );
}

export default function McpPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <main id="main-content" className="px-6 py-28 sm:py-36 lg:px-10">
        <article className="mx-auto max-w-2xl">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Bot size={24} className="text-primary" aria-hidden />
          </div>
          <p className="text-label mb-4 text-primary">AI Access</p>
          <h1 className="text-hero mb-6 text-foreground">
            Connect AI agents to your garden
          </h1>
          <p className="mb-16 max-w-xl text-lg leading-relaxed text-muted-foreground">
            OpenSprout supports the Model Context Protocol (MCP), a standard
            that lets AI agents read and write your plant data through natural
            language. Ask your assistant to check schedules, log care, diagnose
            problems, or search the knowledge base \u2014 without opening the app.
          </p>

          <section className="mb-16">
            <div className="mb-6 flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-black text-primary">
                1
              </span>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Generate an access token
                </h2>
                <p className="text-sm text-muted-foreground">
                  A token is like a password that lets your AI agent securely
                  connect to your account.
                </p>
              </div>
            </div>
            <div className="ml-14 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">1.</strong>{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>{" "}
                to OpenSprout.
              </p>
              <p>
                <strong className="text-foreground">2.</strong> Go to{" "}
                <strong className="text-foreground">Settings \u2192 MCP Access Tokens</strong>.
              </p>
              <p>
                <strong className="text-foreground">3.</strong> Click{" "}
                <strong className="text-foreground">Create Token</strong>, give
                it a name like &ldquo;Claude Desktop&rdquo; or &ldquo;Hermes&rdquo;, and copy the
                generated token.
              </p>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <p className="font-semibold">Save it now</p>
                <p className="mt-1 text-xs">
                  The full token is shown only once. It starts with{" "}
                  <code className="font-mono text-xs">osp_</code>. Store it
                  somewhere safe &mdash; you&rsquo;ll never see it again.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <div className="mb-6 flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-black text-primary">
                2
              </span>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Configure your AI agent
                </h2>
                <p className="text-sm text-muted-foreground">
                  Add the MCP server to your agent&rsquo;s configuration. Pick the
                  one you use:
                </p>
              </div>
            </div>

            <div className="ml-14 space-y-8">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Terminal size={16} className="text-primary" aria-hidden />
                  <h3 className="text-sm font-bold text-foreground">
                    Claude Desktop
                  </h3>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">
                  First, clone the repo and build the MCP server:
                </p>
                <CodeBlock>{gitCommands}</CodeBlock>
                <p className="mb-2 mt-3 text-xs text-muted-foreground">
                  Then add this to{" "}
                  <code className="font-mono text-xs">~/Library/Application Support/Claude/claude_desktop_config.json</code>:
                </p>
                <CodeBlock>{claudeConfig}</CodeBlock>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Terminal size={16} className="text-primary" aria-hidden />
                  <h3 className="text-sm font-bold text-foreground">
                    Hermes Agent
                  </h3>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">
                  Add to your config and env files:
                </p>
                <CodeBlock>{hermesConfig.join("\n")}</CodeBlock>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Terminal size={16} className="text-primary" aria-hidden />
                  <h3 className="text-sm font-bold text-foreground">
                    Cursor
                  </h3>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">
                  Go to <strong>Settings \u2192 MCP \u2192 Add Server</strong> and enter:
                </p>
                <CodeBlock>{cursorConfig.join("\n")}</CodeBlock>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <div className="mb-6 flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-black text-primary">
                3
              </span>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Start using natural language
                </h2>
                <p className="text-sm text-muted-foreground">
                  Once connected, just ask your AI agent anything about your
                  plants. Here are real examples:
                </p>
              </div>
            </div>

            <div className="ml-14 space-y-4">
              {examplePrompts.map((item, i) => (
                <div key={i} className="rounded-xl border border-border/40 bg-muted/50 p-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.prompt}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.result}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-display mb-6 text-foreground">
              What you can do with AI
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-border/40 p-5">
                <img src="/app-icon.png" alt="" className="mb-3 h-5 w-5" aria-hidden />
                <h3 className="mb-1 text-sm font-bold text-foreground">Manage your collection</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Add, update, search, and organize your plants. Track species, locations, and health status.
                </p>
              </div>
              <div className="rounded-xl border border-border/40 p-5">
                <Settings size={20} className="mb-3 text-primary" aria-hidden />
                <h3 className="mb-1 text-sm font-bold text-foreground">Care schedules</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Create watering and fertilizing schedules. Log care activity. Mark tasks complete.
                </p>
              </div>
              <div className="rounded-xl border border-border/40 p-5">
                <Key size={20} className="mb-3 text-primary" aria-hidden />
                <h3 className="mb-1 text-sm font-bold text-foreground">Journal and diagnose</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Write journal entries, track health scores, and get symptom-based diagnosis with causes and solutions.
                </p>
              </div>
              <div className="rounded-xl border border-border/40 p-5">
                <Bot size={20} className="mb-3 text-primary" aria-hidden />
                <h3 className="mb-1 text-sm font-bold text-foreground">Search and export</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Search the plant knowledge base. Export all your data as JSON for backup or migration.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-16 rounded-xl border border-border/40 bg-muted/30 p-6">
            <h2 className="text-sm font-bold text-foreground">Privacy and security</h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>Tokens are hashed (SHA-256) before storage \u2014 the raw token is never stored.</li>
              <li>You can revoke any token from Settings at any time. Revoked tokens stop working immediately.</li>
              <li>The AI agent can only access data belonging to your account. Every query is scoped to your user.</li>
              <li>No third-party analytics or tracking. MCP communication is direct between your agent and Supabase.</li>
            </ul>
          </section>

          <div className="border-t border-border/40 mt-8 pt-8 flex flex-wrap gap-6">
            <Link href="/" className="text-sm font-semibold text-primary hover:underline">Home</Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
          </div>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
