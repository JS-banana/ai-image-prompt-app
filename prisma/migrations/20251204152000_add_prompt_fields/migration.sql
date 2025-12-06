-- Redefine Prompt to add author/link/preview/category/mode and unique title
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tags" TEXT,
    "variables" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "author" TEXT,
    "link" TEXT,
    "preview" TEXT,
    "category" TEXT,
    "mode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_Prompt" ("id", "title", "body", "tags", "variables", "version", "createdAt", "updatedAt")
SELECT "id", "title", "body", "tags", "variables", "version", "createdAt", "updatedAt" FROM "Prompt";

DROP TABLE "Prompt";
ALTER TABLE "new_Prompt" RENAME TO "Prompt";

CREATE UNIQUE INDEX "Prompt_title_key" ON "Prompt"("title");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
