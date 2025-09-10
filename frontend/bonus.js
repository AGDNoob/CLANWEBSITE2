// bonus.js – CWL Bonus Rechner

/* -------- Punkte-Konfiguration -------- */
function readPointsConfig() {
  return {
    sterne: { 0: 0, 1: 5, 2: 10, 3: 20 },      // Sterne → Punkte
    prozent: 0.1,                               // 1% = 0.1 Punkt
    thDiff: { up: 3, down: -2 }                 // RH-Diff → Punkte
  };
}

/* -------- Berechnung -------- */
function calculateBonusPoints(attacks, points) {
  const results = {};

  attacks.forEach(a => {
    if (!a.spieler) return;
    if (!results[a.spieler]) results[a.spieler] = 0;

    // Sterne
    results[a.spieler] += points.sterne[a.sterne] ?? 0;

    // Zerstörungs-Prozent
    results[a.spieler] += (a.prozent ?? 0) * points.prozent;

    // RH-Differenz
    const diff = (a.gegnerRH ?? 0) - (a.eigenesRH ?? 0);
    if (diff > 0) results[a.spieler] += diff * (points.thDiff.up ?? 0);
    if (diff < 0) results[a.spieler] += diff * (points.thDiff.down ?? 0);
  });

  return Object.entries(results)
    .map(([spieler, punkte]) => ({ spieler, punkte: Math.round(punkte) }))
    .sort((a, b) => b.punkte - a.punkte);
}

/* -------- Ergebnisse anzeigen -------- */
function renderBonusResults(result) {
  const tbody = document.getElementById("bonus-results-table-body");
  const chartCtx = document.getElementById("bonus-chart");

  if (!tbody || !chartCtx) return;
  tbody.innerHTML = "";

  result.forEach((r, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${r.spieler}</td>
        <td>${r.punkte}</td>
      </tr>`;
  });

  // Chart
  const labels = result.map(r => r.spieler);
  const data = result.map(r => r.punkte);

  if (window.bonusChartInstance) window.bonusChartInstance.destroy();
  window.bonusChartInstance = new Chart(chartCtx.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Bonuspunkte",
        data,
        backgroundColor: "rgba(10,132,255,0.6)",
        borderColor: "rgba(10,132,255,1)",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { 
        x: { ticks: { color: "#f5f5f7" }}, 
        y: { ticks: { color: "#f5f5f7" }} 
      },
      plugins: { legend: { labels: { color: "#f5f5f7" } } }
    }
  });

  // Ergebnisse-View sichtbar machen
  document.getElementById("cwl-bonus-results-view")?.classList.remove("hidden");
}

/* -------- Manuelle Eingabe -------- */
function setupManualBonusCalculator() {
  const addBtn = document.getElementById("add-player-btn");
  const calcBtn = document.getElementById("calculate-bonus-btn");
  const clearBtn = document.getElementById("clear-all-btn");
  const playerContainer = document.getElementById("player-accordion-container");

  if (!addBtn || !calcBtn || !clearBtn || !playerContainer) return;

  let players = [];

  function renderPlayers() {
    playerContainer.innerHTML = "";
    players.forEach((p, idx) => {
      const section = document.createElement("div");
      section.className = "player-section";
      section.innerHTML = `
        <div class="player-header">
          <span>${p.name} (RH${p.th})</span>
          <span class="toggle-icon">▼</span>
        </div>
        <div class="attacks-wrapper"></div>
      `;
      const wrapper = section.querySelector(".attacks-wrapper");

      p.attacks.forEach((a, i) => {
        wrapper.innerHTML += `
          <div class="attack-row">
            <label>#${i + 1}</label>
            <input type="number" value="${a.sterne}" placeholder="Sterne">
            <input type="number" value="${a.prozent}" placeholder="%">
            <input type="number" value="${a.gegnerRH}" placeholder="geg. RH">
          </div>`;
      });

      playerContainer.appendChild(section);
    });
  }

  addBtn.addEventListener("click", () => {
    const name = document.getElementById("new-player-name").value.trim();
    const th = parseInt(document.getElementById("new-player-th").value);
    const atk = parseInt(document.getElementById("new-player-attacks").value) || 1;

    if (!name || !th) return;

    players.push({ name, th, attacks: Array.from({ length: atk }, () => ({ sterne: 0, prozent: 0, gegnerRH: th })) });
    renderPlayers();
  });

  calcBtn.addEventListener("click", () => {
    const attacks = [];
    document.querySelectorAll(".player-section").forEach(section => {
      const name = section.querySelector(".player-header span").textContent.split(" (")[0];
      const th = parseInt(name.match(/\(RH(\d+)\)/)?.[1]) || 0;
      section.querySelectorAll(".attack-row").forEach(row => {
        const inputs = row.querySelectorAll("input");
        attacks.push({
          spieler: name,
          eigenesRH: th,
          sterne: parseInt(inputs[0].value) || 0,
          prozent: parseInt(inputs[1].value) || 0,
          gegnerRH: parseInt(inputs[2].value) || 0
        });
      });
    });

    const points = readPointsConfig();
    const result = calculateBonusPoints(attacks, points);
    renderBonusResults(result);
  });

  clearBtn.addEventListener("click", () => {
    players = [];
    playerContainer.innerHTML = "";
    document.getElementById("cwl-bonus-results-view")?.classList.add("hidden");
  });
}

/* -------- Exports -------- */
window.readPointsConfig = readPointsConfig;
window.calculateBonusPoints = calculateBonusPoints;
window.renderBonusResults = renderBonusResults;
window.setupManualBonusCalculator = setupManualBonusCalculator;
