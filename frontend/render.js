// render.js – Rendering & Charts (vollständig)

// ---- Chart handles ----
let capitalChartInstance = null;
let thChartInstance = null;
let leagueChartInstance = null;

// ---- Translations ----
const roleTranslations = { member: 'Mitglied', admin: 'Ältester', coLeader: 'Vize-Anführer', leader: 'Anführer' };
const warResultTranslations = { win: 'Sieg', lose: 'Niederlage', tie: 'Unentschieden' };
const warStateTranslations = { notInWar: 'Nicht im Krieg', preparation: 'Vorbereitungstag', inWar: 'Kampftag', warEnded: 'Krieg ist beendet' };

// ---- Helpers ----
function formatApiDate(apiDateString) {
  if (!apiDateString || apiDateString.length < 15) return null;
  const y = apiDateString.substring(0, 4);
  const m = apiDateString.substring(4, 6);
  const d = apiDateString.substring(6, 8);
  const hh = apiDateString.substring(9, 11);
  const mm = apiDateString.substring(11, 13);
  const ss = apiDateString.substring(13, 15);
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}.000Z`;
}
function fmtPct(n) { return (n ?? 0).toFixed ? (n).toFixed(1) : (Number(n) || 0).toFixed(1); }

// =====================================================
// Dashboard / Home
// =====================================================
function renderDashboardSummary(clan, warData, raids, cwl) {
  const clanBox = document.getElementById("clan-stats-summary");
  if (clanBox) {
    clanBox.innerHTML = `
      <p>Level: <b>${clan?.clanLevel ?? "-"}</b></p>
      <p>Punkte: <b>${clan?.clanPoints ?? "-"}</b></p>
      <p>Mitglieder: <b>${clan?.members ?? "-"}</b></p>
    `;
  }

  const cwlBox = document.getElementById("cwl-summary-compact");
  if (cwlBox && cwl) {
    const league = (cwl.clans?.find(c => c.tag === (window.CLAN_TAG || ""))?.warLeague?.name) || "–";
    cwlBox.innerHTML = `
      <p>Saison: <b>${cwl.season ?? "-"}</b></p>
      <p>Liga: <b>${league}</b></p>
      <p>Status: <b>${cwl.state ?? "-"}</b></p>
    `;
  }

  const warBox = document.getElementById("last-war-summary");
  if (warBox) {
    if (!warData) {
      warBox.innerHTML = "<p>Keine Daten.</p>";
    } else {
      const isCurrent = warData.hasOwnProperty("teamSize");
      const header = isCurrent ? "Aktueller Krieg" : "Letzter Krieg";
      warBox.innerHTML = `
        <p><strong>${header}</strong></p>
        <p>vs <b>${warData.opponent?.name ?? "Unbekannt"}</b></p>
        <p>${warData.clan?.stars ?? 0}⭐ ${fmtPct(warData.clan?.destructionPercentage)}% –
           ${warData.opponent?.stars ?? 0}⭐ ${fmtPct(warData.opponent?.destructionPercentage)}%</p>
        <p>Status: <b>${warStateTranslations[warData.state] || warResultTranslations[warData.result] || "?"}</b></p>
      `;
    }
  }

  const capBox = document.getElementById("last-capital-summary");
  if (capBox) {
    if (!raids?.length) {
      capBox.innerHTML = "<p>Noch keine Raids</p>";
    } else {
      const last = raids[0];
      const dateStr = new Date(formatApiDate(last.startTime)).toLocaleDateString("de-DE");
      capBox.innerHTML = `
        <p>Raid vom ${dateStr}</p>
        <p>Beute: <b>${last.capitalTotalLoot}</b> Stadtgold</p>
      `;
    }
  }
}

// =====================================================
// Clan Info + Member
// =====================================================
function renderClanInfo(data) {
  const nameEl = document.getElementById('clan-name');
  const descEl = document.getElementById('clan-description');
  const statsEl = document.getElementById('clan-stats');
  if (nameEl) nameEl.textContent = data?.name || "Unbekannt";
  if (descEl) descEl.textContent = data?.description || "";
  if (statsEl) {
    statsEl.innerHTML =
      `<span>Level: ${data?.clanLevel ?? '–'}</span> | 
       <span>Punkte: ${data?.clanPoints ?? '–'}</span> | 
       <span>Benötigte Trophäen: ${data?.requiredTrophies ?? '–'}</span>`;
  }
}

function renderMemberList(members) {
  const container = document.getElementById('member-list-container');
  if (!container) return;
  container.innerHTML = '';
  (members || []).forEach(m => {
    const card = document.createElement('div');
    card.className = 'member-card';
    card.dataset.playerTag = m.tag;
    card.innerHTML = `
      <div class="member-card-header">
        <img src="${m.league?.iconUrls?.tiny || ''}" alt="Liga">
        <span class="member-name">${m.name}</span>
      </div>
      <div class="member-card-body">
        <span>${roleTranslations[m.role] || m.role}</span>
        <span>Level ${m.expLevel}</span>
        <span>${m.trophies} 🏆</span>
      </div>`;
    container.appendChild(card);
  });
}

function renderPlayerProfile(player) {
  const container = document.querySelector(".profile-card");
  if (!container) return;
  container.innerHTML = `
    <div class="profile-header">
      <img src="${player?.league?.iconUrls?.small || ''}" alt="Liga">
      <div>
        <h3>${player?.name || ''}</h3>
        <p>${roleTranslations[player?.role] || player?.role || '–'}</p>
      </div>
    </div>
    <div class="profile-stats">
      <div class="stat-item"><span>Level</span><span>${player?.expLevel ?? '–'}</span></div>
      <div class="stat-item"><span>Trophäen</span><span>${player?.trophies ?? '–'} 🏆</span></div>
      <div class="stat-item"><span>RH</span><span>${player?.townHallLevel ?? '–'}</span></div>
      <div class="stat-item"><span>War Stars</span><span>${player?.warStars ?? '–'}</span></div>
      <div class="stat-item"><span>Spenden</span><span>${player?.donations ?? 0}</span></div>
      <div class="stat-item"><span>Erhalten</span><span>${player?.donationsReceived ?? 0}</span></div>
    </div>
  `;
}

// =====================================================
// Donation Stats (Top 10 + Ratio)
// =====================================================
function renderDonationStats(members) {
  const tableBody = document.getElementById('donation-stats-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  const sorted = [...(members || [])]
    .sort((a, b) => (b?.donations ?? 0) - (a?.donations ?? 0))
    .slice(0, 10);

  sorted.forEach((m, i) => {
    const ratio = (m.donationsReceived ?? 0) > 0
      ? ((m.donations ?? 0) / m.donationsReceived).toFixed(2)
      : '∞';
    const ratioClass = ratio === '∞' || parseFloat(ratio) >= 1 ? 'good' : 'bad';
    tableBody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${m.name}</td>
        <td>${m.donations}</td>
        <td>${m.donationsReceived}</td>
        <td class="donation-ratio ${ratioClass}">${ratio}</td>
      </tr>`;
  });
}

