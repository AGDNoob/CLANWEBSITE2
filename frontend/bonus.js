// bonus.js – CWL Bonus-Rechner (vollständig)

let cwlBonusChartInstance = null;

function setupManualBonusCalculator() {
  const addBtn = document.getElementById('add-player-btn');
  const calcBtn = document.getElementById('calculate-bonus-btn');
  const clearBtn = document.getElementById('clear-all-btn');
  const accordionContainer = document.getElementById('player-accordion-container');

  if (!addBtn || !calcBtn || !clearBtn || !accordionContainer) return;

  addBtn.onclick = () => {
    const name = document.getElementById('new-player-name').value.trim();
    const th = parseInt(document.getElementById('new-player-th').value);
    const attackCount = parseInt(document.getElementById('new-player-attacks').value);
    if (!name || isNaN(th) || isNaN(attackCount) || attackCount < 1 || attackCount > 7) {
      alert("Bitte gültigen Namen, RH-Level und Angriffe (1-7) angeben.");
      return;
    }
    createPlayerSection(name, th, attackCount);
    document.getElementById('new-player-name').value = '';
    document.getElementById('new-player-th').value = '';
    document.getElementById('new-player-attacks').value = '';
  };

  calcBtn.onclick = () => {
    const points = readPointsConfig();
    const allAttacks = readAllAttacksFromUI();
    const result = calculateBonusPoints(allAttacks, points);
    renderBonusResults(result);
    document.getElementById('cwl-bonus-results-view')?.classList.remove('hidden');
  };

  clearBtn.onclick = () => {
    if (confirm("Alle Spieler und Angriffe löschen?")) {
      accordionContainer.innerHTML = '';
      document.getElementById('cwl-bonus-results-view')?.classList.add('hidden');
    }
  };

  // Settings-UI (identisch zu deinem HTML – falls dynamisch benötigt)
  ensureBonusSettingsUI();
}

function ensureBonusSettingsUI() {
  const box = document.getElementById('bonus-settings');
  if (!box || box.children.length) return;
  box.innerHTML = `
    <div class="settings-box">
      <h3>Punkte für RH-Differenz</h3>
      <div class="setting-item"><label>RH+2</label><input type="number" id="p-ell-rh-p2" value="3"></div>
      <div class="setting-item"><label>RH+1</label><input type="number" id="p-ell-rh-p1" value="2"></div>
      <div class="setting-item"><label>RH=0</label><input type="number" id="p-ell-rh-0" value="1"></div>
      <div class="setting-item"><label>RH-1</label><input type="number" id="p-ell-rh-m1" value="0"></div>
      <div class="setting-item"><label>RH-2</label><input type="number" id="p-ell-rh-m2" value="-1"></div>
    </div>
    <div class="settings-box">
      <h3>Punkte für 3 Sterne</h3>
      <div class="setting-item"><label>3⭐ vs RH+2</label><input type="number" id="p-atk-3s-vs-rh-p2" value="6"></div>
      <div class="setting-item"><label>3⭐ vs RH=0</label><input type="number" id="p-atk-3s-vs-rh-0" value="4"></div>
      <div class="setting-item"><label>3⭐ vs RH-2</label><input type="number" id="p-atk-3s-vs-rh-m2" value="2"></div>
    </div>
    <div class="settings-box">
      <h3>Punkte für 2 Sterne</h3>
      <div class="setting-item"><label>2⭐ (90%+)</label><input type="number" id="p-atk-2s-90" value="4"></div>
      <div class="setting-item"><label>2⭐ (80-89%)</label><input type="number" id="p-atk-2s-80-89" value="3"></div>
      <div class="setting-item"><label>2⭐ (50-79%)</label><input type="number" id="p-atk-2s-50-79" value="2"></div>
    </div>
    <div class="settings-box">
      <h3>Punkte für 1 Stern</h3>
      <div class="setting-item"><label>1⭐ (90-99%)</label><input type="number" id="p-atk-1s-90-99" value="2"></div>
      <div class="setting-item"><label>1⭐ (50-89%)</label><input type="number" id="p-atk-1s-50-89" value="1"></div>
    </div>
    <div class="settings-box">
      <h3>Bonuspunkte</h3>
      <div class="setting-item"><label>Aktivität</label><input type="number" id="p-bonus-aktiv" value="1"></div>
      <div class="setting-item"><label>100% Bonus</label><input type="number" id="p-bonus-100" value="1"></div>
      <div class="setting-item"><label>Mutbonus (RH+3)</label><input type="number" id="p-bonus-mut" value="1"></div>
      <div class="setting-item"><label>Extra Mut (30-49%)</label><input type="number" id="p-bonus-mut-extra" value="2"></div>
      <div class="setting-item"><label>Alle 7 Angriffe</label><input type="number" id="p-bonus-alle-7" value="2"></div>
    </div>`;
}

