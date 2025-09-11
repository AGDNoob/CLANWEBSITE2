// main.js – Init, Navigation, Polling, War-Center, Lab, CWL
const POLLING_INTERVAL_MS = 60000;
let currentMemberList = [];
let labDataLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
  setupNavigationAndUI();
  setupManualBonusCalculator();
  setupPlayerModal();
  fetchAllData();
  setInterval(fetchAllData, POLLING_INTERVAL_MS);
});

async function fetchAllData() {
  // --- Clan Info sofort laden ---
  fetchClanInfo().then(clan => {
    if (clan) {
      currentMemberList = clan.memberList || [];
      renderClanInfo(clan);
      renderMemberList(currentMemberList);
      renderDonationStats(currentMemberList);
      renderThDistributionChart(currentMemberList);
      renderLeagueDistributionChart(currentMemberList);

      // Clan-Karte direkt updaten
      renderDashboardSummary({ clan });
    }
  });

  // --- CWL parallel ---
  fetchCwlLeagueGroup().then(cwl => {
    if (cwl) {
      renderCwlSummary(cwl);
      renderDashboardSummary({ cwl });

      // Runden + Bonus laden
      fetchCwlSummary().then(rounds => {
        if (rounds) {
          renderCwlRounds(rounds);
          renderCwlPlayerStats(rounds);
          initCwlBonus(cwl);
        }
      });
    }
  });

  // --- Hauptstadt parallel ---
  fetchCapitalRaids().then(raids => {
    if (raids?.items) {
      renderCapitalRaids(raids.items);
      renderCapitalContributors(raids);
      renderDashboardSummary({ raids: raids.items });
    }
  });

  // --- Krieg parallel ---
  fetchCurrentWar().then(currentWar => {
    if (currentWar && currentWar.state !== "notInWar") {
      renderCurrentWarDashboard(currentWar);
      renderDetailedWarView(currentWar);
      generateAndRenderWarPlan(currentWar);
      renderDashboardSummary({ war: currentWar });
    } else {
      // Fallback: letzten Krieg aus Warlog ziehen
      fetchWarlog().then(log => {
        if (log?.items?.length) {
          renderWarlog(log.items);
          renderDashboardSummary({ war: log.items[0] });
        }
      });
    }
  }).catch(err => {
    console.error("Fehler beim Abrufen des Kriegs:", err);
  });
}

/* -------- Player Modal -------- */
function openPlayerModal() {
  document.getElementById("player-modal")?.classList.remove("hidden");
}
function closePlayerModal() {
  document.getElementById("player-modal")?.classList.add("hidden");
}
function setupPlayerModal() {
  const closeBtn = document.getElementById("modal-close");
  const modal = document.getElementById("player-modal");
  if (closeBtn) {
    closeBtn.addEventListener("click", closePlayerModal);
  }
  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target === modal) closePlayerModal();
    });
  }
}

// 🆕 Spielerprofil aus Backend laden + ins Modal rendern
async function fetchPlayerProfile(tag) {
  try {
    const cleanTag = String(tag).replace(/^#/, ""); // führendes # weg
    const url = `${API_BASE_URL}/api/player/${cleanTag}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Player fetch failed", res.status, url);
      throw new Error(`Fehler beim Laden des Profils (HTTP ${res.status})`);
    }
    const player = await res.json();
    renderPlayerProfile(player); // Modal-Content
  } catch (err) {
    console.error("Fehler beim Laden des Spielerprofils:", err);
  }
}

/* -------- Navigation & UI -------- */
function setupNavigationAndUI() {
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = document.querySelectorAll('.page');
  const warLogAccordion = document.getElementById('warlog-accordion');
  const warLogContent = document.getElementById('warlog-accordion-content');
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const sidebar = document.querySelector('.sidebar');
  const mobileOverlay = document.getElementById('mobile-overlay');
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

  // Zurück-Button Bonus Rechner
  bonusRechnerBackButton?.addEventListener('click', () => {
    cwlBonusResultsView?.classList.add('hidden');
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

    if (!response.ok) throw new Error(`Serverfehler: ${response.status}`);

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