// =====================================================
// Current War
// =====================================================
function renderCurrentWarDashboard(war) {
  const container = document.getElementById('current-war-dashboard');
  if (!container) return;
  if (!war?.clan || !war?.opponent) {
    container.innerHTML = `<p class="error-message">Kriegsdaten nicht verfügbar.</p>`;
    return;
  }
  const endTime = war?.endTime ? new Date(formatApiDate(war.endTime)).toLocaleString('de-DE') : '–';
  const translatedState = warStateTranslations[war.state] || war.state || '–';
  container.innerHTML = `
    <div class="war-header">
      <div class="clan-side"><h2>${war.clan.name}</h2><img src="${war.clan.badgeUrls?.medium || ''}" alt="Clan-Wappen" width="80"></div>
      <div class="vs-separator">VS</div>
      <div class="opponent-side"><h2>${war.opponent.name}</h2><img src="${war.opponent.badgeUrls?.medium || ''}" alt="Gegner-Wappen" width="80"></div>
    </div>
    <div class="war-scores">
      <span>${war.clan.stars ?? 0} ⭐</span><span>Scores</span><span>⭐ ${war.opponent.stars ?? 0}</span>
      <span>${fmtPct(war.clan.destructionPercentage)} %</span><span>Zerstörung</span><span>${fmtPct(war.opponent.destructionPercentage)} %</span>
    </div>
    <div class="war-state">Status: ${translatedState} | Endet am: ${endTime}</div>`;
}

