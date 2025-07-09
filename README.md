# 📧 Application de Désinscription Automatique

## 🌟 Description

L'**Application de Désinscription Automatique** est une solution complète qui permet aux utilisateurs de se désinscrire automatiquement des services auxquels ils se sont abonnés avec leur adresse email. L'application scanne automatiquement votre boîte Gmail, détecte les abonnements, génère des emails de désinscription prêts à envoyer et assure le suivi des demandes.

## 🎯 Fonctionnalités Principales

### ✅ Fonctionnalités Implémentées
- **Scan automatique de Gmail** : Détection intelligente des emails d'abonnement
- **Génération d'emails de désinscription** : Création automatique d'emails personnalisés
- **Suivi des demandes** : Tracking du statut des désinscriptions
- **Interface utilisateur simple** : Dashboard intuitif pour gérer les abonnements
- **Intégration Gmail API** : Connexion sécurisée avec votre compte Gmail

### 🚀 Fonctionnalités Avancées
- **Détection intelligente** : Reconnaissance automatique des liens et emails de désinscription
- **Templates personnalisables** : Modèles d'emails de désinscription adaptables
- **Historique complet** : Suivi chronologique de toutes les actions
- **Filtres avancés** : Tri et recherche dans les abonnements détectés

## 🏗️ Architecture Technique

### Stack Technologique
- **Frontend** : React 18.2.0 avec design moderne
- **Backend** : FastAPI (Python) avec architecture RESTful
- **Base de données** : MongoDB pour le stockage persistant
- **API externe** : Gmail API pour l'accès aux emails
- **Authentification** : OAuth 2.0 Google

### Structure du Projet
```
/app/
├── backend/                    # API FastAPI
│   ├── server.py              # Application principale
│   ├── requirements.txt       # Dépendances Python
│   ├── .env                   # Variables d'environnement
│   ├── gmail_service.py       # Service Gmail API
│   ├── email_analyzer.py      # Analyse des emails
│   └── models.py              # Modèles de données
├── frontend/                  # Interface React
│   ├── src/
│   │   ├── App.js            # Composant principal
│   │   ├── components/       # Composants réutilisables
│   │   ├── services/         # Services API
│   │   └── styles/           # Styles CSS
│   ├── package.json          # Dépendances Node.js
│   └── .env                  # Configuration frontend
├── docs/                     # Documentation
│   ├── API.md               # Documentation API
│   ├── INSTALLATION.md      # Guide d'installation
│   ├── CONFIGURATION.md     # Configuration Gmail
│   ├── USER_GUIDE.md        # Guide utilisateur
│   └── DEPLOYMENT.md        # Guide de déploiement
└── tests/                   # Tests automatisés
```

## 🚀 Installation Rapide

### Prérequis
- Python 3.8+
- Node.js 16+
- MongoDB 4.4+
- Compte Google avec Gmail activé

### Installation
1. **Cloner le projet**
   ```bash
   git clone [url-du-projet]
   cd app
   ```

2. **Installer les dépendances backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Installer les dépendances frontend**
   ```bash
   cd frontend
   yarn install
   ```

4. **Configurer Gmail API** (voir docs/CONFIGURATION.md)

5. **Lancer l'application**
   ```bash
   sudo supervisorctl restart all
   ```

## 📖 Documentation Complète

- **[Guide d'Installation](docs/INSTALLATION.md)** - Installation détaillée pas à pas
- **[Configuration Gmail](docs/CONFIGURATION.md)** - Configuration complète de l'API Gmail
- **[Documentation API](docs/API.md)** - Référence complète des endpoints
- **[Guide Utilisateur](docs/USER_GUIDE.md)** - Manuel d'utilisation
- **[Guide de Déploiement](docs/DEPLOYMENT.md)** - Déploiement en production
- **[FAQ](docs/FAQ.md)** - Questions fréquentes et dépannage

## 🔧 Configuration Rapide

### Variables d'Environnement

**Backend (.env)**
```env
MONGO_URL=mongodb://localhost:27017/unsubscribe_app
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

**Frontend (.env)**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 🎮 Utilisation

### 1. Connexion Gmail
- Ouvrez l'application dans votre navigateur
- Cliquez sur "Se connecter à Gmail"
- Autorisez l'accès à votre compte Gmail

### 2. Scan Automatique
- Cliquez sur "Scanner mes emails"
- L'application analyse automatiquement votre boîte de réception
- Les abonnements détectés apparaissent dans la liste

### 3. Désinscription
- Sélectionnez les services dont vous voulez vous désinscrire
- Cliquez sur "Générer email de désinscription"
- Vérifiez et envoyez l'email automatiquement

### 4. Suivi
- Consultez le statut de vos demandes dans l'onglet "Suivi"
- Marquez les désinscriptions réussies manuellement si nécessaire

## 📊 Statuts des Abonnements

| Statut | Description | Action |
|--------|-------------|--------|
| `detected` | Abonnement détecté | Prêt pour désinscription |
| `unsubscribe_sent` | Email envoyé | En attente de confirmation |
| `unsubscribed` | Désinscription confirmée | Terminé |
| `failed` | Échec de désinscription | Nouvelle tentative nécessaire |

## 🔒 Sécurité et Confidentialité

- **Chiffrement** : Toutes les communications sont chiffrées
- **OAuth 2.0** : Authentification sécurisée avec Google
- **Stockage local** : Vos données restent sur votre serveur
- **Permissions minimales** : Accès Gmail limité au strict nécessaire

## 🤝 Support et Contribution

### Signaler un Bug
1. Vérifiez que le bug n'existe pas déjà dans les issues
2. Créez une nouvelle issue avec :
   - Description détaillée du problème
   - Étapes pour reproduire
   - Logs d'erreur si disponibles

### Contribuer
1. Forkez le projet
2. Créez une branche pour votre fonctionnalité
3. Commitez vos changements
4. Créez une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🔄 Versions

- **v1.0.0** - Version initiale avec fonctionnalités de base
- **v1.1.0** - Ajout du scan automatique amélioré
- **v1.2.0** - Interface utilisateur redesignée

## 📞 Contact

Pour toute question ou support :
- Email : support@unsubscribe-app.com
- Documentation : [docs/](docs/)
- Issues : [GitHub Issues](https://github.com/votre-repo/issues)

---

*Développé avec ❤️ pour simplifier la gestion des abonnements emails*