# 👤 Guide Utilisateur Complet

## 📋 Table des Matières

1. [Première Utilisation](#première-utilisation)
2. [Interface Utilisateur](#interface-utilisateur)
3. [Fonctionnalités Principales](#fonctionnalités-principales)
4. [Gestion des Abonnements](#gestion-des-abonnements)
5. [Suivi des Désinscriptions](#suivi-des-désinscriptions)
6. [Conseils et Astuces](#conseils-et-astuces)
7. [Dépannage](#dépannage)

## 🚀 Première Utilisation

### 1. Accès à l'Application

#### Ouverture de l'Application
1. Ouvrez votre navigateur web
2. Naviguez vers `http://localhost:3000`
3. Vous verrez l'écran d'accueil de l'application

#### Prérequis
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Connexion internet stable
- Compte Gmail actif

### 2. Connexion à Gmail

#### Première Connexion
1. **Cliquez sur "Se connecter à Gmail"**
   - Bouton bleu principal sur l'écran d'accueil
   
2. **Redirection vers Google**
   - Vous serez redirigé vers la page d'authentification Google
   - Sélectionnez votre compte Gmail
   
3. **Autorisation des Permissions**
   - Google vous demandera d'autoriser l'application
   - Permissions demandées :
     - ✅ Lire vos emails
     - ✅ Envoyer des emails en votre nom
     - ✅ Accéder à vos informations de profil
   
4. **Confirmation**
   - Cliquez sur "Autoriser"
   - Vous serez redirigé vers l'application

#### Écran de Bienvenue
Après connexion, vous verrez :
- Votre nom et adresse email
- Résumé de votre boîte mail
- Bouton "Commencer le scan"

## 🖥️ Interface Utilisateur

### 1. Navigation Principale

#### Barre de Navigation
```
┌─────────────────────────────────────────────────────────────┐
│  📧 Unsubscribe App    [Tableau de bord] [Abonnements] [Suivi] │
│                                              [user@gmail.com] │
└─────────────────────────────────────────────────────────────┘
```

#### Sections Principales
- **🏠 Tableau de bord** : Vue d'ensemble et statistiques
- **📧 Abonnements** : Liste des abonnements détectés
- **📊 Suivi** : Historique des désinscriptions
- **⚙️ Paramètres** : Configuration de l'application

### 2. Tableau de Bord

#### Widgets Principaux
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 📧 Abonnements  │ │ ✅ Désinscrites │ │ ⏳ En attente   │
│      23         │ │       8         │ │       5         │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

#### Graphiques et Statistiques
- **Graphique en secteurs** : Répartition par catégorie
- **Graphique en barres** : Évolution dans le temps
- **Taux de réussite** : Pourcentage de désinscriptions réussies

### 3. Actions Rapides

#### Boutons d'Action
- **🔍 Scanner mes emails** : Lance un nouveau scan
- **📤 Envoyer désinscriptions** : Envoie tous les emails préparés
- **📊 Voir rapport** : Génère un rapport détaillé
- **⚙️ Paramètres** : Configuration avancée

## 🔍 Fonctionnalités Principales

### 1. Scan Automatique des Emails

#### Lancement d'un Scan
1. **Cliquez sur "Scanner mes emails"**
2. **Configurez le scan :**
   ```
   ┌─────────────────────────────────────────┐
   │ 📧 Configuration du scan                │
   │                                         │
   │ 📅 Période : [30 jours        ▼]       │
   │ 📊 Nombre max : [100 emails   ▼]       │
   │ 📁 Dossiers : [☑️ Boîte réception]      │
   │              [☑️ Promotions]           │
   │              [☐ Réseaux sociaux]       │
   │                                         │
   │    [Annuler]    [Lancer le scan]       │
   └─────────────────────────────────────────┘
   ```

#### Progression du Scan
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Scan en cours...                                         │
│                                                             │
│ ████████████████████████████████████████████████████████████ │
│ 85% - 1,050 emails analysés                                │
│                                                             │
│ ✅ 23 abonnements détectés                                  │
│ ⏱️ Temps estimé restant : 30 secondes                       │
│                                                             │
│              [Annuler le scan]                              │
└─────────────────────────────────────────────────────────────┘
```

#### Résultats du Scan
Après le scan, vous verrez :
- **Nombre total d'emails analysés**
- **Nombre d'abonnements détectés**
- **Répartition par catégorie**
- **Bouton pour voir les résultats**

### 2. Détection Intelligente

#### Types d'Abonnements Détectés
- **📰 Newsletters** : Newsletters techniques, actualités
- **🛒 E-commerce** : Promotions, confirmations de commande
- **📱 Réseaux sociaux** : Notifications, mises à jour
- **🏢 Services** : Factures, notifications de service
- **🎯 Marketing** : Publicités, offres promotionnelles

#### Méthodes de Détection
- **Analyse des en-têtes** : Expéditeur, liste de diffusion
- **Contenu de l'email** : Mots-clés, structure
- **Liens de désinscription** : Détection automatique
- **Fréquence d'envoi** : Analyse des patterns

### 3. Système de Catégorisation

#### Catégories Automatiques
```
📰 Newsletters (12)
  ├─ Tech News Weekly
  ├─ Marketing Digest
  └─ Industry Updates

🛒 E-commerce (8)
  ├─ Amazon Promotions
  ├─ eBay Deals
  └─ Local Store Offers

📱 Social (3)
  ├─ LinkedIn Notifications
  ├─ Twitter Digest
  └─ Facebook Updates
```

## 📧 Gestion des Abonnements

### 1. Liste des Abonnements

#### Interface de Liste
```
┌─────────────────────────────────────────────────────────────┐
│ 📧 Abonnements détectés (23)                Filter: [Tous ▼] │
│                                              Search: [____] │
├─────────────────────────────────────────────────────────────┤
│ ☐ 📰 Tech News Weekly                              🟢 Actif │
│    no-reply@technews.com                                    │
│    Détecté le 09/07/2025 • Dernière réception : 08/07/2025 │
│    [Générer email] [Voir détails]                          │
├─────────────────────────────────────────────────────────────┤
│ ☐ 🛒 Amazon Promotions                           🟡 En cours │
│    promotions@amazon.com                                    │
│    Détecté le 09/07/2025 • Email envoyé le 09/07/2025      │
│    [Voir statut] [Relancer]                                │
├─────────────────────────────────────────────────────────────┤
│ ☐ 📱 LinkedIn Notifications                      ✅ Terminé │
│    notifications@linkedin.com                               │
│    Détecté le 08/07/2025 • Désinscrit le 09/07/2025       │
│    [Voir détails]                                          │
└─────────────────────────────────────────────────────────────┘
```

#### Filtres et Recherche
- **Filtre par statut** : Tous, Actifs, En cours, Terminés
- **Filtre par catégorie** : Newsletter, E-commerce, etc.
- **Recherche textuelle** : Nom du service, email
- **Tri** : Date, Nom, Statut

### 2. Détails d'un Abonnement

#### Vue Détaillée
```
┌─────────────────────────────────────────────────────────────┐
│ 📰 Tech News Weekly                                         │
│                                                             │
│ 📧 Expéditeur : no-reply@technews.com                      │
│ 🗓️ Détecté le : 09/07/2025 à 10:30                         │
│ 📅 Fréquence : Hebdomadaire (tous les mardis)              │
│ 📊 Catégorie : Newsletter > Technologie                    │
│ 🔗 Lien de désinscription : Détecté automatiquement        │
│                                                             │
│ 📈 Statistiques :                                          │
│   • 12 emails reçus ce mois                                │
│   • Taille moyenne : 45 KB                                 │
│   • Taux d'ouverture estimé : 23%                          │
│                                                             │
│ 📧 Emails récents :                                        │
│   • 08/07/2025 : "Weekly Tech Newsletter #45"             │
│   • 01/07/2025 : "Weekly Tech Newsletter #44"             │
│   • 24/06/2025 : "Weekly Tech Newsletter #43"             │
│                                                             │
│ [Générer email de désinscription] [Marquer comme terminé]   │
└─────────────────────────────────────────────────────────────┘
```

### 3. Génération d'Emails de Désinscription

#### Assistant de Génération
```
┌─────────────────────────────────────────────────────────────┐
│ ✉️ Génération d'email de désinscription                     │
│                                                             │
│ 📧 Pour : Tech News Weekly (no-reply@technews.com)         │
│                                                             │
│ 🎨 Modèle : [Poli et respectueux ▼]                        │
│   • Poli et respectueux                                    │
│   • Direct et concis                                       │
│   • Formel                                                 │
│                                                             │
│ 🌐 Langue : [Français ▼]                                   │
│                                                             │
│ 📝 Motif (optionnel) :                                     │
│   ☐ Trop d'emails                                          │
│   ☐ Contenu non pertinent                                  │
│   ☐ Changement d'adresse                                   │
│   ☐ Autre : [________________]                             │
│                                                             │
│ 👤 Signature :                                             │
│   [Votre nom automatiquement]                              │
│                                                             │
│ [Aperçu] [Générer] [Annuler]                               │
└─────────────────────────────────────────────────────────────┘
```

#### Aperçu de l'Email
```
┌─────────────────────────────────────────────────────────────┐
│ 📧 Aperçu de l'email                                       │
│                                                             │
│ À : no-reply@technews.com                                   │
│ Objet : Demande de désinscription                          │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Madame, Monsieur,                                       │ │
│ │                                                         │ │
│ │ Je vous écris pour vous demander de bien vouloir        │ │
│ │ supprimer mon adresse email (user@gmail.com) de        │ │
│ │ votre liste de diffusion "Tech News Weekly".           │ │
│ │                                                         │ │
│ │ Je vous remercie par avance pour votre compréhension.  │ │
│ │                                                         │ │
│ │ Cordialement,                                           │ │
│ │ [Votre nom]                                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Modifier] [Envoyer] [Annuler]                              │
└─────────────────────────────────────────────────────────────┘
```

### 4. Envoi d'Emails

#### Envoi Individuel
1. **Cliquez sur "Envoyer"** dans l'aperçu
2. **Confirmation** : L'email est envoyé immédiatement
3. **Notification** : Confirmation d'envoi
4. **Statut mis à jour** : Abonnement marqué "En cours"

#### Envoi en Lot
```
┌─────────────────────────────────────────────────────────────┐
│ 📤 Envoi en lot                                             │
│                                                             │
│ 📊 Sélectionnés : 5 abonnements                            │
│   • Tech News Weekly                                       │
│   • Amazon Promotions                                      │
│   • Marketing Digest                                       │
│   • Local Store Offers                                     │
│   • Industry Updates                                       │
│                                                             │
│ ⏰ Délai entre envois : [30 secondes ▼]                     │
│ 📋 Modèle à utiliser : [Poli et respectueux ▼]             │
│                                                             │
│ ⚠️ Attention : Cette action ne peut pas être annulée       │
│                                                             │
│ [Annuler] [Confirmer l'envoi]                               │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Suivi des Désinscriptions

### 1. Historique des Envois

#### Liste des Emails Envoyés
```
┌─────────────────────────────────────────────────────────────┐
│ 📤 Historique des envois                                    │
│                                                             │
│ 📧 Tech News Weekly                          09/07 à 12:00  │
│    ✅ Envoyé • 📬 Livré • ⏳ En attente de réponse          │
│    [Voir email] [Relancer]                                 │
│                                                             │
│ 📧 Amazon Promotions                         09/07 à 12:01  │
│    ✅ Envoyé • 📬 Livré • ✅ Désinscription confirmée       │
│    [Voir email] [Voir confirmation]                        │
│                                                             │
│ 📧 Marketing Digest                          09/07 à 12:02  │
│    ✅ Envoyé • ❌ Échec de livraison • 🔄 Nouvelle tentative │
│    [Voir erreur] [Réessayer]                               │
└─────────────────────────────────────────────────────────────┘
```

### 2. Statuts de Désinscription

#### Codes de Statut
- **🔍 Détecté** : Abonnement identifié, prêt pour désinscription
- **📤 Email envoyé** : Demande de désinscription envoyée
- **📬 Livré** : Email reçu par le destinataire
- **⏳ En attente** : En attente de traitement
- **✅ Confirmé** : Désinscription confirmée
- **❌ Échec** : Échec de désinscription
- **🔄 Relance** : Nouvelle tentative nécessaire

### 3. Suivi Automatique

#### Vérification Automatique
L'application vérifie automatiquement :
- **Réception d'emails de confirmation**
- **Absence d'emails du service**
- **Erreurs de livraison**
- **Réponses automatiques**

#### Notifications
```
┌─────────────────────────────────────────────────────────────┐
│ 🔔 Notifications                                            │
│                                                             │
│ ✅ Désinscription confirmée                                 │
│    Amazon Promotions • Il y a 2 heures                     │
│                                                             │
│ ⚠️ Nouvelle tentative requise                               │
│    Marketing Digest • Il y a 30 minutes                    │
│                                                             │
│ 📧 Nouveau scan recommandé                                 │
│    Dernière analyse : il y a 7 jours                       │
└─────────────────────────────────────────────────────────────┘
```

## 💡 Conseils et Astuces

### 1. Optimiser l'Efficacité

#### Bonnes Pratiques
- **🕐 Planifiez vos scans** : Effectuez un scan hebdomadaire
- **📊 Utilisez les filtres** : Triez par priorité
- **⏰ Respectez les délais** : Espacez les envois
- **✅ Vérifiez les résultats** : Confirmez les désinscriptions

#### Timing Optimal
- **Meilleur moment** : Mardi-jeudi, 10h-16h
- **Évitez** : Lundi matin, vendredi après-midi
- **Délai entre envois** : 30 secondes minimum

### 2. Personnalisation des Emails

#### Modèles Recommandés
- **Poli et respectueux** : Pour les services professionnels
- **Direct et concis** : Pour les services automatisés
- **Formel** : Pour les institutions

#### Personnalisation
```
Variables disponibles :
- {nom_service} : Nom du service
- {email_expediteur} : Email de l'expéditeur
- {votre_nom} : Votre nom
- {votre_email} : Votre email
- {date} : Date actuelle
```

### 3. Suivi Avancé

#### Indicateurs de Performance
- **Taux de réussite** : > 80% considéré comme bon
- **Temps de réponse** : < 48h pour les services automatisés
- **Taux d'erreur** : < 5% acceptable

#### Actions Recommandées
```
Si taux de réussite < 80% :
  → Vérifier les modèles d'emails
  → Personnaliser les messages
  → Contacter manuellement les services récalcitrants

Si temps de réponse > 48h :
  → Envoyer une relance
  → Utiliser le lien de désinscription direct
  → Marquer l'email comme spam
```

## 🔧 Dépannage

### 1. Problèmes de Connexion

#### Erreur d'Authentification Google
**Symptômes :**
- Impossible de se connecter à Gmail
- Erreur "Accès refusé"
- Redirection en boucle

**Solutions :**
1. **Vérifiez vos paramètres Google** :
   - Allez dans votre compte Google
   - Sécurité → Applications tierces
   - Vérifiez que l'application est autorisée

2. **Effacez les cookies** :
   - Supprimez les cookies de votre navigateur
   - Reconnectez-vous

3. **Essayez un autre navigateur** :
   - Testez avec Chrome ou Firefox
   - Désactivez les extensions

#### Erreur "Token expiré"
**Solution :**
1. Cliquez sur "Se reconnecter"
2. Suivez le processus d'authentification
3. Vos données seront préservées

### 2. Problèmes de Scan

#### Scan Trop Lent
**Causes possibles :**
- Trop d'emails à analyser
- Connexion internet lente
- Quota Gmail atteint

**Solutions :**
1. **Réduisez la portée** :
   - Limitez à 50 emails
   - Réduisez la période à 15 jours

2. **Vérifiez votre connexion** :
   - Testez votre débit internet
   - Redémarrez votre routeur

#### Scan Échoué
**Solutions :**
1. **Relancez le scan** :
   - Attendez 5 minutes
   - Cliquez sur "Relancer"

2. **Vérifiez les permissions** :
   - Reconnectez-vous à Gmail
   - Autorisez toutes les permissions

### 3. Problèmes d'Envoi

#### Emails Non Envoyés
**Vérifications :**
1. **Quota Gmail** : Vérifiez votre limite d'envoi
2. **Adresses valides** : Confirmez les adresses email
3. **Connexion** : Vérifiez votre connexion internet

#### Emails Rejetés
**Solutions :**
1. **Modifiez le modèle** : Utilisez un ton plus formel
2. **Personnalisez** : Ajoutez des détails spécifiques
3. **Contactez directement** : Utilisez le formulaire de contact

### 4. Problèmes d'Interface

#### Page Blanche
**Solutions :**
1. **Actualisez la page** : F5 ou Ctrl+R
2. **Videz le cache** : Ctrl+Maj+Suppr
3. **Redémarrez le navigateur**

#### Données Manquantes
**Solutions :**
1. **Resynchronisez** : Cliquez sur "Actualiser"
2. **Reconnectez-vous** : Déconnexion puis reconnexion
3. **Contactez le support** : Si le problème persiste

## 📞 Support et Aide

### 1. Aide Intégrée

#### FAQ Contextuelle
- **Bulles d'aide** : Survolez les éléments pour plus d'infos
- **Tutoriels interactifs** : Guides pas à pas
- **Vidéos explicatives** : Démonstrations visuelles

### 2. Contact Support

#### Méthodes de Contact
- **📧 Email** : support@unsubscribe-app.com
- **💬 Chat** : Disponible 9h-18h (heure française)
- **📚 Documentation** : docs.unsubscribe-app.com

#### Informations à Fournir
Lors d'une demande de support :
- Description du problème
- Étapes pour reproduire
- Capture d'écran si applicable
- Version du navigateur
- Système d'exploitation

### 3. Communauté

#### Ressources Communautaires
- **🌐 Forum** : Discussions entre utilisateurs
- **📖 Wiki** : Guides créés par la communauté
- **🔄 Mises à jour** : Nouvelles fonctionnalités

---

*Guide utilisateur complet - Profitez de votre expérience sans spam ! 🎉*