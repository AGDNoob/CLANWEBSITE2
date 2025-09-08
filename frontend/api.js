// api.js – nur Fetch Funktionen
const API_BASE_URL = 'https://agdnoob1.pythonanywhere.com';

// Hilfsfunktion für alle Requests
async function fetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("❌ Fetch Error:", url, err);
    return null;
  }
}

// Endpoints
async function fetchClanInfo() {
  return fetchJson(`${API_BASE_URL}/api/clan/info`);
}

async function fetchWarlog() {
  return fetchJson(`${API_BASE_URL}/api/clan/warlog`);
}

async function fetchCapitalRaids() {
  return fetchJson(`${API_BASE_URL}/api/clan/capitalraidseasons`);
}

async function fetchCurrentWar() {
  return fetchJson(`${API_BASE_URL}/api/clan/currentwar`);
}

async function fetchPlayer(tag) {
  return fetchJson(`${API_BASE_URL}/api/player/${tag.replace('#', '')}`);
}
