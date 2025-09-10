// render.js – Rendering & Charts
let capitalChartInstance = null;
let thChartInstance = null;
let leagueChartInstance = null;

const roleTranslations = { member: 'Mitglied', admin: 'Ältester', coLeader: 'Vize-Anführer', leader: 'Anführer' };
const warResultTranslations = { win: 'Sieg', lose: 'Niederlage', tie: 'Unentschieden' };
const warStateTranslations = { notInWar: 'Nicht im Krieg', preparation: 'Vorbereitungstag', inWar: 'Kampftag', warEnded: 'Krieg ist beendet' };

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

/* -------- Dashboard / Home -------- */
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
    const league = (cwl.clans?.find(c => c.tag === CLAN_TAG)?.warLeague?.name) || "–";
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
        <p>${warData.clan?.stars ?? 0}⭐ ${(warData.clan?.destructionPercentage ?? 0).toFixed(1)}% –
           ${warData.opponent?.stars ?? 0}⭐ ${(warData.opponent?.destructionPercentage ?? 0).toFixed(1)}%</p>
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
      const date = new Date(formatApiDate(last.startTime)).toLocaleDateString("de-DE");
      capBox.innerHTML = `
        <p>Raid vom ${date}</p>
        <p>Beute: <b>${last.capitalTotalLoot}</b> Stadtgold</p>
      `;
    }
  }
}

