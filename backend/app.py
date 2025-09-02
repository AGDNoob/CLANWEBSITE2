import os
from flask import Flask, jsonify
from flask_cors import CORS
import requests

# ============================================================================
# KONFIGURATION
# ============================================================================

app = Flask(__name__)
CORS(app) # Erlaubt Anfragen von deinem Frontend

# Dein API-Key und Clan-Tag werden sicher als Umgebungsvariablen geladen.
# Auf PythonAnywhere trägst du diese im "Web"-Tab unter "Environment variables" ein.
COC_API_KEY = os.environ.get('COC_API_KEY')
CLAN_TAG = os.environ.get('CLAN_TAG', '#2GJY8YPUP') # Standardwert, falls nicht gesetzt

# Die offizielle, direkte API-URL. Kein Proxy mehr!
BASE_URL = "https://api.clashofclans.com/v1"


# ============================================================================
# HILFSFUNKTION FÜR ALLE API-ANFRAGEN
# ============================================================================

def make_coc_api_request(endpoint):
    """
    Macht eine saubere, direkte Anfrage an die CoC API.
    Handhabt die Autorisierung und gibt Fehler verständlich zurück.
    """
    if not COC_API_KEY:
        return jsonify({"error": "API Key nicht konfiguriert auf dem Server."}), 500

    url = f"{BASE_URL}{endpoint}"
    headers = {
        'Authorization': f'Bearer {COC_API_KEY}'
    }
    
    print(f"Sende Anfrage an: {url}") # Nützliches Logging für die Server-Logs

    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        # Wirft einen Fehler, falls die API einen Fehlercode (4xx oder 5xx) sendet.
        response.raise_for_status() 
        
        return jsonify(response.json()), 200

    except requests.exceptions.HTTPError as http_err:
        # Gibt den genauen Fehler der CoC-API zurück (z.B. "Invalid clan tag")
        print(f"HTTP Fehler: {http_err} - {response.text}")
        return jsonify(error=f"API Fehler: {response.status_code}", message=response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        # Fängt Netzwerkfehler ab (z.B. keine Verbindung)
        print(f"Netzwerkfehler: {e}")
        return jsonify({"error": "Netzwerkfehler zur CoC API.", "details": str(e)}), 503

# ============================================================================
# API-ROUTEN (DEINE ENDPUNKTE)
# ============================================================================

# --- CLAN-DATEN ---
@app.route('/api/clan/info')
def get_clan_info():
    return make_coc_api_request(f"/clans/{CLAN_TAG.replace('#', '%23')}")

@app.route('/api/clan/warlog')
def get_clan_warlog():
    return make_coc_api_request(f"/clans/{CLAN_TAG.replace('#', '%23')}/warlog")

@app.route('/api/clan/capitalraidseasons')
def get_clan_capitalraids():
    return make_coc_api_request(f"/clans/{CLAN_TAG.replace('#', '%23')}/capitalraidseasons")

# --- KRIEG & CWL ---
@app.route('/api/clan/currentwar')
def get_clan_currentwar():
    return make_coc_api_request(f"/clans/{CLAN_TAG.replace('#', '%23')}/currentwar")

@app.route('/api/clan/cwl/group')
def get_cwl_group():
    return make_coc_api_request(f"/clans/{CLAN_TAG.replace('#', '%23')}/currentwar/leaguegroup")

@app.route('/api/clan/cwl/war/<war_tag>')
def get_cwl_war(war_tag):
    # Wichtig: Wir stellen sicher, dass der Tag für die URL korrekt formatiert ist.
    return make_coc_api_request(f"/clanwarleagues/wars/{war_tag.replace('#', '%23')}")

# --- SPIELER-DATEN (DER WICHTIGSTE ENDPUNKT!) ---
@app.route('/api/player/<player_tag>')
def get_player_info(player_tag):
    """
    Holt die VOLLSTÄNDIGEN Daten für einen Spieler, inklusive Helden,
    Haustiere, Truppen, Erfolge etc.
    Damit kannst du dir jeden Account im Detail ansehen.
    """
    return make_coc_api_request(f"/players/{player_tag.replace('#', '%23')}")

# ============================================================================
# STARTPUNKT FÜR LOKALES TESTEN (optional)
# ============================================================================
if __name__ == '__main__':
    # Damit du das Skript auch auf deinem PC testen kannst,
    # könntest du den Key hier temporär direkt eintragen.
    # os.environ['COC_API_KEY'] = "DEIN_LOKALER_TEST_KEY"
    app.run(debug=True)