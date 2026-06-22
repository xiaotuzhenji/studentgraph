# AI Learning Canvas MVP Design

## Goal

Build a web-based AI learning workspace where a signed-in user can create learning content, receive an AI-generated first-layer explanation, grow a learning path on an infinite canvas, mark knowledge as learned, and review learned content in a personal knowledge base.

## Scope

This MVP follows the product-oriented path: one complete learning loop with deliberately small feature boundaries.

Included:

- Email and password registration/login.
- One default learning canvas per user.
- Infinite canvas with learning cards and parent-child branch lines.
- Learning content types: question, blog link, project link, book.
- No video learning in the MVP.
- Click a card to enter a dedicated node detail page.
- AI first-stage parsing for learning content.
- AI expansion from a whole card, a child knowledge point, or selected text.
- User-created note branches.
- Platform-provided models and user-provided model keys.
- Model selection for AI learning actions.
- Learned status for both cards and child knowledge points.
- Personal knowledge base with learned-content reminders.

Excluded from MVP:

- Video links, subtitle extraction, and video-based learning.
- Multi-user collaboration.
- Complex knowledge graph merging.
- Automatic recommendation of next learning topics.
- Multiple canvas management.
- Complex long-document chunking and quality scoring.
- Model auto-routing.
- Full background job queue architecture.

## Assumptions

- The product is web-first. Mobile should remain usable, but desktop canvas use is the primary MVP experience.
- Users can create cards even when no model is configured.
- AI parsing, expansion, and question answering require at least one available model.
- User model keys are stored and used only on the backend. The frontend never receives plaintext keys.
- Platform-provided models and user-provided models appear as one unified model list in the UI.
- Blog and project links are parsed best-effort. Failed fetching does not block card creation.

## Information Architecture

The MVP has five top-level product areas:

- Login and registration.
- Learning canvas.
- Learning node detail page.
- Personal knowledge base.
- Model settings.

Recommended routes:

- `/login`
- `/register`
- `/canvas`
- `/nodes/:nodeId`
- `/knowledge`
- `/settings/models`

## Primary User Flow

1. The user registers or logs in with email and password.
2. The user opens the learning canvas.
3. The user creates a new learning content item.
4. The user selects one source type: question, blog link, project link, or book.
5. The user fills in the fields for that source type.
6. The system creates a root `source` card on the canvas.
7. If a model is available, the system performs first-stage AI parsing.
8. The user clicks the card and enters `/nodes/:nodeId`.
9. The detail page shows the AI explanation, first-layer knowledge points, learned status, and branch actions.
10. The user can expand a knowledge point, ask about selected text, or create a note branch.
11. AI actions require model selection.
12. New branch cards appear on the canvas and remain connected to the parent node.
13. The user marks cards or child knowledge points as learned.
14. Learned content appears in the personal knowledge base.
15. Future AI parsing highlights matching learned knowledge where possible.

## Core Objects

### User

Stores account identity for email/password authentication.

Key fields: `id`, `email`, `passwordHash`, `createdAt`, `updatedAt`.

### ModelProviderConfig

Stores platform and user model configuration.

Key fields: `id`, `userId`, `provider`, `displayName`, `modelName`, `kind`, `encryptedApiKey`, `isEnabled`, `createdAt`, `updatedAt`.

`kind` is either `platform` or `user_key`.

### LearningCanvas

Represents the user's canvas. MVP can create one default canvas per user.

Key fields: `id`, `userId`, `title`, `createdAt`, `updatedAt`.

### LearningSource

Represents the original learning input behind a root card.

Supported source types: `question`, `blog_link`, `project_link`, `book`.

Key fields: `id`, `userId`, `type`, `title`, `url`, `author`, `description`, `learningGoal`, `rawInput`, `fetchStatus`, `fetchedTitle`, `fetchedDescription`, `fetchedContent`, `createdAt`, `updatedAt`.

### LearningNode

Represents a card on the canvas.

Node types:

- `source`: root learning content card.
- `explanation`: AI-expanded knowledge card.
- `question`: AI answer branch created from selected text or a knowledge point.
- `note`: user-authored note branch.

Key fields: `id`, `canvasId`, `userId`, `sourceId`, `parentId`, `sourceKnowledgePointId`, `type`, `title`, `summary`, `content`, `x`, `y`, `hasManualPosition`, `generationStatus`, `learnedStatus`, `modelUsed`, `createdAt`, `updatedAt`, `deletedAt`.

`generationStatus` is one of `idle`, `pending`, `completed`, `failed`.

`learnedStatus` is one of `not_started`, `learning`, `learned`.

### KnowledgePoint

Represents an AI-generated child learning point inside a node. It is not automatically a canvas card.

Key fields: `id`, `nodeId`, `userId`, `title`, `summary`, `content`, `orderIndex`, `learnedStatus`, `matchedKnowledgeRecordId`, `matchConfidence`, `createdAt`, `updatedAt`.

### KnowledgeRecord

Represents learned content in the personal knowledge base.

