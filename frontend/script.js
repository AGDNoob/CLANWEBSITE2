document.addEventListener('DOMContentLoaded', () => {
    
    // ======================================================
    // HTML-ELEMENTE VORAB LADEN
    // ======================================================
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const clanInfoMasterView = document.getElementById('clan-info-master-view');
    const playerProfileView = document.getElementById('player-profile-view');
    const profileBackButton = document.getElementById('profile-back-button');
    const accordionHeader = document.querySelector('.accordion .accordion-header');
    const warMasterView = document.getElementById('war-master-view');
    const warDetailView = document.getElementById('war-detail-view');
    const warBackButton = document.getElementById('war-back-button');
    const currentWarDashboard = document.getElementById('current-war-dashboard');
    const calculateBonusButton = document.getElementById('calculate-bonus-button');
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');
    let bonusChartInstance = null;
    let capitalChartInstance = null;

    // ======================================================
    // NAVIGATION & INTERAKTIVE ELEMENTE
    // ======================================================
    
    // Hauptnavigation (Desktop & Mobile)
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            pages.forEach(page => page.classList.remove('active'));
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            const targetPage = document.getElementById(targetId);
            if (targetPage) targetPage.classList.add('active');
            link.classList.add('active');
            
            // Ansichten immer zurücksetzen
            clanInfoMasterView.classList.remove('hidden');
            playerProfileView.classList.add('hidden');
            warMasterView.classList.remove('hidden');
            warDetailView.classList.add('hidden');

            // Mobiles Menü nach Klick schließen
            sidebar.classList.remove('active');
            overlay.classList.add('hidden');
        });
    });
    
    // Logik für das Öffnen des mobilen Menüs
    mobileNavToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.remove('hidden');
    });

    // Logik für das Schließen des mobilen Menüs (Klick auf Overlay)
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.add('hidden');
    });
    
    profileBackButton.addEventListener('click', () => {
        playerProfileView.classList.add('hidden');
        clanInfoMasterView.classList.remove('hidden');
    });

    warBackButton.addEventListener('click', () => {
        warDetailView.classList.add('hidden');
        warMasterView.classList.remove('hidden');
    });

    if (accordionHeader) {
        accordionHeader.addEventListener('click', () => {
            accordionHeader.classList.toggle('active');
            const content = accordionHeader.nextElementSibling;
            if (content.style.maxHeight) { content.style.maxHeight = null; } 
            else { content.style.maxHeight = content.scrollHeight + "px"; }
        });
    }

    if (calculateBonusButton) {
        calculateBonusButton.addEventListener('click', () => {
            runBonusCalculation();
        });
    }

    // ======================================================
    // GLOBALE VARIABLEN & HILFSFUNKTIONEN
    // ======================================================
    // WICHTIG: Ersetze DEIN-USERNAME durch deinen echten PythonAnywhere Benutzernamen
    const API_BASE_URL = 'https://clanwebsite-2.vercel.app';
    let currentMemberList = [];
    let currentWarData = null;
    let cwlAllRoundsData = [];

    const roleTranslations = { member: 'Mitglied', admin: 'Ältester', coLeader: 'Vize-Anführer', leader: 'Anführer' };
    const warStateTranslations = { preparationDay: 'Vorbereitungstag', inWar: 'Kampftag', warEnded: 'Krieg ist beendet' };
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
    // DATEN-ABRUF FUNKTIONEN (FETCH)
    // ======================================================
    async function fetchClanInfo() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/clan/info`);
            if (!response.ok) throw new Error(`HTTP Fehler! Status: ${response.status}`);
            const data = await response.json();
            currentMemberList = data.memberList;
            renderClanInfo(data);
            renderMemberList(currentMemberList);
        } catch (error) { console.error("Fehler bei Clan-Infos:", error); }
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
        try {
            const response = await fetch(`${API_BASE_URL}/api/clan/currentwar`);
            if (response.status === 404) {
                notInWarMessage.classList.remove('hidden');
                currentWarDashboard.classList.add('hidden');
            } else if (response.ok) {
                currentWarData = await response.json();
                notInWarMessage.classList.add('hidden');
                currentWarDashboard.classList.remove('hidden');
                renderCurrentWarDashboard(currentWarData);
                currentWarDashboard.addEventListener('click', () => {
                    renderDetailedWarView(currentWarData, 'war-detail-view');
                    warMasterView.classList.add('hidden');
                    warDetailView.classList.remove('hidden');
                });
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
        const notInCWLMessage = document.getElementById('not-in-cwl-message');
        const overviewContainer = document.getElementById('cwl-group-overview');
        const roundsContainer = document.getElementById('cwl-rounds-container');
        const analysisContainer = document.getElementById('cwl-analysis-container');
        const bonusCalculatorContainer = document.getElementById('cwl-bonus-calculator');
        try {
            const response = await fetch(`${API_BASE_URL}/api/clan/cwl`);
            if (response.status === 404) {
                notInCWLMessage.classList.remove('hidden');
                overviewContainer.innerHTML = '';
                roundsContainer.classList.add('hidden');
                analysisContainer.classList.add('hidden');
                bonusCalculatorContainer.classList.add('hidden');
            } else if (response.ok) {
                const cwlData = await response.json();
                notInCWLMessage.classList.add('hidden');
                renderCWLGroupOverview(cwlData);
                renderCWLDaySelector(cwlData.rounds);
                roundsContainer.classList.remove('hidden');
                fetchAllCWLRounds(cwlData);
                bonusCalculatorContainer.classList.remove('hidden');
            } else { throw new Error(`Serverfehler: ${response.status}`); }
        } catch (error) {
            console.error("Fehler beim Abrufen der CWL-Daten:", error);
            notInCWLMessage.textContent = "CWL-Daten konnten nicht geladen werden.";
            notInCWLMessage.classList.remove('hidden');
        }
    }

    async function fetchAllCWLRounds(cwlData) {
        const analysisContainer = document.getElementById('cwl-analysis-container');
        const warTags = cwlData.rounds.flatMap(round => round.warTags).filter(tag => tag !== '#0');
        if (warTags.length === 0) return;
        try {
            const promises = warTags.map(tag => fetch(`${API_BASE_URL}/api/cwl/war/${tag.replace('#', '')}`).then(res => res.ok ? res.json() : null));
            cwlAllRoundsData = (await Promise.all(promises)).filter(Boolean);
            if (cwlAllRoundsData.length > 0) {
                const playerStats = calculateCWLPlayerStats(cwlAllRoundsData);
                renderCWLPlayerStats(playerStats);
                renderCWLMVP(playerStats);
                renderCWLRoundSummary(cwlAllRoundsData);
                analysisContainer.classList.remove('hidden');
            }
        } catch (error) { console.error("Fehler beim Laden aller CWL-Rundendaten:", error); }
    }

    async function fetchCWLWarDetails(warTag) {
        const detailContainer = document.getElementById('cwl-war-detail-view');
        detailContainer.innerHTML = `<p>Lade Details für Kriegstag...</p>`;
        try {
            const response = await fetch(`${API_BASE_URL}/api/cwl/war/${warTag.replace('#', '')}`);
            if (!response.ok) throw new Error(`HTTP Fehler! Status: ${response.status}`);
            const warData = await response.json();
            renderDetailedWarView(warData, 'cwl-war-detail-view');
        } catch (error) {
            console.error("Fehler beim Abrufen der CWL-Kriegsdetails:", error);
            detailContainer.innerHTML = `<p>Details für diesen Kriegstag konnten nicht geladen werden.</p>`;
        }
    }

    // ======================================================
    // BONUS-RECHNER LOGIK
    // ======================================================
    function runBonusCalculation() {
        if (cwlAllRoundsData.length === 0) {
            alert("Keine CWL-Daten für die Berechnung verfügbar. Bitte warte, bis die Daten geladen sind.");
            return;
        }

        const points = {};
        const pointInputs = document.querySelectorAll('#cwl-bonus-settings input[type="number"]');
        pointInputs.forEach(input => {
            points[input.id] = parseFloat(input.value) || 0;
        });

        const playerAttacks = new Map();
        const ourClanTag = '#2GJY8YPUP';

        cwlAllRoundsData.forEach(war => {
            const clanSide = war.clan.tag === ourClanTag ? war.clan : war.opponent;
            const opponentSide = war.clan.tag === ourClanTag ? war.opponent : war.clan;

            (clanSide.members || []).forEach(member => {
                if (!playerAttacks.has(member.tag)) {
                    playerAttacks.set(member.tag, { name: member.name, attacks: [] });
                }
                if (member.attacks) {
                    member.attacks.forEach(attack => {
                        const defender = (opponentSide.members || []).find(m => m.tag === attack.defenderTag);
                        const opponentTH = defender ? defender.townhallLevel : member.townhallLevel;
                        
                        let attackPoints = 0;
                        const rh_diff = opponentTH - member.townhallLevel;

                        if (rh_diff >= 2) { attackPoints += points['ell_rh_p2']; }
                        else if (rh_diff === 1) { attackPoints += points['ell_rh_p1']; }
                        else if (rh_diff === 0) { attackPoints += points['ell_rh_0']; }
                        else if (rh_diff === -1) { attackPoints += points['ell_rh_m1']; }
                        else { attackPoints += points['ell_rh_m2']; }

                        if (attack.stars === 3) {
                            if (rh_diff >= 2) { attackPoints += points['atk_3s_vs_rh_p2']; }
                            else if (rh_diff <= -2) { attackPoints += points['atk_3s_vs_rh_m2']; }
                            else { attackPoints += points['atk_3s_vs_rh_0']; }
                        } else if (attack.stars === 2) {
                            if (attack.destructionPercentage >= 90) { attackPoints += points['atk_2s_90']; }
                            else if (attack.destructionPercentage >= 80) { attackPoints += points['atk_2s_80_89']; }
                            else { attackPoints += points['atk_2s_50_79']; }
                        } else if (attack.stars === 1) {
                            if (attack.destructionPercentage >= 90) { attackPoints += points['atk_1s_90_99']; }
                            else { attackPoints += points['atk_1s_50_89']; }
                        }

                        attackPoints += points['bonus_aktiv'];
                        if (attack.destructionPercentage === 100) { attackPoints += points['bonus_100']; }
                        if (rh_diff >= 3) {
                            attackPoints += points['bonus_mut'];
                            if (attack.destructionPercentage >= 30 && attack.destructionPercentage <= 49) {
                                attackPoints += points['bonus_mut_extra'];
                            }
                        }
                        
                        playerAttacks.get(member.tag).attacks.push(attackPoints);
                    });
                }
            });
        });

        const finalScores = [];
        playerAttacks.forEach((data, tag) => {
            let totalPoints = data.attacks.reduce((sum, current) => sum + current, 0);
            const warsParticipated = cwlAllRoundsData.filter(war => (war.clan.members || []).some(m => m.tag === tag)).length;
            if (data.attacks.length === warsParticipated && warsParticipated > 0) {
                totalPoints += points['bonus_alle_7'];
            }
            finalScores.push({ name: data.name, punkte: totalPoints });
        });

        const sortedScores = finalScores.sort((a, b) => b.punkte - a.punkte);
        document.getElementById('bonus-results-container').classList.remove('hidden');
        renderBonusTable(sortedScores);
        renderBonusChart(sortedScores);
    }

    // ======================================================
    // DATEN-ANZEIGE FUNKTIONEN (RENDER)
    // ======================================================
    function renderClanInfo(data) {
        document.getElementById('clan-name').textContent = data.name;
        document.getElementById('clan-description').textContent = data.description;
        document.getElementById('clan-stats').innerHTML = `<span>Level: ${data.clanLevel}</span> | <span>Punkte: ${data.clanPoints}</span> | <span>Benötigte Trophäen: ${data.requiredTrophies}</span>`;
    }

    function renderMemberList(members) {
        const container = document.getElementById('member-list-container');
        container.innerHTML = '';
        (members || []).forEach(member => {
            const card = document.createElement('div');
            card.className = 'member-card';
            card.dataset.playerTag = member.tag;
            const translatedRole = roleTranslations[member.role] || member.role;
            card.innerHTML = `<div class="rank">${member.clanRank}</div><div class="details"><div class="name">${member.name}</div><div class="role">${translatedRole}</div></div>`;
            container.appendChild(card);
        });
        addMemberClickEvents();
    }

    function addMemberClickEvents() {
        const memberCards = document.querySelectorAll('.member-card[data-player-tag]');
        memberCards.forEach(card => {
            card.addEventListener('click', () => {
                const playerTag = card.dataset.playerTag;
                const playerData = currentMemberList.find(member => member.tag === playerTag);
                if (playerData) {
                    renderPlayerProfile(playerData);
                    clanInfoMasterView.classList.add('hidden');
                    playerProfileView.classList.remove('hidden');
                }
            });
        });
    }

    function renderPlayerProfile(player) {
        document.getElementById('profile-league-icon').src = player.league.iconUrls.small;
        document.getElementById('profile-player-name').textContent = player.name;
        document.getElementById('profile-player-tag').textContent = player.tag;
        document.getElementById('profile-level').textContent = player.expLevel;
        document.getElementById('profile-role').textContent = roleTranslations[player.role] || player.role;
        document.getElementById('profile-th-level').textContent = player.townHallLevel;
        document.getElementById('profile-trophies').textContent = player.trophies;
        document.getElementById('profile-donations').textContent = player.donations;
        document.getElementById('profile-donations-received').textContent = player.donationsReceived;
    }

    function renderWarlog(wars) {
        const container = document.getElementById('warlog-container');
        container.innerHTML = '';
        if (!wars || wars.length === 0) {
            container.innerHTML = "<p>Keine Kriege im öffentlichen Protokoll gefunden.</p>";
            return;
        }
        wars.forEach(war => {
            if (!war.opponent) return;
            const entry = document.createElement('div');
            const result = war.result || 'tie';
            entry.className = `warlog-entry ${result}`;
            const translatedResult = warResultTranslations[result] || result;
            entry.innerHTML = `<div class="war-result">${translatedResult} gegen "${war.opponent.name}"</div><div class="war-details"><span>${war.clan.stars} ⭐ vs ${war.opponent.stars} ⭐</span> | <span>${war.clan.destructionPercentage.toFixed(2)}% Zerstörung</span></div>`;
            container.appendChild(entry);
        });
    }

    function renderCapitalRaids(raids) {
        const container = document.getElementById('capital-raids-container');
        container.innerHTML = '';
        if (!raids || raids.length === 0) {
            container.innerHTML = "<p>Keine abgeschlossenen Raids gefunden.</p>";
            return;
        }
        const chartData = raids.slice(0, 10).reverse();
        const labels = chartData.map(raid => new Date(formatApiDate(raid.startTime)).toLocaleDateString('de-DE'));
        const dataPoints = chartData.map(raid => raid.capitalTotalLoot);
        renderCapitalChart(labels, dataPoints);
        raids.slice(0, 5).forEach(raid => {
            const card = document.createElement('div');
            card.className = 'raid-card';
            const formattedDateString = formatApiDate(raid.startTime);
            const startTime = new Date(formattedDateString).toLocaleDateString('de-DE');
            const attackCount = (raid.attackLog || []).length;
            card.innerHTML = `<div class="raid-header"><span class="raid-date">Raid vom ${startTime}</span><span class="raid-medals">⭐ ${raid.capitalTotalLoot} Stadtgold</span></div><div class="raid-summary">Angriffe: ${attackCount}</div>`;
            container.appendChild(card);
        });
    }

    function renderCapitalChart(labels, data) {
        const ctx = document.getElementById('capital-loot-chart').getContext('2d');
        if (capitalChartInstance) { capitalChartInstance.destroy(); }
        capitalChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Erbeutetes Stadtgold',
                    data: data,
                    backgroundColor: 'rgba(255, 121, 198, 0.2)',
                    borderColor: 'rgba(255, 121, 198, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#f8f8f2' }, grid: { color: 'rgba(248, 248, 242, 0.1)' } },
                    x: { ticks: { color: '#f8f8f2' }, grid: { color: 'rgba(248, 248, 242, 0.1)' } }
                },
                plugins: { legend: { labels: { color: '#f8f8f2' } } }
            }
        });
    }

    function renderCurrentWarDashboard(war) {
        const container = document.getElementById('current-war-dashboard');
        const endTime = new Date(formatApiDate(war.endTime)).toLocaleString('de-DE');
        const translatedState = warStateTranslations[war.state] || war.state;
        container.innerHTML = `<div class="war-header"><div class="clan-side"><h2>${war.clan.name}</h2><img src="${war.clan.badgeUrls.medium}" alt="Clan-Wappen" width="80"></div><div class="vs-separator">VS</div><div class="opponent-side"><h2>${war.opponent.name}</h2><img src="${war.opponent.badgeUrls.medium}" alt="Gegner-Wappen" width="80"></div></div><div class="war-scores"><span>${war.clan.stars} ⭐</span><span>Scores</span><span>⭐ ${war.opponent.stars}</span><span>${war.clan.destructionPercentage.toFixed(2)} %</span><span>Zerstörung</span><span>${war.clan.destructionPercentage.toFixed(2)} %</span></div><div class="war-state">Status: ${translatedState} | Endet am: ${endTime}</div>`;
    }

    function renderDetailedWarView(war, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `<div id="${containerId}-clan"></div><div id="${containerId}-opponent"></div>`;
        const clanContainer = document.getElementById(`${containerId}-clan`);
        const opponentContainer = document.getElementById(`${containerId}-opponent`);
        const createWarCards = (team, opponentTeam, title) => {
            let cardsHtml = `<div class="war-team-container"><h3>${title}</h3>`;
            const sortedMembers = (team.members || []).sort((a, b) => a.mapPosition - b.mapPosition);
            sortedMembers.forEach(member => {
                let attacksHtml = '';
                if (member.attacks && member.attacks.length > 0) {
                    member.attacks.forEach(attack => {
                        const defender = (opponentTeam.members || []).find(m => m.tag === attack.defenderTag);
                        const defenderName = defender ? `Nr. ${defender.mapPosition} ${defender.name}` : `Gegner #${attack.defenderTag.slice(-4)}`;
                        attacksHtml += `<div class="attack-entry"><div><span class="attack-stars">${'⭐'.repeat(attack.stars)}</span><span class="attack-destruction">${attack.destructionPercentage}%</span></div><span class="attack-defender">gegen ${defenderName}</span></div>`;
                    });
                } else {
                    attacksHtml = '<div class="no-attacks">Noch nicht angegriffen</div>';
                }
                cardsHtml += `<div class="war-player-card"><div class="player-card-header"><span class="map-position">#${member.mapPosition}</span><div class="player-info"><div class="player-name">${member.name}</div><div class="player-th">Rathaus Level ${member.townhallLevel}</div></div></div><div class="player-card-attacks">${attacksHtml}</div></div>`;
            });
            cardsHtml += '</div>';
            return cardsHtml;
        };
        clanContainer.innerHTML = createWarCards(war.clan, war.opponent, war.clan.name);
        opponentContainer.innerHTML = createWarCards(war.opponent, war.clan, war.opponent.name);
    }

    function renderCWLGroupOverview(group) {
        const container = document.getElementById('cwl-group-overview');
        let tableHtml = `<div class="dashboard-box"><h2>${group.season} - Gruppenübersicht</h2><table class="cwl-group-table"><tr><th>Position</th><th>Clan</th><th>Level</th><th>Sterne ⭐</th><th>Zerstörung %</th></tr>`;
        const sortedClans = (group.clans || []).sort((a, b) => a.rank - b.rank);
        sortedClans.forEach(clan => {
            tableHtml += `<tr><td>${clan.rank}</td><td class="clan-name-cell"><img src="${clan.badgeUrls.small}" alt="Wappen" class="clan-badge">${clan.name}</td><td>${clan.clanLevel}</td><td>${clan.stars}</td><td>${clan.destructionPercentage.toFixed(2)}</td></tr>`;
        });
        tableHtml += '</table></div>';
        container.innerHTML = tableHtml;
    }

    function renderCWLDaySelector(rounds) {
        const selectorContainer = document.getElementById('cwl-day-selector');
        selectorContainer.innerHTML = '';
        rounds.forEach((round, index) => {
            if (round.warTags.some(tag => tag !== '#0')) {
                const button = document.createElement('button');
                button.className = 'day-button';
                button.textContent = `Tag ${index + 1}`;
                button.dataset.warTag = round.warTags.find(tag => tag !== '#0');
                selectorContainer.appendChild(button);
            }
        });
        const dayButtons = document.querySelectorAll('.day-button');
        dayButtons.forEach(button => {
            button.addEventListener('click', () => {
                dayButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const warTag = button.dataset.warTag;
                if (warTag) {
                    fetchCWLWarDetails(warTag);
                }
            });
        });
    }

    function calculateCWLPlayerStats(rounds) {
        const stats = new Map();
        const ourClanTag = '#2GJY8YPUP';
        rounds.forEach(war => {
            const clanSide = war.clan.tag === ourClanTag ? war.clan : war.opponent;
            (clanSide.members || []).forEach(member => {
                if (!stats.has(member.tag)) {
                    stats.set(member.tag, { name: member.name, tag: member.tag, attacks: 0, stars: 0, destruction: 0, attackCount: 0 });
                }
                const playerData = stats.get(member.tag);
                if (member.attacks) {
                    playerData.attacks += member.attacks.length;
                    member.attacks.forEach(attack => {
                        playerData.stars += attack.stars;
                        playerData.destruction += attack.destructionPercentage;
                        playerData.attackCount++;
                    });
                }
            });
        });
        return Array.from(stats.values()).sort((a, b) => {
            if (b.stars !== a.stars) return b.stars - a.stars;
            return b.destruction - a.destruction;
        });
    }

    function renderCWLRoundSummary(rounds) {
        const container = document.getElementById('cwl-rounds-summary');
        let tableHtml = `<table>`;
        rounds.forEach((war, index) => {
            const ourClan = war.clan.tag === '#2GJY8YPUP' ? war.clan : war.opponent;
            const opponent = war.clan.tag === '#2GJY8YPUP' ? war.opponent : war.clan;
            const result = ourClan.stars > opponent.stars ? 'win' : 'lose';
            tableHtml += `<tr><td>Tag ${index + 1}</td><td>vs ${opponent.name}</td><td class="${result}">${ourClan.stars} - ${opponent.stars}</td></tr>`;
        });
        tableHtml += `</table>`;
        container.innerHTML = tableHtml;
    }

    function renderCWLPlayerStats(playerStats) {
        const container = document.getElementById('cwl-player-stats-content');
        let tableHtml = `<table><tr><th>Spieler</th><th>Angriffe</th><th>Sterne ⭐</th><th>Zerstörung %</th></tr>`;
        playerStats.forEach(player => {
            const avgDestruction = player.attackCount > 0 ? (player.destruction / player.attackCount).toFixed(2) : 0;
            tableHtml += `<tr><td>${player.name}</td><td>${player.attacks}</td><td>${player.stars}</td><td>${avgDestruction}</td></tr>`;
        });
        tableHtml += `</table>`;
        container.innerHTML = tableHtml;
    }

    function renderCWLMVP(playerStats) {
        const container = document.getElementById('cwl-mvp-content');
        if (playerStats.length === 0) {
            container.innerHTML = '<p>Keine Daten</p>';
            return;
        }
        const mvp = playerStats[0];
        container.innerHTML = `<div id="cwl-mvp-name">${mvp.name}</div><div id="cwl-mvp-stats"><p>${mvp.stars} Sterne in ${mvp.attacks} Angriffen</p></div>`;
    }

    function renderBonusTable(scores) {
        const container = document.getElementById('bonus-results-table');
        let tableHtml = `<table><tr><th>#</th><th>Spieler</th><th>Punkte</th></tr>`;
        scores.forEach((player, index) => {
            tableHtml += `<tr><td>${index + 1}</td><td>${player.name}</td><td>${player.punkte.toFixed(0)}</td></tr>`;
        });
        tableHtml += `</table>`;
        container.innerHTML = tableHtml;
    }

    function renderBonusChart(scores) {
        const container = document.getElementById('bonus-results-chart');
        const ctx = container.getContext('2d');
        if (bonusChartInstance) { bonusChartInstance.destroy(); }
        const labels = scores.map(s => s.name).slice(0, 15);
        const data = scores.map(s => s.punkte).slice(0, 15);
        bonusChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Bonuspunkte',
                    data: data,
                    backgroundColor: '#FFC300',
                    borderColor: '#FFC300',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#f8f8f2' }, grid: { color: 'rgba(248, 248, 242, 0.1)' } },
                    y: { ticks: { color: '#f8f8f2' }, grid: { color: 'rgba(248, 248, 242, 0.1)' } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
    
    // ======================================================
    // INITIALER START
    // ======================================================
    fetchClanInfo();
    initializeWarCenter();
    fetchCapitalRaids();
    fetchCWLGroup();

});

