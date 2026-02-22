(function () {
  "use strict";

  const RACE_PRESETS = {
    sprinter: {
      label: "Sprinter (1000–1400m)",
      recommendedStats: { speed: 1200, stamina: 400, power: 900, guts: 600, wisdom: 800 },
      races: [
        { turn: 8,  name: "Debut Race",          distance: 1200, surface: "Turf", grade: "Debut", placement: "Top 5",  phase: "Junior"  },
        { turn: 14, name: "Newcomers Stakes",     distance: 1200, surface: "Turf", grade: "G3",   placement: "Top 3",  phase: "Junior"  },
        { turn: 22, name: "Junior Championship",  distance: 1400, surface: "Turf", grade: "G3",   placement: "Top 3",  phase: "Junior"  },
        { turn: 30, name: "Classic Trial",        distance: 1200, surface: "Turf", grade: "G3",   placement: "Top 3",  phase: "Classic" },
        { turn: 38, name: "Sprint Cup Trial",     distance: 1200, surface: "Turf", grade: "G2",   placement: "Top 3",  phase: "Classic" },
        { turn: 46, name: "High Sprint Cup",      distance: 1200, surface: "Turf", grade: "G1",   placement: "1st",    phase: "Classic" },
        { turn: 54, name: "Senior Sprint Trial",  distance: 1400, surface: "Turf", grade: "G2",   placement: "Top 3",  phase: "Senior"  },
        { turn: 62, name: "Champions Sprint",     distance: 1200, surface: "Turf", grade: "G1",   placement: "1st",    phase: "Senior"  },
        { turn: 70, name: "URA Finals",           distance: 1200, surface: "Turf", grade: "URA",  placement: "1st",    phase: "Senior"  },
      ],
    },
    miler: {
      label: "Miler (1400–1800m)",
      recommendedStats: { speed: 1200, stamina: 600, power: 900, guts: 600, wisdom: 800 },
      races: [
        { turn: 8,  name: "Debut Race",          distance: 1600, surface: "Turf", grade: "Debut", placement: "Top 5",  phase: "Junior"  },
        { turn: 14, name: "Fillies Mile",         distance: 1600, surface: "Turf", grade: "G3",   placement: "Top 3",  phase: "Junior"  },
        { turn: 22, name: "Junior Mile Cup",      distance: 1600, surface: "Turf", grade: "G3",   placement: "Top 3",  phase: "Junior"  },
        { turn: 30, name: "Classic Mile Trial",   distance: 1600, surface: "Turf", grade: "G3",   placement: "Top 3",  phase: "Classic" },
        { turn: 38, name: "Mile Championship",    distance: 1600, surface: "Turf", grade: "G2",   placement: "Top 3",  phase: "Classic" },
        { turn: 46, name: "Grand Mile Cup",       distance: 1800, surface: "Turf", grade: "G1",   placement: "1st",    phase: "Classic" },
        { turn: 54, name: "Senior Mile Trial",    distance: 1600, surface: "Turf", grade: "G2",   placement: "Top 3",  phase: "Senior"  },
        { turn: 62, name: "Elite Mile Cup",       distance: 1600, surface: "Turf", grade: "G1",   placement: "1st",    phase: "Senior"  },
        { turn: 70, name: "URA Finals",           distance: 1600, surface: "Turf", grade: "URA",  placement: "1st",    phase: "Senior"  },
      ],
    },
    medium: {
      label: "Medium (1800–2400m)",
      recommendedStats: { speed: 1100, stamina: 800, power: 900, guts: 600, wisdom: 800 },
      races: [
        { turn: 8,  name: "Debut Race",          distance: 2000, surface: "Turf", grade: "Debut", placement: "Top 5",  phase: "Junior"  },
        { turn: 14, name: "Classic Trial",        distance: 2000, surface: "Turf", grade: "G3",   placement: "Top 3",  phase: "Junior"  },
        { turn: 22, name: "Junior Cup",           distance: 2000, surface: "Turf", grade: "G3",   placement: "Top 3",  phase: "Junior"  },
        { turn: 30, name: "Classic Turf Stakes",  distance: 2000, surface: "Turf", grade: "G3",   placement: "Top 3",  phase: "Classic" },
        { turn: 38, name: "Derby Trial",          distance: 2400, surface: "Turf", grade: "G2",   placement: "Top 3",  phase: "Classic" },
        { turn: 46, name: "Classic Derby",        distance: 2400, surface: "Turf", grade: "G1",   placement: "1st",    phase: "Classic" },
        { turn: 54, name: "Autumn Classic",       distance: 2200, surface: "Turf", grade: "G2",   placement: "Top 3",  phase: "Senior"  },
        { turn: 62, name: "Senior Championship",  distance: 2400, surface: "Turf", grade: "G1",   placement: "1st",    phase: "Senior"  },
        { turn: 70, name: "URA Finals",           distance: 2400, surface: "Turf", grade: "URA",  placement: "1st",    phase: "Senior"  },
      ],
    },
    long: {
      label: "Long (2400m+)",
      recommendedStats: { speed: 1000, stamina: 1000, power: 800, guts: 700, wisdom: 700 },
      races: [
        { turn: 8,  name: "Debut Race",          distance: 2400, surface: "Turf", grade: "Debut", placement: "Top 5",  phase: "Junior"  },
        { turn: 14, name: "Long Trial",           distance: 2400, surface: "Turf", grade: "G3",   placement: "Top 3",  phase: "Junior"  },
        { turn: 22, name: "Junior Long Cup",      distance: 2400, surface: "Turf", grade: "G3",   placement: "Top 3",  phase: "Junior"  },
        { turn: 30, name: "Classic Stakes",       distance: 3000, surface: "Turf", grade: "G3",   placement: "Top 3",  phase: "Classic" },
        { turn: 38, name: "Long Distance Cup",    distance: 3200, surface: "Turf", grade: "G2",   placement: "Top 3",  phase: "Classic" },
        { turn: 46, name: "Grand Steeplechase",   distance: 3200, surface: "Turf", grade: "G1",   placement: "1st",    phase: "Classic" },
        { turn: 54, name: "Senior Long Trial",    distance: 3000, surface: "Turf", grade: "G2",   placement: "Top 3",  phase: "Senior"  },
        { turn: 62, name: "Elite Long Cup",       distance: 3200, surface: "Turf", grade: "G1",   placement: "1st",    phase: "Senior"  },
        { turn: 70, name: "URA Finals",           distance: 3200, surface: "Turf", grade: "URA",  placement: "1st",    phase: "Senior"  },
      ],
    },
  };

  const FAN_MILESTONES = [
    { fans: 3000,  label: "3,000" },
    { fans: 6000,  label: "6,000" },
    { fans: 12000, label: "12,000" },
    { fans: 20000, label: "20,000" },
    { fans: 60000, label: "60,000 (URA Finals)" },
  ];

  const STAT_NAMES = ["speed", "stamina", "power", "guts", "wisdom"];
  const STAT_LABELS = { speed: "Speed", stamina: "Stamina", power: "Power", guts: "Guts", wisdom: "Wisdom" };

  let currentPreset = "sprinter";
  let currentStats = { speed: 0, stamina: 0, power: 0, guts: 0, wisdom: 0 };

  function renderTable(presetKey) {
    const preset = RACE_PRESETS[presetKey];
    const tbody = document.getElementById("racesBody");
    if (!tbody || !preset) return;
    tbody.innerHTML = preset.races.map((r) => `
      <tr>
        <td>${r.turn}</td>
        <td>${r.name}</td>
        <td>${r.distance}m</td>
        <td>${r.surface}</td>
        <td><span class="races-grade races-grade-${r.grade.toLowerCase().replace(/\s/g,'-')}">${r.grade}</span></td>
        <td>${r.placement}</td>
        <td>${r.phase}</td>
      </tr>
    `).join("");
  }

  function renderFanMilestones() {
    const fans = parseInt(document.getElementById("fanCount")?.value || "0", 10) || 0;
    const container = document.getElementById("fanMilestones");
    if (!container) return;
    container.innerHTML = FAN_MILESTONES.map((m) => {
      const pct = Math.min(100, Math.round((fans / m.fans) * 100));
      const done = fans >= m.fans;
      return `<div class="races-milestone ${done ? "done" : ""}">
        <span class="races-milestone-label">${m.label}</span>
        <div class="races-milestone-bar"><div class="races-milestone-fill" style="width:${pct}%"></div></div>
        <span class="races-milestone-pct">${pct}%</span>
      </div>`;
    }).join("");
  }

  function renderStatInputs(presetKey) {
    const preset = RACE_PRESETS[presetKey];
    const container = document.getElementById("statInputs");
    const label = document.getElementById("statsPresetLabel");
    if (!container || !preset) return;
    if (label) label.textContent = `Showing recommendations for ${preset.label}.`;
    container.innerHTML = STAT_NAMES.map((stat) => {
      const rec = preset.recommendedStats[stat];
      const cur = currentStats[stat] || 0;
      const ok = cur >= rec;
      return `<div class="races-stat-item ${ok ? "ok" : "low"}">
        <label>${STAT_LABELS[stat]}
          <input type="number" min="0" max="2000" value="${cur}" data-stat="${stat}" />
        </label>
        <div class="races-stat-rec">Rec: ${rec}</div>
        <div class="races-stat-status">${ok ? "✓" : "✗"}</div>
      </div>`;
    }).join("");
    container.querySelectorAll("input[data-stat]").forEach((inp) => {
      inp.addEventListener("input", () => {
        currentStats[inp.dataset.stat] = parseInt(inp.value, 10) || 0;
        renderStatInputs(currentPreset);
      });
    });
  }

  function init() {
    renderTable(currentPreset);
    renderFanMilestones();
    renderStatInputs(currentPreset);

    document.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentPreset = btn.dataset.preset;
        document.querySelectorAll("[data-preset]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderTable(currentPreset);
        renderStatInputs(currentPreset);
      });
    });

    document.getElementById("fanCount")?.addEventListener("input", renderFanMilestones);

    document.getElementById("notesToggle")?.addEventListener("click", function () {
      const expanded = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", String(!expanded));
      this.textContent = (expanded ? "▶" : "▼") + " Scenario Notes (URA Finals vs Aoharu Cup)";
      const content = document.getElementById("notesContent");
      if (content) content.style.display = expanded ? "none" : "";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
