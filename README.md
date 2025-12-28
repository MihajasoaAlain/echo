#  NotifBridge

**NotifBridge** est une infrastructure de notification en temps réel haute performance. Elle permet d'envoyer des notifications via une API REST et de les distribuer instantanément aux clients connectés via WebSockets, tout en gérant un historique persistant et un système d'état (lu/non lu).



---

##  Architecture Technique

* **Backend :** Node.js avec **Fastify** (framework ultra-rapide) et **TypeScript**.
* **Temps Réel :** **Socket.io** pour une communication bidirectionnelle persistante.
* **Base de Données :** **PostgreSQL** via l'ORM **Prisma** pour la persistance des données.
* **Cache & Pub/Sub :** **Redis** pour le rate-limiting et la scalabilité horizontale.
* **Conteneurisation :** **Docker** & **Docker Compose** (Multi-stage builds) pour un déploiement optimisé.

---

##  Fonctionnalités

* ✅ **Push Temps Réel** : Réception instantanée sans rafraîchissement de page.
* ✅ **Gestion d'État** : Marquage des notifications comme "lues" (individuel ou global).
* ✅ **Persistance** : Récupération automatique de l'historique "non lu" à la connexion.
* ✅ **Sécurité** : Routes API protégées par clé API (`x-api-key`).
* ✅ **Optimisation Docker** : Images de production légères basées sur Alpine Linux.

---

## 🚀 Installation Rapide (Docker)

Le projet est entièrement conteneurisé. Vous n'avez besoin que de Docker et Docker Compose.

1.  **Cloner le projet**
    ```bash
    git clone [https://github.com/MihajasoaAlain/echo](https://github.com/MihajasoaAlain/echo)
    cd echo
    ```

2.  **Lancer l'infrastructure**
    ```bash
    sudo docker-compose up --build
    ```
    *Cette commande construit l'image de l'app, lance la base PostgreSQL et l'instance Redis.*

3.  **Accéder aux services**
    * **API Serveur :** `http://localhost:3000`
    * **Dashboard de Test :** Ouvrez `index.html` dans votre navigateur.

---

## 📡 Utilisation de l'API

### Envoyer une notification
**POST** `/api/v1/push`

```bash
curl -X POST http://localhost:3000/api/v1/push \
  -H "x-api-key: votre_cle_api" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_test_1234",
    "title": "Alerte Système",
    "message": "Ceci est une notification push !"
  }'

---

### Lire / Marquer comme lu
La plateforme expose plusieurs endpoints pour récupérer et marquer les notifications comme lues :

- **Récupérer les notifications non lues**
  - `GET /api/v1/notifications/:userId`
  - Headers requis : `x-api-key: VOTRE_CLE_API`
  - Comportement : renvoie jusqu'à 50 notifications non lues (`isRead: false`) triées par `createdAt` descendant.
  - Exemple :

```bash
curl -H "x-api-key: votre_cle_api" \
  http://localhost:3000/api/v1/notifications/user_test_123
```

Réponse (exemple) :

```json
{
  "notifications": [
    { "id": "...", "userId": "user_test_123", "title": "...", "message": "...", "isRead": false, "createdAt": "..." }
  ]
}
```

- **Marquer une notification comme lue (individuelle)**
  - `PATCH /api/v1/notifications/:id/read`
  - Headers requis : `x-api-key`
  - Comportement : met `isRead` à `true` pour la notification identifiée par `id`.
  - Exemple :

```bash
curl -X PATCH -H "x-api-key: votre_cle_api" \
  http://localhost:3000/api/v1/notifications/NOTIF_ID/read
```

Réponse (succès) :

```json
{ "success": true, "message": "Notification mise à jour." }
```

- **Marquer toutes les notifications comme lues (pour un utilisateur)**
  - `PATCH /api/v1/notifications/read-all/:userId`
  - Headers requis : `x-api-key`
  - Comportement : met `isRead = true` pour toutes les notifications non lues du `userId` fourni.
  - Exemple :

```bash
curl -X PATCH -H "x-api-key: votre_cle_api" \
  http://localhost:3000/api/v1/notifications/read-all/user_test_123
```

Réponse (exemple) :

```json
{ "message": "12 notifications marquées comme lues.", "count": 12 }
```

Notes côté client :

- Le dashboard de démonstration (`apps/demo/index.html`) utilise ces endpoints :
  - `loadHistory()` appelle `GET /api/v1/notifications/:userId` pour charger l'historique.
  - `markSingleAsRead(id)` appelle `PATCH /api/v1/notifications/:id/read`.
  - `markEverythingAsRead()` appelle `PATCH /api/v1/notifications/read-all/:userId`.
- Les notifications en temps réel sont émises via Socket.IO sur l'événement `notification` et envoyées vers la "room" correspondant au `userId`.


## 📦 SDK Installation & Usage

Pour faciliter l'intégration de **NotifBridge** dans vos applications (React, Vue, Node, etc.), un SDK est disponible.

### Installation

```bash
# Avec NPM
npm i @mihajasoa/notifbridge-sdk

# Avec Yarn
yarn add @notifbridge/sdk