// =====================================================
// Detailed War View (Team-Stats + Player-Cards)
// =====================================================
function renderDetailedWarView(war) {
  const our = document.getElementById('detailed-war-our-clan');
  const opp = document.getElementById('detailed-war-opponent-clan');
  if (!our || !opp) return;

  function calcStats(side) {
    const clan = war[side];
    const attacksCount = (clan.attacks ?? []).length ||
      (clan.members || []).reduce((sum, m) => sum + (m.attacks?.length || 0), 0);
    return {
      stars: clan.stars ?? 0,
      attacks: attacksCount,
      pct: fmtPct(clan.destructionPercentage)
    };
  }
  const ourStats = calcStats("clan");
  const oppStats = calcStats("opponent");

  our.innerHTML = `
    <h3>Unser Clan</h3>
    <div class="war-team-summary">
      <span>⚔️ Angriffe: <b>${ourStats.attacks}</b></span>
      <span>⭐ Sterne: <b>${ourStats.stars}</b></span>
      <span>💥 Zerstörung: <b>${ourStats.pct}%</b></span>
    </div>
  `;
  opp.innerHTML = `
    <h3>${war?.opponent?.name || 'Gegner'}</h3>
    <div class="war-team-summary">
      <span>⚔️ Angriffe: <b>${oppStats.attacks}</b></span>
      <span>⭐ Sterne: <b>${oppStats.stars}</b></span>
      <span>💥 Zerstörung: <b>${oppStats.pct}%</b></span>
    </div>
  `;

  const renderPlayerCard = (member, isOpponent) => {
    let attacksHtml = "";
    if (member.attacks?.length) {
      attacksHtml = member.attacks.map(a => {
        const stars = a.stars ?? 0;
        const pct = a.destructionPercentage ?? 0;
        const css = stars === 3 ? "three" : stars === 2 ? "two" : stars === 1 ? "one" : "zero";
        return `<div class="attack-badge ${css}">${stars}⭐ – ${pct}%</div>`;
      }).join("");
    } else {
      attacksHtml = `<div class="attack-badge zero">🚫 Kein Angriff</div>`;
    }
    return `
      <div class="war-player-card ${isOpponent ? "opponent" : "our"}">
        <div class="war-player-header">
          <span class="player-map-pos">#${member.mapPosition}</span>
          <span class="player-name">${member.name}</span>
          <span class="player-th">RH${member.townhallLevel}</span>
        </div>
        <div class="attacks-container">${attacksHtml}</div>
      </div>
    `;
  };

  our.innerHTML += `
    <div class="war-player-grid">
      ${(war.clan.members || []).sort((a,b)=>a.mapPosition-b.mapPosition).map(m => renderPlayerCard(m, false)).join("")}
    </div>`;
  opp.innerHTML += `
    <div class="war-player-grid">
      ${(war.opponent.members || []).sort((a,b)=>a.mapPosition-b.mapPosition).map(m => renderPlayerCard(m, true)).join("")}
    </div>`;
}

// =====================================================
// Warlog (CWL automatisch herausfiltern)
// =====================================================
function renderWarlog(wars) {
  const container = document.getElementById('warlog-accordion-content');
  if (!container) return;
  container.innerHTML = '';
  if (!wars?.length) {
    container.innerHTML = "<p>Keine Kriege im öffentlichen Protokoll gefunden.</p>";
    return;
  }

  const grid = document.createElement("div");
  grid.className = "warlog-grid";

  wars
    .filter(w => !(w?.isCwlWar || w?.teamSize > 50)) // CWL/Gruppen-Fights raus
    .forEach(war => {
      if (!war?.opponent) return;
      const entry = document.createElement('div');
      entry.className = `warlog-entry ${war.result || 'tie'}`;
      entry.innerHTML = `
        <div class="war-result">${warResultTranslations[war.result] || 'Unentschieden'} gegen "${war.opponent.name}"</div>
        <div class="war-details">
          <span>${war.clan?.stars ?? 0} ⭐ vs ${war.opponent?.stars ?? 0} ⭐</span><br>
          <span>${fmtPct(war.clan?.destructionPercentage)}% Zerstörung</span>
        </div>`;
      grid.appendChild(entry);
    });

  container.appendChild(grid);
}

