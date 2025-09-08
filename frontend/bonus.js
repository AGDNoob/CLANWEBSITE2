// bonus.js – CWL Bonusrechner
function setupManualBonusCalculator() {
  const addBtn = document.getElementById('add-player-btn');
  const calcBtn = document.getElementById('calculate-bonus-btn');
  const clearBtn = document.getElementById('clear-all-btn');
  const container = document.getElementById('player-accordion-container');

  if (!addBtn || !calcBtn || !clearBtn || !container) return;

  addBtn.onclick = () => {
    const name = document.getElementById('new-player-name').value.trim();
    const th = parseInt(document.getElementById('new-player-th').value);
    const attacks = parseInt(document.getElementById('new-player-attacks').value);
    if (!name || isNaN(th) || isNaN(attacks)) return alert("Ungültige Eingabe.");
    createPlayerSection(name, th, attacks);
  };

  calcBtn.onclick = () => {
    const results = calculateBonusPoints([] /* TODO: attack data */);
    renderBonusResults(results);
    document.getElementById('cwl-bonus-results-view').classList.remove('hidden');
  };

  clearBtn.onclick = () => { container.innerHTML = ''; };
}

function createPlayerSection(name, th, attackCount) {
  const container = document.getElementById('player-accordion-container');
  const section = document.createElement('div');
  section.className = 'player-section';
  section.dataset.playerName = name;
  section.dataset.playerTh = th;
  section.innerHTML = `<div class="player-header"><h4>${name} (RH${th})</h4></div>`;
  container.appendChild(section);
}

// Platzhalter für Bonusberechnung
function calculateBonusPoints(attacks) { return []; }
function renderBonusResults(results) { /* TODO */ }
