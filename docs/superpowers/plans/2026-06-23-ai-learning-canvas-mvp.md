# AI Learning Canvas MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working version of the AI learning canvas: auth, one canvas, source cards, AI parsing, branch creation, learned marking, model settings, and a personal knowledge base.

**Architecture:** Use one Next.js full-stack app for the MVP. Server routes and server-only services own auth, database writes, model-key encryption, content fetching, AI calls, and knowledge matching. The browser owns canvas interaction, node-detail reading, model selection, and form workflows.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, React Flow (`@xyflow/react`), Zod, bcryptjs, jose, Vitest, React Testing Library, Playwright.

---

## Source Spec

- `docs/superpowers/specs/2026-06-23-ai-learning-canvas-design.md`

## File Structure

- `package.json`: scripts and dependencies.
- `next.config.ts`: Next.js config.
- `tsconfig.json`: TypeScript config.
- `postcss.config.mjs`: Tailwind/PostCSS config.
- `eslint.config.mjs`: lint config.
- `.env.example`: required local environment variables.
- `prisma/schema.prisma`: database model definitions.
- `prisma/migrations/**`: generated database migrations.
- `src/app/layout.tsx`: root layout.
- `src/app/globals.css`: app styling tokens and Tailwind base.
- `src/app/(auth)/login/page.tsx`: login page.
- `src/app/(auth)/register/page.tsx`: registration page.
- `src/app/canvas/page.tsx`: authenticated canvas page.
- `src/app/nodes/[nodeId]/page.tsx`: authenticated node detail page.
- `src/app/knowledge/page.tsx`: authenticated knowledge page.
- `src/app/settings/models/page.tsx`: authenticated model settings page.
- `src/app/api/auth/register/route.ts`: register API.
- `src/app/api/auth/login/route.ts`: login API.
- `src/app/api/auth/logout/route.ts`: logout API.
- `src/app/api/canvas/route.ts`: load current user's canvas graph.
- `src/app/api/sources/route.ts`: create learning sources and root nodes.
- `src/app/api/nodes/[nodeId]/route.ts`: get one node detail.
- `src/app/api/nodes/[nodeId]/branches/route.ts`: create note, explanation, or question branches.
- `src/app/api/nodes/[nodeId]/learned/route.ts`: update node learned status.
- `src/app/api/knowledge-points/[pointId]/learned/route.ts`: update knowledge-point learned status.
- `src/app/api/knowledge/route.ts`: list knowledge records.
- `src/app/api/model-configs/route.ts`: list and create model configs.
- `src/app/api/model-configs/[configId]/route.ts`: update or disable model configs.
- `src/app/api/generations/[generationId]/retry/route.ts`: retry failed AI generation.
- `src/components/app-shell.tsx`: authenticated app navigation.
- `src/components/canvas/learning-canvas.tsx`: React Flow canvas wrapper.
- `src/components/canvas/learning-card.tsx`: canvas card node component.
- `src/components/forms/source-form.tsx`: create-source form.
- `src/components/forms/model-config-form.tsx`: model configuration form.
- `src/components/node-detail/node-detail-view.tsx`: node detail UI.
- `src/components/knowledge/knowledge-list.tsx`: knowledge list UI.
- `src/lib/auth/password.ts`: password hashing and verification.
- `src/lib/auth/session.ts`: signed cookie session helpers.
- `src/lib/auth/current-user.ts`: require current user helper.
- `src/lib/db.ts`: Prisma client singleton.
- `src/lib/crypto/model-key.ts`: model-key encryption and decryption.
- `src/lib/domain/enums.ts`: shared domain enum constants.
- `src/lib/domain/schemas.ts`: Zod input schemas.
- `src/lib/domain/layout.ts`: branch placement logic.
- `src/lib/services/source-service.ts`: create source and root node.
- `src/lib/services/node-service.ts`: node detail, branch creation, learned updates.
- `src/lib/services/knowledge-service.ts`: knowledge records and matching.
- `src/lib/services/model-config-service.ts`: model config CRUD.
- `src/lib/services/content-fetcher.ts`: best-effort blog and project fetch.
- `src/lib/ai/provider.ts`: AI provider interface.
- `src/lib/ai/openai-compatible.ts`: OpenAI-compatible chat client.
- `src/lib/ai/prompts.ts`: prompts and JSON contracts.
- `src/lib/ai/generation-service.ts`: generation orchestration and persistence.
- `src/test/factories.ts`: reusable test data builders.
- `src/test/setup.ts`: Vitest setup.
- `tests/e2e/learning-flow.spec.ts`: Playwright happy-path test.

## Task 1: Scaffold The App And Tooling

**Files:**

- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create the Next.js project files**

