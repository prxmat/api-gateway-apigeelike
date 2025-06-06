# API Gateway

## Description
API Gateway est un service qui gère le routage, la validation, la transformation et le rate limiting des requêtes vers les microservices.

## Fonctionnalités
- Routage dynamique basé sur la configuration YAML
- Validation des requêtes avec JSON Schema
- Transformation des données avec JSONata
- Rate limiting par route
- Mocking des réponses
- Monitoring des performances avec OpenTelemetry
- Gestion des erreurs et des timeouts
- Support des variables d'environnement

## Optimisations et Performances
Le service est optimisé pour des temps de réponse rapides (environ 200ms) grâce à :

### Précompilation
- Précompilation des schémas de validation avec AJV
- Précompilation des expressions de transformation avec JSONata
- Mise en cache des routes au démarrage

### Caching
- Cache Redis pour les réponses fréquentes
- Cache en mémoire pour les routes
- Cache des schémas de validation

### Optimisations HTTP
- Connection pooling pour les appels HTTP
- Timeouts configurables par route
- Gestion des erreurs de connexion

### Structure des Données
- Validation des entrées avec JSON Schema
- Transformation des données avec JSONata
- Format standardisé des réponses

## Installation

```bash
# Cloner le repository
git clone https://github.com/prestashop/api-gateway-payment.git
cd api-gateway-payment

# Installer les dépendances
npm install
```

## Configuration

1. Copier le fichier d'exemple d'environnement :
```bash
cp .env.example .env
```

2. Configurer les variables d'environnement dans `.env`

3. Configurer les routes dans `config/routes.yaml`

## Démarrage

### Développement

```bash
# Démarrer en mode développement
npm run start:dev

# Démarrer en mode debug
npm run start:debug
```

### Production

```bash
# Build
npm run build

# Démarrer
npm run start:prod
```

### Docker

```bash
# Build l'image
docker build -t api-gateway-payment .

# Démarrer le conteneur
docker run -p 3000:3000 api-gateway-payment
```

## Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Couverture de tests
npm run test:cov
```

## Structure du Projet

```
src/
├── modules/
│   ├── proxy/           # Gestion du proxy
│   ├── validation/      # Validation des requêtes/réponses
│   ├── transformation/  # Transformation des données
│   ├── rate-limit/      # Rate limiting
│   ├── mocking/         # Mocking des réponses
│   ├── observability/   # Observabilité
│   └── admin-ui/        # Interface d'administration
├── config/             # Configuration
└── main.ts            # Point d'entrée
```

## Configuration des Routes

Les routes sont configurées dans `config/routes.yaml`. Exemple :

```yaml
routes:
  - id: users-list
    path: /api/users
    method: GET
    backend_url: http://backend:8080/api/users
    rate_limit:
      points: 10
      duration: 60
```

## Monitoring
Le service utilise OpenTelemetry pour le monitoring avec :
- Traces des requêtes
- Métriques de performance
- Logs structurés

## Contribuer

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub. 