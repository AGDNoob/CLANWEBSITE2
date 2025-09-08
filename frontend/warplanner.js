// warplanner.js – KI Kriegsplaner (CW: 2 Angriffe/Spieler, Overkill-Schutz)

function generateAndRenderWarPlan(warData) {
  const container = document.getElementById('war-plan-container');
  if (!container || !warData?.clan?.members || !warData?.opponent?.members) {
    if (container) container.innerHTML = '<p class="error-message">Unvollständige War-Daten.</p>';
    return;
  }

  let attackers = warData.clan.members.map(m => ({
    name: m.name,
    th: m.townhallLevel,
    mapPos: m.mapPosition,
    attacks: []
  })).sort((a,b) => a.mapPos - b.mapPos);

  let targets = warData.opponent.members.map(m => ({
    name: m.name,
    th: m.townhallLevel,
    mapPos: m.mapPosition,
    stars: 0,      // Platzhalter (kann aus DB kommen)
    taken: false
  })).sort((a,b) => a.mapPos - b.mapPos);

  function assignTarget(attacker, isSecondAttack = false) {
    // Mirror
    let t = targets.find(x => !x.taken && x.th === attacker.th);
    if (t) return { t, strat: "Mirror ⚔️" };

    // Dip (max 2 down)
    t = targets.find(x => !x.taken && attacker.th > x.th && (attacker.th - x.th) <= 2);
    if (t) return { t, strat: "Dip 🏹 (sicher 3⭐)" };

    // Push (max 2 up)
    t = targets.find(x => !x.taken && x.th > attacker.th && (x.th - attacker.th) <= 2);
    if (t) return { t, strat: "Push ⭐⭐" };

    // Cleanup (nur 2. Angriff)
    if (isSecondAttack) {
      t = targets.find(x => !x.taken && (x.stars ?? 0) < 3);
      if (t) return { t, strat: "Cleanup 🔄" };
    }

    // Notlösung: irgendein freies Ziel (aber Overkill ≥3 vermeiden)
    t = targets.find(x => !x.taken && Math.abs(x.th - attacker.th) <= 2);
    if (t) return { t, strat: "Flex 🤔" };

    // wirklich letzte Notlösung
    t = targets.find(x => !x.taken);
    if (t) return { t, strat: "Flex 🤔" };
    return null;
  }

  // 1. Angriff (sicher)
  attackers.forEach(a => {
    const pick = assignTarget(a, false);
    if (pick) { pick.t.taken = true; a.attacks.push({ target: pick.t, strategy: pick.strat }); }
  });

  // 2. Angriff (Cleanup/Rest)
  attackers.forEach(a => {
    const pick = assignTarget(a, true);
    if (pick) { pick.t.taken = true; a.attacks.push({ target: pick.t, strategy: pick.strat }); }
  });

  // Render
  let html = `<h2>KI-Kriegsplan (2 Angriffe/Spieler)</h2>
              <p>Priorität: Mirror/Dip → Push → Cleanup. Overkill (≥3 TH-Diff) wird vermieden.</p>
              <div class="war-plan-grid">`;
  attackers.forEach(a => {
    if (!a.attacks.length) return;
    html += `
      <div class="war-plan-matchup">
        <div class="plan-player our">
          <span class="plan-pos">${a.mapPos}.</span>
          <span class="plan-name">${a.name} (RH${a.th})</span>
        </div>
        <div class="plan-attacks">`;
    a.attacks.forEach((atk, idx) => {
      html += `
        <div class="attack-block" style="margin-top:.4rem">
          <div class="plan-vs">Angriff ${idx+1} ⚔️</div>
          <div class="plan-player opponent">
            <span class="plan-name">${atk.target.name} (RH${atk.target.th})</span>
            <span class="plan-pos">${atk.target.mapPos}.</span>
          </div>
          <div class="plan-strategy">${atk.strategy}</div>
        </div>`;
    });
    html += `</div></div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// global
window.generateAndRenderWarPlan = generateAndRenderWarPlan;
