-- CreateTable
CREATE TABLE "quote_requests" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "public_token" TEXT NOT NULL,
    "output_mode" TEXT NOT NULL,
    "recipient_email" TEXT,
    "requester_name" TEXT NOT NULL,
    "requester_email" TEXT,
    "requester_phone" TEXT,
    "requester_company" TEXT,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "quote_breakdown" JSONB NOT NULL DEFAULT '{}',
    "quote_minor" INTEGER,
    "currency" TEXT,
    "config_snapshot" JSONB NOT NULL DEFAULT '{}',
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quote_requests_public_token_key" ON "quote_requests"("public_token");

-- CreateIndex
CREATE INDEX "quote_requests_tenant_id_submitted_at_idx" ON "quote_requests"("tenant_id", "submitted_at");

-- CreateIndex
CREATE INDEX "quote_requests_tenant_id_customer_id_idx" ON "quote_requests"("tenant_id", "customer_id");

-- AddForeignKey
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
