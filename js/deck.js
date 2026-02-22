(async function () {
  const DATA_URL = "/assets/support_hints.json";
  const STORAGE_KEY = "umatools-deck-state";
  const SLOT_COUNT = 6;

  // ── Constants ────────────────────────────────────────────
  const CARD_TYPE_STATS = {
    speed:   { speed: 8, power: 4 },
    stamina: { stamina: 8, guts: 4 },
    power:   { power: 8, stamina: 4 },
    guts:    { guts: 8, speed: 4, power: 2 },
    wisdom:  { wisdom: 8, speed: 2 },
    friend:  { speed: 2, stamina: 2, power: 2, guts: 2, wisdom: 2 },
    group:   { speed: 2, stamina: 2, power: 2, guts: 2, wisdom: 2 },
  };

  const LB_MULTIPLIERS = { 0: 1.0, 1: 1.15, 2: 1.30, 3: 1.45, 4: 1.60 };
  const RARITY_MULTIPLIERS = { SSR: 1.0, SR: 0.75, R: 0.50 };
  const LB_LABELS = ["LB0", "LB1", "LB2", "LB3", "MLB"];
  const TYPE_LABELS = ["speed", "stamina", "power", "guts", "wisdom", "friend", "group"];
  const STAT_KEYS = ["speed", "stamina", "power", "guts", "wisdom"];
  const STAT_COLORS = {
    speed: "#3b82f6",
    stamina: "#f59e0b",
    power: "#ef4444",
    guts: "#eab308",
    wisdom: "#22c55e",
  };
  const STAT_PILL_CLASS = {
    speed: "spd", stamina: "sta", power: "pow", guts: "gut", wisdom: "wis",
  };

  // ── State ────────────────────────────────────────────────
  // slots[i] = { card: <card obj or null>, lb: 0-4, type: "speed", hintsOpen: false }
  const slots = Array.from({ length: SLOT_COUNT }, () => ({
    card: null, lb: 0, type: "speed", hintsOpen: false,
  }));

  let allCards = [];

  // ── Load data ─────────────────────────────────────────────
  try {
    const res = await fetch(DATA_URL, { cache: "force-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    allCards = (raw ?? []).map(parseCard);
  } catch (err) {
    console.error("Failed to load support hints", err);
    document.getElementById("deck-grid").innerHTML =
      `<div class="inline-note">Failed to load card data. Please refresh.</div>`;
    return;
  }

  // Fill datalist
  const dl = document.getElementById("cardList");
  dl.innerHTML = allCards
    .map((c) => `<option value="${escHtml(c.rawName)}"></option>`)
    .join("");

  // ── Parse card ─────────────────────────────────────────────
  function parseCard(c) {
    const rawName = c?.SupportName ?? "";
    const name = cleanName(rawName);
    const rarity = (
      c?.SupportRarity ||
      (/\((SSR|SR|R)\)/i.exec(rawName)?.[1]) ||
      "UNKNOWN"
    ).toUpperCase();
    const hints = Array.isArray(c?.SupportHints)
      ? c.SupportHints.map((h) => (typeof h === "string" ? h : h?.Name || "")).filter(Boolean)
      : [];
    const img = c?.SupportImage || c?.Image || c?.Thumb || null;
    const id = c?.SupportId ?? null;
    const slug = c?.SupportSlug || null;
    return { name, rawName, rarity, hints, img, id, slug };
  }

  function cleanName(full) {
    return String(full || "")
      .replace(/\s*\((?:SSR|SR|R)\)\s*/i, " ")
      .replace(/Support\s*Card/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function initialsOf(name) {
    const parts = String(name || "").trim().split(/\s+/);
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
  }

  function escHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Stat calculation ────────────────────────────────────────
  function calcStats(slot) {
    if (!slot.card) return {};
    const base = CARD_TYPE_STATS[slot.type] || {};
    const lbMul = LB_MULTIPLIERS[slot.lb] ?? 1.0;
    const rarMul = RARITY_MULTIPLIERS[slot.card.rarity] ?? 1.0;
    const out = {};
    for (const [stat, val] of Object.entries(base)) {
      out[stat] = Math.round(val * lbMul * rarMul);
    }
    return out;
  }

  function totalStats() {
    const totals = { speed: 0, stamina: 0, power: 0, guts: 0, wisdom: 0 };
    for (const slot of slots) {
      const s = calcStats(slot);
      for (const k of STAT_KEYS) totals[k] += (s[k] || 0);
    }
    return totals;
  }

  // ── Render helpers ──────────────────────────────────────────
  function renderBadge(rarity) {
    return `<span class="badge badge-${rarity}">${rarity}</span>`;
  }

  function renderStatPills(stats) {
    return STAT_KEYS
      .filter((k) => stats[k])
      .map((k) => `<span class="stat-pill ${STAT_PILL_CLASS[k]}">${k.slice(0,3).toUpperCase()} +${stats[k]}</span>`)
      .join("");
  }

  function hasDuplicate(idx) {
    const id = slots[idx].card?.id;
    if (!id) return false;
    return slots.some((s, i) => i !== idx && s.card?.id === id);
  }

  // ── Render a single slot ────────────────────────────────────
  function renderSlot(idx) {
    const slot = slots[idx];
    const el = document.getElementById(`slot-${idx}`);
    if (!el) return;

    const hasCd = !!slot.card;
    el.className = "slot-card" + (hasCd ? " has-card" : "") + (hasCd && hasDuplicate(idx) ? " duplicate-warn" : "");

    // LB buttons
    el.querySelectorAll(".lb-btn").forEach((b, i) => {
      b.classList.toggle("active", i === slot.lb);
    });

    // Type buttons
    el.querySelectorAll(".type-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.type === slot.type);
    });

    // Preview
    const preview = el.querySelector(".slot-preview");
    if (hasCd) {
      const thumb = slot.card.img
        ? `<img src="${escHtml(slot.card.img)}" alt="${escHtml(slot.card.name)}" loading="lazy" decoding="async">`
        : `<span class="slot-thumb-initials">${initialsOf(slot.card.name)}</span>`;
      el.querySelector(".slot-thumb").innerHTML = thumb;
      el.querySelector(".slot-name").textContent = slot.card.name;
      el.querySelector(".slot-rarity-row").innerHTML = renderBadge(slot.card.rarity) +
        (hasDuplicate(idx) ? `<span class="dup-warning">⚠ Duplicate</span>` : "");
    }

    // Per-card stats
    const stats = calcStats(slot);
    el.querySelector(".slot-stats").innerHTML = renderStatPills(stats);

    // Hint skills
    const hintsToggle = el.querySelector(".slot-hints-toggle");
    const hintsList = el.querySelector(".slot-hints-list");
    if (hasCd && slot.card.hints.length) {
      hintsToggle.style.display = "flex";
      hintsToggle.classList.toggle("open", slot.hintsOpen);
      hintsList.classList.toggle("open", slot.hintsOpen);
      if (slot.hintsOpen) {
        hintsList.innerHTML = slot.card.hints
          .map((h) => `<span class="pill">${escHtml(h)}</span>`)
          .join("");
      }
    } else {
      hintsToggle.style.display = "none";
      hintsList.classList.remove("open");
    }

    // Search input value
    const input = el.querySelector(".slot-input");
    if (!hasCd && input) input.value = "";
  }

  // ── Build DOM for all slots ─────────────────────────────────
  function buildSlots() {
    const grid = document.getElementById("deck-grid");
    grid.innerHTML = "";
    for (let i = 0; i < SLOT_COUNT; i++) {
      const div = document.createElement("div");
      div.className = "slot-card";
      div.id = `slot-${i}`;
      div.innerHTML = `
        <div class="slot-number">Slot ${i + 1}</div>
        <div class="slot-search-row">
          <input class="slot-input" list="cardList" type="text"
            placeholder="Search card…" autocomplete="off" aria-label="Search card for slot ${i + 1}">
          <button class="slot-remove btn" title="Remove card" aria-label="Remove card from slot ${i + 1}">×</button>
        </div>
        <div class="slot-preview">
          <div class="slot-thumb"></div>
          <div class="slot-meta">
            <div class="slot-name"></div>
            <div class="slot-rarity-row"></div>
          </div>
        </div>
        <div class="slot-type-row">
          ${TYPE_LABELS.map((t) => `<button class="type-btn${t === "speed" ? " active" : ""}" data-type="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</button>`).join("")}
        </div>
        <div class="slot-lb-row">
          ${LB_LABELS.map((l, li) => `<button class="lb-btn${li === 0 ? " active" : ""}" data-lb="${li}">${l}</button>`).join("")}
        </div>
        <div class="slot-stats"></div>
        <div class="slot-hints-toggle" style="display:none"><span class="arrow">▶</span> Hint Skills</div>
        <div class="slot-hints-list"></div>
        <div class="slot-empty-hint">${!slots[i].card ? "No card selected" : ""}</div>
      `;

      // Events
      const input = div.querySelector(".slot-input");
      input.addEventListener("change", () => onSlotInput(i, input.value));
      input.addEventListener("blur", () => onSlotInput(i, input.value));

      div.querySelector(".slot-remove").addEventListener("click", () => {
        slots[i].card = null;
        renderSlot(i);
        updateSummary();
        saveState();
      });

      div.querySelectorAll(".lb-btn").forEach((b) => {
        b.addEventListener("click", () => {
          slots[i].lb = Number(b.dataset.lb);
          renderSlot(i);
          updateSummary();
          saveState();
        });
      });

      div.querySelectorAll(".type-btn").forEach((b) => {
        b.addEventListener("click", () => {
          slots[i].type = b.dataset.type;
          renderSlot(i);
          updateSummary();
          saveState();
        });
      });

      div.querySelector(".slot-hints-toggle").addEventListener("click", () => {
        slots[i].hintsOpen = !slots[i].hintsOpen;
        renderSlot(i);
      });

      grid.appendChild(div);
    }
  }

  function onSlotInput(idx, val) {
    const trimmed = val.trim();
    if (!trimmed) return;
    const found = allCards.find(
      (c) => c.rawName.toLowerCase() === trimmed.toLowerCase() ||
             c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (found) {
      slots[idx].card = found;
      renderSlot(idx);
      updateSummary();
      saveState();
    }
  }

  // ── Summary panel ───────────────────────────────────────────
  function updateSummary() {
    const totals = totalStats();
    const maxVal = Math.max(...Object.values(totals), 1);
    const filled = slots.filter((s) => s.card).length;
    const avgLb = filled
      ? (slots.filter((s) => s.card).reduce((a, s) => a + s.lb, 0) / filled).toFixed(1)
      : "—";

    // Stat bars
    const barsEl = document.getElementById("stat-bars");
    barsEl.innerHTML = STAT_KEYS.map((k) => {
      const pct = Math.round((totals[k] / maxVal) * 100);
      return `
        <div class="stat-bar-row">
          <span class="stat-bar-label">${k.charAt(0).toUpperCase() + k.slice(1)}</span>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" style="width:${pct}%; background:${STAT_COLORS[k]}"></div>
          </div>
          <span class="stat-bar-value">${totals[k]}</span>
        </div>`;
    }).join("");

    // Meta
    document.getElementById("deck-meta").innerHTML = `
      <span>Cards: <strong>${filled}/6</strong></span>
      <span>Avg LB: <strong>${avgLb}</strong></span>
      <span>Composition: <strong>${deckComposition()}</strong></span>
    `;

    // Combined hints
    updateCombinedHints(filled);

    // LB compare
    updateLbCompare();
  }

  function deckComposition() {
    const counts = {};
    for (const slot of slots) {
      if (slot.card) counts[slot.type] = (counts[slot.type] || 0) + 1;
    }
    if (!Object.keys(counts).length) return "—";
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([t, n]) => `${n}× ${t.charAt(0).toUpperCase() + t.slice(1)}`)
      .join(", ");
  }

  function updateCombinedHints(filled) {
    const sec = document.getElementById("combined-hints-section");
    if (filled < 6) { sec.style.display = "none"; return; }
    sec.style.display = "";
    const allH = {};
    for (const slot of slots) {
      if (!slot.card) continue;
      for (const h of slot.card.hints) {
        allH[h] = (allH[h] || 0) + 1;
      }
    }
    const sortedH = Object.entries(allH).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    document.getElementById("combined-hints-list").innerHTML = sortedH
      .map(([h, cnt]) => `<span class="pill">${escHtml(h)}${cnt > 1 ? ` ×${cnt}` : ""}</span>`)
      .join("");
  }

  function updateLbCompare() {
    const sec = document.getElementById("lb-compare-section");
    const filled = slots.filter((s) => s.card);
    if (!filled.length) { sec.style.display = "none"; return; }
    sec.style.display = "";

    const rows = filled.map((slot) => {
      const lb0Stats = calcStatsAt(slot, 0);
      const curStats = calcStats(slot);
      const mlbStats = calcStatsAt(slot, 4);
      const fmt = (s) => STAT_KEYS.filter((k) => s[k]).map((k) => `${k.slice(0,3).toUpperCase()}+${s[k]}`).join(", ");
      return `<tr>
        <td class="card-name" title="${escHtml(slot.card.name)}">${escHtml(slot.card.name)}</td>
        <td>${fmt(lb0Stats)}</td>
        <td><strong>${fmt(curStats)}</strong></td>
        <td>${fmt(mlbStats)}</td>
      </tr>`;
    }).join("");

    document.getElementById("lb-compare-body").innerHTML = rows;
  }

  function calcStatsAt(slot, lb) {
    const base = CARD_TYPE_STATS[slot.type] || {};
    const lbMul = LB_MULTIPLIERS[lb] ?? 1.0;
    const rarMul = RARITY_MULTIPLIERS[slot.card?.rarity] ?? 1.0;
    const out = {};
    for (const [stat, val] of Object.entries(base)) {
      out[stat] = Math.round(val * lbMul * rarMul);
    }
    return out;
  }

  // ── Save / Load ─────────────────────────────────────────────
  function saveState() {
    const state = slots.map((s) => ({
      id: s.card?.id ?? null,
      lb: s.lb,
      type: s.type,
    }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const state = JSON.parse(raw);
      if (!Array.isArray(state)) return false;
      let loaded = false;
      state.forEach((entry, i) => {
        if (i >= SLOT_COUNT) return;
        slots[i].lb = Number(entry.lb) || 0;
        slots[i].type = TYPE_LABELS.includes(entry.type) ? entry.type : "speed";
        if (entry.id != null) {
          const found = allCards.find((c) => String(c.id) === String(entry.id));
          if (found) { slots[i].card = found; loaded = true; }
        }
      });
      return loaded;
    } catch (_) {
      return false;
    }
  }

  // ── Share via hash ──────────────────────────────────────────
  function encodeHash() {
    const state = slots.map((s) => [s.card?.id ?? "", s.lb, s.type].join(":")).join("|");
    return "#deck=" + encodeURIComponent(state);
  }

  function decodeHash() {
    const hash = location.hash;
    const m = hash.match(/[#&]deck=([^&]*)/);
    if (!m) return false;
    try {
      const parts = decodeURIComponent(m[1]).split("|");
      let loaded = false;
      parts.forEach((part, i) => {
        if (i >= SLOT_COUNT) return;
        const [id, lb, type] = part.split(":");
        slots[i].lb = Number(lb) || 0;
        slots[i].type = TYPE_LABELS.includes(type) ? type : "speed";
        if (id) {
          const found = allCards.find((c) => String(c.id) === id);
          if (found) { slots[i].card = found; loaded = true; }
        }
      });
      return loaded;
    } catch (_) {
      return false;
    }
  }

  // ── Action buttons ──────────────────────────────────────────
  document.getElementById("btn-share").addEventListener("click", async () => {
    const url = location.origin + location.pathname + encodeHash();
    try {
      await navigator.clipboard.writeText(url);
      const btn = document.getElementById("btn-share");
      const orig = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = orig), 1400);
    } catch (_) {
      prompt("Copy this link:", location.origin + location.pathname + encodeHash());
    }
  });

  document.getElementById("btn-clear").addEventListener("click", () => {
    for (let i = 0; i < SLOT_COUNT; i++) {
      slots[i].card = null;
      slots[i].lb = 0;
      slots[i].type = "speed";
      slots[i].hintsOpen = false;
    }
    buildSlots();
    updateSummary();
    saveState();
  });

  document.getElementById("btn-export").addEventListener("click", () => {
    const totals = totalStats();
    const lines = ["=== UmaTools Deck Builder Export ===", ""];
    slots.forEach((s, i) => {
      const label = `Slot ${i + 1}: `;
      if (!s.card) { lines.push(label + "(empty)"); return; }
      const stats = calcStats(s);
      const statStr = STAT_KEYS.filter((k) => stats[k]).map((k) => `${k.toUpperCase()}+${stats[k]}`).join(" ");
      lines.push(`${label}${s.card.name} [${s.card.rarity}] | ${s.type.toUpperCase()} | ${LB_LABELS[s.lb]} | ${statStr}`);
    });
    lines.push("");
    lines.push("Totals: " + STAT_KEYS.map((k) => `${k.toUpperCase()}+${totals[k]}`).join(" | "));
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "umatools-deck.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // ── Init ─────────────────────────────────────────────────────
  const fromHash = decodeHash();
  if (!fromHash) loadState();
  buildSlots();
  for (let i = 0; i < SLOT_COUNT; i++) renderSlot(i);
  updateSummary();
})();
