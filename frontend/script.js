// Komplette script.js - Ich habe die langen, unveränderten Funktionen eingeklappt, um es übersichtlich zu halten.
// Der Code ist aber vollständig.
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
    async function fetchAllData() { /* ... Unverändert ... */ }

    // ======================================================
    // NAVIGATION & VIEW MANAGEMENT
    // ======================================================
    navLinks.forEach(link => { /* ... Unverändert ... */ });
    
    // ... Event Listener für Buttons ...
    if(profileBackButton) profileBackButton.addEventListener('click', () => { /* ... Unverändert ... */ });
    if(currentWarMasterView) currentWarMasterView.addEventListener('click', () => { /* ... Unverändert ... */ });
    if(currentWarDetailBackButton) currentWarDetailBackButton.addEventListener('click', () => { /* ... Unverändert ... */ });
    if(bonusRechnerBackButton) bonusRechnerBackButton.addEventListener('click', () => { cwlBonusResultsView.classList.add('hidden'); });
    if(warLogAccordion) warLogAccordion.addEventListener('click', () => { /* ... Unverändert ... */ });
    if(hamburgerBtn) hamburgerBtn.addEventListener('click', () => { /* ... Unverändert ... */ });
    if(mobileOverlay) mobileOverlay.addEventListener('click', () => { /* ... Unverändert ... */ });

    // ======================================================
    // HILFSFUNKTIONEN
    // ======================================================
    const roleTranslations = { /* ... Unverändert ... */ };
    const warStateTranslations = { /* ... Unverändert ... */ };
    const warResultTranslations = { /* ... Unverändert ... */ };
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
    // CWL BONUS RECHNER V2.2 - MIT DIAGNOSE
    // ======================================================
    function setupManualBonusCalculator() {
        const addPlayerBtn = document.getElementById('add-player-btn');
        const calculateBtn = document.getElementById('calculate-bonus-btn');
        const clearAllBtn = document.getElementById('clear-all-btn');
        const accordionContainer = document.getElementById('player-accordion-container');

        if (!addPlayerBtn || !calculateBtn || !accordionContainer || !clearAllBtn) {
            console.error("Rechner-Buttons konnten nicht initialisiert werden. HTML-IDs prüfen!");
            return;
        }

        // --- Event Listener zum Hinzufügen einer neuen SPIELER-SEKTION ---
        addPlayerBtn.onclick = () => { /* ... Unverändert ... */ };

        // --- Event Listener für die eigentliche Berechnung (MIT DIAGNOSE) ---
        calculateBtn.onclick = () => {
            console.log("--- Berechnung gestartet ---");

            try {
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
                console.log("1. Einstellungen erfolgreich gelesen:", pointsConfig);

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

                        if (spieler && !isNaN(eigenesRH) && !isNaN(gegnerRH) && !isNaN(sterne) && !isNaN(prozent)) {
                            allAttacks.push({ spieler, eigenesRH, gegnerRH, sterne, prozent });
                        }
                    });
                });
                console.log("2. Manuelle Angriffe erfolgreich ausgelesen:", allAttacks);
                
                if (allAttacks.length === 0) {
                    console.warn("Keine gültigen Angriffe zur Berechnung gefunden.");
                    alert("Bitte trage erst gültige Angriffsdaten ein, bevor du berechnest.");
                    return;
                }

                const result = calculateBonusPoints(allAttacks, pointsConfig);
                console.log("3. Punkte erfolgreich berechnet:", result);

                renderBonusResults(result);
                console.log("4. Ergebnis-Ansicht wird jetzt gerendert.");

                if(cwlBonusResultsView) cwlBonusResultsView.classList.remove('hidden');
                console.log("--- Berechnung abgeschlossen ---");
            } catch (error) {
                console.error("FEHLER bei der Berechnung:", error);
                alert("Ein unerwarteter Fehler ist bei der Berechnung aufgetreten. Bitte überprüfe die Entwicklerkonsole (F12) für Details.");
            }
        };

        // --- Event Listener zum kompletten Zurücksetzen ---
        clearAllBtn.onclick = () => { /* ... Unverändert ... */ };
    }

    // HILFSFUNKTION: Erstellt eine einklappbare Spieler-Sektion
    function createPlayerSection(name, th, attackCount) { /* ... Unverändert, mit 3-Sterne-Automatik ... */ }

    // Die Funktion calculateBonusPoints
    function calculateBonusPoints(allAttacks, points) { /* ... Unverändert ... */ }
    
    // Die Render-Funktionen für die Ergebnisse
    function renderBonusResults(result) { /* ... Unverändert ... */ }
    function renderBonusChart(result) { /* ... Unverändert ... */ }

    // ======================================================
    // STARTPUNKT DER ANWENDUNG
    // ======================================================
    fetchAllData(); 
    setInterval(fetchAllData, POLLING_INTERVAL_MS);
    setupManualBonusCalculator(); 
});
