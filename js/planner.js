(function () {
  "use strict";

  const TOTAL_TURNS = 78;
  const PHASES = [
    { name: "Junior Year", start: 1, end: 24 },
    { name: "Classic Year", start: 25, end: 48 },
    { name: "Senior Year", start: 49, end: TOTAL_TURNS },
  ];

  const ACTIVITIES = {
    speed:   { label: "Speed",   color: "#3b82f6" },
    stamina: { label: "Stamina", color: "#f97316" },
    power:   { label: "Power",   color: "#ef4444" },
    guts:    { label: "Guts",    color: "#eab308" },
    wisdom:  { label: "Wisdom",  color: "#22c55e" },
    race:    { label: "Race",    color: "#a855f7" },
    rest:    { label: "Rest",    color: "#6b7280" },
    outing:  { label: "Outing",  color: "#ec4899" },
    empty:   { label: "",        color: "" },
  };

  const STORAGE_KEY = "umatools-planner-state";

  let state = {
    scenario: "ura",
    turns: Array(TOTAL_TURNS + 1).fill(null).map(() => ({ activity: "empty", raceNote: "" })),
    aoharu: { team: "blue", explosions: 0, burst: false },
  };

  let selectedActivity = "speed";

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.turns) {
          state = parsed;
          if (!state.aoharu) state.aoharu = { team: "blue", explosions: 0, burst: false };
        }
      }
    } catch (e) {}
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function buildPhases() {
    const container = document.getElementById("planner-phases");
    if (!container) return;
    container.innerHTML = "";
    PHASES.forEach((phase) => {
      const section = document.createElement("section");
      section.className = "card card-elevated planner-phase";
      section.dataset.phase = phase.name;

      const header = document.createElement("div");
      header.className = "planner-phase-header";
      header.innerHTML = `<h2>${phase.name}</h2><button class="btn btn-secondary planner-collapse-btn" aria-expanded="true">▲</button>`;
      section.appendChild(header);

      const grid = document.createElement("div");
      grid.className = "planner-turn-grid";
      grid.id = `phase-grid-${phase.name.replace(/\s/g, "-")}`;

      for (let t = phase.start; t <= phase.end; t++) {
        const cell = buildTurnCell(t);
        grid.appendChild(cell);
      }

      section.appendChild(grid);

      header.querySelector(".planner-collapse-btn").addEventListener("click", function () {
        const expanded = this.getAttribute("aria-expanded") === "true";
        this.setAttribute("aria-expanded", String(!expanded));
        this.textContent = expanded ? "▼" : "▲";
        grid.style.display = expanded ? "none" : "";
      });

      container.appendChild(section);
    });
  }

  function buildTurnCell(t) {
    const turn = state.turns[t] || { activity: "empty", raceNote: "" };
    const act = ACTIVITIES[turn.activity] || ACTIVITIES.empty;

    const cell = document.createElement("div");
    cell.className = "turn-cell";
    cell.dataset.turn = t;
    if (turn.activity !== "empty") {
      cell.style.background = act.color + "33";
      cell.style.borderColor = act.color;
      cell.style.color = act.color;
    }

    const label = document.createElement("div");
    label.className = "turn-cell-label";
    label.textContent = t;

    const actLabel = document.createElement("div");
    actLabel.className = "turn-cell-act";
    actLabel.textContent = act.label;

    cell.appendChild(label);
    cell.appendChild(actLabel);

    if (turn.activity === "race" && turn.raceNote) {
      const note = document.createElement("div");
      note.className = "turn-cell-note";
      note.textContent = turn.raceNote;
      cell.appendChild(note);
    }

    cell.addEventListener("click", () => onTurnClick(t, cell));
    return cell;
  }

  function onTurnClick(t, cell) {
    if (selectedActivity === "race") {
      const note = prompt("Race name (optional):", state.turns[t].raceNote || "");
      if (note === null) return;
      state.turns[t] = { activity: "race", raceNote: note };
    } else {
      state.turns[t] = { activity: selectedActivity, raceNote: "" };
    }
    saveState();
    refreshCell(t);
    updateSummary();
  }

  function refreshCell(t) {
    const existing = document.querySelector(`.turn-cell[data-turn="${t}"]`);
    if (!existing) return;
    const fresh = buildTurnCell(t);
    existing.replaceWith(fresh);
  }

  function updateSummary() {
    const counts = {};
    Object.keys(ACTIVITIES).forEach((k) => { if (k !== "empty") counts[k] = 0; });
    let planned = 0;
    for (let t = 1; t <= TOTAL_TURNS; t++) {
      const a = (state.turns[t] || {}).activity;
      if (a && a !== "empty") {
        counts[a] = (counts[a] || 0) + 1;
        planned++;
      }
    }
    const stats = document.getElementById("planner-stats");
    if (!stats) return;
    stats.innerHTML = Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => {
        const act = ACTIVITIES[k];
        return `<span class="planner-stat-pill" style="background:${act.color}22;border-color:${act.color};color:${act.color}">${act.label}: ${v}</span>`;
      })
      .join("") + `<span class="planner-stat-pill muted">Planned: ${planned}/${TOTAL_TURNS}</span>`;
  }

  function exportPlan() {
    const lines = [`Training Plan (${state.scenario === "ura" ? "URA Finals" : "Aoharu Cup"})`];
    PHASES.forEach((phase) => {
      lines.push(`\n== ${phase.name} ==`);
      for (let t = phase.start; t <= phase.end; t++) {
        const turn = state.turns[t] || {};
        const act = ACTIVITIES[turn.activity] || ACTIVITIES.empty;
        const note = turn.raceNote ? ` (${turn.raceNote})` : "";
        lines.push(`Turn ${String(t).padStart(2, "0")}: ${act.label || "—"}${note}`);
      }
    });
    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "training-plan.txt";
    a.click();
  }

  function init() {
    loadState();
    buildPhases();
    updateSummary();

    // Scenario toggle
    document.querySelectorAll("[data-scenario]").forEach((btn) => {
      if (btn.dataset.scenario === state.scenario) btn.classList.add("active");
      else btn.classList.remove("active");
      btn.addEventListener("click", () => {
        state.scenario = btn.dataset.scenario;
        document.querySelectorAll("[data-scenario]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const panel = document.getElementById("aoharu-panel");
        if (panel) panel.style.display = state.scenario === "aoharu" ? "" : "none";
        saveState();
      });
    });
    const panel = document.getElementById("aoharu-panel");
    if (panel) panel.style.display = state.scenario === "aoharu" ? "" : "none";

    // Palette
    document.querySelectorAll(".palette-btn").forEach((btn) => {
      if (btn.dataset.activity === selectedActivity) btn.classList.add("active");
      btn.addEventListener("click", () => {
        selectedActivity = btn.dataset.activity;
        document.querySelectorAll(".palette-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    // Save/Load/Clear/Export
    document.getElementById("plannerSave")?.addEventListener("click", () => {
      saveState();
      alert("Plan saved!");
    });
    document.getElementById("plannerLoad")?.addEventListener("click", () => {
      loadState();
      buildPhases();
      updateSummary();
      alert("Plan loaded!");
    });
    document.getElementById("plannerClear")?.addEventListener("click", () => {
      if (!confirm("Clear all turns?")) return;
      state.turns = Array(TOTAL_TURNS + 1).fill(null).map(() => ({ activity: "empty", raceNote: "" }));
      saveState();
      buildPhases();
      updateSummary();
    });
    document.getElementById("plannerExport")?.addEventListener("click", exportPlan);

    // Aoharu controls
    document.getElementById("aoharuTeam")?.addEventListener("change", function () {
      state.aoharu.team = this.value;
      saveState();
    });
    document.getElementById("aoharuExpUp")?.addEventListener("click", () => {
      state.aoharu.explosions = Math.min(99, state.aoharu.explosions + 1);
      const el = document.getElementById("aoharuExpCount");
      if (el) el.textContent = state.aoharu.explosions;
      saveState();
    });
    document.getElementById("aoharuExpDown")?.addEventListener("click", () => {
      state.aoharu.explosions = Math.max(0, state.aoharu.explosions - 1);
      const el = document.getElementById("aoharuExpCount");
      if (el) el.textContent = state.aoharu.explosions;
      saveState();
    });
    document.getElementById("aoharuBurst")?.addEventListener("change", function () {
      state.aoharu.burst = this.checked;
      saveState();
    });

    // Restore aoharu UI
    const teamSel = document.getElementById("aoharuTeam");
    if (teamSel) teamSel.value = state.aoharu.team;
    const expCount = document.getElementById("aoharuExpCount");
    if (expCount) expCount.textContent = state.aoharu.explosions;
    const burst = document.getElementById("aoharuBurst");
    if (burst) burst.checked = state.aoharu.burst;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
