import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { listKnowledgeRecords } from "@/lib/services/knowledge-service";

export async function GET() {
  const user = await requireCurrentUser();
  const records = await listKnowledgeRecords(user.id);

  return NextResponse.json({ records });
}