// =====================================================
// Clan Capital (Cards + Chart)
// =====================================================
function renderCapitalRaids(raids) {
  const container = document.getElementById('capital-raids-container');
  if (!container) return;
  container.innerHTML = '';

  if (!raids?.length) {
    container.innerHTML = "<p>Keine abgeschlossenen Raids gefunden.</p>";
    return;
  }

  const grid = document.createElement("div");
  grid.className = "raid-list";

  raids.slice(0, 5).forEach(raid => {
    const card = document.createElement("div");
    card.className = "raid-card";

    const start = formatApiDate(raid.startTime);
    const dateStr = start ? new Date(start).toLocaleDateString("de-DE") : "–";

    card.innerHTML = `
      <div class="raid-date">📅 ${dateStr}</div>
      <div class="raid-medals">⭐ ${raid.capitalTotalLoot.toLocaleString()} Stadtgold</div>
    `;

    grid.appendChild(card);
  });

  container.appendChild(grid);

  // Chart wie gehabt
  renderCapitalChart(raids);
}

function renderCapitalChart(raids) {
  const ctx = document.getElementById('capital-chart');
  if (!ctx) return;
  if (capitalChartInstance) capitalChartInstance.destroy();
  const last = [...(raids || [])].reverse().slice(-10);
  const labels = last.map(r => new Date(formatApiDate(r.startTime)).toLocaleDateString('de-DE'));
  const data = last.map(r => r.capitalTotalLoot);
  capitalChartInstance = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [{ label: 'Erbeutetes Stadtgold', data, borderColor: 'rgba(10,132,255,1)', backgroundColor: 'rgba(10,132,255,0.2)', fill: true, tension: 0.4 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { x: { ticks: { color: '#f5f5f7' }}, y: { ticks: { color: '#f5f5f7' } } },
      plugins: { legend: { labels: { color: '#f5f5f7' } } }
    }
  });
}

