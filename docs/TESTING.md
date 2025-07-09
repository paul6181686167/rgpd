# 🧪 Guide de Tests Complet

## 📋 Table des Matières

1. [Stratégie de Tests](#stratégie-de-tests)
2. [Tests Unitaires](#tests-unitaires)
3. [Tests d'Intégration](#tests-dintégration)
4. [Tests End-to-End](#tests-end-to-end)
5. [Tests de Performance](#tests-de-performance)
6. [Tests de Sécurité](#tests-de-sécurité)
7. [Tests d'Accessibilité](#tests-daccessibilité)

## 🎯 Stratégie de Tests

### Pyramide de Tests
```
                    E2E Tests
                   (5% - 20 tests)
                 ┌─────────────────┐
                │  User Journeys  │
                │  Full Stack     │
                └─────────────────┘
                        │
                 Integration Tests
                (20% - 80 tests)
              ┌─────────────────────┐
             │   API + Database    │
             │   Component + API   │
             └─────────────────────┘
                        │
                   Unit Tests
                (75% - 300 tests)
            ┌─────────────────────────┐
           │    Functions/Methods    │
           │    Components Logic     │
           │    Pure Functions       │
           └─────────────────────────┘
```

### Couverture de Code Cible
- **Backend** : >85% couverture de code
- **Frontend** : >80% couverture de code
- **Intégration** : 100% des endpoints critiques
- **E2E** : 100% des user journeys principaux

### Types de Tests par Composant

#### Backend (FastAPI)
```python
# Tests organisés par couche

tests/
├── unit/
│   ├── test_models.py          # Modèles Pydantic
│   ├── test_services.py        # Logique métier
│   ├── test_utils.py           # Fonctions utilitaires
│   └── test_validators.py      # Validateurs
├── integration/
│   ├── test_api_endpoints.py   # Tests API complets
│   ├── test_database.py        # Tests base de données
│   └── test_gmail_service.py   # Tests service Gmail
├── e2e/
│   └── test_full_workflow.py   # Tests bout en bout
└── performance/
    └── test_load.py            # Tests de charge
```

#### Frontend (React)
```javascript
// Tests organisés par type de composant

src/
├── components/
│   └── __tests__/
│       ├── SubscriptionCard.test.js
│       ├── Dashboard.test.js
│       └── EmailPreview.test.js
├── hooks/
│   └── __tests__/
│       ├── useAuth.test.js
│       └── useSubscriptions.test.js
├── services/
│   └── __tests__/
│       ├── api.test.js
│       └── authService.test.js
└── utils/
    └── __tests__/
        ├── dateUtils.test.js
        └── validators.test.js
```

## 🔬 Tests Unitaires

### Configuration Backend (Pytest)

#### Setup et Fixtures
```python
# tests/conftest.py
import pytest
import asyncio
from fastapi.testclient import TestClient
from pymongo import MongoClient
from unittest.mock import AsyncMock, MagicMock
from backend.server import app
from backend.database.connection import get_database
from backend.services.gmail_service import GmailService

# Event loop pour tests async
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# Base de données de test
@pytest.fixture(scope="function")
def test_db():
    """Base de données de test isolée"""
    client = MongoClient("mongodb://localhost:27017")
    db = client.test_unsubscribe_app_pytest
    
    # Nettoyer avant le test
    for collection_name in db.list_collection_names():
        db[collection_name].delete_many({})
    
    yield db
    
    # Nettoyer après le test
    client.drop_database("test_unsubscribe_app_pytest")
    client.close()

# Client de test FastAPI
@pytest.fixture
def client(test_db):
    """Client de test avec base de données isolée"""
    app.dependency_overrides[get_database] = lambda: test_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()

# Mock Gmail Service
@pytest.fixture
def mock_gmail_service():
    """Service Gmail mocké"""
    service = MagicMock(spec=GmailService)
    
    # Configuration des méthodes mockées
    service.authenticate = AsyncMock(return_value=True)
    service.scan_emails = AsyncMock(return_value=[])
    service.send_email = AsyncMock(return_value=True)
    
    return service

# Données de test
@pytest.fixture
def sample_user():
    """Utilisateur de test"""
    return {
        "id": "test_user_123",
        "google_id": "google_123456789",
        "email": "test@example.com",
        "name": "Test User",
        "role": "user"
    }

@pytest.fixture
def sample_subscription():
    """Abonnement de test"""
    return {
        "id": "sub_test_123",
        "user_id": "test_user_123",
        "email": "test@example.com",
        "service_name": "Test Newsletter",
        "sender_email": "newsletter@test.com",
        "category": "newsletter",
        "status": "detected",
        "confidence_score": 0.95
    }
```

#### Tests de Modèles
```python
# tests/unit/test_models.py
import pytest
from datetime import datetime
from pydantic import ValidationError
from backend.models.subscription import Subscription, SubscriptionCreate

class TestSubscriptionModel:
    """Tests pour le modèle Subscription"""
    
    def test_subscription_creation_valid(self):
        """Test création d'abonnement valide"""
        data = {
            "id": "sub_123",
            "user_id": "user_123", 
            "email": "test@example.com",
            "service_name": "Test Service",
            "sender_email": "sender@test.com",
            "category": "newsletter",
            "detected_at": datetime.now()
        }
        
        subscription = Subscription(**data)
        
        assert subscription.id == "sub_123"
        assert subscription.email == "test@example.com"
        assert subscription.status == "detected"  # Valeur par défaut
        assert subscription.confidence_score == 0.0  # Valeur par défaut
    
    def test_subscription_invalid_email(self):
        """Test validation email invalide"""
        data = {
            "id": "sub_123",
            "user_id": "user_123",
            "email": "invalid-email",  # Email invalide
            "service_name": "Test Service",
            "sender_email": "sender@test.com",
            "category": "newsletter",
            "detected_at": datetime.now()
        }
        
        with pytest.raises(ValidationError) as exc_info:
            Subscription(**data)
        
        assert "email" in str(exc_info.value)
    
    def test_subscription_invalid_status(self):
        """Test validation statut invalide"""
        data = {
            "id": "sub_123",
            "user_id": "user_123",
            "email": "test@example.com",
            "service_name": "Test Service",
            "sender_email": "sender@test.com",
            "category": "newsletter",
            "status": "invalid_status",  # Statut invalide
            "detected_at": datetime.now()
        }
        
        with pytest.raises(ValidationError) as exc_info:
            Subscription(**data)
        
        assert "status" in str(exc_info.value)
    
    @pytest.mark.parametrize("confidence_score", [-0.1, 1.1, 2.0])
    def test_subscription_invalid_confidence_score(self, confidence_score):
        """Test validation score de confiance invalide"""
        data = {
            "id": "sub_123",
            "user_id": "user_123",
            "email": "test@example.com",
            "service_name": "Test Service",
            "sender_email": "sender@test.com",
            "category": "newsletter",
            "confidence_score": confidence_score,
            "detected_at": datetime.now()
        }
        
        with pytest.raises(ValidationError):
            Subscription(**data)
```

#### Tests de Services
```python
# tests/unit/test_services.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from backend.services.subscription_service import SubscriptionService
from backend.services.email_analyzer import EmailAnalyzer

class TestSubscriptionService:
    """Tests pour le service des abonnements"""
    
    @pytest.fixture
    def subscription_service(self, test_db):
        """Instance du service avec DB de test"""
        return SubscriptionService(test_db)
    
    @pytest.mark.asyncio
    async def test_create_subscription(self, subscription_service, sample_subscription):
        """Test création d'abonnement"""
        
        result = await subscription_service.create_subscription(sample_subscription)
        
        assert result["id"] == sample_subscription["id"]
        assert result["status"] == "detected"
        
        # Vérifier en base
        saved = await subscription_service.get_subscription_by_id(sample_subscription["id"])
        assert saved is not None
        assert saved["service_name"] == sample_subscription["service_name"]
    
    @pytest.mark.asyncio
    async def test_get_user_subscriptions(self, subscription_service, sample_subscription):
        """Test récupération des abonnements d'un utilisateur"""
        
        # Créer plusieurs abonnements
        subscriptions = [
            {**sample_subscription, "id": f"sub_{i}", "service_name": f"Service {i}"}
            for i in range(3)
        ]
        
        for sub in subscriptions:
            await subscription_service.create_subscription(sub)
        
        # Récupérer les abonnements
        result = await subscription_service.get_user_subscriptions(
            sample_subscription["user_id"]
        )
        
        assert len(result) == 3
        assert all(sub["user_id"] == sample_subscription["user_id"] for sub in result)
    
    @pytest.mark.asyncio
    async def test_update_subscription_status(self, subscription_service, sample_subscription):
        """Test mise à jour du statut"""
        
        # Créer l'abonnement
        await subscription_service.create_subscription(sample_subscription)
        
        # Mettre à jour le statut
        result = await subscription_service.update_subscription_status(
            sample_subscription["id"], 
            "unsubscribe_sent"
        )
        
        assert result is True
        
        # Vérifier la mise à jour
        updated = await subscription_service.get_subscription_by_id(sample_subscription["id"])
        assert updated["status"] == "unsubscribe_sent"
        assert updated["unsubscribe_sent_at"] is not None

class TestEmailAnalyzer:
    """Tests pour l'analyseur d'emails"""
    
    @pytest.fixture
    def email_analyzer(self):
        """Instance de l'analyseur d'email"""
        return EmailAnalyzer()
    
    def test_detect_newsletter_patterns(self, email_analyzer):
        """Test détection patterns newsletter"""
        
        email_data = {
            "headers": {
                "List-ID": "<newsletter.example.com>",
                "From": "newsletter@example.com",
                "List-Unsubscribe": "<mailto:unsubscribe@example.com>"
            },
            "subject": "Weekly Newsletter #42",
            "body": "This is our weekly newsletter..."
        }
        
        result = email_analyzer.analyze_email(email_data)
        
        assert result.is_subscription is True
        assert result.confidence_score > 0.8
        assert result.category == "newsletter"
        assert result.unsubscribe_email == "unsubscribe@example.com"
    
    def test_detect_ecommerce_patterns(self, email_analyzer):
        """Test détection patterns e-commerce"""
        
        email_data = {
            "headers": {
                "From": "deals@shop.com",
                "Return-Path": "bounce@shop.com"
            },
            "subject": "50% OFF Everything - Limited Time!",
            "body": "Shop now and save big! Unsubscribe here: http://shop.com/unsubscribe"
        }
        
        result = email_analyzer.analyze_email(email_data)
        
        assert result.is_subscription is True
        assert result.category == "ecommerce"
        assert "shop.com/unsubscribe" in result.unsubscribe_link
    
    def test_ignore_personal_email(self, email_analyzer):
        """Test ignorer les emails personnels"""
        
        email_data = {
            "headers": {
                "From": "friend@gmail.com",
                "To": "me@example.com"
            },
            "subject": "Hey, how are you?",
            "body": "Just wanted to catch up..."
        }
        
        result = email_analyzer.analyze_email(email_data)
        
        assert result.is_subscription is False
        assert result.confidence_score < 0.3
    
    @pytest.mark.parametrize("unsubscribe_text,expected_link", [
        ("Click here to unsubscribe: http://example.com/unsub", "http://example.com/unsub"),
        ("To opt out visit https://service.com/optout", "https://service.com/optout"),
        ("Unsubscribe at example.com/remove", "http://example.com/remove"),
    ])
    def test_extract_unsubscribe_links(self, email_analyzer, unsubscribe_text, expected_link):
        """Test extraction des liens de désinscription"""
        
        email_data = {
            "headers": {"From": "test@example.com"},
            "body": f"Newsletter content. {unsubscribe_text}"
        }
        
        result = email_analyzer.extract_unsubscribe_info(email_data)
        
        assert expected_link in result.unsubscribe_link
```

### Configuration Frontend (Jest + React Testing Library)

#### Setup et Utilitaires
```javascript
// src/setupTests.js
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Configuration MSW pour les mocks API
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock des variables d'environnement
process.env.REACT_APP_BACKEND_URL = 'http://localhost:8001';
process.env.REACT_APP_GOOGLE_CLIENT_ID = 'test_client_id';

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock de window.location
delete window.location;
window.location = { assign: jest.fn() };
```

```javascript
// src/utils/testUtils.js
import React from 'react';
import { render } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import { AppProvider } from '../contexts/AppContext';

// Providers wrapper pour les tests
const AllTheProviders = ({ children, initialAuthState = {}, initialAppState = {} }) => {
  return (
    <AuthProvider initialState={initialAuthState}>
      <AppProvider initialState={initialAppState}>
        {children}
      </AppProvider>
    </AuthProvider>
  );
};

// Render personnalisé avec tous les providers
export const renderWithProviders = (ui, options = {}) => {
  const { initialAuthState, initialAppState, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders 
        initialAuthState={initialAuthState}
        initialAppState={initialAppState}
      >
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test_user_123',
  email: 'test@example.com',
  name: 'Test User',
  isAuthenticated: true,
  ...overrides,
});

export const createMockSubscription = (overrides = {}) => ({
  id: 'sub_123',
  serviceName: 'Test Newsletter',
  senderEmail: 'test@newsletter.com',
  status: 'detected',
  category: 'newsletter',
  detectedAt: '2025-07-09T10:30:00Z',
  confidenceScore: 0.95,
  ...overrides,
});

export const createMockSubscriptions = (count = 3) => 
  Array.from({ length: count }, (_, i) => 
    createMockSubscription({ 
      id: `sub_${i}`,
      serviceName: `Service ${i}` 
    })
  );
```

#### Tests de Composants
```javascript
// src/components/__tests__/SubscriptionCard.test.js
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, createMockSubscription } from '../../utils/testUtils';
import SubscriptionCard from '../SubscriptionCard';

describe('SubscriptionCard', () => {
  const mockSubscription = createMockSubscription();
  const mockOnUpdate = jest.fn();
  const mockOnGenerateEmail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders subscription information correctly', () => {
    renderWithProviders(
      <SubscriptionCard 
        subscription={mockSubscription}
        onUpdate={mockOnUpdate}
        onGenerateEmail={mockOnGenerateEmail}
      />
    );

    expect(screen.getByText('Test Newsletter')).toBeInTheDocument();
    expect(screen.getByText('test@newsletter.com')).toBeInTheDocument();
    expect(screen.getByText('Détecté')).toBeInTheDocument();
    expect(screen.getByText(/09\/07\/2025/)).toBeInTheDocument();
  });

  it('displays correct status badge color', () => {
    const { rerender } = renderWithProviders(
      <SubscriptionCard 
        subscription={mockSubscription}
        onUpdate={mockOnUpdate}
        onGenerateEmail={mockOnGenerateEmail}
      />
    );

    // Status "detected" should show blue badge
    expect(screen.getByText('Détecté')).toHaveClass('bg-blue-100', 'text-blue-800');

    // Test other statuses
    const sentSubscription = { ...mockSubscription, status: 'unsubscribe_sent' };
    rerender(
      <SubscriptionCard 
        subscription={sentSubscription}
        onUpdate={mockOnUpdate}
        onGenerateEmail={mockOnGenerateEmail}
      />
    );

    expect(screen.getByText('Email envoyé')).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('shows generate email button for detected subscriptions', () => {
    renderWithProviders(
      <SubscriptionCard 
        subscription={mockSubscription}
        onUpdate={mockOnUpdate}
        onGenerateEmail={mockOnGenerateEmail}
      />
    );

    const generateButton = screen.getByText('Générer email');
    expect(generateButton).toBeInTheDocument();
    expect(generateButton).not.toBeDisabled();
  });

  it('shows mark as unsubscribed button for sent subscriptions', () => {
    const sentSubscription = { ...mockSubscription, status: 'unsubscribe_sent' };
    
    renderWithProviders(
      <SubscriptionCard 
        subscription={sentSubscription}
        onUpdate={mockOnUpdate}
        onGenerateEmail={mockOnGenerateEmail}
      />
    );

    expect(screen.getByText('Marquer comme désinscrit')).toBeInTheDocument();
    expect(screen.queryByText('Générer email')).not.toBeInTheDocument();
  });

  it('calls onGenerateEmail when generate button is clicked', async () => {
    renderWithProviders(
      <SubscriptionCard 
        subscription={mockSubscription}
        onUpdate={mockOnUpdate}
        onGenerateEmail={mockOnGenerateEmail}
      />
    );

    const generateButton = screen.getByText('Générer email');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockOnGenerateEmail).toHaveBeenCalledWith(mockSubscription.id);
    });
  });

  it('calls onUpdate when mark as unsubscribed is clicked', async () => {
    const sentSubscription = { ...mockSubscription, status: 'unsubscribe_sent' };
    
    renderWithProviders(
      <SubscriptionCard 
        subscription={sentSubscription}
        onUpdate={mockOnUpdate}
        onGenerateEmail={mockOnGenerateEmail}
      />
    );

    const markButton = screen.getByText('Marquer comme désinscrit');
    fireEvent.click(markButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(sentSubscription.id, 'unsubscribed');
    });
  });

  it('shows confidence score when available', () => {
    const subscriptionWithScore = { 
      ...mockSubscription, 
      confidenceScore: 0.87 
    };
    
    renderWithProviders(
      <SubscriptionCard 
        subscription={subscriptionWithScore}
        onUpdate={mockOnUpdate}
        onGenerateEmail={mockOnGenerateEmail}
      />
    );

    expect(screen.getByText('87%')).toBeInTheDocument();
  });

  it('is accessible with proper ARIA labels', () => {
    renderWithProviders(
      <SubscriptionCard 
        subscription={mockSubscription}
        onUpdate={mockOnUpdate}
        onGenerateEmail={mockOnGenerateEmail}
      />
    );

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', 
      expect.stringContaining('Test Newsletter')
    );

    const generateButton = screen.getByRole('button', { name: /générer email/i });
    expect(generateButton).toHaveAttribute('aria-describedby');
  });
});
```

#### Tests de Hooks
```javascript
// src/hooks/__tests__/useSubscriptions.test.js
import { renderHook, act, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { server } from '../../mocks/server';
import { useSubscriptions } from '../useSubscriptions';
import { createMockSubscriptions } from '../../utils/testUtils';

describe('useSubscriptions', () => {
  const mockSubscriptions = createMockSubscriptions(3);

  beforeEach(() => {
    // Setup default API responses
    server.use(
      rest.get('/api/subscriptions', (req, res, ctx) => {
        return res(ctx.json(mockSubscriptions));
      })
    );
  });

  it('fetches subscriptions on mount', async () => {
    const { result } = renderHook(() => useSubscriptions());

    expect(result.current.loading).toBe(true);
    expect(result.current.subscriptions).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.subscriptions).toHaveLength(3);
    expect(result.current.error).toBeNull();
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    server.use(
      rest.get('/api/subscriptions', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
      })
    );

    const { result } = renderHook(() => useSubscriptions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.subscriptions).toEqual([]);
  });

  it('refetches subscriptions when refresh is called', async () => {
    const { result } = renderHook(() => useSubscriptions());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock new data
    const newSubscriptions = createMockSubscriptions(5);
    server.use(
      rest.get('/api/subscriptions', (req, res, ctx) => {
        return res(ctx.json(newSubscriptions));
      })
    );

    act(() => {
      result.current.refresh();
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.subscriptions).toHaveLength(5);
  });

  it('updates subscription optimistically', async () => {
    const { result } = renderHook(() => useSubscriptions());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock update API
    server.use(
      rest.put('/api/subscriptions/:id/status', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
      })
    );

    act(() => {
      result.current.updateSubscription('sub_0', 'unsubscribed');
    });

    // Should update optimistically
    expect(result.current.subscriptions[0].status).toBe('unsubscribed');
  });

  it('filters subscriptions by status', async () => {
    const { result } = renderHook(() => useSubscriptions({ status: 'detected' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check that API was called with filter
    // (this would need to be verified in the actual implementation)
    expect(result.current.subscriptions.every(sub => sub.status === 'detected')).toBe(true);
  });
});
```

## 🔗 Tests d'Intégration

### Tests API + Base de Données

```python
# tests/integration/test_api_integration.py
import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient
from datetime import datetime, timedelta

class TestSubscriptionAPIIntegration:
    """Tests d'intégration pour l'API des abonnements"""
    
    @pytest.fixture(autouse=True)
    def setup_data(self, test_db, sample_user, sample_subscription):
        """Setup des données pour chaque test"""
        # Insérer utilisateur et abonnement de test
        test_db.users.insert_one(sample_user)
        test_db.subscriptions.insert_one(sample_subscription)
        
        self.user_id = sample_user["id"]
        self.subscription_id = sample_subscription["id"]
    
    def test_get_subscriptions_with_filters(self, client):
        """Test récupération des abonnements avec filtres"""
        
        # Créer plusieurs abonnements avec différents statuts
        subscriptions = [
            {
                "id": f"sub_test_{i}",
                "user_id": self.user_id,
                "email": "test@example.com",
                "service_name": f"Service {i}",
                "sender_email": f"service{i}@example.com",
                "category": "newsletter",
                "status": "detected" if i % 2 == 0 else "unsubscribe_sent",
                "detected_at": datetime.now()
            }
            for i in range(5)
        ]
        
        for sub in subscriptions:
            client.app.dependency_overrides[get_database]().subscriptions.insert_one(sub)
        
        # Test filtre par statut
        response = client.get(
            f"/api/subscriptions?status=detected",
            headers={"Authorization": f"Bearer {self.get_test_token()}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3  # 2 detected + 1 du setup
        assert all(sub["status"] == "detected" for sub in data)
    
    def test_subscription_workflow_complete(self, client):
        """Test du workflow complet de désinscription"""
        
        # 1. Récupérer l'abonnement
        response = client.get(
            f"/api/subscriptions/{self.subscription_id}",
            headers={"Authorization": f"Bearer {self.get_test_token()}"}
        )
        assert response.status_code == 200
        subscription = response.json()
        assert subscription["status"] == "detected"
        
        # 2. Générer un email de désinscription
        response = client.post(
            f"/api/generate-unsubscribe-email/{self.subscription_id}",
            headers={"Authorization": f"Bearer {self.get_test_token()}"}
        )
        assert response.status_code == 200
        email_data = response.json()
        assert "email_content" in email_data
        assert email_data["to"] == subscription["sender_email"]
        
        # 3. Envoyer l'email de désinscription
        response = client.post(
            "/api/send-unsubscribe",
            json={
                "subscription_id": self.subscription_id,
                "email_content": email_data["email_content"]
            },
            headers={"Authorization": f"Bearer {self.get_test_token()}"}
        )
        assert response.status_code == 200
        
        # 4. Vérifier que le statut a été mis à jour
        response = client.get(
            f"/api/subscriptions/{self.subscription_id}",
            headers={"Authorization": f"Bearer {self.get_test_token()}"}
        )
        assert response.status_code == 200
        updated_subscription = response.json()
        assert updated_subscription["status"] == "unsubscribe_sent"
        assert updated_subscription["unsubscribe_sent_at"] is not None
        
        # 5. Marquer comme désinscrit
        response = client.put(
            f"/api/subscriptions/{self.subscription_id}/status",
            params={"status": "unsubscribed"},
            headers={"Authorization": f"Bearer {self.get_test_token()}"}
        )
        assert response.status_code == 200
        
        # 6. Vérification finale
        response = client.get(
            f"/api/subscriptions/{self.subscription_id}",
            headers={"Authorization": f"Bearer {self.get_test_token()}"}
        )
        final_subscription = response.json()
        assert final_subscription["status"] == "unsubscribed"
    
    def test_scan_email_integration(self, client, mock_gmail_service):
        """Test d'intégration du scan d'emails"""
        
        # Mock du service Gmail pour retourner des emails de test
        mock_emails = [
            {
                "id": "email_1",
                "headers": {
                    "From": "newsletter@tech.com",
                    "List-ID": "<newsletter.tech.com>",
                    "List-Unsubscribe": "<mailto:unsubscribe@tech.com>"
                },
                "subject": "Weekly Tech News",
                "body": "This week in tech..."
            },
            {
                "id": "email_2", 
                "headers": {
                    "From": "deals@shop.com",
                    "Return-Path": "bounce@shop.com"
                },
                "subject": "Flash Sale - 50% Off!",
                "body": "Limited time offer... Unsubscribe: http://shop.com/unsub"
            }
        ]
        
        mock_gmail_service.scan_emails.return_value = mock_emails
        
        # Lancer le scan
        response = client.post(
            "/api/scan-email",
            json={"max_emails": 100},
            headers={"Authorization": f"Bearer {self.get_test_token()}"}
        )
        
        assert response.status_code == 200
        scan_result = response.json()
        assert "scan_id" in scan_result
        
        # Vérifier que les abonnements ont été créés
        # (En réalité, il faudrait attendre la fin du scan asynchrone)
        response = client.get(
            "/api/subscriptions",
            headers={"Authorization": f"Bearer {self.get_test_token()}"}
        )
        
        subscriptions = response.json()
        # Should include original + 2 new detected subscriptions
        assert len(subscriptions) >= 3
        
        # Vérifier la détection correcte
        tech_sub = next((s for s in subscriptions if "tech.com" in s["sender_email"]), None)
        assert tech_sub is not None
        assert tech_sub["category"] == "newsletter"
        
        shop_sub = next((s for s in subscriptions if "shop.com" in s["sender_email"]), None)
        assert shop_sub is not None
        assert shop_sub["category"] == "ecommerce"
    
    def get_test_token(self):
        """Générer un token JWT de test"""
        # Implementation would depend on your JWT setup
        return "test_jwt_token"
```

### Tests Frontend + API

```javascript
// src/__tests__/integration/SubscriptionWorkflow.test.js
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { server } from '../../mocks/server';
import { renderWithProviders, createMockSubscriptions } from '../../utils/testUtils';
import App from '../../App';

describe('Subscription Workflow Integration', () => {
  beforeEach(() => {
    // Setup authenticated user
    localStorage.setItem('token', 'test_jwt_token');
    localStorage.setItem('user', JSON.stringify({
      id: 'test_user_123',
      email: 'test@example.com',
      name: 'Test User'
    }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('completes full unsubscribe workflow', async () => {
    const mockSubscriptions = createMockSubscriptions(2);
    
    // Setup API responses
    server.use(
      rest.get('/api/subscriptions', (req, res, ctx) => {
        return res(ctx.json(mockSubscriptions));
      }),
      
      rest.post('/api/generate-unsubscribe-email/:id', (req, res, ctx) => {
        const { id } = req.params;
        return res(ctx.json({
          email_content: {
            to: 'unsubscribe@service.com',
            subject: 'Demande de désinscription',
            body: 'Veuillez me désinscrire...'
          }
        }));
      }),
      
      rest.post('/api/send-unsubscribe', (req, res, ctx) => {
        return res(ctx.json({
          message: 'Email envoyé avec succès',
          status: 'sent'
        }));
      }),
      
      rest.put('/api/subscriptions/:id/status', (req, res, ctx) => {
        return res(ctx.json({
          message: 'Statut mis à jour'
        }));
      })
    );

    renderWithProviders(<App />);

    // 1. Vérifier que les abonnements sont affichés
    await waitFor(() => {
      expect(screen.getByText('Service 0')).toBeInTheDocument();
      expect(screen.getByText('Service 1')).toBeInTheDocument();
    });

    // 2. Cliquer sur "Générer email" pour le premier abonnement
    const generateButtons = screen.getAllByText('Générer email');
    fireEvent.click(generateButtons[0]);

    // 3. Vérifier que l'aperçu d'email est affiché
    await waitFor(() => {
      expect(screen.getByText(/Aperçu de l'email/)).toBeInTheDocument();
      expect(screen.getByText('unsubscribe@service.com')).toBeInTheDocument();
    });

    // 4. Confirmer l'envoi
    const sendButton = screen.getByText('Envoyer');
    fireEvent.click(sendButton);

    // 5. Vérifier la notification de succès
    await waitFor(() => {
      expect(screen.getByText(/Email envoyé avec succès/)).toBeInTheDocument();
    });

    // 6. Vérifier que le statut a changé
    await waitFor(() => {
      expect(screen.getByText('Email envoyé')).toBeInTheDocument();
    });

    // 7. Marquer comme désinscrit
    const markButton = screen.getByText('Marquer comme désinscrit');
    fireEvent.click(markButton);

    // 8. Vérifier le statut final
    await waitFor(() => {
      expect(screen.getByText('✅ Terminé')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const mockSubscriptions = createMockSubscriptions(1);
    
    server.use(
      rest.get('/api/subscriptions', (req, res, ctx) => {
        return res(ctx.json(mockSubscriptions));
      }),
      
      rest.post('/api/generate-unsubscribe-email/:id', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({
          error: 'Erreur serveur'
        }));
      })
    );

    renderWithProviders(<App />);

    await waitFor(() => {
      expect(screen.getByText('Service 0')).toBeInTheDocument();
    });

    const generateButton = screen.getByText('Générer email');
    fireEvent.click(generateButton);

    // Vérifier que l'erreur est affichée
    await waitFor(() => {
      expect(screen.getByText(/Erreur lors de la génération/)).toBeInTheDocument();
    });
  });

  it('updates statistics correctly', async () => {
    const mockSubscriptions = [
      createMockSubscription({ id: 'sub_1', status: 'detected' }),
      createMockSubscription({ id: 'sub_2', status: 'unsubscribe_sent' }),
      createMockSubscription({ id: 'sub_3', status: 'unsubscribed' }),
    ];
    
    server.use(
      rest.get('/api/subscriptions', (req, res, ctx) => {
        return res(ctx.json(mockSubscriptions));
      })
    );

    renderWithProviders(<App />);

    // Vérifier les statistiques
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total
      expect(screen.getByText('1')).toBeInTheDocument(); // Détectés
      expect(screen.getByText('1')).toBeInTheDocument(); // Envoyés
      expect(screen.getByText('1')).toBeInTheDocument(); // Désinscris
    });
  });
});
```

## 🎭 Tests End-to-End

### Configuration Cypress

```javascript
// cypress.config.js
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Configuration viewport
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Video and screenshots
    video: true,
    screenshotOnRunFailure: true,
    
    // Environment variables
    env: {
      apiUrl: 'http://localhost:8001',
      testUserEmail: 'test@example.com',
      testUserPassword: 'test123456'
    },
    
    // Custom options
    experimentalStudio: true,
    experimentalWebKitSupport: true
  },
  
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
});
```

#### Commands Personnalisées
```javascript
// cypress/support/commands.js

// Command pour l'authentification
Cypress.Commands.add('login', (email = 'test@example.com') => {
  cy.window().then((win) => {
    // Mock de l'authentification
    win.localStorage.setItem('token', 'test_jwt_token');
    win.localStorage.setItem('user', JSON.stringify({
      id: 'test_user_123',
      email: email,
      name: 'Test User',
      isAuthenticated: true
    }));
  });
});

// Command pour setup des données de test
Cypress.Commands.add('setupTestData', () => {
  const subscriptions = [
    {
      id: 'sub_1',
      serviceName: 'Tech Newsletter',
      senderEmail: 'newsletter@tech.com',
      status: 'detected',
      category: 'newsletter'
    },
    {
      id: 'sub_2',
      serviceName: 'Shopping Deals',
      senderEmail: 'deals@shop.com',
      status: 'unsubscribe_sent',
      category: 'ecommerce'
    }
  ];
  
  cy.intercept('GET', '/api/subscriptions', {
    statusCode: 200,
    body: subscriptions
  }).as('getSubscriptions');
});

// Command pour vérifier l'accessibilité
Cypress.Commands.add('checkA11y', (context = null, options = null) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});

// Command pour attendre le chargement
Cypress.Commands.add('waitForAppLoad', () => {
  cy.get('[data-testid="app-loaded"]', { timeout: 10000 }).should('exist');
});

// Commands pour les éléments de test
Cypress.Commands.add('getByTestId', (testId) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('findByTestId', (testId) => {
  return cy.find(`[data-testid="${testId}"]`);
});
```

#### Tests E2E Principaux
```javascript
// cypress/e2e/unsubscribe-workflow.cy.js
describe('Unsubscribe Workflow E2E', () => {
  beforeEach(() => {
    // Setup pour chaque test
    cy.login();
    cy.setupTestData();
    cy.visit('/');
    cy.waitForAppLoad();
  });

  it('should complete full unsubscribe workflow', () => {
    // 1. Vérifier l'état initial
    cy.getByTestId('subscription-card').should('have.length', 2);
    cy.getByTestId('stats-total').should('contain', '2');
    cy.getByTestId('stats-detected').should('contain', '1');
    
    // 2. Démarrer la désinscription
    cy.getByTestId('subscription-card').first().within(() => {
      cy.contains('Tech Newsletter').should('be.visible');
      cy.contains('newsletter@tech.com').should('be.visible');
      cy.getByTestId('generate-email-btn').click();
    });
    
    // 3. Vérifier l'aperçu de l'email
    cy.getByTestId('email-preview-modal').should('be.visible');
    cy.getByTestId('email-preview-to').should('contain', 'newsletter@tech.com');
    cy.getByTestId('email-preview-subject').should('contain', 'Demande de désinscription');
    
    // 4. Envoyer l'email
    cy.intercept('POST', '/api/send-unsubscribe', {
      statusCode: 200,
      body: { message: 'Email envoyé avec succès', status: 'sent' }
    }).as('sendUnsubscribe');
    
    cy.getByTestId('send-email-btn').click();
    cy.wait('@sendUnsubscribe');
    
    // 5. Vérifier la notification de succès
    cy.getByTestId('success-toast')
      .should('be.visible')
      .and('contain', 'Email envoyé avec succès');
    
    // 6. Vérifier que le statut a changé
    cy.getByTestId('subscription-card').first().within(() => {
      cy.getByTestId('status-badge').should('contain', 'Email envoyé');
      cy.getByTestId('mark-unsubscribed-btn').should('be.visible');
    });
    
    // 7. Marquer comme désinscrit
    cy.intercept('PUT', '/api/subscriptions/*/status', {
      statusCode: 200,
      body: { message: 'Statut mis à jour' }
    }).as('updateStatus');
    
    cy.getByTestId('subscription-card').first().within(() => {
      cy.getByTestId('mark-unsubscribed-btn').click();
    });
    
    cy.wait('@updateStatus');
    
    // 8. Vérifier l'état final
    cy.getByTestId('subscription-card').first().within(() => {
      cy.getByTestId('status-badge').should('contain', '✅ Terminé');
    });
    
    // 9. Vérifier les statistiques mises à jour
    cy.getByTestId('stats-unsubscribed').should('contain', '1');
  });

  it('should handle scan workflow', () => {
    // Mock scan API
    cy.intercept('POST', '/api/scan-email', {
      statusCode: 200,
      body: { scan_id: 'scan_123', status: 'started' }
    }).as('startScan');
    
    cy.intercept('GET', '/api/scan-status/scan_123', {
      statusCode: 200,
      body: { 
        scan_id: 'scan_123', 
        status: 'completed',
        subscriptions_found: 5
      }
    }).as('scanStatus');
    
    // Lancer le scan
    cy.getByTestId('scan-button').click();
    cy.wait('@startScan');
    
    // Vérifier l'indicateur de progression
    cy.getByTestId('scan-progress').should('be.visible');
    cy.getByTestId('scan-progress-text').should('contain', 'Scan en cours');
    
    // Attendre la fin du scan
    cy.wait('@scanStatus');
    
    // Vérifier les résultats
    cy.getByTestId('scan-results').should('be.visible');
    cy.getByTestId('scan-results-count').should('contain', '5 abonnements trouvés');
  });

  it('should handle errors gracefully', () => {
    // Mock erreur API
    cy.intercept('POST', '/api/generate-unsubscribe-email/*', {
      statusCode: 500,
      body: { error: 'Erreur serveur' }
    }).as('generateEmailError');
    
    // Tenter de générer un email
    cy.getByTestId('subscription-card').first().within(() => {
      cy.getByTestId('generate-email-btn').click();
    });
    
    cy.wait('@generateEmailError');
    
    // Vérifier l'affichage de l'erreur
    cy.getByTestId('error-toast')
      .should('be.visible')
      .and('contain', 'Erreur lors de la génération');
    
    // Vérifier que l'interface reste utilisable
    cy.getByTestId('subscription-card').should('be.visible');
    cy.getByTestId('scan-button').should('not.be.disabled');
  });

  it('should be accessible', () => {
    // Test d'accessibilité avec axe-core
    cy.checkA11y();
    
    // Navigation au clavier
    cy.get('body').tab();
    cy.focused().should('have.attr', 'data-testid', 'scan-button');
    
    cy.focused().tab();
    cy.focused().should('have.attr', 'data-testid', 'generate-email-btn');
    
    // Vérifier les labels ARIA
    cy.getByTestId('subscription-card').first()
      .should('have.attr', 'role', 'article')
      .and('have.attr', 'aria-label');
    
    // Vérifier le contraste des couleurs
    cy.getByTestId('status-badge').should('be.visible');
  });

  it('should work on mobile viewport', () => {
    // Changer pour un viewport mobile
    cy.viewport('iphone-x');
    
    // Vérifier que l'interface s'adapte
    cy.getByTestId('subscription-card').should('be.visible');
    cy.getByTestId('stats-grid').should('have.class', 'grid-cols-2');
    
    // Tester l'interaction tactile
    cy.getByTestId('subscription-card').first().tap();
    cy.getByTestId('generate-email-btn').should('be.visible');
  });
});
```

### Tests de Performance

```javascript
// cypress/e2e/performance.cy.js
describe('Performance Tests', () => {
  it('should load app within acceptable time', () => {
    // Mesurer le temps de chargement
    const start = Date.now();
    
    cy.visit('/');
    cy.waitForAppLoad();
    
    cy.then(() => {
      const loadTime = Date.now() - start;
      expect(loadTime).to.be.lessThan(3000); // Moins de 3 secondes
    });
  });

  it('should handle large datasets efficiently', () => {
    // Mock d'un grand dataset
    const largeDataset = Array.from({ length: 100 }, (_, i) => ({
      id: `sub_${i}`,
      serviceName: `Service ${i}`,
      senderEmail: `service${i}@example.com`,
      status: 'detected'
    }));
    
    cy.intercept('GET', '/api/subscriptions', {
      statusCode: 200,
      body: largeDataset
    }).as('getLargeDataset');
    
    cy.login();
    cy.visit('/');
    cy.wait('@getLargeDataset');
    
    // Vérifier que le rendu reste fluide
    cy.getByTestId('subscription-card').should('have.length.at.least', 20);
    
    // Tester le scroll
    cy.scrollTo('bottom', { duration: 1000 });
    cy.getByTestId('pagination').should('be.visible');
  });
});
```

---

*Guide de tests complet - Assurance qualité robuste pour l'application*