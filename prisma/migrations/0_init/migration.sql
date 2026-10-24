-- CreateEnum
CREATE TYPE "actions" AS ENUM ('UPDATE', 'DELETE', 'RESTORE', 'ADDED');

-- CreateEnum
CREATE TYPE "authorization_types" AS ENUM ('USER', 'LEVEL');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('ACTIVE', 'DELIVERED', 'CANCELED');

-- CreateEnum
CREATE TYPE "shipment_modes" AS ENUM ('SEA', 'AIR', 'LAND', 'BY ROAD');

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" CHAR(15) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_permission" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "level_id" INTEGER NOT NULL,
    "module_id" INTEGER NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_add" BOOLEAN NOT NULL DEFAULT false,
    "can_update" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "can_trace" BOOLEAN NOT NULL DEFAULT false,
    "added_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "department_id" INTEGER,

    CONSTRAINT "level_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_permission_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "level_id" INTEGER NOT NULL,
    "module_id" INTEGER NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_add" BOOLEAN NOT NULL DEFAULT false,
    "can_update" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "can_trace" BOOLEAN NOT NULL DEFAULT false,
    "added_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "action" "actions" NOT NULL,
    "action_by" UUID,
    "action_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "level_permission_id" UUID,
    "past_action_time" TIMESTAMP(6),

    CONSTRAINT "level_permission_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "levels" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(15) NOT NULL,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "levels_history" (
    "id" SERIAL NOT NULL,
    "level_id" INTEGER NOT NULL,
    "name" VARCHAR(15),
    "action" "actions" NOT NULL,
    "action_by" UUID NOT NULL,
    "action_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "levels_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "parent_module_id" INTEGER,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "module_id" INTEGER NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_add" BOOLEAN NOT NULL DEFAULT false,
    "can_update" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "added_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "can_trace" BOOLEAN,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "permission_id" UUID,
    "user_id" UUID NOT NULL,
    "module_id" INTEGER NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_add" BOOLEAN NOT NULL DEFAULT false,
    "can_update" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "can_trace" BOOLEAN NOT NULL DEFAULT false,
    "added_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "action" "actions" NOT NULL,
    "action_by" UUID,
    "action_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(25) NOT NULL,
    "last_name" VARCHAR(25),
    "phone_no" VARCHAR(18) NOT NULL,
    "password" TEXT NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "department_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "user_id" VARCHAR(20) NOT NULL,
    "hashed_password" TEXT NOT NULL,
    "level_id" INTEGER NOT NULL,
    "old_pk" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_history" (
    "id" SERIAL NOT NULL,
    "users_id" UUID,
    "first_name" VARCHAR(25),
    "last_name" VARCHAR(25),
    "phone_no" VARCHAR(18),
    "password" TEXT,
    "email" VARCHAR(50),
    "department_id" INTEGER,
    "level_id" INTEGER,
    "user_id" VARCHAR(20),
    "is_active" BOOLEAN,
    "hashed_password" TEXT,
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "session_token" TEXT NOT NULL,
    "ip" INET,
    "browser" TEXT,
    "login_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorizations" (
    "id" SERIAL NOT NULL,
    "module_id" INTEGER,
    "level_id" INTEGER,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "name" VARCHAR(50) NOT NULL,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "department_id" INTEGER,
    "approval_level" INTEGER,

    CONSTRAINT "authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "country_id" INTEGER,
    "currencies_id" INTEGER,
    "email" VARCHAR(30),
    "phone_no" VARCHAR(18),
    "city" VARCHAR(15),
    "street" TEXT,
    "zip_code" VARCHAR(6),
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "country_code" VARCHAR(5),
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(10) NOT NULL,
    "symbol" VARCHAR(2) NOT NULL,
    "currency_code" VARCHAR(5),
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" SERIAL NOT NULL,
    "country_id" INTEGER,
    "old_pk" INTEGER,
    "name" VARCHAR(50) NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overseas_offices" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(25) NOT NULL,
    "email_address" VARCHAR(40),
    "phone_no" VARCHAR(18),
    "currency_id" INTEGER,
    "country_id" INTEGER,
    "city" VARCHAR(15),
    "street" TEXT,
    "zip" VARCHAR(8),
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "overseas_offices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_terms" (
    "id" SERIAL NOT NULL,
    "term_id" INTEGER NOT NULL,
    "tenor" INTEGER NOT NULL,
    "term_description" TEXT NOT NULL,
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(5) NOT NULL,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banks" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "country_id" INTEGER,
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabrics" (
    "id" SERIAL NOT NULL,
    "product_type_id" INTEGER,
    "old_product_type_id" INTEGER,
    "description" VARCHAR(255),
    "composition" TEXT,
    "name" TEXT,
    "value" INTEGER,
    "unit" VARCHAR(10),
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fabrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(25) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "product_type_id" INTEGER,
    "old_product_type_id" INTEGER,
    "is_active" BOOLEAN DEFAULT true,
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banks_history" (
    "id" SERIAL NOT NULL,
    "bank_id" INTEGER,
    "name" VARCHAR(100),
    "country_id" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banks_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies_history" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER,
    "name" VARCHAR(30),
    "country_id" INTEGER,
    "currencies_id" INTEGER,
    "email" VARCHAR(30),
    "phone_no" VARCHAR(18),
    "city" VARCHAR(15),
    "street" TEXT,
    "zip_code" VARCHAR(6),
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries_history" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(20),
    "country_code" VARCHAR(5),
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "country_id" INTEGER,

    CONSTRAINT "countries_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies_history" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(10),
    "symbol" VARCHAR(10),
    "currency_code" VARCHAR(5),
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "currency_id" INTEGER,

    CONSTRAINT "currencies_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations_history" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50),
    "country_id" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "destination_id" INTEGER,

    CONSTRAINT "destinations_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabrics_history" (
    "id" SERIAL NOT NULL,
    "fabrics_id" INTEGER,
    "name" TEXT,
    "product_type_id" INTEGER,
    "description" VARCHAR(255),
    "composition" TEXT,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "value" INTEGER,
    "unit" VARCHAR(10),

    CONSTRAINT "fabrics_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overseas_office_history" (
    "id" SERIAL NOT NULL,
    "overseas_office_id" INTEGER,
    "name" VARCHAR(25),
    "email_address" VARCHAR(40),
    "phone_no" VARCHAR(18),
    "currency_id" INTEGER,
    "country_id" INTEGER,
    "city" VARCHAR(15),
    "zip" VARCHAR(8),
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "street" TEXT,

    CONSTRAINT "overseas_office_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_terms_history" (
    "id" SERIAL NOT NULL,
    "payment_terms_id" INTEGER,
    "term_id" INTEGER,
    "tenor" INTEGER,
    "term_description" TEXT,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_terms_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_types_history" (
    "id" SERIAL NOT NULL,
    "product_types_id" INTEGER,
    "name" VARCHAR(25),
    "is_active" BOOLEAN,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_types_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products_history" (
    "id" SERIAL NOT NULL,
    "products_id" INTEGER,
    "name" VARCHAR(255),
    "product_types_id" INTEGER,
    "is_active" BOOLEAN,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "color_history" (
    "id" SERIAL NOT NULL,
    "color_id" INTEGER,
    "name" VARCHAR(50),
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "color_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colors" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(75) NOT NULL,
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courier_history" (
    "id" SERIAL NOT NULL,
    "courier_id" INTEGER,
    "name" VARCHAR(50) NOT NULL,
    "address" TEXT,
    "email" VARCHAR(50),
    "contact_person" VARCHAR(30),
    "phone_no" VARCHAR(18),
    "website" VARCHAR(25),
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courier_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "couriers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "address" TEXT,
    "email" VARCHAR(50),
    "contact_person" VARCHAR(30),
    "phone_no" VARCHAR(18),
    "website" VARCHAR(25),
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "couriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_suppliers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "address" TEXT,
    "contact_person" VARCHAR(30),
    "phone_no" VARCHAR(18),
    "website" VARCHAR(30),
    "old_pk" INTEGER,
    "email" VARCHAR(50),
    "country_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fabric_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_suppliers_history" (
    "id" SERIAL NOT NULL,
    "fabric_suppliers_id" INTEGER,
    "name" VARCHAR(50),
    "address" TEXT,
    "contact_person" VARCHAR(30),
    "phone_no" VARCHAR(18),
    "website" VARCHAR(30),
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "country_id" INTEGER,
    "email" VARCHAR(50),

    CONSTRAINT "fabric_suppliers_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "office_address" TEXT,
    "factory_address" TEXT,
    "email" VARCHAR(50),
    "contact_person" VARCHAR(30),
    "prefix" VARCHAR(10),
    "phone_no" VARCHAR(75),
    "website" VARCHAR(25),
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_history" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "office_address" TEXT,
    "factory_address" TEXT,
    "email" VARCHAR(50),
    "contact_person" VARCHAR(30),
    "prefix" VARCHAR(10),
    "phone_no" VARCHAR(18),
    "website" VARCHAR(25),
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "factory_id" INTEGER,

    CONSTRAINT "factory_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fob_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "added_by" UUID,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,

    CONSTRAINT "fob_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freight_term" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "added_by" UUID,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,

    CONSTRAINT "freight_term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_actions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "department_id" INTEGER NOT NULL,
    "lead_time" INTEGER NOT NULL,
    "alert_before" INTEGER,
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tna_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_actions_history" (
    "id" SERIAL NOT NULL,
    "tna_action_id" INTEGER,
    "name" VARCHAR(50) NOT NULL,
    "department_id" INTEGER NOT NULL,
    "lead_time" INTEGER NOT NULL,
    "alert_before" INTEGER,
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tna_actions_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_bank" (
    "id" SERIAL NOT NULL,
    "factory_id" INTEGER,
    "bank_id" INTEGER,
    "old_factory_id" INTEGER,
    "old_bank_id" INTEGER,
    "branch_name" VARCHAR(100),
    "account_no" VARCHAR(20),
    "account_name" VARCHAR(100),
    "address" TEXT,
    "swift_code" VARCHAR(15),
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factory_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_bank_history" (
    "id" SERIAL NOT NULL,
    "factory_bank_id" INTEGER,
    "factory_id" INTEGER,
    "bank_id" INTEGER,
    "branch_name" VARCHAR(100),
    "account_no" VARCHAR(20),
    "account_name" VARCHAR(100),
    "address" TEXT,
    "swift_code" VARCHAR(15),
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factory_bank_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_additional_clause" (
    "id" SERIAL NOT NULL,
    "buyer_id" INTEGER,
    "old_buyers_id" INTEGER,
    "sl_no" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,

    CONSTRAINT "buyer_additional_clause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_additional_clause_history" (
    "id" SERIAL NOT NULL,
    "buyer_additional_clause_id" INTEGER,
    "buyer_id" INTEGER,
    "sl_no" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_additional_clause_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_banks" (
    "id" SERIAL NOT NULL,
    "buyer_id" INTEGER,
    "old_buyers_id" INTEGER,
    "bank_id" INTEGER,
    "old_bank_id" INTEGER,
    "branch_name" VARCHAR(255),
    "account_no" VARCHAR(30),
    "account_name" VARCHAR(255),
    "swift" VARCHAR(20),
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT,
    "old_pk" INTEGER,

    CONSTRAINT "buyer_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_banks_history" (
    "id" SERIAL NOT NULL,
    "buyer_banks_id" INTEGER,
    "bank_id" INTEGER,
    "buyer_id" INTEGER,
    "branch_name" VARCHAR(255),
    "account_no" VARCHAR(30),
    "account_name" VARCHAR(255),
    "swift" VARCHAR(20),
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT,

    CONSTRAINT "buyer_banks_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_consignee" (
    "id" SERIAL NOT NULL,
    "old_pk" INTEGER,
    "sl_no" INTEGER NOT NULL,
    "buyer_id" INTEGER,
    "old_buyer_id" INTEGER,
    "consignee_name" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_consignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_consignee_history" (
    "id" SERIAL NOT NULL,
    "buyer_consignee_id" INTEGER,
    "sl_no" INTEGER NOT NULL,
    "buyer_id" INTEGER,
    "consignee_name" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_consignee_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_destinations" (
    "id" SERIAL NOT NULL,
    "buyer_id" INTEGER,
    "old_buyers_id" INTEGER,
    "destinations_id" INTEGER,
    "old_destinations_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_destinations_history" (
    "id" SERIAL NOT NULL,
    "buyer_destinations_id" INTEGER,
    "buyer_id" INTEGER,
    "destinations_id" INTEGER,
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_destinations_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_late_policies" (
    "id" SERIAL NOT NULL,
    "buyer_id" INTEGER,
    "old_buyers_id" INTEGER,
    "sl_no" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,

    CONSTRAINT "buyer_late_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_late_policies_history" (
    "id" SERIAL NOT NULL,
    "buyer_late_policies_id" INTEGER,
    "buyer_id" INTEGER,
    "sl_no" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_late_policies_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_payment_term" (
    "id" SERIAL NOT NULL,
    "payment_term_id" INTEGER,
    "old_payment_term_id" INTEGER,
    "buyer_id" INTEGER,
    "old_buyers_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_payment_term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_payment_term_history" (
    "id" SERIAL NOT NULL,
    "buyer_payment_term_id" INTEGER,
    "payment_term_id" INTEGER,
    "buyer_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_payment_term_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyers" (
    "id" SERIAL NOT NULL,
    "old_pk" INTEGER,
    "buyer_name" VARCHAR(255) NOT NULL,
    "short_name" VARCHAR(50) NOT NULL,
    "prefix" VARCHAR(50) NOT NULL,
    "address" TEXT,
    "contact_person" VARCHAR(50),
    "phone_no" VARCHAR(50),
    "email" VARCHAR(50),
    "old_country_id" INTEGER,
    "country_id" INTEGER,
    "website" VARCHAR(50),
    "old_overseas_office_id" INTEGER,
    "overseas_office_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyers_history" (
    "id" SERIAL NOT NULL,
    "buyers_id" INTEGER,
    "buyer_name" VARCHAR(255) NOT NULL,
    "short_name" VARCHAR(50) NOT NULL,
    "prefix" VARCHAR(50) NOT NULL,
    "address" TEXT,
    "contact_person" VARCHAR(50),
    "phone_no" VARCHAR(50),
    "email" VARCHAR(50),
    "country_id" INTEGER,
    "website" VARCHAR(50),
    "overseas_office_id" INTEGER,
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyers_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_brands" (
    "id" SERIAL NOT NULL,
    "buyer_id" INTEGER,
    "old_buyer_id" INTEGER,
    "brand" VARCHAR(40) NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,

    CONSTRAINT "buyer_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_brands_history" (
    "id" SERIAL NOT NULL,
    "buyer_id" INTEGER,
    "buyer_brand_id" INTEGER,
    "brand" VARCHAR(40),
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_brands_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_department_sizes" (
    "id" SERIAL NOT NULL,
    "buyer_department_id" INTEGER,
    "old_buyer_department_id" INTEGER,
    "size" VARCHAR(40) NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,

    CONSTRAINT "buyer_department_sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_department_sizes_history" (
    "id" SERIAL NOT NULL,
    "buyer_department_id" INTEGER,
    "buyer_department_sizes_id" INTEGER,
    "size" VARCHAR(40) NOT NULL,
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_department_sizes_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_departments" (
    "id" SERIAL NOT NULL,
    "buyer_brand_id" INTEGER,
    "old_buyer_brand_id" INTEGER,
    "department" VARCHAR(40) NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,

    CONSTRAINT "buyer_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_departments_history" (
    "id" SERIAL NOT NULL,
    "buyer_brand_id" INTEGER,
    "buyer_department_id" INTEGER,
    "department" VARCHAR(40) NOT NULL,
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_departments_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" SERIAL NOT NULL,
    "old_pk" INTEGER,
    "buyer_id" INTEGER,
    "old_buyer_id" INTEGER,
    "season_name" VARCHAR(55) NOT NULL,
    "active_status" BOOLEAN DEFAULT true,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons_history" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER,
    "buyer_id" INTEGER,
    "season_name" VARCHAR(55) NOT NULL,
    "active_status" BOOLEAN,
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seasons_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER,
    "old_team_id" INTEGER,
    "user_id" UUID,
    "old_user_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members_history" (
    "id" SERIAL NOT NULL,
    "team_member_id" INTEGER,
    "team_id" INTEGER,
    "user_id" UUID,
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "old_pk" INTEGER,
    "buyer_id" INTEGER,
    "old_buyer_id" INTEGER,
    "team_name" VARCHAR(55) NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams_history" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER,
    "buyer_id" INTEGER,
    "team_name" VARCHAR(55) NOT NULL,
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_banks" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER,
    "bank_id" INTEGER,
    "old_company_id" INTEGER,
    "old_bank_id" INTEGER,
    "branch_name" VARCHAR(255),
    "account_no" VARCHAR(30),
    "account_name" VARCHAR(255),
    "swift" VARCHAR(20),
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT,
    "old_pk" INTEGER,

    CONSTRAINT "company_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_banks_history" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER,
    "bank_id" INTEGER,
    "branch_name" VARCHAR(255),
    "account_no" VARCHAR(30),
    "account_name" VARCHAR(255),
    "swift" VARCHAR(20),
    "address" TEXT,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "company_bank_id" INTEGER,

    CONSTRAINT "company_banks_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handover_dates" (
    "id" SERIAL NOT NULL,
    "buyer_id" INTEGER NOT NULL,
    "buffer" INTEGER NOT NULL DEFAULT 7,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handover_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handover_dates_history" (
    "id" SERIAL NOT NULL,
    "handover_date_id" INTEGER,
    "buyer_id" INTEGER,
    "buffer" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handover_dates_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ref_no" VARCHAR(50) NOT NULL,
    "buyer_id" INTEGER NOT NULL,
    "old_buyer_id" INTEGER,
    "season_id" INTEGER NOT NULL,
    "old_season_id" INTEGER,
    "fob_type_id" INTEGER,
    "old_fob_type" INTEGER,
    "order_date" DATE NOT NULL,
    "team_id" INTEGER NOT NULL,
    "old_team_id" INTEGER,
    "brand_id" INTEGER NOT NULL,
    "old_brand_id" INTEGER,
    "department_id" INTEGER NOT NULL,
    "old_department_id" INTEGER,
    "secondary_currency_id" INTEGER,
    "old_secondary_currency_id" INTEGER,
    "factory_id" INTEGER NOT NULL,
    "old_factory_id" INTEGER,
    "currency_rate" DOUBLE PRECISION DEFAULT 1,
    "status" "order_status" DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,

    CONSTRAINT "buyer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_orders_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "buyer_order_id" UUID,
    "ref_no" VARCHAR(50),
    "buyer_id" INTEGER,
    "season_id" INTEGER,
    "fob_type_id" INTEGER,
    "order_date" DATE,
    "team_id" INTEGER,
    "brand_id" INTEGER,
    "department_id" INTEGER,
    "secondary_currency_id" INTEGER,
    "factory_id" INTEGER,
    "currency_rate" DOUBLE PRECISION,
    "status" "order_status",
    "remarks" TEXT,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_orders_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_styles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "old_pk" INTEGER,
    "order_id" UUID NOT NULL,
    "old_order_id" INTEGER,
    "product_type_id" INTEGER NOT NULL,
    "old_product_type_id" INTEGER,
    "product_id" INTEGER NOT NULL,
    "old_product_id" INTEGER,
    "style" VARCHAR(50) NOT NULL,
    "fabric_id" INTEGER NOT NULL,
    "old_fabric_id" INTEGER,
    "supplier_id" INTEGER NOT NULL,
    "old_supplier_id" INTEGER,
    "order_quantity" INTEGER NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "serial" INTEGER,
    "photo_url" TEXT,
    "file_size" INTEGER,

    CONSTRAINT "order_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_styles_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_style_id" UUID,
    "order_id" UUID,
    "product_type_id" INTEGER,
    "product_id" INTEGER,
    "style" VARCHAR(50),
    "fabric_id" INTEGER,
    "supplier_id" INTEGER,
    "order_quantity" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "serial" INTEGER,

    CONSTRAINT "order_styles_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "old_pk" INTEGER,
    "serial" INTEGER,
    "order_style_id" UUID NOT NULL,
    "old_order_style_id" INTEGER,
    "buyer_po" VARCHAR(50) NOT NULL,
    "etd_date" DATE NOT NULL,
    "handover_date" DATE NOT NULL,
    "destination_id" INTEGER NOT NULL,
    "old_destination_id" INTEGER,
    "shipment_mode" "shipment_modes",
    "payment_term_id" INTEGER NOT NULL,
    "old_payment_term_id" INTEGER,
    "size_id" INTEGER NOT NULL,
    "old_size_id" INTEGER,
    "fob_rate" DOUBLE PRECISION NOT NULL,
    "cancel_status" BOOLEAN DEFAULT false,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shipment_detail_id" UUID,
    "serial" INTEGER,
    "order_style_id" UUID,
    "buyer_po" VARCHAR(50) NOT NULL,
    "etd_date" DATE NOT NULL,
    "handover" DATE NOT NULL,
    "destination_id" INTEGER,
    "shipment_mode" "shipment_modes",
    "payment_term_id" INTEGER,
    "size_id" INTEGER,
    "fob_rate" DOUBLE PRECISION NOT NULL,
    "cancel_status" BOOLEAN,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "old_order_id" INTEGER,
    "factory_order_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "remarks" TEXT,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "approval_status" INTEGER,
    "old_pk" INTEGER,
    "currency_id" INTEGER,
    "currency_rate" DOUBLE PRECISION DEFAULT 1,

    CONSTRAINT "factory_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_orders_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factory_order_id" UUID,
    "factory_order_date" DATE,
    "remarks" TEXT,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "order_id" UUID,
    "approval_status" INTEGER,
    "currency_id" INTEGER,
    "currency_rate" DOUBLE PRECISION,

    CONSTRAINT "factory_orders_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_shipment_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factory_order_id" UUID NOT NULL,
    "shipment_detail_id" UUID NOT NULL,
    "exfactory_date" DATE NOT NULL,
    "factory_rate" DOUBLE PRECISION,
    "transfer_rate" DOUBLE PRECISION,
    "status" "order_status",
    "old_factory_order_id" INTEGER,
    "old_shipment_details_id" INTEGER,
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factory_shipment_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_shipment_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factory_shipment_details" UUID,
    "shipment_detail_id" UUID,
    "exfactory_date" DATE,
    "factory_rate" DOUBLE PRECISION,
    "transfer_rate" DOUBLE PRECISION,
    "status" "order_status",
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "factory_order_id" UUID,

    CONSTRAINT "factory_shipment_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_item_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shipment_detail_id" UUID NOT NULL,
    "old_shipment_details_id" INTEGER,
    "color_id" INTEGER NOT NULL,
    "old_color_id" INTEGER,
    "quantity" INTEGER NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,

    CONSTRAINT "shipment_item_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_item_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shipment_item_details_id" UUID,
    "shipment_detail_id" UUID,
    "color_id" INTEGER,
    "quantity" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_item_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_order_ref_metadata" (
    "id" SERIAL NOT NULL,
    "year" INTEGER,
    "last_serial" INTEGER,

    CONSTRAINT "buyer_order_ref_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_plan_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tna_plan_id" UUID,
    "shipment_id" UUID,
    "old_tna_plan_id" INTEGER,
    "old_shipment_id" INTEGER,
    "revise_date" DATE,
    "actual_date" DATE,
    "action_complete" BOOLEAN,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_tna_template_action_id" INTEGER,
    "tna_template_action_id" UUID,

    CONSTRAINT "tna_plan_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_plan_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tna_plan_details_id" UUID,
    "tna_plan_id" UUID,
    "shipment_id" UUID,
    "revise_date" DATE,
    "actual_date" DATE,
    "action_complete" BOOLEAN,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "tna_template_action_id" UUID,

    CONSTRAINT "tna_plan_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_plan_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tna_plan_id" UUID,
    "tna_template_id" UUID,
    "style_id" UUID,
    "plan_date" DATE,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "order_id" UUID,

    CONSTRAINT "table_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "tna_template_id" UUID NOT NULL,
    "style_id" UUID NOT NULL,
    "plan_date" DATE DEFAULT CURRENT_DATE,
    "old_order_id" INTEGER,
    "old_tna_template_id" INTEGER,
    "old_style" VARCHAR(50),
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,

    CONSTRAINT "tna_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_template_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tna_template_id" UUID NOT NULL,
    "old_tna_template_id" INTEGER,
    "alert_before" INTEGER NOT NULL,
    "days" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_tna_action_id" INTEGER,
    "tna_action_id" INTEGER NOT NULL,
    "old_pk" INTEGER,
    "serial" INTEGER,

    CONSTRAINT "tna_template_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_template_actions_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "responsible_level_id" INTEGER,
    "responsible_person_id" UUID,
    "alert_before" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "serial" INTEGER,
    "tna_template_id" UUID,
    "tna_action_id" INTEGER,
    "days" INTEGER,
    "tna_template_action_id" UUID,

    CONSTRAINT "tna_template_actions_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "old_pk" INTEGER,
    "template_name" TEXT NOT NULL,
    "buyer_id" INTEGER NOT NULL,
    "old_buyer_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "team_id" INTEGER NOT NULL,
    "old_team_id" INTEGER,

    CONSTRAINT "tna_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_templates_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tna_template_id" UUID,
    "template_name" TEXT NOT NULL,
    "buyer_id" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "team_id" INTEGER,

    CONSTRAINT "tna_templates_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_base_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "buyer_id" INTEGER NOT NULL,
    "action_id" INTEGER NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tna_base_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_base_actions_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tna_base_action_id" UUID,
    "buyer_id" INTEGER,
    "action_id" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tna_base_actions_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_distribution_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commission_distribution_details_id" UUID,
    "shipment_details_id" UUID,
    "dhaka_commission_percentage" DOUBLE PRECISION NOT NULL,
    "overseas_commission_percentage" DOUBLE PRECISION,
    "others_commission_percentage" DOUBLE PRECISION,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_distribution_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_distribution_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commission_distribution_id" UUID,
    "order_id" UUID,
    "plan_date" DATE,
    "approval_status" BOOLEAN,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,

    CONSTRAINT "commission_distribution_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_distributions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "plan_date" DATE,
    "approval_status" BOOLEAN DEFAULT false,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,
    "old_order_id" INTEGER,
    "remarks" TEXT,

    CONSTRAINT "commission_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_distributions_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commission_distribution_id" UUID NOT NULL,
    "shipment_details_id" UUID NOT NULL,
    "dhaka_commission_percentage" DOUBLE PRECISION,
    "overseas_commission_percentage" DOUBLE PRECISION,
    "others_commission_percentage" DOUBLE PRECISION,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,
    "old_shipment_id" INTEGER,
    "old_commission_distribution_id" INTEGER,

    CONSTRAINT "commission_distributions_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fob_type_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fob_type_id" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(50),

    CONSTRAINT "fob_type_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freight_term_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "freight_term_id" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(50),

    CONSTRAINT "freight_term_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_contract_amendment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "amendment_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "amendment_no" INTEGER,
    "remarks" TEXT,
    "old_pk" INTEGER,
    "sales_contract_id" UUID NOT NULL,
    "old_sales_contract_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_contract_amendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_contract_amendment_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sales_contract_amendment_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "added_at" DATE DEFAULT CURRENT_DATE,
    "old_sales_contract_amendment_id" INTEGER,
    "old_order_id" INTEGER,

    CONSTRAINT "sales_contract_amendment_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_contract_amendment_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sales_contract_amendment_details" UUID,
    "sales_contract_amendment_id" UUID,
    "order_id" UUID,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_contract_amendment_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_contract_amendment_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sales_contract_amendment_id" UUID,
    "amendment_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "amendment_no" INTEGER,
    "remarks" TEXT,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "sales_contract_id" UUID,

    CONSTRAINT "sales_contract_amendment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_contract_contact_person" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "contact_number" VARCHAR(50),
    "pabx" VARCHAR(50),
    "ext" INTEGER,
    "email" VARCHAR(50),
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_contract_contact_person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_contract_contact_person_history" (
    "id" SERIAL NOT NULL,
    "sales_contract_contact_person_id" INTEGER,
    "name" VARCHAR(50) NOT NULL,
    "contact_number" VARCHAR(50),
    "pabx" VARCHAR(50),
    "ext" INTEGER,
    "email" VARCHAR(50),
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_contract_contact_person_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_contracts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "buyer_id" INTEGER NOT NULL,
    "old_buyer_id" INTEGER,
    "factory_id" INTEGER NOT NULL,
    "old_factory_id" INTEGER,
    "sales_contract_date" DATE NOT NULL,
    "sales_contract_no" VARCHAR(50) NOT NULL,
    "old_currency_id" INTEGER,
    "buyer_bank_id" INTEGER NOT NULL,
    "old_buyer_bank_id" INTEGER,
    "supplier_bank_id" INTEGER NOT NULL,
    "old_supplier_bank_id" INTEGER,
    "rdl_bank_id" INTEGER NOT NULL,
    "old_rdl_bank_id" INTEGER,
    "negotiation_bank_id" INTEGER NOT NULL,
    "old_negotiation_bank_id" INTEGER,
    "partial_shipment" BOOLEAN DEFAULT true,
    "port_of_loading_id" INTEGER,
    "old_port_of_loading_id" INTEGER,
    "freight_term_id" INTEGER,
    "old_freight_term_id" INTEGER,
    "approval_status" SMALLINT DEFAULT 0,
    "approved_once" BOOLEAN,
    "contact_person_id" INTEGER,
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "company_id" INTEGER,

    CONSTRAINT "sales_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_contracts_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sales_contracts_id" UUID,
    "buyer_id" INTEGER,
    "factory_id" INTEGER,
    "sales_contract_date" DATE NOT NULL,
    "sales_contract_no" VARCHAR(50) NOT NULL,
    "currency_id" INTEGER,
    "buyer_bank_id" INTEGER,
    "supplier_bank_id" INTEGER,
    "rdl_bank_id" INTEGER,
    "negotiation_bank_id" INTEGER,
    "partial_shipment" BOOLEAN DEFAULT true,
    "port_of_loading_id" INTEGER,
    "freight_term_id" INTEGER,
    "approval_status" SMALLINT,
    "approved_once" BOOLEAN,
    "contact_person_id" INTEGER,
    "action_by" UUID,
    "action_type" "actions",
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "company_id" INTEGER,

    CONSTRAINT "sales_contracts_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_contract_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sales_contract_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,
    "old_sales_contract_id" INTEGER,
    "old_order_id" INTEGER,

    CONSTRAINT "sales_contract_contact_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_contract_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sales_contract_details_id" UUID,
    "sales_contract_id" UUID,
    "order_id" UUID,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_contract_contact_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_contract_consignees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sales_contract_id" UUID,
    "consignee_id" INTEGER,
    "old_sales_contract_id" INTEGER,
    "old_consignee_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_contract_consignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_contract_consignees_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sales_contract_consignees_id" UUID,
    "sales_contract_id" UUID,
    "consignee_id" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_contract_consignees_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_contract_no_metadata" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "year" INTEGER NOT NULL,
    "last_serial" INTEGER,

    CONSTRAINT "sales_contract_no_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_contract_amendment_no_metadata" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sales_contract_id" UUID,
    "amendment_no" INTEGER DEFAULT 0,
    "old_sales_contract_id" INTEGER,

    CONSTRAINT "sales_contract_amendment_no_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_master" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_no" VARCHAR(50) NOT NULL,
    "lc_open_date" DATE NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lc_value" DOUBLE PRECISION NOT NULL,
    "buyer_bank_id" INTEGER NOT NULL,
    "lc_received_date" DATE NOT NULL,
    "lc_expire_date" DATE,
    "currency_id" INTEGER NOT NULL,
    "latest_shipment_date" DATE,
    "rdl_bank_id" INTEGER NOT NULL,
    "remarks" TEXT,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "status" BOOLEAN,
    "old_pk" INTEGER,
    "old_buyer_bank_id" INTEGER,
    "old_rdl_bank_id" INTEGER,
    "old_currency_id" INTEGER,
    "buyer_id" INTEGER,
    "old_buyer_id" INTEGER,
    "company_id" INTEGER,
    "is_authorized" BOOLEAN DEFAULT false,
    "approved_once" BOOLEAN DEFAULT false,

    CONSTRAINT "lc_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_master_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_master_id" UUID,
    "lc_no" VARCHAR(50),
    "lc_open_date" DATE,
    "quantity" INTEGER,
    "lc_value" DOUBLE PRECISION,
    "buyer_bank_id" INTEGER,
    "lc_received_date" DATE,
    "lc_expire_date" DATE,
    "currency_id" INTEGER,
    "latest_shipment_date" DATE,
    "rdl_bank_id" INTEGER,
    "remarks" TEXT,
    "status" BOOLEAN,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "company_id" INTEGER,
    "is_authorized" BOOLEAN,

    CONSTRAINT "lc_master_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID,
    "dm_pi_no" VARCHAR(30),
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,
    "lc_master_id" UUID,
    "old_orders_id" INTEGER,
    "old_lc_master_id" INTEGER,

    CONSTRAINT "lc_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_orders_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_orders_id" UUID,
    "order_id" UUID,
    "dm_pi_no" VARCHAR(30),
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "lc_master_id" UUID,

    CONSTRAINT "lc_orders_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_shipments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_order_id" UUID,
    "shipment_details_id" UUID,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,
    "old_shipment_details_id" INTEGER,
    "lc_master_id" UUID,
    "old_lc_master_id" INTEGER,
    "old_order_id" INTEGER,
    "order_id" UUID,

    CONSTRAINT "lc_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_shipments_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_shipments_id" UUID,
    "lc_order_id" UUID,
    "shipment_details_id" UUID,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lc_shipments_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exfactory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "term_id" INTEGER,
    "factory_id" INTEGER,
    "buyer_id" INTEGER,
    "exfactory_date" DATE,
    "exfactory_no" VARCHAR(50),
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_term_id" INTEGER,
    "old_factory_id" INTEGER,
    "old_buyer_id" INTEGER,
    "old_pk" INTEGER,
    "is_authorized" BOOLEAN DEFAULT false,
    "remarks" TEXT,

    CONSTRAINT "exfactory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exfactory_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exfactory_id" UUID,
    "term_id" INTEGER,
    "factory_id" INTEGER,
    "buyer_id" INTEGER,
    "exfactory_date" DATE,
    "exfactory_no" VARCHAR(50),
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exfactory_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exfactory_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exfactory_id" UUID,
    "order_id" UUID,
    "old_exfactory_id" INTEGER,
    "old_order_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,

    CONSTRAINT "exfactory_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exfactory_orders_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exfactory_id" UUID,
    "order_id" UUID,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exfactory_orders_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exfactory_shipments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exfactory_orders_id" UUID,
    "shipment_details_id" UUID,
    "delivery_quantity" INTEGER,
    "old_factory_shipment_details_id" INTEGER,
    "old_pk" INTEGER,
    "old_exfactory_shipment_details_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "po_close" BOOLEAN DEFAULT false,
    "style_close" BOOLEAN DEFAULT false,
    "changed_shipment_mode" "shipment_modes",

    CONSTRAINT "exfactory_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exfactory_shipments_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exfactory_shipment_id" UUID,
    "exfactory_orders_id" UUID,
    "shipment_details_id" UUID,
    "delivery_quantity" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "po_close" BOOLEAN DEFAULT false,
    "style_close" BOOLEAN DEFAULT false,
    "changed_shipment_mode" "shipment_modes",

    CONSTRAINT "exfactory_shipments_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exfactory_metadata" (
    "id" SERIAL NOT NULL,
    "last_ref" INTEGER,
    "year" INTEGER,

    CONSTRAINT "exfactory_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_amendment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_id" UUID,
    "amendment_no" INTEGER DEFAULT 0,
    "amend_value" DOUBLE PRECISION,
    "amend_quantity" INTEGER,
    "remarks" TEXT,
    "old_lc_amendment_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "amendment_date" DATE,
    "old_lc_id" INTEGER,
    "old_pk" INTEGER,

    CONSTRAINT "lc_amendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_amendment_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_amendment_id" UUID,
    "lc_id" UUID,
    "amendment_no" INTEGER DEFAULT 0,
    "amend_value" DOUBLE PRECISION,
    "amend_quantity" INTEGER,
    "remarks" TEXT,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lc_amendment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_amendment_metadata" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_id" UUID,
    "amendment_no" INTEGER DEFAULT 0,
    "old_lc_id" INTEGER,

    CONSTRAINT "lc_amendment_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_amendment_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_amendment_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "dm_pi_no" VARCHAR(50),
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,
    "old_lc_amendment_id" INTEGER,
    "old_order_id" INTEGER,

    CONSTRAINT "lc_amendment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_amendment_orders_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_amendment_orders_id" UUID,
    "lc_amendment_id" UUID,
    "order_id" UUID,
    "dm_pi_no" VARCHAR(50),
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lc_amendment_orders_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_amendment_shipments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_amendment_id" UUID,
    "lc_amendment_order_id" UUID,
    "shipment_details_id" UUID,
    "order_id" UUID,
    "dm_pi_no" VARCHAR(50),
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,
    "old_order_id" INTEGER,
    "old_lc_amendment_id" INTEGER,
    "old_shipment_details_id" INTEGER,

    CONSTRAINT "lc_amendment_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_amendment_shipments_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_amendment_shipments_id" UUID,
    "lc_amendment_id" UUID,
    "order_id" UUID,
    "dm_pi_no" UUID,
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "shipment_details_id" UUID,
    "action_type" "actions",

    CONSTRAINT "lc_amendment_shipments_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_tolerance_level" (
    "id" SERIAL NOT NULL,
    "buyer_id" INTEGER,
    "tolerance_level" DOUBLE PRECISION DEFAULT 10,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_tolerance_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_tolerance_level_history" (
    "id" SERIAL NOT NULL,
    "shipment_tolerance_level_id" INTEGER,
    "buyer_id" INTEGER,
    "tolerance_level" DOUBLE PRECISION,
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "action_type" "actions",

    CONSTRAINT "shipment_tolerance_level_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_transfer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_transfer_date" DATE NOT NULL,
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "lc_master_id" UUID NOT NULL,
    "old_lc_header_id" INTEGER,
    "remarks" TEXT,

    CONSTRAINT "lc_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_transfer_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_transfer_id" UUID NOT NULL,
    "lc_transfer_quantity" INTEGER NOT NULL,
    "lc_transfer_value" DOUBLE PRECISION NOT NULL,
    "lc_transfer_date" DATE,
    "factory_id" INTEGER NOT NULL,
    "sales_contract_id" UUID NOT NULL,
    "old_pk" INTEGER,
    "old_factory_id" INTEGER,
    "old_sales_contract_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_lc_transfer_id" INTEGER,

    CONSTRAINT "lc_transfer_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_transfer_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_transfer_details_id" UUID,
    "lc_transfer_id" UUID,
    "lc_transfer_quantity" INTEGER,
    "lc_transfer_value" DOUBLE PRECISION,
    "lc_transfer_date" DATE,
    "factory_id" INTEGER,
    "sales_contract_id" UUID,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lc_transfer_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_transfer_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lc_transfer_id" UUID,
    "lc_transfer_date" DATE,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "lc_master_id" UUID,

    CONSTRAINT "lc_transfer_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_invoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factory_id" INTEGER NOT NULL,
    "old_factory_id" INTEGER,
    "invoice_no" VARCHAR(50) NOT NULL,
    "invoice_date" DATE DEFAULT CURRENT_DATE,
    "term_id" INTEGER NOT NULL,
    "sales_contract_id" UUID,
    "old_sales_contract_id" INTEGER,
    "lc_id" UUID,
    "old_lc_id" INTEGER,
    "remarks" TEXT,
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "discount" DOUBLE PRECISION,
    "buyer_id" INTEGER,
    "old_buyer_id" INTEGER,
    "shipment_mode" "shipment_modes",
    "port_of_loading" INTEGER,
    "freight_term_id" INTEGER,

    CONSTRAINT "factory_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_invoice_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factory_invoice_id" UUID NOT NULL,
    "old_factory_invoice_id" INTEGER,
    "exfactory_shipment_id" UUID NOT NULL,
    "old_exfactory_shipment_id" INTEGER,
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factory_invoice_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_invoice_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factory_invoice_details_id" UUID,
    "factory_invoice_id" UUID,
    "exfactory_shipment_id" UUID,
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "action_type" "actions",
    "action_by" UUID,

    CONSTRAINT "factory_invoice_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_invoice_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factory_invoice_id" UUID,
    "factory_id" INTEGER,
    "invoice_no" VARCHAR(50),
    "invoice_date" DATE,
    "term_id" INTEGER,
    "sales_contract_id" UUID,
    "lc_id" UUID,
    "remarks" TEXT,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "discount" DOUBLE PRECISION,
    "buyer_id" INTEGER,
    "shipment_mode" "shipment_modes",
    "port_of_loading" INTEGER,
    "freight_term_id" INTEGER,

    CONSTRAINT "factory_invoice_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_invoice_consignee" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factory_invoice_id" UUID,
    "consignee_id" INTEGER,

    CONSTRAINT "factory_invoice_consignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_invoice_consignee_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factory_invoice_consignee_id" UUID,
    "factory_invoice_id" UUID,
    "consignee_id" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factory_invoice_consignee_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_invoice_notify_party" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factory_invoice_id" UUID,
    "notify_party_id" INTEGER,

    CONSTRAINT "factory_invoice_notify_party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_invoice_notify_party_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factory_invoice_notify_party_id" UUID,
    "factory_invoice_id" UUID,
    "notify_party_id" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factory_invoice_notify_party_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rdl_invoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "buyer_id" INTEGER NOT NULL,
    "term_id" INTEGER,
    "invoice_no" VARCHAR(50) NOT NULL,
    "invoice_date" DATE NOT NULL,
    "sales_contract_id" UUID,
    "lc_id" UUID,
    "invoice_type" BOOLEAN DEFAULT false,
    "pi_no" VARCHAR(50),
    "old_buyer_id" INTEGER,
    "old_sales_contract_id" INTEGER,
    "old_lc_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,
    "is_authorized" BOOLEAN DEFAULT false,
    "container_no" VARCHAR(100),
    "discount" DOUBLE PRECISION DEFAULT 0,
    "remarks" TEXT,
    "contact_no" VARCHAR(100),

    CONSTRAINT "rdl_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rdl_invoice_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rdl_invoice_id" UUID NOT NULL,
    "factory_invoice_id" UUID NOT NULL,
    "old_pk" INTEGER,
    "old_rdl_invoice_id" INTEGER,
    "old_factory_invoice_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "factory_id" INTEGER NOT NULL,
    "old_factory_id" INTEGER,

    CONSTRAINT "rdl_invoice_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rdl_invoice_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rdl_invoice_details" UUID,
    "rdl_invoice_id" UUID,
    "factory_invoice_id" UUID,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "factory_id" INTEGER,

    CONSTRAINT "rdl_invoice_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rdl_invoice_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rdl_invoice_id" UUID,
    "buyer_id" INTEGER,
    "term_id" INTEGER,
    "invoice_no" VARCHAR(50),
    "invoice_date" DATE,
    "sales_contract_id" UUID,
    "lc_id" UUID,
    "invoice_type" BOOLEAN,
    "pi_no" VARCHAR(50),
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "container_no" VARCHAR(100),
    "discount" DOUBLE PRECISION DEFAULT 0,
    "remarks" TEXT,
    "is_authorized" BOOLEAN,
    "contact_no" VARCHAR(100),

    CONSTRAINT "rdl_invoice_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rdl_invoice_shipment_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rdl_invoice_details_id" UUID,
    "shipment_details_id" UUID,
    "invoice_quantity" INTEGER,
    "old_pk" INTEGER,
    "old_rdl_invoice_details_id" INTEGER,
    "old_shipment_details_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "factory_invoice_details_id" UUID,
    "old_factory_invoice_details_id" INTEGER,

    CONSTRAINT "rdl_invoice_shipment_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ev_permission_history" (
    "id" SERIAL NOT NULL,
    "ev_permission_id" INTEGER,
    "buyer_id" INTEGER,
    "user_id" UUID,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ev_permission_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ev_permissions" (
    "id" SERIAL NOT NULL,
    "buyer_id" INTEGER,
    "user_id" UUID,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ev_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rdl_invoice_shipment_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rdl_invoice_details_id" UUID,
    "shipment_details_id" UUID,
    "invoice_quantity" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "factory_invoice_details_id" UUID,

    CONSTRAINT "rdl_invoice_shiment_details_histroy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_submission_factory_invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_submissions_details_id" UUID NOT NULL,
    "factory_invoice_id" UUID NOT NULL,
    "old_pk" INTEGER,
    "old_document_submission_details_id" INTEGER,
    "old_factory_invoice_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "factory_fdbc_no" VARCHAR(100),
    "rdl_invoice_details_id" UUID,

    CONSTRAINT "document_submission_factory_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_submission_factory_invoices_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_submission_factory_invoices_id" UUID,
    "document_submissions_details_id" UUID,
    "factory_invoice_id" UUID,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "factory_fdbc_no" VARCHAR(50),
    "rdl_invoice_details_id" UUID,

    CONSTRAINT "document_submission_factory_invoices_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "term_id" INTEGER NOT NULL,
    "buyer_id" INTEGER NOT NULL,
    "submission_date" DATE DEFAULT CURRENT_DATE,
    "fdbc_no" VARCHAR(100),
    "fdbc_value" DOUBLE PRECISION,
    "fdbc_date" DATE,
    "lc_id" UUID,
    "sales_contract_id" UUID,
    "awb_no" VARCHAR(100),
    "courier_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,
    "old_buyer_id" INTEGER,
    "old_lc_id" INTEGER,
    "old_sales_contract_id" INTEGER,
    "old_courier_id" INTEGER,
    "awb_date" DATE,
    "remarks" TEXT,

    CONSTRAINT "document_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_submissions_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_submissions_id" UUID NOT NULL,
    "rdl_invoice_id" UUID NOT NULL,
    "old_pk" INTEGER,
    "old_document_submission_id" INTEGER,
    "old_rdl_invoice_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "received_value" DOUBLE PRECISION,

    CONSTRAINT "document_submissions_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_submissions_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_submissions_details_id" UUID,
    "document_submissions_id" UUID,
    "rdl_invoice_id" UUID,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "received_value" INTEGER,

    CONSTRAINT "document_submissions_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_submissions_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_submission_id" UUID,
    "term_id" INTEGER,
    "buyer_id" INTEGER,
    "submission_date" DATE,
    "fdbc_no" VARCHAR(100),
    "fdbc_value" DOUBLE PRECISION,
    "fdbc_date" DATE,
    "lc_id" UUID,
    "sales_contract_id" UUID,
    "awb_no" VARCHAR(100),
    "courier_id" INTEGER,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "awb_date" DATE,
    "remarks" TEXT,

    CONSTRAINT "document_submissions_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_invoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "term_id" INTEGER NOT NULL,
    "buyer_id" INTEGER NOT NULL,
    "lc_id" UUID,
    "sales_contract_id" UUID,
    "document_submission_id" UUID,
    "rdl_invoice_id" UUID,
    "company_bank_id" INTEGER NOT NULL,
    "ref_no" VARCHAR(50) NOT NULL,
    "old_buyer_id" INTEGER,
    "old_lc_id" INTEGER,
    "old_sales_contract_id" INTEGER,
    "old_document_submission_id" INTEGER,
    "old_rdl_invoice_id" INTEGER,
    "old_bank_id" INTEGER,
    "old_pk" INTEGER,
    "invoice_date" DATE,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_invoice_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commission_invoice_id" UUID,
    "term_id" INTEGER,
    "buyer_id" INTEGER,
    "lc_id" UUID,
    "sales_contract_id" UUID,
    "document_submission_id" UUID,
    "rdl_invoice_id" UUID,
    "company_bank_id" INTEGER,
    "ref_no" VARCHAR(30),
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_invoice_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_invoice_metadata" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "buyer_id" INTEGER NOT NULL,
    "last_ref" INTEGER NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL,

    CONSTRAINT "rdl_invoice_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proceed_realization" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "term_id" INTEGER NOT NULL,
    "buyer_id" INTEGER NOT NULL,
    "document_submission_id" UUID NOT NULL,
    "bank_charge" DOUBLE PRECISION,
    "discount_charge" DOUBLE PRECISION,
    "document_charge" DOUBLE PRECISION,
    "old_pk" INTEGER,
    "old_buyer_id" INTEGER,
    "old_document_submission_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "realization_date" DATE,

    CONSTRAINT "procced_realization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proceed_realization_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "realization_id" UUID NOT NULL,
    "rdl_invoice_id" UUID NOT NULL,
    "realized_amount" DOUBLE PRECISION,
    "old_realization_id" INTEGER,
    "old_rdl_invoice_id" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_pk" INTEGER,

    CONSTRAINT "realization_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proceed_realization_details_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "realization_details_id" UUID,
    "realization_id" UUID,
    "rdl_invoice_id" UUID,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "realization_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proceed_realization_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "proceed_realization_id" UUID,
    "term_id" INTEGER,
    "buyer_id" INTEGER,
    "document_submission_id" UUID,
    "bank_charge" DOUBLE PRECISION,
    "discount_charge" DOUBLE PRECISION,
    "document_charge" DOUBLE PRECISION,
    "realized_amount" DOUBLE PRECISION,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "realization_date" DATE,

    CONSTRAINT "procced_realization_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_payment_header" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_submission_id" UUID,
    "old_document_submission_id" INTEGER,
    "remarks" TEXT,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factory_payment_header_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_submission_id" UUID,
    "factory_invoice_id" UUID,
    "paid_amount" DOUBLE PRECISION,
    "payment_date" DATE DEFAULT CURRENT_DATE,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "old_factory_invoice_id" INTEGER,
    "old_document_submission_id" INTEGER,
    "is_cross_paid" BOOLEAN DEFAULT false,
    "factory_payment_no" VARCHAR(100),

    CONSTRAINT "factory_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_payments_header_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_submission_id" UUID,
    "remarks" DATE,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factory_payments_header_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_payments_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factory_payments_id" UUID,
    "document_submission_id" UUID,
    "old_document_submission_id" INTEGER,
    "factory_invoice_id" UUID,
    "paid_amount" DOUBLE PRECISION,
    "payment_date" DATE,
    "action_type" "actions",
    "action_by" UUID,
    "action_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "factory_payment_no" VARCHAR(100),

    CONSTRAINT "factory_payments_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debit_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "term_id" INTEGER,
    "ref_no" VARCHAR(30) NOT NULL,
    "document_date" DATE DEFAULT CURRENT_DATE,
    "lc_master_id" UUID,
    "sales_contrct_id" UUID,
    "currency_rate" DOUBLE PRECISION,
    "old_buyer_id" INTEGER,
    "old_lc_sc_id" INTEGER,
    "old_pk" INTEGER,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unique_module_per_level_and_department" ON "level_permission"("module_id", "level_id", "department_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_name" ON "levels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_id" ON "users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_company_name" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_countries" ON "countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_currencies" ON "currencies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_destinations" ON "destinations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_overseas_office" ON "overseas_offices"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_payment_terms" ON "payment_terms"("term_id", "tenor", "term_description");

-- CreateIndex
CREATE UNIQUE INDEX "unique_banks" ON "banks"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_fabric" ON "fabrics"("name", "product_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_product_type" ON "product_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_products" ON "products"("name", "product_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_colors" ON "colors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_couriers" ON "couriers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_fabric_suppliers" ON "fabric_suppliers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_factories" ON "factories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_fob_types" ON "fob_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_freight_term" ON "freight_term"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_tna_actions" ON "tna_actions"("name", "department_id");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_destinations_buyer_id_destinations_id_key" ON "buyer_destinations"("buyer_id", "destinations_id");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_payment_term_buyer_id_payment_term_id_key" ON "buyer_payment_term"("buyer_id", "payment_term_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_buyer_names" ON "buyers"("buyer_name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_brand_per_buyer" ON "buyer_brands"("buyer_id", "brand");

-- CreateIndex
CREATE UNIQUE INDEX "unique_brand_per_buyer_const" ON "buyer_brands"("buyer_id", "brand");

-- CreateIndex
CREATE UNIQUE INDEX "unique_size_per_department" ON "buyer_department_sizes"("buyer_department_id", "size");

-- CreateIndex
CREATE UNIQUE INDEX "unique_size_set_per_department" ON "buyer_department_sizes"("buyer_department_id", "size");

-- CreateIndex
CREATE UNIQUE INDEX "unique_department_per_brand" ON "buyer_departments"("buyer_brand_id", "department");

-- CreateIndex
CREATE UNIQUE INDEX "unique_department_per_brand_const" ON "buyer_departments"("buyer_brand_id", "department");

-- CreateIndex
CREATE UNIQUE INDEX "unique_seasons" ON "seasons"("season_name", "buyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_team_member_constraint" ON "team_members"("team_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_buyer_ids_in_handover_dates" ON "handover_dates"("buyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_orders_ref_no_key" ON "buyer_orders"("ref_no");

-- CreateIndex
CREATE UNIQUE INDEX "unique_buyer_order_id" ON "factory_orders"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_order_ref_metadata_year_key" ON "buyer_order_ref_metadata"("year");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tna_plan_details" ON "tna_plan_details"("tna_plan_id", "shipment_id", "tna_template_action_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_buyer" ON "tna_base_actions"("buyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_orders" ON "commission_distributions"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "commission_distribution_shipment_unique" ON "commission_distributions_details"("shipment_details_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_order_per_amendment" ON "sales_contract_amendment_details"("sales_contract_amendment_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_order_per_amendment_const" ON "sales_contract_amendment_details"("sales_contract_amendment_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_sales_contract_no" ON "sales_contracts"("sales_contract_no");

-- CreateIndex
CREATE UNIQUE INDEX "unique_orders_in_sc" ON "sales_contract_details"("sales_contract_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_orders_in_sales_contract" ON "sales_contract_details"("sales_contract_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_contract_no_metadata_year_key" ON "sales_contract_no_metadata"("year");

-- CreateIndex
CREATE UNIQUE INDEX "sales_contract_amendment_no_metadata_sales_contract_id_key" ON "sales_contract_amendment_no_metadata"("sales_contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_lc_number" ON "lc_master"("lc_no");

-- CreateIndex
CREATE UNIQUE INDEX "unique_order_per_lc" ON "lc_orders"("order_id", "lc_master_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_shipment_per_lc_order" ON "lc_shipments"("lc_order_id", "shipment_details_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_exfactory_no" ON "exfactory"("exfactory_no");

-- CreateIndex
CREATE UNIQUE INDEX "unique_years" ON "exfactory_metadata"("year");

-- CreateIndex
CREATE UNIQUE INDEX "lc_amendment_metadata_lc_id_key" ON "lc_amendment_metadata"("lc_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_order_per_lc_amendment" ON "lc_amendment_orders"("lc_amendment_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_shipment_per_lc_amendment_order" ON "lc_amendment_shipments"("lc_amendment_order_id", "shipment_details_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_buyer_per_tolerance_level" ON "shipment_tolerance_level"("buyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_rdl_invoice_no" ON "rdl_invoice"("invoice_no");

-- CreateIndex
CREATE UNIQUE INDEX "unique_buyer_user" ON "ev_permissions"("buyer_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_ref_no" ON "commission_invoice"("ref_no");

-- CreateIndex
CREATE UNIQUE INDEX "unique_rdl_invoice_buyer_ref_year" ON "commission_invoice_metadata"("buyer_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "unique_document_submission_id" ON "factory_payment_header"("document_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_factory_invoice_per_document_submission" ON "factory_payments"("document_submission_id", "factory_invoice_id");

-- AddForeignKey
ALTER TABLE "level_permission" ADD CONSTRAINT "level_permission_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "level_permission" ADD CONSTRAINT "level_permission_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "level_permission" ADD CONSTRAINT "level_permission_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "level_permission" ADD CONSTRAINT "level_permission_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "level_permission_history" ADD CONSTRAINT "level_permission_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "level_permission_history" ADD CONSTRAINT "level_permission_history_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "level_permission_history" ADD CONSTRAINT "level_permission_history_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "level_permission_history" ADD CONSTRAINT "level_permission_history_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "levels_history" ADD CONSTRAINT "levels_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "levels_history" ADD CONSTRAINT "levels_history_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_parent_module_id_fkey" FOREIGN KEY ("parent_module_id") REFERENCES "modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "permissions_history" ADD CONSTRAINT "permissions_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "permissions_history" ADD CONSTRAINT "permissions_history_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "permissions_history" ADD CONSTRAINT "permissions_history_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "permissions_history" ADD CONSTRAINT "permissions_history_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "permissions_history" ADD CONSTRAINT "permissions_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users_history" ADD CONSTRAINT "users_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "authorizations" ADD CONSTRAINT "authorizations_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "authorizations" ADD CONSTRAINT "authorizations_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "authorizations" ADD CONSTRAINT "authorizations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "authorizations" ADD CONSTRAINT "department_id_foreign_key" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_currencies_id_fkey" FOREIGN KEY ("currencies_id") REFERENCES "currencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "overseas_offices" ADD CONSTRAINT "overseas_offices_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "overseas_offices" ADD CONSTRAINT "overseas_offices_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_terms" ADD CONSTRAINT "payment_terms_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "banks_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fabrics" ADD CONSTRAINT "fabrics_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "banks_history" ADD CONSTRAINT "banks_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "companies_history" ADD CONSTRAINT "companies_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "countries_history" ADD CONSTRAINT "countries_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "currencies_history" ADD CONSTRAINT "currencies_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "destinations_history" ADD CONSTRAINT "destinations_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fabrics_history" ADD CONSTRAINT "fabrics_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "overseas_office_history" ADD CONSTRAINT "overseas_office_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_terms_history" ADD CONSTRAINT "payment_terms_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_types_history" ADD CONSTRAINT "product_types_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products_history" ADD CONSTRAINT "products_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "color_history" ADD CONSTRAINT "color_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "courier_history" ADD CONSTRAINT "courier_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fabric_suppliers" ADD CONSTRAINT "fabric_suppliers_to_country_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fabric_suppliers_history" ADD CONSTRAINT "fabric_suppliers_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_history" ADD CONSTRAINT "factory_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fob_types" ADD CONSTRAINT "fob_types_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "freight_term" ADD CONSTRAINT "freight_term_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_actions" ADD CONSTRAINT "tna_actions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_actions_history" ADD CONSTRAINT "tna_actions_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_bank" ADD CONSTRAINT "factory_bank_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_bank" ADD CONSTRAINT "factory_bank_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_bank_history" ADD CONSTRAINT "factory_bank_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_additional_clause" ADD CONSTRAINT "buyer_additional_clause_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_additional_clause_history" ADD CONSTRAINT "buyer_additional_clause_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_banks" ADD CONSTRAINT "buyer_banks_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_banks" ADD CONSTRAINT "buyer_banks_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_banks_history" ADD CONSTRAINT "buyer_banks_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_consignee" ADD CONSTRAINT "buyer_consignee_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_consignee_history" ADD CONSTRAINT "buyer_consignee_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_destinations" ADD CONSTRAINT "buyer_destinations_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_destinations" ADD CONSTRAINT "buyer_destinations_destinations_id_fkey" FOREIGN KEY ("destinations_id") REFERENCES "destinations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_destinations_history" ADD CONSTRAINT "buyer_destinations_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_late_policies" ADD CONSTRAINT "buyer_late_policies_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_late_policies_history" ADD CONSTRAINT "buyer_late_policies_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_payment_term" ADD CONSTRAINT "buyer_payment_term_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_payment_term" ADD CONSTRAINT "buyer_payment_term_payment_term_id_fkey" FOREIGN KEY ("payment_term_id") REFERENCES "payment_terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_payment_term_history" ADD CONSTRAINT "buyer_payment_term_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyers" ADD CONSTRAINT "buyers_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyers" ADD CONSTRAINT "buyers_overseas_office_id_fkey" FOREIGN KEY ("overseas_office_id") REFERENCES "overseas_offices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyers_history" ADD CONSTRAINT "buyers_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_brands" ADD CONSTRAINT "buyer_brands_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_brands_history" ADD CONSTRAINT "buyer_brands_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_department_sizes" ADD CONSTRAINT "buyer_department_sizes_buyer_department_id_fkey" FOREIGN KEY ("buyer_department_id") REFERENCES "buyer_departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_department_sizes_history" ADD CONSTRAINT "buyer_department_sizes_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_departments" ADD CONSTRAINT "buyer_departments_buyer_brand_id_fkey" FOREIGN KEY ("buyer_brand_id") REFERENCES "buyer_brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_departments_history" ADD CONSTRAINT "buyer_departments_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seasons_history" ADD CONSTRAINT "seasons_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "team_members_history" ADD CONSTRAINT "team_members_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teams_history" ADD CONSTRAINT "teams_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "company_banks" ADD CONSTRAINT "company_banks_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "company_banks" ADD CONSTRAINT "company_banks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "company_banks_history" ADD CONSTRAINT "company_banks_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "handover_dates" ADD CONSTRAINT "handover_dates_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "handover_dates_history" ADD CONSTRAINT "handover_dates_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_orders" ADD CONSTRAINT "buyer_orders_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "buyer_brands"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_orders" ADD CONSTRAINT "buyer_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_orders" ADD CONSTRAINT "buyer_orders_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "buyer_departments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_orders" ADD CONSTRAINT "buyer_orders_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_orders" ADD CONSTRAINT "buyer_orders_fob_type_id_fkey" FOREIGN KEY ("fob_type_id") REFERENCES "fob_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_orders" ADD CONSTRAINT "buyer_orders_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_orders" ADD CONSTRAINT "buyer_orders_secondary_currency_id_fkey" FOREIGN KEY ("secondary_currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_orders" ADD CONSTRAINT "buyer_orders_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_orders_history" ADD CONSTRAINT "buyer_orders_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_styles" ADD CONSTRAINT "order_styles_fabric_id_fkey" FOREIGN KEY ("fabric_id") REFERENCES "fabrics"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_styles" ADD CONSTRAINT "order_styles_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_styles" ADD CONSTRAINT "order_styles_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_styles" ADD CONSTRAINT "order_styles_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_styles" ADD CONSTRAINT "order_styles_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "fabric_suppliers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_styles_history" ADD CONSTRAINT "order_styles_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shipment_details" ADD CONSTRAINT "shipment_details_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shipment_details" ADD CONSTRAINT "shipment_details_order_style_id_fkey" FOREIGN KEY ("order_style_id") REFERENCES "order_styles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shipment_details" ADD CONSTRAINT "shipment_details_payment_term_id_fkey" FOREIGN KEY ("payment_term_id") REFERENCES "payment_terms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shipment_details" ADD CONSTRAINT "shipment_details_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "buyer_department_sizes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shipment_details_history" ADD CONSTRAINT "shipment_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_orders" ADD CONSTRAINT "factory_orders_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_orders" ADD CONSTRAINT "factory_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_orders_history" ADD CONSTRAINT "factory_orders_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_shipment_details" ADD CONSTRAINT "factory_order_fk" FOREIGN KEY ("factory_order_id") REFERENCES "factory_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_shipment_details" ADD CONSTRAINT "shipment_details_fk" FOREIGN KEY ("shipment_detail_id") REFERENCES "shipment_details"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_shipment_details_history" ADD CONSTRAINT "factory_shipment_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shipment_item_details" ADD CONSTRAINT "shipment_item_details_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shipment_item_details" ADD CONSTRAINT "shipment_item_details_shipment_detail_id_fkey" FOREIGN KEY ("shipment_detail_id") REFERENCES "shipment_details"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shipment_item_details_history" ADD CONSTRAINT "shipment_item_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_plan_details" ADD CONSTRAINT "tna_plan_details_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipment_details"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_plan_details" ADD CONSTRAINT "tna_plan_details_tna_plan_id_fkey" FOREIGN KEY ("tna_plan_id") REFERENCES "tna_plans"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "tna_plan_details_history" ADD CONSTRAINT "tna_plan_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_plan_history" ADD CONSTRAINT "table_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_plans" ADD CONSTRAINT "tna_plans_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_plans" ADD CONSTRAINT "tna_plans_style_id_fkey" FOREIGN KEY ("style_id") REFERENCES "order_styles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_plans" ADD CONSTRAINT "tna_plans_tna_template_id_fkey" FOREIGN KEY ("tna_template_id") REFERENCES "tna_templates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_template_actions" ADD CONSTRAINT "tna_template_actions_tna_template_id_fkey" FOREIGN KEY ("tna_template_id") REFERENCES "tna_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_template_actions_history" ADD CONSTRAINT "tna_template_actions_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_templates" ADD CONSTRAINT "team_foreign_key" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_templates" ADD CONSTRAINT "tna_templates_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_templates_history" ADD CONSTRAINT "tna_templates_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_base_actions" ADD CONSTRAINT "tna_base_actions_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "tna_actions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_base_actions" ADD CONSTRAINT "tna_base_actions_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tna_base_actions_history" ADD CONSTRAINT "tna_base_actions_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_distribution_details_history" ADD CONSTRAINT "commission_distribution_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_distribution_history" ADD CONSTRAINT "commission_distribution_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_distributions" ADD CONSTRAINT "commission_distributions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_distributions_details" ADD CONSTRAINT "commission_distributions_detail_commission_distribution_id_fkey" FOREIGN KEY ("commission_distribution_id") REFERENCES "commission_distributions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_distributions_details" ADD CONSTRAINT "commission_distributions_details_shipment_details_id_fkey" FOREIGN KEY ("shipment_details_id") REFERENCES "shipment_details"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fob_type_history" ADD CONSTRAINT "fob_type_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "freight_term_history" ADD CONSTRAINT "freight_term_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contract_amendment" ADD CONSTRAINT "sales_contract_amendment_sales_contract_id_fkey" FOREIGN KEY ("sales_contract_id") REFERENCES "sales_contracts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contract_amendment_details" ADD CONSTRAINT "sales_contract_amendment_detai_sales_contract_amendment_id_fkey" FOREIGN KEY ("sales_contract_amendment_id") REFERENCES "sales_contract_amendment"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contract_amendment_details" ADD CONSTRAINT "sales_contract_amendment_details_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contract_amendment_details_history" ADD CONSTRAINT "sales_contract_amendment_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contract_amendment_history" ADD CONSTRAINT "sales_contract_amendment_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contract_contact_person_history" ADD CONSTRAINT "sales_contract_contact_person_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contracts" ADD CONSTRAINT "sales_contracts_buyer_bank_id_fkey" FOREIGN KEY ("buyer_bank_id") REFERENCES "buyer_banks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contracts" ADD CONSTRAINT "sales_contracts_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contracts" ADD CONSTRAINT "sales_contracts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contracts" ADD CONSTRAINT "sales_contracts_contact_person_id_fkey" FOREIGN KEY ("contact_person_id") REFERENCES "sales_contract_contact_person"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contracts" ADD CONSTRAINT "sales_contracts_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contracts" ADD CONSTRAINT "sales_contracts_freight_term_id_fkey" FOREIGN KEY ("freight_term_id") REFERENCES "freight_term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contracts" ADD CONSTRAINT "sales_contracts_negotiation_bank_id_fkey" FOREIGN KEY ("negotiation_bank_id") REFERENCES "company_banks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contracts" ADD CONSTRAINT "sales_contracts_port_of_loading_id_fkey" FOREIGN KEY ("port_of_loading_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contracts" ADD CONSTRAINT "sales_contracts_rdl_bank_id_fkey" FOREIGN KEY ("rdl_bank_id") REFERENCES "company_banks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contracts" ADD CONSTRAINT "sales_contracts_supplier_bank_id_fkey" FOREIGN KEY ("supplier_bank_id") REFERENCES "factory_bank"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contracts_history" ADD CONSTRAINT "sales_contracts_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contract_details" ADD CONSTRAINT "sales_contract_contact_details_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contract_details" ADD CONSTRAINT "sales_contract_contact_details_sales_contract_id_fkey" FOREIGN KEY ("sales_contract_id") REFERENCES "sales_contracts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contract_details_history" ADD CONSTRAINT "sales_contract_contact_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contract_consignees" ADD CONSTRAINT "sales_contract_consignees_consignee_id_fkey" FOREIGN KEY ("consignee_id") REFERENCES "buyer_consignee"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contract_consignees" ADD CONSTRAINT "sales_contract_consignees_sales_contract_id_fkey" FOREIGN KEY ("sales_contract_id") REFERENCES "sales_contracts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contract_consignees_history" ADD CONSTRAINT "sales_contract_consignees_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_contract_amendment_no_metadata" ADD CONSTRAINT "sales_contract_amendment_no_metadata_sales_contract_id_fkey" FOREIGN KEY ("sales_contract_id") REFERENCES "sales_contracts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_master" ADD CONSTRAINT "lc_master_buyer_bank_id_fkey" FOREIGN KEY ("buyer_bank_id") REFERENCES "buyer_banks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_master" ADD CONSTRAINT "lc_master_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_master" ADD CONSTRAINT "lc_master_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_master" ADD CONSTRAINT "lc_master_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_master" ADD CONSTRAINT "lc_master_rdl_bank_id_fkey" FOREIGN KEY ("rdl_bank_id") REFERENCES "company_banks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_master_history" ADD CONSTRAINT "lc_master_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_orders" ADD CONSTRAINT "lc_orders_lc_master_id_fkey" FOREIGN KEY ("lc_master_id") REFERENCES "lc_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_orders" ADD CONSTRAINT "lc_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_orders_history" ADD CONSTRAINT "lc_orders_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_orders_history" ADD CONSTRAINT "lc_orders_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_shipments" ADD CONSTRAINT "lc_shipments_lc_order_id_fkey" FOREIGN KEY ("lc_order_id") REFERENCES "lc_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_shipments" ADD CONSTRAINT "lc_shipments_shipment_details_id_fkey" FOREIGN KEY ("shipment_details_id") REFERENCES "shipment_details"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_shipments_history" ADD CONSTRAINT "lc_shipments_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exfactory" ADD CONSTRAINT "exfactory_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exfactory" ADD CONSTRAINT "exfactory_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exfactory" ADD CONSTRAINT "exfactory_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exfactory_history" ADD CONSTRAINT "exfactory_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exfactory_orders" ADD CONSTRAINT "exfactory_orders_exfactory_id_fkey" FOREIGN KEY ("exfactory_id") REFERENCES "exfactory"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exfactory_orders" ADD CONSTRAINT "exfactory_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exfactory_orders_history" ADD CONSTRAINT "exfactory_orders_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exfactory_shipments" ADD CONSTRAINT "exfactory_shipments_exfactory_orders_id_fkey" FOREIGN KEY ("exfactory_orders_id") REFERENCES "exfactory_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exfactory_shipments" ADD CONSTRAINT "exfactory_shipments_shipment_details_id_fkey" FOREIGN KEY ("shipment_details_id") REFERENCES "shipment_details"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exfactory_shipments_history" ADD CONSTRAINT "exfactory_shipments_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_amendment" ADD CONSTRAINT "lc_amendment_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "lc_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_amendment_history" ADD CONSTRAINT "lc_amendment_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_amendment_metadata" ADD CONSTRAINT "lc_amendment_metadata_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "lc_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_amendment_orders" ADD CONSTRAINT "lc_amendment_orders_lc_amendment_id_fkey" FOREIGN KEY ("lc_amendment_id") REFERENCES "lc_amendment"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_amendment_orders" ADD CONSTRAINT "lc_amendment_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_amendment_orders_history" ADD CONSTRAINT "lc_amendment_orders_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_amendment_shipments" ADD CONSTRAINT "lc_amendment_shipments_lc_amendment_id_fkey" FOREIGN KEY ("lc_amendment_id") REFERENCES "lc_amendment"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_amendment_shipments" ADD CONSTRAINT "lc_amendment_shipments_lc_amendment_order_id_fkey" FOREIGN KEY ("lc_amendment_order_id") REFERENCES "lc_amendment_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_amendment_shipments" ADD CONSTRAINT "lc_amendment_shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_amendment_shipments" ADD CONSTRAINT "lc_amendment_shipments_shipment_details_id_fkey" FOREIGN KEY ("shipment_details_id") REFERENCES "shipment_details"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_amendment_shipments_history" ADD CONSTRAINT "lc_amendment_shipments_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shipment_tolerance_level" ADD CONSTRAINT "shipment_tolerance_level_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shipment_tolerance_level_history" ADD CONSTRAINT "shipment_tolerance_level_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_transfer" ADD CONSTRAINT "lc_transfer_lc_master_id_fkey" FOREIGN KEY ("lc_master_id") REFERENCES "lc_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_transfer_details" ADD CONSTRAINT "lc_transfer_details_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_transfer_details" ADD CONSTRAINT "lc_transfer_details_lc_transfer_id_fkey" FOREIGN KEY ("lc_transfer_id") REFERENCES "lc_transfer"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_transfer_details" ADD CONSTRAINT "lc_transfer_details_sales_contract_id_fkey" FOREIGN KEY ("sales_contract_id") REFERENCES "sales_contracts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_transfer_details_history" ADD CONSTRAINT "lc_transfer_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lc_transfer_history" ADD CONSTRAINT "lc_transfer_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice" ADD CONSTRAINT "factory_invoice_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice" ADD CONSTRAINT "factory_invoice_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice" ADD CONSTRAINT "factory_invoice_freight_term_id_fkey" FOREIGN KEY ("freight_term_id") REFERENCES "freight_term"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice" ADD CONSTRAINT "factory_invoice_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "lc_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice" ADD CONSTRAINT "factory_invoice_port_of_loading_fkey" FOREIGN KEY ("port_of_loading") REFERENCES "destinations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice" ADD CONSTRAINT "factory_invoice_sales_contract_id_fkey" FOREIGN KEY ("sales_contract_id") REFERENCES "sales_contracts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice" ADD CONSTRAINT "factory_invoice_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice_details" ADD CONSTRAINT "factory_invoice_details_exfactory_shipment_id_fkey" FOREIGN KEY ("exfactory_shipment_id") REFERENCES "exfactory_shipments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice_details" ADD CONSTRAINT "factory_invoice_details_factory_invoice_id_fkey" FOREIGN KEY ("factory_invoice_id") REFERENCES "factory_invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice_details_history" ADD CONSTRAINT "factory_invoice_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice_history" ADD CONSTRAINT "factory_invoice_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice_consignee" ADD CONSTRAINT "factory_invoice_consignee_consignee_id_fkey" FOREIGN KEY ("consignee_id") REFERENCES "buyer_consignee"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice_consignee" ADD CONSTRAINT "factory_invoice_consignee_factory_invoice_id_fkey" FOREIGN KEY ("factory_invoice_id") REFERENCES "factory_invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice_consignee_history" ADD CONSTRAINT "factory_invoice_consignee_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice_notify_party" ADD CONSTRAINT "factory_invoice_notify_party_factory_invoice_id_fkey" FOREIGN KEY ("factory_invoice_id") REFERENCES "factory_invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice_notify_party" ADD CONSTRAINT "factory_invoice_notify_party_notify_party_id_fkey" FOREIGN KEY ("notify_party_id") REFERENCES "buyer_consignee"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_invoice_notify_party_history" ADD CONSTRAINT "factory_invoice_notify_party_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rdl_invoice" ADD CONSTRAINT "rdl_invoice_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rdl_invoice" ADD CONSTRAINT "rdl_invoice_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "lc_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rdl_invoice" ADD CONSTRAINT "rdl_invoice_sales_contract_id_fkey" FOREIGN KEY ("sales_contract_id") REFERENCES "sales_contracts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rdl_invoice" ADD CONSTRAINT "rdl_invoice_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rdl_invoice_details" ADD CONSTRAINT "rdl_invoice_details_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rdl_invoice_details" ADD CONSTRAINT "rdl_invoice_details_factory_invoice_id_fkey" FOREIGN KEY ("factory_invoice_id") REFERENCES "factory_invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rdl_invoice_details" ADD CONSTRAINT "rdl_invoice_details_rdl_invoice_id_fkey" FOREIGN KEY ("rdl_invoice_id") REFERENCES "rdl_invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rdl_invoice_details_history" ADD CONSTRAINT "rdl_invoice_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rdl_invoice_history" ADD CONSTRAINT "rdl_invoice_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rdl_invoice_shipment_details" ADD CONSTRAINT "rdl_invoice_shipment_details_factory_invoice_details_fkey" FOREIGN KEY ("factory_invoice_details_id") REFERENCES "factory_invoice_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rdl_invoice_shipment_details" ADD CONSTRAINT "rdl_invoice_shipment_details_rdl_invoice_details_id_fkey" FOREIGN KEY ("rdl_invoice_details_id") REFERENCES "rdl_invoice_details"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rdl_invoice_shipment_details" ADD CONSTRAINT "rdl_invoice_shipment_details_shipment_details_id_fkey" FOREIGN KEY ("shipment_details_id") REFERENCES "shipment_details"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ev_permission_history" ADD CONSTRAINT "ev_permission_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ev_permissions" ADD CONSTRAINT "ev_permissions_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ev_permissions" ADD CONSTRAINT "ev_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rdl_invoice_shipment_details_history" ADD CONSTRAINT "rdl_invoice_shiment_details_histroy_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_submission_factory_invoices" ADD CONSTRAINT "document_submission_factory_i_document_submissions_details_fkey" FOREIGN KEY ("document_submissions_details_id") REFERENCES "document_submissions_details"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_submission_factory_invoices" ADD CONSTRAINT "document_submission_factory_invoices_factory_invoice_id_fkey" FOREIGN KEY ("factory_invoice_id") REFERENCES "factory_invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_submission_factory_invoices_history" ADD CONSTRAINT "document_submission_factory_invoices_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_lc_ic_fkey" FOREIGN KEY ("lc_id") REFERENCES "lc_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_sales_contract_id_fkey" FOREIGN KEY ("sales_contract_id") REFERENCES "sales_contracts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_submissions_details" ADD CONSTRAINT "document_submissions_details_document_submissions_id_fkey" FOREIGN KEY ("document_submissions_id") REFERENCES "document_submissions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_submissions_details" ADD CONSTRAINT "document_submissions_details_rdl_invoice_id_fkey" FOREIGN KEY ("rdl_invoice_id") REFERENCES "rdl_invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_submissions_details_history" ADD CONSTRAINT "document_submissions_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_submissions_history" ADD CONSTRAINT "document_submissions_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_invoice" ADD CONSTRAINT "commission_invoice_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_invoice" ADD CONSTRAINT "commission_invoice_company_bank_id_fkey" FOREIGN KEY ("company_bank_id") REFERENCES "company_banks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_invoice" ADD CONSTRAINT "commission_invoice_document_submission_id_fkey" FOREIGN KEY ("document_submission_id") REFERENCES "document_submissions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_invoice" ADD CONSTRAINT "commission_invoice_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "lc_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_invoice" ADD CONSTRAINT "commission_invoice_rdl_invoice_id_fkey" FOREIGN KEY ("rdl_invoice_id") REFERENCES "rdl_invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_invoice" ADD CONSTRAINT "commission_invoice_sales_contract_id_fkey" FOREIGN KEY ("sales_contract_id") REFERENCES "sales_contracts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_invoice" ADD CONSTRAINT "commission_invoice_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_invoice_history" ADD CONSTRAINT "commission_invoice_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proceed_realization" ADD CONSTRAINT "procced_realization_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proceed_realization" ADD CONSTRAINT "procced_realization_document_submission_id_fkey" FOREIGN KEY ("document_submission_id") REFERENCES "document_submissions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proceed_realization" ADD CONSTRAINT "procced_realization_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proceed_realization_details" ADD CONSTRAINT "realization_details_rdl_invoice_id_fkey" FOREIGN KEY ("rdl_invoice_id") REFERENCES "rdl_invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proceed_realization_details" ADD CONSTRAINT "realization_details_realization_id_fkey" FOREIGN KEY ("realization_id") REFERENCES "proceed_realization"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proceed_realization_details_history" ADD CONSTRAINT "realization_details_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proceed_realization_history" ADD CONSTRAINT "procced_realization_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_payment_header" ADD CONSTRAINT "factory_payment_header_document_submission_id_fkey" FOREIGN KEY ("document_submission_id") REFERENCES "document_submissions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_payments" ADD CONSTRAINT "factory_payments_document_submission_id_fkey" FOREIGN KEY ("document_submission_id") REFERENCES "document_submissions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_payments" ADD CONSTRAINT "factory_payments_factory_invoice_id_fkey" FOREIGN KEY ("factory_invoice_id") REFERENCES "factory_invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_payments_header_history" ADD CONSTRAINT "factory_payments_header_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "factory_payments_history" ADD CONSTRAINT "factory_payments_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_lc_master_id_fkey" FOREIGN KEY ("lc_master_id") REFERENCES "lc_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_sales_contrct_id_fkey" FOREIGN KEY ("sales_contrct_id") REFERENCES "sales_contracts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

