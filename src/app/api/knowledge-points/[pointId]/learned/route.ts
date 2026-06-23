import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { learnedStatusSchema } from "@/lib/domain/schemas";
import { markKnowledgePointLearned } from "@/lib/services/knowledge-service";

function isRecordNotFoundError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2025";
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ pointId: string }> }) {
  const user = await requireCurrentUser();
  const { pointId } = await context.params;
  const body = await readJson(request);

  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = learnedStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid learned status" }, { status: 400 });
  }

  try {
    const point = await markKnowledgePointLearned(user.id, pointId, parsed.data.learnedStatus);

    return NextResponse.json({ point });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return NextResponse.json({ error: "Knowledge point not found" }, { status: 404 });
    }

    throw error;
  }
}
