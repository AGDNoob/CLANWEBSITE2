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
function renderDashboardSummary(clan, currentWar, raids, cwl) {
  // Clan-Card
  const clanBox = document.getElementById("clan-stats-summary");
  if (clanBox) {
    clanBox.innerHTML = `
      <p>Level: <b>${clan?.clanLevel ?? "-"}</b></p>
      <p>Punkte: <b>${clan?.clanPoints ?? "-"}</b></p>
      <p>Mitglieder: <b>${clan?.members ?? "-"}</b></p>
    `;
  }

  // CWL-Card
  const cwlBox = document.getElementById("cwl-summary-compact");
  if (cwlBox && cwl) {
    const league = (cwl.clans?.find(c => c.tag === CLAN_TAG)?.warLeague?.name) || "–";
    cwlBox.innerHTML = `
      <p>Saison: <b>${cwl.season ?? "-"}</b></p>
      <p>Liga: <b>${league}</b></p>
      <p>Status: <b>${cwl.state ?? "-"}</b></p>
    `;
  }

  // Aktueller Krieg
  const warBox = document.getElementById("last-war-summary");
  if (warBox) {
    if (!currentWar || !currentWar.opponent) {
      warBox.innerHTML = "<p>Wir sind aktuell nicht im Krieg.</p>";
    } else {
      warBox.innerHTML = `
        <p>vs <b>${currentWar.opponent.name}</b></p>
        <p>${currentWar.clan.stars ?? 0}⭐ ${(currentWar.clan.destructionPercentage ?? 0).toFixed(1)}% –
           ${currentWar.opponent.stars ?? 0}⭐ ${(currentWar.opponent.destructionPercentage ?? 0).toFixed(1)}%</p>
        <p>Status: <b>${warStateTranslations[currentWar.state] || currentWar.state}</b></p>
      `;
    }
  }

  // Clan Capital
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
  document.getElementById('profile-league-icon').src = player?.league?.iconUrls?.small || '';
  document.getElementById('profile-player-name').textContent = player?.name || '';
  document.getElementById('profile-player-tag').textContent = player?.tag || '';
  document.getElementById('profile-level').textContent = player?.expLevel ?? '–';
  document.getElementById('profile-trophies').textContent = player?.trophies ?? '–';
  document.getElementById('profile-role').textContent = roleTranslations[player?.role] || player?.role || '–';
  document.getElementById('profile-donations').textContent = player?.donations ?? '–';
  document.getElementById('profile-donations-received').textContent = player?.donationsReceived ?? '–';
  document.getElementById('profile-th-level').textContent = player?.townHallLevel ?? '–';
  document.getElementById('profile-war-stars').textContent = player?.warStars ?? 'N/A';
}

/* -------- Spenden -------- */
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

/* -------- Warlog -------- */
function renderWarlog(wars) {
  const container = document.getElementById('warlog-accordion-content');
  if (!container) return;
  container.innerHTML = '';
  if (!wars?.length) {
    container.innerHTML = "<p>Keine Kriege im öffentlichen Protokoll gefunden.</p>";
    return;
  }
  wars.forEach(war => {
    if (!war?.opponent) return;
    const entry = document.createElement('div');
    entry.className = `warlog-entry ${war.result || 'tie'}`;
    entry.innerHTML = `
      <div class="war-result">${warResultTranslations[war.result] || 'Unentschieden'} gegen "${war.opponent.name}"</div>
      <div class="war-details">
        <span>${war.clan?.stars ?? 0} ⭐ vs ${war.opponent?.stars ?? 0} ⭐</span> | 
        <span>${(war.clan?.destructionPercentage ?? 0).toFixed(2)}% Zerstörung</span>
      </div>`;
    container.appendChild(entry);
  });
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
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { x: { ticks: { color: '#f5f5f7' }}, y: { ticks: { color: '#f5f5f7' } } },
      plugins: { legend: { labels: { color: '#f5f5f7' } } }
    }
  });
}

/* -------- Exports -------- */
window.renderDashboardSummary = renderDashboardSummary;
window.renderClanInfo = renderClanInfo;
window.renderMemberList = renderMemberList;
window.renderPlayerProfile = renderPlayerProfile;
window.renderDonationStats = renderDonationStats;
window.renderWarlog = renderWarlog;
window.renderCapitalRaids = renderCapitalRaids;
window.formatApiDate = formatApiDate;
