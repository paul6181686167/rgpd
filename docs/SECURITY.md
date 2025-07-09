# 🔒 Guide de Sécurité Complet

## 📋 Table des Matières

1. [Vue d'Ensemble Sécurité](#vue-densemble-sécurité)
2. [Authentification et Autorisation](#authentification-et-autorisation)
3. [Protection des Données](#protection-des-données)
4. [Sécurité API](#sécurité-api)
5. [Sécurité Infrastructure](#sécurité-infrastructure)
6. [Audit et Monitoring](#audit-et-monitoring)
7. [Procédures d'Incident](#procédures-dincident)

## 🛡️ Vue d'Ensemble Sécurité

### Modèle de Menaces

#### Acteurs de Menace
1. **Utilisateurs malveillants** : Exploitation des fonctionnalités
2. **Attaquants externes** : Tentatives d'intrusion
3. **Insiders malveillants** : Accès privilégié compromis
4. **Scripts automatisés** : Bots et scrapers

#### Assets Critiques
1. **Tokens OAuth Gmail** : Accès aux comptes utilisateurs
2. **Emails et métadonnées** : Données personnelles sensibles
3. **Base de données** : Informations complètes utilisateurs
4. **Infrastructure** : Serveurs et services

#### Vecteurs d'Attaque
1. **Injection** : SQL, NoSQL, Code injection
2. **Authentification** : Bypass, credential stuffing
3. **Session** : Hijacking, fixation
4. **API** : Rate limiting bypass, data exposure
5. **Infrastructure** : RCE, privilege escalation

### Matrice de Risque
```
Impact vs Probabilité:

                   Faible    Moyen    Élevé
Catastrophique  |   M   |   E   |   C   |
Majeur         |   F   |   M   |   E   |  
Mineur         |   T   |   F   |   M   |

F=Faible, M=Moyen, E=Élevé, C=Critique, T=Très faible
```

## 🔐 Authentification et Autorisation

### OAuth 2.0 avec Google

#### Configuration Sécurisée
```python
# backend/auth/oauth_config.py
from google.oauth2 import id_token
from google.auth.transport import requests
import os
from cryptography.fernet import Fernet

class SecureOAuthConfig:
    def __init__(self):
        self.client_id = os.environ.get('GOOGLE_CLIENT_ID')
        self.client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = os.environ.get('GOOGLE_REDIRECT_URI')
        
        # Validation des variables critiques
        if not all([self.client_id, self.client_secret, self.redirect_uri]):
            raise ValueError("Missing critical OAuth configuration")
        
        # Chiffrement des tokens
        encryption_key = os.environ.get('TOKEN_ENCRYPTION_KEY')
        if not encryption_key:
            encryption_key = Fernet.generate_key()
            print(f"Generated encryption key: {encryption_key.decode()}")
        
        self.cipher = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
        
        # Scopes minimaux requis
        self.scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    
    def validate_token(self, token):
        """Valider un token ID Google"""
        try:
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                self.client_id
            )
            
            # Vérifications additionnelles
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            if idinfo['aud'] != self.client_id:
                raise ValueError('Wrong audience.')
            
            return idinfo
            
        except ValueError as e:
            print(f"Token validation failed: {e}")
            return None
    
    def encrypt_token(self, token):
        """Chiffrer un token avant stockage"""
        return self.cipher.encrypt(token.encode()).decode()
    
    def decrypt_token(self, encrypted_token):
        """Déchiffrer un token"""
        return self.cipher.decrypt(encrypted_token.encode()).decode()
```

#### Gestion Sécurisée des Sessions
```python
# backend/auth/session_manager.py
import jwt
import secrets
from datetime import datetime, timedelta
from typing import Optional
import redis

class SecureSessionManager:
    def __init__(self, secret_key: str, redis_client: redis.Redis):
        self.secret_key = secret_key
        self.redis = redis_client
        self.algorithm = 'HS256'
        self.access_token_expire = timedelta(minutes=30)
        self.refresh_token_expire = timedelta(days=7)
    
    def create_access_token(self, user_id: str, email: str) -> str:
        """Créer un token d'accès JWT"""
        
        # Payload minimal pour réduire la surface d'attaque
        payload = {
            'user_id': user_id,
            'email': email,
            'type': 'access',
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + self.access_token_expire,
            'jti': secrets.token_urlsafe(16)  # Unique token ID
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(self, user_id: str) -> str:
        """Créer un token de refresh"""
        
        token = secrets.token_urlsafe(32)
        
        # Stocker dans Redis avec expiration
        self.redis.setex(
            f"refresh_token:{user_id}:{token}",
            self.refresh_token_expire,
            user_id
        )
        
        return token
    
    def verify_access_token(self, token: str) -> Optional[dict]:
        """Vérifier un token d'accès"""
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm]
            )
            
            # Vérifications additionnelles
            if payload.get('type') != 'access':
                return None
            
            # Vérifier si le token n'est pas blacklisté
            jti = payload.get('jti')
            if jti and self.redis.exists(f"blacklist:{jti}"):
                return None
            
            return payload
            
        except jwt.InvalidTokenError:
            return None
    
    def verify_refresh_token(self, token: str, user_id: str) -> bool:
        """Vérifier un token de refresh"""
        
        stored_user_id = self.redis.get(f"refresh_token:{user_id}:{token}")
        return stored_user_id and stored_user_id.decode() == user_id
    
    def blacklist_token(self, jti: str, expire_time: datetime):
        """Blacklister un token"""
        
        remaining_time = expire_time - datetime.utcnow()
        if remaining_time.total_seconds() > 0:
            self.redis.setex(
                f"blacklist:{jti}",
                int(remaining_time.total_seconds()),
                "1"
            )
    
    def revoke_refresh_token(self, token: str, user_id: str):
        """Révoquer un token de refresh"""
        self.redis.delete(f"refresh_token:{user_id}:{token}")
    
    def revoke_all_user_tokens(self, user_id: str):
        """Révoquer tous les tokens d'un utilisateur"""
        
        # Trouver tous les refresh tokens de l'utilisateur
        pattern = f"refresh_token:{user_id}:*"
        keys = self.redis.keys(pattern)
        
        if keys:
            self.redis.delete(*keys)
```

### Contrôle d'Accès (RBAC)

#### Modèle de Permissions
```python
# backend/auth/permissions.py
from enum import Enum
from typing import Set, List
from functools import wraps

class Permission(Enum):
    # Permissions de base
    READ_OWN_DATA = "read_own_data"
    WRITE_OWN_DATA = "write_own_data"
    
    # Permissions email
    SCAN_EMAILS = "scan_emails"
    SEND_UNSUBSCRIBE = "send_unsubscribe"
    
    # Permissions admin
    READ_ALL_DATA = "read_all_data"
    MANAGE_USERS = "manage_users"
    SYSTEM_ADMIN = "system_admin"

class Role(Enum):
    USER = "user"
    PREMIUM_USER = "premium_user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class RolePermissions:
    ROLE_PERMISSIONS = {
        Role.USER: {
            Permission.READ_OWN_DATA,
            Permission.WRITE_OWN_DATA,
            Permission.SCAN_EMAILS,
            Permission.SEND_UNSUBSCRIBE
        },
        Role.PREMIUM_USER: {
            Permission.READ_OWN_DATA,
            Permission.WRITE_OWN_DATA,
            Permission.SCAN_EMAILS,
            Permission.SEND_UNSUBSCRIBE,
            # Permissions supplémentaires pour premium
        },
        Role.ADMIN: {
            Permission.READ_ALL_DATA,
            Permission.MANAGE_USERS,
            # Toutes les permissions utilisateur
            *ROLE_PERMISSIONS[Role.USER]
        },
        Role.SUPER_ADMIN: {
            Permission.SYSTEM_ADMIN,
            # Toutes les permissions
            *[perm for perms in ROLE_PERMISSIONS.values() for perm in perms]
        }
    }
    
    @classmethod
    def get_permissions(cls, role: Role) -> Set[Permission]:
        return cls.ROLE_PERMISSIONS.get(role, set())
    
    @classmethod
    def has_permission(cls, role: Role, permission: Permission) -> bool:
        return permission in cls.get_permissions(role)

def require_permission(permission: Permission):
    """Décorateur pour vérifier les permissions"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Récupérer l'utilisateur actuel (à adapter selon votre setup)
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            user_role = Role(current_user.get('role', 'user'))
            if not RolePermissions.has_permission(user_role, permission):
                raise HTTPException(status_code=403, detail="Insufficient permissions")
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Utilisation
@app.get("/api/admin/users")
@require_permission(Permission.READ_ALL_DATA)
async def get_all_users(current_user: dict = Depends(get_current_user)):
    # Logique pour récupérer tous les utilisateurs
    pass
```

## 🛡️ Protection des Données

### Chiffrement des Données Sensibles

#### Chiffrement au Repos
```python
# backend/security/encryption.py
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os

class DataEncryption:
    def __init__(self, master_key: str = None):
        if master_key:
            # Dériver une clé à partir du master key
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b'stable_salt_unsubscribe_app',  # En production, utiliser un salt aléatoire
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(master_key.encode()))
        else:
            # Générer une nouvelle clé
            key = Fernet.generate_key()
        
        self.cipher = Fernet(key)
    
    def encrypt_oauth_tokens(self, tokens: dict) -> dict:
        """Chiffrer les tokens OAuth"""
        encrypted_tokens = {}
        
        sensitive_fields = ['access_token', 'refresh_token']
        
        for field, value in tokens.items():
            if field in sensitive_fields and value:
                encrypted_tokens[field] = self.cipher.encrypt(value.encode()).decode()
            else:
                encrypted_tokens[field] = value
        
        return encrypted_tokens
    
    def decrypt_oauth_tokens(self, encrypted_tokens: dict) -> dict:
        """Déchiffrer les tokens OAuth"""
        decrypted_tokens = {}
        
        sensitive_fields = ['access_token', 'refresh_token']
        
        for field, value in encrypted_tokens.items():
            if field in sensitive_fields and value:
                decrypted_tokens[field] = self.cipher.decrypt(value.encode()).decode()
            else:
                decrypted_tokens[field] = value
        
        return decrypted_tokens
    
    def encrypt_email_content(self, content: str) -> str:
        """Chiffrer le contenu d'email sensible"""
        return self.cipher.encrypt(content.encode()).decode()
    
    def decrypt_email_content(self, encrypted_content: str) -> str:
        """Déchiffrer le contenu d'email"""
        return self.cipher.decrypt(encrypted_content.encode()).decode()

# Service de chiffrement global
encryption_service = DataEncryption(os.environ.get('MASTER_ENCRYPTION_KEY'))
```

#### Hashage Sécurisé
```python
# backend/security/hashing.py
import hashlib
import secrets
from typing import Tuple

class SecureHashing:
    @staticmethod
    def hash_password(password: str) -> Tuple[str, str]:
        """Hasher un mot de passe avec salt"""
        
        # Générer un salt aléatoire
        salt = secrets.token_hex(32)
        
        # Hasher avec PBKDF2
        pwdhash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000  # Iterations
        )
        
        return pwdhash.hex(), salt
    
    @staticmethod
    def verify_password(password: str, stored_hash: str, salt: str) -> bool:
        """Vérifier un mot de passe"""
        
        pwdhash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        
        return pwdhash.hex() == stored_hash
    
    @staticmethod
    def hash_sensitive_data(data: str) -> str:
        """Hasher des données sensibles pour l'indexation"""
        
        # Utiliser SHA-256 pour les données non-critiques
        return hashlib.sha256(data.encode()).hexdigest()
```

### Validation et Sanitisation

#### Validation Stricte des Entrées
```python
# backend/security/validation.py
import re
import html
from email_validator import validate_email, EmailNotValidError
from urllib.parse import urlparse
from typing import Optional

class InputValidator:
    
    # Patterns de validation
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    
    @staticmethod
    def validate_email_address(email: str) -> bool:
        """Validation stricte d'email"""
        try:
            # Validation basique avec regex
            if not InputValidator.EMAIL_PATTERN.match(email):
                return False
            
            # Validation avancée avec email-validator
            validate_email(email)
            return True
            
        except EmailNotValidError:
            return False
    
    @staticmethod
    def validate_uuid(uuid_string: str) -> bool:
        """Validation d'UUID"""
        return bool(InputValidator.UUID_PATTERN.match(uuid_string.lower()))
    
    @staticmethod
    def sanitize_html(content: str) -> str:
        """Sanitiser le contenu HTML"""
        return html.escape(content)
    
    @staticmethod
    def validate_url(url: str) -> bool:
        """Validation d'URL"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc]) and result.scheme in ['http', 'https']
        except:
            return False
    
    @staticmethod
    def sanitize_service_name(name: str) -> str:
        """Sanitiser le nom de service"""
        # Supprimer les caractères dangereux
        sanitized = re.sub(r'[<>"\'/\\]', '', name)
        return sanitized.strip()[:100]  # Limiter la longueur
    
    @staticmethod
    def validate_subscription_status(status: str) -> bool:
        """Valider le statut d'abonnement"""
        valid_statuses = ['detected', 'unsubscribe_sent', 'unsubscribed', 'failed']
        return status in valid_statuses

class RequestValidator:
    """Validation des requêtes API"""
    
    MAX_REQUEST_SIZE = 1024 * 1024  # 1MB
    MAX_ARRAY_LENGTH = 1000
    
    @staticmethod
    def validate_pagination(page: int, limit: int) -> Tuple[int, int]:
        """Valider les paramètres de pagination"""
        page = max(1, min(page, 10000))  # Entre 1 et 10000
        limit = max(1, min(limit, 100))   # Entre 1 et 100
        return page, limit
    
    @staticmethod
    def validate_request_size(content_length: int) -> bool:
        """Valider la taille de la requête"""
        return content_length <= RequestValidator.MAX_REQUEST_SIZE
    
    @staticmethod
    def validate_array_length(array: list) -> bool:
        """Valider la longueur d'un array"""
        return len(array) <= RequestValidator.MAX_ARRAY_LENGTH
```

## 🔐 Sécurité API

### Rate Limiting et Throttling

#### Implémentation Rate Limiting
```python
# backend/security/rate_limiting.py
import redis
import time
from typing import Optional
from fastapi import HTTPException
from functools import wraps

class RateLimiter:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        """Vérifier si une requête est autorisée (sliding window)"""
        
        now = time.time()
        pipeline = self.redis.pipeline()
        
        # Nettoyer les entrées expirées
        pipeline.zremrangebyscore(key, 0, now - window)
        
        # Compter les requêtes dans la fenêtre
        pipeline.zcard(key)
        
        # Ajouter la requête actuelle
        pipeline.zadd(key, {str(now): now})
        
        # Définir l'expiration
        pipeline.expire(key, window)
        
        results = pipeline.execute()
        current_count = results[1]
        
        return current_count < limit
    
    def get_remaining_requests(self, key: str, limit: int, window: int) -> int:
        """Obtenir le nombre de requêtes restantes"""
        
        now = time.time()
        
        # Nettoyer et compter
        self.redis.zremrangebyscore(key, 0, now - window)
        current_count = self.redis.zcard(key)
        
        return max(0, limit - current_count)

# Décorateurs pour rate limiting
def rate_limit(requests_per_minute: int = 60):
    """Décorateur pour limiter le taux de requêtes"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Récupérer l'IP ou l'ID utilisateur
            request = kwargs.get('request')
            user_id = kwargs.get('current_user', {}).get('id')
            
            # Utiliser user_id si disponible, sinon IP
            if user_id:
                key = f"rate_limit:user:{user_id}"
            else:
                client_ip = request.client.host if request else "unknown"
                key = f"rate_limit:ip:{client_ip}"
            
            limiter = RateLimiter(redis_client)
            
            if not limiter.is_allowed(key, requests_per_minute, 60):
                remaining = limiter.get_remaining_requests(key, requests_per_minute, 60)
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limit exceeded. Remaining: {remaining}",
                    headers={"X-RateLimit-Remaining": str(remaining)}
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Rate limiting spécialisé pour les scans email
def email_scan_rate_limit(scans_per_hour: int = 10):
    """Rate limiting spécial pour les scans email"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            user_id = kwargs.get('current_user', {}).get('id')
            if not user_id:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            key = f"email_scan_limit:user:{user_id}"
            limiter = RateLimiter(redis_client)
            
            if not limiter.is_allowed(key, scans_per_hour, 3600):
                remaining = limiter.get_remaining_requests(key, scans_per_hour, 3600)
                raise HTTPException(
                    status_code=429,
                    detail=f"Email scan limit exceeded. Remaining: {remaining} scans per hour"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
```

### Protection CSRF et XSS

#### Middleware CSRF
```python
# backend/security/csrf.py
import secrets
import hmac
import hashlib
from fastapi import Request, HTTPException
from fastapi.middleware.base import BaseHTTPMiddleware

class CSRFMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, secret_key: str):
        super().__init__(app)
        self.secret_key = secret_key
        self.safe_methods = {'GET', 'HEAD', 'OPTIONS', 'TRACE'}
    
    async def dispatch(self, request: Request, call_next):
        # Ignorer les méthodes sûres
        if request.method in self.safe_methods:
            return await call_next(request)
        
        # Vérifier le token CSRF
        csrf_token = request.headers.get('X-CSRF-Token')
        if not csrf_token:
            raise HTTPException(status_code=403, detail="CSRF token missing")
        
        if not self.verify_csrf_token(csrf_token):
            raise HTTPException(status_code=403, detail="CSRF token invalid")
        
        return await call_next(request)
    
    def generate_csrf_token(self) -> str:
        """Générer un token CSRF"""
        random_data = secrets.token_urlsafe(32)
        
        signature = hmac.new(
            self.secret_key.encode(),
            random_data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return f"{random_data}:{signature}"
    
    def verify_csrf_token(self, token: str) -> bool:
        """Vérifier un token CSRF"""
        try:
            data, signature = token.split(':', 1)
            
            expected_signature = hmac.new(
                self.secret_key.encode(),
                data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
        except ValueError:
            return False
```

#### Protection XSS
```python
# backend/security/xss_protection.py
import html
import re
from typing import Dict, Any

class XSSProtection:
    
    # Liste des balises autorisées (pour du contenu riche si nécessaire)
    ALLOWED_TAGS = {
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote'
    }
    
    # Patterns dangereux à bloquer
    DANGEROUS_PATTERNS = [
        r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>',
        r'javascript:',
        r'vbscript:',
        r'onload\s*=',
        r'onerror\s*=',
        r'onclick\s*=',
        r'onmouseover\s*=',
    ]
    
    @classmethod
    def sanitize_string(cls, text: str) -> str:
        """Sanitiser une chaîne de caractères"""
        if not isinstance(text, str):
            return str(text)
        
        # Échapper les caractères HTML
        sanitized = html.escape(text)
        
        # Supprimer les patterns dangereux
        for pattern in cls.DANGEROUS_PATTERNS:
            sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
        
        return sanitized
    
    @classmethod
    def sanitize_dict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitiser récursivement un dictionnaire"""
        sanitized = {}
        
        for key, value in data.items():
            if isinstance(value, str):
                sanitized[key] = cls.sanitize_string(value)
            elif isinstance(value, dict):
                sanitized[key] = cls.sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    cls.sanitize_string(item) if isinstance(item, str)
                    else cls.sanitize_dict(item) if isinstance(item, dict)
                    else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        
        return sanitized
    
    @classmethod
    def validate_email_content(cls, content: str) -> str:
        """Validation spéciale pour le contenu d'email"""
        
        # Sanitiser d'abord
        sanitized = cls.sanitize_string(content)
        
        # Vérifications supplémentaires pour les emails
        if len(sanitized) > 10000:  # Limite de taille
            raise ValueError("Email content too long")
        
        # Vérifier qu'il n'y a pas de liens suspects
        suspicious_domains = ['bit.ly', 'tinyurl.com', 'suspicious-site.com']
        for domain in suspicious_domains:
            if domain in sanitized.lower():
                raise ValueError(f"Suspicious domain detected: {domain}")
        
        return sanitized
```

## 🏗️ Sécurité Infrastructure

### Configuration Sécurisée des Serveurs

#### Durcissement MongoDB
```javascript
// Sécurisation MongoDB
// /etc/mongod.conf

# Liaison réseau sécurisée
net:
  bindIp: 127.0.0.1,::1  # Écouter seulement en local
  port: 27017

# Activation de l'authentification
security:
  authorization: enabled
  clusterAuthMode: keyFile
  keyFile: /etc/mongodb-keyfile

# Chiffrement des données
storage:
  engine: wiredTiger
  wiredTiger:
    engineConfig:
      directoryForIndexes: true
    collectionConfig:
      blockCompressor: snappy
    indexConfig:
      prefixCompression: true

# Audit des connexions
auditLog:
  destination: file
  format: JSON
  path: /var/log/mongodb/audit.log
  filter: '{ "atype": { "$in": ["authenticate", "authCheck", "createUser", "dropUser"] } }'

# Logging sécurisé
systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true
  logRotate: rename
```

#### Configuration Nginx Sécurisée
```nginx
# /etc/nginx/sites-available/unsubscribe-app

server {
    listen 443 ssl http2;
    server_name unsubscribe-app.com;
    
    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/unsubscribe-app.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/unsubscribe-app.com/privkey.pem;
    
    # Configuration SSL sécurisée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 24h;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Headers de sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://www.googleapis.com;" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    # Frontend
    location / {
        root /var/www/unsubscribe-app/build;
        try_files $uri $uri/ /index.html;
        
        # Cache statique
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Backend
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffer_size 64k;
        proxy_buffers 4 64k;
        proxy_busy_buffers_size 128k;
    }
    
    # API de login avec rate limiting strict
    location /api/auth/ {
        limit_req zone=login burst=5 nodelay;
        
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Bloquer l'accès aux fichiers sensibles
    location ~ /\. {
        deny all;
    }
    
    location ~* \.(env|log|conf)$ {
        deny all;
    }
}

# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name unsubscribe-app.com;
    return 301 https://$server_name$request_uri;
}
```

### Monitoring Sécurisé

#### Système de Détection d'Intrusion
```python
# backend/security/ids.py
import time
import logging
from collections import defaultdict, deque
from typing import Dict, List
from datetime import datetime, timedelta

class IntrusionDetectionSystem:
    def __init__(self):
        self.failed_attempts = defaultdict(deque)  # IP -> tentatives
        self.suspicious_patterns = defaultdict(int)  # Pattern -> count
        self.blocked_ips = {}  # IP -> expiration time
        self.logger = logging.getLogger('security.ids')
        
        # Seuils de détection
        self.MAX_FAILED_ATTEMPTS = 5
        self.FAILED_ATTEMPT_WINDOW = 300  # 5 minutes
        self.BLOCK_DURATION = 3600  # 1 heure
        
        # Patterns suspects
        self.SUSPICIOUS_PATTERNS = [
            'admin', 'administrator', 'root', 'test',
            'password', 'login', 'api', 'config',
            'backup', 'database', 'sql', 'injection'
        ]
    
    def record_failed_login(self, ip: str, user_identifier: str = None):
        """Enregistrer une tentative de connexion échouée"""
        
        current_time = time.time()
        
        # Nettoyer les anciennes tentatives
        while (self.failed_attempts[ip] and 
               current_time - self.failed_attempts[ip][0] > self.FAILED_ATTEMPT_WINDOW):
            self.failed_attempts[ip].popleft()
        
        # Ajouter la nouvelle tentative
        self.failed_attempts[ip].append(current_time)
        
        # Vérifier si l'IP doit être bloquée
        if len(self.failed_attempts[ip]) >= self.MAX_FAILED_ATTEMPTS:
            self.block_ip(ip, "Too many failed login attempts")
            self.logger.warning(f"IP {ip} blocked for excessive failed login attempts")
        
        # Logger l'événement
        self.logger.info(f"Failed login attempt from {ip} for user {user_identifier}")
    
    def record_suspicious_activity(self, ip: str, activity: str, details: dict = None):
        """Enregistrer une activité suspecte"""
        
        self.logger.warning(f"Suspicious activity from {ip}: {activity} - {details}")
        
        # Analyser les patterns
        for pattern in self.SUSPICIOUS_PATTERNS:
            if pattern.lower() in activity.lower():
                self.suspicious_patterns[f"{ip}:{pattern}"] += 1
                
                if self.suspicious_patterns[f"{ip}:{pattern}"] >= 3:
                    self.block_ip(ip, f"Suspicious pattern: {pattern}")
                    break
    
    def block_ip(self, ip: str, reason: str):
        """Bloquer une adresse IP"""
        
        expiration = time.time() + self.BLOCK_DURATION
        self.blocked_ips[ip] = {
            'expiration': expiration,
            'reason': reason,
            'blocked_at': datetime.now()
        }
        
        self.logger.critical(f"IP {ip} blocked: {reason}")
    
    def is_ip_blocked(self, ip: str) -> bool:
        """Vérifier si une IP est bloquée"""
        
        if ip not in self.blocked_ips:
            return False
        
        # Vérifier l'expiration
        if time.time() > self.blocked_ips[ip]['expiration']:
            del self.blocked_ips[ip]
            return False
        
        return True
    
    def get_blocked_ips(self) -> Dict:
        """Obtenir la liste des IPs bloquées"""
        
        # Nettoyer les IPs expirées
        current_time = time.time()
        expired_ips = [
            ip for ip, info in self.blocked_ips.items()
            if current_time > info['expiration']
        ]
        
        for ip in expired_ips:
            del self.blocked_ips[ip]
        
        return self.blocked_ips
    
    def unblock_ip(self, ip: str):
        """Débloquer manuellement une IP"""
        
        if ip in self.blocked_ips:
            del self.blocked_ips[ip]
            self.logger.info(f"IP {ip} manually unblocked")

# Middleware d'intégration
class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.ids = IntrusionDetectionSystem()
    
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        
        # Vérifier si l'IP est bloquée
        if self.ids.is_ip_blocked(client_ip):
            self.logger.warning(f"Blocked IP {client_ip} attempted access")
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Analyser la requête pour détecter des patterns suspects
        path = request.url.path.lower()
        user_agent = request.headers.get('user-agent', '').lower()
        
        # Détecter les tentatives de scan
        suspicious_paths = [
            '/admin', '/wp-admin', '/phpmyadmin', '/.env',
            '/config', '/backup', '/database', '/api/v1/admin'
        ]
        
        if any(sus_path in path for sus_path in suspicious_paths):
            self.ids.record_suspicious_activity(
                client_ip, 
                f"Suspicious path access: {path}",
                {'user_agent': user_agent}
            )
        
        response = await call_next(request)
        
        # Analyser la réponse pour détecter des attaques
        if response.status_code == 401:
            # Tentative d'authentification échouée
            self.ids.record_failed_login(client_ip)
        
        return response
```

## 🔍 Audit et Monitoring

### Logging Sécurisé

#### Configuration Audit Logger
```python
# backend/security/audit_logger.py
import logging
import json
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional

class SecurityAuditLogger:
    def __init__(self, log_file: str = "security_audit.log"):
        self.logger = logging.getLogger('security_audit')
        
        # Handler pour les logs d'audit
        handler = logging.FileHandler(log_file)
        handler.setLevel(logging.INFO)
        
        # Format JSON pour faciliter l'analyse
        formatter = logging.Formatter('%(message)s')
        handler.setFormatter(formatter)
        
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def log_authentication_event(self, event_type: str, user_id: str, 
                                ip: str, success: bool, details: Dict = None):
        """Logger les événements d'authentification"""
        
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': f'auth_{event_type}',
            'user_id': user_id,
            'ip_address': ip,
            'success': success,
            'details': details or {},
            'severity': 'INFO' if success else 'WARNING'
        }
        
        self.logger.info(json.dumps(event))
    
    def log_data_access(self, user_id: str, resource: str, action: str, 
                       ip: str, success: bool, details: Dict = None):
        """Logger les accès aux données"""
        
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'data_access',
            'user_id': user_id,
            'resource': resource,
            'action': action,
            'ip_address': ip,
            'success': success,
            'details': details or {},
            'severity': 'INFO' if success else 'ERROR'
        }
        
        self.logger.info(json.dumps(event))
    
    def log_privilege_escalation(self, user_id: str, from_role: str, 
                               to_role: str, granted_by: str, ip: str):
        """Logger les changements de privilèges"""
        
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'privilege_escalation',
            'user_id': user_id,
            'from_role': from_role,
            'to_role': to_role,
            'granted_by': granted_by,
            'ip_address': ip,
            'severity': 'HIGH'
        }
        
        self.logger.info(json.dumps(event))
    
    def log_security_violation(self, violation_type: str, user_id: str, 
                             ip: str, details: Dict):
        """Logger les violations de sécurité"""
        
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'security_violation',
            'violation_type': violation_type,
            'user_id': user_id,
            'ip_address': ip,
            'details': details,
            'severity': 'CRITICAL'
        }
        
        self.logger.info(json.dumps(event))
    
    def log_gmail_api_access(self, user_id: str, action: str, 
                           email_count: int, ip: str):
        """Logger spécifiquement les accès Gmail API"""
        
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'gmail_api_access',
            'user_id': user_id,
            'action': action,
            'email_count': email_count,
            'ip_address': ip,
            'severity': 'INFO'
        }
        
        self.logger.info(json.dumps(event))

# Instance globale
security_audit = SecurityAuditLogger()
```

### Alertes de Sécurité

#### Système d'Alertes Automatisées
```python
# backend/security/alerting.py
import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict
from datetime import datetime

class SecurityAlertSystem:
    def __init__(self, smtp_config: Dict):
        self.smtp_config = smtp_config
        self.alert_recipients = smtp_config.get('recipients', [])
        
        # Seuils d'alerte
        self.CRITICAL_FAILED_LOGINS = 10
        self.SUSPICIOUS_ACTIVITY_THRESHOLD = 5
        
    async def send_alert(self, severity: str, title: str, message: str, 
                        details: Dict = None):
        """Envoyer une alerte de sécurité"""
        
        if not self.alert_recipients:
            return
        
        subject = f"[SECURITY {severity}] {title}"
        
        body = f"""
Security Alert: {title}
Severity: {severity}
Time: {datetime.utcnow().isoformat()}

Message:
{message}

Details:
{json.dumps(details, indent=2) if details else 'None'}

--
Unsubscribe App Security System
        """
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self.smtp_config['from_email']
            msg['To'] = ', '.join(self.alert_recipients)
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(self.smtp_config['server'], self.smtp_config['port']) as server:
                if self.smtp_config.get('use_tls'):
                    server.starttls()
                
                if self.smtp_config.get('username'):
                    server.login(
                        self.smtp_config['username'],
                        self.smtp_config['password']
                    )
                
                server.send_message(msg)
            
            print(f"Security alert sent: {title}")
            
        except Exception as e:
            print(f"Failed to send security alert: {e}")
    
    async def check_failed_logins(self):
        """Vérifier les tentatives de connexion échouées"""
        
        # Cette méthode serait appelée périodiquement
        # pour analyser les logs et détecter des patterns
        
        # Exemple de logique de détection
        recent_failures = self.analyze_recent_failed_logins()
        
        if recent_failures['count'] > self.CRITICAL_FAILED_LOGINS:
            await self.send_alert(
                "CRITICAL",
                "Excessive Failed Login Attempts",
                f"{recent_failures['count']} failed login attempts detected",
                recent_failures
            )
    
    async def detect_brute_force(self, ip: str, attempts: int):
        """Détecter une attaque par force brute"""
        
        if attempts >= 5:
            await self.send_alert(
                "HIGH",
                "Potential Brute Force Attack",
                f"IP {ip} made {attempts} failed login attempts",
                {'ip': ip, 'attempts': attempts}
            )
    
    async def detect_privilege_escalation(self, user_id: str, old_role: str, new_role: str):
        """Détecter une escalade de privilèges suspecte"""
        
        if new_role in ['admin', 'super_admin']:
            await self.send_alert(
                "HIGH",
                "Privilege Escalation Detected",
                f"User {user_id} role changed from {old_role} to {new_role}",
                {'user_id': user_id, 'old_role': old_role, 'new_role': new_role}
            )

# Analyseur de logs de sécurité
class SecurityLogAnalyzer:
    def __init__(self, log_file: str):
        self.log_file = log_file
    
    def analyze_patterns(self) -> Dict:
        """Analyser les patterns dans les logs de sécurité"""
        
        patterns = {
            'failed_logins': 0,
            'suspicious_ips': set(),
            'privilege_changes': 0,
            'data_access_violations': 0
        }
        
        try:
            with open(self.log_file, 'r') as f:
                for line in f:
                    try:
                        event = json.loads(line.strip())
                        event_type = event.get('event_type', '')
                        
                        if event_type == 'auth_login' and not event.get('success'):
                            patterns['failed_logins'] += 1
                            patterns['suspicious_ips'].add(event.get('ip_address'))
                        
                        elif event_type == 'privilege_escalation':
                            patterns['privilege_changes'] += 1
                        
                        elif event_type == 'security_violation':
                            patterns['data_access_violations'] += 1
                    
                    except json.JSONDecodeError:
                        continue
        
        except FileNotFoundError:
            pass
        
        patterns['suspicious_ips'] = list(patterns['suspicious_ips'])
        return patterns
```

## 🚨 Procédures d'Incident

### Plan de Réponse aux Incidents

#### Processus de Réponse
```python
# backend/security/incident_response.py
from enum import Enum
from datetime import datetime
from typing import List, Dict, Optional

class IncidentSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentType(Enum):
    DATA_BREACH = "data_breach"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    MALWARE = "malware"
    DDOS = "ddos"
    SYSTEM_COMPROMISE = "system_compromise"
    INSIDER_THREAT = "insider_threat"

class SecurityIncident:
    def __init__(self, incident_type: IncidentType, severity: IncidentSeverity,
                 description: str, affected_systems: List[str] = None):
        self.id = f"INC-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        self.type = incident_type
        self.severity = severity
        self.description = description
        self.affected_systems = affected_systems or []
        self.created_at = datetime.now()
        self.status = "OPEN"
        self.timeline = []
        self.containment_actions = []
        self.investigation_notes = []
    
    def add_timeline_entry(self, action: str, details: str = ""):
        """Ajouter une entrée à la timeline"""
        entry = {
            'timestamp': datetime.now(),
            'action': action,
            'details': details
        }
        self.timeline.append(entry)
    
    def add_containment_action(self, action: str, implemented: bool = False):
        """Ajouter une action de confinement"""
        containment = {
            'action': action,
            'implemented': implemented,
            'timestamp': datetime.now()
        }
        self.containment_actions.append(containment)

class IncidentResponseManager:
    def __init__(self):
        self.active_incidents = {}
        self.response_teams = {
            IncidentSeverity.CRITICAL: ['security_lead', 'cto', 'ceo'],
            IncidentSeverity.HIGH: ['security_lead', 'dev_lead'],
            IncidentSeverity.MEDIUM: ['security_team'],
            IncidentSeverity.LOW: ['on_call_engineer']
        }
    
    def create_incident(self, incident_type: IncidentType, 
                       severity: IncidentSeverity, description: str,
                       affected_systems: List[str] = None) -> SecurityIncident:
        """Créer un nouvel incident de sécurité"""
        
        incident = SecurityIncident(incident_type, severity, description, affected_systems)
        self.active_incidents[incident.id] = incident
        
        # Actions immédiates selon la gravité
        if severity == IncidentSeverity.CRITICAL:
            self.execute_critical_response(incident)
        elif severity == IncidentSeverity.HIGH:
            self.execute_high_response(incident)
        
        # Notification de l'équipe
        self.notify_response_team(incident)
        
        return incident
    
    def execute_critical_response(self, incident: SecurityIncident):
        """Réponse immédiate pour les incidents critiques"""
        
        # Actions automatiques de confinement
        actions = [
            "Isoler les systèmes affectés du réseau",
            "Activer le plan de continuité d'activité",
            "Contacter les autorités si nécessaire",
            "Préparer la communication de crise"
        ]
        
        for action in actions:
            incident.add_containment_action(action)
            incident.add_timeline_entry("CONTAINMENT", action)
    
    def execute_high_response(self, incident: SecurityIncident):
        """Réponse pour les incidents de haute gravité"""
        
        actions = [
            "Analyser l'étendue de l'incident",
            "Isoler les systèmes compromis",
            "Collecter les preuves forensiques"
        ]
        
        for action in actions:
            incident.add_containment_action(action)
    
    def notify_response_team(self, incident: SecurityIncident):
        """Notifier l'équipe de réponse appropriée"""
        
        team = self.response_teams.get(incident.severity, [])
        
        # En réalité, ceci enverrait des notifications
        print(f"Notifying team {team} for incident {incident.id}")
        
        incident.add_timeline_entry("NOTIFICATION", f"Team notified: {', '.join(team)}")

# Playbooks de réponse spécifiques
class DataBreachPlaybook:
    """Playbook spécifique pour les violations de données"""
    
    @staticmethod
    def execute(incident: SecurityIncident):
        """Exécuter le playbook de violation de données"""
        
        # Étape 1: Confinement immédiat
        incident.add_timeline_entry("CONTAINMENT", "Immediate system isolation")
        
        # Étape 2: Évaluation de l'impact
        incident.add_timeline_entry("ASSESSMENT", "Evaluating data exposure")
        
        # Étape 3: Notifications légales
        incident.add_timeline_entry("COMPLIANCE", "Preparing GDPR notifications")
        
        # Étape 4: Communication
        incident.add_timeline_entry("COMMUNICATION", "Preparing user notifications")

class UnauthorizedAccessPlaybook:
    """Playbook pour les accès non autorisés"""
    
    @staticmethod
    def execute(incident: SecurityIncident):
        """Exécuter le playbook d'accès non autorisé"""
        
        # Étape 1: Révocation des accès
        incident.add_timeline_entry("ACCESS_REVOCATION", "Revoking compromised credentials")
        
        # Étape 2: Analyse des logs
        incident.add_timeline_entry("LOG_ANALYSIS", "Analyzing access logs")
        
        # Étape 3: Renforcement de la sécurité
        incident.add_timeline_entry("HARDENING", "Implementing additional security measures")
```

### Checklist Post-Incident

#### Rapport d'Incident
```markdown
# Rapport d'Incident de Sécurité

## Informations Générales
- **ID Incident**: INC-20250709120000
- **Type**: Accès non autorisé
- **Gravité**: Élevée
- **Date de découverte**: 2025-07-09 12:00:00
- **Date de résolution**: 2025-07-09 15:30:00
- **Responsable**: Équipe Sécurité

## Résumé Exécutif
Description concise de l'incident, impact et actions prises.

## Chronologie Détaillée
| Heure | Action | Responsable | Notes |
|-------|--------|-------------|-------|
| 12:00 | Détection alerte | Système | Tentatives de connexion multiples |
| 12:05 | Investigation initiale | Admin | Confirmation d'activité suspecte |
| 12:15 | Confinement | Admin | Blocage IP, révocation tokens |
| 15:30 | Résolution | Équipe | Incident clos |

## Impact
- **Données compromises**: Aucune
- **Systèmes affectés**: API d'authentification
- **Utilisateurs impactés**: 0
- **Durée d'indisponibilité**: Aucune

## Cause Racine
Tentative d'attaque par force brute sur l'API d'authentification.

## Actions Correctives
1. ✅ Renforcement du rate limiting
2. ✅ Amélioration de la détection d'intrusion
3. 🔄 Révision des politiques de mot de passe
4. 📅 Formation de sensibilisation (planifiée)

## Leçons Apprises
- La détection a bien fonctionné
- Le temps de réponse peut être amélioré
- Besoin de tests réguliers des procédures

## Recommandations
1. Implémenter CAPTCHA après 3 tentatives
2. Améliorer les alertes en temps réel
3. Réviser mensuellement les logs de sécurité

## Validation
- [ ] Rapport relu par RSSI
- [ ] Actions correctives validées
- [ ] Procédures mises à jour
- [ ] Formation équipe programmée
```

---

*Guide de sécurité complet - Protection robuste pour l'application et les données utilisateurs*