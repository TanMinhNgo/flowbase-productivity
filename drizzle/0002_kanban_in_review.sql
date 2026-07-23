WITH boards_missing_review AS (
  SELECT board.id
  FROM "kanban_boards" AS board
  WHERE NOT EXISTS (
    SELECT 1
    FROM "kanban_columns" AS kanban_column
    WHERE kanban_column."board_id" = board.id
      AND kanban_column."name" = 'In Review'
  )
)
UPDATE "kanban_columns" AS kanban_column
SET "position" = kanban_column."position" + 1
FROM boards_missing_review
WHERE kanban_column."board_id" = boards_missing_review.id
  AND kanban_column."position" >= 2;
--> statement-breakpoint
INSERT INTO "kanban_columns" ("board_id", "name", "position")
SELECT board.id, 'In Review', 2
FROM "kanban_boards" AS board
WHERE NOT EXISTS (
  SELECT 1
  FROM "kanban_columns" AS kanban_column
  WHERE kanban_column."board_id" = board.id
    AND kanban_column."name" = 'In Review'
);
