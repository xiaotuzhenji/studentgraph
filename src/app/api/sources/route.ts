import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { createSourceSchema } from "@/lib/domain/schemas";
import { createLearningSource } from "@/lib/services/source-service";

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const user = await requireCurrentUser();
  const body = await readJson(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  const result = await createLearningSource(user.id, parsed.data);

  return NextResponse.json(result, { status: 201 });
}
