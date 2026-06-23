import { z } from "zod";
import type { AiMessage } from "./provider";

type SourcePromptInput = {
  type: string;
  title: string;
  author?: string | null;
  description?: string | null;
  learningGoal?: string | null;
  rawInput?: string | null;
  fetchedTitle?: string | null;
  fetchedDescription?: string | null;
  fetchedContent?: string | null;
};

type NodePromptInput = {
  title: string;
  summary?: string | null;
  content?: string | null;
};

type KnowledgePointPromptInput = {
  title: string;
  summary?: string | null;
  content?: string | null;
};

const learningJsonSchema = z.object({
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  content: z.string().trim().min(1),
  knowledgePoints: z.array(
    z.object({
      title: z.string().trim().min(1),
      summary: z.string().trim().min(1),
      content: z.string().trim().min(1).optional()
    })
  )
});

export type LearningJson = z.infer<typeof learningJsonSchema>;

const systemMessage: AiMessage = {
  role: "system",
  content:
    "You are 知枝, an AI study assistant. Return only valid JSON with title, summary, content, and knowledgePoints. Each knowledge point must include title and summary, and may include content."
};

function formatField(label: string, value?: string | null) {
  return value ? `${label}: ${value}` : null;
}

function compactLines(lines: Array<string | null>) {
  return lines.filter(Boolean).join("\n");
}

export function buildInitialParseMessages(source: SourcePromptInput, node: NodePromptInput): AiMessage[] {
  return [
    systemMessage,
    {
      role: "user",
      content: compactLines([
        "Create a learning card from this source.",
        formatField("Source type", source.type),
        formatField("Source title", source.fetchedTitle ?? source.title),
        formatField("Author", source.author),
        formatField("Description", source.fetchedDescription ?? source.description),
        formatField("Learning goal", source.learningGoal),
        formatField("Raw source input", source.fetchedContent ?? source.rawInput),
        formatField("Current node title", node.title),
        formatField("Current node summary", node.summary),
        formatField("Current node content", node.content)
      ])
    }
  ];
}

export function buildExpansionMessages(
  node: NodePromptInput,
  knowledgePoint: KnowledgePointPromptInput,
  selectedText?: string | null
): AiMessage[] {
  return [
    systemMessage,
    {
      role: "user",
      content: compactLines([
        "Expand this knowledge point into a clear learning card.",
        formatField("Parent node title", node.title),
        formatField("Parent node content", node.content),
        formatField("Selected text to expand", selectedText),
        formatField("Knowledge point title", knowledgePoint.title),
        formatField("Knowledge point summary", knowledgePoint.summary),
        formatField("Knowledge point content", knowledgePoint.content)
      ])
    }
  ];
}

export function buildQuestionMessages(node: NodePromptInput, selectedText?: string | null): AiMessage[] {
  return [
    systemMessage,
    {
      role: "user",
      content: compactLines([
        "Answer the learner's question as a learning card.",
        formatField("Node title", node.title),
        formatField("Node content", node.content),
        formatField("Selected text or question", selectedText)
      ])
    }
  ];
}

export function parseLearningJson(rawOutput: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawOutput);
  } catch {
    throw new Error("AI output was not valid JSON");
  }

  const result = learningJsonSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("AI output did not match the expected learning JSON shape");
  }

  return result.data;
}
