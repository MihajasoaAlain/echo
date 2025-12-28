FROM node:20-alpine AS builder
WORKDIR /app

# Outils utiles pour compiler et générer le client Prisma
RUN apk add --no-cache libc6-compat python3 make g++ git

# Copier les fichiers de dépendances en premier pour profiter du cache
COPY package.json yarn.lock* tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY packages ./packages

# Installer toutes les dépendances (dev + prod) pour builder
RUN yarn install --frozen-lockfile

# Générer le client Prisma (nécessaire si tu utilises @prisma/client)
RUN npx prisma generate

# Compiler TypeScript en JavaScript (script `build` → `tsc` dans package.json)
RUN yarn build

# Réinstaller en mode production pour réduire la taille finale
RUN yarn install --production --frozen-lockfile


FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production

# Copier uniquement ce qui est nécessaire à l'exécution
COPY package.json yarn.lock* ./

# Installer les dépendances de production (si tu veux utiliser le cache réseau réduisable)
RUN yarn install --production --frozen-lockfile --ignore-scripts

# Copier l'app compilée et le client Prisma depuis le builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Lancer l'application compilée
CMD ["node", "dist/index.js"]