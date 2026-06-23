import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { createBranchSchema } from "@/lib/domain/schemas";
import { createAiBranch, createNoteBranch } from "@/lib/services/node-service";

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: Request, context: { params: Promise<{ nodeId: string }> }) {
  const user = await requireCurrentUser();
  const { nodeId } = await context.params;
  const body = await readJson(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createBranchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid branch" }, { status: 400 });
  }

  if (parsed.data.kind === "note") {
    const node = await createNoteBranch(user.id, nodeId, parsed.data);
    return NextResponse.json({ node }, { status: 201 });
  }

  if (!parsed.data.modelConfigId) {
    return NextResponse.json({ error: "modelConfigId is required for AI branches" }, { status: 400 });
  }

  const node = await createAiBranch(user.id, nodeId, {
    ...parsed.data,
    kind: parsed.data.kind,
    modelConfigId: parsed.data.modelConfigId
  });

  return NextResponse.json({ node }, { status: 201 });
}
