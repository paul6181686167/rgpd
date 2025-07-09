# 🏗️ Architecture Technique Détaillée

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Système](#architecture-système)
3. [Architecture Backend](#architecture-backend)
4. [Architecture Frontend](#architecture-frontend)
5. [Architecture Base de Données](#architecture-base-de-données)
6. [Flux de Données](#flux-de-données)
7. [Sécurité](#sécurité)
8. [Performance](#performance)
9. [Évolutivité](#évolutivité)

## 🌐 Vue d'Ensemble

### Architecture Générale
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Frontend      │    │    Backend      │    │   Base de       │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   Données       │
│   Port 3000     │    │   Port 8001     │    │   (MongoDB)     │
│                 │    │                 │    │   Port 27017    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │                       │
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Navigateur    │    │   Gmail API     │    │   Fichiers      │
│   Utilisateur   │    │   Google OAuth  │    │   Logs          │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technologies Utilisées

#### Stack Principal
- **Frontend** : React 18.2.0, Tailwind CSS 3.3.0
- **Backend** : FastAPI (Python 3.8+), Uvicorn
- **Base de données** : MongoDB 6.0+
- **API externe** : Gmail API v1
- **Authentification** : OAuth 2.0 Google

#### Outils et Dépendances
- **HTTP Client** : Axios (Frontend), Requests (Backend)
- **Validation** : Pydantic (Backend)
- **ORM** : PyMongo (Backend)
- **Process Manager** : Supervisor
- **Web Server** : Nginx (Production)

## 🖥️ Architecture Système

### Environnement de Développement
```
┌─────────────────────────────────────────────────────────────┐
│                    Environnement Local                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   React     │  │   FastAPI   │  │     MongoDB         │  │
│  │  Dev Server │  │   Server    │  │    Database         │  │
│  │ Port: 3000  │  │ Port: 8001  │  │   Port: 27017       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                      Supervisor                             │
│                  Process Manager                            │
└─────────────────────────────────────────────────────────────┘
```

### Environnement de Production
```
┌─────────────────────────────────────────────────────────────┐
│                   Serveur de Production                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Nginx    │  │   FastAPI   │  │     MongoDB         │  │
│  │ Reverse     │  │   Gunicorn  │  │    Replica Set      │  │
│  │ Proxy       │  │ Workers     │  │   Port: 27017       │  │
│  │ Port: 80/443│  │ Port: 8001  │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Prometheus  │  │   Grafana   │  │      ELK Stack      │  │
│  │ Monitoring  │  │ Dashboard   │  │    Logging          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Architecture Backend

### Structure des Modules
```
backend/
├── server.py              # Point d'entrée principal
├── models/
│   ├── __init__.py
│   ├── subscription.py    # Modèles Pydantic
│   ├── user.py
│   └── email.py
├── services/
│   ├── __init__.py
│   ├── gmail_service.py   # Service Gmail API
│   ├── email_service.py   # Service de génération d'emails
│   └── subscription_service.py
├── api/
│   ├── __init__.py
│   ├── routes.py          # Définition des routes
│   ├── auth.py            # Authentification
│   └── middleware.py      # Middleware personnalisés
├── database/
│   ├── __init__.py
│   ├── connection.py      # Connexion MongoDB
│   ├── models.py          # Modèles de base de données
│   └── migrations.py      # Scripts de migration
├── utils/
│   ├── __init__.py
│   ├── email_parser.py    # Parseur d'emails
│   ├── validators.py      # Validateurs
│   └── exceptions.py      # Exceptions personnalisées
├── config/
│   ├── __init__.py
│   ├── settings.py        # Configuration
│   └── logging.py         # Configuration des logs
└── tests/
    ├── __init__.py
    ├── test_routes.py
    ├── test_services.py
    └── test_utils.py
```

### Modèles de Données (Pydantic)

#### Subscription Model
```python
from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, List
from datetime import datetime
from enum import Enum

class SubscriptionStatus(str, Enum):
    DETECTED = "detected"
    UNSUBSCRIBE_SENT = "unsubscribe_sent"
    UNSUBSCRIBED = "unsubscribed"
    FAILED = "failed"

class SubscriptionCategory(str, Enum):
    NEWSLETTER = "newsletter"
    ECOMMERCE = "ecommerce"
    SOCIAL = "social"
    SERVICES = "services"
    MARKETING = "marketing"

class Subscription(BaseModel):
    id: str
    user_id: str
    email: EmailStr
    service_name: str
    sender_email: EmailStr
    sender_name: Optional[str] = None
    unsubscribe_link: Optional[HttpUrl] = None
    unsubscribe_email: Optional[EmailStr] = None
    list_id: Optional[str] = None
    category: SubscriptionCategory
    frequency: Optional[str] = None
    status: SubscriptionStatus = SubscriptionStatus.DETECTED
    detected_at: datetime
    unsubscribe_sent_at: Optional[datetime] = None
    unsubscribed_at: Optional[datetime] = None
    last_email_date: Optional[datetime] = None
    email_count: int = 0
    confidence_score: float = 0.0
    metadata: Optional[dict] = {}

class SubscriptionCreate(BaseModel):
    email: EmailStr
    service_name: str
    sender_email: EmailStr
    sender_name: Optional[str] = None
    unsubscribe_link: Optional[HttpUrl] = None
    unsubscribe_email: Optional[EmailStr] = None
    category: SubscriptionCategory

class SubscriptionUpdate(BaseModel):
    status: Optional[SubscriptionStatus] = None
    unsubscribe_sent_at: Optional[datetime] = None
    unsubscribed_at: Optional[datetime] = None
    metadata: Optional[dict] = None
```

### Services Architecture

#### Gmail Service
```python
class GmailService:
    """Service pour interagir avec Gmail API"""
    
    def __init__(self, credentials_path: str):
        self.credentials_path = credentials_path
        self.service = None
        self.quota_manager = QuotaManager()
    
    async def authenticate(self, user_id: str) -> bool:
        """Authentifier l'utilisateur"""
        pass
    
    async def scan_emails(self, user_id: str, options: ScanOptions) -> ScanResult:
        """Scanner les emails pour détecter les abonnements"""
        pass
    
    async def send_email(self, user_id: str, email_data: EmailData) -> bool:
        """Envoyer un email"""
        pass
    
    async def get_user_profile(self, user_id: str) -> UserProfile:
        """Obtenir le profil utilisateur"""
        pass
```

#### Email Analyzer Service
```python
class EmailAnalyzer:
    """Service d'analyse des emails pour détecter les abonnements"""
    
    def __init__(self):
        self.patterns = EmailPatterns()
        self.ml_classifier = MLClassifier()
    
    def analyze_email(self, email: EmailMessage) -> SubscriptionCandidate:
        """Analyser un email pour détecter s'il s'agit d'un abonnement"""
        pass
    
    def extract_unsubscribe_info(self, email: EmailMessage) -> UnsubscribeInfo:
        """Extraire les informations de désinscription"""
        pass
    
    def classify_category(self, email: EmailMessage) -> SubscriptionCategory:
        """Classifier la catégorie de l'abonnement"""
        pass
```

## ⚛️ Architecture Frontend

### Structure des Composants
```
src/
├── components/
│   ├── common/
│   │   ├── Button.js
│   │   ├── Modal.js
│   │   ├── Loader.js
│   │   └── Toast.js
│   ├── layout/
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   └── Footer.js
│   ├── subscription/
│   │   ├── SubscriptionList.js
│   │   ├── SubscriptionCard.js
│   │   ├── SubscriptionFilter.js
│   │   └── SubscriptionStats.js
│   ├── scan/
│   │   ├── ScanProgress.js
│   │   ├── ScanConfig.js
│   │   └── ScanResults.js
│   └── email/
│       ├── EmailPreview.js
│       ├── EmailTemplate.js
│       └── EmailGenerator.js
├── hooks/
│   ├── useAuth.js
│   ├── useSubscriptions.js
│   ├── useScan.js
│   └── useLocalStorage.js
├── services/
│   ├── api.js
│   ├── authService.js
│   ├── subscriptionService.js
│   └── scanService.js
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   ├── validators.js
│   └── dateUtils.js
├── contexts/
│   ├── AuthContext.js
│   ├── AppContext.js
│   └── ThemeContext.js
└── styles/
    ├── components.css
    ├── utilities.css
    └── animations.css
```

### State Management Architecture

#### Context API Structure
```javascript
// AuthContext.js
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  refreshToken: () => {}
});

// AppContext.js
const AppContext = createContext({
  subscriptions: [],
  stats: {},
  isLoading: false,
  error: null,
  scanStatus: null,
  updateSubscriptions: () => {},
  startScan: () => {},
  sendUnsubscribe: () => {}
});
```

#### Custom Hooks
```javascript
// useSubscriptions.js
export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSubscriptions = useCallback(async (filters = {}) => {
    // Logique de récupération
  }, []);

  const updateSubscription = useCallback(async (id, updates) => {
    // Logique de mise à jour
  }, []);

  return {
    subscriptions,
    loading,
    error,
    fetchSubscriptions,
    updateSubscription
  };
};
```

## 🗄️ Architecture Base de Données

### Schéma MongoDB

#### Collection: subscriptions
```javascript
{
  _id: ObjectId,
  id: String,                    // UUID unique
  user_id: String,               // ID utilisateur Google
  email: String,                 // Email de l'utilisateur
  service_name: String,          // Nom du service
  sender_email: String,          // Email expéditeur
  sender_name: String,           // Nom expéditeur
  unsubscribe_link: String,      // Lien de désinscription
  unsubscribe_email: String,     // Email de désinscription
  list_id: String,               // List-ID header
  category: String,              // Catégorie (newsletter, ecommerce, etc.)
  frequency: String,             // Fréquence estimée
  status: String,                // Statut (detected, sent, unsubscribed)
  detected_at: Date,             // Date de détection
  unsubscribe_sent_at: Date,     // Date d'envoi
  unsubscribed_at: Date,         // Date de désinscription
  last_email_date: Date,         // Dernier email reçu
  email_count: Number,           // Nombre d'emails reçus
  confidence_score: Number,      // Score de confiance (0-1)
  metadata: {                    // Métadonnées diverses
    headers: Object,
    patterns: Array,
    ml_features: Object
  },
  created_at: Date,
  updated_at: Date
}
```

#### Collection: users
```javascript
{
  _id: ObjectId,
  id: String,                    // ID unique
  google_id: String,             // ID Google
  email: String,                 // Email utilisateur
  name: String,                  // Nom utilisateur
  profile_picture: String,       // Photo de profil
  gmail_tokens: {                // Tokens OAuth
    access_token: String,        // Token d'accès (chiffré)
    refresh_token: String,       // Token de rafraîchissement (chiffré)
    expires_at: Date
  },
  preferences: {                 // Préférences utilisateur
    scan_frequency: String,
    email_template: String,
    notifications: Boolean,
    language: String
  },
  stats: {                       // Statistiques utilisateur
    total_scans: Number,
    total_subscriptions: Number,
    total_unsubscribed: Number,
    last_scan: Date
  },
  created_at: Date,
  updated_at: Date,
  last_login: Date
}
```

#### Collection: email_scans
```javascript
{
  _id: ObjectId,
  id: String,                    // UUID unique
  user_id: String,               // ID utilisateur
  status: String,                // started, running, completed, failed
  progress: Number,              // Progression (0-100)
  config: {                      // Configuration du scan
    max_emails: Number,
    date_range: {
      from: Date,
      to: Date
    },
    folders: Array,
    filters: Object
  },
  results: {                     // Résultats du scan
    emails_scanned: Number,
    subscriptions_found: Number,
    new_subscriptions: Number,
    processing_time: Number
  },
  errors: Array,                 // Erreurs rencontrées
  started_at: Date,
  completed_at: Date
}
```

#### Collection: sent_emails
```javascript
{
  _id: ObjectId,
  id: String,                    // UUID unique
  user_id: String,               // ID utilisateur
  subscription_id: String,       // ID abonnement
  to: String,                    // Destinataire
  subject: String,               // Objet
  body: String,                  // Corps du message
  template_used: String,         // Template utilisé
  status: String,                // sent, delivered, failed, bounced
  gmail_message_id: String,      // ID message Gmail
  delivery_info: {               // Informations de livraison
    delivered_at: Date,
    read_at: Date,
    response_received: Boolean
  },
  sent_at: Date,
  created_at: Date
}
```

### Index de Performance
```javascript
// Index pour les requêtes fréquentes
db.subscriptions.createIndex({ "user_id": 1, "status": 1 });
db.subscriptions.createIndex({ "user_id": 1, "detected_at": -1 });
db.subscriptions.createIndex({ "email": 1, "service_name": 1 });
db.subscriptions.createIndex({ "category": 1, "status": 1 });

db.users.createIndex({ "google_id": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });

db.email_scans.createIndex({ "user_id": 1, "started_at": -1 });
db.sent_emails.createIndex({ "user_id": 1, "sent_at": -1 });
```

## 🔄 Flux de Données

### Flux d'Authentification
```
1. User → Frontend: Clic "Se connecter"
2. Frontend → Backend: GET /auth/google
3. Backend → Google: Redirection OAuth
4. Google → Backend: Code autorisation
5. Backend → Google: Échange code/tokens
6. Backend → Database: Stockage tokens chiffrés
7. Backend → Frontend: JWT + user info
8. Frontend → LocalStorage: Stockage JWT
```

### Flux de Scan d'Emails
```
1. User → Frontend: Clic "Scanner emails"
2. Frontend → Backend: POST /api/scan-email
3. Backend → Database: Création scan record
4. Backend → Gmail API: Récupération emails
5. Backend → EmailAnalyzer: Analyse emails
6. Backend → Database: Stockage subscriptions
7. Backend → Frontend: WebSocket updates
8. Frontend → User: Affichage résultats
```

### Flux de Désinscription
```
1. User → Frontend: Sélection subscription
2. Frontend → Backend: POST /generate-unsubscribe-email
3. Backend → EmailGenerator: Génération email
4. Backend → Frontend: Preview email
5. User → Frontend: Confirmation envoi
6. Frontend → Backend: POST /send-unsubscribe
7. Backend → Gmail API: Envoi email
8. Backend → Database: Update status
9. Backend → Frontend: Confirmation
```

## 🔒 Sécurité

### Authentification et Autorisation
- **OAuth 2.0** : Standard Google pour l'authentification
- **JWT Tokens** : Tokens d'accès avec expiration
- **Refresh Tokens** : Renouvellement automatique
- **CORS** : Configuration stricte des origines
- **Rate Limiting** : Limitation des requêtes par utilisateur

### Chiffrement et Stockage
- **Tokens OAuth** : Chiffrés en base avec Fernet
- **Communications** : HTTPS obligatoire en production
- **Variables sensibles** : Variables d'environnement
- **Logs** : Pas de stockage de données sensibles

### Validation et Sanitisation
- **Pydantic** : Validation stricte des données
- **Email Validation** : Validation format email
- **Input Sanitization** : Nettoyage des entrées utilisateur
- **SQL Injection** : Protection avec PyMongo

## ⚡ Performance

### Optimisations Backend
- **Connection Pooling** : Pool de connexions MongoDB
- **Async/Await** : Operations asynchrones
- **Caching** : Cache Redis pour données fréquentes
- **Pagination** : Limitation des résultats
- **Index Database** : Index optimisés MongoDB

### Optimisations Frontend
- **Code Splitting** : Division du bundle
- **Lazy Loading** : Chargement à la demande
- **Memoization** : Cache des composants React
- **Debouncing** : Limitation des appels API
- **Service Worker** : Cache ressources statiques

### Monitoring Performance
- **Métriques** : Prometheus + Grafana
- **APM** : Application Performance Monitoring
- **Logs** : ELK Stack pour l'analyse
- **Alertes** : Notifications automatiques

## 🚀 Évolutivité

### Scalabilité Horizontale
- **Microservices** : Séparation des responsabilités
- **Load Balancing** : Répartition de charge
- **Database Sharding** : Partitionnement des données
- **CDN** : Distribution du contenu statique

### Extensibilité Fonctionnelle
- **Plugin Architecture** : Système de plugins
- **API Versioning** : Gestion des versions API
- **Feature Flags** : Activation/désactivation features
- **Event Sourcing** : Historique des événements

### Architecture Cloud
- **Container Orchestration** : Kubernetes
- **Auto-scaling** : Mise à l'échelle automatique
- **Multi-region** : Déploiement multi-régions
- **Disaster Recovery** : Plan de récupération

---

*Architecture technique complète - Base solide pour le développement et l'évolution*