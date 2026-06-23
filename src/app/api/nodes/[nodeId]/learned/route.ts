import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { learnedStatusSchema } from "@/lib/domain/schemas";
import { markNodeLearned } from "@/lib/services/knowledge-service";

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ nodeId: string }> }) {
  const user = await requireCurrentUser();
  const { nodeId } = await context.params;
  const body = await readJson(request);

  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = learnedStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid learned status" }, { status: 400 });
  }

  const node = await markNodeLearned(user.id, nodeId, parsed.data.learnedStatus);

  return NextResponse.json({ node });
}
