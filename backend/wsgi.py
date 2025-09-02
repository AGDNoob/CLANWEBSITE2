import sys

# Pfad zu deinem Backend-Ordner
path = '/home/AGDNoob1/CLANWEBSITE2/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# Importiere deine (jetzt temporäre) app
from app import app as application

