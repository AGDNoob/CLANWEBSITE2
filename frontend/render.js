// render.js – alles was DOM zeichnet
const roleTranslations = { member: 'Mitglied', admin: 'Ältester', coLeader: 'Vize-Anführer', leader: 'Anführer' };
const warResultTranslations = { win: 'Sieg', lose: 'Niederlage', tie: 'Unentschieden' };
const warStateTranslations = { notInWar: 'Nicht im Krieg', preparation: 'Vorbereitungstag', inWar: 'Kampftag', warEnded: 'Beendet' };

function renderClanInfo(data) {
  document.getElementById('clan-name').textContent = data.name || "Unbekannt";
  document.getElementById('clan-description').textContent = data.description || "";
  document.getElementById('clan-stats').innerHTML =
    `<span>Level: ${data.clanLevel}</span> | 
     <span>Punkte: ${data.clanPoints}</span> | 
     <span>Trophäen benötigt: ${data.requiredTrophies}</span>`;
}

function renderMemberList(members) {
  const container = document.getElementById('member-list-container');
  if (!container) return;
  container.innerHTML = '';
  members.forEach(m => {
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

  // Click Events für Profil
  document.querySelectorAll('.member-card').forEach(card => {
    card.addEventListener('click', () => {
      const playerTag = card.dataset.playerTag;
      const player = members.find(m => m.tag === playerTag);
      if (player) {
        renderPlayerProfile(player);
        document.getElementById('clan-info-master-view').classList.add('hidden');
        document.getElementById('player-profile-view').classList.remove('hidden');
      }
    });
  });
}

function renderPlayerProfile(player) {
  document.getElementById('profile-league-icon').src = player.league?.iconUrls?.small || '';
  document.getElementById('profile-player-name').textContent = player.name;
  document.getElementById('profile-player-tag').textContent = player.tag;
  document.getElementById('profile-level').textContent = player.expLevel;
  document.getElementById('profile-trophies').textContent = player.trophies;
  document.getElementById('profile-role').textContent = roleTranslations[player.role] || player.role;
  document.getElementById('profile-donations').textContent = player.donations;
  document.getElementById('profile-donations-received').textContent = player.donationsReceived;
  document.getElementById('profile-th-level').textContent = player.townHallLevel;
  document.getElementById('profile-war-stars').textContent = player.warStars ?? "N/A";
}

function renderDonationStats(members) {
  const tableBody = document.getElementById('donation-stats-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';
  [...members].sort((a, b) => b.donations - a.donations).slice(0, 10).forEach((m, i) => {
    const ratio = m.donationsReceived > 0 ? (m.donations / m.donationsReceived).toFixed(2) : '∞';
    const ratioClass = ratio >= 1 ? 'good' : 'bad';
    tableBody.innerHTML += `<tr><td>${i + 1}</td><td>${m.name}</td><td>${m.donations}</td><td>${m.donationsReceived}</td><td class="donation-ratio ${ratioClass}">${ratio}</td></tr>`;
  });
}

function renderWarlog(wars) {
  const container = document.getElementById('warlog-accordion-content');
  if (!container) return;
  container.innerHTML = '';
  if (!wars?.length) {
    container.innerHTML = "<p>Keine Kriege gefunden.</p>";
    return;
  }
  wars.forEach(war => {
    const entry = document.createElement('div');
    entry.className = `warlog-entry ${war.result || 'tie'}`;
    entry.innerHTML = `
      <div class="war-result">${warResultTranslations[war.result] || "?"} gegen "${war.opponent?.name || '?'}"</div>
      <div class="war-details">
        <span>${war.clan.stars}⭐ vs ${war.opponent.stars}⭐</span> | 
        <span>${war.clan.destructionPercentage?.toFixed(2)}% Zerstörung</span>
      </div>`;
    container.appendChild(entry);
  });
}

// ... weitere Renderfunktionen (Charts, CurrentWar etc.) kommen hier
