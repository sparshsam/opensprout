#!/usr/bin/env node
import { spawn } from "child_process";

const MCP = "/home/spars/repos/opensprout/apps/mcp/dist/index.js";

let mid = 1;
function jr(m, a) {
  return JSON.stringify({ jsonrpc: "2.0", id: mid++, method: "tools/call", params: { name: m, arguments: a } }) + "\n";
}

const child = spawn("node", [MCP], {
  env: {
    OPENSPROUT_ACCESS_TOKEN: process.env.OPENSPROUT_ACCESS_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    PATH: process.env.PATH || "",
  },
  stdio: ["pipe", "pipe", "pipe"],
});

let buf = "";
const p = [];

child.stdout.on("data", (d) => {
  buf += d.toString();
  while (buf.includes("\n")) {
    const nl = buf.indexOf("\n");
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (line) {
      try { const j = JSON.parse(line); if (j.id != null) p.push(j); } catch {}
    }
  }
});

function w(t) {
  return new Promise((r) => {
    const to = setTimeout(() => r({ error: { message: "TIMEOUT" } }), t || 20000);
    function c() { if (p.length > 0) { clearTimeout(to); r(p.shift()); } else setTimeout(c, 50); }
    c();
  });
}

async function main() {
  // Initialize
  child.stdin.write(JSON.stringify({
    jsonrpc: "2.0", id: mid++, method: "initialize",
    params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "audit", version: "1" } },
  }) + "\n");
  await w(5000);

  console.log("\n=== REAL-WORLD RELIABILITY AUDIT ===\n");

  const results = [];

  async function go(step, label, method, args) {
    child.stdin.write(jr(method, args));
    const r = await w();
    const res = r.result || {};
    const err = r.error || res.error || null;
    const txt = res.content ? res.content.map((c) => c.text).join("") : "";
    results.push({ step, label, err, txt });
    return { err, txt, res };
  }

  // Step 1: Search specis
  let r1 = await go(1, "Search for monstera specis", "search_specis", { query: "monstera" });
  let sid = null;
  if (r1.txt) try { const s = JSON.parse(r1.txt); if (s.length > 0) sid = s[0].id; } catch {}

  // Step 2: Add plant
  let r2 = await go(2, 'Add plant "Living Room Monstera"', "add_plant", {
    name: "Living Room Monstera",
    specis: "Monstera deliciosa",
    specisId: sid,
    location: "Living Room - East Window",
    notes: "Reliability audit test plant",
    healthStatus: "thriving",
  });
  let pid = null;
  if (r2.txt) try { pid = JSON.parse(r2.txt).id; } catch {}

  // Step 3: List all plants
  await go(3, "List all plants", "list_plants", {});

  if (pid) {
    const today = new Date().toISOString().split("T")[0];
    // Step 4: Create watering schedule
    await go(4, "Create watering schedule (every 7 days)", "create_care_schedule", {
      plantId: pid, careType: "water", cadenceValue: 7, cadenceUnit: "day", startDate: today,
    });

    // Step 5: List pending tasks
    let r5 = await go(5, "List pending tasks", "list_task_instances", { plantId: pid, status: "pending" });
    let tid = null;
    if (r5.txt) try { const ts = JSON.parse(r5.txt); if (ts.length > 0) tid = ts[0].id; } catch {}

    // Step 6: Complete task
    if (tid) {
      await go(6, "Complete watering task", "complete_task", { taskId: tid, notes: "Watered thoroughly" });
    } else {
      results.push({ step: 6, label: "Complete watering task (no tasks available)", err: { message: "SKIPPED - no pending task instances (tasks generated separately)" }, txt: "" });
    }

    // Step 7: Create journal entry
    await go(7, 'Create journal entry ("new leaf opened today")', "create_journal_entry", {
      plantId: pid, title: "New Leaf Unfurling",
      body: "new leaf opened today. Beautiful fenestrations!",
      healthScore: 4, tags: ["new-leaf", "growth"],
    });

    // Step 8: Archive
    await go(8, "Archive plant", "archive_plant", { plantId: pid });
    // Step 9: Restore
    await go(9, "Restore plant", "restore_plant", { plantId: pid });
    // Step 10: Delete
    await go(10, "Delete plant", "delete_plant", { plantId: pid });
  } else {
    results.push({ step: 0, label: "FAILED to create plant", err: { message: "No plant ID returned" }, txt: "" });
  }

  child.stdin.end();

  // Print results
  for (const r of results) {
    const ok = r.err ? "FAIL" : "  OK";
    console.log(`[${ok}] ${r.step}. ${r.label}`);
    if (r.err) console.log(`       ${r.err.message}`);
    if (r.txt && r.txt.length < 500) console.log(`       ${r.txt.replace(/\n/g, "\n       ")}`);
    else if (r.txt) console.log(`       (${r.txt.length} chars)`);
  }

  console.log("\n=== AUDIT COMPLETE ===");
  setTimeout(() => process.exit(0), 300);
}

main().catch((e) => { console.error(e); process.exit(1); });
