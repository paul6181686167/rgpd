# 🔧 Guide d'Installation Complet

## 📋 Table des Matières

1. [Prérequis Système](#prérequis-système)
2. [Installation Étape par Étape](#installation-étape-par-étape)
3. [Configuration de l'Environnement](#configuration-de-lenvironnement)
4. [Configuration Gmail API](#configuration-gmail-api)
5. [Vérification de l'Installation](#vérification-de-linstallation)
6. [Dépannage](#dépannage)

## 🖥️ Prérequis Système

### Système d'Exploitation
- **Linux** : Ubuntu 20.04+ (recommandé), CentOS 8+, Debian 11+
- **macOS** : macOS 10.15+
- **Windows** : Windows 10+ avec WSL2

### Logiciels Requis

#### Python
```bash
# Vérifier la version de Python
python3 --version  # Doit être 3.8 ou supérieur
```

**Installation Python (Ubuntu/Debian)**
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

**Installation Python (macOS)**
```bash
brew install python3
```

#### Node.js et Yarn
```bash
# Vérifier les versions
node --version   # Doit être 16.0 ou supérieur
yarn --version   # Doit être 1.22 ou supérieur
```

**Installation Node.js (Ubuntu/Debian)**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g yarn
```

**Installation Node.js (macOS)**
```bash
brew install node yarn
```

#### MongoDB
```bash
# Vérifier MongoDB
mongo --version  # Doit être 4.4 ou supérieur
```

**Installation MongoDB (Ubuntu/Debian)**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Installation MongoDB (macOS)**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

## 🚀 Installation Étape par Étape

### 1. Préparation de l'Environnement

#### Créer un répertoire de travail
```bash
mkdir -p ~/unsubscribe-app
cd ~/unsubscribe-app
```

#### Cloner le projet
```bash
git clone [URL_DU_PROJET] .
```

### 2. Configuration du Backend

#### Créer un environnement virtuel Python
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# ou
venv\Scripts\activate     # Windows
```

#### Installer les dépendances
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Créer le fichier .env
```bash
cp .env.example .env
```

**Contenu du fichier .env**
```env
# Configuration MongoDB
MONGO_URL=mongodb://localhost:27017/unsubscribe_app

# Configuration Gmail API
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8001/auth/callback

# Configuration sécurité
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configuration email
EMAIL_RATE_LIMIT=10  # Nombre d'emails par minute
MAX_EMAILS_PER_SCAN=100  # Limite d'emails à analyser
```

### 3. Configuration du Frontend

#### Installer les dépendances
```bash
cd ../frontend
yarn install
```

#### Créer le fichier .env
```bash
cp .env.example .env
```

**Contenu du fichier .env**
```env
# URL du backend
REACT_APP_BACKEND_URL=http://localhost:8001

# Configuration Gmail
REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here

# Configuration application
REACT_APP_NAME=Unsubscribe App
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development
```

### 4. Configuration de la Base de Données

#### Créer la base de données
```bash
mongosh
```

```javascript
// Dans mongosh
use unsubscribe_app

// Créer les collections
db.createCollection("subscriptions")
db.createCollection("users")
db.createCollection("email_scans")

// Créer les index
db.subscriptions.createIndex({ "email": 1, "service_name": 1 })
db.subscriptions.createIndex({ "status": 1 })
db.subscriptions.createIndex({ "detected_at": -1 })
db.users.createIndex({ "email": 1 }, { unique: true })
db.email_scans.createIndex({ "user_id": 1, "scan_date": -1 })

// Vérifier les collections
show collections
```

### 5. Configuration Supervisor

#### Installer Supervisor
```bash
# Ubuntu/Debian
sudo apt-get install supervisor

# macOS
brew install supervisor
```

#### Créer les fichiers de configuration
```bash
sudo nano /etc/supervisor/conf.d/unsubscribe-backend.conf
```

**Configuration Backend**
```ini
[program:unsubscribe-backend]
command=/home/user/unsubscribe-app/backend/venv/bin/python /home/user/unsubscribe-app/backend/server.py
directory=/home/user/unsubscribe-app/backend
user=user
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/unsubscribe-backend.log
environment=PATH="/home/user/unsubscribe-app/backend/venv/bin:%(ENV_PATH)s"
```

```bash
sudo nano /etc/supervisor/conf.d/unsubscribe-frontend.conf
```

**Configuration Frontend**
```ini
[program:unsubscribe-frontend]
command=/usr/bin/yarn start
directory=/home/user/unsubscribe-app/frontend
user=user
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/unsubscribe-frontend.log
environment=PATH="/usr/bin:%(ENV_PATH)s"
```

#### Redémarrer Supervisor
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

## 🔑 Configuration Gmail API

### 1. Créer un Projet Google Cloud

1. **Accéder à Google Cloud Console**
   - Visitez https://console.cloud.google.com/
   - Connectez-vous avec votre compte Google

2. **Créer un nouveau projet**
   - Cliquez sur "Sélectionner un projet"
   - Cliquez sur "Nouveau projet"
   - Nom du projet : "Unsubscribe App"
   - Cliquez sur "Créer"

### 2. Activer Gmail API

1. **Naviguer vers les APIs**
   - Dans le menu, allez à "APIs et services" > "Bibliothèque"
   - Recherchez "Gmail API"
   - Cliquez sur "Gmail API" dans les résultats
   - Cliquez sur "Activer"

### 3. Configurer OAuth 2.0

1. **Écran de consentement OAuth**
   - Allez à "APIs et services" > "Écran de consentement OAuth"
   - Sélectionnez "Externe" et cliquez sur "Créer"
   - Remplissez les informations requises :
     - Nom de l'application : "Unsubscribe App"
     - Email d'assistance utilisateur : votre email
     - Domaine autorisé : localhost
   - Cliquez sur "Enregistrer et continuer"

2. **Créer les identifiants**
   - Allez à "APIs et services" > "Identifiants"
   - Cliquez sur "Créer des identifiants" > "ID client OAuth 2.0"
   - Type d'application : "Application Web"
   - Nom : "Unsubscribe App Client"
   - URI de redirection autorisés :
     - http://localhost:8001/auth/callback
     - http://localhost:3000/auth/callback
   - Cliquez sur "Créer"

3. **Télécharger les identifiants**
   - Téléchargez le fichier JSON des identifiants
   - Renommez-le en `credentials.json`
   - Placez-le dans le dossier `backend/`

### 4. Configuration des Scopes

**Scopes requis :**
- `https://www.googleapis.com/auth/gmail.readonly` - Lire les emails
- `https://www.googleapis.com/auth/gmail.send` - Envoyer des emails
- `https://www.googleapis.com/auth/userinfo.email` - Informations utilisateur

## ✅ Vérification de l'Installation

### 1. Tester le Backend
```bash
cd backend
source venv/bin/activate
python -c "import fastapi, pymongo, google.oauth2.credentials; print('Backend OK')"
```

### 2. Tester le Frontend
```bash
cd frontend
yarn test --watchAll=false
```

### 3. Tester la Base de Données
```bash
mongosh unsubscribe_app --eval "db.stats()"
```

### 4. Tester l'Application Complète
```bash
# Démarrer tous les services
sudo supervisorctl start all

# Vérifier les statuts
sudo supervisorctl status

# Tester l'API
curl http://localhost:8001/
curl http://localhost:8001/api/subscriptions

# Tester le Frontend
curl http://localhost:3000/
```

## 🔧 Dépannage

### Problèmes Courants

#### 1. Erreur de Port
```bash
# Vérifier les ports utilisés
netstat -tulpn | grep :8001
netstat -tulpn | grep :3000

# Libérer un port si nécessaire
sudo fuser -k 8001/tcp
sudo fuser -k 3000/tcp
```

#### 2. Erreur MongoDB
```bash
# Vérifier le statut MongoDB
sudo systemctl status mongod

# Redémarrer MongoDB
sudo systemctl restart mongod

# Vérifier les logs
sudo journalctl -u mongod
```

#### 3. Erreur Gmail API
```bash
# Vérifier les identifiants
ls -la backend/credentials.json

# Vérifier les permissions
chmod 600 backend/credentials.json

# Tester l'authentification
cd backend
python -c "
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
flow = InstalledAppFlow.from_client_secrets_file('credentials.json', ['https://www.googleapis.com/auth/gmail.readonly'])
print('Configuration OK')
"
```

#### 4. Erreur de Dépendances
```bash
# Nettoyer et réinstaller (Backend)
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Nettoyer et réinstaller (Frontend)
cd frontend
rm -rf node_modules yarn.lock
yarn install
```

### Logs de Débogage

#### Backend
```bash
# Logs Supervisor
sudo tail -f /var/log/supervisor/unsubscribe-backend.log

# Logs application
tail -f backend/app.log
```

#### Frontend
```bash
# Logs Supervisor
sudo tail -f /var/log/supervisor/unsubscribe-frontend.log

# Logs navigateur
# Ouvrir les outils de développement (F12)
```

#### Base de Données
```bash
# Logs MongoDB
sudo tail -f /var/log/mongodb/mongod.log

# Statistiques MongoDB
mongosh unsubscribe_app --eval "db.stats()"
```

## 📊 Tests de Performance

### Test de Charge Backend
```bash
# Installer wrk
sudo apt-get install wrk

# Tester l'API
wrk -t12 -c400 -d30s http://localhost:8001/api/subscriptions
```

### Test de Charge Frontend
```bash
# Installer lighthouse
npm install -g lighthouse

# Tester les performances
lighthouse http://localhost:3000 --output=json --output-path=performance.json
```

## 🔄 Mise à Jour

### Mise à jour du Code
```bash
git pull origin main
cd backend && pip install -r requirements.txt
cd ../frontend && yarn install
sudo supervisorctl restart all
```

### Mise à jour de la Base de Données
```bash
# Backup avant mise à jour
mongodump --db unsubscribe_app --out backup/

# Appliquer les migrations
mongosh unsubscribe_app < migrations/001_initial.js
```

## 📞 Support

En cas de problème durant l'installation :

1. **Vérifiez les logs** en suivant les instructions ci-dessus
2. **Consultez la FAQ** dans `docs/FAQ.md`
3. **Créez une issue** sur GitHub avec :
   - Version du système d'exploitation
   - Versions des logiciels installés
   - Logs d'erreur complets
   - Étapes pour reproduire le problème

---

*Installation réalisée avec succès ? Continuez avec le [Guide de Configuration](CONFIGURATION.md)*