/* -------- Clan Info -------- */
function renderClanInfo(data) {
  document.getElementById('clan-name').textContent = data?.name || "Unbekannt";
  document.getElementById('clan-description').textContent = data?.description || "";
  document.getElementById('clan-stats').innerHTML =
    `<span>Level: ${data?.clanLevel ?? '–'}</span> | 
     <span>Punkte: ${data?.clanPoints ?? '–'}</span> | 
     <span>Benötigte Trophäen: ${data?.requiredTrophies ?? '–'}</span>`;
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

  document.querySelectorAll('.member-card').forEach(card => {
    card.addEventListener('click', () => {
      const playerTag = card.dataset.playerTag;
      const player = (members || []).find(m => m.tag === playerTag);
      if (player) {
        renderPlayerProfile(player);
        document.getElementById('clan-info-master-view')?.classList.add('hidden');
        document.getElementById('player-profile-view')?.classList.remove('hidden');
      }
    });
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

function renderDonationStats(members) {
  const tableBody = document.getElementById('donation-stats-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';
  const sorted = [...(members || [])].sort((a, b) => (b?.donations ?? 0) - (a?.donations ?? 0)).slice(0, 10);
  sorted.forEach((m, i) => {
    const ratio = (m.donationsReceived ?? 0) > 0 ? ((m.donations ?? 0) / m.donationsReceived).toFixed(2) : '∞';
    const ratioClass = ratio === '∞' || parseFloat(ratio) >= 1 ? 'good' : 'bad';
    tableBody.innerHTML += `<tr><td>${i + 1}</td><td>${m.name}</td><td>${m.donations}</td><td>${m.donationsReceived}</td><td class="donation-ratio ${ratioClass}">${ratio}</td></tr>`;
  });
}

/* -------- War -------- */
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
      <span>${(war.clan.destructionPercentage ?? 0).toFixed(2)} %</span><span>Zerstörung</span><span>${(war.opponent.destructionPercentage ?? 0).toFixed(2)} %</span>
    </div>
    <div class="war-state">Status: ${translatedState} | Endet am: ${endTime}</div>`;
}

function renderDetailedWarView(war) {
  const our = document.getElementById('detailed-war-our-clan');
  const opp = document.getElementById('detailed-war-opponent-clan');
  if (!our || !opp) return;
  our.innerHTML = '<h3>Unser Clan</h3>';
  opp.innerHTML = `<h3>Gegner: ${war?.opponent?.name || ''}</h3>`;

  if (Array.isArray(war?.clan?.members)) {
    [...war.clan.members]
      .sort((a, b) => a.mapPosition - b.mapPosition)
      .forEach(member => {
        let attacksHtml = '<div class="attack-info">Kein Angriff</div>';
        if (member.attacks && Array.isArray(war?.opponent?.members)) {
          attacksHtml = member.attacks.map(attack => {
            const defender = war.opponent.members.find(def => def.tag === attack.defenderTag);
            const defenderName = defender ? `${defender.mapPosition}. ${defender.name}` : 'Unbekannt';
            return `<div class="attack-info"><span>⚔️ vs ${defenderName}</span><span class="attack-result">${attack.stars}⭐ ${attack.destructionPercentage}%</span></div>`;
          }).join('');
        }
        const card = document.createElement('div');
        card.className = 'war-player-card';
        card.innerHTML = `
          <div class="war-player-header">
            <span class="player-map-pos">${member.mapPosition}.</span>
            <span class="player-name">${member.name}</span>
            <span class="player-th">RH${member.townhallLevel}</span>
          </div>
          <div class="attacks-container">${attacksHtml}</div>`;
        our.appendChild(card);
      });
  }

  if (Array.isArray(war?.opponent?.members)) {
    [...war.opponent.members]
      .sort((a, b) => a.mapPosition - b.mapPosition)
      .forEach(member => {
        const card = document.createElement('div');
        card.className = 'war-player-card opponent';
        card.innerHTML = `
          <div class="war-player-header">
            <span class="player-map-pos">${member.mapPosition}.</span>
            <span class="player-name">${member.name}</span>
            <span class="player-th">RH${member.townhallLevel}</span>
          </div>`;
        opp.appendChild(card);
      });
  }
}

/* -------- Warlog (Accordion + hübsche Cards) -------- */
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
    .filter(war => !(war?.isCwlWar || war?.teamSize > 50)) // CWL raus
    .forEach(war => {
      if (!war?.opponent) return;
      const entry = document.createElement('div');
      entry.className = `warlog-entry ${war.result || 'tie'}`;
      entry.innerHTML = `
        <div class="war-result">${warResultTranslations[war.result] || 'Unentschieden'} gegen "${war.opponent.name}"</div>
        <div class="war-details">
          <span>${war.clan?.stars ?? 0} ⭐ vs ${war.opponent?.stars ?? 0} ⭐</span><br>
          <span>${(war.clan?.destructionPercentage ?? 0).toFixed(2)}% Zerstörung</span>
        </div>`;
      grid.appendChild(entry);
    });

  container.appendChild(grid);
}

/* -------- Capital -------- */
function renderCapitalRaids(raids) {
  const container = document.getElementById('capital-raids-container');
  if (!container) return;
  container.innerHTML = '';
  if (!raids?.length) {
    container.innerHTML = "<p>Keine abgeschlossenen Raids gefunden.</p>";
    return;
  }
  raids.slice(0, 5).forEach(raid => {
    const entry = document.createElement('div');
    entry.className = 'raid-card';
    const formatted = formatApiDate(raid.startTime);
    const startTime = formatted ? new Date(formatted).toLocaleDateString('de-DE') : '–';
    entry.innerHTML = `
      <div class="raid-header">
        <span class="raid-date">Raid vom ${startTime}</span>
        <span class="raid-medals">⭐ ${raid.capitalTotalLoot} Stadtgold</span>
      </div>`;
    container.appendChild(entry);
  });
  renderCapitalChart(raids);
}

function renderCapitalChart(raids) {
  const ctx = document.getElementById('capital-chart');
  if (!ctx) return;
  if (capitalChartInstance) capitalChartInstance.destroy();
  const reversed = [...(raids || [])].reverse().slice(-10);
  const labels = reversed.map(r => new Date(formatApiDate(r.startTime)).toLocaleDateString('de-DE'));
  const data = reversed.map(r => r.capitalTotalLoot);
  capitalChartInstance = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [{ label: 'Erbeutetes Stadtgold', data, borderColor: 'rgba(10,132,255,1)', backgroundColor: 'rgba(10,132,255,0.2)', fill: true, tension: 0.4 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#f5f5f7' }}, y: { ticks: { color: '#f5f5f7' } } }, plugins: { legend: { labels: { color: '#f5f5f7' } } } }
  });
}

/* -------- Lab -------- */
function renderHeroTable(allPlayersData) {
  const container = document.getElementById('hero-table-container');
  if (!container) return;
  const HERO_ORDER = ['Barbarian King', 'Archer Queen', 'Grand Warden', 'Royal Champion', 'Battle Machine', 'Battle Copter'];
  let html = `<table class="lab-table"><thead><tr><th>Spieler</th>`;
  HERO_ORDER.forEach(hero => { html += `<th>${hero.replace('Barbarian ', '').replace('Archer ', '')}</th>`; });
  html += `</tr></thead><tbody>`;
  allPlayersData.sort((a, b) => (b?.townHallLevel ?? 0) - (a?.townHallLevel ?? 0) || (b?.expLevel ?? 0) - (a?.expLevel ?? 0));
  allPlayersData.forEach(player => {
    if (!player?.heroes) return;
    html += `<tr><td><div class="player-cell">${player.name}<span class="player-th-sublabel">RH${player.townHallLevel}</span></div></td>`;
    const map = new Map(player.heroes.map(h => [h.name, h]));
    HERO_ORDER.forEach(name => {
      const hero = map.get(name);
      if (hero) {
        let displayLevel = hero.level;
        if (name.toLowerCase() === 'battle copter' && hero.level === 1) displayLevel = 15;
        html += `<td class="${hero.level === hero.maxLevel ? 'is-maxed' : ''}">${displayLevel}</td>`;
      } else {
        html += `<td>-</td>`;
      }
    });
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
}

/* -------- CWL -------- */
function renderCwlSummary(data) {
  const box = document.getElementById('cwl-summary');
  if (!box) return;
  const state = data.state || "Unbekannt";
  const season = data.season || "–";
  const clanCount = (data.clans || []).length;
  let league = "Unbekannt";
  if (data.clans) {
    const ourClan = data.clans.find(c => c.tag === CLAN_TAG);
    if (ourClan?.warLeague?.name) league = ourClan.warLeague.name;
  }
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
      <div>${r.our_stars}⭐ (${(r.our_pct || 0).toFixed(1)}%) – ${r.opp_stars}⭐ (${(r.opp_pct || 0).toFixed(1)}%)</div>
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
  const players = Object.entries(stats).map(([name, s]) => ({ name, stars: s.stars, attacks: s.attacks })).sort((a, b) => b.stars - a.stars).slice(0, 10);
  new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: { labels: players.map(p => p.name), datasets: [{ label: "Sterne (Top 10)", data: players.map(p => p.stars), backgroundColor: "rgba(10,132,255,0.6)", borderColor: "rgba(10,132,255,1)", borderWidth: 1 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#f5f5f7' }}, y: { ticks: { color: '#f5f5f7' }} }, plugins: { legend: { labels: { color: '#f5f5f7' } } } }
  });
}

function initCwlBonus(data) {
  const box = document.getElementById('cwl-bonus');
  if (!box) return;
  box.innerHTML = `
    <h3>CWL Bonuspunkte</h3>
    <p>Der Bonus-Rechner kann jetzt mit den echten CWL-Angriffsdaten befüllt werden.</p>
    <button id="cwl-bonus-import">Angriffe importieren</button>
  `;
  document.getElementById('cwl-bonus-import').onclick = () => {
    const attacks = [];
    (data.clans || []).forEach(clan => {
      (clan.members || []).forEach(m => {
        (m.attacks || []).forEach(atk => {
          attacks.push({ spieler: m.name, eigenesRH: m.townHallLevel, gegnerRH: atk.defenderTownHall || 0, sterne: atk.stars || 0, prozent: atk.destructionPercentage || 0 });
        });
      });
    });
    const points = readPointsConfig();
    const result = calculateBonusPoints(attacks, points);
    renderBonusResults(result);
  };
}

/* -------- Exports -------- */
window.renderDashboardSummary = renderDashboardSummary;
window.renderClanInfo = renderClanInfo;
window.renderMemberList = renderMemberList;
window.renderPlayerProfile = renderPlayerProfile;
window.renderDonationStats = renderDonationStats;
window.renderThDistributionChart = renderThDistributionChart;
window.renderLeagueDistributionChart = renderLeagueDistributionChart;
window.renderCurrentWarDashboard = renderCurrentWarDashboard;
window.renderDetailedWarView = renderDetailedWarView;
window.renderWarlog = renderWarlog;
window.renderCapitalRaids = renderCapitalRaids;
window.renderHeroTable = renderHeroTable;
window.renderCwlSummary = renderCwlSummary;
window.renderCwlRounds = renderCwlRounds;
window.renderCwlPlayerStats = renderCwlPlayerStats;
window.initCwlBonus = initCwlBonus;
window.formatApiDate = formatApiDate;
