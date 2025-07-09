# ❓ FAQ - Questions Fréquentes

## 📋 Table des Matières

1. [Questions Générales](#questions-générales)
2. [Authentification et Sécurité](#authentification-et-sécurité)
3. [Scan et Détection](#scan-et-détection)
4. [Envoi d'Emails](#envoi-demails)
5. [Problèmes Techniques](#problèmes-techniques)
6. [Confidentialité](#confidentialité)

## 🤔 Questions Générales

### Qu'est-ce que l'Application de Désinscription ?
L'Application de Désinscription est un outil qui scanne automatiquement votre boîte Gmail pour détecter les abonnements indésirables et vous aide à vous en désinscrire facilement en générant et envoyant des emails de désinscription personnalisés.

### Est-ce que l'application est gratuite ?
Oui, l'application est entièrement gratuite à utiliser. Elle utilise l'API Gmail gratuite de Google qui permet largement assez de requêtes pour un usage personnel normal.

### Combien de temps faut-il pour voir les résultats ?
- **Scan initial** : 1-3 minutes selon la taille de votre boîte mail
- **Génération d'emails** : Quelques secondes
- **Envoi d'emails** : Instantané
- **Réponses des services** : 24-48h en moyenne

### L'application fonctionne-t-elle avec d'autres fournisseurs d'email ?
Actuellement, l'application ne fonctionne qu'avec Gmail. Le support pour Outlook, Yahoo Mail et autres fournisseurs est prévu dans une version future.

### Puis-je utiliser l'application sur mobile ?
L'application est optimisée pour les navigateurs web et fonctionne parfaitement sur mobile via le navigateur. Une application mobile native est en développement.

## 🔐 Authentification et Sécurité

### Comment l'application accède-t-elle à mon Gmail ?
L'application utilise OAuth 2.0, le standard de sécurité de Google. Vous accordez des permissions spécifiques via l'interface officielle de Google, et l'application ne voit jamais votre mot de passe.

### Quelles permissions l'application demande-t-elle ?
- **Lecture des emails** : Pour scanner et détecter les abonnements
- **Envoi d'emails** : Pour envoyer les demandes de désinscription
- **Informations de profil** : Pour personnaliser l'expérience

### Puis-je révoquer l'accès à tout moment ?
Oui, absolument. Vous pouvez révoquer l'accès à tout moment :
1. Allez dans votre compte Google
2. Sécurité → Applications tierces
3. Trouvez "Unsubscribe App" et cliquez sur "Révoquer l'accès"

### L'application stocke-t-elle mes emails ?
Non, l'application ne stocke pas vos emails. Elle ne conserve que :
- Les métadonnées des abonnements détectés
- L'historique des désinscriptions
- Vos préférences de paramétrage

### Est-ce que mes données sont partagées avec des tiers ?
Non, vos données ne sont jamais partagées avec des tiers. Tout reste sur votre serveur local ou dans votre base de données personnelle.

## 🔍 Scan et Détection

### Comment l'application détecte-t-elle les abonnements ?
L'application utilise plusieurs techniques :
- **Analyse des en-têtes** : List-ID, List-Unsubscribe
- **Détection de patterns** : Mots-clés, structure des emails
- **Analyse de fréquence** : Emails répétitifs du même expéditeur
- **Liens de désinscription** : Détection automatique des liens

### Pourquoi certains abonnements ne sont-ils pas détectés ?
Certains abonnements peuvent échapper à la détection si :
- Ils n'ont pas d'en-têtes standard
- Ils utilisent des techniques d'obfuscation
- Ils sont très récents ou rares
- Ils proviennent de contacts personnels

### Puis-je ajouter manuellement des abonnements ?
Oui, vous pouvez ajouter manuellement des abonnements :
1. Allez dans l'onglet "Abonnements"
2. Cliquez sur "Ajouter manuellement"
3. Remplissez les informations du service

### Combien d'emails sont analysés lors d'un scan ?
Par défaut, l'application analyse :
- **100 emails** maximum par scan
- **30 derniers jours** par défaut
- **Dossiers** : Boîte de réception + Promotions

Vous pouvez ajuster ces paramètres dans les options de scan.

### À quelle fréquence dois-je effectuer un scan ?
Recommandations :
- **Scan initial** : Analyse complète
- **Scans de suivi** : Hebdomadaires
- **Scans ciblés** : Après inscription à de nouveaux services

## 📧 Envoi d'Emails

### Les emails de désinscription sont-ils efficaces ?
L'efficacité varie selon les services :
- **Services légitimes** : 80-95% de réussite
- **Services automatisés** : 70-85% de réussite
- **Services peu scrupuleux** : 30-50% de réussite

### Que faire si un service ne répond pas ?
Si un service ne répond pas après 48h :
1. **Relancez** : Envoyez une nouvelle demande
2. **Lien direct** : Utilisez le lien de désinscription si disponible
3. **Marquez comme spam** : Signalez à Gmail
4. **Filtres Gmail** : Créez des filtres pour bloquer

### Puis-je personnaliser les emails de désinscription ?
Oui, vous pouvez personnaliser :
- **Modèles** : Poli, direct, formel
- **Langue** : Français, anglais
- **Motif** : Raison de la désinscription
- **Signature** : Votre nom et coordonnées

### Combien d'emails puis-je envoyer par jour ?
Limites Gmail :
- **Gmail personnel** : 500 emails/jour
- **Google Workspace** : 2000 emails/jour
- **Application** : 100 emails/heure (sécurité)

### Puis-je programmer l'envoi d'emails ?
Actuellement, l'envoi est immédiat. La fonctionnalité de programmation est prévue dans une version future.

## 🔧 Problèmes Techniques

### L'application ne se charge pas
**Solutions :**
1. **Vérifiez l'URL** : http://localhost:3000
2. **Actualisez la page** : F5 ou Ctrl+R
3. **Videz le cache** : Ctrl+Maj+Suppr
4. **Essayez un autre navigateur**
5. **Redémarrez l'application** : `sudo supervisorctl restart all`

### Erreur "Service indisponible"
**Causes possibles :**
- Serveur backend arrêté
- Problème de base de données
- Maintenance en cours

**Solutions :**
1. **Attendez** : 5 minutes puis réessayez
2. **Vérifiez les logs** : `sudo tail -f /var/log/supervisor/backend.log`
3. **Redémarrez** : `sudo supervisorctl restart backend`

### Le scan ne fonctionne pas
**Vérifications :**
1. **Connexion Gmail** : Êtes-vous bien connecté ?
2. **Permissions** : Avez-vous autorisé toutes les permissions ?
3. **Quota** : Avez-vous atteint la limite d'API ?

**Solutions :**
1. **Reconnectez-vous** : Déconnexion puis reconnexion
2. **Réduisez la portée** : Moins d'emails à scanner
3. **Attendez** : Si quota atteint, attendez 1 heure

### Les emails ne s'envoient pas
**Vérifications :**
1. **Permissions Gmail** : Autorisation d'envoi accordée ?
2. **Adresses valides** : Destinataires corrects ?
3. **Quota Gmail** : Limite d'envoi atteinte ?

**Solutions :**
1. **Vérifiez les permissions** : Compte Google → Sécurité
2. **Validez les adresses** : Corrigez les erreurs de frappe
3. **Attendez** : Si quota atteint, attendez 24h

### Performance lente
**Causes possibles :**
- Trop d'emails à analyser
- Connexion internet lente
- Serveur surchargé

**Solutions :**
1. **Réduisez la portée** : Limitez le nombre d'emails
2. **Fermez les onglets** : Libérez de la mémoire
3. **Redémarrez le navigateur**

## 🔒 Confidentialité

### Où sont stockées mes données ?
Vos données sont stockées :
- **Localement** : Sur votre serveur/ordinateur
- **Base de données** : MongoDB locale
- **Aucun cloud** : Pas de stockage distant

### Qui peut voir mes données ?
Seuls vous et l'application locale avez accès à vos données. Aucun tiers ne peut y accéder.

### Puis-je supprimer mes données ?
Oui, vous pouvez supprimer vos données :
1. **Partiellement** : Supprimer des abonnements spécifiques
2. **Complètement** : Vider toute la base de données
3. **Automatiquement** : Révocation de l'accès Gmail

### L'application conserve-t-elle un historique ?
L'application conserve :
- **Abonnements détectés** : Oui
- **Emails envoyés** : Oui (métadonnées seulement)
- **Statistiques** : Oui (anonymisées)
- **Contenu des emails** : Non

### Puis-je exporter mes données ?
Oui, vous pouvez exporter :
- **Format CSV** : Pour Excel/Google Sheets
- **Format JSON** : Pour usage technique
- **Rapports PDF** : Pour archivage

## 📊 Statistiques et Rapports

### Que signifient les statistiques ?
- **Taux de réussite** : % de désinscriptions confirmées
- **Temps de réponse** : Délai moyen de confirmation
- **Catégories** : Répartition des types d'abonnements

### Comment améliorer mon taux de réussite ?
**Conseils :**
1. **Personnalisez les emails** : Mentionnez des détails spécifiques
2. **Utilisez le bon modèle** : Poli pour les services pro
3. **Timing** : Envoyez en semaine, heures ouvrables
4. **Suivez** : Relancez après 48h si pas de réponse

### Puis-je voir l'historique complet ?
Oui, l'application conserve l'historique complet :
- **Tous les scans** : Dates et résultats
- **Tous les envois** : Statuts et réponses
- **Évolution** : Progression dans le temps

## 🆘 Aide et Support

### Comment obtenir de l'aide ?
**Options disponibles :**
1. **FAQ** : Cette page (questions courantes)
2. **Documentation** : Guides détaillés
3. **Support email** : support@unsubscribe-app.com
4. **Chat en ligne** : 9h-18h (heure française)

### Que faire en cas de bug ?
**Signalement de bug :**
1. **Décrivez le problème** : Quoi, quand, comment
2. **Étapes de reproduction** : Comment refaire le problème
3. **Capture d'écran** : Si applicable
4. **Informations système** : Navigateur, OS

### Comment suggérer une amélioration ?
**Suggestions :**
1. **Email** : feedback@unsubscribe-app.com
2. **Formulaire** : Dans l'application (Paramètres → Feedback)
3. **Communauté** : Forum des utilisateurs

### L'application sera-t-elle mise à jour ?
Oui, l'application est activement développée :
- **Corrections** : Bugs corrigés rapidement
- **Nouvelles fonctionnalités** : Ajouts réguliers
- **Améliorations** : Performance et ergonomie

## 📱 Fonctionnalités Avancées

### Puis-je automatiser complètement le processus ?
Partiellement :
- **Scan automatique** : Programmable (version future)
- **Envoi automatique** : Possible mais non recommandé
- **Suivi automatique** : Déjà implémenté

### Y a-t-il une API pour développeurs ?
Oui, l'application expose une API REST complète :
- **Documentation** : docs/API.md
- **Endpoints** : Toutes les fonctionnalités
- **Authentification** : OAuth 2.0

### Puis-je intégrer l'application dans mon workflow ?
Oui, plusieurs options :
- **API REST** : Intégration technique
- **Webhooks** : Notifications automatiques
- **Export de données** : CSV, JSON

## 🔮 Fonctionnalités Futures

### Quelles nouvelles fonctionnalités sont prévues ?
**Roadmap :**
- **Multi-comptes** : Plusieurs adresses Gmail
- **Autres fournisseurs** : Outlook, Yahoo Mail
- **Application mobile** : iOS et Android
- **Scan programmé** : Automatisation complète
- **IA avancée** : Meilleure détection
- **Rapports avancés** : Analytics détaillées

### Puis-je voter pour les fonctionnalités ?
Oui, vous pouvez influencer le développement :
- **Sondages** : Participez aux votes
- **Feedback** : Exprimez vos besoins
- **Communauté** : Discussions avec autres utilisateurs

---

*Des questions non couvertes ici ? Contactez-nous à support@unsubscribe-app.com*

## 🎯 Dernières Mises à Jour FAQ

**Mise à jour du 09/07/2025 :**
- Ajout de questions sur les quotas Gmail
- Clarification sur le stockage des données
- Nouvelles solutions pour les problèmes de performance

**Questions les plus fréquentes cette semaine :**
1. "Pourquoi certains abonnements ne sont-ils pas détectés ?"
2. "Comment améliorer mon taux de réussite ?"
3. "L'application fonctionne-t-elle avec Outlook ?"
4. "Puis-je programmer l'envoi d'emails ?"
5. "Où sont stockées mes données ?"

---

*FAQ mise à jour régulièrement - Dernière révision : 09/07/2025*