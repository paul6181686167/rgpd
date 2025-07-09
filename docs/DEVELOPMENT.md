# 👨‍💻 Guide de Développement Complet

## 📋 Table des Matières

1. [Setup Environnement de Développement](#setup-environnement-de-développement)
2. [Standards de Code](#standards-de-code)
3. [Workflow de Développement](#workflow-de-développement)
4. [Tests et Qualité](#tests-et-qualité)
5. [Debug et Troubleshooting](#debug-et-troubleshooting)
6. [Performance et Optimisation](#performance-et-optimisation)
7. [Contribution](#contribution)

## 🛠️ Setup Environnement de Développement

### Prérequis Développeur
```bash
# Versions recommandées
Python 3.8+
Node.js 16+
MongoDB 6.0+
Git 2.30+
VS Code ou PyCharm
Docker (optionnel)
```

### Configuration IDE

#### VS Code Extensions Recommandées
```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.flake8",
    "ms-python.black-formatter",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "mongodb.mongodb-vscode",
    "redhat.vscode-yaml",
    "ms-vscode-remote.remote-containers"
  ]
}
```

#### VS Code Settings
```json
{
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.flake8Enabled": true,
  "python.linting.enabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "tailwindCSS.includeLanguages": {
    "javascript": "javascript",
    "html": "HTML"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### Setup Environnement Local

#### 1. Clone et Configuration
```bash
# Cloner le projet
git clone [repository-url]
cd unsubscribe-app

# Créer les environnements virtuels
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows

# Installer les dépendances de développement
pip install -r requirements-dev.txt

# Frontend
cd ../frontend
npm install
# ou yarn install
```

#### 2. Variables d'Environnement de Développement

**backend/.env.development**
```env
# Base de données
MONGO_URL=mongodb://localhost:27017/unsubscribe_app_dev

# Gmail API (développement)
GOOGLE_CLIENT_ID=your_dev_client_id
GOOGLE_CLIENT_SECRET=your_dev_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8001/auth/callback

# Configuration développement
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=DEBUG

# Sécurité (utilisez des valeurs de test)
SECRET_KEY=dev_secret_key_not_for_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Limites de développement
EMAIL_RATE_LIMIT=100
MAX_EMAILS_PER_SCAN=50
SCAN_TIMEOUT_SECONDS=120

# Monitoring
ENABLE_METRICS=true
SENTRY_DSN=optional_sentry_dsn_for_error_tracking
```

**frontend/.env.development**
```env
# Configuration développement
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true

# Gmail
REACT_APP_GOOGLE_CLIENT_ID=your_dev_client_id

# Features flags
REACT_APP_ENABLE_ADVANCED_FEATURES=true
REACT_APP_ENABLE_ANALYTICS=false
```

#### 3. Configuration Base de Données de Développement
```bash
# Démarrer MongoDB
mongod --dbpath ./data/db

# Créer les collections et index de développement
mongo unsubscribe_app_dev
```

```javascript
// Script de setup base de données
use unsubscribe_app_dev

// Créer les collections
db.createCollection("subscriptions")
db.createCollection("users")
db.createCollection("email_scans")
db.createCollection("sent_emails")

// Créer les index
db.subscriptions.createIndex({ "user_id": 1, "status": 1 })
db.subscriptions.createIndex({ "email": 1, "service_name": 1 })
db.users.createIndex({ "google_id": 1 }, { unique: true })
db.email_scans.createIndex({ "user_id": 1, "started_at": -1 })

// Insérer des données de test
db.users.insertOne({
  id: "test_user_1",
  google_id: "123456789",
  email: "dev@example.com",
  name: "Developer Test",
  created_at: new Date()
})

db.subscriptions.insertMany([
  {
    id: "sub_1",
    user_id: "test_user_1",
    email: "dev@example.com",
    service_name: "Tech Newsletter",
    sender_email: "newsletter@tech.com",
    category: "newsletter",
    status: "detected",
    detected_at: new Date(),
    confidence_score: 0.95
  },
  {
    id: "sub_2", 
    user_id: "test_user_1",
    email: "dev@example.com",
    service_name: "Shopping Deals",
    sender_email: "deals@shop.com",
    category: "ecommerce",
    status: "unsubscribe_sent",
    detected_at: new Date(),
    unsubscribe_sent_at: new Date(),
    confidence_score: 0.88
  }
])
```

### Scripts de Développement

#### Makefile
```makefile
# Makefile pour l'automatisation des tâches de développement

.PHONY: help install dev test lint format clean build deploy

help:
	@echo "Commandes disponibles:"
	@echo "  install     - Installer toutes les dépendances"
	@echo "  dev         - Démarrer l'environnement de développement"
	@echo "  test        - Exécuter tous les tests"
	@echo "  lint        - Vérifier la qualité du code"
	@echo "  format      - Formater le code"
	@echo "  clean       - Nettoyer les fichiers temporaires"
	@echo "  build       - Construire l'application"

install:
	cd backend && pip install -r requirements-dev.txt
	cd frontend && npm install

dev:
	sudo supervisorctl start all
	@echo "Application démarrée:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend: http://localhost:8001"
	@echo "  API Docs: http://localhost:8001/docs"

test:
	cd backend && python -m pytest tests/ -v --cov=.
	cd frontend && npm test -- --coverage --watchAll=false

lint:
	cd backend && flake8 . --max-line-length=88 --extend-ignore=E203,W503
	cd backend && black . --check
	cd frontend && npm run lint

format:
	cd backend && black .
	cd backend && isort .
	cd frontend && npm run format

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	cd frontend && rm -rf node_modules/.cache
	cd frontend && rm -rf build

build:
	cd backend && python -m build
	cd frontend && npm run build

deploy-dev:
	docker-compose -f docker-compose.dev.yml up -d

deploy-prod:
	docker-compose -f docker-compose.prod.yml up -d
```

## 📏 Standards de Code

### Standards Python (Backend)

#### Configuration Black
```toml
# pyproject.toml
[tool.black]
line-length = 88
target-version = ['py38']
include = '\.pyi?$'
extend-exclude = '''
/(
  # directories
  \.eggs
  | \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | build
  | dist
)/
'''
```

#### Configuration Flake8
```ini
# .flake8
[flake8]
max-line-length = 88
extend-ignore = E203, W503
exclude = 
    .git,
    __pycache__,
    venv,
    .venv,
    migrations
```

#### Configuration isort
```toml
# pyproject.toml
[tool.isort]
profile = "black"
multi_line_output = 3
line_length = 88
```

#### Conventions de Nommage Python
```python
# Variables et fonctions: snake_case
user_email = "user@example.com"
def get_user_subscriptions():
    pass

# Classes: PascalCase
class SubscriptionService:
    pass

# Constantes: UPPER_SNAKE_CASE
MAX_SCAN_EMAILS = 1000
DEFAULT_TIMEOUT = 30

# Modules: lowercase
# subscription_service.py
# email_analyzer.py
```

### Standards JavaScript/React (Frontend)

#### Configuration ESLint
```json
{
  "extends": [
    "react-app",
    "react-app/jest",
    "eslint:recommended",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "prefer-template": "error"
  }
}
```

#### Configuration Prettier
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

#### Conventions React
```javascript
// Composants: PascalCase
const SubscriptionCard = ({ subscription }) => {
  // Hooks au début
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  // Fonctions: camelCase avec verbe
  const handleUnsubscribe = async () => {
    // Logique
  };
  
  // Early returns
  if (!subscription) {
    return <div>No subscription</div>;
  }
  
  // JSX
  return (
    <div className="subscription-card">
      {/* Contenu */}
    </div>
  );
};

// Props: destructuring avec types
const PropTypes = {
  subscription: PropTypes.object.isRequired,
  onUpdate: PropTypes.func
};

// Export par défaut en bas
export default SubscriptionCard;
```

### Standards de Documentation

#### Docstrings Python (Google Style)
```python
def analyze_email(email_content: str, headers: dict) -> SubscriptionCandidate:
    """Analyse un email pour détecter s'il s'agit d'un abonnement.
    
    Args:
        email_content (str): Le contenu HTML/text de l'email
        headers (dict): Les en-têtes de l'email
        
    Returns:
        SubscriptionCandidate: Objet contenant les informations d'abonnement
        détectées avec un score de confiance
        
    Raises:
        EmailParsingError: Si l'email ne peut pas être analysé
        InvalidHeaderError: Si les en-têtes sont malformés
        
    Example:
        >>> headers = {"From": "newsletter@example.com"}
        >>> content = "HTML email content..."
        >>> candidate = analyze_email(content, headers)
        >>> print(candidate.confidence_score)
        0.85
    """
    pass
```

#### JSDoc pour JavaScript
```javascript
/**
 * Hook pour gérer les abonnements utilisateur
 * 
 * @param {Object} filters - Filtres pour les abonnements
 * @param {string} filters.status - Statut des abonnements à récupérer
 * @param {string} filters.category - Catégorie des abonnements
 * @returns {Object} Objet contenant subscriptions, loading, error et fonctions
 * 
 * @example
 * const { subscriptions, loading, fetchSubscriptions } = useSubscriptions({
 *   status: 'detected'
 * });
 */
export const useSubscriptions = (filters = {}) => {
  // Implementation
};
```

## 🔄 Workflow de Développement

### Git Workflow

#### Branch Strategy
```
main
├── develop
│   ├── feature/gmail-integration
│   ├── feature/email-templates
│   └── feature/advanced-filters
├── hotfix/security-patch
└── release/v1.1.0
```

#### Conventions de Commit
```bash
# Format: type(scope): description

# Types:
feat(auth): add Google OAuth integration
fix(scan): resolve email parsing error
docs(api): update endpoint documentation
style(ui): improve subscription card design
refactor(service): optimize email analyzer
test(backend): add unit tests for Gmail service
chore(deps): update React to v18.3.0

# Exemples:
git commit -m "feat(gmail): implement email scanning functionality"
git commit -m "fix(ui): resolve subscription filter not working"
git commit -m "docs(setup): add development environment guide"
```

#### Pre-commit Hooks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 22.3.0
    hooks:
      - id: black
        language_version: python3.8

  - repo: https://github.com/pycqa/isort
    rev: 5.10.1
    hooks:
      - id: isort

  - repo: https://github.com/pycqa/flake8
    rev: 4.0.1
    hooks:
      - id: flake8

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v2.6.2
    hooks:
      - id: prettier
        files: \.(js|jsx|ts|tsx|json|css|md)$
```

### Feature Development Process

#### 1. Planification
```markdown
## Feature: Advanced Email Filters

### Objectif
Permettre aux utilisateurs de filtrer les abonnements par critères avancés

### Spécifications
- [ ] Filtre par date de détection
- [ ] Filtre par fréquence d'envoi
- [ ] Filtre par score de confiance
- [ ] Sauvegarde des filtres personnalisés

### Critères d'Acceptation
- [ ] Interface utilisateur intuitive
- [ ] Performance < 500ms pour l'application des filtres
- [ ] Tests unitaires à 90% de couverture
- [ ] Documentation utilisateur mise à jour

### Estimation
- Backend: 4h
- Frontend: 6h
- Tests: 2h
- Documentation: 1h
```

#### 2. Implémentation

**Backend Implementation**
```python
# backend/api/filters.py
from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/api/filters", tags=["filters"])

@router.get("/subscriptions")
async def filter_subscriptions(
    user_id: str = Depends(get_current_user),
    status: Optional[str] = Query(None, regex="^(detected|sent|unsubscribed)$"),
    category: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=1.0),
    frequency: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Filtrer les abonnements avec critères avancés"""
    filters = build_filter_query(
        user_id=user_id,
        status=status,
        category=category,
        date_from=date_from,
        date_to=date_to,
        min_confidence=min_confidence,
        frequency=frequency
    )
    
    subscriptions = await subscription_service.filter_subscriptions(
        filters=filters,
        page=page,
        limit=limit
    )
    
    return {
        "subscriptions": subscriptions,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": await subscription_service.count_subscriptions(filters)
        }
    }
```

**Frontend Implementation**
```javascript
// src/components/subscription/AdvancedFilter.js
import React, { useState, useCallback } from 'react';
import { useSubscriptions } from '../../hooks/useSubscriptions';

const AdvancedFilter = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    dateRange: { from: '', to: '' },
    minConfidence: 0,
    frequency: ''
  });

  const handleFilterChange = useCallback((key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  return (
    <div className="advanced-filter p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Filtres Avancés</h3>
      
      {/* Status Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Statut
        </label>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">Tous les statuts</option>
          <option value="detected">Détectés</option>
          <option value="sent">Emails envoyés</option>
          <option value="unsubscribed">Désinscris</option>
        </select>
      </div>

      {/* Date Range Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Période de détection
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={filters.dateRange.from}
            onChange={(e) => handleFilterChange('dateRange', {
              ...filters.dateRange,
              from: e.target.value
            })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="date"
            value={filters.dateRange.to}
            onChange={(e) => handleFilterChange('dateRange', {
              ...filters.dateRange,
              to: e.target.value
            })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      {/* Confidence Score Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Score de confiance minimum: {filters.minConfidence}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={filters.minConfidence}
          onChange={(e) => handleFilterChange('minConfidence', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default AdvancedFilter;
```

#### 3. Tests

**Tests Backend**
```python
# tests/test_filters.py
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

def test_filter_subscriptions_by_status(client: TestClient, test_user, test_subscriptions):
    """Test filtrage par statut"""
    response = client.get(
        "/api/filters/subscriptions",
        params={"status": "detected"},
        headers={"Authorization": f"Bearer {test_user.token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Vérifier que tous les résultats ont le bon statut
    for subscription in data["subscriptions"]:
        assert subscription["status"] == "detected"

def test_filter_subscriptions_by_date_range(client: TestClient, test_user):
    """Test filtrage par période"""
    date_from = (datetime.now() - timedelta(days=7)).isoformat()
    date_to = datetime.now().isoformat()
    
    response = client.get(
        "/api/filters/subscriptions",
        params={
            "date_from": date_from,
            "date_to": date_to
        },
        headers={"Authorization": f"Bearer {test_user.token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Vérifier que les dates sont dans la période
    for subscription in data["subscriptions"]:
        detected_at = datetime.fromisoformat(subscription["detected_at"])
        assert date_from <= detected_at.isoformat() <= date_to

def test_filter_subscriptions_pagination(client: TestClient, test_user):
    """Test pagination des résultats"""
    response = client.get(
        "/api/filters/subscriptions",
        params={"page": 1, "limit": 5},
        headers={"Authorization": f"Bearer {test_user.token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert len(data["subscriptions"]) <= 5
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["limit"] == 5
    assert "total" in data["pagination"]
```

**Tests Frontend**
```javascript
// src/components/subscription/__tests__/AdvancedFilter.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdvancedFilter from '../AdvancedFilter';

describe('AdvancedFilter', () => {
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    mockOnFiltersChange.mockClear();
  });

  it('renders all filter options', () => {
    render(<AdvancedFilter onFiltersChange={mockOnFiltersChange} />);
    
    expect(screen.getByText('Filtres Avancés')).toBeInTheDocument();
    expect(screen.getByLabelText('Statut')).toBeInTheDocument();
    expect(screen.getByLabelText('Période de détection')).toBeInTheDocument();
    expect(screen.getByText(/Score de confiance minimum/)).toBeInTheDocument();
  });

  it('calls onFiltersChange when status filter changes', async () => {
    render(<AdvancedFilter onFiltersChange={mockOnFiltersChange} />);
    
    const statusSelect = screen.getByLabelText('Statut');
    fireEvent.change(statusSelect, { target: { value: 'detected' } });
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'detected' })
      );
    });
  });

  it('updates confidence score filter correctly', async () => {
    render(<AdvancedFilter onFiltersChange={mockOnFiltersChange} />);
    
    const confidenceSlider = screen.getByRole('slider');
    fireEvent.change(confidenceSlider, { target: { value: '0.7' } });
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ minConfidence: 0.7 })
      );
    });
  });
});
```

## 🧪 Tests et Qualité

### Stratégie de Tests

#### Pyramide de Tests
```
                    E2E Tests
                   (5% - Cypress)
                        │
                 Integration Tests  
                (15% - API + DB)
                        │
                   Unit Tests
                (80% - Functions/Components)
```

### Configuration Tests Backend

#### Pytest Configuration
```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = [
    "--verbose",
    "--cov=backend",
    "--cov-report=html",
    "--cov-report=term-missing",
    "--cov-fail-under=80"
]
filterwarnings = [
    "ignore::DeprecationWarning",
    "ignore::PendingDeprecationWarning"
]
```

#### Fixtures
```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient
from backend.server import app
from backend.database.connection import get_database

@pytest.fixture(scope="session")
def test_db():
    """Base de données de test"""
    client = MongoClient("mongodb://localhost:27017")
    db = client.test_unsubscribe_app
    yield db
    client.drop_database("test_unsubscribe_app")
    client.close()

@pytest.fixture
def client(test_db):
    """Client de test FastAPI"""
    app.dependency_overrides[get_database] = lambda: test_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(test_db):
    """Utilisateur de test"""
    user_data = {
        "id": "test_user_123",
        "google_id": "google_123",
        "email": "test@example.com",
        "name": "Test User"
    }
    test_db.users.insert_one(user_data)
    yield user_data
    test_db.users.delete_one({"id": "test_user_123"})

@pytest.fixture
def test_subscriptions(test_db, test_user):
    """Abonnements de test"""
    subscriptions = [
        {
            "id": "sub_1",
            "user_id": test_user["id"],
            "email": test_user["email"],
            "service_name": "Newsletter Test",
            "sender_email": "test@newsletter.com",
            "status": "detected",
            "category": "newsletter",
            "detected_at": datetime.now()
        },
        {
            "id": "sub_2", 
            "user_id": test_user["id"],
            "email": test_user["email"],
            "service_name": "Shopping Test",
            "sender_email": "test@shop.com",
            "status": "unsubscribe_sent",
            "category": "ecommerce",
            "detected_at": datetime.now()
        }
    ]
    test_db.subscriptions.insert_many(subscriptions)
    yield subscriptions
    test_db.subscriptions.delete_many({"user_id": test_user["id"]})
```

### Configuration Tests Frontend

#### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/**/*.stories.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx}'
  ]
};
```

#### Test Utilities
```javascript
// src/utils/testUtils.js
import React from 'react';
import { render } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import { AppProvider } from '../contexts/AppContext';

// Mock des services
export const mockApiService = {
  getSubscriptions: jest.fn(),
  scanEmails: jest.fn(),
  sendUnsubscribe: jest.fn()
};

// Provider wrapper pour les tests
const AllTheProviders = ({ children }) => {
  return (
    <AuthProvider>
      <AppProvider>
        {children}
      </AppProvider>
    </AuthProvider>
  );
};

// Render personnalisé avec providers
export const renderWithProviders = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Mock user pour les tests
export const mockUser = {
  id: 'test_user_123',
  email: 'test@example.com',
  name: 'Test User',
  isAuthenticated: true
};

// Mock subscriptions
export const mockSubscriptions = [
  {
    id: 'sub_1',
    serviceName: 'Newsletter Test',
    senderEmail: 'test@newsletter.com',
    status: 'detected',
    category: 'newsletter'
  },
  {
    id: 'sub_2',
    serviceName: 'Shopping Test', 
    senderEmail: 'test@shop.com',
    status: 'unsubscribe_sent',
    category: 'ecommerce'
  }
];
```

### Tests d'Intégration

#### Tests API Complets
```python
# tests/integration/test_subscription_workflow.py
import pytest
from datetime import datetime

class TestSubscriptionWorkflow:
    """Tests d'intégration pour le workflow complet des abonnements"""
    
    async def test_complete_unsubscribe_workflow(self, client, test_user):
        """Test du workflow complet: scan -> détection -> désinscription"""
        
        # 1. Démarrer un scan
        scan_response = client.post(
            "/api/scan-email",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert scan_response.status_code == 200
        scan_data = scan_response.json()
        scan_id = scan_data["scan_id"]
        
        # 2. Attendre la fin du scan (simulation)
        # En réalité, on attendrait ou on pollerait le statut
        
        # 3. Récupérer les abonnements détectés
        subs_response = client.get(
            "/api/subscriptions",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert subs_response.status_code == 200
        subscriptions = subs_response.json()
        assert len(subscriptions) > 0
        
        # 4. Générer un email de désinscription
        subscription_id = subscriptions[0]["id"]
        email_response = client.post(
            f"/api/generate-unsubscribe-email/{subscription_id}",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert email_response.status_code == 200
        email_data = email_response.json()
        
        # 5. Envoyer l'email de désinscription
        send_response = client.post(
            "/api/send-unsubscribe",
            json={
                "subscription_id": subscription_id,
                "email_content": email_data["email_content"]
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert send_response.status_code == 200
        
        # 6. Vérifier que le statut a été mis à jour
        updated_sub_response = client.get(
            f"/api/subscriptions/{subscription_id}",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert updated_sub_response.status_code == 200
        updated_sub = updated_sub_response.json()
        assert updated_sub["status"] == "unsubscribe_sent"
        assert updated_sub["unsubscribe_sent_at"] is not None
```

### Tests E2E avec Cypress

#### Configuration Cypress
```javascript
// cypress.config.js
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    env: {
      apiUrl: 'http://localhost:8001'
    }
  }
});
```

#### Test E2E Principal
```javascript
// cypress/e2e/unsubscribe_workflow.cy.js
describe('Unsubscribe Workflow', () => {
  beforeEach(() => {
    // Mock de l'authentification
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        id: 'test_user',
        email: 'test@example.com',
        name: 'Test User'
      }));
      win.localStorage.setItem('token', 'mock_jwt_token');
    });
    
    // Intercepter les appels API
    cy.intercept('GET', '/api/subscriptions', {
      fixture: 'subscriptions.json'
    }).as('getSubscriptions');
    
    cy.intercept('POST', '/api/scan-email', {
      body: { scan_id: 'test_scan_123', status: 'started' }
    }).as('startScan');
  });

  it('should complete full unsubscribe workflow', () => {
    // 1. Visiter l'application
    cy.visit('/');
    
    // 2. Vérifier l'interface principale
    cy.contains('Application de Désinscription').should('be.visible');
    cy.get('[data-testid="scan-button"]').should('be.visible');
    
    // 3. Démarrer un scan
    cy.get('[data-testid="scan-button"]').click();
    cy.wait('@startScan');
    
    // 4. Vérifier les résultats du scan
    cy.wait('@getSubscriptions');
    cy.get('[data-testid="subscription-card"]').should('have.length.at.least', 1);
    
    // 5. Générer un email de désinscription
    cy.get('[data-testid="generate-email-button"]').first().click();
    
    // 6. Prévisualiser l'email
    cy.get('[data-testid="email-preview"]').should('be.visible');
    cy.contains('Demande de désinscription').should('be.visible');
    
    // 7. Envoyer l'email
    cy.get('[data-testid="send-email-button"]').click();
    
    // 8. Vérifier la confirmation
    cy.get('[data-testid="success-toast"]').should('be.visible');
    cy.contains('Email envoyé avec succès').should('be.visible');
    
    // 9. Vérifier le changement de statut
    cy.get('[data-testid="subscription-status"]')
      .should('contain', 'Email envoyé');
  });

  it('should handle scan errors gracefully', () => {
    // Simuler une erreur de scan
    cy.intercept('POST', '/api/scan-email', {
      statusCode: 500,
      body: { error: 'Gmail API error' }
    }).as('scanError');
    
    cy.visit('/');
    cy.get('[data-testid="scan-button"]').click();
    cy.wait('@scanError');
    
    // Vérifier la gestion d'erreur
    cy.get('[data-testid="error-toast"]').should('be.visible');
    cy.contains('Erreur lors du scan').should('be.visible');
  });
});
```

## 🐛 Debug et Troubleshooting

### Configuration Logging

#### Backend Logging
```python
# backend/config/logging.py
import logging
import logging.handlers
import sys
from pathlib import Path

def setup_logging(log_level: str = "INFO", log_dir: str = "logs"):
    """Configuration centralisée des logs"""
    
    # Créer le répertoire des logs
    Path(log_dir).mkdir(exist_ok=True)
    
    # Configuration du formatter
    formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Logger principal
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, log_level.upper()))
    
    # Handler console
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Handler fichier avec rotation
    file_handler = logging.handlers.RotatingFileHandler(
        filename=f"{log_dir}/app.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Handler erreurs séparé
    error_handler = logging.handlers.RotatingFileHandler(
        filename=f"{log_dir}/error.log",
        maxBytes=10*1024*1024,
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    logger.addHandler(error_handler)
    
    # Loggers spécifiques
    setup_component_loggers(formatter, log_dir)
    
    return logger

def setup_component_loggers(formatter, log_dir):
    """Configuration des loggers pour chaque composant"""
    
    components = [
        'gmail_service',
        'email_analyzer', 
        'subscription_service',
        'auth_service'
    ]
    
    for component in components:
        component_logger = logging.getLogger(component)
        handler = logging.handlers.RotatingFileHandler(
            filename=f"{log_dir}/{component}.log",
            maxBytes=5*1024*1024,  # 5MB
            backupCount=3
        )
        handler.setFormatter(formatter)
        component_logger.addHandler(handler)
        component_logger.setLevel(logging.DEBUG)
```

#### Usage des Logs
```python
# Dans les services
import logging

logger = logging.getLogger('gmail_service')

class GmailService:
    def __init__(self):
        self.logger = logger
    
    async def scan_emails(self, user_id: str):
        self.logger.info(f"Starting email scan for user {user_id}")
        
        try:
            # Logique de scan
            emails = await self._fetch_emails(user_id)
            self.logger.info(f"Fetched {len(emails)} emails for user {user_id}")
            
            subscriptions = []
            for email in emails:
                self.logger.debug(f"Analyzing email {email.id}")
                subscription = await self._analyze_email(email)
                if subscription:
                    subscriptions.append(subscription)
                    self.logger.info(f"Detected subscription: {subscription.service_name}")
            
            self.logger.info(f"Scan completed. Found {len(subscriptions)} subscriptions")
            return subscriptions
            
        except Exception as e:
            self.logger.error(f"Error during email scan for user {user_id}: {str(e)}", exc_info=True)
            raise
```

### Debug Tools

#### Backend Debug Middleware
```python
# backend/middleware/debug.py
import time
import uuid
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger('debug_middleware')

class DebugMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Générer un ID unique pour la requête
        request_id = str(uuid.uuid4())[:8]
        
        # Logger la requête entrante
        logger.info(f"[{request_id}] {request.method} {request.url}")
        logger.debug(f"[{request_id}] Headers: {dict(request.headers)}")
        
        # Mesurer le temps de traitement
        start_time = time.time()
        
        try:
            # Traiter la requête
            response = await call_next(request)
            
            # Calculer le temps de traitement
            process_time = time.time() - start_time
            
            # Logger la réponse
            logger.info(f"[{request_id}] Response: {response.status_code} in {process_time:.3f}s")
            
            # Ajouter des headers de debug
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(f"[{request_id}] Error after {process_time:.3f}s: {str(e)}", exc_info=True)
            raise
```

#### Frontend Debug Utilities
```javascript
// src/utils/debug.js
class DebugUtils {
  constructor() {
    this.isDebugMode = process.env.REACT_APP_DEBUG === 'true';
    this.logs = [];
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.logs.push(logEntry);

    if (this.isDebugMode) {
      console[level](
        `[${timestamp}] ${message}`,
        data ? data : ''
      );
    }

    // Conserver seulement les 1000 derniers logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  debug(message, data) {
    this.log('debug', message, data);
  }

  exportLogs() {
    const logsBlob = new Blob([JSON.stringify(this.logs, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(logsBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-logs-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  clearLogs() {
    this.logs = [];
  }

  getApiCallStats() {
    const apiCalls = this.logs.filter(log => 
      log.message.includes('API') && log.data?.url
    );

    const stats = {};
    apiCalls.forEach(call => {
      const endpoint = call.data.url;
      if (!stats[endpoint]) {
        stats[endpoint] = { count: 0, totalTime: 0, errors: 0 };
      }
      stats[endpoint].count++;
      if (call.data.duration) {
        stats[endpoint].totalTime += call.data.duration;
      }
      if (call.level === 'error') {
        stats[endpoint].errors++;
      }
    });

    return stats;
  }
}

export const debugUtils = new DebugUtils();
```

### Troubleshooting Guides

#### Guide de Résolution des Problèmes Courants

**1. Problème: Connexion Gmail échoue**
```bash
# Vérifications à effectuer:

# 1. Vérifier les identifiants
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET

# 2. Vérifier les URLs de redirection
curl -H "Authorization: Bearer $TOKEN" \
  https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=$ACCESS_TOKEN

# 3. Vérifier les scopes autorisés
# Dans Google Cloud Console -> APIs & Services -> Credentials

# 4. Tester la connexion
python -c "
from google.oauth2 import service_account
from googleapiclient.discovery import build
try:
    # Test basic connection
    print('Testing Gmail API connection...')
    # Votre code de test ici
except Exception as e:
    print(f'Error: {e}')
"
```

**2. Problème: Performance lente**
```bash
# 1. Vérifier la base de données
mongo unsubscribe_app --eval "db.stats()"
mongo unsubscribe_app --eval "db.subscriptions.getIndexes()"

# 2. Analyser les logs de performance
grep "Process-Time" /var/log/supervisor/backend.log | sort -k5 -nr | head -10

# 3. Profiler les requêtes lentes
mongo unsubscribe_app --eval "db.setProfilingLevel(2, {slowms: 100})"
# Après quelques minutes:
mongo unsubscribe_app --eval "db.system.profile.find().sort({ts:-1}).limit(5).pretty()"

# 4. Vérifier l'utilisation mémoire
ps aux | grep python
ps aux | grep node
```

**3. Problème: Erreurs d'emails non détectés**
```python
# Script de debug pour analyser les emails
import json
from email_analyzer import EmailAnalyzer

def debug_email_detection(email_file):
    """Debug la détection d'abonnements pour un email spécifique"""
    
    with open(email_file, 'r') as f:
        email_data = json.load(f)
    
    analyzer = EmailAnalyzer()
    
    print("=== EMAIL ANALYSIS DEBUG ===")
    print(f"From: {email_data.get('from', 'N/A')}")
    print(f"Subject: {email_data.get('subject', 'N/A')}")
    print(f"List-ID: {email_data.get('headers', {}).get('List-ID', 'N/A')}")
    
    # Tester les différents patterns
    patterns_matched = analyzer.check_patterns(email_data)
    print(f"Patterns matched: {patterns_matched}")
    
    # Analyser les liens de désinscription
    unsubscribe_info = analyzer.extract_unsubscribe_info(email_data)
    print(f"Unsubscribe info: {unsubscribe_info}")
    
    # Score de confiance
    confidence = analyzer.calculate_confidence(email_data)
    print(f"Confidence score: {confidence}")
    
    # Résultat final
    result = analyzer.analyze_email(email_data)
    print(f"Final result: {result}")

# Usage
debug_email_detection('problematic_email.json')
```

---

*Guide de développement complet - Base solide pour contribuer au projet*