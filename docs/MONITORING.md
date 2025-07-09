# 📊 Guide de Monitoring et Observabilité

## 📋 Table des Matières

1. [Vue d'Ensemble du Monitoring](#vue-densemble-du-monitoring)
2. [Métriques Application](#métriques-application)
3. [Logging et Tracing](#logging-et-tracing)
4. [Alerting](#alerting)
5. [Dashboards](#dashboards)
6. [Health Checks](#health-checks)
7. [Performance Monitoring](#performance-monitoring)

## 🎯 Vue d'Ensemble du Monitoring

### Architecture de Monitoring
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Prometheus    │    │    Grafana      │
│                 │───▶│   (Métriques)   │───▶│  (Dashboards)   │
│  - Backend      │    │                 │    │                 │
│  - Frontend     │    └─────────────────┘    └─────────────────┘
│  - Database     │              │                       │
└─────────────────┘              │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │  AlertManager   │    │      ELK        │
         └─────────────▶│   (Alertes)     │    │   (Logging)     │
                        │                 │    │                 │
                        └─────────────────┘    └─────────────────┘
```

### Piliers de l'Observabilité

#### 1. Métriques (Metrics)
- **Performance** : Temps de réponse, throughput
- **Erreurs** : Taux d'erreur, types d'erreurs
- **Utilisation** : CPU, mémoire, disque
- **Business** : Scans effectués, emails envoyés

#### 2. Logs
- **Application** : Événements métier
- **Sécurité** : Authentification, accès
- **Erreurs** : Stack traces, contexte
- **Audit** : Actions utilisateur

#### 3. Traces
- **Requêtes** : Suivi end-to-end
- **Performance** : Goulots d'étranglement
- **Dépendances** : Appels externes

## 📈 Métriques Application

### Configuration Prometheus (Backend)

#### Setup Prometheus avec FastAPI
```python
# backend/monitoring/prometheus.py
from prometheus_client import Counter, Histogram, Gauge, start_http_server
from prometheus_client.core import CollectorRegistry
import time
from functools import wraps

# Registry pour isoler les métriques
registry = CollectorRegistry()

# Métriques HTTP
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code'],
    registry=registry
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    registry=registry,
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

# Métriques Business
gmail_api_calls_total = Counter(
    'gmail_api_calls_total',
    'Total Gmail API calls',
    ['operation', 'status'],
    registry=registry
)

email_scans_total = Counter(
    'email_scans_total',
    'Total email scans performed',
    ['user_id', 'status'],
    registry=registry
)

emails_sent_total = Counter(
    'emails_sent_total',
    'Total unsubscribe emails sent',
    ['status'],
    registry=registry
)

subscriptions_detected_total = Counter(
    'subscriptions_detected_total',
    'Total subscriptions detected',
    ['category'],
    registry=registry
)

# Métriques d'état
active_users = Gauge(
    'active_users_total',
    'Number of active users',
    registry=registry
)

database_connections = Gauge(
    'database_connections_active',
    'Active database connections',
    registry=registry
)

# Middleware de métriques
class PrometheusMiddleware:
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        method = scope["method"]
        path = scope["path"]
        
        # Ignorer les métriques endpoint
        if path == "/metrics":
            await self.app(scope, receive, send)
            return
        
        start_time = time.time()
        
        # Wrapper pour capturer le status code
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                status_code = message["status"]
                
                # Enregistrer les métriques
                duration = time.time() - start_time
                http_requests_total.labels(
                    method=method,
                    endpoint=path,
                    status_code=status_code
                ).inc()
                
                http_request_duration_seconds.labels(
                    method=method,
                    endpoint=path
                ).observe(duration)
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)

# Décorateurs pour métriques business
def track_gmail_api_call(operation: str):
    """Décorateur pour tracker les appels Gmail API"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                result = await func(*args, **kwargs)
                gmail_api_calls_total.labels(
                    operation=operation,
                    status='success'
                ).inc()
                return result
            except Exception as e:
                gmail_api_calls_total.labels(
                    operation=operation,
                    status='error'
                ).inc()
                raise
        return wrapper
    return decorator

def track_email_scan(func):
    """Décorateur pour tracker les scans d'email"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        user_id = kwargs.get('user_id', 'unknown')
        try:
            result = await func(*args, **kwargs)
            email_scans_total.labels(
                user_id=user_id,
                status='completed'
            ).inc()
            
            # Tracker les abonnements détectés
            if 'subscriptions' in result:
                for subscription in result['subscriptions']:
                    subscriptions_detected_total.labels(
                        category=subscription.get('category', 'unknown')
                    ).inc()
            
            return result
        except Exception as e:
            email_scans_total.labels(
                user_id=user_id,
                status='failed'
            ).inc()
            raise
    return wrapper
```

#### Intégration avec FastAPI
```python
# backend/server.py
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from backend.monitoring.prometheus import PrometheusMiddleware, registry

app = FastAPI()

# Ajouter le middleware Prometheus
app.add_middleware(PrometheusMiddleware)

@app.get("/metrics")
async def metrics():
    """Endpoint pour exposer les métriques Prometheus"""
    return Response(
        generate_latest(registry),
        media_type=CONTENT_TYPE_LATEST
    )

# Exemple d'utilisation des décorateurs
@app.post("/api/scan-email")
@track_email_scan
async def scan_email(user_id: str = Depends(get_current_user_id)):
    # Logique de scan
    pass

@gmail_api_call("list_messages") 
async def get_gmail_messages(service, user_id: str):
    # Appel Gmail API
    pass
```

### Configuration côté Frontend

#### Métriques Frontend avec Custom Events
```javascript
// src/monitoring/metrics.js
class FrontendMetrics {
  constructor() {
    this.metricsEndpoint = `${process.env.REACT_APP_BACKEND_URL}/api/metrics`;
    this.batchSize = 10;
    this.batchTimeout = 5000; // 5 secondes
    this.metricsQueue = [];
    this.startBatchTimer();
  }

  // Métriques de performance
  trackPageLoad(pageName, loadTime) {
    this.addMetric({
      type: 'page_load',
      page: pageName,
      duration: loadTime,
      timestamp: Date.now()
    });
  }

  trackApiCall(endpoint, method, duration, statusCode) {
    this.addMetric({
      type: 'api_call',
      endpoint: endpoint,
      method: method,
      duration: duration,
      status_code: statusCode,
      timestamp: Date.now()
    });
  }

  trackUserAction(action, context = {}) {
    this.addMetric({
      type: 'user_action',
      action: action,
      context: context,
      timestamp: Date.now()
    });
  }

  trackError(error, context = {}) {
    this.addMetric({
      type: 'error',
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: Date.now()
    });
  }

  // Métriques business
  trackSubscriptionAction(action, subscriptionId, result) {
    this.addMetric({
      type: 'subscription_action',
      action: action, // 'generate_email', 'send_unsubscribe', 'mark_unsubscribed'
      subscription_id: subscriptionId,
      result: result, // 'success', 'error'
      timestamp: Date.now()
    });
  }

  trackEmailScan(result) {
    this.addMetric({
      type: 'email_scan',
      subscriptions_found: result.subscriptionsFound,
      duration: result.duration,
      status: result.status,
      timestamp: Date.now()
    });
  }

  // Gestion de la queue
  addMetric(metric) {
    this.metricsQueue.push(metric);
    
    if (this.metricsQueue.length >= this.batchSize) {
      this.flushMetrics();
    }
  }

  flushMetrics() {
    if (this.metricsQueue.length === 0) return;

    const metrics = [...this.metricsQueue];
    this.metricsQueue = [];

    // Envoyer les métriques au backend
    fetch(this.metricsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ metrics })
    }).catch(error => {
      console.warn('Failed to send metrics:', error);
      // Optionnel: remettre les métriques en queue
    });
  }

  startBatchTimer() {
    setInterval(() => {
      this.flushMetrics();
    }, this.batchTimeout);
  }

  // Métriques Web Vitals
  trackWebVitals() {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.addMetric({
        type: 'web_vital',
        metric: 'LCP',
        value: lastEntry.startTime,
        timestamp: Date.now()
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.addMetric({
          type: 'web_vital',
          metric: 'FID',
          value: entry.processingStart - entry.startTime,
          timestamp: Date.now()
        });
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.addMetric({
        type: 'web_vital',
        metric: 'CLS',
        value: clsValue,
        timestamp: Date.now()
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }
}

// Instance globale
export const metrics = new FrontendMetrics();
```

#### Hooks pour le Tracking
```javascript
// src/hooks/useMetrics.js
import { useCallback, useEffect } from 'react';
import { metrics } from '../monitoring/metrics';

export const useMetrics = () => {
  // Track page views
  const trackPageView = useCallback((pageName) => {
    const startTime = performance.now();
    
    // Track quand le composant se démonte
    return () => {
      const duration = performance.now() - startTime;
      metrics.trackPageLoad(pageName, duration);
    };
  }, []);

  // Track API calls
  const trackApiCall = useCallback(async (apiFunction, endpoint, method = 'GET') => {
    const startTime = performance.now();
    
    try {
      const result = await apiFunction();
      const duration = performance.now() - startTime;
      
      metrics.trackApiCall(endpoint, method, duration, 200);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const statusCode = error.response?.status || 0;
      
      metrics.trackApiCall(endpoint, method, duration, statusCode);
      metrics.trackError(error, { endpoint, method });
      throw error;
    }
  }, []);

  // Track user actions
  const trackUserAction = useCallback((action, context) => {
    metrics.trackUserAction(action, context);
  }, []);

  return {
    trackPageView,
    trackApiCall,
    trackUserAction
  };
};

// Hook spécifique pour les abonnements
export const useSubscriptionMetrics = () => {
  const trackGenerateEmail = useCallback((subscriptionId, success) => {
    metrics.trackSubscriptionAction('generate_email', subscriptionId, success ? 'success' : 'error');
  }, []);

  const trackSendUnsubscribe = useCallback((subscriptionId, success) => {
    metrics.trackSubscriptionAction('send_unsubscribe', subscriptionId, success ? 'success' : 'error');
  }, []);

  const trackMarkUnsubscribed = useCallback((subscriptionId, success) => {
    metrics.trackSubscriptionAction('mark_unsubscribed', subscriptionId, success ? 'success' : 'error');
  }, []);

  const trackEmailScan = useCallback((result) => {
    metrics.trackEmailScan(result);
  }, []);

  return {
    trackGenerateEmail,
    trackSendUnsubscribe,
    trackMarkUnsubscribed,
    trackEmailScan
  };
};
```

## 📝 Logging et Tracing

### Configuration ELK Stack

#### Logstash Configuration
```yaml
# logstash/pipeline/unsubscribe-app.conf
input {
  file {
    path => "/var/log/unsubscribe-app/*.log"
    start_position => "beginning"
    codec => "json"
    tags => ["unsubscribe-app"]
  }
  
  beats {
    port => 5044
  }
}

filter {
  if [tags] and "unsubscribe-app" in [tags] {
    # Parser les logs JSON
    json {
      source => "message"
    }
    
    # Extraire les informations de timestamp
    date {
      match => [ "timestamp", "ISO8601" ]
      target => "@timestamp"
    }
    
    # Enrichir avec des métadonnées
    mutate {
      add_field => {
        "application" => "unsubscribe-app"
        "environment" => "%{[@metadata][environment]}"
      }
    }
    
    # Parser les erreurs spécifiques
    if [level] == "ERROR" {
      grok {
        match => { 
          "message" => "(?<error_type>[A-Za-z]+Error): (?<error_message>.*)" 
        }
        tag_on_failure => ["_grokparsefailure"]
      }
    }
    
    # Géolocalisation des IPs
    if [ip_address] {
      geoip {
        source => "ip_address"
        target => "geoip"
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "unsubscribe-app-%{+YYYY.MM.dd}"
    template_name => "unsubscribe-app"
  }
  
  # Debug output
  stdout {
    codec => rubydebug
  }
}
```

#### Structured Logging Backend
```python
# backend/logging/structured_logger.py
import json
import logging
import traceback
from datetime import datetime
from typing import Dict, Any, Optional

class StructuredLogger:
    def __init__(self, name: str, level: str = "INFO"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, level.upper()))
        
        # Handler avec format JSON
        handler = logging.StreamHandler()
        handler.setFormatter(self.JSONFormatter())
        self.logger.addHandler(handler)
    
    class JSONFormatter(logging.Formatter):
        def format(self, record):
            log_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'level': record.levelname,
                'logger': record.name,
                'message': record.getMessage(),
                'module': record.module,
                'function': record.funcName,
                'line': record.lineno
            }
            
            # Ajouter des champs custom si présents
            if hasattr(record, 'user_id'):
                log_entry['user_id'] = record.user_id
            if hasattr(record, 'trace_id'):
                log_entry['trace_id'] = record.trace_id
            if hasattr(record, 'span_id'):
                log_entry['span_id'] = record.span_id
            if hasattr(record, 'extra_data'):
                log_entry['extra_data'] = record.extra_data
            
            # Gestion des exceptions
            if record.exc_info:
                log_entry['exception'] = {
                    'type': record.exc_info[0].__name__,
                    'message': str(record.exc_info[1]),
                    'traceback': traceback.format_exception(*record.exc_info)
                }
            
            return json.dumps(log_entry)
    
    def info(self, message: str, **kwargs):
        self._log('info', message, **kwargs)
    
    def error(self, message: str, **kwargs):
        self._log('error', message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self._log('warning', message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        self._log('debug', message, **kwargs)
    
    def _log(self, level: str, message: str, **kwargs):
        extra = {}
        
        # Extraire les champs spéciaux
        if 'user_id' in kwargs:
            extra['user_id'] = kwargs.pop('user_id')
        if 'trace_id' in kwargs:
            extra['trace_id'] = kwargs.pop('trace_id')
        if 'span_id' in kwargs:
            extra['span_id'] = kwargs.pop('span_id')
        
        # Le reste va dans extra_data
        if kwargs:
            extra['extra_data'] = kwargs
        
        getattr(self.logger, level)(message, extra=extra)

# Logger global
app_logger = StructuredLogger('unsubscribe_app')

# Middleware de logging
class LoggingMiddleware:
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Générer un trace ID pour la requête
        trace_id = str(uuid.uuid4())
        
        # Ajouter le trace ID au contexte
        scope["trace_id"] = trace_id
        
        start_time = time.time()
        
        # Log de la requête entrante
        app_logger.info(
            "HTTP request received",
            trace_id=trace_id,
            method=scope["method"],
            path=scope["path"],
            query_string=scope["query_string"].decode(),
            client_ip=scope.get("client", ["unknown", None])[0]
        )
        
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                duration = time.time() - start_time
                status_code = message["status"]
                
                # Log de la réponse
                log_level = "error" if status_code >= 400 else "info"
                getattr(app_logger, log_level)(
                    "HTTP request completed",
                    trace_id=trace_id,
                    status_code=status_code,
                    duration_ms=round(duration * 1000, 2)
                )
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)
```

### Distributed Tracing avec OpenTelemetry

```python
# backend/tracing/opentelemetry_setup.py
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.pymongo import PymongoInstrumentor

def setup_tracing(app, service_name="unsubscribe-app"):
    """Setup OpenTelemetry tracing"""
    
    # Configure le tracer provider
    trace.set_tracer_provider(TracerProvider())
    tracer = trace.get_tracer(__name__)
    
    # Configure Jaeger exporter
    jaeger_exporter = JaegerExporter(
        agent_host_name="jaeger",
        agent_port=6831,
    )
    
    # Configure span processor
    span_processor = BatchSpanProcessor(jaeger_exporter)
    trace.get_tracer_provider().add_span_processor(span_processor)
    
    # Instrument FastAPI
    FastAPIInstrumentor.instrument_app(app)
    
    # Instrument les requêtes HTTP
    RequestsInstrumentor().instrument()
    
    # Instrument MongoDB
    PymongoInstrumentor().instrument()
    
    return tracer

# Décorateur pour tracer les fonctions
def trace_function(operation_name: str = None):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            tracer = trace.get_tracer(__name__)
            name = operation_name or f"{func.__module__}.{func.__name__}"
            
            with tracer.start_as_current_span(name) as span:
                # Ajouter des attributs au span
                span.set_attribute("function.name", func.__name__)
                span.set_attribute("function.module", func.__module__)
                
                try:
                    result = await func(*args, **kwargs)
                    span.set_attribute("success", True)
                    return result
                except Exception as e:
                    span.set_attribute("success", False)
                    span.set_attribute("error.type", type(e).__name__)
                    span.set_attribute("error.message", str(e))
                    raise
        return wrapper
    return decorator

# Exemple d'utilisation
@trace_function("gmail.scan_emails")
async def scan_user_emails(user_id: str, max_emails: int = 100):
    tracer = trace.get_tracer(__name__)
    
    with tracer.start_as_current_span("gmail.authenticate") as auth_span:
        auth_span.set_attribute("user_id", user_id)
        # Logique d'authentification
        
    with tracer.start_as_current_span("gmail.fetch_messages") as fetch_span:
        fetch_span.set_attribute("max_emails", max_emails)
        # Logique de récupération des messages
        
    with tracer.start_as_current_span("email.analyze") as analyze_span:
        # Logique d'analyse des emails
        pass
```

## 🚨 Alerting

### Configuration AlertManager

```yaml
# alertmanager/alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@unsubscribe-app.com'
  smtp_auth_username: 'alerts@unsubscribe-app.com'
  smtp_auth_password: 'app_password'

templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  group_by: ['alertname', 'instance']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default-receiver'
  routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
    group_wait: 0s
    repeat_interval: 5m
  - match:
      severity: warning
    receiver: 'warning-alerts'
  - match:
      alertname: DatabaseDown
    receiver: 'database-alerts'

receivers:
- name: 'default-receiver'
  email_configs:
  - to: 'team@unsubscribe-app.com'
    subject: '[ALERT] {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      Labels: {{ range .Labels.SortedPairs }}{{ .Name }}={{ .Value }} {{ end }}
      {{ end }}

- name: 'critical-alerts'
  email_configs:
  - to: 'oncall@unsubscribe-app.com'
    subject: '[CRITICAL] {{ .GroupLabels.alertname }}'
    body: '{{ template "critical.html" . }}'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#alerts-critical'
    title: 'Critical Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

- name: 'warning-alerts'
  email_configs:
  - to: 'warnings@unsubscribe-app.com'
    subject: '[WARNING] {{ .GroupLabels.alertname }}'

- name: 'database-alerts'
  email_configs:
  - to: 'dba@unsubscribe-app.com'
    subject: '[DATABASE] {{ .GroupLabels.alertname }}'
```

### Règles d'Alertes Prometheus

```yaml
# prometheus/rules/unsubscribe-app.yml
groups:
- name: unsubscribe-app.rules
  rules:
  
  # Alertes de disponibilité
  - alert: ServiceDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service {{ $labels.instance }} is down"
      description: "{{ $labels.instance }} has been down for more than 1 minute"

  - alert: HighErrorRate
    expr: |
      (
        rate(http_requests_total{status_code=~"5.."}[5m]) /
        rate(http_requests_total[5m])
      ) > 0.05
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value | humanizePercentage }} for {{ $labels.instance }}"

  # Alertes de performance
  - alert: HighLatency
    expr: |
      histogram_quantile(0.95, 
        rate(http_request_duration_seconds_bucket[5m])
      ) > 1.0
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High latency detected"
      description: "95th percentile latency is {{ $value }}s for {{ $labels.instance }}"

  - alert: DatabaseConnectionsHigh
    expr: database_connections_active > 80
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High number of database connections"
      description: "{{ $value }} active database connections"

  # Alertes business
  - alert: GmailAPIQuotaHigh
    expr: gmail_api_quota_usage > 0.8
    for: 1m
    labels:
      severity: warning
    annotations:
      summary: "Gmail API quota usage high"
      description: "Gmail API quota usage is {{ $value | humanizePercentage }}"

  - alert: EmailScanFailureRate
    expr: |
      (
        rate(email_scans_total{status="failed"}[10m]) /
        rate(email_scans_total[10m])
      ) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High email scan failure rate"
      description: "Email scan failure rate is {{ $value | humanizePercentage }}"

  - alert: NoEmailScansRecent
    expr: |
      time() - email_scans_total{status="completed"} > 86400
    for: 1h
    labels:
      severity: info
    annotations:
      summary: "No email scans in last 24 hours"
      description: "No successful email scans detected in the last 24 hours"

  # Alertes sécurité
  - alert: HighFailedLogins
    expr: increase(failed_login_attempts_total[5m]) > 10
    for: 0s
    labels:
      severity: warning
    annotations:
      summary: "High number of failed login attempts"
      description: "{{ $value }} failed login attempts in the last 5 minutes"

  - alert: SuspiciousActivity
    expr: increase(security_violations_total[5m]) > 5
    for: 0s
    labels:
      severity: critical
    annotations:
      summary: "Suspicious security activity detected"
      description: "{{ $value }} security violations in the last 5 minutes"
```

### Alertes Custom Python

```python
# backend/monitoring/custom_alerts.py
import asyncio
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from typing import List, Dict
from dataclasses import dataclass

@dataclass
class Alert:
    name: str
    severity: str  # info, warning, critical
    message: str
    labels: Dict[str, str]
    timestamp: datetime

class AlertManager:
    def __init__(self, smtp_config: Dict):
        self.smtp_config = smtp_config
        self.active_alerts = {}
        self.alert_rules = []
        
    def add_rule(self, rule):
        """Ajouter une règle d'alerte"""
        self.alert_rules.append(rule)
    
    async def evaluate_rules(self):
        """Évaluer toutes les règles d'alerte"""
        for rule in self.alert_rules:
            try:
                alert = await rule.evaluate()
                if alert:
                    await self.fire_alert(alert)
            except Exception as e:
                print(f"Error evaluating rule {rule.name}: {e}")
    
    async def fire_alert(self, alert: Alert):
        """Déclencher une alerte"""
        alert_key = f"{alert.name}:{alert.labels.get('instance', 'default')}"
        
        # Éviter les doublons
        if alert_key in self.active_alerts:
            last_alert = self.active_alerts[alert_key]
            if (alert.timestamp - last_alert.timestamp).seconds < 300:  # 5 minutes
                return
        
        self.active_alerts[alert_key] = alert
        
        # Envoyer la notification
        await self.send_notification(alert)
    
    async def send_notification(self, alert: Alert):
        """Envoyer une notification d'alerte"""
        subject = f"[{alert.severity.upper()}] {alert.name}"
        
        body = f"""
Alert: {alert.name}
Severity: {alert.severity}
Time: {alert.timestamp.isoformat()}

Message: {alert.message}

Labels:
{chr(10).join(f"  {k}: {v}" for k, v in alert.labels.items())}

--
Unsubscribe App Monitoring
        """
        
        try:
            msg = MIMEText(body)
            msg['Subject'] = subject
            msg['From'] = self.smtp_config['from']
            msg['To'] = ', '.join(self.smtp_config['recipients'])
            
            with smtplib.SMTP(self.smtp_config['server'], self.smtp_config['port']) as server:
                if self.smtp_config.get('tls'):
                    server.starttls()
                if self.smtp_config.get('username'):
                    server.login(self.smtp_config['username'], self.smtp_config['password'])
                server.send_message(msg)
            
            print(f"Alert sent: {alert.name}")
            
        except Exception as e:
            print(f"Failed to send alert: {e}")

# Règles d'alerte custom
class HighMemoryUsageRule:
    name = "HighMemoryUsage"
    
    async def evaluate(self) -> Alert:
        import psutil
        
        memory_percent = psutil.virtual_memory().percent
        
        if memory_percent > 85:
            return Alert(
                name=self.name,
                severity="critical" if memory_percent > 95 else "warning",
                message=f"Memory usage is {memory_percent}%",
                labels={"instance": "backend", "metric": "memory"},
                timestamp=datetime.now()
            )
        
        return None

class DatabaseConnectionRule:
    name = "DatabaseConnectionIssue"
    
    def __init__(self, db_client):
        self.db_client = db_client
    
    async def evaluate(self) -> Alert:
        try:
            # Test de connexion simple
            await self.db_client.admin.command('ping')
            return None
        except Exception as e:
            return Alert(
                name=self.name,
                severity="critical",
                message=f"Database connection failed: {str(e)}",
                labels={"instance": "database", "service": "mongodb"},
                timestamp=datetime.now()
            )

# Service de monitoring continu
class MonitoringService:
    def __init__(self, alert_manager: AlertManager):
        self.alert_manager = alert_manager
        self.running = False
    
    async def start(self):
        """Démarrer le monitoring continu"""
        self.running = True
        
        while self.running:
            try:
                await self.alert_manager.evaluate_rules()
                await asyncio.sleep(60)  # Évaluer toutes les minutes
            except Exception as e:
                print(f"Monitoring error: {e}")
                await asyncio.sleep(60)
    
    def stop(self):
        """Arrêter le monitoring"""
        self.running = False

# Configuration et démarrage
smtp_config = {
    'server': 'smtp.gmail.com',
    'port': 587,
    'tls': True,
    'username': 'alerts@unsubscribe-app.com',
    'password': 'app_password',
    'from': 'alerts@unsubscribe-app.com',
    'recipients': ['admin@unsubscribe-app.com']
}

alert_manager = AlertManager(smtp_config)
alert_manager.add_rule(HighMemoryUsageRule())
alert_manager.add_rule(DatabaseConnectionRule(mongo_client))

monitoring_service = MonitoringService(alert_manager)
```

## 📊 Dashboards

### Dashboard Grafana Principal

```json
{
  "dashboard": {
    "title": "Unsubscribe App - Main Dashboard",
    "tags": ["unsubscribe-app"],
    "timezone": "browser",
    "panels": [
      {
        "title": "System Overview",
        "type": "stat",
        "targets": [
          {
            "expr": "up",
            "legendFormat": "{{instance}} Status"
          }
        ],
        "fieldConfig": {
          "overrides": [
            {
              "matcher": {"id": "byName", "options": "Value"},
              "properties": [
                {
                  "id": "mappings",
                  "value": [
                    {"options": {"0": {"text": "DOWN", "color": "red"}}, "type": "value"},
                    {"options": {"1": {"text": "UP", "color": "green"}}, "type": "value"}
                  ]
                }
              ]
            }
          ]
        }
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec",
            "min": 0
          }
        ]
      },
      {
        "title": "Response Time (95th percentile)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{endpoint}}"
          }
        ],
        "yAxes": [
          {
            "label": "Seconds",
            "min": 0
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m]) / rate(http_requests_total[5m])",
            "legendFormat": "Error Rate"
          }
        ],
        "yAxes": [
          {
            "label": "Percentage",
            "min": 0,
            "max": 1
          }
        ]
      },
      {
        "title": "Business Metrics",
        "type": "stat",
        "targets": [
          {
            "expr": "increase(email_scans_total[24h])",
            "legendFormat": "Email Scans (24h)"
          },
          {
            "expr": "increase(emails_sent_total[24h])",
            "legendFormat": "Emails Sent (24h)"
          },
          {
            "expr": "increase(subscriptions_detected_total[24h])",
            "legendFormat": "Subscriptions Detected (24h)"
          }
        ]
      },
      {
        "title": "Gmail API Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(gmail_api_calls_total[5m])",
            "legendFormat": "{{operation}} - {{status}}"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "database_connections_active",
            "legendFormat": "Active Connections"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_resident_memory_bytes / 1024 / 1024",
            "legendFormat": "{{instance}} Memory (MB)"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
```

### Dashboard Business Metrics

```json
{
  "dashboard": {
    "title": "Unsubscribe App - Business Metrics",
    "panels": [
      {
        "title": "User Activity",
        "type": "table",
        "targets": [
          {
            "expr": "topk(10, increase(email_scans_total[24h]))",
            "format": "table",
            "legendFormat": "User {{user_id}}"
          }
        ]
      },
      {
        "title": "Subscription Categories",
        "type": "piechart",
        "targets": [
          {
            "expr": "increase(subscriptions_detected_total[24h])",
            "legendFormat": "{{category}}"
          }
        ]
      },
      {
        "title": "Success Rate Trend",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(emails_sent_total{status=\"success\"}[1h]) / rate(emails_sent_total[1h])",
            "legendFormat": "Success Rate"
          }
        ]
      },
      {
        "title": "User Engagement",
        "type": "heatmap",
        "targets": [
          {
            "expr": "increase(user_actions_total[1h])",
            "legendFormat": "{{action}}"
          }
        ]
      }
    ]
  }
}
```

## 🏥 Health Checks

### Health Check Endpoints

```python
# backend/health/health_checks.py
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
import asyncio
from typing import Dict, Any

router = APIRouter()

class HealthChecker:
    def __init__(self, db_client, redis_client=None):
        self.db_client = db_client
        self.redis_client = redis_client
        
    async def check_database(self) -> Dict[str, Any]:
        """Vérifier la santé de la base de données"""
        try:
            start_time = datetime.now()
            
            # Test de ping simple
            await self.db_client.admin.command('ping')
            
            # Test d'écriture/lecture
            test_doc = {"test": True, "timestamp": datetime.now()}
            result = await self.db_client.health_check.test.insert_one(test_doc)
            await self.db_client.health_check.test.delete_one({"_id": result.inserted_id})
            
            duration = (datetime.now() - start_time).total_seconds()
            
            return {
                "status": "healthy",
                "response_time_ms": duration * 1000,
                "details": "Database connection and operations successful"
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "details": "Database connection failed"
            }
    
    async def check_redis(self) -> Dict[str, Any]:
        """Vérifier la santé de Redis"""
        if not self.redis_client:
            return {"status": "not_configured"}
            
        try:
            start_time = datetime.now()
            
            # Test ping
            await self.redis_client.ping()
            
            # Test set/get
            test_key = "health_check:test"
            await self.redis_client.set(test_key, "test_value", ex=60)
            value = await self.redis_client.get(test_key)
            await self.redis_client.delete(test_key)
            
            duration = (datetime.now() - start_time).total_seconds()
            
            if value != "test_value":
                raise Exception("Redis test operation failed")
            
            return {
                "status": "healthy",
                "response_time_ms": duration * 1000,
                "details": "Redis connection and operations successful"
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "details": "Redis connection failed"
            }
    
    async def check_external_apis(self) -> Dict[str, Any]:
        """Vérifier les APIs externes"""
        results = {}
        
        # Check Gmail API
        try:
            # Test basique de l'API Gmail (sans authentification utilisateur)
            import httpx
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.googleapis.com/gmail/v1/$discovery/rest",
                    timeout=5.0
                )
                
            if response.status_code == 200:
                results["gmail_api"] = {
                    "status": "healthy",
                    "details": "Gmail API discovery endpoint accessible"
                }
            else:
                results["gmail_api"] = {
                    "status": "degraded",
                    "details": f"Gmail API returned status {response.status_code}"
                }
                
        except Exception as e:
            results["gmail_api"] = {
                "status": "unhealthy",
                "error": str(e),
                "details": "Gmail API not accessible"
            }
        
        return results
    
    async def get_system_info(self) -> Dict[str, Any]:
        """Informations système"""
        import psutil
        
        return {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent,
            "load_average": psutil.getloadavg(),
            "boot_time": datetime.fromtimestamp(psutil.boot_time()).isoformat(),
            "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
        }

# Instance globale
health_checker = HealthChecker(mongo_client, redis_client)

@router.get("/health")
async def health_check():
    """Health check simple pour load balancer"""
    try:
        # Check basique de la base de données
        await mongo_client.admin.command('ping')
        return {"status": "healthy", "timestamp": datetime.now().isoformat()}
    except:
        raise HTTPException(status_code=503, detail="Service unavailable")

@router.get("/health/detailed")
async def detailed_health_check():
    """Health check détaillé"""
    
    # Exécuter tous les checks en parallèle
    results = await asyncio.gather(
        health_checker.check_database(),
        health_checker.check_redis(),
        health_checker.check_external_apis(),
        health_checker.get_system_info(),
        return_exceptions=True
    )
    
    database_health, redis_health, external_apis, system_info = results
    
    # Déterminer le statut global
    overall_status = "healthy"
    
    if database_health.get("status") == "unhealthy":
        overall_status = "unhealthy"
    elif (redis_health.get("status") == "unhealthy" or 
          any(api.get("status") == "unhealthy" for api in external_apis.values())):
        overall_status = "degraded"
    
    return {
        "status": overall_status,
        "timestamp": datetime.now().isoformat(),
        "checks": {
            "database": database_health,
            "redis": redis_health,
            "external_apis": external_apis,
            "system": system_info
        }
    }

@router.get("/health/readiness")
async def readiness_check():
    """Check si l'application est prête à recevoir du trafic"""
    
    # Vérifier les dépendances critiques
    database_status = await health_checker.check_database()
    
    if database_status["status"] != "healthy":
        raise HTTPException(status_code=503, detail="Database not ready")
    
    return {"status": "ready", "timestamp": datetime.now().isoformat()}

@router.get("/health/liveness")
async def liveness_check():
    """Check si l'application est vivante"""
    
    # Check très basique pour éviter les faux positifs
    return {"status": "alive", "timestamp": datetime.now().isoformat()}
```

### Frontend Health Monitoring

```javascript
// src/monitoring/healthCheck.js
class HealthMonitor {
  constructor() {
    this.healthEndpoint = `${process.env.REACT_APP_BACKEND_URL}/health`;
    this.checkInterval = 30000; // 30 secondes
    this.isMonitoring = false;
    this.lastHealthStatus = null;
    this.callbacks = [];
  }

  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.checkHealth();
    this.intervalId = setInterval(() => this.checkHealth(), this.checkInterval);
  }

  stop() {
    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async checkHealth() {
    try {
      const response = await fetch(this.healthEndpoint, {
        method: 'GET',
        timeout: 5000
      });

      const healthData = await response.json();
      
      const newStatus = {
        isHealthy: response.ok && healthData.status === 'healthy',
        timestamp: new Date(),
        details: healthData
      };

      // Détecter les changements de statut
      if (this.lastHealthStatus && 
          this.lastHealthStatus.isHealthy !== newStatus.isHealthy) {
        this.notifyStatusChange(newStatus);
      }

      this.lastHealthStatus = newStatus;
      this.notifyCallbacks(newStatus);

    } catch (error) {
      const errorStatus = {
        isHealthy: false,
        timestamp: new Date(),
        error: error.message,
        details: null
      };

      if (this.lastHealthStatus?.isHealthy !== false) {
        this.notifyStatusChange(errorStatus);
      }

      this.lastHealthStatus = errorStatus;
      this.notifyCallbacks(errorStatus);
    }
  }

  notifyStatusChange(status) {
    const event = new CustomEvent('healthStatusChange', {
      detail: status
    });
    window.dispatchEvent(event);
  }

  notifyCallbacks(status) {
    this.callbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Health monitor callback error:', error);
      }
    });
  }

  onStatusChange(callback) {
    this.callbacks.push(callback);
    
    // Retourner fonction de cleanup
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  getLastStatus() {
    return this.lastHealthStatus;
  }
}

export const healthMonitor = new HealthMonitor();

// Hook React pour utiliser le health monitoring
export const useHealthMonitor = () => {
  const [healthStatus, setHealthStatus] = useState(healthMonitor.getLastStatus());

  useEffect(() => {
    const unsubscribe = healthMonitor.onStatusChange(setHealthStatus);
    
    // Démarrer le monitoring
    healthMonitor.start();
    
    return () => {
      unsubscribe();
    };
  }, []);

  return healthStatus;
};

// Composant d'affichage du statut de santé
export const HealthIndicator = () => {
  const healthStatus = useHealthMonitor();

  if (!healthStatus) {
    return null;
  }

  return (
    <div className={`health-indicator ${healthStatus.isHealthy ? 'healthy' : 'unhealthy'}`}>
      <div className="status-dot"></div>
      <span className="status-text">
        {healthStatus.isHealthy ? 'Service en ligne' : 'Service indisponible'}
      </span>
    </div>
  );
};
```

---

*Guide de monitoring complet - Observabilité totale pour maintenir la qualité de service*