export const sourceTypes = ["question", "blog_link", "project_link", "book"] as const;
export const nodeTypes = ["source", "explanation", "question", "note"] as const;
export const generationStatuses = ["idle", "pending", "completed", "failed"] as const;
export const learnedStatuses = ["not_started", "learning", "learned"] as const;
export const branchKinds = ["explanation", "question", "note"] as const;
