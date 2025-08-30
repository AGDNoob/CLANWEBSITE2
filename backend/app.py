import os
from flask import Flask, jsonify
from flask_cors import CORS
import requests

# --- Konfiguration ---
# Für lokales Testen (hier deinen Key eintragen, wenn du lokal testest):
# COC_API_KEY = "DEIN_API_KEY_HIER" 

# Für den Live-Server (Vercel etc.):
COC_API_KEY = os.environ.get('COC_API_KEY')
CLAN_TAG = "#2GJY8YPUP"
# Wir benutzen den offiziellen Proxy von RoyaleAPI, wie du richtig angemerkt hast.
# Das löst das Problem, dass wir eine feste IP-Adresse für die API bräuchten.
PROXY_BASE_URL = "https://cocproxy.royaleapi.dev/v1"

# --- Flask-App initialisieren ---
app = Flask(__name__)
CORS(app)

# --- Hilfsfunktion für API-Anfragen ---
def make_coc_api_request(endpoint):
    """Macht eine Anfrage an einen bestimmten Endpunkt der CoC API über den Proxy."""
    # Der Proxy leitet unsere Anfrage mit einem eigenen, festen IP-Pool weiter.
    # Wir müssen nur unseren eigenen API-Key zur Authentifizierung mitschicken.
    url = f"{PROXY_BASE_URL}{endpoint}"
    headers = {'Authorization': f'Bearer {COC_API_KEY}'}
    
    print(f"Sende Anfrage an: {url}")

    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            return jsonify(response.json()), 200
        else:
            # Gib die Antwort der API direkt weiter, damit das Frontend den Fehler kennt
            return response.text, response.status_code
    except requests.exceptions.RequestException as e:
        network_error = {"error": "Ein Netzwerkfehler ist aufgetreten.", "details": str(e)}
        return jsonify(network_error), 500

# --- API-Routen ---
@app.route('/api/clan/info')
def get_clan_info():
    return make_coc_api_request(f"/clans/{CLAN_TAG.replace('#', '%23')}")

@app.route('/api/clan/warlog')
def get_clan_warlog():
    return make_coc_api_request(f"/clans/{CLAN_TAG.replace('#', '%23')}/warlog")

@app.route('/api/clan/currentwar')
def get_clan_currentwar():
    return make_coc_api_request(f"/clans/{CLAN_TAG.replace('#', '%23')}/currentwar")

@app.route('/api/clan/capitalraidseasons')
def get_clan_capitalraids():
    return make_coc_api_request(f"/clans/{CLAN_TAG.replace('#', '%23')}/capitalraidseasons")

@app.route('/api/clan/cwl')
def get_cwl_group():
    return make_coc_api_request(f"/clans/{CLAN_TAG.replace('#', '%23')}/currentwar/leaguegroup")

@app.route('/api/clan/cwl/war/<war_tag>')
def get_cwl_war(war_tag):
    return make_coc_api_request(f"/clanwarleagues/wars/{war_tag.replace('#', '%23')}")

# +++ Route für den Labor-Spion (KORRIGIERT) +++
@app.route('/api/player/<player_tag>')
def get_player_info(player_tag):
    """Ruft detaillierte Informationen für einen einzelnen Spieler ab."""
    # KORREKTUR: Wir fügen das %23 manuell hinzu, da der Tag vom Frontend ohne # ankommt.
    return make_coc_api_request(f"/players/%23{player_tag}")

# --- Startpunkt für lokales Testen ---
if __name__ == '__main__':
    app.run(debug=True)
