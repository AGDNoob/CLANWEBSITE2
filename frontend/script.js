document.addEventListener('DOMContentLoaded', () => {
    
    // ======================================================
    // KONFIGURATION & GLOBALE VARIABLEN
    // ======================================================
    const API_BASE_URL = 'https://magicdragons.vercel.app'; // Für lokales Testen
    // const API_BASE_URL = 'https://magicdragons.vercel.app'; // Für Live-Version
    const POLLING_INTERVAL_MS = 60000; // 60 Sekunden
    let currentMemberList = [];
    let capitalChartInstance = null;
    let cwlBonusChartInstance = null;
    let thChartInstance = null;
    let leagueChartInstance = null;
    let currentCWLData = null;
    let labDataLoaded = false; // Verhindert mehrfaches Laden der Daten
    let currentWarData = null; // NEUE VARIABLE für die Kriegsdaten
    // --- ELEMENT REFERENZEN ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const clanInfoMasterView = document.getElementById('clan-info-master-view');
    const playerProfileView = document.getElementById('player-profile-view');
    const profileBackButton = document.getElementById('profile-back-button');
    const cwlGroupView = document.getElementById('cwl-group-view');
    const cwlWarDetailView = document.getElementById('cwl-war-detail-view');
    const cwlWarDetailBackButton = document.getElementById('cwl-war-detail-back-button');
    const cwlBonusCalculatorView = document.getElementById('cwl-bonus-calculator-view');
    const cwlBonusResultsView = document.getElementById('cwl-bonus-results-view');
    const bonusRechnerBackButton = document.getElementById('bonus-rechner-back-button');
    const currentWarMasterView = document.getElementById('current-war-master-view');
    const currentWarDetailView = document.getElementById('current-war-detail-view');
    const currentWarDetailBackButton = document.getElementById('current-war-detail-back-button');
    const warLogAccordion = document.getElementById('warlog-accordion');
    const warLogContent = document.getElementById('warlog-accordion-content');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.querySelector('.sidebar');
    const mobileOverlay = document.getElementById('mobile-overlay');

    // ======================================================
    // LIVE-UPDATE LOGIK (POLLING)
    // ======================================================
    function fetchAllData() {
        console.log("Rufe Live-Daten ab...", new Date().toLocaleTimeString());
        fetchClanInfo();
        initializeWarCenter();
        fetchCapitalRaids();
        fetchCWLGroup();
    }

    // ======================================================
    // NAVIGATION & VIEW MANAGEMENT
    // ======================================================
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            pages.forEach(page => page.classList.remove('active'));
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            const targetPage = document.getElementById(targetId);
            if (targetPage) targetPage.classList.add('active');
            link.classList.add('active');
            
            if(sidebar && mobileOverlay){
                sidebar.classList.remove('open');
                mobileOverlay.classList.remove('open');
            }

            // Reset views on navigation
            if(clanInfoMasterView) clanInfoMasterView.classList.remove('hidden');
            if(playerProfileView) playerProfileView.classList.add('hidden');
            if(currentWarMasterView) currentWarMasterView.classList.remove('hidden');
            if(currentWarDetailView) currentWarDetailView.classList.add('hidden');
            if(cwlGroupView) cwlGroupView.classList.remove('hidden');
            if(cwlWarDetailView) cwlWarDetailView.classList.add('hidden');
            if(cwlBonusCalculatorView) cwlBonusCalculatorView.classList.remove('hidden');
            if(cwlBonusResultsView) cwlBonusResultsView.classList.add('hidden');
            
            // Logik für die zusammengelegte Seite
            if (targetId === 'page-lab' && !labDataLoaded) {
                fetchPlayerDataForLab();
            }
        });
    });
    
    if(profileBackButton) profileBackButton.addEventListener('click', () => {
        playerProfileView.classList.add('hidden');
        clanInfoMasterView.classList.remove('hidden');
    });

    if(currentWarMasterView) currentWarMasterView.addEventListener('click', () => {
        currentWarMasterView.classList.add('hidden');
        currentWarDetailView.classList.remove('hidden');
    });

    if(currentWarDetailBackButton) currentWarDetailBackButton.addEventListener('click', () => {
        currentWarDetailView.classList.add('hidden');
        currentWarMasterView.classList.remove('hidden');
    });

    if(cwlWarDetailBackButton) cwlWarDetailBackButton.addEventListener('click', () => {
        cwlWarDetailView.classList.add('hidden');
        cwlGroupView.classList.remove('hidden');
    });

    if(bonusRechnerBackButton) bonusRechnerBackButton.addEventListener('click', () => {
        cwlBonusResultsView.classList.add('hidden');
        cwlBonusCalculatorView.classList.remove('hidden');
    });

    if(warLogAccordion) warLogAccordion.addEventListener('click', () => {
        warLogAccordion.classList.toggle('active');
        if (warLogContent.style.maxHeight) {
            warLogContent.style.maxHeight = null;
        } else {
            warLogContent.style.maxHeight = warLogContent.scrollHeight + "px";
        }
    });

    if(hamburgerBtn) hamburgerBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        mobileOverlay.classList.toggle('open');
    });
    if(mobileOverlay) mobileOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        mobileOverlay.classList.remove('open');
    });

    // ======================================================
    // HILFSFUNKTIONEN & ÜBERSETZUNGEN
    // ======================================================
    const roleTranslations = { member: 'Mitglied', admin: 'Ältester', coLeader: 'Vize-Anführer', leader: 'Anführer' };
    const warStateTranslations = { notInWar: 'Nicht im Krieg', preparation: 'Vorbereitungstag', inWar: 'Kampftag', warEnded: 'Krieg ist beendet' };
    const warResultTranslations = { win: 'Sieg', lose: 'Niederlage', tie: 'Unentschieden' };

    function formatApiDate(apiDateString) {
        if (!apiDateString || apiDateString.length < 15) return null;
        const year = apiDateString.substring(0, 4);
        const month = apiDateString.substring(4, 6);
        const day = apiDateString.substring(6, 8);
        const hour = apiDateString.substring(9, 11);
        const minute = apiDateString.substring(11, 13);
        const second = apiDateString.substring(13, 15);
        return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
    }

    // ======================================================
    // DATEN-ABRUF FUNKTIONEN
    // ======================================================
    async function fetchClanInfo() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/clan/info`);
            if (!response.ok) throw new Error(`HTTP Fehler! Status: ${response.status}`);
            const data = await response.json();
            currentMemberList = data.memberList;
            
            renderClanInfo(data);
            renderMemberList(currentMemberList);
            
            renderDonationStats(currentMemberList);
            renderThDistributionChart(currentMemberList);
            renderLeagueDistributionChart(currentMemberList);
            return true; // Signalisiert Erfolg
        } catch (error) { 
            console.error("Fehler bei Clan-Infos:", error); 
            return false; // Signalisiert Fehler
        }
    }

    async function fetchWarlog() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/clan/warlog`);
            if (!response.ok) throw new Error(`HTTP Fehler! Status: ${response.status}`);
            const data = await response.json();
            renderWarlog(data.items);
        } catch (error) { console.error("Fehler bei Kriegs-Protokoll:", error); }
    }

    async function fetchCapitalRaids() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/clan/capitalraidseasons`);
            if (!response.ok) throw new Error(`HTTP Fehler! Status: ${response.status}`);
            const data = await response.json();
            renderCapitalRaids(data.items);
        } catch (error) { console.error("Fehler bei Hauptstadt-Raids:", error); }
    }
    
   async function initializeWarCenter() {
        const notInWarMessage = document.getElementById('not-in-war-message');
        const currentWarDashboard = document.getElementById('current-war-dashboard');
        if(!notInWarMessage || !currentWarDashboard) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/clan/currentwar`);
            if (response.status === 404) {
                notInWarMessage.classList.remove('hidden');
                currentWarDashboard.classList.add('hidden');
                if(currentWarMasterView) currentWarMasterView.style.cursor = 'default';
            } else if (response.ok) {
                const warData = await response.json();
                currentWarData = warData; // NEU: Speichere die Kriegsdaten global
                notInWarMessage.classList.add('hidden');
                currentWarDashboard.classList.remove('hidden');
                if(currentWarMasterView) currentWarMasterView.style.cursor = 'pointer';
                renderCurrentWarDashboard(warData);
                renderDetailedWarView(warData);
                generateAndRenderWarPlan(warData); // NEU: Rufe den Kriegsplan-Generator auf
            } else { throw new Error(`Serverfehler: ${response.status}`); }
        } catch (error) {
            console.error("Fehler beim Abrufen des aktuellen Kriegs:", error);
            notInWarMessage.textContent = "Daten zum aktuellen Krieg konnten nicht geladen werden.";
            notInWarMessage.classList.remove('hidden');
            currentWarDashboard.classList.add('hidden');
        }
        fetchWarlog();
    }
