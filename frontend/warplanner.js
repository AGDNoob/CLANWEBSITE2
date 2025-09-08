// warplanner.js – KI Kriegsplaner (2 Angriffe/Spieler)

function generateAndRenderWarPlan(war) {
  const container = document.getElementById('war-plan-container');
  if (!container) return;

  if (!war?.clan?.members || !war?.opponent?.members) {
    container.innerHTML = '<p class="error-message">Keine Kriegsdaten verfügbar.</p>';
    return;
  }

  let attackers = war.clan.members.map(m => ({
    name: m.name,
    th: m.townhallLevel,
    mapPos: m.mapPosition,
    attacks: []
  })).sort((a, b) => a.mapPos - b.mapPos);

  let targets = war.opponent.members.map(m => ({
    name: m.name,
    th: m.townhallLevel,
    mapPos: m.mapPosition,
    taken: false
  })).sort((a, b) => a.mapPos - b.mapPos);

  // Zuweisung (einfaches Matching)
  attackers.forEach(attacker => {
    const target = targets.find(t => !t.taken && Math.abs(t.th - attacker.th) <= 1);
    if (target) {
      attacker.attacks.push({ target, strategy: pickStrategy(attacker, target) });
      target.taken = true;
    }
  });

  // Ausgabe
  container.innerHTML = '<h2>KI-Kriegsplan</h2><div class="war-plan-grid"></div>';
  const grid = container.querySelector('.war-plan-grid');
  attackers.forEach(a => {
    a.attacks.forEach(atk => {
      grid.innerHTML += `
        <div class="war-plan-matchup">
          <div class="plan-player our">${a.mapPos}. ${a.name} (RH${a.th})</div>
          <div class="plan-vs">⚔️</div>
          <div class="plan-player opponent">${atk.target.name} (RH${atk.target.th})</div>
          <div class="plan-strategy">${atk.strategy}</div>
        </div>`;
    });
  });
}

function pickStrategy(attacker, target) {
  if (attacker.th > target.th) return "Dip → sichere 3⭐";
  if (attacker.th === target.th) return "Mirror → 3⭐ Chance";
  if (attacker.th < target.th) return "Safe 2⭐ (High%)";
  return "Flex";
}