function createPlayerSection(name, th, attackCount) {
  const container = document.getElementById('player-accordion-container');
  const section = document.createElement('div');
  section.className = 'player-section';
  section.dataset.playerName = name;
  section.dataset.playerTh = th;
  section.innerHTML = `
    <div class="player-header"><h4>${name} (RH ${th})</h4><div class="toggle-icon">▼</div></div>
    <div class="attacks-wrapper"></div>`;
  const wrap = section.querySelector('.attacks-wrapper');
  for (let i = 1; i <= attackCount; i++) {
    const row = document.createElement('div');
    row.className = 'attack-row';
    row.innerHTML = `
      <label>Angriff #${i}</label>
      <input type="number" placeholder="Gegner RH">
      <input type="number" placeholder="Sterne ⭐" min="0" max="3" class="sterne-input">
      <input type="number" placeholder="Prozent %" min="0" max="100" class="prozent-input">`;
    const sterne = row.querySelector('.sterne-input');
    const prozent = row.querySelector('.prozent-input');
    sterne.addEventListener('input', () => { if (sterne.value === '3') prozent.value = 100; });
    prozent.addEventListener('input', () => { if (prozent.value === '100') sterne.value = 3; });
    wrap.appendChild(row);
  }
  container.appendChild(section);
  section.querySelector('.player-header').addEventListener('click', () => section.classList.toggle('closed'));
}

function readPointsConfig() {
  const val = id => parseInt(document.getElementById(id).value);
  return {
    ell_rh_p2: val('p-ell-rh-p2'),
    ell_rh_p1: val('p-ell-rh-p1'),
    ell_rh_0:  val('p-ell-rh-0'),
    ell_rh_m1: val('p-ell-rh-m1'),
    ell_rh_m2: val('p-ell-rh-m2'),
    atk_3s_vs_rh_p2: val('p-atk-3s-vs-rh-p2'),
    atk_3s_vs_rh_0:  val('p-atk-3s-vs-rh-0'),
    atk_3s_vs_rh_m2: val('p-atk-3s-vs-rh-m2'),
    atk_2s_90:      val('p-atk-2s-90'),
    atk_2s_80_89:   val('p-atk-2s-80-89'),
    atk_2s_50_79:   val('p-atk-2s-50-79'),
    atk_1s_90_99:   val('p-atk-1s-90-99'),
    atk_1s_50_89:   val('p-atk-1s-50-89'),
    bonus_aktiv:    val('p-bonus-aktiv'),
    bonus_100:      val('p-bonus-100'),
    bonus_mut:      val('p-bonus-mut'),
    bonus_mut_extra:val('p-bonus-mut-extra'),
    bonus_alle_7:   val('p-bonus-alle-7')
  };
}

function readAllAttacksFromUI() {
  const container = document.getElementById('player-accordion-container');
  const all = [];
  container.querySelectorAll('.player-section').forEach(sec => {
    const spieler = sec.dataset.playerName;
    const eigenesRH = parseInt(sec.dataset.playerTh);
    sec.querySelectorAll('.attack-row').forEach(row => {
      const [gegnerRHInput, sterneInput, prozentInput] = row.querySelectorAll('input[type="number"]');
      const gegnerRH = parseInt(gegnerRHInput.value);
      const sterne = parseInt(sterneInput.value);
      const prozent = parseInt(prozentInput.value);
      if (spieler && !isNaN(eigenesRH) && !isNaN(gegnerRH) && !isNaN(sterne) && !isNaN(prozent)) {
        all.push({ spieler, eigenesRH, gegnerRH, sterne, prozent });
      }
    });
  });
  return all;
}