Create the files listed above with a minimal App Router setup. Use these scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  }
}
```

Install these runtime dependencies:

```powershell
npm install next react react-dom @xyflow/react @prisma/client zod bcryptjs jose cheerio
```

Install these dev dependencies:

```powershell
npm install -D typescript @types/node @types/react @types/react-dom prisma tailwindcss postcss autoprefixer vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test eslint eslint-config-next
```

- [ ] **Step 2: Add environment documentation**

Create `.env.example` with:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/studentgraph"
SESSION_SECRET="replace-with-a-32-byte-random-secret"
MODEL_KEY_ENCRYPTION_SECRET="replace-with-a-32-byte-base64-secret"
PLATFORM_OPENAI_COMPATIBLE_BASE_URL="https://api.openai.com/v1"
PLATFORM_OPENAI_COMPATIBLE_API_KEY=""
PLATFORM_OPENAI_COMPATIBLE_MODEL="gpt-4.1-mini"
```

- [ ] **Step 3: Add a smoke test**

Create `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/canvas");
}
```

Create `src/test/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("test runner", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Verify the scaffold**

Run:

```powershell
npm run typecheck
npm test
```

Expected: TypeScript passes and Vitest reports one passing test.

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs .gitignore .env.example src vitest.config.ts
git commit -m "chore: scaffold Next.js app"
```

## Task 2: Add Database Schema

**Files:**

- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Create: `src/lib/domain/enums.ts`
- Create: `src/lib/domain/schemas.ts`
- Test: `src/lib/domain/schemas.test.ts`

- [ ] **Step 1: Write domain schema tests**

Create `src/lib/domain/schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createSourceSchema, createBranchSchema } from "./schemas";

describe("domain schemas", () => {
  it("accepts a book source with a learning goal", () => {
    const result = createSourceSchema.parse({
      type: "book",
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      learningGoal: "Understand data system tradeoffs",
      description: "Focus on replication and consistency"
    });

    expect(result.type).toBe("book");
  });

  it("rejects a video source", () => {
    expect(() =>
      createSourceSchema.parse({
        type: "video",
        title: "A lecture"
      })
    ).toThrow();
  });

  it("accepts a note branch without a model config", () => {
    const result = createBranchSchema.parse({
      kind: "note",
      title: "My note",
      content: "This finally clicked."
    });

    expect(result.kind).toBe("note");
  });
});
```

- [ ] **Step 2: Run the failing tests**

Run:

```powershell
npm test -- src/lib/domain/schemas.test.ts
```

Expected: FAIL because `src/lib/domain/schemas.ts` does not exist.

- [ ] **Step 3: Implement domain enums and Zod schemas**

Create `src/lib/domain/enums.ts`:

```ts
export const sourceTypes = ["question", "blog_link", "project_link", "book"] as const;
export const nodeTypes = ["source", "explanation", "question", "note"] as const;
export const generationStatuses = ["idle", "pending", "completed", "failed"] as const;
export const learnedStatuses = ["not_started", "learning", "learned"] as const;
export const branchKinds = ["explanation", "question", "note"] as const;
```

Create `src/lib/domain/schemas.ts`:

```ts
import { z } from "zod";
import { branchKinds, sourceTypes } from "./enums";

export const createSourceSchema = z.object({
  type: z.enum(sourceTypes),
  title: z.string().trim().min(1).max(160),
  url: z.string().url().optional(),
  author: z.string().trim().max(120).optional(),
  description: z.string().trim().max(4000).optional(),
  learningGoal: z.string().trim().max(1000).optional(),
  rawInput: z.string().trim().max(8000).optional()
});

export const createBranchSchema = z.object({
  kind: z.enum(branchKinds),
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().max(8000).optional(),
  selectedText: z.string().trim().max(8000).optional(),
  sourceKnowledgePointId: z.string().cuid().optional(),
  modelConfigId: z.string().cuid().optional()
});

export const learnedStatusSchema = z.object({
  learnedStatus: z.enum(["not_started", "learning", "learned"])
});
```

- [ ] **Step 4: Add the Prisma schema**

Create `prisma/schema.prisma` with models matching the spec: `User`, `ModelProviderConfig`, `LearningCanvas`, `LearningSource`, `LearningNode`, `KnowledgePoint`, `KnowledgeRecord`, and `AiGeneration`. Use `String @id @default(cuid())` for IDs, `DateTime @default(now())` for creation dates, and `DateTime @updatedAt` for update dates.

Use Prisma enums for:

```prisma
enum SourceType {
  question
  blog_link
  project_link
  book
}

enum NodeType {
  source
  explanation
  question
  note
}

enum GenerationStatus {
  idle
  pending
  completed
  failed
}

enum LearnedStatus {
  not_started
  learning
  learned
}

enum ModelConfigKind {
  platform
  user_key
}

enum KnowledgeRecordType {
  node
  knowledge_point
}

enum GenerationAction {
  initial_parse
  expand_point
  ask_question
  retry
}
```

