import { z } from "zod";
import { branchKinds, learnedStatuses, sourceTypes } from "./enums";

export const createSourceSchema = z.object({
  type: z.enum(sourceTypes),
  title: z.string().trim().min(1).max(160),
  url: z.string().url().optional(),
  author: z.string().trim().max(120).optional(),
  description: z.string().trim().max(4000).optional(),
  learningGoal: z.string().trim().max(1000).optional(),
  rawInput: z.string().trim().max(8000).optional(),
  modelConfigId: z.string().cuid().optional(),
  canvasId: z.string().cuid().optional()
});

export const createBranchSchema = z.object({
  kind: z.enum(branchKinds),
  title: z.string().trim().max(160).optional().default(""),
  content: z.string().trim().max(8000).optional(),
  selectedText: z.string().trim().max(8000).optional(),
  sourceKnowledgePointId: z.string().cuid().optional(),
  modelConfigId: z.string().cuid().optional()
});

export const learnedStatusSchema = z.object({
  learnedStatus: z.enum(learnedStatuses)
});

export const updateNodePositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite()
});
