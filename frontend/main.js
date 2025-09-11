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
  let clan = null, raids = null, currentWar = null, lastWar = null, cwl = null;

  // Clan info
  clan = await fetchClanInfo();
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
  raids = await fetchCapitalRaids();
  if (raids?.items) renderCapitalRaids(raids.items);
  renderCapitalContributors(raids);

  // Warlog (für Fallback + Historie)
  const log = await fetchWarlog();
  if (log?.items) {
    renderWarlog(log.items);
    lastWar = log.items[0]; // letzter Krieg
  }

  // Aktueller Krieg für Home
  try {
    currentWar = await fetchCurrentWar();
  } catch (err) {
    console.error("Fehler beim Abrufen des aktuellen Kriegs:", err);
  }

  // CWL
  try {
    cwl = await fetchCwlLeagueGroup();
    if (cwl) renderCwlSummary(cwl);

    const rounds = await fetchCwlSummary();
    if (rounds) {
      renderCwlRounds(rounds);
      renderCwlPlayerStats(rounds);
      initCwlBonus(cwl);
    }
  } catch (err) {
    console.error("Fehler beim Laden der CWL:", err);
  }

  // 🆕 Home Dashboard befüllen
  const warForHome = (currentWar && currentWar.state !== "notInWar") ? currentWar : lastWar;
  renderDashboardSummary(clan, warForHome, raids?.items, cwl);
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

  // Navigation über Sidebar
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
      currentWarMasterView?.classList?.remove('hidden');
      currentWarDetailView?.classList?.add('hidden');
      cwlBonusCalculatorView?.classList?.remove('hidden');
      cwlBonusResultsView?.classList?.add('hidden');

      // close mobile nav
      if (sidebar && mobileOverlay) { 
        sidebar.classList.remove('open'); 
        mobileOverlay.classList.remove('open'); 
      }

      // lazy-load lab
      if (targetId === 'page-heroes' && !labDataLoaded) {
        fetchPlayerDataForLab();
      }
    });
  });

  // Zurück-Buttons
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

  // Accordion
  warLogAccordion?.addEventListener('click', () => {
    warLogAccordion.classList.toggle('active');
    warLogContent.style.maxHeight = warLogAccordion.classList.contains('active') 
      ? `${warLogContent.scrollHeight}px` 
      : null;
  });
  // Accordion öffnen/schließen
document.querySelectorAll(".accordion-header").forEach(header => {
  header.addEventListener("click", () => {
    const acc = header.parentElement;
    acc.classList.toggle("open");
  });
});


  // Mobile Sidebar
  hamburgerBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    mobileOverlay?.classList.toggle('open');
  });
  mobileOverlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    mobileOverlay?.classList.remove('open');
  });

  // 🆕 Dashboard-Karten klickbar machen
  document.querySelectorAll('.dash-link').forEach(card => {
    card.style.cursor = "pointer";
    card.addEventListener('click', () => {
      const targetId = card.getAttribute('data-target');
      if (targetId) {
        pages.forEach(p => p.classList.remove('active'));
        navLinks.forEach(l => l.classList.remove('active'));
        document.getElementById(targetId)?.classList.add('active');
        document.querySelector(`.nav-link[data-target="${targetId}"]`)?.classList.add('active');
      }
    });
  });
}

/* -------- War Center Init -------- */
async function initializeWarCenter() {
  const warCenterPage = document.getElementById('page-war-center');
  const notInWarMessage = document.getElementById('not-in-war-message');
  const dashboard = document.getElementById('current-war-dashboard');
  const warPlan = document.getElementById('war-plan-container');

  if (!warCenterPage || !notInWarMessage || !dashboard || !warPlan) return;

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
    applyNotInWarState(warCenterPage, notInWarMessage, dashboard, warPlan, true);
  }
}

function applyNotInWarState(warCenterPage, notInWarMessage, dashboard, warPlan, isError = false) {
  warCenterPage.classList.add('not-in-war');
  warCenterPage.classList.remove('in-war');
  notInWarMessage.textContent = isError ? 
    "Fehler: Kriegsdaten konnten nicht geladen werden." :
    "Wir sind aktuell in keinem Clankrieg.";
  notInWarMessage.classList.remove('hidden');
  dashboard.innerHTML = "";
  warPlan.innerHTML = `
    <div class="placeholder">
      <div class="emoji">${isError ? "❗" : "🛡️"}</div>
      <div>
        <div class="title">${isError ? "Kriegsdaten derzeit nicht verfügbar" : "Kein aktiver Krieg"}</div>
        <div class="hint">${isError ? "Bitte später erneut versuchen." : "Der KI-Planer aktiviert sich automatisch, sobald der nächste Krieg startet."}</div>
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

    renderHeroCards(all);
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
