import { db } from "@/lib/db";

export function listCanvases(userId: string) {
  return db.learningCanvas.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      isDefault: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

export async function getDefaultCanvas(userId: string) {
  return db.learningCanvas.findFirst({
    where: { userId, isDefault: true }
  });
}

export async function createCanvas(userId: string, title: string) {
  const existingDefault = await getDefaultCanvas(userId);

  return db.learningCanvas.create({
    data: {
      userId,
      title,
      isDefault: !existingDefault
    }
  });
}

export async function renameCanvas(userId: string, canvasId: string, title: string) {
  return db.learningCanvas.update({
    where: { id_userId: { id: canvasId, userId } },
    data: { title }
  });
}

export async function setDefaultCanvas(userId: string, canvasId: string) {
  await db.learningCanvas.updateMany({
    where: { userId },
    data: { isDefault: false }
  });

  return db.learningCanvas.update({
    where: { id_userId: { id: canvasId, userId } },
    data: { isDefault: true }
  });
}

export async function deleteCanvas(userId: string, canvasId: string) {
  const canvas = await db.learningCanvas.findFirstOrThrow({
    where: { id: canvasId, userId },
    select: { id: true, isDefault: true }
  });

  if (canvas.isDefault) {
    const replacement = await db.learningCanvas.findFirst({
      where: { userId, id: { not: canvasId } },
      orderBy: [{ createdAt: "asc" }],
      select: { id: true }
    });

    if (!replacement) {
      throw new Error("不能删除唯一画布");
    }

    await db.learningCanvas.update({
      where: { id_userId: { id: replacement.id, userId } },
      data: { isDefault: true }
    });
  }

  return db.learningCanvas.delete({
    where: { id_userId: { id: canvasId, userId } }
  });
}
