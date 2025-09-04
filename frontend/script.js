document.addEventListener('DOMContentLoaded', () => {
    
    // ======================================================
    // KONFIGURATION & GLOBALE VARIABLEN
    // ======================================================
    const API_BASE_URL = 'https://agdnoob1.pythonanywhere.com';
    const POLLING_INTERVAL_MS = 60000;
    let currentMemberList = [];
    let capitalChartInstance = null;
    let cwlBonusChartInstance = null;
    let thChartInstance = null;
    let leagueChartInstance = null;
    let labDataLoaded = false;
    let currentWarData = null;
    
    // --- ELEMENT REFERENZEN ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const clanInfoMasterView = document.getElementById('clan-info-master-view');
    const playerProfileView = document.getElementById('player-profile-view');
    const profileBackButton = document.getElementById('profile-back-button');
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
    async function fetchAllData() {
        console.log("Rufe Live-Daten ab...", new Date().toLocaleTimeString());
        await fetchClanInfo(); 
        await initializeWarCenter(); 
        await fetchCapitalRaids();
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

            if(clanInfoMasterView) clanInfoMasterView.classList.remove('hidden');
            if(playerProfileView) playerProfileView.classList.add('hidden');
            if(currentWarMasterView) currentWarMasterView.classList.remove('hidden');
            if(currentWarDetailView) currentWarDetailView.classList.add('hidden');
            if(cwlBonusCalculatorView) cwlBonusCalculatorView.classList.remove('hidden');
            if(cwlBonusResultsView) cwlBonusResultsView.classList.add('hidden');
            
            if (targetId === 'page-lab' && !labDataLoaded) {
                fetchPlayerDataForLab();
            }
            // KORREKTUR: Der Rechner wird nicht mehr hier initialisiert, sondern nur noch einmal am Ende.
        });
    });
    
    // ... Event Listener für Buttons ...
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
    if(bonusRechnerBackButton) bonusRechnerBackButton.addEventListener('click', () => {
        cwlBonusResultsView.classList.add('hidden');
    });
    if(warLogAccordion) warLogAccordion.addEventListener('click', () => {
        warLogAccordion.classList.toggle('active');
        warLogContent.style.maxHeight = warLogAccordion.classList.contains('active') ? warLogContent.scrollHeight + "px" : null;
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
    // HILFSFUNKTIONEN
    // ======================================================
    const roleTranslations = { member: 'Mitglied', admin: 'Ältester', coLeader: 'Vize-Anführer', leader: 'Anführer' };
    const warStateTranslations = { notInWar: 'Nicht im Krieg', preparation: 'Vorbereitungstag', inWar: 'Kampftag', warEnded: 'Krieg ist beendet' };
    const warResultTranslations = { win: 'Sieg', lose: 'Niederlage', tie: 'Unentschieden' };
    function formatApiDate(apiDateString) { /* ... Unverändert ... */ }

    // ======================================================
    // DATEN-ABRUF FUNKTIONEN (vereinfacht)
    // ======================================================
    async function fetchClanInfo() { /* ... Unverändert ... */ }
    async function fetchWarlog() { /* ... Unverändert ... */ }
    async function fetchCapitalRaids() { /* ... Unverändert ... */ }
    async function initializeWarCenter() { /* ... Unverändert ... */ }
    async function fetchPlayerDataForLab() { /* ... Unverändert ... */ }
    
    // ... Alle RENDER-FUNKTIONEN (außer CWL) bleiben unverändert ...
    function renderClanInfo(data) { /* ... Unverändert ... */ }
    function renderMemberList(members) { /* ... Unverändert ... */ }
    function addMemberClickEvents() { /* ... Unverändert ... */ }
    function renderPlayerProfile(player) { /* ... Unverändert ... */ }
    function renderWarlog(wars) { /* ... Unverändert ... */ }
    function renderCapitalRaids(raids) { /* ... Unverändert ... */ }
    function renderCapitalChart(raids) { /* ... Unverändert ... */ }
    function renderCurrentWarDashboard(war) { /* ... Unverändert ... */ }
    function renderDetailedWarView(war) { /* ... Unverändert ... */ }
    function generateAndRenderWarPlan(warData) { /* ... Unverändert ... */ }
    function renderDonationStats(members) { /* ... Unverändert ... */ }
    function renderThDistributionChart(members) { /* ... Unverändert ... */ }
    function renderLeagueDistributionChart(members) { /* ... Unverändert ... */ }
    function renderHeroTable(allPlayersData) { /* ... Unverändert ... */ }


    // ======================================================
    // CWL BONUS RECHNER V2.1 - MANUELLE LOGIK (KORRIGIERT)
    // ======================================================
    function setupManualBonusCalculator() {
        const addPlayerBtn = document.getElementById('add-player-btn');
        const calculateBtn = document.getElementById('calculate-bonus-btn');
        // KORREKTUR: Die ID des "Zurücksetzen"-Buttons wurde korrigiert
        const clearAllBtn = document.getElementById('clear-all-btn');
        const accordionContainer = document.getElementById('player-accordion-container');

        if (!addPlayerBtn || !calculateBtn || !accordionContainer || !clearAllBtn) {
            console.error("Einige Elemente für den Rechner wurden nicht gefunden. Stelle sicher, dass das HTML korrekt ist.");
            return;
        }

        // --- Event Listener zum Hinzufügen einer neuen SPIELER-SEKTION ---
        addPlayerBtn.onclick = () => {
            const playerNameInput = document.getElementById('new-player-name');
            const playerThInput = document.getElementById('new-player-th');
            const attackCountInput = document.getElementById('new-player-attacks');

            const playerName = playerNameInput.value.trim();
            const playerTh = parseInt(playerThInput.value);
            const attackCount = parseInt(attackCountInput.value);

            if (!playerName || isNaN(playerTh) || isNaN(attackCount) || attackCount < 1 || attackCount > 7) {
                alert("Bitte gib einen gültigen Spielernamen, ein RH-Level und eine Anzahl an Angriffen (1-7) an.");
                return;
            }

            createPlayerSection(playerName, playerTh, attackCount);
            
            // Felder leeren für die nächste Eingabe
            playerNameInput.value = '';
            playerThInput.value = '';
            attackCountInput.value = '';
        };

        // --- Event Listener für die eigentliche Berechnung ---
        calculateBtn.onclick = () => {
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

            const allPlayerSections = accordionContainer.querySelectorAll('.player-section');
            const allAttacks = [];
            
            allPlayerSections.forEach(section => {
                const spieler = section.dataset.playerName;
                const eigenesRH = parseInt(section.dataset.playerTh);
                
                const attackRows = section.querySelectorAll('.attack-row');
                attackRows.forEach(row => {
                    const inputs = row.querySelectorAll('input');
                    const gegnerRH = parseInt(inputs[0].value);
                    const sterne = parseInt(inputs[1].value);
                    const prozent = parseInt(inputs[2].value);

                    if (!isNaN(gegnerRH) && !isNaN(sterne) && !isNaN(prozent)) {
                        allAttacks.push({ spieler, eigenesRH, gegnerRH, sterne, prozent });
                    }
                });
            });

            const result = calculateBonusPoints(allAttacks, pointsConfig);
            renderBonusResults(result);
            if(cwlBonusResultsView) cwlBonusResultsView.classList.remove('hidden');
        };

        // --- Event Listener zum kompletten Zurücksetzen ---
        clearAllBtn.onclick = () => {
            if (confirm("Bist du sicher, dass du alle Spieler und ihre Angriffe löschen möchtest?")) {
                accordionContainer.innerHTML = '';
                cwlBonusResultsView.classList.add('hidden');
            }
        };
    }

    // HILFSFUNKTION: Erstellt eine einklappbare Spieler-Sektion
    function createPlayerSection(name, th, attackCount) {
        const accordionContainer = document.getElementById('player-accordion-container');
        const playerSection = document.createElement('div');
        playerSection.className = 'player-section';
        playerSection.dataset.playerName = name;
        playerSection.dataset.playerTh = th;

        let attacksHtml = '';
        for (let i = 1; i <= attackCount; i++) {
            attacksHtml += `
                <div class="attack-row">
                    <label>Angriff #${i}</label>
                    <input type="number" placeholder="Gegner RH" title="Gegner Rathaus-Level">
                    <input type="number" placeholder="Sterne ⭐" min="0" max="3" title="Sterne">
                    <input type="number" placeholder="Prozent %" min="0" max="100" title="Zerstörung in Prozent">
                </div>
            `;
        }

        playerSection.innerHTML = `
            <div class="player-header">
                <h4>${name} (RH ${th})</h4>
                <div class="toggle-icon">▼</div>
            </div>
            <div class="attacks-wrapper">
                ${attacksHtml}
            </div>
        `;
        
        accordionContainer.appendChild(playerSection);

        // Event Listener für das Ein-/Ausklappen hinzufügen
        playerSection.querySelector('.player-header').addEventListener('click', () => {
            playerSection.classList.toggle('closed');
        });
    }

    // Die Funktion calculateBonusPoints bleibt fast gleich, nimmt jetzt aber die manuellen Daten
    function calculateBonusPoints(allAttacks, points) {
        const playerScores = {};
        allAttacks.forEach(atk => {
            if (!playerScores[atk.spieler]) {
                playerScores[atk.spieler] = { totalPoints: 0, attackCount: 0 };
            }
            playerScores[atk.spieler].attackCount++;
            const rhDiff = atk.gegnerRH - atk.eigenesRH;
            let currentAttackPoints = 0;
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
            currentAttackPoints = ell_pts + atk_pts + bonus_pts;
            playerScores[atk.spieler].totalPoints += currentAttackPoints;
        });
        Object.keys(playerScores).forEach(spieler => {
            if (playerScores[spieler].attackCount === 7) {
                playerScores[spieler].totalPoints += points.bonus_alle_7;
            }
        });
        return Object.entries(playerScores).map(([spieler, data]) => ({ spieler, punkte: data.totalPoints })).sort((a, b) => b.punkte - a.punkte);
    }
    
    // Die Render-Funktionen für die Ergebnisse bleiben auch gleich
    function renderBonusResults(result) { /* ... Unverändert ... */ }
    function renderBonusChart(result) { /* ... Unverändert ... */ }

    // ======================================================
    // STARTPUNKT DER ANWENDUNG
    // ======================================================
    fetchAllData(); 
    setInterval(fetchAllData, POLLING_INTERVAL_MS);
    // KORREKTUR: Der Rechner wird nur noch hier, einmal und zuverlässig, initialisiert.
    setupManualBonusCalculator(); 
});