function calculateBonusPoints(allAttacks, points) {
  const playerScores = {};
  allAttacks.forEach(atk => {
    if (!playerScores[atk.spieler]) playerScores[atk.spieler] = { totalPoints: 0, attackCount: 0 };
    playerScores[atk.spieler].attackCount++;
    const rhDiff = atk.gegnerRH - atk.eigenesRH;
    let ell = 0;
    if (rhDiff >= 2) ell = points.ell_rh_p2;
    else if (rhDiff === 1) ell = points.ell_rh_p1;
    else if (rhDiff === 0) ell = points.ell_rh_0;
    else if (rhDiff === -1) ell = points.ell_rh_m1;
    else if (rhDiff <= -2) ell = points.ell_rh_m2;

    let atkPts = 0;
    if (atk.sterne === 3) {
      if (rhDiff >= 2) atkPts = points.atk_3s_vs_rh_p2;
      else if (rhDiff >= -1 && rhDiff <= 1) atkPts = points.atk_3s_vs_rh_0;
      else if (rhDiff <= -2) atkPts = points.atk_3s_vs_rh_m2;
    } else if (atk.sterne === 2) {
      if (atk.prozent >= 90) atkPts = points.atk_2s_90;
      else if (atk.prozent >= 80) atkPts = points.atk_2s_80_89;
      else if (atk.prozent >= 50) atkPts = points.atk_2s_50_79;
    } else if (atk.sterne === 1) {
      if (atk.prozent >= 90) atkPts = points.atk_1s_90_99;
      else if (atk.prozent >= 50) atkPts = points.atk_1s_50_89;
    }

    let bonus = points.bonus_aktiv;
    if (atk.prozent === 100) bonus += points.bonus_100;
    if (rhDiff >= 3) {
      bonus += points.bonus_mut;
      if (atk.prozent >= 30 && atk.prozent <= 49) bonus += points.bonus_mut_extra;
    }

    playerScores[atk.spieler].totalPoints += ell + atkPts + bonus;
  });

  Object.keys(playerScores).forEach(name => {
    if (playerScores[name].attackCount === 7) playerScores[name].totalPoints += points.bonus_alle_7;
  });

  return Object.entries(playerScores)
    .map(([spieler, data]) => ({ spieler, punkte: data.totalPoints }))
    .sort((a, b) => b.punkte - a.punkte);
}

function renderBonusResults(result) {
  const body = document.getElementById('bonus-results-table-body');
  const ctx = document.getElementById('bonus-chart');
  if (!body || !ctx) return;

  body.innerHTML = '';
  if (!result.length) {
    body.innerHTML = '<tr><td colspan="3">Keine gültigen Angriffe gefunden.</td></tr>';
    return;
  }
  result.forEach((p, i) => {
    body.innerHTML += `<tr><td>${i + 1}</td><td>${p.spieler}</td><td>${p.punkte.toFixed(0)}</td></tr>`;
  });

  if (cwlBonusChartInstance) cwlBonusChartInstance.destroy();
  const top = result.slice(0, 15);
  cwlBonusChartInstance = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: { labels: top.map(x => x.spieler), datasets: [{ label: 'Bonuspunkte', data: top.map(x => x.punkte), backgroundColor: 'rgba(80, 250, 123, 0.6)', borderColor: 'rgba(80, 250, 123, 1)', borderWidth: 1 }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      scales: { x: { ticks: { color: '#f8f8f2' } }, y: { ticks: { color: '#f8f8f2' } } },
      plugins: { legend: { labels: { color: '#f8f8f2' } } }
    }
  });
}

// global
window.setupManualBonusCalculator = setupManualBonusCalculator;