async function fetchCWLGroup() {
    const noCwlMessage = document.getElementById('no-cwl-message');
    const cwlContent = document.getElementById('cwl-content');
    const statsContainer = document.getElementById('cwl-player-stats-body');
    if (!noCwlMessage || !cwlContent || !statsContainer) return;

    // Setze die Tabellen vor jedem Lauf zurück
    statsContainer.innerHTML = ''; 

    try {
        console.log("Starte fetchCWLGroup...");
        const response = await fetch(`${API_BASE_URL}/api/clan/cwl`);
        
        if (response.status === 404) {
            console.log("API meldet: Keine CWL aktiv (Status 404).");
            noCwlMessage.classList.remove('hidden');
            cwlContent.classList.add('hidden');
            return;
        }
        if (!response.ok) {
            throw new Error(`Serverfehler beim Abrufen der Gruppen-Daten: ${response.status}`);
        }

        const groupData = await response.json();
        console.log("CWL Gruppendaten empfangen:", groupData);

        noCwlMessage.classList.add('hidden');
        cwlContent.classList.remove('hidden');
        
        if (groupData && Array.isArray(groupData.clans)) {
            renderCWLGroup(groupData);
        } else {
             console.log("Gruppendaten sind unvollständig, Clan-Tabelle kann nicht gerendert werden.");
        }

        // PRÜFUNG 1: Gibt es überhaupt Runden in den Daten?
        if (!groupData || !Array.isArray(groupData.rounds) || groupData.rounds.length === 0) {
            console.log("CWL ist aktiv, aber die API liefert keine Runden-Daten. Wahrscheinlich noch Vorbereitungstag.");
            statsContainer.innerHTML = `<tr><td colspan="4"><p>Warte auf den Start des ersten Krieges...</p></td></tr>`;
            return;
        }

        // PRÜFUNG 2: Gibt es gültige Kriegs-Tags?
        const validWarTags = groupData.rounds
            .map(round => round.warTags.find(tag => tag !== '#0'))
            .filter(tag => tag);
            
        if (validWarTags.length === 0) {
            console.log("Runden sind vorhanden, aber noch keine gültigen Kriegs-Tags. Kriegstage sind noch nicht abrufbar.");
            statsContainer.innerHTML = `<tr><td colspan="4"><p>Kriegs-Daten sind in Kürze verfügbar...</p></td></tr>`;
            return;
        }

        console.log(`Gefundene Kriegs-Tags: ${validWarTags.join(', ')}. Lade jetzt die Details...`);
        renderCWLWarSelection(groupData.rounds);

        const warPromises = validWarTags.map(tag => fetchCWLWarDataByTag(tag));
        const cwlRoundsData = await Promise.all(warPromises);
        const validRounds = cwlRoundsData.filter(r => r !== null);
        
        // FINALE PRÜFUNG: Konnten die Kriegsdetails erfolgreich geladen werden?
        if (validRounds.length === 0) {
            console.error("KRITISCHER FEHLER: Kriegs-Tags sind vorhanden, aber der Abruf der Kriegsdetails ist für ALLE fehlgeschlagen. Das ist ein klares Proxy/Caching-Problem.");
            statsContainer.innerHTML = `<tr><td colspan="4" class="error-message">Fehler: Die Kriegsdetails konnten nicht vom Server geladen werden. Der Proxy liefert wahrscheinlich veraltete oder fehlerhafte Daten.</td></tr>`;
        } else {
            console.log(`Erfolgreich ${validRounds.length} von ${validWarTags.length} Kriegstagen geladen.`);
            const playerStats = calculateCWLPlayerStats(validRounds);
            renderCWLStatistics(playerStats.stats, playerStats.bestAttacker);
            renderCWLRoundOverview(validRounds);
        }

    } catch (error) {
        console.error("Ein unerwarteter Fehler ist in fetchCWLGroup aufgetreten:", error);
        noCwlMessage.textContent = "Ein schwerwiegender Fehler ist aufgetreten. Bitte die Konsole prüfen.";
        noCwlMessage.classList.remove('hidden');
        cwlContent.classList.add('hidden');
    }
}
    async function fetchCWLWarDataByTag(warTag) {
        if (!warTag || warTag === '#0') return null;
        try {
            const response = await fetch(`${API_BASE_URL}/api/clan/cwl/war/${warTag.replace('#', '')}`);
            if (!response.ok) { throw new Error(`HTTP-Fehler für warTag ${warTag}: Status ${response.status}`); }
            return await response.json();
        } catch (error) {
            console.error(`Fehler beim Abrufen der CWL-Kriegsdaten für Tag ${warTag}:`, error);
            return null;
        }
    }

    // Zusammengelegte, robuste Ladefunktion für Helden & Tiere
   async function fetchPlayerDataForLab() {
    const loadingContainer = document.getElementById('lab-loading-state');
    const contentContainer = document.getElementById('lab-content-container');
    if (!loadingContainer || !contentContainer) return;

    loadingContainer.classList.remove('hidden');
    contentContainer.classList.add('hidden');
    labDataLoaded = true;

    // Wir brauchen die Mitgliederliste nur, um die Spieler-Tags zu bekommen
    if (currentMemberList.length === 0) {
        const success = await fetchClanInfo();
        if (!success) {
            loadingContainer.innerHTML = '<p class="error-message">Die Clan-Mitgliederliste konnte nicht geladen werden. <button id="retry-lab">Erneut versuchen</button></p>';
            document.getElementById('retry-lab').addEventListener('click', () => { labDataLoaded = false; fetchPlayerDataForLab(); });
            return;
        }
    }

    try {
        loadingContainer.innerHTML = '<div class="spinner"></div><p>Lade detaillierte Spielerdaten...</p>';
        
        // Hier holen wir die VOLLSTÄNDIGEN Daten für jeden Spieler
        const playerPromises = currentMemberList.map(member =>
            fetch(`${API_BASE_URL}/api/player/${member.tag.replace('#', '')}`)
                .then(res => res.ok ? res.json() : Promise.reject(`Fehler bei ${member.name}: ${res.statusText}`))
        );
        
        // HIER WAR DER FEHLER VERSTECKT. 'allPlayersData' ist die richtige Variable mit allen Details.
        const allPlayersData = await Promise.all(playerPromises);
        
        // Wir übergeben die detaillierten Daten an BEIDE Tabellen-Funktionen
        renderHeroTable(allPlayersData);
        
        loadingContainer.classList.add('hidden');
        contentContainer.classList.remove('hidden');

    } catch (error) {
        console.error("Fehler beim Abrufen der Spielerdaten für das Labor:", error);
        loadingContainer.classList.remove('hidden');
        loadingContainer.innerHTML = `<p class="error-message">Einige Spielerdaten konnten nicht geladen werden. <button id="retry-lab">Erneut versuchen</button></p>`;
        document.getElementById('retry-lab').addEventListener('click', () => { labDataLoaded = false; fetchPlayerDataForLab(); });
    }
}

    // ======================================================
    // RENDER-FUNKTIONEN
    // ======================================================
    function renderClanInfo(data) {
        const clanNameEl = document.getElementById('clan-name');
        const clanDescEl = document.getElementById('clan-description');
        const clanStatsEl = document.getElementById('clan-stats');
        if(clanNameEl) clanNameEl.textContent = data.name;
        if(clanDescEl) clanDescEl.textContent = data.description;
        if(clanStatsEl) clanStatsEl.innerHTML = `<span>Level: ${data.clanLevel}</span> | <span>Punkte: ${data.clanPoints}</span> | <span>Benötigte Trophäen: ${data.requiredTrophies}</span>`;
    }

    function renderMemberList(members) {
        const container = document.getElementById('member-list-container');
        if (!container) return;
        container.innerHTML = '';
        (members || []).forEach(member => {
            const translatedRole = roleTranslations[member.role] || member.role;
            const card = document.createElement('div');
            card.className = 'member-card';
            card.dataset.playerTag = member.tag;
            card.innerHTML = `
                <div class="member-card-header">
                    <img src="${member.league ? member.league.iconUrls.tiny : ''}" alt="Liga">
                    <span class="member-name">${member.name}</span>
                </div>
                <div class="member-card-body">
                    <span>${translatedRole}</span>
                    <span>Level ${member.expLevel}</span>
                    <span>${member.trophies} 🏆</span>
                </div>`;
            container.appendChild(card);
        });
        addMemberClickEvents();
    }

    function addMemberClickEvents() {
        document.querySelectorAll('.member-card').forEach(card => {
            card.addEventListener('click', () => {
                const playerTag = card.dataset.playerTag;
                const playerData = currentMemberList.find(member => member.tag === playerTag);
                if (playerData) {
                    renderPlayerProfile(playerData);
                    if(clanInfoMasterView) clanInfoMasterView.classList.add('hidden');
                    if(playerProfileView) playerProfileView.classList.remove('hidden');
                }
            });
        });
    }

    function renderPlayerProfile(player) {
        document.getElementById('profile-league-icon').src = player.league ? player.league.iconUrls.small : '';
        document.getElementById('profile-player-name').textContent = player.name;
        document.getElementById('profile-player-tag').textContent = player.tag;
        document.getElementById('profile-level').textContent = player.expLevel;
        document.getElementById('profile-trophies').textContent = player.trophies;
        document.getElementById('profile-role').textContent = roleTranslations[player.role] || player.role;
        document.getElementById('profile-donations').textContent = player.donations;
        document.getElementById('profile-donations-received').textContent = player.donationsReceived;
        document.getElementById('profile-th-level').textContent = player.townHallLevel;
        document.getElementById('profile-war-stars').textContent = player.warStars !== undefined ? player.warStars : 'N/A';
    }

    function renderWarlog(wars) {
        const container = document.getElementById('warlog-accordion-content');
        if (!container) return;
        container.innerHTML = '';
        if (!wars || wars.length === 0) {
            container.innerHTML = "<p>Keine Kriege im öffentlichen Protokoll gefunden.</p>";
            return;
        }
        wars.forEach(war => {
            if (!war.opponent) return;
            const entry = document.createElement('div');
            entry.className = `warlog-entry ${war.result || 'tie'}`;
            const resultText = warResultTranslations[war.result] || 'Unentschieden';
            entry.innerHTML = `<div class="war-result">${resultText} gegen "${war.opponent.name}"</div><div class="war-details"><span>${war.clan.stars} ⭐ vs ${war.opponent.stars} ⭐</span> | <span>${war.clan.destructionPercentage.toFixed(2)}% Zerstörung</span></div>`;
            container.appendChild(entry);
        });
    }

    function renderCapitalRaids(raids) {
        const container = document.getElementById('capital-raids-container');
        if (!container) return;
        container.innerHTML = '';
        if (!raids || raids.length === 0) {
            container.innerHTML = "<p>Keine abgeschlossenen Raids gefunden.</p>";
            return;
        }
        raids.slice(0, 5).forEach(raid => {
            const entry = document.createElement('div');
            entry.className = 'raid-card';
            const formattedDateString = formatApiDate(raid.startTime);
            const startTime = new Date(formattedDateString).toLocaleDateString('de-DE');
            const attackCount = (raid.attackLog || []).length;
            entry.innerHTML = `<div class="raid-header"><span class="raid-date">Raid vom ${startTime}</span><span class="raid-medals">⭐ ${raid.capitalTotalLoot} Stadtgold</span></div><div class="raid-summary">Angriffe: ${attackCount}</div>`;
            container.appendChild(entry);
        });
        renderCapitalChart(raids);
    }

    function renderCapitalChart(raids) {
        const ctx = document.getElementById('capital-chart');
        if(!ctx) return;
        if (capitalChartInstance) {
            capitalChartInstance.destroy();
        }
        const reversedRaids = [...raids].reverse().slice(-10);
        const labels = reversedRaids.map(raid => new Date(formatApiDate(raid.startTime)).toLocaleDateString('de-DE'));
        const data = reversedRaids.map(raid => raid.capitalTotalLoot);
        capitalChartInstance = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Erbeutetes Stadtgold',
                    data: data,
                    borderColor: 'rgba(255, 121, 198, 1)',
                    backgroundColor: 'rgba(255, 121, 198, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#f8f8f2' }}, y: { ticks: { color: '#f8f8f2' }}}, plugins: { legend: { labels: { color: '#f8f8f2' }}}}
        });
    }

    function renderCurrentWarDashboard(war) {
        const container = document.getElementById('current-war-dashboard');
        if (!container) return;
        const endTime = new Date(formatApiDate(war.endTime)).toLocaleString('de-DE');
        const translatedState = warStateTranslations[war.state] || war.state;
        container.innerHTML = `
            <div class="war-header">
                <div class="clan-side"><h2>${war.clan.name}</h2><img src="${war.clan.badgeUrls.medium}" alt="Clan-Wappen" width="80"></div>
                <div class="vs-separator">VS</div>
                <div class="opponent-side"><h2>${war.opponent.name}</h2><img src="${war.opponent.badgeUrls.medium}" alt="Gegner-Wappen" width="80"></div>
            </div>
            <div class="war-scores">
                <span>${war.clan.stars} ⭐</span><span>Scores</span><span>⭐ ${war.opponent.stars}</span>
                <span>${war.clan.destructionPercentage.toFixed(2)} %</span><span>Zerstörung</span><span>${war.opponent.destructionPercentage.toFixed(2)} %</span>
            </div>
            <div class="war-state">Status: ${translatedState} | Endet am: ${endTime}</div>`;
    }

    function renderDetailedWarView(war) {
    const ourContainer = document.getElementById('detailed-war-our-clan');
    const opponentContainer = document.getElementById('detailed-war-opponent-clan');
    if (!ourContainer || !opponentContainer) return;
    ourContainer.innerHTML = '<h3>Unser Clan</h3>';
    opponentContainer.innerHTML = `<h3>Gegner: ${war.opponent.name}</h3>`;

    // NEU & SICHER: Wir prüfen, ob die Mitgliederlisten überhaupt existieren, bevor wir sie nutzen.
    if (Array.isArray(war.clan.members)) {
        const sortedMembers = [...war.clan.members].sort((a, b) => a.mapPosition - b.mapPosition);
        
        sortedMembers.forEach(member => {
            const memberCard = document.createElement('div');
            memberCard.className = 'war-player-card';

            let attacksHtml = '<div class="attack-info">Kein Angriff</div>';
            if (member.attacks && Array.isArray(war.opponent.members)) { // Zusätzliche Sicherheit
                attacksHtml = member.attacks.map(attack => {
                    const defender = war.opponent.members.find(def => def.tag === attack.defenderTag);
                    const defenderName = defender ? `${defender.mapPosition}. ${defender.name}` : 'Unbekannt';
                    return `<div class="attack-info"><span>⚔️ vs ${defenderName}</span><span class="attack-result">${attack.stars}⭐ ${attack.destructionPercentage}%</span></div>`;
                }).join('');
            }
            memberCard.innerHTML = `<div class="war-player-header"><span class="player-map-pos">${member.mapPosition}.</span><span class="player-name">${member.name}</span><span class="player-th">RH${member.townhallLevel}</span></div><div class="attacks-container">${attacksHtml}</div>`;
            ourContainer.appendChild(memberCard);
        });
    }

    if (Array.isArray(war.opponent.members)) {
        [...war.opponent.members].sort((a, b) => a.mapPosition - b.mapPosition).forEach(member => {
            const opponentCard = document.createElement('div');
            opponentCard.className = 'war-player-card opponent';
            let defenseHtml = `${member.defenseCount || 0} Verteidigung(en)`;
            if (member.bestOpponentAttack && Array.isArray(war.clan.members)) { // Zusätzliche Sicherheit
                const attacker = war.clan.members.find(att => att.tag === member.bestOpponentAttack.attackerTag);
                if (attacker) { // Nur anzeigen, wenn Angreifer gefunden wird
                    defenseHtml = `Bester Angriff von ${attacker.name}: ${member.bestOpponentAttack.stars}⭐`;
                }
            }
            opponentCard.innerHTML = `<div class="war-player-header"><span class="player-map-pos">${member.mapPosition}.</span><span class="player-name">${member.name}</span><span class="player-th">RH${member.townhallLevel}</span></div><div class="defenses-container">${defenseHtml}</div>`;
            opponentContainer.appendChild(opponentCard);
        });
    }
}
    // ======================================================
    // NEUE FUNKTION: KI-KRIEGSPLAN GENERATOR
    // ======================================================
    function generateAndRenderWarPlan(warData) {
        const container = document.getElementById('war-plan-container');
        // Sicherheitscheck, ob die Daten vollständig sind
        if (!container || !warData || !Array.isArray(warData.clan.members) || !Array.isArray(warData.opponent.members)) {
            container.innerHTML = '<p class="error-message">Daten für den Kriegsplan sind unvollständig oder es sind keine Mitglieder im Krieg.</p>';
            return;
        }

        // 1. Beide Listen nach Kartenposition sortieren
        const ourMembers = [...warData.clan.members].sort((a, b) => a.mapPosition - b.mapPosition);
        const opponentMembers = [...warData.opponent.members].sort((a, b) => a.mapPosition - b.mapPosition);

        let planHtml = '<div class="war-plan-grid">';

        // 2. Durch unsere Mitglieder gehen und den "Spiegel"-Gegner zuweisen
        ourMembers.forEach(player => {
            const opponent = opponentMembers.find(opp => opp.mapPosition === player.mapPosition);
            
            if (opponent) {
                planHtml += `
                    <div class="war-plan-matchup">
                        <div class="plan-player our">
                            <span class="plan-pos">${player.mapPosition}.</span>
                            <span class="plan-name">${player.name} (RH${player.townhallLevel})</span>
                        </div>
                        <div class="plan-vs">⚔️</div>
                        <div class="plan-player opponent">
                            <span class="plan-name">${opponent.name} (RH${opponent.townhallLevel})</span>
                            <span class="plan-pos">${opponent.mapPosition}.</span>
                        </div>
                    </div>
                `;
            }
        });

        planHtml += '</div>';
        container.innerHTML = planHtml;
    }
    function renderCWLGroup(groupData) {
    const container = document.getElementById('cwl-group-table-body');
    if (!container) return;
    container.innerHTML = '';
    
    // NEU & SICHER: Wir filtern zuerst alle Clans raus, die keine gültigen Daten haben.
    const sortedClans = [...groupData.clans]
        .filter(clanEntry => clanEntry && clanEntry.clan && clanEntry.clan.name)
        .sort((a, b) => a.clan.name.localeCompare(b.clan.name));

    sortedClans.forEach(clanEntry => {
        const row = document.createElement('tr');
        row.innerHTML = `<td><img src="${clanEntry.clan.badgeUrls.small}" alt="Wappen" width="30"> ${clanEntry.clan.name}</td><td>${clanEntry.clan.clanLevel}</td><td>${clanEntry.wars.filter(w => w.result === 'win').length}</td><td>${clanEntry.wars.filter(w => w.result === 'lose').length}</td>`;
        container.appendChild(row);
    });
}
    
    function renderCWLWarSelection(rounds) {
        const container = document.getElementById('cwl-war-selection');
        if (!container) return;
        container.innerHTML = '';
        rounds.forEach((round, index) => {
            const warTag = round.warTags.find(tag => tag !== '#0');
            if (warTag) {
                const button = document.createElement('button');
                button.className = 'day-selector-btn';
                button.textContent = `Tag ${index + 1}`;
                button.dataset.warTag = warTag;
                button.addEventListener('click', async () => {
                    document.querySelectorAll('.day-selector-btn').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    const warData = await fetchCWLWarDataByTag(warTag);
                    if (warData) {
                        renderCWLWarDetails(warData);
                        if(cwlGroupView) cwlGroupView.classList.add('hidden');
                        if(cwlWarDetailView) cwlWarDetailView.classList.remove('hidden');
                    } else { alert("Kriegsdaten für diesen Tag konnten nicht geladen werden."); }
                });
                container.appendChild(button);
            }
        });
    }
    
