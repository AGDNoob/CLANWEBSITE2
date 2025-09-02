# Dieser Import sorgt dafür, dass die App gefunden wird.
from app import app

# Diese Zeile ist wichtig, damit die App korrekt gestartet werden kann.
if __name__ == "__main__":
    app.run()