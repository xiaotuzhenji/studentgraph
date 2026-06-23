import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { disableModelConfig } from "@/lib/services/model-config-service";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ configId: string }> }
) {
  const user = await requireCurrentUser();
  const { configId } = await context.params;

  await disableModelConfig(user.id, configId);

  return NextResponse.json({ ok: true });
}
