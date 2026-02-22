(function () {
  "use strict";

  const BASE_GAINS = {
    speed:   { speed: 10, power: 3, skillPt: 2 },
    stamina: { stamina: 9, guts: 3, skillPt: 2 },
    power:   { power: 9, stamina: 3, skillPt: 2 },
    guts:    { guts: 9, speed: 3, power: 3, skillPt: 2 },
    wisdom:  { wisdom: 9, speed: 2, skillPt: 6 },
  };

  const STAT_LABELS = { speed: "Speed", stamina: "Stamina", power: "Power", guts: "Guts", wisdom: "Wisdom", skillPt: "Skill Pts" };
  const TYPE_COLORS = { speed: "#3b82f6", stamina: "#f97316", power: "#ef4444", guts: "#eab308", wisdom: "#22c55e" };

  let selectedType = "speed";

  function getConditions() {
    return {
      motivation: parseFloat(document.getElementById("simMotivation")?.value || "1.0"),
      level: parseInt(document.getElementById("simLevel")?.value || "1", 10),
      supportCards: parseInt(document.getElementById("simSupportCards")?.value || "0", 10),
      energy: parseInt(document.getElementById("simEnergy")?.value || "80", 10),
      friendship: document.getElementById("simFriendship")?.checked || false,
      aoharu: document.getElementById("simAoharu")?.checked || false,
      explosion: document.getElementById("simExplosion")?.checked || false,
    };
  }

  function calcGains(type, cond) {
    const base = BASE_GAINS[type];
    if (!base) return null;
    const levelMult = 1 + (cond.level - 1) * 0.15;
    const motivMult = cond.motivation;
    const supportMult = 1 + cond.supportCards * 0.12;
    const friendMult = (cond.friendship && cond.supportCards > 0) ? 1.5 : 1.0;
    const aoharuMult = cond.aoharu ? 1.1 : 1.0;
    const explosionMult = cond.explosion ? 1.5 : 1.0;
    const totalMult = levelMult * motivMult * supportMult * friendMult * aoharuMult * explosionMult;
    const gains = {};
    Object.entries(base).forEach(([stat, val]) => {
      gains[stat] = Math.round(val * totalMult);
    });
    return { gains, breakdown: { levelMult, motivMult, supportMult, friendMult, aoharuMult, explosionMult, totalMult } };
  }

  function renderResult(type) {
    const cond = getConditions();
    const result = calcGains(type, cond);
    const container = document.getElementById("simResult");
    if (!container || !result) return;

    const { gains, breakdown } = result;
    const primaryStat = type === "guts" ? "guts" : type === "wisdom" ? "wisdom" : type;
    const primaryGain = gains[primaryStat] || gains[Object.keys(gains)[0]];

    container.innerHTML = `
      <div class="sim-total-gain" style="color:${TYPE_COLORS[type]}">
        +${primaryGain} <span>${STAT_LABELS[type] || type}</span>
      </div>
      <div class="sim-gains-list">
        ${Object.entries(gains).map(([s, v]) => `
          <div class="sim-gain-row">
            <span>${STAT_LABELS[s] || s}</span>
            <span class="sim-gain-val">+${v}</span>
          </div>
        `).join("")}
      </div>
      <div class="sim-breakdown">
        <div class="sim-bd-title muted">Multipliers</div>
        ${renderBreakdown(breakdown)}
      </div>
    `;

    renderFailureBar(cond.energy);
    renderCompare();
  }

  function renderBreakdown(bd) {
    const rows = [
      ["Level", `×${bd.levelMult.toFixed(2)}`],
      ["Motivation", `×${bd.motivMult.toFixed(2)}`],
      ["Support Cards", `×${bd.supportMult.toFixed(2)}`],
      ["Friendship", `×${bd.friendMult.toFixed(2)}`],
      ["Aoharu", `×${bd.aoharuMult.toFixed(2)}`],
      ["Explosion", `×${bd.explosionMult.toFixed(2)}`],
      ["Total", `×${bd.totalMult.toFixed(2)}`],
    ];
    return rows.map(([k, v]) => `<div class="sim-bd-row"><span>${k}</span><span class="sim-bd-val">${v}</span></div>`).join("");
  }

  function renderFailureBar(energy) {
    const failRate = Math.min(100, Math.max(0, Math.round((100 - energy) * 0.5)));
    const bar = document.getElementById("simFailureBar");
    const text = document.getElementById("simFailureText");
    if (!bar || !text) return;

    const color = failRate < 15 ? "#16a34a" : failRate < 30 ? "#eab308" : "#ef4444";
    bar.style.width = failRate + "%";
    bar.style.background = color;

    let msg = `Failure chance: ~${failRate}%`;
    if (failRate >= 30) msg += " — ⚠️ Consider resting!";
    else if (failRate >= 15) msg += " — Risky";
    else msg += " — Safe";
    text.textContent = msg;
    text.style.color = color;
  }

  function renderCompare() {
    const cond = getConditions();
    const grid = document.getElementById("simCompareGrid");
    if (!grid) return;
    grid.innerHTML = Object.keys(BASE_GAINS).map((type) => {
      const res = calcGains(type, cond);
      if (!res) return "";
      const primary = type === "guts" ? "guts" : type === "wisdom" ? "wisdom" : type;
      const val = res.gains[primary] || res.gains[Object.keys(res.gains)[0]];
      const color = TYPE_COLORS[type];
      return `<div class="sim-compare-card ${type === selectedType ? "active" : ""}" style="--t-color:${color}">
        <div class="sim-compare-type">${STAT_LABELS[type] || type}</div>
        <div class="sim-compare-val" style="color:${color}">+${val}</div>
        <div class="sim-compare-gains">
          ${Object.entries(res.gains).map(([s, v]) => `<span>${STAT_LABELS[s] || s}: +${v}</span>`).join("")}
        </div>
      </div>`;
    }).join("");
  }

  function init() {
    renderResult(selectedType);

    document.querySelectorAll(".sim-type-btn").forEach((btn) => {
      if (btn.dataset.type === selectedType) btn.classList.add("active");
      btn.addEventListener("click", () => {
        selectedType = btn.dataset.type;
        document.querySelectorAll(".sim-type-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderResult(selectedType);
      });
    });

    const inputs = ["simMotivation", "simLevel", "simSupportCards", "simEnergy"];
    inputs.forEach((id) => {
      document.getElementById(id)?.addEventListener("change", () => renderResult(selectedType));
      document.getElementById(id)?.addEventListener("input", () => renderResult(selectedType));
    });

    ["simFriendship", "simAoharu", "simExplosion"].forEach((id) => {
      document.getElementById(id)?.addEventListener("change", () => renderResult(selectedType));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
