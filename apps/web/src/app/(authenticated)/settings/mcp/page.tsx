"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/lib/context/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, Copy, Trash2, Plus, Check, Eye, EyeOff } from "lucide-react";
import {
  listMcpTokens,
  createMcpToken,
  revokeMcpToken,
  type McpToken,
  type McpTokenWithSecret,
} from "@/lib/data/mcp-tokens";

export default function McpSettingsPage() {
  const { user, supabase } = useApp();
  const [tokens, setTokens] = useState<McpToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTokenName, setNewTokenName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<McpTokenWithSecret | null>(null);
  const [copied, setCopied] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const loadTokens = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);
    try {
      const data = await listMcpTokens(supabase, user.id);
      const active = data.filter(
        (t) => !t.revoked_at,
      ) as unknown as McpToken[];
      setTokens(active);
    } catch (e) {
      console.error("Failed to load MCP tokens:", e);
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  async function handleCreate() {
    if (!supabase || !user || !newTokenName.trim()) return;
    setCreating(true);
    try {
      const result = await createMcpToken(supabase, user.id, newTokenName.trim());
      setNewToken(result);
      setNewTokenName("");
      await loadTokens();
    } catch (e) {
      console.error("Failed to create token:", e);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(tokenId: string) {
    if (!supabase || !user) return;
    try {
      await revokeMcpToken(supabase, tokenId, user.id);
      setTokens((prev) => prev.filter((t) => t.id !== tokenId));
    } catch (e) {
      console.error("Failed to revoke token:", e);
    }
  }

  function handleCopy() {
    if (!newToken) return;
    navigator.clipboard.writeText(newToken.rawToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDismissNewToken() {
    setNewToken(null);
    setShowToken(false);
    setCopied(false);
  }

  return (
    <>
      <header className="flex flex-col gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground">
            MCP Access Tokens
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personal access tokens let AI agents (Claude Code, Hermes, Cursor)
            securely access your OpenSprout data.
          </p>
        </div>
      </header>

      <section className="space-y-5 py-6 max-w-2xl">
        {/* New token dialog */}
        {newToken && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950">
            <h2 className="text-lg font-bold text-amber-900 dark:text-amber-200">
              Token Created
            </h2>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
              <strong>Copy this token now. You won&apos;t be able to see it again.</strong>
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 rounded border border-amber-300 bg-white px-3 py-2 text-sm font-mono dark:border-amber-600 dark:bg-amber-900 dark:text-amber-200">
                {showToken
                  ? newToken.rawToken
                  : newToken.rawToken.substring(0, 12) + "••••••••••••••••••••••••••••"}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowToken(!showToken)}
                title={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                title="Copy token"
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </Button>
            </div>
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              Name: {newToken.name} &middot; Created:{" "}
              {new Date(newToken.created_at).toLocaleString()}
            </p>
            <div className="mt-3">
              <Button variant="default" onClick={handleDismissNewToken}>
                Done — I saved my token
              </Button>
            </div>
          </div>
        )}

        {/* Create new token */}
        <div className="rounded-md border border-border bg-card p-4 shadow-panel">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Key size={18} aria-hidden />
            Create New Token
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Give this token a name so you can identify it later.
          </p>
          <div className="mt-4 flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="token-name" className="block text-sm font-medium mb-1">
                Token name
              </label>
              <Input
                id="token-name"
                placeholder="e.g., Claude Desktop"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                disabled={creating}
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={creating || !newTokenName.trim() || !!newToken}
            >
              <Plus size={16} aria-hidden />
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>

        {/* Active tokens */}
        <div className="rounded-md border border-border bg-card p-4 shadow-panel">
          <h2 className="text-lg font-bold">Active Tokens</h2>
          {loading ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
          ) : tokens.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No active tokens. Create one above to connect an AI agent.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {tokens.map((token) => (
                <li
                  key={token.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{token.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {token.token_prefix}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created{" "}
                      {new Date(token.created_at).toLocaleDateString()}
                      {token.last_used_at
                        ? ` · Last used ${new Date(token.last_used_at).toLocaleDateString()}`
                        : " · Never used"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRevoke(token.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    title="Revoke token"
                  >
                    <Trash2 size={16} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Info */}
        <div className="rounded-md border border-border bg-card p-4 shadow-panel">
          <h2 className="text-lg font-bold">How to Use</h2>
          <div className="mt-2 space-y-2 text-sm text-muted-foreground">
            <p>
              Add the token to your AI agent&apos;s MCP server configuration
              as the <code className="text-foreground">OPENSPROUT_ACCESS_TOKEN</code> environment variable.
            </p>
            <p>
              See{" "}
              <a
                href="/docs/mcp-integration.md"
                className="text-primary hover:underline"
              >
                docs/mcp-integration.md
              </a>{" "}
              for setup instructions for Claude Code, Hermes, Cursor, and
              other agents.
            </p>
            <p className="text-xs">
              Tokens are permanent until revoked. Only SHA-256 hashes are
              stored — the full token cannot be recovered if lost.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
