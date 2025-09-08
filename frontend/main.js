// main.js – Init & Polling
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupManualBonusCalculator();
  fetchAllData();
  setInterval(fetchAllData, 60000);
});

async function fetchAllData() {
  const clan = await fetchClanInfo();
  if (clan) {
    renderClanInfo(clan);
    renderMemberList(clan.memberList || []);
    renderDonationStats(clan.memberList || []);
  }

  const war = await fetchCurrentWar();
  if (war) generateAndRenderWarPlan(war);

  const raids = await fetchCapitalRaids();
  if (raids?.items) console.log("Raids loaded", raids.items);

  const log = await fetchWarlog();
  if (log?.items) renderWarlog(log.items);
}

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = document.querySelectorAll('.page');
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.dataset.target;
      pages.forEach(p => p.classList.remove('active'));
      navLinks.forEach(l => l.classList.remove('active'));
      document.getElementById(target)?.classList.add('active');
      link.classList.add('active');
    });
  });
}
