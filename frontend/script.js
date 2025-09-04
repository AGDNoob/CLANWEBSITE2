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
    // DATEN-ABRUF FUNKTIONEN (vereinfacht)
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
        } catch (error) { console.error("Fehler bei Clan-Infos:", error); }
    }
    async function fetchWarlog() { /* ... unverändert ... */ }
    async function fetchCapitalRaids() { /* ... unverändert ... */ }
    async function initializeWarCenter() { /* ... unverändert ... */ }
    async function fetchPlayerDataForLab() { /* ... unverändert ... */ }
    
    // ... Alle RENDER-FUNKTIONEN (außer CWL) bleiben unverändert ...

    // ======================================================
    // CWL BONUS RECHNER V2.0 - MANUELLE LOGIK
    // ======================================================
    function setupManualBonusCalculator() {
        const addPlayerBtn = document.getElementById('add-player-btn');
        const calculateBtn = document.getElementById('calculate-bonus-btn');
        const clearAllBtn = document.getElementById('clear-all-btn');
        const accordionContainer = document.getElementById('player-accordion-container');

        if (!addPlayerBtn || !calculateBtn || !accordionContainer || !clearAllBtn) {
            console.error("Einige Elemente für den Rechner wurden nicht gefunden.");
            return;
        }

        // --- Event Listener zum Hinzufügen einer neuen SPIELER-SEKTION ---
        addPlayerBtn.onclick = () => {
            const playerName = document.getElementById('new-player-name').value.trim();
            const playerTh = parseInt(document.getElementById('new-player-th').value);
            const attackCount = parseInt(document.getElementById('new-player-attacks').value);

            if (!playerName || isNaN(playerTh) || isNaN(attackCount) || attackCount < 1) {
                alert("Bitte gib einen gültigen Spielernamen, ein RH-Level und eine Anzahl an Angriffen an.");
                return;
            }

            createPlayerSection(playerName, playerTh, attackCount);
            
            // Felder leeren für die nächste Eingabe
            document.getElementById('new-player-name').value = '';
            document.getElementById('new-player-th').value = '';
            document.getElementById('new-player-attacks').value = '';
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
    function calculateBonusPoints(allAttacks, points) { /* ... unverändert ... */ }
    
    // Die Render-Funktionen für die Ergebnisse bleiben auch gleich
    function renderBonusResults(result) { /* ... unverändert ... */ }
    function renderBonusChart(result) { /* ... unverändert ... */ }

    // ======================================================
    // STARTPUNKT DER ANWENDUNG
    // ======================================================
    fetchAllData(); 
    setInterval(fetchAllData, POLLING_INTERVAL_MS);
    setupManualBonusCalculator(); // Den Rechner einmalig initialisieren
});
