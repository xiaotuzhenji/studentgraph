# 知枝

知枝是一个 AI 学习画布，用来创建学习卡片、用 AI 展开分支、拉出笔记或问题，并把学会的知识沉淀到个人知识库。

## Local Development

1. Install dependencies:

   `npm install`

2. Copy environment variables:

   `Copy-Item .env.example .env`

3. Set `DATABASE_URL`, `SESSION_SECRET`, and `MODEL_KEY_ENCRYPTION_SECRET`.

4. Run database migrations:

   `npm run prisma:migrate`

5. Start the app:

   `npm run dev`

## Checks

- `npm run typecheck`
- `npm test`
- `npm run e2e`

## Docker Deployment

1. Copy the Docker environment file:

   `cp .env.docker.example .env.docker`

2. Edit `.env.docker` and set strong values for:

   - `POSTGRES_PASSWORD`
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `MODEL_KEY_ENCRYPTION_SECRET`

   Generate secrets with:

   `openssl rand -base64 32`

3. Build and start the app:

   `docker compose up -d --build`

4. Open the app:

   `http://your-server-ip:3000`

Useful commands:

- View logs: `docker compose logs -f app`
- Restart: `docker compose restart app`
- Stop: `docker compose down`
- Stop and remove database data: `docker compose down -v`
