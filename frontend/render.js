// render.js – Rendering & Charts
let capitalChartInstance = null;
let thChartInstance = null;
let leagueChartInstance = null;

const roleTranslations = { member: 'Mitglied', admin: 'Ältester', coLeader: 'Vize-Anführer', leader: 'Anführer' };
const warResultTranslations = { win: 'Sieg', lose: 'Niederlage', tie: 'Unentschieden' };
const warStateTranslations = { notInWar: 'Nicht im Krieg', preparation: 'Vorbereitungstag', inWar: 'Kampftag', warEnded: 'Krieg ist beendet' };

// Helper
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

/* -------- Detailed War View -------- */
function renderDetailedWarView(war) {
  const our = document.getElementById('detailed-war-our-clan');
  const opp = document.getElementById('detailed-war-opponent-clan');
  if (!our || !opp) return;

  function calcStats(side) {
    const clan = war[side];
    return {
      stars: clan.stars ?? 0,
      attacks: (clan.attacks ?? []).length || clan.members.reduce((sum, m) => sum + (m.attacks?.length || 0), 0),
      pct: (clan.destructionPercentage ?? 0).toFixed(1)
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

  const renderPlayerCard = (member, isOpponent = false) => {
    let attacksHtml = "";
    if (member.attacks?.length) {
      attacksHtml = member.attacks.map(a => {
        let stars = a.stars ?? 0;
        let pct = a.destructionPercentage ?? 0;
        let css = stars === 3 ? "three" : stars === 2 ? "two" : stars === 1 ? "one" : "zero";
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
      </div>`;
  };

  our.innerHTML += `<div class="war-player-grid">
    ${war.clan.members.sort((a,b)=>a.mapPosition-b.mapPosition).map(m=>renderPlayerCard(m,false)).join("")}
  </div>`;
  opp.innerHTML += `<div class="war-player-grid">
    ${war.opponent.members.sort((a,b)=>a.mapPosition-b.mapPosition).map(m=>renderPlayerCard(m,true)).join("")}
  </div>`;
}

/* -------- Warlog -------- */
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
  wars.filter(war => !(war?.isCwlWar || war?.teamSize > 50)).forEach(war => {
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

/* -------- Hero Table -------- */
function renderHeroTable(allPlayersData) {
  const container = document.getElementById('hero-table-container');
  if (!container) return;
  const HERO_ORDER = ['Barbarian King', 'Archer Queen', 'Grand Warden', 'Royal Champion', 'Battle Machine', 'Battle Copter'];
  let html = `<table class="lab-table"><thead><tr><th>Spieler</th>`;
  HERO_ORDER.forEach(hero => { html += `<th>${hero.replace('Barbarian ', '').replace('Archer ', '')}</th>`; });
  html += `</tr></thead><tbody>`;
  allPlayersData.sort((a, b) => (b?.townHallLevel ?? 0) - (a?.townHallLevel ?? 0));
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

/* -------- Exports -------- */
window.renderDashboardSummary = renderDashboardSummary;
window.renderClanInfo = renderClanInfo;
window.renderMemberList = renderMemberList;
window.renderPlayerProfile = renderPlayerProfile;
window.renderDonationStats = renderDonationStats;

window.renderCurrentWarDashboard = renderCurrentWarDashboard;
window.renderDetailedWarView = renderDetailedWarView;
window.renderWarlog = renderWarlog;

window.renderCapitalRaids = renderCapitalRaids;
window.renderHeroTable = renderHeroTable;

window.renderCwlSummary = renderCwlSummary;
window.renderCwlRounds = renderCwlRounds;
window.renderCwlPlayerStats = renderCwlPlayerStats;
window.initCwlBonus = initCwlBonus;

window.renderThDistributionChart = renderThDistributionChart;
window.renderLeagueDistributionChart = renderLeagueDistributionChart;

window.formatApiDate = formatApiDate;

