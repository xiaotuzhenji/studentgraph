import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { createCanvas, deleteCanvas, listCanvases, renameCanvas, setDefaultCanvas } from "@/lib/services/canvas-service";

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await requireCurrentUser();
  const canvases = await listCanvases(user.id);
  return NextResponse.json({ canvases });
}

export async function POST(request: Request) {
  const user = await requireCurrentUser();
  const body = await readJson(request);

  if (!body?.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "画布标题不能为空" }, { status: 400 });
  }

  const canvas = await createCanvas(user.id, body.title.trim());
  return NextResponse.json({ canvas }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await requireCurrentUser();
  const body = await readJson(request);

  if (!body?.canvasId || typeof body.canvasId !== "string") {
    return NextResponse.json({ error: "缺少画布 ID" }, { status: 400 });
  }

  if (body.action === "rename") {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return NextResponse.json({ error: "画布标题不能为空" }, { status: 400 });
    }

    const canvas = await renameCanvas(user.id, body.canvasId, body.title.trim());
    return NextResponse.json({ canvas });
  }

  if (body.action === "set_default") {
    const canvas = await setDefaultCanvas(user.id, body.canvasId);
    return NextResponse.json({ canvas });
  }

  return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const user = await requireCurrentUser();
  const body = await readJson(request);

  if (!body?.canvasId || typeof body.canvasId !== "string") {
    return NextResponse.json({ error: "缺少画布 ID" }, { status: 400 });
  }

  try {
    await deleteCanvas(user.id, body.canvasId);
  } catch (error) {
    if (error instanceof Error && error.message === "不能删除唯一画布") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }

  return NextResponse.json({ ok: true });
}
