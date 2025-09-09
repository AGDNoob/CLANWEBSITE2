// main.js – Init, Navigation, Polling, War-Center, Lab, CWL
const POLLING_INTERVAL_MS = 60000;
let currentMemberList = [];
let labDataLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
  setupNavigationAndUI();
  setupManualBonusCalculator();
  fetchAllData();
  setInterval(fetchAllData, POLLING_INTERVAL_MS);
});

async function fetchAllData() {
  // Clan info
  const clan = await fetchClanInfo();
  if (clan) {
    currentMemberList = clan.memberList || [];
    renderClanInfo(clan);
    renderMemberList(currentMemberList);
    renderDonationStats(currentMemberList);
    renderThDistributionChart(currentMemberList);
    renderLeagueDistributionChart(currentMemberList);
  }

  // War center
  await initializeWarCenter();

  // Hauptstadt
  const raids = await fetchCapitalRaids();
  if (raids?.items) renderCapitalRaids(raids.items);

  // Warlog
  const log = await fetchWarlog();
  if (log?.items) renderWarlog(log.items);

  // CWL (NEU)
  await fetchCwlData();
}

/* -------- CWL Daten laden -------- */
async function fetchCwlData() {
  try {
    const data = await fetchJson('/api/cwl/leaguegroup');
    if (!data || !data.rounds) {
      const summary = document.getElementById('cwl-summary');
      if (summary) summary.textContent = 'Keine CWL-Daten verfügbar.';
      return;
    }
    renderCwlSummary(data);
    renderCwlRounds(data);
    renderCwlPlayerStats(data);
    initCwlBonus(data); // Bonusrechner mit Whitelist
  } catch (err) {
    console.error('Fehler beim Laden der CWL:', err);
  }
}

/* -------- Navigation & UI -------- */
function setupNavigationAndUI() {
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = document.querySelectorAll('.page');
  const clanInfoMasterView = document.getElementById('clan-info-master-view');
  const playerProfileView = document.getElementById('player-profile-view');
  const profileBackButton = document.getElementById('profile-back-button');
  const currentWarMasterView = document.getElementById('current-war-master-view');
  const currentWarDetailView = document.getElementById('current-war-detail-view');
  const currentWarDetailBackButton = document.getElementById('current-war-detail-back-button');
  const warLogAccordion = document.getElementById('warlog-accordion');
  const warLogContent = document.getElementById('warlog-accordion-content');
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const sidebar = document.querySelector('.sidebar');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const cwlBonusCalculatorView = document.getElementById('cwl-bonus-calculator-view');
  const cwlBonusResultsView = document.getElementById('cwl-bonus-results-view');
  const bonusRechnerBackButton = document.getElementById('bonus-rechner-back-button');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      pages.forEach(p => p.classList.remove('active'));
      navLinks.forEach(l => l.classList.remove('active'));
      document.getElementById(targetId)?.classList.add('active');
      link.classList.add('active');

      // reset subviews
      clanInfoMasterView?.classList.remove('hidden');
      playerProfileView?.classList.add('hidden');
      currentWarMasterView?.classList.remove('hidden');
      currentWarDetailView?.classList.add('hidden');
      cwlBonusCalculatorView?.classList.remove('hidden');
      cwlBonusResultsView?.classList.add('hidden');

      // close mobile nav
      if (sidebar && mobileOverlay) { sidebar.classList.remove('open'); mobileOverlay.classList.remove('open'); }

      // lazy-load lab
      if (targetId === 'page-lab' && !labDataLoaded) {
        fetchPlayerDataForLab();
      }
    });
  });

  profileBackButton?.addEventListener('click', () => {
    playerProfileView?.classList.add('hidden');
    clanInfoMasterView?.classList.remove('hidden');
  });
  currentWarMasterView?.addEventListener('click', () => {
    currentWarMasterView?.classList.add('hidden');
    currentWarDetailView?.classList.remove('hidden');
  });
  currentWarDetailBackButton?.addEventListener('click', () => {
    currentWarDetailView?.classList.add('hidden');
    currentWarMasterView?.classList.remove('hidden');
  });
  bonusRechnerBackButton?.addEventListener('click', () => {
    cwlBonusResultsView?.classList.add('hidden');
  });
  warLogAccordion?.addEventListener('click', () => {
    warLogAccordion.classList.toggle('active');
    warLogContent.style.maxHeight = warLogAccordion.classList.contains('active') ? `${warLogContent.scrollHeight}px` : null;
  });
  hamburgerBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    mobileOverlay?.classList.toggle('open');
  });
  mobileOverlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    mobileOverlay?.classList.remove('open');
  });
}

