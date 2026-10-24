-- DropForeignKey
ALTER TABLE "debit_notes" DROP CONSTRAINT "debit_notes_lc_master_id_fkey";

-- DropForeignKey
ALTER TABLE "debit_notes" DROP CONSTRAINT "debit_notes_sales_contrct_id_fkey";

-- DropForeignKey
ALTER TABLE "debit_notes" DROP CONSTRAINT "debit_notes_term_id_fkey";

-- AlterTable
ALTER TABLE "factory_payment_header" ADD COLUMN     "old_rdl_invoice_id" INTEGER,
ADD COLUMN     "rdl_invoice_id" UUID;

-- AlterTable
ALTER TABLE "factory_payments" ADD COLUMN     "old_rdl_invoice_id" INTEGER,
ADD COLUMN     "rdl_invoice_id" UUID;

-- AlterTable
ALTER TABLE "user_sessions" ADD COLUMN     "device_id" TEXT,
ADD COLUMN     "expire_date" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP + '18:00:00'::interval),
ADD COLUMN     "logout_at" TIMESTAMPTZ(6),
ALTER COLUMN "login_time" SET DATA TYPE TIMESTAMPTZ(6);

-- DropTable
DROP TABLE "debit_notes";

-- CreateTable
CREATE TABLE "commercial_tna_planning" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factory_invoice_id" UUID NOT NULL,
    "commercial_tna_template_id" UUID NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commercial_tna_planning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_tna_planning_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commercial_tna_templates_actions_id" UUID NOT NULL,
    "plan_date" DATE,
    "actual_date" DATE,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "commercial_tna_template_id" UUID,
    "commercial_tna_planning_id" UUID,

    CONSTRAINT "commercial_tna_planning_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_tna_planning_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commercial_tna_planning_details_id" UUID,
    "commercial_tna_template_actions_id" UUID,
    "plan_date" DATE,
    "actual_date" DATE,
    "commercial_tna_planning_id" UUID,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commercial_tna_planning_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_tna_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_name" TEXT NOT NULL,
    "buyer_id" INTEGER NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "payment_term_id" INTEGER NOT NULL,

    CONSTRAINT "commercial_tna_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_tna_templates_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commercial_tna_template_id" UUID NOT NULL,
    "alert_before" INTEGER DEFAULT 0,
    "days" INTEGER NOT NULL,
    "tna_action_id" INTEGER NOT NULL,
    "serial" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commercial_tna_templates_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_tna_templates_actions_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commercial_tna_templates_actions_id" UUID,
    "commercial_tna_template_id" UUID,
    "alert_before" INTEGER,
    "days" INTEGER,
    "tna_action_id" INTEGER,
    "serial" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commercial_tna_templates_actions_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_tna_templates_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commercial_tna_templates_id" UUID,
    "buyer_id" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "template_name" TEXT,
    "payment_term_id" INTEGER,

    CONSTRAINT "commercial_tna_templates_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_percentage" (
    "id" SERIAL NOT NULL,
    "buyer_id" INTEGER,
    "other_percentage" DOUBLE PRECISION,
    "overseas_percentage" DOUBLE PRECISION,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_percentage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_percentage_history" (
    "id" SERIAL NOT NULL,
    "commission_percentage" INTEGER,
    "buyer_id" INTEGER,
    "other_percentage" DOUBLE PRECISION,
    "overseas_percentage" DOUBLE PRECISION,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_percentage_historty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_payment_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cross_payment_id" UUID NOT NULL,
    "factory_invoice_id" UUID NOT NULL,
    "value" DOUBLE PRECISION,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "factory_payment_no" VARCHAR(50),
    "factory_payment_date" DATE,
    "regularized" BOOLEAN DEFAULT false,

    CONSTRAINT "cross_payment_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_payment_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cross_payment_details_id" UUID,
    "cross_payment_id" UUID,
    "factory_invoice_id" UUID,
    "value" DOUBLE PRECISION,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "factory_payment_no" VARCHAR(50),
    "factory_payment_date" DATE,

    CONSTRAINT "cross_payment_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cross_payment_ref" VARCHAR(100) NOT NULL,
    "cross_payment_date" DATE DEFAULT CURRENT_DATE,
    "buyer_id" INTEGER NOT NULL,
    "term_id" INTEGER NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "is_authorized" BOOLEAN DEFAULT false,

    CONSTRAINT "cross_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_payments_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cross_payments_id" UUID,
    "cross_payment_ref" VARCHAR(100),
    "cross_payment_date" DATE,
    "buyer_id" INTEGER,
    "term_id" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_authorized" BOOLEAN,

    CONSTRAINT "cross_payments_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_payments_metadata" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "year" INTEGER,
    "last_ref" INTEGER,
    "buyer_id" INTEGER,

    CONSTRAINT "cross_payments_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debit_note" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "term_id" INTEGER NOT NULL,
    "buyer_id" INTEGER NOT NULL,
    "debit_note_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "debit_note_ref" VARCHAR(50) NOT NULL,
    "lc_id" UUID,
    "sales_contract_id" UUID,
    "less" DOUBLE PRECISION,
    "processing_charge" DOUBLE PRECISION,
    "conversion_rate" DOUBLE PRECISION,
    "additional_adjustment" DOUBLE PRECISION,
    "remarks" TEXT,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,
    "old_buyer_id" INTEGER,
    "old_lc_id" INTEGER,
    "old_sc_id" INTEGER,
    "factory_id" INTEGER NOT NULL,
    "old_factory_id" INTEGER,

    CONSTRAINT "debit_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debit_note_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "debit_note_header_id" UUID NOT NULL,
    "old_pk" INTEGER,
    "old_debit_note_header_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "exfactory_shipment_id" UUID NOT NULL,
    "old_exfactory_shipment_detail_id" INTEGER,

    CONSTRAINT "debit_note_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debit_note_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "debit_note_details" INTEGER,
    "debit_note_header_id" UUID,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "exfactory_shipment_id" VARCHAR(40),

    CONSTRAINT "debit_note_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debit_note_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "debit_note_id" UUID,
    "term_id" INTEGER,
    "buyer_id" INTEGER,
    "debit_note_date" DATE,
    "debit_note_ref" VARCHAR(50),
    "lc_id" UUID,
    "sales_contract_id" UUID,
    "less" DOUBLE PRECISION,
    "processing_charge" DOUBLE PRECISION,
    "conversion_rate" DOUBLE PRECISION,
    "additional_adjustment" DOUBLE PRECISION,
    "remarks" TEXT,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debit_note_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debit_note_metadata" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "buyer_id" INTEGER,
    "last_ref" INTEGER,
    "year" INTEGER,

    CONSTRAINT "debit_note_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "early_settlement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "remarks" TEXT,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "buyer_id" INTEGER NOT NULL,

    CONSTRAINT "early_settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "early_settlement_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shipment_details_id" UUID NOT NULL,
    "early_settlement_charge" DOUBLE PRECISION NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "early_settlement_id" UUID,

    CONSTRAINT "early_settlement_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "early_settlement_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "early_settlement_details_id" UUID,
    "shipment_details_id" UUID,
    "early_settlement_charge" DOUBLE PRECISION,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "early_settlement_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "early_settlement_percentage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "buyer_id" INTEGER NOT NULL,
    "charge" DOUBLE PRECISION NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "early_settelment_percentage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "early_settlement_percentage_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "early_settlement_percentage_id" UUID,
    "buyer_id" INTEGER,
    "charge" DOUBLE PRECISION,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "action_type" "actions",

    CONSTRAINT "early_settelment_percentage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "request_id" UUID NOT NULL,
    "procedure_name" TEXT NOT NULL,
    "request_method" VARCHAR(10) NOT NULL,
    "query_params" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "referer" TEXT,
    "input_data" JSONB,
    "error_name" VARCHAR(255) NOT NULL,
    "error_code" VARCHAR(100),
    "user_id" UUID,
    "error_message" TEXT,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unique_commercial_tna_planning_per_factory_invoice" ON "commercial_tna_planning"("factory_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_template_per_buyer_term" ON "commercial_tna_templates"("buyer_id", "payment_term_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_buyer_year_cross_payment" ON "cross_payments_metadata"("year", "buyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_buyer_in_debit_notes" ON "debit_note_metadata"("buyer_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "one_early_settlement_per_order" ON "early_settlement"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_shipments" ON "early_settlement_details"("shipment_details_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_factory_invoice_per_rdl_invoice" ON "factory_payments"("rdl_invoice_id", "factory_invoice_id");

-- AddForeignKey
ALTER TABLE "factory_payment_header" ADD CONSTRAINT "factory_payment_header_rdl_invoice_id_fkey" FOREIGN KEY ("rdl_invoice_id") REFERENCES "rdl_invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_payments" ADD CONSTRAINT "factory_payments_rdl_invoice_id_fkey" FOREIGN KEY ("rdl_invoice_id") REFERENCES "rdl_invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commercial_tna_planning" ADD CONSTRAINT "commercial_tna_planning_commer_tna_template_id_fkey" FOREIGN KEY ("commercial_tna_template_id") REFERENCES "commercial_tna_templates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commercial_tna_planning" ADD CONSTRAINT "commercial_tna_planning_factory_invoice_id_fkey" FOREIGN KEY ("factory_invoice_id") REFERENCES "factory_invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commercial_tna_planning_details" ADD CONSTRAINT "commercial_tna_planning_detai_commercial_tna_templates_act_fkey" FOREIGN KEY ("commercial_tna_templates_actions_id") REFERENCES "commercial_tna_templates_actions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commercial_tna_planning_details" ADD CONSTRAINT "commercial_tna_planning_details_commercial_tna_planning_id_fkey" FOREIGN KEY ("commercial_tna_planning_id") REFERENCES "commercial_tna_planning"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commercial_tna_planning_details" ADD CONSTRAINT "commercial_tna_planning_details_commercial_tna_template_id_fkey" FOREIGN KEY ("commercial_tna_template_id") REFERENCES "commercial_tna_templates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commercial_tna_planning_details_history" ADD CONSTRAINT "commercial_tna_planning_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commercial_tna_templates" ADD CONSTRAINT "commercial_tna_templates_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commercial_tna_templates" ADD CONSTRAINT "commercial_tna_templates_payment_term_id_fkey" FOREIGN KEY ("payment_term_id") REFERENCES "payment_terms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commercial_tna_templates_actions" ADD CONSTRAINT "commercial_tna_templates_action_commercial_tna_template_id_fkey" FOREIGN KEY ("commercial_tna_template_id") REFERENCES "commercial_tna_templates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commercial_tna_templates_actions" ADD CONSTRAINT "commercial_tna_templates_actions_tna_action_id_fkey" FOREIGN KEY ("tna_action_id") REFERENCES "tna_actions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commercial_tna_templates_actions_history" ADD CONSTRAINT "commercial_tna_templates_actions_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commercial_tna_templates_history" ADD CONSTRAINT "commercial_tna_templates_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_percentage" ADD CONSTRAINT "commission_percentage_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_percentage_history" ADD CONSTRAINT "commission_percentage_historty_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cross_payment_details" ADD CONSTRAINT "cross_payment_details_cross_payment_id_fkey" FOREIGN KEY ("cross_payment_id") REFERENCES "cross_payments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cross_payment_details" ADD CONSTRAINT "cross_payment_details_factory_invoice_id_fkey" FOREIGN KEY ("factory_invoice_id") REFERENCES "factory_invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cross_payment_details_history" ADD CONSTRAINT "cross_payment_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cross_payments" ADD CONSTRAINT "cross_payments_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cross_payments" ADD CONSTRAINT "cross_payments_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cross_payments_history" ADD CONSTRAINT "cross_payments_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cross_payments_metadata" ADD CONSTRAINT "cross_payments_metadata_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debit_note" ADD CONSTRAINT "debit_note_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debit_note" ADD CONSTRAINT "debit_note_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debit_note" ADD CONSTRAINT "debit_note_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "lc_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debit_note" ADD CONSTRAINT "debit_note_sales_contract_id_fkey" FOREIGN KEY ("sales_contract_id") REFERENCES "sales_contracts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debit_note" ADD CONSTRAINT "debit_note_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debit_note_details" ADD CONSTRAINT "debit_note_details_debit_note_header_id_fkey" FOREIGN KEY ("debit_note_header_id") REFERENCES "debit_note"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debit_note_details" ADD CONSTRAINT "debit_note_details_exfactory_shipment_id_fkey" FOREIGN KEY ("exfactory_shipment_id") REFERENCES "exfactory_shipments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debit_note_details_history" ADD CONSTRAINT "debit_note_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debit_note_history" ADD CONSTRAINT "debit_note_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debit_note_metadata" ADD CONSTRAINT "debit_note_metadata_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "early_settlement" ADD CONSTRAINT "early_settlement_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "early_settlement" ADD CONSTRAINT "early_settlement_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "early_settlement_details" ADD CONSTRAINT "early_settlement_details_early_settlement_id_fkey" FOREIGN KEY ("early_settlement_id") REFERENCES "early_settlement"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "early_settlement_details" ADD CONSTRAINT "early_settlement_details_shipment_details_id_fkey" FOREIGN KEY ("shipment_details_id") REFERENCES "shipment_details"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "early_settlement_details_history" ADD CONSTRAINT "early_settlement_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "early_settlement_percentage" ADD CONSTRAINT "early_settelment_percentage_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "early_settlement_percentage_history" ADD CONSTRAINT "early_settelment_percentage_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

