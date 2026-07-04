/**
 * Dashboard HTML for the local web UI.
 *
 * Single-file SPA (HTML + inline CSS + inline JS) embedded as a string so the
 * web server has zero static-asset dependencies. Fetches JSON from the server's
 * own REST endpoints (see server.ts).
 *
 * Design goals: dependency-free, responsive, dark theme matching the brand
 * indigo accent (#6366f1), instant search via the API, version list per prompt.
 */

export function dashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>promptstash dashboard</title>
<style>
  :root {
    --bg: #0f1115;
    --panel: #171a21;
    --panel-2: #1d2129;
    --border: #2a2f3a;
    --text: #e6e8ec;
    --muted: #8b93a7;
    --accent: #6366f1;
    --accent-2: #818cf8;
    --green: #22c55e;
    --red: #ef4444;
    --mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
    --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    font-size: 14px;
    line-height: 1.5;
    min-height: 100vh;
  }
  header {
    position: sticky; top: 0; z-index: 10;
    background: rgba(15,17,21,0.85);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
    padding: 14px 20px;
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  }
  header .logo {
    font-weight: 700; font-size: 18px; letter-spacing: -0.02em;
    color: var(--accent-2);
    display: flex; align-items: center; gap: 8px;
  }
  header .logo::before { content: "\\1F5C4\\FE0F"; font-size: 20px; }
  header .sub { color: var(--muted); font-size: 12px; }
  header .spacer { flex: 1; }
  .search-row { display: flex; align-items: center; gap: 8px; }
  input[type="search"], input[type="text"] {
    background: var(--panel-2); color: var(--text);
    border: 1px solid var(--border); border-radius: 8px;
    padding: 8px 12px; font-size: 14px; min-width: 240px; outline: none;
    font-family: var(--sans);
  }
  input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(99,102,241,0.18); }
  select, button {
    background: var(--panel-2); color: var(--text);
    border: 1px solid var(--border); border-radius: 8px;
    padding: 8px 12px; font-size: 14px; cursor: pointer; font-family: var(--sans);
  }
  button.primary { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 600; }
  button:hover { border-color: var(--accent-2); }
  button.primary:hover { background: var(--accent-2); }
  main {
    display: grid; grid-template-columns: 340px 1fr; gap: 0;
    height: calc(100vh - 61px);
  }
  .sidebar {
    border-right: 1px solid var(--border); overflow-y: auto;
    background: var(--panel);
  }
  .prompt-item {
    padding: 12px 16px; border-bottom: 1px solid var(--border);
    cursor: pointer; display: flex; flex-direction: column; gap: 4px;
  }
  .prompt-item:hover { background: var(--panel-2); }
  .prompt-item.active { background: var(--panel-2); border-left: 3px solid var(--accent); padding-left: 13px; }
  .prompt-item .name { font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 8px; }
  .prompt-item .name .ver { font-size: 11px; color: var(--muted); font-weight: 400; }
  .prompt-item .desc { color: var(--muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }
  .tag {
    background: rgba(99,102,241,0.15); color: var(--accent-2);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 999px; padding: 1px 8px; font-size: 11px;
  }
  .detail { overflow-y: auto; padding: 20px 24px; }
  .empty { color: var(--muted); text-align: center; padding-top: 80px; }
  .empty .big { font-size: 40px; margin-bottom: 12px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 24px 0 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
  .meta { color: var(--muted); font-size: 12px; margin-bottom: 16px; }
  pre.body {
    background: var(--panel-2); border: 1px solid var(--border);
    border-radius: 10px; padding: 16px; overflow: auto; font-family: var(--mono);
    font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-word;
  }
  .vars { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 4px; }
  .var-chip {
    background: var(--panel-2); border: 1px dashed var(--border);
    color: var(--green); border-radius: 6px; padding: 2px 8px;
    font-family: var(--mono); font-size: 12px;
  }
  .version-row {
    display: flex; align-items: center; gap: 12px; padding: 8px 12px;
    border-radius: 8px; cursor: pointer; border: 1px solid transparent;
  }
  .version-row:hover { background: var(--panel-2); border-color: var(--border); }
  .version-row.current { background: var(--panel-2); border-color: var(--accent); }
  .version-row .num { font-family: var(--mono); color: var(--accent-2); min-width: 36px; }
  .version-row .msg { color: var(--text); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .version-row .date { color: var(--muted); font-size: 12px; }
  .diff-view { background: var(--panel-2); border: 1px solid var(--border); border-radius: 10px; padding: 12px; margin-top: 10px; font-family: var(--mono); font-size: 12px; line-height: 1.6; }
  .diff-add { color: var(--green); }
  .diff-del { color: var(--red); }
  .diff-meta { color: var(--muted); }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; background: var(--panel-2); border: 1px solid var(--border); color: var(--muted); }
  .count { color: var(--muted); font-size: 12px; padding: 8px 16px; border-bottom: 1px solid var(--border); background: var(--panel); }
  .footer-link { color: var(--muted); font-size: 12px; text-decoration: none; }
  .footer-link:hover { color: var(--accent-2); }
  .toast {
    position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%);
    background: var(--panel-2); border: 1px solid var(--accent); color: var(--text);
    padding: 8px 16px; border-radius: 8px; font-size: 13px; opacity: 0;
    transition: opacity 0.2s; pointer-events: none; z-index: 50;
  }
  .toast.show { opacity: 1; }
  @media (max-width: 720px) {
    main { grid-template-columns: 1fr; grid-template-rows: 40vh 1fr; height: calc(100vh - 61px); }
    .sidebar { border-right: none; border-bottom: 1px solid var(--border); }
  }
</style>
</head>
<body>
<header>
  <div class="logo">promptstash</div>
  <span class="sub" id="storePath">local dashboard</span>
  <div class="spacer"></div>
  <div class="search-row">
    <input type="search" id="q" placeholder="Search prompts..." autocomplete="off" />
    <select id="mode">
      <option value="lexical">Lexical</option>
      <option value="semantic">Semantic</option>
    </select>
  </div>
  <button class="primary" id="refresh">Refresh</button>
</header>
<main>
  <aside class="sidebar">
    <div class="count" id="count">loading...</div>
    <div id="list"></div>
  </aside>
  <section class="detail" id="detail">
    <div class="empty">
      <div class="big">&#128269;</div>
      <div>Select a prompt or search your library.</div>
    </div>
  </section>
</main>
<div class="toast" id="toast"></div>
<script>
  let allPrompts = [];
  let activeName = null;
  let activeVersion = null;
  let activeDiffFrom = null;

  const $ = (id) => document.getElementById(id);
  // Build an element. The optional third arg is set as textContent (safe for
  // untrusted prompt data) — NEVER as innerHTML. For mixed safe+untrusted
  // content, build DOM nodes explicitly and append text-only children.
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = String(text);
    return e;
  };

  async function api(path, opts) {
    const r = await fetch(path, opts);
    if (!r.ok) { const t = await r.text(); throw new Error(t || r.statusText); }
    const ct = r.headers.get("content-type") || "";
    return ct.includes("application/json") ? r.json() : r.text();
  }

  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1800);
  }

  async function loadList() {
    const mode = $("mode").value;
    const q = $("q").value.trim();
    let prompts;
    if (q) {
      const hits = await api("/api/search?q=" + encodeURIComponent(q) + (mode === "semantic" ? "&semantic=1" : ""));
      prompts = hits.map((h) => h.prompt);
    } else {
      prompts = await api("/api/prompts");
    }
    allPrompts = prompts;
    renderList();
  }

  function renderList() {
    const list = $("list");
    list.innerHTML = "";
    $("count").textContent = allPrompts.length === 0
      ? "no prompts"
      : allPrompts.length + " prompt" + (allPrompts.length === 1 ? "" : "s");
    for (const p of allPrompts) {
      const item = el("div", "prompt-item" + (p.name === activeName ? " active" : ""));
      const nameRow = el("div", "name");
      nameRow.appendChild(el("span", null, p.name));
      nameRow.appendChild(el("span", "ver", "v" + p.currentVersion));
      item.appendChild(nameRow);
      if (p.description) item.appendChild(el("div", "desc", p.description));
      if (p.tags && p.tags.length) {
        const tags = el("div", "tags");
        for (const t of p.tags) tags.appendChild(el("span", "tag", t));
        item.appendChild(tags);
      }
      item.onclick = () => selectPrompt(p.name);
      list.appendChild(item);
    }
  }

  async function selectPrompt(name) {
    activeName = name; activeVersion = null; activeDiffFrom = null;
    renderList();
    const p = await api("/api/prompts/" + encodeURIComponent(name));
    const versions = await api("/api/prompts/" + encodeURIComponent(name) + "/versions");
    renderDetail(p, versions);
  }

  function renderDetail(p, versions) {
    const d = $("detail");
    d.innerHTML = "";
    const h = el("div");
    h.appendChild(el("h1", null, p.name));

    // Meta line built from text nodes (no innerHTML) so p.description can't
    // inject HTML. The "no description" fallback uses textContent too.
    const meta = el("div", "meta");
    meta.appendChild(document.createTextNode("v" + p.currentVersion + " • "));
    if (p.description) {
      meta.appendChild(document.createTextNode(p.description));
    } else {
      const i = el("i", null, "no description");
      meta.appendChild(i);
    }
    meta.appendChild(document.createTextNode(" • updated " + (p.updatedAt || "").slice(0, 10)));
    h.appendChild(meta);

    if (p.variables && p.variables.length) {
      const vars = el("div", "vars");
      vars.appendChild(el("span", "pill", "vars"));
      for (const v of p.variables) vars.appendChild(el("span", "var-chip", "{{" + v + "}}"));
      h.appendChild(vars);
    }
    if (p.tags && p.tags.length) {
      const tags = el("div", "tags");
      for (const t of p.tags) tags.appendChild(el("span", "tag", t));
      h.appendChild(tags);
    }
    d.appendChild(h);

    const latest = versions[versions.length - 1];
    if (latest) renderBody(latest.body);

    d.appendChild(el("h2", null, "Versions"));
    const vlist = el("div");
    versions.slice().reverse().forEach((v) => {
      const row = el("div", "version-row" + (v.versionNumber === latest.versionNumber ? " current" : ""));
      row.dataset.vn = String(v.versionNumber);
      row.appendChild(el("span", "num", "v" + v.versionNumber));
      row.appendChild(el("span", "msg", v.message || ""));
      row.appendChild(el("span", "date", (v.createdAt || "").slice(0, 10)));
      const diffBtn = el("button", "diff-btn", "diff");
      diffBtn.style.background = "var(--panel-2)";
      diffBtn.style.fontSize = "11px";
      diffBtn.style.padding = "2px 8px";
      row.appendChild(diffBtn);

      // Single-click row = view this version's body.
      row.onclick = async (ev) => {
        if (ev.target === diffBtn) return; // handled separately
        activeVersion = v.versionNumber;
        const vv = await api("/api/prompts/" + encodeURIComponent(p.name) + "/versions/" + v.versionNumber);
        renderBody(vv.body);
      };

      // The "diff" button starts/cancels a two-step diff and is independent of
      // body viewing. Click diff on one version, then diff on another, to
      // compare. Click diff again on the marked one to cancel.
      diffBtn.onclick = async (ev) => {
        ev.stopPropagation();
        const marked = vlist.querySelector('.version-row[data-diff-mark="1"]');
        if (activeDiffFrom !== null) {
          if (v.versionNumber === activeDiffFrom) {
            activeDiffFrom = null;
            if (marked) { marked.removeAttribute("data-diff-mark"); marked.style.borderColor = ""; }
            diffBtn.textContent = "diff";
            toast("Diff cancelled");
            return;
          }
          const a = Math.min(activeDiffFrom, v.versionNumber);
          const b = Math.max(activeDiffFrom, v.versionNumber);
          if (marked) { marked.removeAttribute("data-diff-mark"); marked.style.borderColor = ""; (marked.querySelector(".diff-btn") || {}).textContent = "diff"; }
          diffBtn.textContent = "diff";
          await showDiff(a, b);
          activeDiffFrom = null;
        } else {
          activeDiffFrom = v.versionNumber;
          row.setAttribute("data-diff-mark", "1");
          row.style.borderColor = "var(--green)";
          diffBtn.textContent = "vs…";
          toast("Marked v" + v.versionNumber + " for diff. Click 'diff' on another version to compare (or this one to cancel).");
        }
      };
      vlist.appendChild(row);
    });
    d.appendChild(vlist);
    d.appendChild(el("div", "meta", "Click a row to view its body. Use each row's 'diff' button to compare two versions."));
  }

  function renderBody(body) {
    // Replace existing body pre, keep rest.
    let pre = document.querySelector("pre.body");
    const h2 = document.querySelector("h2");
    if (!pre) {
      pre = el("pre", "body");
      const anchor = h2 ? h2 : $("detail");
      anchor.parentNode.insertBefore(pre, anchor);
    }
    pre.textContent = body || "";
  }

  async function showDiff(a, b) {
    const diff = await api("/api/prompts/" + encodeURIComponent(activeName) + "/diff/" + a + "/" + b);
    let pre = document.querySelector("pre.body");
    const h2 = document.querySelector("h2");
    if (!pre) { pre = el("pre","body"); if (h2) h2.parentNode.insertBefore(pre, h2); else $("detail").appendChild(pre); }
    pre.textContent = "";
    pre.classList.remove("diff-view");
    const dv = el("div", "diff-view");
    if (!diff || (!diff.addedLines?.length && !diff.removedLines?.length && !diff.variableChanges?.length)) {
      dv.appendChild(el("span", "diff-meta", "No textual changes between v" + a + " and v" + b + "."));
    } else {
      dv.appendChild(el("div", "diff-meta", "Diff v" + a + " → v" + b));
      if (diff.variableChanges && diff.variableChanges.length) {
        dv.appendChild(el("div", "diff-meta", "Variables:"));
        const ul = el("div");
        for (const c of diff.variableChanges) {
          const cls = c.type === "added" ? "diff-add" : "diff-del";
          ul.appendChild(el("div", cls, (c.type === "added" ? "+ " : "- ") + "{{" + c.name + "}}"));
        }
        dv.appendChild(ul);
      }
      if (diff.removedLines && diff.removedLines.length) {
        for (const l of diff.removedLines) dv.appendChild(el("div", "diff-del", "- " + l));
      }
      if (diff.addedLines && diff.addedLines.length) {
        for (const l of diff.addedLines) dv.appendChild(el("div", "diff-add", "+ " + l));
      }
    }
    pre.replaceWith(dv);
    toast("Showing diff v" + a + " → v" + b);
  }

  async function init() {
    try {
      const info = await api("/api/info");
      $("storePath").textContent = info.storePath
        ? "store: " + info.storePath.replace(/^.*\\\\/, "").replace(/^.*\\//,"")
        : "local dashboard";
    } catch {}
    await loadList();
    $("q").addEventListener("input", debounce(loadList, 200));
    $("mode").addEventListener("change", loadList);
    $("refresh").addEventListener("click", () => { loadList(); if (activeName) selectPrompt(activeName); toast("refreshed"); });
  }

  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  init();
</script>
</body>
</html>`;
}
