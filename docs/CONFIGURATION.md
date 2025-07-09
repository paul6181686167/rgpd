# ⚙️ Guide de Configuration Gmail API

## 📋 Table des Matières

1. [Configuration Google Cloud](#configuration-google-cloud)
2. [Configuration OAuth 2.0](#configuration-oauth-20)
3. [Configuration de l'Application](#configuration-de-lapplication)
4. [Configuration Avancée](#configuration-avancée)
5. [Sécurité et Permissions](#sécurité-et-permissions)
6. [Dépannage](#dépannage)

## 🔧 Configuration Google Cloud

### 1. Création du Projet Google Cloud

#### Étape 1 : Accès à Google Cloud Console
1. Visitez https://console.cloud.google.com/
2. Connectez-vous avec votre compte Google
3. Acceptez les conditions d'utilisation si nécessaire

#### Étape 2 : Création d'un Nouveau Projet
1. Cliquez sur le sélecteur de projet en haut de la page
2. Cliquez sur "Nouveau projet"
3. Remplissez les informations :
   - **Nom du projet** : `Unsubscribe App`
   - **ID du projet** : `unsubscribe-app-[nombre-aléatoire]`
   - **Organisation** : Laissez vide ou sélectionnez votre organisation
4. Cliquez sur "Créer"
5. Attendez que le projet soit créé (peut prendre quelques minutes)

#### Étape 3 : Activation de la Facturation (si nécessaire)
1. Allez dans "Facturation" dans le menu principal
2. Liez votre projet à un compte de facturation
3. **Note** : L'utilisation de Gmail API est gratuite pour les quotas normaux

### 2. Activation des APIs Nécessaires

#### Activation de Gmail API
1. Dans le menu, allez à "APIs et services" > "Bibliothèque"
2. Recherchez "Gmail API"
3. Cliquez sur "Gmail API" dans les résultats
4. Cliquez sur "Activer"
5. Attendez l'activation (quelques secondes)

#### Vérification des Quotas
1. Allez à "APIs et services" > "Quotas"
2. Filtrez par "Gmail API"
3. Vérifiez les limites :
   - **Requests per day** : 1,000,000,000
   - **Requests per minute per user** : 250
   - **Requests per second per user** : 25

## 🔐 Configuration OAuth 2.0

### 1. Configuration de l'Écran de Consentement

#### Étape 1 : Accès à l'Écran de Consentement
1. Allez à "APIs et services" > "Écran de consentement OAuth"
2. Sélectionnez le type d'utilisateur :
   - **Interne** : Si vous avez un compte Google Workspace
   - **Externe** : Pour les comptes Gmail personnels (recommandé)
3. Cliquez sur "Créer"

#### Étape 2 : Informations sur l'Application
Remplissez les champs obligatoires :

**Informations sur l'application**
- **Nom de l'application** : `Unsubscribe App`
- **Email d'assistance utilisateur** : `votre.email@gmail.com`
- **Logo de l'application** : (optionnel)

**Domaine d'application**
- **Domaine autorisé** : `localhost` (pour le développement)
- **Domaine du développeur** : `localhost`

**Coordonnées du développeur**
- **Adresses email** : `votre.email@gmail.com`

#### Étape 3 : Scopes (Portées)
1. Cliquez sur "Ajouter ou supprimer des scopes"
2. Ajoutez les scopes suivants :
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/userinfo.email`
3. Cliquez sur "Mettre à jour"

#### Étape 4 : Utilisateurs de Test (si Externe)
Si vous avez choisi "Externe", ajoutez votre email comme utilisateur de test :
1. Cliquez sur "Ajouter des utilisateurs"
2. Ajoutez votre adresse email
3. Cliquez sur "Ajouter"

### 2. Création des Identifiants OAuth 2.0

#### Étape 1 : Création des Identifiants
1. Allez à "APIs et services" > "Identifiants"
2. Cliquez sur "Créer des identifiants"
3. Sélectionnez "ID client OAuth 2.0"

#### Étape 2 : Configuration du Client
**Type d'application** : `Application Web`

**Nom** : `Unsubscribe App Client`

**URI de redirection autorisés** :
- `http://localhost:8001/auth/callback`
- `http://localhost:3000/auth/callback`
- `http://127.0.0.1:8001/auth/callback`

**Origines JavaScript autorisées** :
- `http://localhost:3000`
- `http://localhost:8001`
- `http://127.0.0.1:3000`

#### Étape 3 : Téléchargement des Identifiants
1. Cliquez sur "Créer"
2. Une popup apparaît avec vos identifiants
3. Cliquez sur "Télécharger JSON"
4. Sauvegardez le fichier sous `backend/credentials.json`

### 3. Structure du Fichier credentials.json

```json
{
  "web": {
    "client_id": "123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com",
    "project_id": "unsubscribe-app-123456",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "GOCSPX-abcdefghijklmnopqrstuvwxyz",
    "redirect_uris": [
      "http://localhost:8001/auth/callback",
      "http://localhost:3000/auth/callback"
    ]
  }
}
```

## 🛠️ Configuration de l'Application

### 1. Configuration Backend

#### Mise à jour du fichier .env
```env
# Configuration Gmail API
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=http://localhost:8001/auth/callback

# Configuration OAuth
OAUTH_SCOPES=https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/userinfo.email

# Configuration sécurité
SECRET_KEY=your-super-secret-key-here-32-characters-minimum
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configuration email
EMAIL_RATE_LIMIT=10
MAX_EMAILS_PER_SCAN=100
SCAN_TIMEOUT_SECONDS=300
```

#### Création du Service Gmail
Créez le fichier `backend/gmail_service.py` :

```python
import os
import json
import base64
from typing import List, Dict, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

class GmailService:
    """Service pour interagir avec Gmail API"""
    
    SCOPES = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/userinfo.email'
    ]
    
    def __init__(self, credentials_path: str = 'credentials.json'):
        self.credentials_path = credentials_path
        self.service = None
        self.creds = None
    
    def authenticate(self, user_id: str) -> bool:
        """Authentifier l'utilisateur avec OAuth 2.0"""
        token_path = f'token_{user_id}.json'
        
        # Charger les tokens existants
        if os.path.exists(token_path):
            self.creds = Credentials.from_authorized_user_file(token_path, self.SCOPES)
        
        # Rafraîchir ou obtenir de nouveaux tokens
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_path, self.SCOPES
                )
                self.creds = flow.run_local_server(port=0)
            
            # Sauvegarder les tokens
            with open(token_path, 'w') as token:
                token.write(self.creds.to_json())
        
        # Créer le service Gmail
        self.service = build('gmail', 'v1', credentials=self.creds)
        return True
    
    def get_messages(self, query: str = '', max_results: int = 100) -> List[Dict]:
        """Récupérer les messages Gmail"""
        try:
            results = self.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            detailed_messages = []
            
            for message in messages:
                msg = self.service.users().messages().get(
                    userId='me',
                    id=message['id']
                ).execute()
                detailed_messages.append(msg)
            
            return detailed_messages
        
        except HttpError as error:
            print(f'Erreur lors de la récupération des messages: {error}')
            return []
    
    def send_message(self, to: str, subject: str, body: str) -> bool:
        """Envoyer un email"""
        try:
            message = MIMEMultipart()
            message['to'] = to
            message['subject'] = subject
            message.attach(MIMEText(body, 'plain'))
            
            raw_message = base64.urlsafe_b64encode(
                message.as_bytes()
            ).decode()
            
            send_message = self.service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            return True
        
        except HttpError as error:
            print(f'Erreur lors de l\'envoi: {error}')
            return False
    
    def get_user_info(self) -> Dict:
        """Obtenir les informations de l'utilisateur"""
        try:
            profile = self.service.users().getProfile(userId='me').execute()
            return {
                'email': profile.get('emailAddress'),
                'total_messages': profile.get('messagesTotal', 0),
                'total_threads': profile.get('threadsTotal', 0)
            }
        except HttpError as error:
            print(f'Erreur lors de la récupération du profil: {error}')
            return {}
```

### 2. Configuration Frontend

#### Mise à jour du fichier .env
```env
# Configuration API
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_API_VERSION=v1

# Configuration Gmail
REACT_APP_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com

# Configuration application
REACT_APP_NAME=Unsubscribe App
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true

# Configuration UI
REACT_APP_THEME=light
REACT_APP_LANGUAGE=fr
REACT_APP_TIMEZONE=Europe/Paris
```

## 🔧 Configuration Avancée

### 1. Configuration des Quotas

#### Quotas par Défaut
- **Requests per day** : 1,000,000,000
- **Requests per minute per user** : 250
- **Requests per second per user** : 25

#### Surveillance des Quotas
```python
# backend/quota_monitor.py
import time
from collections import defaultdict
from datetime import datetime, timedelta

class QuotaMonitor:
    def __init__(self):
        self.requests_per_user = defaultdict(list)
        self.daily_requests = defaultdict(int)
    
    def check_quota(self, user_id: str) -> bool:
        """Vérifier si l'utilisateur peut faire une requête"""
        now = datetime.now()
        
        # Nettoyer les anciennes requêtes (plus de 1 minute)
        self.requests_per_user[user_id] = [
            req_time for req_time in self.requests_per_user[user_id]
            if now - req_time < timedelta(minutes=1)
        ]
        
        # Vérifier la limite par minute
        if len(self.requests_per_user[user_id]) >= 250:
            return False
        
        # Enregistrer la requête
        self.requests_per_user[user_id].append(now)
        self.daily_requests[user_id] += 1
        
        return True
```

### 2. Configuration de la Sécurité

#### Chiffrement des Tokens
```python
# backend/security.py
import os
from cryptography.fernet import Fernet

class TokenEncryption:
    def __init__(self):
        key = os.environ.get('ENCRYPTION_KEY')
        if not key:
            key = Fernet.generate_key()
            print(f"Nouvelle clé générée: {key.decode()}")
        self.cipher = Fernet(key)
    
    def encrypt_token(self, token: str) -> str:
        """Chiffrer un token"""
        return self.cipher.encrypt(token.encode()).decode()
    
    def decrypt_token(self, encrypted_token: str) -> str:
        """Déchiffrer un token"""
        return self.cipher.decrypt(encrypted_token.encode()).decode()
```

### 3. Configuration des Logs

#### Configuration Logging
```python
# backend/logging_config.py
import logging
import os
from datetime import datetime

def setup_logging():
    """Configuration des logs"""
    
    # Créer le répertoire de logs
    os.makedirs('logs', exist_ok=True)
    
    # Configuration du logger principal
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(f'logs/app_{datetime.now().strftime("%Y%m%d")}.log'),
            logging.StreamHandler()
        ]
    )
    
    # Logger spécifique pour Gmail API
    gmail_logger = logging.getLogger('gmail_api')
    gmail_handler = logging.FileHandler(f'logs/gmail_{datetime.now().strftime("%Y%m%d")}.log')
    gmail_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    gmail_logger.addHandler(gmail_handler)
    gmail_logger.setLevel(logging.DEBUG)
    
    return gmail_logger
```

## 🔒 Sécurité et Permissions

### 1. Permissions Gmail Requises

#### Scopes Détaillés
```python
SCOPES = [
    # Lecture des emails
    'https://www.googleapis.com/auth/gmail.readonly',
    
    # Envoi d'emails
    'https://www.googleapis.com/auth/gmail.send',
    
    # Informations utilisateur
    'https://www.googleapis.com/auth/userinfo.email'
]
```

#### Permissions Minimales
- **gmail.readonly** : Lecture seule des emails
- **gmail.send** : Envoi d'emails uniquement
- **userinfo.email** : Adresse email uniquement

### 2. Sécurisation des Credentials

#### Stockage Sécurisé
```bash
# Permissions strictes sur les fichiers sensibles
chmod 600 backend/credentials.json
chmod 600 backend/token_*.json
chmod 600 backend/.env
```

#### Variables d'Environnement
```env
# Ne jamais committer ces valeurs
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
SECRET_KEY=your-32-character-secret-key-here
ENCRYPTION_KEY=your-fernet-key-here
```

### 3. Validation des Données

#### Validation des Emails
```python
import re
from email_validator import validate_email, EmailNotValidError

def validate_email_address(email: str) -> bool:
    """Valider une adresse email"""
    try:
        validate_email(email)
        return True
    except EmailNotValidError:
        return False

def sanitize_email_content(content: str) -> str:
    """Nettoyer le contenu d'un email"""
    # Supprimer les balises HTML
    clean_content = re.sub(r'<[^>]+>', '', content)
    
    # Supprimer les caractères dangereux
    clean_content = re.sub(r'[<>"\']', '', clean_content)
    
    return clean_content
```

## 🐛 Dépannage

### 1. Erreurs d'Authentification

#### Erreur : "Error 400: invalid_request"
**Causes possibles :**
- URI de redirection non configurée
- Mauvais client_id ou client_secret

**Solutions :**
```bash
# Vérifier les URIs de redirection
cat backend/credentials.json | grep redirect_uris

# Vérifier les variables d'environnement
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
```

#### Erreur : "Error 403: access_denied"
**Causes possibles :**
- Utilisateur non autorisé (mode externe)
- Scopes non approuvés

**Solutions :**
1. Ajouter l'utilisateur dans "Utilisateurs de test"
2. Vérifier les scopes dans l'écran de consentement

### 2. Erreurs de Quotas

#### Erreur : "Error 429: Too Many Requests"
**Solutions :**
```python
# Implémenter un système de retry
import time
from googleapiclient.errors import HttpError

def make_request_with_retry(func, *args, **kwargs):
    """Exécuter une requête avec retry automatique"""
    for attempt in range(3):
        try:
            return func(*args, **kwargs)
        except HttpError as error:
            if error.resp.status == 429:
                wait_time = 2 ** attempt
                print(f"Rate limit atteinte, attente {wait_time}s")
                time.sleep(wait_time)
            else:
                raise error
    
    raise Exception("Nombre maximum de tentatives atteint")
```

### 3. Erreurs de Permissions

#### Erreur : "Error 401: Unauthorized"
**Solutions :**
```python
# Vérifier et rafraîchir les tokens
def refresh_credentials(user_id: str):
    """Rafraîchir les credentials"""
    token_path = f'token_{user_id}.json'
    
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
        
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            
            with open(token_path, 'w') as token:
                token.write(creds.to_json())
            
            return creds
    
    return None
```

### 4. Tests de Configuration

#### Test de Connexion Gmail
```python
# backend/test_gmail_config.py
import sys
from gmail_service import GmailService

def test_gmail_connection():
    """Tester la connexion Gmail"""
    try:
        service = GmailService()
        
        # Test d'authentification
        if service.authenticate('test_user'):
            print("✅ Authentification réussie")
        else:
            print("❌ Erreur d'authentification")
            return False
        
        # Test de récupération de messages
        messages = service.get_messages(max_results=1)
        if messages:
            print(f"✅ Récupération de messages réussie ({len(messages)} messages)")
        else:
            print("⚠️  Aucun message récupéré")
        
        # Test d'informations utilisateur
        user_info = service.get_user_info()
        if user_info:
            print(f"✅ Informations utilisateur: {user_info['email']}")
        else:
            print("❌ Erreur lors de la récupération des informations utilisateur")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False

if __name__ == "__main__":
    success = test_gmail_connection()
    sys.exit(0 if success else 1)
```

## 📊 Monitoring et Métriques

### 1. Métriques Gmail API

#### Suivi des Requêtes
```python
# backend/metrics.py
from datetime import datetime
from collections import defaultdict

class GmailMetrics:
    def __init__(self):
        self.request_counts = defaultdict(int)
        self.response_times = defaultdict(list)
        self.error_counts = defaultdict(int)
    
    def record_request(self, endpoint: str, response_time: float, success: bool):
        """Enregistrer une requête"""
        self.request_counts[endpoint] += 1
        self.response_times[endpoint].append(response_time)
        
        if not success:
            self.error_counts[endpoint] += 1
    
    def get_stats(self) -> dict:
        """Obtenir les statistiques"""
        return {
            'total_requests': sum(self.request_counts.values()),
            'average_response_time': sum(sum(times) for times in self.response_times.values()) / sum(len(times) for times in self.response_times.values()),
            'error_rate': sum(self.error_counts.values()) / sum(self.request_counts.values()) * 100,
            'requests_by_endpoint': dict(self.request_counts)
        }
```

### 2. Alertes et Notifications

#### Configuration des Alertes
```python
# backend/alerts.py
import smtplib
from email.mime.text import MIMEText

class AlertManager:
    def __init__(self, smtp_server: str, smtp_port: int, email: str, password: str):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.email = email
        self.password = password
    
    def send_alert(self, subject: str, message: str, recipients: list):
        """Envoyer une alerte"""
        try:
            msg = MIMEText(message)
            msg['Subject'] = subject
            msg['From'] = self.email
            msg['To'] = ', '.join(recipients)
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.email, self.password)
            server.send_message(msg)
            server.quit()
            
        except Exception as e:
            print(f"Erreur lors de l'envoi d'alerte: {e}")
    
    def check_quota_usage(self, usage_percent: float):
        """Vérifier l'utilisation du quota"""
        if usage_percent > 80:
            self.send_alert(
                "⚠️ Quota Gmail API élevé",
                f"Utilisation du quota: {usage_percent:.1f}%",
                ["admin@example.com"]
            )
```

---

*Configuration terminée avec succès ? Continuez avec le [Guide Utilisateur](USER_GUIDE.md)*