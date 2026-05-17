-- CreateTable
CREATE TABLE "theme_families" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "vertical_fit" JSONB NOT NULL DEFAULT '[]',
    "personality" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "theme_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_versions" (
    "id" TEXT NOT NULL,
    "theme_family_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "lifecycle" TEXT NOT NULL,
    "recipe" JSONB NOT NULL DEFAULT '{}',
    "migration_notes" JSONB,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),
    "deprecated_at" TIMESTAMPTZ(6),

    CONSTRAINT "theme_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_theme_assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "theme_family_id" TEXT NOT NULL,
    "theme_version_id" TEXT NOT NULL,
    "recipe_variation" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenant_theme_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_theme_assignments_tenant_id_key" ON "tenant_theme_assignments"("tenant_id");

-- AddForeignKey
ALTER TABLE "theme_versions" ADD CONSTRAINT "theme_versions_theme_family_id_fkey" FOREIGN KEY ("theme_family_id") REFERENCES "theme_families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_theme_assignments" ADD CONSTRAINT "tenant_theme_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_theme_assignments" ADD CONSTRAINT "tenant_theme_assignments_theme_family_id_fkey" FOREIGN KEY ("theme_family_id") REFERENCES "theme_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_theme_assignments" ADD CONSTRAINT "tenant_theme_assignments_theme_version_id_fkey" FOREIGN KEY ("theme_version_id") REFERENCES "theme_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