Key fields: `id`, `userId`, `recordType`, `sourceNodeId`, `sourceKnowledgePointId`, `title`, `summary`, `keywords`, `rawText`, `learnedAt`, `isActive`, `createdAt`, `updatedAt`.

`recordType` is either `node` or `knowledge_point`.

### AiGeneration

Records one AI generation attempt for audit, retry, and debugging.

Key fields: `id`, `userId`, `nodeId`, `action`, `modelConfigId`, `inputPayload`, `outputPayload`, `rawOutput`, `status`, `errorMessage`, `createdAt`, `updatedAt`.

`action` is one of `initial_parse`, `expand_point`, `ask_question`, `retry`.

`status` is one of `pending`, `completed`, `failed`.

## AI Generation Flow

The MVP uses staged parsing.

Initial parse:

1. User creates a learning source.
2. System creates a root `source` node.
3. If no model is available, the node stays unparsed and can be opened or edited.
4. If one model is available, the system can use it directly.
5. If multiple models are available, the user chooses a default learning model.
6. The AI generates the root explanation and first-layer knowledge points.
7. The system checks generated knowledge points against the personal knowledge base.
8. The node detail page shows the explanation, child points, and learned matches.

Expansion:

1. User opens a node detail page.
2. User expands the whole card, expands one knowledge point, asks about selected text, or creates a note.
3. Note creation does not require a model.
4. AI expansion and questions require model selection.
5. The system creates a child `LearningNode`.
6. The child node appears to the right of the parent on the canvas.

Failure handling:

- Card creation succeeds even if AI parsing fails.
- Fetching failure does not block creation.
- AI failure leaves the node in `failed` generation status.
- The node detail page offers retry and model-switch retry.
- Incomplete AI output is stored as raw output and treated as failed or partially usable according to validation.
- Each AI call creates an `AiGeneration` record.

## Content Fetching Boundary

Question:

- Uses only user-provided title, question, and supplemental description.

Blog link:

- Attempts to fetch page title, description, and readable body content.
- Falls back to metadata and user-provided context if body extraction fails.

Project link:

- Attempts to fetch project title, description, and README-like content.
- Falls back to metadata and user-provided context if README extraction fails.

Book:

- Does not fetch external content.
- Uses book title, author, learning goal, and supplemental description.

## Canvas Interaction

The canvas uses automatic placement with manual adjustment.

Core behavior:

- Users can pan, zoom, and drag cards.
- Parent-child node relationships are shown with lines.
- Root nodes appear near the canvas center or in available space.
- New child branches appear to the right of the parent.
- Multiple children from the same parent are vertically offset.
- Dragged nodes persist their position and are not automatically overwritten.
- MVP uses soft delete for nodes if deletion is included.

Canvas cards show only compact information:

- Title.
- Node type.
- Short summary.
- Learned status.
- Generation status.
- Optional model label.

The full learning experience lives on the dedicated node detail page.

## Node Detail Page

The node detail page supports:

- Viewing the full AI explanation or note content.
- Viewing child knowledge points.
- Marking the whole node as learned.
- Marking individual knowledge points as learned.
- Expanding a whole node.
- Expanding a child knowledge point.
- Asking a question about selected text.
- Creating a note branch.
- Retrying failed AI generation with the same or a different model.
- Returning to the canvas focused on the current node.

## Knowledge Base

The knowledge base records learned nodes and learned knowledge points.

Learning rules:

- Marking a node as learned creates or updates a node-type `KnowledgeRecord`.
- Marking a knowledge point as learned creates or updates a knowledge-point-type `KnowledgeRecord`.
- Repeated marking updates an existing record instead of creating duplicates.
- Unmarking learned content keeps history by deactivating or changing the active learned state.

Matching rules:

- MVP starts with exact or near-title matching using titles and keywords.
- If embedding support is available, generated knowledge points can also be matched semantically.
- Lack of embedding support must not block the learning flow.

Knowledge page:

- Shows learned records in a searchable list.
- Supports filtering by record type.
- Supports sorting by learned time.
- Links each record back to its source node detail page.
- Groups or filters by original learning source where useful.

## Validation Criteria

The MVP is successful when:

- A new user can register and log in.
- A signed-in user can open a canvas.
- A user can create a question, blog link, project link, or book source.
- Creating a source produces a root card on the canvas.
- A user can open a card as a dedicated detail page.
- With a configured model, the system can generate a first-layer explanation and knowledge points.
- A user can create explanation, question, and note branches from a node.
- New branch cards appear on the canvas connected to their parent.
- A user can mark both nodes and knowledge points as learned.
- Learned records appear in the knowledge base.
- Newly generated knowledge points can show learned matches where matching is available.
- Without a configured model, users can still create cards and notes but cannot run AI actions.

## Open Implementation Decisions

These decisions should be made during implementation planning:

- Exact frontend framework and canvas library.
- Backend framework and database.
- Password hashing and session strategy.
- Model providers supported in the first implementation.
- Encryption strategy for user model keys.
- Whether AI generation runs through server actions, API routes, or a small worker process.
- Whether semantic matching ships in the first build or follows after title/keyword matching.
