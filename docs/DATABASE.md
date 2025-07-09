# 🗄️ Documentation Base de Données Complète

## 📋 Table des Matières

1. [Architecture Base de Données](#architecture-base-de-données)
2. [Schémas Détaillés](#schémas-détaillés)
3. [Relations et Index](#relations-et-index)
4. [Migrations](#migrations)
5. [Optimisation et Performance](#optimisation-et-performance)
6. [Sauvegarde et Récupération](#sauvegarde-et-récupération)
7. [Monitoring](#monitoring)

## 🏗️ Architecture Base de Données

### Vue d'Ensemble MongoDB
```
MongoDB: unsubscribe_app
├── users                 # Utilisateurs de l'application
├── subscriptions        # Abonnements détectés
├── email_scans         # Historique des scans
├── sent_emails         # Emails de désinscription envoyés
├── email_templates     # Templates d'emails
├── user_preferences    # Préférences utilisateur
├── analytics          # Données analytiques
└── system_logs        # Logs système
```

### Choix de MongoDB
**Avantages pour notre cas d'usage :**
- **Flexibilité du schéma** : Évolution facile des structures de données
- **Performance lectures** : Optimisé pour les requêtes de consultation
- **Scalabilité horizontale** : Sharding natif
- **Documents JSON** : Correspondance naturelle avec l'API REST
- **Index composites** : Performance optimale pour les requêtes complexes

## 📊 Schémas Détaillés

### Collection: users
```javascript
{
  // Identifiants
  _id: ObjectId("64a7f123456789abcdef0123"),
  id: "usr_1234567890abcdef",           // UUID unique pour l'API
  google_id: "1234567890123456789",     // ID Google OAuth unique
  
  // Informations personnelles
  email: "user@example.com",            // Email principal (unique)
  name: "John Doe",                     // Nom complet
  given_name: "John",                   // Prénom
  family_name: "Doe",                   // Nom de famille
  picture: "https://lh3.googleusercontent.com/...", // Photo de profil
  locale: "fr",                         // Langue préférée
  
  // Authentification et tokens
  gmail_tokens: {
    access_token: "encrypted_access_token",      // Token d'accès chiffré
    refresh_token: "encrypted_refresh_token",    // Token de refresh chiffré
    expires_at: ISODate("2025-07-10T10:30:00Z"), // Expiration du token
    scope: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send",
    token_type: "Bearer"
  },
  
  // Préférences utilisateur
  preferences: {
    language: "fr",                     // Langue de l'interface
    timezone: "Europe/Paris",           // Fuseau horaire
    email_template: "polite",           // Template par défaut
    scan_frequency: "weekly",           // Fréquence de scan automatique
    notifications: {
      email: true,                      // Notifications par email
      browser: true,                    // Notifications navigateur
      scan_complete: true,              // Notification fin de scan
      unsubscribe_success: true         // Notification désinscription réussie
    },
    privacy: {
      analytics: true,                  // Accepte les analytics
      data_retention_days: 365          // Durée de rétention des données
    },
    ui: {
      theme: "light",                   // Thème interface (light/dark)
      items_per_page: 20,               // Éléments par page
      default_sort: "detected_at_desc"   // Tri par défaut
    }
  },
  
  // Statistiques utilisateur
  stats: {
    total_scans: 15,                    // Nombre total de scans
    total_subscriptions: 87,            // Total abonnements détectés
    total_unsubscribed: 34,             // Total désinscriptions
    total_emails_sent: 42,              // Total emails envoyés
    success_rate: 0.81,                 // Taux de réussite (0-1)
    avg_scan_duration: 45.2,            // Durée moyenne scan (secondes)
    last_scan: ISODate("2025-07-09T14:30:00Z"),
    first_scan: ISODate("2025-06-15T09:20:00Z")
  },
  
  // Quotas et limites
  quotas: {
    daily_scans: 10,                    // Scans autorisés par jour
    daily_emails: 100,                  // Emails autorisés par jour
    monthly_scans: 100,                 // Scans autorisés par mois
    max_subscriptions: 1000             // Abonnements max stockés
  },
  
  // Usage actuel
  usage: {
    scans_today: 2,                     // Scans effectués aujourd'hui
    emails_today: 15,                   // Emails envoyés aujourd'hui
    scans_this_month: 28,               // Scans ce mois
    last_activity: ISODate("2025-07-09T16:45:00Z")
  },
  
  // Métadonnées système
  created_at: ISODate("2025-06-15T09:20:00Z"),
  updated_at: ISODate("2025-07-09T16:45:00Z"),
  last_login: ISODate("2025-07-09T08:30:00Z"),
  status: "active",                     // active, suspended, deleted
  version: 1                            // Version du schéma
}
```

### Collection: subscriptions
```javascript
{
  // Identifiants
  _id: ObjectId("64a7f123456789abcdef0124"),
  id: "sub_1234567890abcdef",           // UUID unique pour l'API
  user_id: "usr_1234567890abcdef",      // Référence vers users.id
  
  // Informations de base
  email: "user@example.com",            // Email de l'utilisateur
  service_name: "TechCrunch Newsletter", // Nom du service
  service_domain: "techcrunch.com",     // Domaine du service
  sender_email: "newsletter@techcrunch.com", // Email expéditeur
  sender_name: "TechCrunch Team",       // Nom expéditeur
  
  // Informations de désinscription
  unsubscribe_methods: {
    link: "https://techcrunch.com/unsubscribe?token=abc123", // Lien de désinscription
    email: "unsubscribe@techcrunch.com", // Email de désinscription
    reply_to: "no-reply@techcrunch.com", // Email de réponse
    instructions: "Reply STOP to unsubscribe" // Instructions textuelles
  },
  
  // Métadonnées email
  email_metadata: {
    list_id: "<newsletter.techcrunch.com>", // Header List-ID
    list_unsubscribe: "<mailto:unsubscribe@techcrunch.com>, <https://techcrunch.com/unsubscribe>",
    message_id_pattern: "^[0-9]+\.newsletter@techcrunch\.com$",
    return_path: "bounce@techcrunch.com",
    mailing_list: "TechCrunch Daily"
  },
  
  // Classification
  category: "newsletter",               // newsletter, ecommerce, social, services, marketing
  subcategory: "technology",            // Sous-catégorie spécifique
  tags: ["tech", "startup", "news"],   // Tags additionnels
  
  // Analyse de fréquence
  frequency: {
    detected_pattern: "daily",          // daily, weekly, monthly, irregular
    emails_per_week: 7,                 // Moyenne emails par semaine
    typical_days: [1, 2, 3, 4, 5],     // Jours d'envoi typiques (1=lundi)
    typical_hours: [8, 9, 10],         // Heures d'envoi typiques
    last_email_date: ISODate("2025-07-09T09:00:00Z"),
    first_email_date: ISODate("2025-06-01T09:00:00Z")
  },
  
  // Statut et workflow
  status: "detected",                   // detected, unsubscribe_sent, unsubscribed, failed, manual
  workflow: {
    detected_at: ISODate("2025-07-09T10:30:00Z"),
    unsubscribe_generated_at: ISODate("2025-07-09T11:00:00Z"),
    unsubscribe_sent_at: ISODate("2025-07-09T11:05:00Z"),
    unsubscribed_at: null,              // Date de désinscription confirmée
    last_attempt_at: ISODate("2025-07-09T11:05:00Z"),
    retry_count: 0,                     // Nombre de tentatives
    next_retry_at: null                 // Prochaine tentative programmée
  },
  
  // Métriques et analyse
  metrics: {
    email_count: 42,                    // Nombre total d'emails reçus
    confidence_score: 0.95,             // Score de confiance (0-1)
    importance_score: 0.7,              // Score d'importance (0-1)
    spam_likelihood: 0.1,               // Probabilité de spam (0-1)
    user_engagement: 0.3,               // Engagement utilisateur estimé (0-1)
    avg_email_size: 45678,              // Taille moyenne email (bytes)
    has_images: true,                   // Contient des images
    has_tracking: true                  // Contient du tracking
  },
  
  // Données d'apprentissage ML
  ml_features: {
    header_features: {
      has_list_id: true,
      has_precedence_bulk: true,
      has_auto_submitted: false,
      authentication_results: "dkim=pass spf=pass"
    },
    content_features: {
      unsubscribe_keywords: ["unsubscribe", "opt-out", "remove"],
      marketing_keywords: ["offer", "deal", "sale", "discount"],
      newsletter_keywords: ["newsletter", "digest", "update"],
      html_to_text_ratio: 0.8,
      link_count: 15,
      image_count: 8
    },
    behavioral_features: {
      time_since_subscription: 1209600,  // Secondes depuis inscription
      email_frequency_days: 1,           // Fréquence en jours
      user_interaction_rate: 0.2         // Taux d'interaction utilisateur
    }
  },
  
  // Historique des actions
  action_history: [
    {
      action: "detected",
      timestamp: ISODate("2025-07-09T10:30:00Z"),
      details: { scan_id: "scan_123", confidence: 0.95 }
    },
    {
      action: "email_generated",
      timestamp: ISODate("2025-07-09T11:00:00Z"),
      details: { template: "polite", language: "fr" }
    },
    {
      action: "email_sent",
      timestamp: ISODate("2025-07-09T11:05:00Z"),
      details: { message_id: "msg_456", method: "email" }
    }
  ],
  
  // Informations de débogage
  debug_info: {
    detection_method: "ml_classifier",   // Méthode de détection utilisée
    detection_rules: ["list_id_present", "unsubscribe_link_found"],
    processing_notes: "High confidence detection based on List-ID header",
    sample_email_ids: ["email_123", "email_124"], // IDs d'emails échantillons
    false_positive_risk: 0.05           // Risque de faux positif
  },
  
  // Métadonnées système
  created_at: ISODate("2025-07-09T10:30:00Z"),
  updated_at: ISODate("2025-07-09T11:05:00Z"),
  version: 1
}
```

### Collection: email_scans
```javascript
{
  // Identifiants
  _id: ObjectId("64a7f123456789abcdef0125"),
  id: "scan_1234567890abcdef",
  user_id: "usr_1234567890abcdef",
  
  // Configuration du scan
  config: {
    max_emails: 100,                    // Limite d'emails à analyser
    date_range: {
      from: ISODate("2025-06-01T00:00:00Z"),
      to: ISODate("2025-07-09T23:59:59Z")
    },
    folders: ["INBOX", "PROMOTIONS"],   // Dossiers Gmail à scanner
    filters: {
      exclude_domains: ["gmail.com", "internal.company.com"],
      min_confidence: 0.5,              // Score minimum pour considérer
      exclude_categories: ["transactional"]
    },
    advanced_options: {
      deep_analysis: true,              // Analyse approfondie du contenu
      ml_classification: true,          // Utiliser ML pour classification
      pattern_matching: true,           // Utiliser pattern matching
      header_analysis: true             // Analyser les en-têtes
    }
  },
  
  // Statut et progression
  status: "completed",                  // started, running, completed, failed, cancelled
  progress: {
    current: 100,                       // Progression actuelle (%)
    emails_processed: 847,              // Emails traités
    emails_analyzed: 847,               // Emails analysés
    subscriptions_found: 23,            // Abonnements trouvés
    false_positives_filtered: 5,        // Faux positifs filtrés
    processing_rate: 12.5               // Emails par seconde
  },
  
  // Résultats détaillés
  results: {
    summary: {
      total_emails_scanned: 847,
      subscriptions_detected: 23,
      new_subscriptions: 18,
      updated_subscriptions: 5,
      processing_time_seconds: 67.8
    },
    by_category: {
      newsletter: 12,
      ecommerce: 6,
      social: 3,
      services: 2
    },
    by_confidence: {
      high: 18,      // >0.8
      medium: 4,     // 0.5-0.8
      low: 1         // <0.5
    },
    detection_methods: {
      ml_classifier: 15,
      pattern_matching: 6,
      header_analysis: 2
    }
  },
  
  // Performance et métriques
  performance: {
    start_time: ISODate("2025-07-09T10:30:00Z"),
    end_time: ISODate("2025-07-09T10:31:08Z"),
    peak_memory_mb: 256,
    gmail_api_calls: 12,
    gmail_quota_used: 0.048,            // % du quota utilisé
    errors_encountered: 0
  },
  
  // Erreurs et avertissements
  errors: [],
  warnings: [
    {
      type: "quota_warning",
      message: "Approaching daily quota limit",
      timestamp: ISODate("2025-07-09T10:30:45Z")
    }
  ],
  
  // Échantillons pour débogage
  debug_samples: {
    detected_subscriptions: [
      {
        email_id: "email_123",
        from: "newsletter@example.com",
        subject: "Weekly Newsletter #45",
        confidence: 0.92,
        detection_method: "ml_classifier"
      }
    ],
    false_positives_avoided: [
      {
        email_id: "email_456",
        from: "friend@personal.com",
        reason: "personal_email_filter",
        confidence_before_filter: 0.7
      }
    ]
  },
  
  // Métadonnées
  triggered_by: "manual",               // manual, scheduled, api
  scan_type: "full",                    // full, incremental, targeted
  created_at: ISODate("2025-07-09T10:30:00Z"),
  completed_at: ISODate("2025-07-09T10:31:08Z")
}
```

### Collection: sent_emails
```javascript
{
  // Identifiants
  _id: ObjectId("64a7f123456789abcdef0126"),
  id: "email_1234567890abcdef",
  user_id: "usr_1234567890abcdef",
  subscription_id: "sub_1234567890abcdef",
  
  // Contenu de l'email
  email_data: {
    to: "unsubscribe@service.com",
    from: "user@example.com",
    subject: "Demande de désinscription",
    body_text: "Madame, Monsieur...",   // Version texte
    body_html: "<p>Madame, Monsieur...</p>", // Version HTML
    template_used: "polite_french",
    language: "fr",
    personalization: {
      user_name: "John Doe",
      service_name: "Service Newsletter",
      subscription_date: "2025-06-01"
    }
  },
  
  // Informations d'envoi
  sending: {
    method: "gmail_api",                // gmail_api, smtp, manual
    gmail_message_id: "123456789abcdef", // ID du message Gmail
    gmail_thread_id: "987654321fedcba",  // ID du thread Gmail
    retry_count: 0,                     // Nombre de tentatives
    scheduled_at: null,                 // Envoi programmé
    sent_at: ISODate("2025-07-09T11:05:00Z")
  },
  
  // Statut de livraison
  delivery: {
    status: "delivered",                // sent, delivered, failed, bounced, rejected
    delivery_time: ISODate("2025-07-09T11:05:23Z"),
    bounce_reason: null,                // Raison du bounce si applicable
    smtp_response: "250 Message accepted",
    tracking_id: "track_789xyz"
  },
  
  // Suivi des réponses
  response_tracking: {
    response_received: true,
    response_type: "auto_confirmation", // auto_confirmation, manual_reply, bounce
    response_time: ISODate("2025-07-09T11:06:15Z"),
    response_content: "You have been unsubscribed",
    unsubscribe_confirmed: true,
    confirmation_method: "email_content" // email_content, link_click, manual
  },
  
  // Métriques
  metrics: {
    open_tracking: {
      opened: true,
      open_time: ISODate("2025-07-09T11:05:45Z"),
      open_count: 1,
      user_agent: "Mozilla/5.0..."
    },
    click_tracking: {
      links_clicked: [],
      total_clicks: 0
    },
    processing_time_ms: 234            // Temps de traitement
  },
  
  // Résultat final
  outcome: {
    success: true,
    unsubscribed: true,
    needs_followup: false,
    followup_reason: null,
    notes: "Automatic confirmation received",
    manual_verification_required: false
  },
  
  // Historique des statuts
  status_history: [
    {
      status: "queued",
      timestamp: ISODate("2025-07-09T11:04:00Z")
    },
    {
      status: "sent",
      timestamp: ISODate("2025-07-09T11:05:00Z")
    },
    {
      status: "delivered",
      timestamp: ISODate("2025-07-09T11:05:23Z")
    },
    {
      status: "confirmed",
      timestamp: ISODate("2025-07-09T11:06:15Z")
    }
  ],
  
  // Métadonnées
  created_at: ISODate("2025-07-09T11:04:00Z"),
  updated_at: ISODate("2025-07-09T11:06:15Z")
}
```

## 🔗 Relations et Index

### Index de Performance

#### Index Principaux
```javascript
// Users
db.users.createIndex({ "google_id": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "id": 1 }, { unique: true });
db.users.createIndex({ "status": 1, "last_login": -1 });

// Subscriptions - Index critiques pour performance
db.subscriptions.createIndex({ "user_id": 1, "status": 1 });
db.subscriptions.createIndex({ "user_id": 1, "detected_at": -1 });
db.subscriptions.createIndex({ "email": 1, "service_name": 1 });
db.subscriptions.createIndex({ "category": 1, "status": 1 });
db.subscriptions.createIndex({ "sender_email": 1 });
db.subscriptions.createIndex({ "confidence_score": -1 });

// Index composites pour requêtes complexes
db.subscriptions.createIndex({ 
  "user_id": 1, 
  "category": 1, 
  "status": 1, 
  "detected_at": -1 
});

// Index texte pour recherche
db.subscriptions.createIndex({
  "service_name": "text",
  "sender_email": "text",
  "sender_name": "text"
});

// Email Scans
db.email_scans.createIndex({ "user_id": 1, "created_at": -1 });
db.email_scans.createIndex({ "status": 1, "created_at": -1 });
db.email_scans.createIndex({ "user_id": 1, "status": 1 });

// Sent Emails
db.sent_emails.createIndex({ "user_id": 1, "sent_at": -1 });
db.sent_emails.createIndex({ "subscription_id": 1 });
db.sent_emails.createIndex({ "delivery.status": 1, "sent_at": -1 });
db.sent_emails.createIndex({ "user_id": 1, "outcome.success": 1 });
```

#### Index Partiels pour Optimisation
```javascript
// Index seulement sur les abonnements actifs
db.subscriptions.createIndex(
  { "user_id": 1, "detected_at": -1 },
  { partialFilterExpression: { "status": { $in: ["detected", "unsubscribe_sent"] } } }
);

// Index sur les emails récents seulement
db.sent_emails.createIndex(
  { "user_id": 1, "sent_at": -1 },
  { partialFilterExpression: { "sent_at": { $gte: new Date("2025-01-01") } } }
);

// Index sur les scans en cours
db.email_scans.createIndex(
  { "user_id": 1, "created_at": -1 },
  { partialFilterExpression: { "status": { $in: ["started", "running"] } } }
);
```

### Requêtes Optimisées

#### Requêtes Fréquentes avec Explain Plan
```javascript
// 1. Récupérer les abonnements d'un utilisateur avec pagination
db.subscriptions.find({
  "user_id": "usr_123",
  "status": { $in: ["detected", "unsubscribe_sent"] }
}).sort({ "detected_at": -1 }).limit(20).explain("executionStats");

// 2. Statistiques utilisateur
db.subscriptions.aggregate([
  { $match: { "user_id": "usr_123" } },
  { $group: {
    _id: "$status",
    count: { $sum: 1 },
    avg_confidence: { $avg: "$metrics.confidence_score" }
  }}
]).explain("executionStats");

// 3. Recherche textuelle
db.subscriptions.find({
  $text: { $search: "newsletter tech" },
  "user_id": "usr_123"
}).explain("executionStats");
```

## 🔄 Migrations

### Script de Migration Base
```javascript
// migrations/001_initial_schema.js
const migration_001 = {
  version: 1,
  description: "Initial schema setup",
  
  up: function(db) {
    // Créer les collections
    db.createCollection("users");
    db.createCollection("subscriptions");
    db.createCollection("email_scans");
    db.createCollection("sent_emails");
    
    // Créer les index de base
    db.users.createIndex({ "google_id": 1 }, { unique: true });
    db.users.createIndex({ "email": 1 }, { unique: true });
    db.subscriptions.createIndex({ "user_id": 1, "status": 1 });
    db.email_scans.createIndex({ "user_id": 1, "created_at": -1 });
    db.sent_emails.createIndex({ "subscription_id": 1 });
  },
  
  down: function(db) {
    // Rollback - supprimer les collections
    db.users.drop();
    db.subscriptions.drop();
    db.email_scans.drop();
    db.sent_emails.drop();
  }
};
```

### Système de Migration
```python
# backend/database/migrations.py
from pymongo import MongoClient
import logging
from datetime import datetime

class MigrationManager:
    def __init__(self, db):
        self.db = db
        self.logger = logging.getLogger('migrations')
        
        # Collection pour suivre les migrations
        if 'migrations' not in db.list_collection_names():
            db.create_collection('migrations')
    
    def run_migrations(self):
        """Exécuter toutes les migrations en attente"""
        current_version = self.get_current_version()
        available_migrations = self.get_available_migrations()
        
        for migration in available_migrations:
            if migration['version'] > current_version:
                self.logger.info(f"Running migration {migration['version']}: {migration['description']}")
                try:
                    migration['up'](self.db)
                    self.record_migration(migration)
                    self.logger.info(f"Migration {migration['version']} completed")
                except Exception as e:
                    self.logger.error(f"Migration {migration['version']} failed: {e}")
                    raise
    
    def get_current_version(self):
        """Obtenir la version actuelle de la base"""
        latest = self.db.migrations.find_one(sort=[('version', -1)])
        return latest['version'] if latest else 0
    
    def record_migration(self, migration):
        """Enregistrer une migration comme appliquée"""
        self.db.migrations.insert_one({
            'version': migration['version'],
            'description': migration['description'],
            'applied_at': datetime.now()
        })
```

### Migrations Spécifiques

#### Migration: Ajout Métriques ML
```javascript
// migrations/002_add_ml_metrics.js
const migration_002 = {
  version: 2,
  description: "Add ML metrics to subscriptions",
  
  up: function(db) {
    // Ajouter le champ ml_features à tous les documents existants
    db.subscriptions.updateMany(
      { "ml_features": { $exists: false } },
      { 
        $set: { 
          "ml_features": {
            "header_features": {},
            "content_features": {},
            "behavioral_features": {}
          },
          "version": 2
        }
      }
    );
    
    // Créer un index sur les features ML
    db.subscriptions.createIndex({ 
      "ml_features.confidence_score": -1 
    });
  },
  
  down: function(db) {
    // Supprimer le champ ml_features
    db.subscriptions.updateMany(
      {},
      { 
        $unset: { "ml_features": "" },
        $set: { "version": 1 }
      }
    );
    
    db.subscriptions.dropIndex({ 
      "ml_features.confidence_score": -1 
    });
  }
};
```

## ⚡ Optimisation et Performance

### Configuration MongoDB Optimale

#### Configuration mongod.conf
```yaml
# /etc/mongod.conf
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2          # Ajuster selon RAM disponible
      directoryForIndexes: true
    collectionConfig:
      blockCompressor: snappy
    indexConfig:
      prefixCompression: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
  logRotate: rename

net:
  port: 27017
  bindIp: 127.0.0.1

operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 100     # Profiler les opérations > 100ms

setParameter:
  failIndexKeyTooLong: false
  notablescan: false         # Autoriser les scans de table en dev
```

### Optimisation des Requêtes

#### Analyse des Performances
```javascript
// Activer le profiler pour analyser les requêtes lentes
db.setProfilingLevel(2, { slowms: 100 });

// Analyser les requêtes les plus lentes
db.system.profile.find().sort({ ts: -1 }).limit(5).pretty();

// Exemple d'optimisation d'une requête lente
// AVANT: Scan complet
db.subscriptions.find({
  "user_id": "usr_123",
  "metrics.confidence_score": { $gte: 0.8 }
}).explain("executionStats");

// APRÈS: Ajout d'index composé
db.subscriptions.createIndex({ 
  "user_id": 1, 
  "metrics.confidence_score": -1 
});
```

#### Optimisation Mémoire
```javascript
// Utiliser projection pour limiter les données récupérées
db.subscriptions.find(
  { "user_id": "usr_123" },
  { 
    "service_name": 1,
    "sender_email": 1,
    "status": 1,
    "detected_at": 1 
  }
);

// Utiliser allowDiskUse pour les gros aggregations
db.subscriptions.aggregate([
  { $match: { "status": "detected" } },
  { $group: { _id: "$category", count: { $sum: 1 } } },
  { $sort: { "count": -1 } }
], { allowDiskUse: true });
```

### Monitoring Performance

#### Métriques Clés à Surveiller
```python
# backend/monitoring/db_metrics.py
import pymongo
from pymongo import MongoClient
import time

class DatabaseMetrics:
    def __init__(self, mongo_uri):
        self.client = MongoClient(mongo_uri)
        self.db = self.client.unsubscribe_app
    
    def get_performance_metrics(self):
        """Récupérer les métriques de performance"""
        stats = self.db.command("dbStats")
        server_status = self.db.command("serverStatus")
        
        return {
            "database": {
                "collections": stats["collections"],
                "objects": stats["objects"], 
                "dataSize": stats["dataSize"],
                "indexSize": stats["indexSize"],
                "storageSize": stats["storageSize"]
            },
            "connections": {
                "current": server_status["connections"]["current"],
                "available": server_status["connections"]["available"]
            },
            "operations": {
                "query": server_status["opcounters"]["query"],
                "insert": server_status["opcounters"]["insert"],
                "update": server_status["opcounters"]["update"],
                "delete": server_status["opcounters"]["delete"]
            },
            "memory": {
                "resident": server_status["mem"]["resident"],
                "virtual": server_status["mem"]["virtual"],
                "mapped": server_status["mem"].get("mapped", 0)
            }
        }
    
    def check_slow_queries(self):
        """Identifier les requêtes lentes"""
        slow_queries = list(self.db.system.profile.find({
            "millis": { "$gte": 100 }
        }).sort("ts", -1).limit(10))
        
        return slow_queries
    
    def get_index_usage(self):
        """Analyser l'utilisation des index"""
        collections = ["users", "subscriptions", "email_scans", "sent_emails"]
        index_stats = {}
        
        for collection in collections:
            stats = list(self.db[collection].aggregate([
                { "$indexStats": {} }
            ]))
            index_stats[collection] = stats
        
        return index_stats
```

## 💾 Sauvegarde et Récupération

### Stratégie de Sauvegarde

#### Script de Sauvegarde Automatisée
```bash
#!/bin/bash
# backup_mongodb.sh

# Configuration
DB_NAME="unsubscribe_app"
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Créer le répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarde complète
echo "Starting MongoDB backup..."
mongodump --db $DB_NAME --out $BACKUP_DIR/$DATE

# Compression
echo "Compressing backup..."
tar -czf $BACKUP_DIR/backup_${DB_NAME}_$DATE.tar.gz -C $BACKUP_DIR $DATE

# Nettoyage du dossier temporaire
rm -rf $BACKUP_DIR/$DATE

# Vérification de l'intégrité
echo "Verifying backup integrity..."
if tar -tzf $BACKUP_DIR/backup_${DB_NAME}_$DATE.tar.gz >/dev/null; then
    echo "Backup verification successful"
else
    echo "Backup verification failed"
    exit 1
fi

# Nettoyage des anciennes sauvegardes
echo "Cleaning old backups..."
find $BACKUP_DIR -name "backup_${DB_NAME}_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Upload vers le cloud (optionnel)
if [ "$CLOUD_BACKUP" = "true" ]; then
    echo "Uploading to cloud storage..."
    aws s3 cp $BACKUP_DIR/backup_${DB_NAME}_$DATE.tar.gz s3://your-backup-bucket/mongodb/
fi

echo "Backup completed: backup_${DB_NAME}_$DATE.tar.gz"
```

#### Sauvegarde Incrémentale
```bash
#!/bin/bash
# incremental_backup.sh

# Utiliser l'oplog pour les sauvegardes incrémentales
LAST_BACKUP_TIME=$(cat /var/lib/mongodb-backup/last_backup_timestamp)
CURRENT_TIME=$(date +%s)

# Sauvegarde oplog depuis la dernière sauvegarde
mongodump --db local --collection oplog.rs \
    --query "{ ts: { \$gte: Timestamp($LAST_BACKUP_TIME, 0) } }" \
    --out /backups/oplog_$(date +%Y%m%d_%H%M%S)

# Sauvegarder le timestamp actuel
echo $CURRENT_TIME > /var/lib/mongodb-backup/last_backup_timestamp
```

### Procédures de Récupération

#### Restauration Complète
```bash
#!/bin/bash
# restore_mongodb.sh

BACKUP_FILE=$1
DB_NAME="unsubscribe_app"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.tar.gz>"
    exit 1
fi

# Arrêter l'application
echo "Stopping application..."
sudo supervisorctl stop all

# Extraire la sauvegarde
echo "Extracting backup..."
TEMP_DIR=$(mktemp -d)
tar -xzf $BACKUP_FILE -C $TEMP_DIR

# Supprimer la base existante (ATTENTION!)
echo "Dropping existing database..."
mongo $DB_NAME --eval "db.dropDatabase()"

# Restaurer
echo "Restoring database..."
mongorestore $TEMP_DIR/*/

# Vérifier la restauration
echo "Verifying restoration..."
COLLECTIONS=$(mongo $DB_NAME --quiet --eval "db.getCollectionNames().length")
if [ "$COLLECTIONS" -gt 0 ]; then
    echo "Restoration successful - $COLLECTIONS collections restored"
else
    echo "Restoration failed - no collections found"
    exit 1
fi

# Reconstruire les index
echo "Rebuilding indexes..."
mongo $DB_NAME --eval "db.runCommand({reIndex: 'subscriptions'})"
mongo $DB_NAME --eval "db.runCommand({reIndex: 'users'})"

# Redémarrer l'application
echo "Starting application..."
sudo supervisorctl start all

# Nettoyage
rm -rf $TEMP_DIR

echo "Database restoration completed successfully"
```

#### Point-in-Time Recovery
```bash
#!/bin/bash
# point_in_time_recovery.sh

TARGET_TIME=$1  # Format: 2025-07-09T15:30:00Z

if [ -z "$TARGET_TIME" ]; then
    echo "Usage: $0 <target_time_iso8601>"
    exit 1
fi

# Convertir en timestamp
TARGET_TIMESTAMP=$(date -d "$TARGET_TIME" +%s)

# Restaurer la dernière sauvegarde complète avant le target time
LAST_FULL_BACKUP=$(find /backups -name "backup_*.tar.gz" \
    -newermt "$(date -d '@0')" ! -newermt "$TARGET_TIME" \
    | sort | tail -1)

echo "Using full backup: $LAST_FULL_BACKUP"
./restore_mongodb.sh $LAST_FULL_BACKUP

# Appliquer les oplogs jusqu'au point cible
echo "Applying oplog entries until $TARGET_TIME..."
mongorestore --oplogReplay --oplogLimit $TARGET_TIMESTAMP:0 \
    /backups/oplog_*/local/
```

## 📊 Monitoring

### Alertes MongoDB
```python
# monitoring/alerts.py
import pymongo
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText

class MongoDBAlerts:
    def __init__(self, mongo_uri, alert_config):
        self.client = MongoClient(mongo_uri)
        self.db = self.client.unsubscribe_app
        self.alert_config = alert_config
    
    def check_connection_limit(self):
        """Vérifier les limites de connexions"""
        status = self.db.command("serverStatus")
        current = status["connections"]["current"]
        available = status["connections"]["available"]
        usage_percent = (current / (current + available)) * 100
        
        if usage_percent > 80:
            self.send_alert(
                "MongoDB Connection Alert",
                f"Connection usage at {usage_percent:.1f}% ({current} active)"
            )
    
    def check_slow_queries(self):
        """Vérifier les requêtes lentes"""
        one_hour_ago = datetime.now() - timedelta(hours=1)
        slow_queries = self.db.system.profile.count_documents({
            "ts": {"$gte": one_hour_ago},
            "millis": {"$gte": 1000}  # Plus de 1 seconde
        })
        
        if slow_queries > 10:
            self.send_alert(
                "MongoDB Slow Queries Alert", 
                f"{slow_queries} slow queries in the last hour"
            )
    
    def check_disk_usage(self):
        """Vérifier l'utilisation disque"""
        stats = self.db.command("dbStats")
        storage_size_gb = stats["storageSize"] / (1024**3)
        
        if storage_size_gb > 5:  # Alerte si > 5GB
            self.send_alert(
                "MongoDB Disk Usage Alert",
                f"Database size: {storage_size_gb:.2f} GB"
            )
    
    def send_alert(self, subject, message):
        """Envoyer une alerte par email"""
        msg = MIMEText(message)
        msg['Subject'] = subject
        msg['From'] = self.alert_config['from_email']
        msg['To'] = self.alert_config['to_email']
        
        with smtplib.SMTP(self.alert_config['smtp_server']) as server:
            server.send_message(msg)
```

### Dashboard Monitoring
```python
# monitoring/dashboard.py
from flask import Flask, jsonify, render_template
import pymongo
from datetime import datetime, timedelta

app = Flask(__name__)

@app.route('/api/mongodb/status')
def mongodb_status():
    """API endpoint pour le statut MongoDB"""
    client = MongoClient()
    db = client.unsubscribe_app
    
    try:
        # Test de connexion
        db.command("ping")
        
        # Statistiques
        stats = db.command("dbStats")
        server_status = db.command("serverStatus")
        
        return jsonify({
            "status": "healthy",
            "uptime": server_status["uptime"],
            "connections": server_status["connections"],
            "operations": server_status["opcounters"],
            "database": {
                "collections": stats["collections"],
                "objects": stats["objects"],
                "dataSize": stats["dataSize"],
                "indexSize": stats["indexSize"]
            }
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

@app.route('/dashboard')
def dashboard():
    """Dashboard de monitoring"""
    return render_template('mongodb_dashboard.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

---

*Documentation base de données complète - Foundation solide pour le stockage et la performance*