/* -------- War Center Init (mit „Kein Krieg“-Placeholder) -------- */
async function initializeWarCenter() {
  const warCenterPage = document.getElementById('page-war-center');
  const notInWarMessage = document.getElementById('not-in-war-message');
  const dashboard = document.getElementById('current-war-dashboard');
  const warPlan = document.getElementById('war-plan-container');

  if (!warCenterPage || !notInWarMessage || !dashboard || !warPlan) return;

  // Standard-Leeren (um „alte“ Inhalte zu vermeiden)
  dashboard.innerHTML = '';
  warPlan.innerHTML = '';

  try {
    const response = await fetch(`${API_BASE_URL}/api/clan/currentwar`);
    if (response.status === 404) {
      applyNotInWarState(warCenterPage, notInWarMessage, dashboard, warPlan);
      return;
    }

    if (!response.ok) {
      throw new Error(`Serverfehler: ${response.status}`);
    }

    const warData = await response.json();
    if (!warData || warData.state === 'notInWar' || !warData?.clan) {
      applyNotInWarState(warCenterPage, notInWarMessage, dashboard, warPlan);
      return;
    }

    warCenterPage.classList.add('in-war');
    warCenterPage.classList.remove('not-in-war');
    notInWarMessage.textContent = "";
    notInWarMessage.classList.add('hidden');
    renderCurrentWarDashboard(warData);
    renderDetailedWarView(warData);
    generateAndRenderWarPlan(warData);

  } catch (e) {
    console.error("Fehler beim Abrufen des aktuellen Kriegs:", e);
    warCenterPage.classList.add('not-in-war');
    warCenterPage.classList.remove('in-war');
    notInWarMessage.textContent = "Fehler: Kriegsdaten konnten nicht geladen werden.";
    dashboard.innerHTML = "";
    warPlan.innerHTML = `
      <div class="placeholder">
        <div class="emoji">❗</div>
        <div>
          <div class="title">Kriegsdaten derzeit nicht verfügbar</div>
          <div class="hint">Bitte später erneut versuchen.</div>
        </div>
      </div>`;
  }
}

function applyNotInWarState(warCenterPage, notInWarMessage, dashboard, warPlan) {
  warCenterPage.classList.add('not-in-war');
  warCenterPage.classList.remove('in-war');
  notInWarMessage.textContent = "Wir sind aktuell in keinem Clankrieg.";
  notInWarMessage.classList.remove('hidden');
  dashboard.innerHTML = "";
  warPlan.innerHTML = `
    <div class="placeholder">
      <div class="emoji">🛡️</div>
      <div>
        <div class="title">Kein aktiver Krieg</div>
        <div class="hint">Der KI-Planer aktiviert sich automatisch, sobald der nächste Krieg startet.</div>
      </div>
    </div>`;
}

/* -------- Lab -------- */
async function fetchPlayerDataForLab() {
  const loadingContainer = document.getElementById('lab-loading-state');
  const contentContainer = document.getElementById('lab-content-container');
  if (!loadingContainer || !contentContainer) return;

  labDataLoaded = true;
  loadingContainer.classList.remove('hidden');
  contentContainer.classList.add('hidden');

  try {
    if (!currentMemberList?.length) {
      const clan = await fetchClanInfo();
      currentMemberList = clan?.memberList || [];
    }

    loadingContainer.innerHTML = '<div class="spinner"></div><p>Lade Spielerdaten...</p>';
    const loadingText = loadingContainer.querySelector('p');
    const all = [];
    const total = currentMemberList.length;
    let loaded = 0;

    for (const member of currentMemberList) {
      loaded++;
      if (loadingText) loadingText.textContent = `Lade Spielerdaten... (${loaded}/${total})`;
      try {
        const playerData = await fetchPlayer(member.tag);
        if (playerData) all.push(playerData);
      } catch (err) {
        console.error(`Fehler bei ${member.name} (${member.tag}):`, err);
      }
      await new Promise(r => setTimeout(r, 100));
    }

    renderHeroTable(all);
    loadingContainer.classList.add('hidden');
    contentContainer.classList.remove('hidden');

  } catch (error) {
    console.error("Fehler beim Abrufen der Spielerdaten für das Labor:", error);
    loadingContainer.innerHTML = `<p class="error-message">Einige Spielerdaten konnten nicht geladen werden. <button id="retry-lab">Erneut versuchen</button></p>`;
    document.getElementById('retry-lab')?.addEventListener('click', () => { labDataLoaded = false; fetchPlayerDataForLab(); });
  }
}

// global
window.fetchAllData = fetchAllData;
