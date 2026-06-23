import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { createUserModelConfig, listModelConfigs } from "@/lib/services/model-config-service";

const modelConfigSchema = z.object({
  provider: z.string().trim().min(1).max(80),
  displayName: z.string().trim().min(1).max(120),
  baseUrl: z
    .string()
    .trim()
    .url()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  modelName: z.string().trim().min(1).max(120),
  apiKey: z.string().trim().min(1).max(4000)
});

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await requireCurrentUser();
  const configs = await listModelConfigs(user.id);

  return NextResponse.json({ configs });
}

export async function POST(request: Request) {
  const user = await requireCurrentUser();
  const body = await readJson(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = modelConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid model config" }, { status: 400 });
  }

  const config = await createUserModelConfig({
    userId: user.id,
    ...parsed.data
  });

  return NextResponse.json({ config }, { status: 201 });
}
