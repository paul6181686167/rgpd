# 🔌 Documentation API Complète

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification](#authentification)
3. [Endpoints](#endpoints)
4. [Modèles de Données](#modèles-de-données)
5. [Codes d'Erreur](#codes-derreur)
6. [Exemples d'Utilisation](#exemples-dutilisation)
7. [Limitations et Quotas](#limitations-et-quotas)

## 🌐 Vue d'ensemble

### URL de Base
```
http://localhost:8001
```

### Format des Données
- **Requêtes** : JSON
- **Réponses** : JSON
- **Encodage** : UTF-8

### Versioning
- Version actuelle : `v1`
- Préfixe des endpoints : `/api/`

### Headers Requis
```http
Content-Type: application/json
Accept: application/json
```

## 🔐 Authentification

### OAuth 2.0 avec Google

#### 1. Redirection vers Google
```http
GET /auth/google
```

**Réponse :**
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/auth?client_id=...",
  "state": "random_state_string"
}
```

#### 2. Callback après autorisation
```http
GET /auth/callback?code=AUTH_CODE&state=STATE
```

**Réponse :**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "1//04...",
  "expires_in": 3600,
  "user_info": {
    "email": "user@gmail.com",
    "name": "John Doe"
  }
}
```

#### 3. Utilisation du Token
```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## 🔌 Endpoints

### 1. Authentification

#### `GET /auth/google`
Initie le processus d'authentification OAuth 2.0.

**Paramètres :** Aucun

**Réponse :**
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/auth?...",
  "state": "secure_random_state"
}
```

#### `GET /auth/callback`
Traite le callback OAuth 2.0 après autorisation.

**Paramètres :**
- `code` (string) : Code d'autorisation de Google
- `state` (string) : État de sécurité

**Réponse :**
```json
{
  "access_token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "expires_in": 3600,
  "user_info": {
    "email": "user@gmail.com",
    "name": "John Doe"
  }
}
```

#### `POST /auth/refresh`
Rafraîchit le token d'accès.

**Body :**
```json
{
  "refresh_token": "refresh_token_here"
}
```

**Réponse :**
```json
{
  "access_token": "new_jwt_token",
  "expires_in": 3600
}
```

### 2. Scan d'Emails

#### `POST /api/scan-email`
Lance un scan de la boîte email pour détecter les abonnements.

**Headers :**
```http
Authorization: Bearer jwt_token_here
```

**Body :**
```json
{
  "max_emails": 100,
  "scan_period_days": 30,
  "include_folders": ["INBOX", "PROMOTIONS"]
}
```

**Réponse :**
```json
{
  "scan_id": "scan_12345",
  "status": "started",
  "estimated_duration": 120,
  "message": "Scan initié avec succès"
}
```

#### `GET /api/scan-status/{scan_id}`
Récupère le statut d'un scan.

**Headers :**
```http
Authorization: Bearer jwt_token_here
```

**Réponse :**
```json
{
  "scan_id": "scan_12345",
  "status": "completed",
  "progress": 100,
  "emails_scanned": 1250,
  "subscriptions_found": 23,
  "started_at": "2025-07-09T10:30:00Z",
  "completed_at": "2025-07-09T10:32:15Z"
}
```

### 3. Gestion des Abonnements

#### `GET /api/subscriptions`
Récupère la liste des abonnements détectés.

**Headers :**
```http
Authorization: Bearer jwt_token_here
```

**Paramètres de requête :**
- `status` (string, optionnel) : Filtrer par statut
- `page` (int, optionnel) : Numéro de page (défaut: 1)
- `limit` (int, optionnel) : Nombre d'éléments par page (défaut: 20)
- `sort` (string, optionnel) : Tri (detected_at, service_name)
- `order` (string, optionnel) : Ordre (asc, desc)

**Réponse :**
```json
{
  "subscriptions": [
    {
      "id": "sub_12345",
      "email": "user@gmail.com",
      "service_name": "Newsletter Tech",
      "sender_email": "no-reply@techcompany.com",
      "unsubscribe_link": "https://techcompany.com/unsubscribe?token=...",
      "unsubscribe_email": "unsubscribe@techcompany.com",
      "status": "detected",
      "detected_at": "2025-07-09T10:30:00Z",
      "unsubscribe_sent_at": null,
      "category": "technology",
      "frequency": "weekly",
      "last_email_date": "2025-07-08T15:22:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 23,
    "total_pages": 2
  },
  "statistics": {
    "total_subscriptions": 23,
    "detected": 15,
    "unsubscribe_sent": 5,
    "unsubscribed": 3
  }
}
```

#### `GET /api/subscriptions/{subscription_id}`
Récupère les détails d'un abonnement spécifique.

**Headers :**
```http
Authorization: Bearer jwt_token_here
```

**Réponse :**
```json
{
  "id": "sub_12345",
  "email": "user@gmail.com",
  "service_name": "Newsletter Tech",
  "sender_email": "no-reply@techcompany.com",
  "unsubscribe_link": "https://techcompany.com/unsubscribe?token=...",
  "unsubscribe_email": "unsubscribe@techcompany.com",
  "status": "detected",
  "detected_at": "2025-07-09T10:30:00Z",
  "unsubscribe_sent_at": null,
  "category": "technology",
  "frequency": "weekly",
  "last_email_date": "2025-07-08T15:22:00Z",
  "sample_emails": [
    {
      "subject": "Weekly Tech Newsletter #45",
      "date": "2025-07-08T15:22:00Z",
      "snippet": "Cette semaine : IA, blockchain, et nouvelles technologies..."
    }
  ]
}
```

#### `PUT /api/subscriptions/{subscription_id}/status`
Met à jour le statut d'un abonnement.

**Headers :**
```http
Authorization: Bearer jwt_token_here
```

**Body :**
```json
{
  "status": "unsubscribed",
  "note": "Désinscription confirmée manuellement"
}
```

**Réponse :**
```json
{
  "message": "Statut mis à jour avec succès",
  "subscription": {
    "id": "sub_12345",
    "status": "unsubscribed",
    "updated_at": "2025-07-09T11:45:00Z"
  }
}
```

### 4. Génération d'Emails de Désinscription

#### `POST /api/generate-unsubscribe-email/{subscription_id}`
Génère un email de désinscription personnalisé.

**Headers :**
```http
Authorization: Bearer jwt_token_here
```

**Body :**
```json
{
  "template": "polite",
  "language": "fr",
  "include_reason": true,
  "reason": "Trop d'emails reçus"
}
```

**Réponse :**
```json
{
  "email_content": {
    "to": "contact@techcompany.com",
    "subject": "Demande de désinscription",
    "body": "Madame, Monsieur,\n\nJe souhaite me désinscrire de votre liste de diffusion...",
    "html_body": "<p>Madame, Monsieur,</p><p>Je souhaite me désinscrire...</p>"
  },
  "preview_url": "http://localhost:8001/api/email-preview/12345",
  "template_used": "polite"
}
```

#### `GET /api/email-preview/{preview_id}`
Affiche un aperçu de l'email de désinscription.

**Headers :**
```http
Authorization: Bearer jwt_token_here
```

**Réponse :** Page HTML avec l'aperçu de l'email

### 5. Envoi d'Emails

#### `POST /api/send-unsubscribe`
Envoie un email de désinscription.

**Headers :**
```http
Authorization: Bearer jwt_token_here
```

**Body :**
```json
{
  "subscription_id": "sub_12345",
  "email_content": {
    "to": "contact@techcompany.com",
    "subject": "Demande de désinscription",
    "body": "Contenu de l'email..."
  },
  "send_copy_to_user": true
}
```

**Réponse :**
```json
{
  "message": "Email envoyé avec succès",
  "message_id": "msg_67890",
  "sent_at": "2025-07-09T12:00:00Z",
  "status": "sent"
}
```

#### `GET /api/sent-emails`
Récupère l'historique des emails envoyés.

**Headers :**
```http
Authorization: Bearer jwt_token_here
```

**Paramètres de requête :**
- `page` (int, optionnel) : Numéro de page
- `limit` (int, optionnel) : Nombre d'éléments par page
- `status` (string, optionnel) : Filtrer par statut

**Réponse :**
```json
{
  "sent_emails": [
    {
      "id": "msg_67890",
      "subscription_id": "sub_12345",
      "to": "contact@techcompany.com",
      "subject": "Demande de désinscription",
      "status": "sent",
      "sent_at": "2025-07-09T12:00:00Z",
      "delivery_status": "delivered",
      "response_received": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "total_pages": 1
  }
}
```

### 6. Statistiques et Rapports

#### `GET /api/statistics`
Récupère les statistiques générales.

**Headers :**
```http
Authorization: Bearer jwt_token_here
```

**Réponse :**
```json
{
  "overview": {
    "total_subscriptions": 23,
    "total_unsubscribed": 8,
    "success_rate": 85.7,
    "emails_sent": 15,
    "pending_responses": 7
  },
  "by_status": {
    "detected": 15,
    "unsubscribe_sent": 5,
    "unsubscribed": 3
  },
  "by_category": {
    "newsletter": 12,
    "shopping": 6,
    "social": 3,
    "services": 2
  },
  "timeline": [
    {
      "date": "2025-07-09",
      "subscriptions_detected": 23,
      "emails_sent": 15,
      "unsubscribed": 8
    }
  ]
}
```

#### `GET /api/export`
Exporte les données au format CSV ou JSON.

**Headers :**
```http
Authorization: Bearer jwt_token_here
```

**Paramètres de requête :**
- `format` (string) : Format d'export (csv, json)
- `type` (string) : Type de données (subscriptions, sent_emails, statistics)

**Réponse :**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="subscriptions_2025-07-09.csv"

id,service_name,sender_email,status,detected_at,unsubscribe_sent_at
sub_12345,Newsletter Tech,no-reply@techcompany.com,detected,2025-07-09T10:30:00Z,
...
```

## 📊 Modèles de Données

### Subscription
```json
{
  "id": "string",
  "email": "string",
  "service_name": "string",
  "sender_email": "string",
  "unsubscribe_link": "string|null",
  "unsubscribe_email": "string|null",
  "status": "detected|unsubscribe_sent|unsubscribed|failed",
  "detected_at": "datetime",
  "unsubscribe_sent_at": "datetime|null",
  "category": "string",
  "frequency": "string",
  "last_email_date": "datetime"
}
```

### SentEmail
```json
{
  "id": "string",
  "subscription_id": "string",
  "to": "string",
  "subject": "string",
  "body": "string",
  "status": "sent|delivered|failed|bounced",
  "sent_at": "datetime",
  "delivery_status": "string",
  "response_received": "boolean"
}
```

### ScanResult
```json
{
  "id": "string",
  "user_id": "string",
  "status": "started|running|completed|failed",
  "progress": "number",
  "emails_scanned": "number",
  "subscriptions_found": "number",
  "started_at": "datetime",
  "completed_at": "datetime|null",
  "error_message": "string|null"
}
```

## ⚠️ Codes d'Erreur

### Codes HTTP Standards
- `200` : Succès
- `201` : Créé
- `400` : Requête invalide
- `401` : Non autorisé
- `403` : Accès refusé
- `404` : Ressource introuvable
- `429` : Trop de requêtes
- `500` : Erreur serveur

### Codes d'Erreur Spécifiques

#### Authentification
```json
{
  "error": "INVALID_TOKEN",
  "message": "Token d'accès invalide ou expiré",
  "code": 401
}
```

#### Gmail API
```json
{
  "error": "GMAIL_API_ERROR",
  "message": "Erreur lors de l'accès à Gmail",
  "details": "Quota exceeded",
  "code": 429
}
```

#### Validation
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Données invalides",
  "details": {
    "email": ["Format d'email invalide"],
    "status": ["Statut non reconnu"]
  },
  "code": 400
}
```

## 💡 Exemples d'Utilisation

### 1. Flux Complet d'Authentification

```javascript
// 1. Initier l'authentification
const authResponse = await fetch('http://localhost:8001/auth/google');
const authData = await authResponse.json();

// 2. Rediriger l'utilisateur
window.location.href = authData.auth_url;

// 3. Après le callback, récupérer le token
const token = localStorage.getItem('access_token');
```

### 2. Scanner les Emails

```javascript
// Lancer un scan
const scanResponse = await fetch('http://localhost:8001/api/scan-email', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    max_emails: 100,
    scan_period_days: 30
  })
});

const scanData = await scanResponse.json();
const scanId = scanData.scan_id;

// Vérifier le statut du scan
const checkStatus = async () => {
  const statusResponse = await fetch(`http://localhost:8001/api/scan-status/${scanId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const statusData = await statusResponse.json();
  
  if (statusData.status === 'completed') {
    console.log('Scan terminé !');
    loadSubscriptions();
  } else {
    setTimeout(checkStatus, 2000);
  }
};

checkStatus();
```

### 3. Gérer les Abonnements

```javascript
// Récupérer les abonnements
const subscriptionsResponse = await fetch('http://localhost:8001/api/subscriptions', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const subscriptionsData = await subscriptionsResponse.json();

// Générer un email de désinscription
const generateEmailResponse = await fetch(`http://localhost:8001/api/generate-unsubscribe-email/${subscriptionId}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    template: 'polite',
    language: 'fr'
  })
});

const emailData = await generateEmailResponse.json();

// Envoyer l'email
const sendResponse = await fetch('http://localhost:8001/api/send-unsubscribe', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subscription_id: subscriptionId,
    email_content: emailData.email_content
  })
});
```

### 4. Pagination et Filtres

```javascript
// Récupérer les abonnements avec pagination et filtres
const getSubscriptions = async (page = 1, status = null) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    sort: 'detected_at',
    order: 'desc'
  });
  
  if (status) {
    params.append('status', status);
  }
  
  const response = await fetch(`http://localhost:8001/api/subscriptions?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

## 🔧 Limitations et Quotas

### Quotas Gmail API
- **Requêtes par jour** : 1,000,000,000
- **Requêtes par minute par utilisateur** : 250
- **Requêtes par seconde par utilisateur** : 25

### Limites de l'Application
- **Emails par scan** : 1,000 maximum
- **Scans simultanés** : 1 par utilisateur
- **Emails envoyés par heure** : 100 maximum
- **Taille des emails** : 25 MB maximum

### Rate Limiting
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1625832000
Retry-After: 60
```

### Gestion des Erreurs Rate Limiting

```javascript
const makeRequestWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## 🔒 Sécurité

### Headers de Sécurité
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

### Validation des Données
- Tous les inputs sont validés et nettoyés
- Protection contre l'injection SQL
- Validation des formats d'email
- Limitation de la taille des requêtes

### Chiffrement
- Toutes les communications sont chiffrées (HTTPS)
- Les tokens sont chiffrés en base de données
- Les credentials Gmail sont stockés de manière sécurisée

---

*Documentation API complète - Version 1.0*