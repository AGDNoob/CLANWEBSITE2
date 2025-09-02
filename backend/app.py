from flask import Flask
import requests

# Erstelle eine minimale Flask-App
app = Flask(__name__)

@app.route('/')
def get_my_ip():
    """
    Diese Funktion wird aufgerufen, wenn du deine Website besuchst.
    Sie fragt einen externen Dienst, welche IP-Adresse sie hat, und zeigt sie an.
    """
    try:
        # Wir fragen einen öffentlichen Dienst "Wie lautet meine IP?"
        response = requests.get('https://api.ipify.org')
        response.raise_for_status()  # Wirft einen Fehler, falls etwas schiefgeht
        
        ip_address = response.text
        
        # Zeige die gefundene IP-Adresse groß auf der Webseite an
        return f"""
            <html>
                <head><title>IP Finder</title></head>
                <body style="font-family: sans-serif; text-align: center; margin-top: 5rem;">
                    <h1>Deine feste IP-Adresse lautet:</h1>
                    <h2 style="color: green; font-size: 2rem;">{ip_address}</h2>
                    <p>Genau diese IP-Adresse musst du für deinen CoC-API-Key verwenden.</p>
                </body>
            </html>
        """
    except requests.exceptions.RequestException as e:
        return f"<h1>Fehler beim Abrufen der IP-Adresse: {e}</h1>"
