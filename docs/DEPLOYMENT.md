# 🚀 Guide de Déploiement

## 📋 Table des Matières

1. [Déploiement Local](#déploiement-local)
2. [Déploiement sur Serveur](#déploiement-sur-serveur)
3. [Déploiement Docker](#déploiement-docker)
4. [Déploiement Cloud](#déploiement-cloud)
5. [Configuration Production](#configuration-production)
6. [Monitoring et Maintenance](#monitoring-et-maintenance)

## 🏠 Déploiement Local

### Prérequis
- Python 3.8+
- Node.js 16+
- MongoDB 4.4+
- Git

### Installation Rapide
```bash
# Cloner le projet
git clone [url-du-projet]
cd unsubscribe-app

# Installer les dépendances
cd backend && pip install -r requirements.txt
cd ../frontend && yarn install

# Configurer l'environnement
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Démarrer les services
sudo supervisorctl start all
```

### Vérification
```bash
# Vérifier les services
sudo supervisorctl status

# Tester l'application
curl http://localhost:8001/
curl http://localhost:3000/
```

## 🖥️ Déploiement sur Serveur

### Serveur Ubuntu 20.04+

#### 1. Préparation du Serveur
```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des outils de base
sudo apt install -y git curl wget vim nginx

# Installation de Python 3.8+
sudo apt install -y python3 python3-pip python3-venv

# Installation de Node.js 16+
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation de Yarn
npm install -g yarn

# Installation de MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Démarrer MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### 2. Configuration Utilisateur
```bash
# Créer un utilisateur dédié
sudo useradd -m -s /bin/bash unsubscribe
sudo usermod -aG sudo unsubscribe

# Passer à l'utilisateur dédié
sudo su - unsubscribe
```

#### 3. Déploiement de l'Application
```bash
# Cloner le projet
git clone [url-du-projet] /home/unsubscribe/app
cd /home/unsubscribe/app

# Configuration Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configuration Frontend
cd ../frontend
yarn install
yarn build

# Configuration des variables d'environnement
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Éditer les fichiers .env avec les bonnes valeurs
nano backend/.env
nano frontend/.env
```

#### 4. Configuration Nginx
```bash
# Créer la configuration Nginx
sudo nano /etc/nginx/sites-available/unsubscribe-app
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /home/unsubscribe/app/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Gestion des erreurs
    error_page 404 /index.html;
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/unsubscribe-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Configuration Supervisor
```bash
# Configuration Backend
sudo nano /etc/supervisor/conf.d/unsubscribe-backend.conf
```

```ini
[program:unsubscribe-backend]
command=/home/unsubscribe/app/backend/venv/bin/python /home/unsubscribe/app/backend/server.py
directory=/home/unsubscribe/app/backend
user=unsubscribe
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/unsubscribe-backend.log
environment=PATH="/home/unsubscribe/app/backend/venv/bin:%(ENV_PATH)s"
```

```bash
# Redémarrer Supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start unsubscribe-backend
```

## 🐳 Déploiement Docker

### Dockerfile Backend
```dockerfile
# backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copier les requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code
COPY . .

# Exposer le port
EXPOSE 8001

# Commande de démarrage
CMD ["python", "server.py"]
```

### Dockerfile Frontend
```dockerfile
# frontend/Dockerfile
FROM node:16-alpine as builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json yarn.lock ./
RUN yarn install

# Copier le code et builder
COPY . .
RUN yarn build

# Image de production
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: unsubscribe-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    container_name: unsubscribe-backend
    restart: unless-stopped
    depends_on:
      - mongodb
    environment:
      MONGO_URL: mongodb://root:password@mongodb:27017/unsubscribe_app?authSource=admin
    ports:
      - "8001:8001"
    volumes:
      - ./backend:/app
      - ./backend/credentials.json:/app/credentials.json

  frontend:
    build: ./frontend
    container_name: unsubscribe-frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "3000:80"
    environment:
      REACT_APP_BACKEND_URL: http://localhost:8001

volumes:
  mongodb_data:
```

### Commandes Docker
```bash
# Construire et démarrer
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down

# Reconstruire
docker-compose up -d --build
```

## ☁️ Déploiement Cloud

### AWS EC2

#### 1. Lancement d'Instance
```bash
# Créer une instance EC2
aws ec2 run-instances \
    --image-id ami-0abcdef1234567890 \
    --instance-type t2.medium \
    --key-name your-key-pair \
    --security-group-ids sg-12345678 \
    --subnet-id subnet-12345678
```

#### 2. Configuration des Groupes de Sécurité
```bash
# Ouvrir les ports nécessaires
aws ec2 authorize-security-group-ingress \
    --group-id sg-12345678 \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id sg-12345678 \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0
```

#### 3. Déploiement sur l'Instance
```bash
# Connexion à l'instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Suivre les étapes du déploiement serveur
```

### Google Cloud Platform

#### 1. Création d'Instance Compute Engine
```bash
# Créer une instance
gcloud compute instances create unsubscribe-app \
    --image-family ubuntu-2004-lts \
    --image-project ubuntu-os-cloud \
    --machine-type n1-standard-1 \
    --zone us-central1-a
```

#### 2. Configuration du Firewall
```bash
# Ouvrir les ports HTTP/HTTPS
gcloud compute firewall-rules create allow-http-https \
    --allow tcp:80,tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTP and HTTPS traffic"
```

### DigitalOcean

#### 1. Création de Droplet
```bash
# Utiliser l'API DigitalOcean
curl -X POST "https://api.digitalocean.com/v2/droplets" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_API_TOKEN" \
    -d '{
        "name": "unsubscribe-app",
        "region": "nyc3",
        "size": "s-2vcpu-2gb",
        "image": "ubuntu-20-04-x64"
    }'
```

## 🔧 Configuration Production

### Variables d'Environnement Production

#### Backend (.env)
```env
# Base de données
MONGO_URL=mongodb://username:password@localhost:27017/unsubscribe_app

# Gmail API
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/callback

# Sécurité
SECRET_KEY=your_super_secure_secret_key_minimum_32_characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configuration production
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Email
EMAIL_RATE_LIMIT=10
MAX_EMAILS_PER_SCAN=100
SCAN_TIMEOUT_SECONDS=300

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

#### Frontend (.env)
```env
# URL du backend
REACT_APP_BACKEND_URL=https://your-domain.com

# Gmail
REACT_APP_GOOGLE_CLIENT_ID=your_production_client_id

# Configuration
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
REACT_APP_VERSION=1.0.0
```

### Configuration SSL/TLS

#### Certificat Let's Encrypt
```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot --nginx -d your-domain.com

# Renouvellement automatique
sudo crontab -e
# Ajouter : 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Configuration Nginx SSL
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Configuration du reste du serveur...
}

# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### Optimisation des Performances

#### Backend
```python
# backend/config.py
import os

class ProductionConfig:
    # Base de données
    MONGO_URL = os.environ.get('MONGO_URL')
    
    # Cache Redis
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379')
    
    # Workers
    WORKER_CONNECTIONS = 1000
    WORKER_PROCESSES = 4
    
    # Timeouts
    REQUEST_TIMEOUT = 30
    KEEP_ALIVE_TIMEOUT = 5
```

#### Frontend
```javascript
// frontend/src/config/production.js
export const config = {
  apiUrl: process.env.REACT_APP_BACKEND_URL,
  enableServiceWorker: true,
  cacheSize: 50 * 1024 * 1024, // 50MB
  requestTimeout: 30000,
  retryAttempts: 3
};
```

## 📊 Monitoring et Maintenance

### Monitoring avec Prometheus et Grafana

#### Configuration Prometheus
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'unsubscribe-backend'
    static_configs:
      - targets: ['localhost:8001']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']
```

#### Métriques Backend
```python
# backend/monitoring.py
from prometheus_client import Counter, Histogram, Gauge

# Compteurs
email_scans_total = Counter('email_scans_total', 'Total email scans')
emails_sent_total = Counter('emails_sent_total', 'Total emails sent')
unsubscribe_success_total = Counter('unsubscribe_success_total', 'Successful unsubscribes')

# Histogrammes
scan_duration = Histogram('scan_duration_seconds', 'Email scan duration')
email_send_duration = Histogram('email_send_duration_seconds', 'Email send duration')

# Jauges
active_users = Gauge('active_users', 'Number of active users')
```

### Logging

#### Configuration Logging
```python
# backend/logging_config.py
import logging
import logging.handlers
import os

def setup_logging():
    # Créer les répertoires
    os.makedirs('/var/log/unsubscribe', exist_ok=True)
    
    # Logger principal
    logger = logging.getLogger('unsubscribe')
    logger.setLevel(logging.INFO)
    
    # Handler pour les fichiers
    file_handler = logging.handlers.RotatingFileHandler(
        '/var/log/unsubscribe/app.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    
    # Handler pour les erreurs
    error_handler = logging.handlers.RotatingFileHandler(
        '/var/log/unsubscribe/error.log',
        maxBytes=10*1024*1024,
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    
    # Formatage
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(formatter)
    error_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(error_handler)
    
    return logger
```

### Sauvegarde

#### Script de Sauvegarde MongoDB
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
DB_NAME="unsubscribe_app"

# Créer le répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarde MongoDB
mongodump --db $DB_NAME --out $BACKUP_DIR/$DATE

# Compression
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR $DATE

# Nettoyage
rm -rf $BACKUP_DIR/$DATE

# Garder seulement les 30 dernières sauvegardes
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete

echo "Sauvegarde terminée: backup_$DATE.tar.gz"
```

#### Cron Job pour Sauvegarde
```bash
# Éditer la crontab
sudo crontab -e

# Ajouter une sauvegarde quotidienne à 2h00
0 2 * * * /home/unsubscribe/scripts/backup.sh
```

### Maintenance

#### Script de Maintenance
```bash
#!/bin/bash
# maintenance.sh

echo "Démarrage de la maintenance..."

# Nettoyage des logs
find /var/log/unsubscribe -name "*.log" -mtime +30 -delete

# Nettoyage des tokens expirés
cd /home/unsubscribe/app/backend
python3 -c "
import os
from datetime import datetime, timedelta
import glob

# Supprimer les tokens expirés
for token_file in glob.glob('token_*.json'):
    if os.path.getmtime(token_file) < (datetime.now() - timedelta(days=7)).timestamp():
        os.remove(token_file)
        print(f'Token expiré supprimé: {token_file}')
"

# Optimisation MongoDB
mongo unsubscribe_app --eval "db.runCommand({compact: 'subscriptions'})"

# Redémarrage des services
sudo supervisorctl restart unsubscribe-backend

echo "Maintenance terminée"
```

### Alertes

#### Configuration d'Alertes
```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@your-domain.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'email-alert'

receivers:
- name: 'email-alert'
  email_configs:
  - to: 'admin@your-domain.com'
    subject: 'Unsubscribe App Alert'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}
```

### Mise à Jour

#### Script de Mise à Jour
```bash
#!/bin/bash
# update.sh

echo "Mise à jour de l'application..."

# Sauvegarde avant mise à jour
./backup.sh

# Récupération des dernières modifications
git pull origin main

# Mise à jour des dépendances backend
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Mise à jour des dépendances frontend
cd ../frontend
yarn install
yarn build

# Redémarrage des services
sudo supervisorctl restart unsubscribe-backend
sudo systemctl reload nginx

echo "Mise à jour terminée"
```

---

*Guide de déploiement complet - Prêt pour la production ! 🚀*