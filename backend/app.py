import os
from flask import Flask, jsonify
import requests
from flask_cors import CORS

# --- Konfiguration ---
# Der API-Key wird jetzt sicher aus den Umgebungsvariablen des Servers geladen
COC_API_KEY = os.environ.get('COC_API_KEY')
CLAN_TAG = "#2GJY8YPUP"

# --- Flask-App initialisieren ---
app = Flask(__name__)
CORS(app)

# --- Hilfsfunktion für CLAN-API-Anfragen ---
def make_clan_api_request(endpoint):
    """Macht eine Anfrage an einen Clan-spezifischen Endpunkt der CoC API."""
    if not COC_API_KEY:
        return jsonify({"error": "API Key nicht auf dem Server konfiguriert."}), 500
        
    formatted_clan_tag = CLAN_TAG.replace('#', '%23')
    coc_api_url = f"https://api.clashofclans.com/v1/clans/{formatted_clan_tag}{endpoint}"
    headers = { 'Authorization': f'Bearer {COC_API_KEY}' }
    
    try:
        response = requests.get(coc_api_url, headers=headers)
        if response.status_code == 200:
            return jsonify(response.json()), 200
        else:
            if response.status_code == 404:
                 return jsonify({"reason": "notFound"}), 404
            error_message = { "error": "API Fehler", "status_code": response.status_code, "response_text": response.text }
            return jsonify(error_message), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({ "error": "Netzwerkfehler", "details": str(e) }), 500

# --- API-Routen ---
@app.route('/api/clan/info')
def get_clan_info():
    return make_clan_api_request('')

@app.route('/api/clan/warlog')
def get_clan_warlog():
    return make_clan_api_request('/warlog')

@app.route('/api/clan/currentwar')
def get_clan_currentwar():
    return make_clan_api_request('/currentwar')

@app.route('/api/clan/capitalraidseasons')
def get_clan_capitalraids():
    return make_clan_api_request('/capitalraidseasons')

@app.route('/api/clan/cwl')
def get_clan_cwl_group():
    return make_clan_api_request('/currentwar/leaguegroup')

@app.route('/api/cwl/war/<war_tag>')
def get_cwl_war_info(war_tag):
    """Holt die Daten für einen spezifischen CWL-Krieg anhand des War-Tags."""
    if not COC_API_KEY:
        return jsonify({"error": "API Key nicht auf dem Server konfiguriert."}), 500
        
    formatted_war_tag = war_tag.replace('#', '%23')
    coc_api_url = f"https://api.clashofclans.com/v1/clanwarleagues/wars/{formatted_war_tag}"
    headers = { 'Authorization': f'Bearer {COC_API_KEY}' }
    
    try:
        response = requests.get(coc_api_url, headers=headers)
        if response.status_code == 200:
            return jsonify(response.json()), 200
        else:
            error_message = { "error": "API Fehler", "status_code": response.status_code, "response_text": response.text }
            return jsonify(error_message), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({ "error": "Netzwerkfehler", "details": str(e) }), 500