function renderCWLWarDetails(warData) {
    const container = document.getElementById('cwl-war-detail-content');
    if (!container) return;

    // FINALE, PARANOIDE SICHERHEITSPRÜFUNG:
    // Wir prüfen jetzt, ob der Gegner auch wirklich einen Namen hat.
    if (!warData || !warData.clan || !warData.opponent || !warData.opponent.name) {
        container.innerHTML = `<div class="dashboard-box"><p class="error-message">Die Daten für diesen Kriegstag sind noch nicht vollständig verfügbar. Der Gegner steht z.B. noch nicht fest. Bitte versuche es später noch einmal.</p></div>`;
        return;
    }

    const translatedState = warStateTranslations[warData.state] || warData.state;
    let ourClanHtml = '<h3>Unser Clan</h3>';
    let opponentClanHtml = `<h3>Gegner: ${warData.opponent.name}</h3>`;

    // Prüfe, ob die Mitgliederliste existiert
    if (Array.isArray(warData.clan.members)) {
        [...warData.clan.members].sort((a, b) => a.mapPosition - b.mapPosition).forEach(member => {
            let attacksHtml = '<div class="attack-info">Kein Angriff</div>';
            if (member.attacks && Array.isArray(warData.opponent.members)) {
                attacksHtml = member.attacks.map(attack => {
                    const defender = warData.opponent.members.find(def => def.tag === attack.defenderTag);
                    if (defender) {
                       return `<div class="attack-info"><span>⚔️ vs ${defender.mapPosition}. ${defender.name}</span><span class="attack-result">${attack.stars}⭐ ${attack.destructionPercentage}%</span></div>`;
                    }
                    return '';
                }).join('');
            }
            ourClanHtml += `<div class="war-player-card"><div class="war-player-header"><span class="player-map-pos">${member.mapPosition}.</span><span class="player-name">${member.name}</span><span class="player-th">RH${member.townhallLevel}</span></div><div class="attacks-container">${attacksHtml || '<div class="attack-info">Kein Angriff</div>'}</div></div>`;
        });
    }

    // Prüfe, ob die Gegner-Mitgliederliste existiert
    if (Array.isArray(warData.opponent.members)) {
        [...warData.opponent.members].sort((a, b) => a.mapPosition - b.mapPosition).forEach(member => {
             opponentClanHtml += `<div class="war-player-card opponent"><div class="war-player-header"><span class="player-map-pos">${member.mapPosition}.</span><span class="player-name">${member.name}</span><span class="player-th">RH${member.townhallLevel}</span></div></div>`;
        });
    }

    container.innerHTML = `<div class="cwl-war-header"><h2>${translatedState}</h2></div><div class="detailed-war-clans">${ourClanHtml}${opponentClanHtml}</div>`;
}
   function calculateCWLPlayerStats(cwlRounds) {
    const playerStats = {};
    
    // NEU: Wir loggen die Daten, die wir zur Verarbeitung bekommen
    console.log("Verarbeite folgende Kriegsdaten für Statistiken:", cwlRounds);

    cwlRounds.forEach((round, index) => {
        // Sicherheitscheck: Hat diese Runde überhaupt Mitgliederdaten?
        if (!round || !round.clan || !Array.isArray(round.clan.members) || round.clan.members.length === 0) {
            console.warn(`Kriegstag ${index + 1} enthält keine Mitgliederdaten. Überspringe...`);
            return; // Gehe zum nächsten Kriegstag
        }

        round.clan.members.forEach(member => {
            if (!playerStats[member.tag]) {
                playerStats[member.tag] = { name: member.name, attacks: 0, stars: 0, destruction: 0 };
            }
            if (member.attacks) {
                playerStats[member.tag].attacks += member.attacks.length;
                member.attacks.forEach(attack => {
                    playerStats[member.tag].stars += attack.stars;
                    playerStats[member.tag].destruction += attack.destructionPercentage;
                });
            }
        });
    });

    const statsArray = Object.values(playerStats).sort((a, b) => b.stars - a.stars || (b.destruction / b.attacks) - (a.destruction / a.attacks));
    const bestAttacker = statsArray.length > 0 ? statsArray[0] : null;

    // NEU: Wir loggen das Ergebnis der Berechnung
    console.log("Ergebnis der Statistik-Berechnung:", { stats: statsArray, bestAttacker });
    
    return { stats: statsArray, bestAttacker };
}

    function renderCWLStatistics(playerStats, bestAttacker) {
        const statsContainer = document.getElementById('cwl-player-stats-body');
        if(statsContainer) {
            statsContainer.innerHTML = '';
            playerStats.forEach(player => {
                const avgDestruction = player.attacks > 0 ? (player.destruction / player.attacks).toFixed(2) : 0;
                const row = document.createElement('tr');
                row.innerHTML = `<td>${player.name}</td><td>${player.attacks}</td><td>${player.stars}</td><td>${avgDestruction}%</td>`;
                statsContainer.appendChild(row);
            });
        }
        const mvpContainer = document.getElementById('cwl-mvp-content');
        if (mvpContainer) {
            if (bestAttacker) {
                const avgDestruction = bestAttacker.attacks > 0 ? (bestAttacker.destruction / bestAttacker.attacks).toFixed(2) : 0;
                mvpContainer.innerHTML = `<h3>${bestAttacker.name}</h3><p>⭐ Gesamtsterne: ${bestAttacker.stars}</p><p>🎯 Angriffe genutzt: ${bestAttacker.attacks}</p><p>💥 Ø Zerstörung: ${avgDestruction}%</p>`;
            } else {
                mvpContainer.innerHTML = '<p>Keine Angriffsdaten für eine Auswertung vorhanden.</p>';
            }
        }
    }

    function renderCWLRoundOverview(rounds) {
        const container = document.getElementById('cwl-round-overview-body');
        if(!container) return;
        container.innerHTML = '';
        rounds.forEach((round, index) => {
            if (!round || !round.opponent) return;
            const row = document.createElement('tr');
            const resultText = warResultTranslations[round.result] || 'Unentschieden';
            row.innerHTML = `<td>Tag ${index + 1}</td><td>${round.opponent.name}</td><td>${resultText}</td><td>${round.clan.stars} - ${round.opponent.stars}</td>`;
            container.appendChild(row);
        });
    }

    function initializeBonusCalculator(cwlRounds) {
        const calculateBtn = document.getElementById('calculate-bonus-btn');
        if (!calculateBtn) return;
        
        calculateBtn.onclick = async () => {
            const pointsConfig = {
                ell_rh_p2: parseInt(document.getElementById('p-ell-rh-p2').value),
                ell_rh_p1: parseInt(document.getElementById('p-ell-rh-p1').value),
                ell_rh_0: parseInt(document.getElementById('p-ell-rh-0').value),
                ell_rh_m1: parseInt(document.getElementById('p-ell-rh-m1').value),
                ell_rh_m2: parseInt(document.getElementById('p-ell-rh-m2').value),
                atk_3s_vs_rh_p2: parseInt(document.getElementById('p-atk-3s-rh-p2').value),
                atk_3s_vs_rh_0: parseInt(document.getElementById('p-atk-3s-rh-0').value),
                atk_3s_vs_rh_m2: parseInt(document.getElementById('p-atk-3s-rh-m2').value),
                atk_2s_90: parseInt(document.getElementById('p-atk-2s-90').value),
                atk_2s_80_89: parseInt(document.getElementById('p-atk-2s-80-89').value),
                atk_2s_50_79: parseInt(document.getElementById('p-atk-2s-50-79').value),
                atk_1s_90_99: parseInt(document.getElementById('p-atk-1s-90-99').value),
                atk_1s_50_89: parseInt(document.getElementById('p-atk-1s-50-89').value),
                bonus_aktiv: parseInt(document.getElementById('p-bonus-aktiv').value),
                bonus_100: parseInt(document.getElementById('p-bonus-100').value),
                bonus_mut: parseInt(document.getElementById('p-bonus-mut').value),
                bonus_mut_extra: parseInt(document.getElementById('p-bonus-mut-extra').value),
                bonus_alle_7: parseInt(document.getElementById('p-bonus-alle-7').value)
            };
    
            const warPromises = cwlRounds
                .filter(round => round.warTags.some(tag => tag !== '#0'))
                .map(round => fetchCWLWarDataByTag(round.warTags.find(tag => tag !== '#0')));
            const cwlRoundsData = await Promise.all(warPromises);
            const validRounds = cwlRoundsData.filter(r => r !== null);
    
            const result = calculateBonusPoints(validRounds, pointsConfig);
            renderBonusResults(result);
    
            if(cwlBonusCalculatorView) cwlBonusCalculatorView.classList.add('hidden');
            if(cwlBonusResultsView) cwlBonusResultsView.classList.remove('hidden');
        };
    }
    
    function calculateBonusPoints(cwlRoundsData, points) {
        const allAttacks = [];
        cwlRoundsData.forEach(war => {
            if (war && war.clan && war.clan.members) {
                war.clan.members.forEach(member => {
                    if (member.attacks) {
                        member.attacks.forEach(attack => {
                            const opponent = war.opponent.members.find(o => o.tag === attack.defenderTag);
                            if (opponent) {
                                allAttacks.push({
                                    spieler: member.name,
                                    eigenesRH: member.townhallLevel,
                                    gegnerRH: opponent.townhallLevel,
                                    sterne: attack.stars,
                                    prozent: attack.destructionPercentage
                                });
                            }
                        });
                    }
                });
            }
        });
    
        const playerScores = {};
        allAttacks.forEach(atk => {
            if (!playerScores[atk.spieler]) {
                playerScores[atk.spieler] = 0;
            }
            const rhDiff = atk.gegnerRH - atk.eigenesRH;
            let ell_pts = 0;
            if (rhDiff >= 2) ell_pts = points.ell_rh_p2;
            else if (rhDiff === 1) ell_pts = points.ell_rh_p1;
            else if (rhDiff === 0) ell_pts = points.ell_rh_0;
            else if (rhDiff === -1) ell_pts = points.ell_rh_m1;
            else if (rhDiff <= -2) ell_pts = points.ell_rh_m2;
    
            let atk_pts = 0;
            if (atk.sterne === 3) {
                if (rhDiff >= 2) atk_pts = points.atk_3s_vs_rh_p2;
                else if (rhDiff >= -1 && rhDiff <= 1) atk_pts = points.atk_3s_vs_rh_0;
                else if (rhDiff <= -2) atk_pts = points.atk_3s_vs_rh_m2;
            } else if (atk.sterne === 2) {
                if (atk.prozent >= 90) atk_pts = points.atk_2s_90;
                else if (atk.prozent >= 80) atk_pts = points.atk_2s_80_89;
                else if (atk.prozent >= 50) atk_pts = points.atk_2s_50_79;
            } else if (atk.sterne === 1) {
                if (atk.prozent >= 90) atk_pts = points.atk_1s_90_99;
                else if (atk.prozent >= 50) atk_pts = points.atk_1s_50_89;
            }
    
            let bonus_pts = points.bonus_aktiv;
            if (atk.prozent === 100) bonus_pts += points.bonus_100;
            if (rhDiff >= 3) {
                bonus_pts += points.bonus_mut;
                if (atk.prozent >= 30 && atk.prozent <= 49) bonus_pts += points.bonus_mut_extra;
            }
            playerScores[atk.spieler] += ell_pts + atk_pts + bonus_pts;
        });

        const attackCounts = allAttacks.reduce((acc, atk) => {
            acc[atk.spieler] = (acc[atk.spieler] || 0) + 1;
            return acc;
        }, {});
        
        Object.keys(playerScores).forEach(spieler => {
            if (attackCounts[spieler] === 7) {
                playerScores[spieler] += points.bonus_alle_7;
            }
        });
    
        return Object.entries(playerScores).map(([spieler, punkte]) => ({ spieler, punkte })).sort((a, b) => b.punkte - a.punkte);
    }
    
    function renderBonusResults(result) {
        const tableBody = document.getElementById('bonus-results-table-body');
        if(!tableBody) return;
        tableBody.innerHTML = '';
        result.forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${index + 1}</td><td>${player.spieler}</td><td>${player.punkte.toFixed(0)}</td>`;
            tableBody.appendChild(row);
        });
        renderBonusChart(result);
    }
    
    function renderBonusChart(result) {
        const ctx = document.getElementById('bonus-chart');
        if(!ctx) return;
        if (cwlBonusChartInstance) {
            cwlBonusChartInstance.destroy();
        }
        const topPlayers = result.slice(0, 15);
        cwlBonusChartInstance = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: topPlayers.map(p => p.spieler),
                datasets: [{
                    label: 'Bonuspunkte',
                    data: topPlayers.map(p => p.punkte),
                    backgroundColor: 'rgba(80, 250, 123, 0.6)',
                    borderColor: 'rgba(80, 250, 123, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#f8f8f2' } },
                    y: { ticks: { color: '#f8f8f2' } }
                },
                plugins: { legend: { labels: { color: '#f8f8f2' } } }
            }
        });
    }

    function renderDonationStats(members) {
        const tableBody = document.getElementById('donation-stats-body');
        if (!tableBody) return;
        const sortedMembers = [...members].sort((a, b) => b.donations - a.donations);
        tableBody.innerHTML = '';
        sortedMembers.slice(0, 10).forEach((member, index) => {
            const ratio = member.donationsReceived > 0 ? (member.donations / member.donationsReceived).toFixed(2) : '∞';
            const ratioClass = ratio >= 1 ? 'good' : 'bad';
            const row = document.createElement('tr');
            row.innerHTML = `<td>${index + 1}</td><td>${member.name}</td><td>${member.donations}</td><td>${member.donationsReceived}</td><td class="donation-ratio ${ratioClass}">${ratio}</td>`;
            tableBody.appendChild(row);
        });
    }

    function renderThDistributionChart(members) {
        const ctx = document.getElementById('th-distribution-chart');
        if (!ctx) return;
        const thLevels = members.reduce((acc, member) => {
            const level = `RH ${member.townHallLevel}`;
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});
        const sortedThLevels = Object.entries(thLevels).sort((a, b) => parseInt(b[0].split(' ')[1]) - parseInt(a[0].split(' ')[1]));
        if (thChartInstance) thChartInstance.destroy();
        thChartInstance = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: sortedThLevels.map(entry => entry[0]),
                datasets: [{
                    label: 'Anzahl Spieler',
                    data: sortedThLevels.map(entry => entry[1]),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: '#f8f8f2' } } } }
        });
    }

    function renderLeagueDistributionChart(members) {
        const ctx = document.getElementById('league-distribution-chart');
        if (!ctx) return;
        
        const leagueColorMap = {
            'Legend': '#e67e22', 'Titan': '#576574', 'Champion': '#9b59b6',
            'Master': '#d35400', 'Crystal': '#3498db', 'Gold': '#f1c40f',
            'Silver': '#bdc3c7', 'Bronze': '#cd7f32', 'Unranked': '#7f8c8d',
            'Keine Liga': '#7f8c8d'
        };

        const leagues = members.reduce((acc, member) => {
            const leagueName = member.league ? member.league.name.replace(/ \w*$/, '') : 'Keine Liga';
            acc[leagueName] = (acc[leagueName] || 0) + 1;
            return acc;
        }, {});
        
        const sortedLeagues = Object.entries(leagues).sort((a, b) => b[1] - a[1]);
        const backgroundColors = sortedLeagues.map(([leagueName]) => {
            const baseLeague = Object.keys(leagueColorMap).find(key => leagueName.includes(key));
            return leagueColorMap[baseLeague] || '#ffffff';
        });

        if (leagueChartInstance) leagueChartInstance.destroy();
        leagueChartInstance = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: sortedLeagues.map(entry => entry[0]),
                datasets: [{
                    data: sortedLeagues.map(entry => entry[1]),
                    backgroundColor: backgroundColors,
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: '#f8f8f2' } } } }
        });
    }
    
    function renderHeroTable(allPlayersData) {
        const container = document.getElementById('hero-table-container');
        if (!container) return;

        const HERO_ORDER = ['Barbarian King', 'Archer Queen', 'Grand Warden', 'Royal Champion', 'Battle Machine', 'Battle Copter'];
        
        let tableHtml = `<table class="lab-table"><thead><tr><th>Spieler</th>`;
        HERO_ORDER.forEach(hero => {
            const shortName = hero.replace('Barbarian ', '').replace('Archer ', '');
            tableHtml += `<th>${shortName}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        allPlayersData.sort((a, b) => b.townHallLevel - a.townHallLevel);

        allPlayersData.forEach(player => {
            if (!player || !player.heroes) return;
            tableHtml += `<tr><td><div class="player-cell">${player.name}<span class="player-th-sublabel">RH${player.townHallLevel}</span></div></td>`;
            const playerHeroes = new Map(player.heroes.map(hero => [hero.name, hero]));
            HERO_ORDER.forEach(heroName => {
                const hero = playerHeroes.get(heroName);
                if (hero) {
                    const isMaxed = hero.level === hero.maxLevel;
                    tableHtml += `<td class="${isMaxed ? 'is-maxed' : ''}">${hero.level}</td>`;
                } else {
                    tableHtml += `<td>-</td>`;
                }
            });
            tableHtml += `</tr>`;
        });
        tableHtml += `</tbody></table>`;
        container.innerHTML = tableHtml;
    }
    // STARTPUNKT DER ANWENDUNG
    fetchAllData(); 
    setInterval(fetchAllData, POLLING_INTERVAL_MS);
});