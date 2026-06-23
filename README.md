# StudentGraph

StudentGraph is an AI learning canvas for creating learning cards, expanding them with AI, branching into notes or questions, and tracking learned knowledge in a personal knowledge base.

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