function renderCapitalContributors(raids) {
  const container = document.getElementById('capital-contributors-container');
  if (!container) return;
  container.innerHTML = '';

  if (!raids?.length) {
    container.innerHTML = "<p>Keine Raids gefunden.</p>";
    return;
  }

  // Nur den letzten Raid nehmen
  const lastRaid = raids[0];
  const contributions = lastRaid?.members || [];

  // Sortieren nach Beute
  const sorted = [...contributions].sort((a, b) => (b?.capitalResourcesLooted ?? 0) - (a?.capitalResourcesLooted ?? 0));

  // Tabelle bauen
  let html = `
    <h3>Top-Beute im letzten Raid</h3>
    <table class="stats-table">
      <thead>
        <tr><th>#</th><th>Spieler</th><th>Beute</th></tr>
      </thead>
      <tbody>
  `;
  sorted.slice(0, 10).forEach((m, i) => {
    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${m.name}</td>
        <td>⭐ ${m.capitalResourcesLooted.toLocaleString()}</td>
      </tr>
    `;
  });
  html += "</tbody></table>";

  container.innerHTML = html;
}

// =====================================================
// Hero Table (Labor)
// =====================================================
function renderHeroCards(players) {
  const container = document.getElementById('hero-table-container');
  if (!container) return;

  container.innerHTML = `
    <div class="hero-grid"></div>
  `;
  const grid = container.querySelector('.hero-grid');

  const ICON = {
    "Barbarian King": "👑",
    "Archer Queen": "👸",
    "Grand Warden": "🧙",
    "Royal Champion": "🛡️",
    "Battle Machine": "🤖",
    "Battle Copter": "🚁"
  };

  (players || [])
    .filter(p => p?.heroes?.length)
    .sort((a,b)=> (b.townHallLevel??0)-(a.townHallLevel??0) || (b.expLevel??0)-(a.expLevel??0))
    .forEach(p => {
      const card = document.createElement('div');
      card.className = 'hero-card';
      card.innerHTML = `
        <div class="hero-header">
          <div class="hero-name">${p.name}</div>
          <div class="hero-th">RH${p.townHallLevel ?? '-'}</div>
        </div>
        <div class="hero-levels"></div>
      `;
      const levels = card.querySelector('.hero-levels');

      // Wir zeigen Heroes in definierter Reihenfolge
      const ORDER = ["Barbarian King", "Archer Queen", "Grand Warden", "Royal Champion", "Battle Machine", "Battle Copter"];
      const map = new Map(p.heroes.map(h => [h.name, h]));

      ORDER.forEach(name => {
        const h = map.get(name);
        if (!h) return;
        // Cap je nach RH bestimmen (oder API-Max)
        const thCap = getThHeroCap(name, p.townHallLevel ?? 0, h.maxLevel);
        const level  = h.level ?? 0;
        const maxCap = Math.max(thCap || 0, level); // falls Cap kleiner als aktuelles Level (API special cases)
        const progress = maxCap ? level / maxCap : 0;

        let cls = 'low';
        if (progress >= 1) cls = 'maxed';
        else if (progress >= .7) cls = 'mid';

        // Optional: Battle Copter Level 1 wird ingame oft als 15 angezeigt – dein alter Hack:
        const displayLevel = (name.toLowerCase() === 'battle copter' && level === 1) ? 15 : level;

        const title = `${name} – ${displayLevel}/${maxCap} (${Math.round(progress*100)}%)`;
        levels.insertAdjacentHTML('beforeend', `
          <div class="hero-level ${cls}" title="${title}">
            <span class="hero-ico">${ICON[name] ?? ''}</span>
            <span>${displayLevel}/${maxCap}</span>
          </div>
        `);
      });

      grid.appendChild(card);
    });
}


// =====================================================
// CWL (Summary, Rounds, Player Stats, Bonus Import)
// =====================================================
function renderCwlSummary(data) {
  const box = document.getElementById('cwl-summary');
  if (!box) return;
  const state = data?.state || "Unbekannt";
  const season = data?.season || "–";
  const clanCount = (data?.clans || []).length;
  let league = "Unbekannt";
  const ourClan = (data?.clans || []).find(c => c.tag === (window.CLAN_TAG || ""));
  if (ourClan?.warLeague?.name) league = ourClan.warLeague.name;

  box.innerHTML = `
    <h3>Übersicht</h3>
    <p>Saison: <b>${season}</b></p>
    <p>Status: <b>${state}</b></p>
    <p>Teilnehmende Clans: <b>${clanCount}</b></p>
    <p>Unsere Liga: <b>${league}</b></p>
  `;
}

function renderCwlRounds(rounds) {
  const box = document.getElementById('cwl-rounds');
  if (!box) return;
  box.innerHTML = "<h3>Rundenübersicht</h3>";
  if (!rounds?.length) {
    box.innerHTML += "<p>Keine CWL-Runden gefunden.</p>";
    return;
  }
  rounds.forEach(r => {
    const result = (r.our_stars > r.opp_stars) ? "✅ Sieg" :
                   (r.our_stars < r.opp_stars) ? "❌ Niederlage" : "➖ Unentschieden";
    const div = document.createElement("div");
    div.className = "cwl-round card";
    div.innerHTML = `
      <div><strong>Runde ${r.round}</strong></div>
      <div>${r.our_stars}⭐ (${fmtPct(r.our_pct)}%) – ${r.opp_stars}⭐ (${fmtPct(r.opp_pct)}%)</div>
      <div>${result}</div>
    `;
    box.appendChild(div);
  });
}

function renderCwlPlayerStats(rounds) {
  const ctx = document.getElementById('cwl-player-stats');
  if (!ctx) return;
  const stats = {};
  (rounds || []).forEach(r => {
    (r.attacks || []).forEach(a => {
      if (!a.from_our_clan) return;
      if (!stats[a.attacker_name]) stats[a.attacker_name] = { stars: 0, attacks: 0 };
      stats[a.attacker_name].stars += a.stars || 0;
      stats[a.attacker_name].attacks += 1;
    });
  });
  const players = Object.entries(stats)
    .map(([name, s]) => ({ name, stars: s.stars, attacks: s.attacks }))
    .sort((a, b) => b.stars - a.stars).slice(0, 10);

  new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: { labels: players.map(p => p.name), datasets: [{ label: "Sterne (Top 10)", data: players.map(p => p.stars), backgroundColor: "rgba(10,132,255,0.6)", borderColor: "rgba(10,132,255,1)", borderWidth: 1 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#f5f5f7' }}, y: { ticks: { color: '#f5f5f7' }} }, plugins: { legend: { labels: { color: '#f5f5f7' } } } }
  });
}

function initCwlBonus(cwlData) {
  const box = document.getElementById('cwl-bonus');
  if (!box) return;
  box.innerHTML = `
    <h3>CWL Bonuspunkte</h3>
    <p>Mit einem Klick echte CWL-Angriffe in den Bonus-Rechner übernehmen.</p>
    <button id="cwl-bonus-import">Angriffe importieren</button>
  `;
  const btn = document.getElementById('cwl-bonus-import');
  if (btn) btn.onclick = () => {
    const attacks = [];
    (cwlData.clans || []).forEach(clan => {
      (clan.members || []).forEach(m => {
        (m.attacks || []).forEach(atk => {
          attacks.push({
            spieler: m.name,
            eigenesRH: m.townHallLevel,
            gegnerRH: atk.defenderTownHall || 0,
            sterne: atk.stars || 0,
            prozent: atk.destructionPercentage || 0
          });
        });
      });
    });
    // erwartet Funktionen aus bonus.js
    try {
      const points = (typeof readPointsConfig === 'function') ? readPointsConfig() : null;
      const result = (typeof calculateBonusPoints === 'function') ? calculateBonusPoints(attacks, points) : null;
      if (result && typeof renderBonusResults === 'function') {
        renderBonusResults(result);
      } else {
        alert("Bonus-Rechner Funktionen nicht gefunden.");
      }
    } catch (e) {
      console.error(e);
      alert("Fehler beim Import in den Bonus-Rechner.");
    }
  };
}

// =====================================================
// Analytics (TH- & League-Distribution Charts)
// =====================================================
function renderThDistributionChart(members) {
  const ctx = document.getElementById('th-distribution-chart');
  if (!ctx) return;

  const counts = {};
  (members || []).forEach(m => {
    const th = m.townHallLevel ?? m.townhallLevel;
    counts[th] = (counts[th] || 0) + 1;
  });

  const labels = Object.keys(counts).map(Number).sort((a, b) => a - b);
  const data = labels.map(l => counts[l]);

  if (thChartInstance) thChartInstance.destroy();
  thChartInstance = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'RH Verteilung', data, backgroundColor: 'rgba(10,132,255,0.6)', borderColor: 'rgba(10,132,255,1)', borderWidth: 1 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#f5f5f7' } } },
      scales: { x: { ticks: { color: '#f5f5f7' }}, y: { ticks: { color: '#f5f5f7' } } }
    }
  });
}

function renderLeagueDistributionChart(members) {
  const ctx = document.getElementById('league-distribution-chart');
  if (!ctx) return;

  const counts = {};
  (members || []).forEach(m => {
    const league = m.league?.name || 'Unbekannt';
    counts[league] = (counts[league] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const data = labels.map(l => counts[l]);

  if (leagueChartInstance) leagueChartInstance.destroy();
  leagueChartInstance = new Chart(ctx.getContext('2d'), {
    type: 'pie',
    data: { labels, datasets: [{ label: 'Liga Verteilung', data, backgroundColor: ['#0a84ff', '#30d158', '#ffd60a', '#ff453a', '#8e8e93', '#5e5ce6', '#64d2ff'] }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#f5f5f7' } } } }
  });
}

// =====================================================
// Exports (alles sichtbar machen)
// =====================================================
window.renderDashboardSummary = renderDashboardSummary;

window.renderClanInfo = renderClanInfo;
window.renderMemberList = renderMemberList;
window.renderPlayerProfile = renderPlayerProfile;

window.renderDonationStats = renderDonationStats;

window.renderCurrentWarDashboard = renderCurrentWarDashboard;
window.renderDetailedWarView = renderDetailedWarView;
window.renderWarlog = renderWarlog;

window.renderCapitalContributors = renderCapitalContributors;
window.renderCapitalRaids = renderCapitalRaids;
window.renderHeroTable = renderHeroTable;

window.renderCwlSummary = renderCwlSummary;
window.renderCwlRounds = renderCwlRounds;
window.renderCwlPlayerStats = renderCwlPlayerStats;
window.initCwlBonus = initCwlBonus;

window.renderThDistributionChart = renderThDistributionChart;
window.renderLeagueDistributionChart = renderLeagueDistributionChart;

window.formatApiDate = formatApiDate;