- [ ] **Step 5: Add Prisma client singleton**

Create `src/lib/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

- [ ] **Step 6: Verify**

Run:

```powershell
npm test -- src/lib/domain/schemas.test.ts
npm run prisma:generate
```

Expected: schema tests pass and Prisma client generates.

- [ ] **Step 7: Commit**

```powershell
git add prisma src/lib/db.ts src/lib/domain
git commit -m "feat: define core data model"
```

## Task 3: Implement Auth Foundation

**Files:**

- Create: `src/lib/auth/password.ts`
- Create: `src/lib/auth/session.ts`
- Create: `src/lib/auth/current-user.ts`
- Test: `src/lib/auth/password.test.ts`
- Test: `src/lib/auth/session.test.ts`

- [ ] **Step 1: Write password tests**

Create `src/lib/auth/password.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password helpers", () => {
  it("verifies a password against its hash", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Write session tests**

Create `src/lib/auth/session.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createSessionToken, readSessionToken } from "./session";

vi.stubEnv("SESSION_SECRET", "test-secret-that-is-long-enough-for-jose");

describe("session helpers", () => {
  it("round trips a user id", async () => {
    const token = await createSessionToken("user_123");
    const session = await readSessionToken(token);

    expect(session?.userId).toBe("user_123");
  });
});
```

- [ ] **Step 3: Run failing tests**

Run:

```powershell
npm test -- src/lib/auth
```

Expected: FAIL because auth helpers do not exist.

- [ ] **Step 4: Implement password helpers**

Create `src/lib/auth/password.ts`:

```ts
import bcrypt from "bcryptjs";

const saltRounds = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, saltRounds);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
```

- [ ] **Step 5: Implement session helpers**

Create `src/lib/auth/session.ts`:

```ts
import { jwtVerify, SignJWT } from "jose";

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required");
  }
  return encoder.encode(secret);
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function readSessionToken(token: string) {
  try {
    const result = await jwtVerify<{ userId: string }>(token, getSecret());
    return { userId: result.payload.userId };
  } catch {
    return null;
  }
}
```

- [ ] **Step 6: Implement current-user helper**

Create `src/lib/auth/current-user.ts`:

```ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { readSessionToken } from "./session";

export const sessionCookieName = "studentgraph_session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;

  const session = await readSessionToken(token);
  if (!session) return null;

  return db.user.findUnique({ where: { id: session.userId } });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
```

- [ ] **Step 7: Verify**

Run:

```powershell
npm test -- src/lib/auth
npm run typecheck
```

Expected: auth tests and typecheck pass.

- [ ] **Step 8: Commit**

```powershell
git add src/lib/auth
git commit -m "feat: add email session auth helpers"
```

## Task 4: Build Register And Login

**Files:**

- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/api/auth/register/route.ts`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Test: `tests/e2e/auth.spec.ts`

- [ ] **Step 1: Write e2e auth test**

Create `tests/e2e/auth.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("user can register and reach the canvas", async ({ page }) => {
  const email = `learner-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password-123456");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/canvas$/);
  await expect(page.getByText("Learning Canvas")).toBeVisible();
});
```

- [ ] **Step 2: Run the failing e2e test**

Run:

```powershell
npm run e2e -- tests/e2e/auth.spec.ts
```

Expected: FAIL because pages and routes do not exist.

- [ ] **Step 3: Implement register and login APIs**

Create `src/app/api/auth/register/route.ts` and `src/app/api/auth/login/route.ts`. Both routes should parse JSON with Zod, use Prisma to find or create users, set `studentgraph_session` as an HttpOnly cookie, and return `{ "ok": true }`.

The registration schema:

```ts
const authSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200)
});
```

Cookie options:

```ts
{
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30
}
```

- [ ] **Step 4: Implement auth pages**

Create simple client forms for `/register` and `/login`. On successful response, call `window.location.assign("/canvas")`. Use labels exactly `Email` and `Password`, and button names exactly `Create account` and `Log in` so the e2e selectors remain stable.

- [ ] **Step 5: Add logout API**

Create `src/app/api/auth/logout/route.ts` that clears `studentgraph_session` and returns `{ "ok": true }`.

- [ ] **Step 6: Verify**

Run:

```powershell
npm run typecheck
npm run e2e -- tests/e2e/auth.spec.ts
```

Expected: typecheck passes and the auth e2e test reaches `/canvas`.

- [ ] **Step 7: Commit**

```powershell
git add src/app tests/e2e/auth.spec.ts
git commit -m "feat: add email registration and login"
```

## Task 5: Implement Model Configuration

**Files:**

- Create: `src/lib/crypto/model-key.ts`
- Create: `src/lib/services/model-config-service.ts`
- Create: `src/app/api/model-configs/route.ts`
- Create: `src/app/api/model-configs/[configId]/route.ts`
- Create: `src/app/settings/models/page.tsx`
- Create: `src/components/forms/model-config-form.tsx`
- Test: `src/lib/crypto/model-key.test.ts`
- Test: `src/lib/services/model-config-service.test.ts`

- [ ] **Step 1: Write encryption tests**

Create `src/lib/crypto/model-key.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { decryptModelKey, encryptModelKey } from "./model-key";

vi.stubEnv("MODEL_KEY_ENCRYPTION_SECRET", Buffer.alloc(32, 7).toString("base64"));

describe("model-key encryption", () => {
  it("encrypts and decrypts a key", () => {
    const encrypted = encryptModelKey("sk-test");
    expect(encrypted).not.toBe("sk-test");
    expect(decryptModelKey(encrypted)).toBe("sk-test");
  });
});
```

- [ ] **Step 2: Run the failing encryption test**

Run:

```powershell
npm test -- src/lib/crypto/model-key.test.ts
```

Expected: FAIL because encryption helpers do not exist.

- [ ] **Step 3: Implement AES-GCM encryption**

Create `src/lib/crypto/model-key.ts`:

```ts
import crypto from "node:crypto";

function getKey() {
  const raw = process.env.MODEL_KEY_ENCRYPTION_SECRET;
  if (!raw) throw new Error("MODEL_KEY_ENCRYPTION_SECRET is required");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("MODEL_KEY_ENCRYPTION_SECRET must decode to 32 bytes");
  return key;
}

export function encryptModelKey(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptModelKey(value: string) {
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64")),
    decipher.final()
  ]).toString("utf8");
}
```

- [ ] **Step 4: Implement model config service and routes**

Create service methods in `src/lib/services/model-config-service.ts`:

```ts
export async function listModelConfigs(userId: string) {
  return db.modelProviderConfig.findMany({
    where: { userId, isEnabled: true },
    select: { id: true, provider: true, displayName: true, modelName: true, kind: true, isEnabled: true }
  });
}

export async function createUserModelConfig(input: {
  userId: string;
  provider: string;
  displayName: string;
  modelName: string;
  apiKey: string;
}) {
  return db.modelProviderConfig.create({
    data: {
      userId: input.userId,
      provider: input.provider,
      displayName: input.displayName,
      modelName: input.modelName,
      kind: "user_key",
      encryptedApiKey: encryptModelKey(input.apiKey),
      isEnabled: true
    }
  });
}

export async function disableModelConfig(userId: string, configId: string) {
  return db.modelProviderConfig.update({
    where: { id: configId, userId },
    data: { isEnabled: false }
  });
}
```

Implement routes so `GET /api/model-configs` returns enabled configs without plaintext keys, and `POST /api/model-configs` creates a user-key config.

- [ ] **Step 5: Implement settings UI**

Create `/settings/models` with a list of configured models and a form for `provider`, `displayName`, `modelName`, and `apiKey`. Never render saved plaintext keys.

- [ ] **Step 6: Verify**

Run:

```powershell
npm test -- src/lib/crypto src/lib/services/model-config-service.test.ts
npm run typecheck
```

Expected: encryption tests pass, service tests pass, and TypeScript passes.

- [ ] **Step 7: Commit**

```powershell
git add src/lib/crypto src/lib/services/model-config-service.ts src/app/api/model-configs src/app/settings/models src/components/forms/model-config-form.tsx
git commit -m "feat: add model configuration"
```

## Task 6: Create Sources And Root Nodes

**Files:**

- Create: `src/lib/domain/layout.ts`
- Create: `src/lib/services/source-service.ts`
- Create: `src/lib/services/content-fetcher.ts`
- Create: `src/app/api/sources/route.ts`
- Create: `src/components/forms/source-form.tsx`
- Test: `src/lib/domain/layout.test.ts`
- Test: `src/lib/services/source-service.test.ts`
- Test: `src/lib/services/content-fetcher.test.ts`

- [ ] **Step 1: Write layout test**

Create `src/lib/domain/layout.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { positionChildNode } from "./layout";

describe("positionChildNode", () => {
  it("places children to the right and offsets siblings vertically", () => {
    expect(positionChildNode({ x: 100, y: 100 }, 0)).toEqual({ x: 460, y: 100 });
    expect(positionChildNode({ x: 100, y: 100 }, 2)).toEqual({ x: 460, y: 380 });
  });
});
```

- [ ] **Step 2: Implement branch placement**

Create `src/lib/domain/layout.ts`:

```ts
export function positionChildNode(parent: { x: number; y: number }, siblingIndex: number) {
  return {
    x: parent.x + 360,
    y: parent.y + siblingIndex * 140
  };
}
```

- [ ] **Step 3: Implement content fetcher**

Create `content-fetcher.ts` with:

```ts
export async function fetchSourceContent(input: {
  type: "question" | "blog_link" | "project_link" | "book";
  url?: string;
}) {
  if (input.type === "question" || input.type === "book" || !input.url) {
    return { fetchStatus: "skipped" as const };
  }

  try {
    const response = await fetch(input.url);
    const html = await response.text();
    return {
      fetchStatus: "completed" as const,
      fetchedTitle: extractTitle(html),
      fetchedDescription: extractDescription(html),
      fetchedContent: extractReadableText(html)
    };
  } catch {
    return { fetchStatus: "failed" as const };
  }
}
```

Use Cheerio for `extractTitle`, `extractDescription`, and `extractReadableText`. Keep extraction simple: title tag, meta description, and body text limited to 12000 characters.

- [ ] **Step 4: Implement source service**

Create `createLearningSource(userId, input)` that:

- Ensures the user has one default canvas.
- Creates `LearningSource`.
- Creates a root `LearningNode` with `type: "source"`, `generationStatus: "idle"`, `x: 0`, `y: 0`.
- Stores fetched metadata when available.
- Returns the source and node.

- [ ] **Step 5: Add route and form**

Implement `POST /api/sources` using `createSourceSchema` and `createLearningSource`. Add `SourceForm` with source type tabs for question, blog link, project link, and book.

- [ ] **Step 6: Verify**

Run:

```powershell
npm test -- src/lib/domain/layout.test.ts src/lib/services/source-service.test.ts src/lib/services/content-fetcher.test.ts
npm run typecheck
```

Expected: layout, source, and fetcher tests pass.

- [ ] **Step 7: Commit**

```powershell
git add src/lib/domain/layout.ts src/lib/services/source-service.ts src/lib/services/content-fetcher.ts src/app/api/sources src/components/forms/source-form.tsx
git commit -m "feat: create learning sources and root nodes"
```

## Task 7: Build Canvas Page

**Files:**

- Create: `src/app/api/canvas/route.ts`
- Create: `src/app/canvas/page.tsx`
- Create: `src/components/app-shell.tsx`
- Create: `src/components/canvas/learning-canvas.tsx`
- Create: `src/components/canvas/learning-card.tsx`
- Test: `src/components/canvas/learning-card.test.tsx`

- [ ] **Step 1: Write card component test**

Create `src/components/canvas/learning-card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LearningCard } from "./learning-card";

describe("LearningCard", () => {
  it("shows title, type, and learned status", () => {
    render(
      <LearningCard
        data={{
          id: "node_1",
          title: "React Hooks",
          type: "source",
          summary: "Learn useState and useEffect",
          learnedStatus: "learned",
          generationStatus: "completed"
        }}
      />
    );

    expect(screen.getByText("React Hooks")).toBeVisible();
    expect(screen.getByText("source")).toBeVisible();
    expect(screen.getByText("learned")).toBeVisible();
  });
});
```

- [ ] **Step 2: Implement canvas API**

Create `GET /api/canvas` that requires the current user and returns:

```ts
{
  nodes: Array<{
    id: string;
    title: string;
    type: string;
    summary: string | null;
    learnedStatus: string;
    generationStatus: string;
    x: number;
    y: number;
  }>;
  edges: Array<{ id: string; source: string; target: string }>;
}
```

- [ ] **Step 3: Implement canvas UI**

Use `@xyflow/react`. Convert API nodes to React Flow nodes, render `LearningCard`, and navigate to `/nodes/${id}` on click. Include `SourceForm` in a left toolbar or modal.

- [ ] **Step 4: Verify**

Run:

```powershell
npm test -- src/components/canvas/learning-card.test.tsx
npm run typecheck
```

Expected: component test and typecheck pass.

- [ ] **Step 5: Commit**

```powershell
git add src/app/api/canvas src/app/canvas src/components/app-shell.tsx src/components/canvas
git commit -m "feat: add learning canvas"
```

## Task 8: Build AI Generation Foundation

**Files:**

- Create: `src/lib/ai/provider.ts`
- Create: `src/lib/ai/openai-compatible.ts`
- Create: `src/lib/ai/prompts.ts`
- Create: `src/lib/ai/generation-service.ts`
- Test: `src/lib/ai/prompts.test.ts`
- Test: `src/lib/ai/generation-service.test.ts`

- [ ] **Step 1: Write prompt contract test**

Create `src/lib/ai/prompts.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseLearningJson } from "./prompts";

describe("parseLearningJson", () => {
  it("parses explanation and knowledge points", () => {
    const result = parseLearningJson(
      JSON.stringify({
        title: "React State",
        summary: "How state changes UI",
        content: "State lets components remember values.",
        knowledgePoints: [{ title: "useState", summary: "Local component state" }]
      })
    );

    expect(result.knowledgePoints[0].title).toBe("useState");
  });
});
```

- [ ] **Step 2: Implement AI interfaces and parser**

Create `provider.ts`:

```ts
export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AiProvider {
  completeJson(input: { model: string; messages: AiMessage[] }): Promise<string>;
}
```

Create `prompts.ts` with:

- `buildInitialParseMessages(source, node)`
- `buildExpansionMessages(node, knowledgePoint)`
- `buildQuestionMessages(node, selectedText)`
- `parseLearningJson(rawOutput)`

Use Zod to validate that parsed output includes `title`, `summary`, `content`, and `knowledgePoints`.

- [ ] **Step 3: Implement OpenAI-compatible client**

Create `openai-compatible.ts` that posts to `${baseUrl}/chat/completions` with `response_format: { type: "json_object" }` and returns `choices[0].message.content`.

- [ ] **Step 4: Implement generation service**

Create `runInitialParse(userId, nodeId, modelConfigId)` that:

- Creates an `AiGeneration` with `pending`.
- Loads source, node, and model config.
- Decrypts user-key configs when needed.
- Calls the AI provider.
- Parses the JSON.
- Updates the node and creates `KnowledgePoint` records.
- Marks `AiGeneration` as `completed`.
- On error, marks both node and generation as `failed`.

- [ ] **Step 5: Verify**

Run:

```powershell
npm test -- src/lib/ai
npm run typecheck
```

Expected: AI parser and generation service tests pass.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/ai
git commit -m "feat: add AI generation foundation"
```

## Task 9: Build Node Detail And Branches

**Files:**

- Create: `src/lib/services/node-service.ts`
- Create: `src/app/api/nodes/[nodeId]/route.ts`
- Create: `src/app/api/nodes/[nodeId]/branches/route.ts`
- Create: `src/app/api/generations/[generationId]/retry/route.ts`
- Create: `src/app/nodes/[nodeId]/page.tsx`
- Create: `src/components/node-detail/node-detail-view.tsx`
- Test: `src/lib/services/node-service.test.ts`

- [ ] **Step 1: Write branch service test**

Create `src/lib/services/node-service.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createNoteBranchTitle } from "./node-service";

describe("createNoteBranchTitle", () => {
  it("uses the explicit title when present", () => {
    expect(createNoteBranchTitle("Parent", "My note")).toBe("My note");
  });

  it("falls back to parent title", () => {
    expect(createNoteBranchTitle("React Hooks", "")).toBe("Note: React Hooks");
  });
});
```

- [ ] **Step 2: Implement node service helpers**

Create:

```ts
export function createNoteBranchTitle(parentTitle: string, title: string) {
  return title.trim() || `Note: ${parentTitle}`;
}
```

Add service methods:

```ts
export async function getNodeDetail(userId: string, nodeId: string) {
  return db.learningNode.findFirst({
    where: { id: nodeId, userId, deletedAt: null },
    include: { source: true, knowledgePoints: { orderBy: { orderIndex: "asc" } }, children: true }
  });
}

export async function createNoteBranch(
  userId: string,
  nodeId: string,
  input: { title: string; content: string }
) {
  const parent = await db.learningNode.findFirstOrThrow({ where: { id: nodeId, userId } });
  const siblingCount = await db.learningNode.count({ where: { parentId: nodeId, userId } });
  const position = positionChildNode({ x: parent.x, y: parent.y }, siblingCount);

  return db.learningNode.create({
    data: {
      canvasId: parent.canvasId,
      userId,
      sourceId: parent.sourceId,
      parentId: parent.id,
      type: "note",
      title: createNoteBranchTitle(parent.title, input.title),
      content: input.content,
      x: position.x,
      y: position.y,
      generationStatus: "completed"
    }
  });
}

export async function createAiBranch(
  userId: string,
  nodeId: string,
  input: { kind: "explanation" | "question"; modelConfigId: string; selectedText?: string; sourceKnowledgePointId?: string }
) {
  const parent = await db.learningNode.findFirstOrThrow({ where: { id: nodeId, userId } });
  const siblingCount = await db.learningNode.count({ where: { parentId: nodeId, userId } });
  const position = positionChildNode({ x: parent.x, y: parent.y }, siblingCount);

  const child = await db.learningNode.create({
    data: {
      canvasId: parent.canvasId,
      userId,
      sourceId: parent.sourceId,
      parentId: parent.id,
      sourceKnowledgePointId: input.sourceKnowledgePointId,
      type: input.kind,
      title: input.kind === "question" ? `Question: ${parent.title}` : `Expand: ${parent.title}`,
      x: position.x,
      y: position.y,
      generationStatus: "pending",
      modelUsed: input.modelConfigId
    }
  });

  await runBranchGeneration(userId, child.id, input.modelConfigId, input);
  return child;
}
```

`createAiBranch` creates the child node first, then calls the generation service for that child node.

- [ ] **Step 3: Implement node APIs**

`GET /api/nodes/[nodeId]` returns node, source, child knowledge points, and child branch nodes.

`POST /api/nodes/[nodeId]/branches` accepts `createBranchSchema`. Notes do not require `modelConfigId`; AI branches require it.

- [ ] **Step 4: Implement node detail page**

The page must show:

- Full node content.
- Knowledge point list.
- Learned controls for node and points.
- Model selector for AI branch actions.
- Note branch form.
- Link back to `/canvas`.

- [ ] **Step 5: Verify**

Run:

```powershell
npm test -- src/lib/services/node-service.test.ts
npm run typecheck
```

Expected: node service tests and typecheck pass.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/services/node-service.ts src/app/api/nodes src/app/api/generations src/app/nodes src/components/node-detail
git commit -m "feat: add node detail and branching"
```

## Task 10: Implement Learned Status And Knowledge Base

**Files:**

- Create: `src/lib/services/knowledge-service.ts`
- Create: `src/app/api/nodes/[nodeId]/learned/route.ts`
- Create: `src/app/api/knowledge-points/[pointId]/learned/route.ts`
- Create: `src/app/api/knowledge/route.ts`
- Create: `src/app/knowledge/page.tsx`
- Create: `src/components/knowledge/knowledge-list.tsx`
- Test: `src/lib/services/knowledge-service.test.ts`

- [ ] **Step 1: Write matching test**

Create `src/lib/services/knowledge-service.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeKnowledgeTitle, titlesMatch } from "./knowledge-service";

describe("knowledge title matching", () => {
  it("normalizes case and plural spacing", () => {
    expect(normalizeKnowledgeTitle(" React   Hooks ")).toBe("react hooks");
  });

  it("matches close titles", () => {
    expect(titlesMatch("React Hooks", "react hooks")).toBe(true);
  });
});
```

- [ ] **Step 2: Implement knowledge service**

Create functions:

```ts
export function normalizeKnowledgeTitle(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

export function titlesMatch(a: string, b: string) {
  return normalizeKnowledgeTitle(a) === normalizeKnowledgeTitle(b);
}

export async function markNodeLearned(
  userId: string,
  nodeId: string,
  learnedStatus: "not_started" | "learning" | "learned"
) {
  const node = await db.learningNode.update({ where: { id: nodeId, userId }, data: { learnedStatus } });
  if (learnedStatus !== "learned") return deactivateNodeKnowledgeRecord(userId, nodeId);
  return upsertNodeKnowledgeRecord(userId, node);
}

export async function markKnowledgePointLearned(
  userId: string,
  pointId: string,
  learnedStatus: "not_started" | "learning" | "learned"
) {
  const point = await db.knowledgePoint.update({ where: { id: pointId, userId }, data: { learnedStatus } });
  if (learnedStatus !== "learned") return deactivatePointKnowledgeRecord(userId, pointId);
  return upsertPointKnowledgeRecord(userId, point);
}

export async function matchKnowledgePoints(userId: string, points: Array<{ id: string; title: string }>) {
  const records = await listKnowledgeRecords(userId);
  return points.map((point) => ({
    pointId: point.id,
    record: records.find((record) => titlesMatch(record.title, point.title)) ?? null
  }));
}

export async function listKnowledgeRecords(userId: string) {
  return db.knowledgeRecord.findMany({
    where: { userId, isActive: true },
    orderBy: { learnedAt: "desc" }
  });
}
```

When status is `learned`, create or reactivate a `KnowledgeRecord`. When status is not `learned`, keep history by setting `isActive` to false for the matching record.

- [ ] **Step 3: Implement APIs**

Create:

- `PATCH /api/nodes/[nodeId]/learned`
- `PATCH /api/knowledge-points/[pointId]/learned`
- `GET /api/knowledge`

Use `learnedStatusSchema` for the PATCH request bodies.

- [ ] **Step 4: Implement knowledge page**

Create a searchable list with record type filters for `node` and `knowledge_point`. Each item links to `/nodes/${sourceNodeId}`.

- [ ] **Step 5: Verify**

Run:

```powershell
npm test -- src/lib/services/knowledge-service.test.ts
npm run typecheck
```

Expected: knowledge service tests and typecheck pass.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/services/knowledge-service.ts src/app/api/knowledge src/app/api/knowledge-points src/app/api/nodes src/app/knowledge src/components/knowledge
git commit -m "feat: add learned status and knowledge base"
```

## Task 11: Connect Initial AI Parse To Source Creation

**Files:**

- Modify: `src/app/api/sources/route.ts`
- Modify: `src/lib/services/source-service.ts`
- Modify: `src/components/forms/source-form.tsx`
- Test: `src/lib/services/source-service.test.ts`

- [ ] **Step 1: Add service test for no-model behavior**

Extend `source-service.test.ts` with:

```ts
it("creates a source without starting generation when no model is selected", async () => {
  const result = await createLearningSource(user.id, {
    type: "question",
    title: "What is database indexing?",
    description: "Explain from first principles"
  });

  expect(result.node.generationStatus).toBe("idle");
});
```

- [ ] **Step 2: Add model-aware creation**

Update source creation to accept optional `modelConfigId`. If present, create the root node with `pending` status and call `runInitialParse`. If absent, keep `idle`.

- [ ] **Step 3: Update create-source form**

Fetch `/api/model-configs` and show model selection when models exist. Allow creation without selecting a model. Disable the "Start AI parse" option when no model exists.

- [ ] **Step 4: Verify**

Run:

```powershell
npm test -- src/lib/services/source-service.test.ts src/lib/ai
npm run typecheck
```

Expected: source service and AI tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/app/api/sources src/lib/services/source-service.ts src/components/forms/source-form.tsx
git commit -m "feat: run initial AI parse for new sources"
```

## Task 12: Add End-To-End Learning Flow

**Files:**

- Create: `tests/e2e/learning-flow.spec.ts`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Write the e2e test**

Create `tests/e2e/learning-flow.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("user creates a source, opens its node, adds a note, and marks it learned", async ({ page }) => {
  const email = `flow-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password-123456");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByRole("button", { name: "New learning content" }).click();
  await page.getByLabel("Question").check();
  await page.getByLabel("Title").fill("What is a database index?");
  await page.getByLabel("Description").fill("Explain indexes for a beginner.");
  await page.getByRole("button", { name: "Create card" }).click();

  await page.getByText("What is a database index?").click();
  await expect(page).toHaveURL(/\/nodes\//);

  await page.getByRole("button", { name: "Add note branch" }).click();
  await page.getByLabel("Note title").fill("Index intuition");
  await page.getByLabel("Note content").fill("Indexes trade write cost for faster reads.");
  await page.getByRole("button", { name: "Save note" }).click();

  await page.getByRole("button", { name: "Mark learned" }).click();
  await page.goto("/knowledge");
  await expect(page.getByText("What is a database index?")).toBeVisible();
});
```

- [ ] **Step 2: Run the failing e2e test**

Run:

```powershell
npm run e2e -- tests/e2e/learning-flow.spec.ts
```

Expected: FAIL if any UI labels or routes are missing.

- [ ] **Step 3: Fix UI labels and route gaps**

Align the UI with the test's accessible labels and button names:

- `New learning content`
- `Question`
- `Title`
- `Description`
- `Create card`
- `Add note branch`
- `Note title`
- `Note content`
- `Save note`
- `Mark learned`

- [ ] **Step 4: Verify**

Run:

```powershell
npm run e2e -- tests/e2e/learning-flow.spec.ts
npm run typecheck
npm test
```

Expected: e2e learning flow, typecheck, and unit tests pass.

- [ ] **Step 5: Commit**

```powershell
git add tests/e2e playwright.config.ts src
git commit -m "test: cover core learning flow"
```

## Task 13: Final Verification And README

**Files:**

- Create: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Create README**

Create `README.md` with:

```md
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
```

- [ ] **Step 2: Run full verification**

Run:

```powershell
npm run typecheck
npm test
npm run e2e
npm run build
```

Expected: all commands pass.

- [ ] **Step 3: Commit**

```powershell
git add README.md .env.example
git commit -m "docs: add local development guide"
```

- [ ] **Step 4: Push**

```powershell
git push
```

Expected: local `main` pushes to `origin/main`.

## Self-Review

Spec coverage:

- Auth is covered by Tasks 3 and 4.
- One default canvas and source card creation are covered by Tasks 2, 6, and 7.
- Dedicated node detail pages are covered by Task 9.
- Model settings and encrypted user keys are covered by Task 5.
- AI parsing and branch generation are covered by Tasks 8, 9, and 11.
- Blog/project/book/question source boundaries are covered by Task 6.
- Learned state and personal knowledge base are covered by Task 10.
- End-to-end product validation is covered by Task 12.

Placeholder scan:

- No `TBD`, `TODO`, empty feature buckets, or unspecified test steps are intentionally left in this plan.

Type consistency:

- Source types use `question`, `blog_link`, `project_link`, and `book`.
- Node types use `source`, `explanation`, `question`, and `note`.
- Learned statuses use `not_started`, `learning`, and `learned`.
- Generation statuses use `idle`, `pending`, `completed`, and `failed`.
