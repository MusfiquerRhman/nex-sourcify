-- Increase every bounded VARCHAR column in the Prisma schema by 50 characters.
-- Existing migration history is preserved.

ALTER TABLE "levels"
    ALTER COLUMN "name" TYPE VARCHAR(65);

ALTER TABLE "levels_history"
    ALTER COLUMN "name" TYPE VARCHAR(65);

ALTER TABLE "modules"
    ALTER COLUMN "name" TYPE VARCHAR(100);

ALTER TABLE "users"
    ALTER COLUMN "first_name" TYPE VARCHAR(75),
    ALTER COLUMN "last_name" TYPE VARCHAR(75),
    ALTER COLUMN "phone_no" TYPE VARCHAR(68),
    ALTER COLUMN "email" TYPE VARCHAR(100),
    ALTER COLUMN "user_id" TYPE VARCHAR(70);

ALTER TABLE "notifications"
    ALTER COLUMN "title" TYPE VARCHAR(120),
    ALTER COLUMN "target_id" TYPE VARCHAR(100);

ALTER TABLE "users_history"
    ALTER COLUMN "first_name" TYPE VARCHAR(75),
    ALTER COLUMN "last_name" TYPE VARCHAR(75),
    ALTER COLUMN "phone_no" TYPE VARCHAR(68),
    ALTER COLUMN "email" TYPE VARCHAR(100),
    ALTER COLUMN "user_id" TYPE VARCHAR(70);

ALTER TABLE "authorizations"
    ALTER COLUMN "name" TYPE VARCHAR(100);

ALTER TABLE "companies"
    ALTER COLUMN "name" TYPE VARCHAR(80),
    ALTER COLUMN "email" TYPE VARCHAR(80),
    ALTER COLUMN "phone_no" TYPE VARCHAR(68),
    ALTER COLUMN "city" TYPE VARCHAR(65),
    ALTER COLUMN "zip_code" TYPE VARCHAR(56);

ALTER TABLE "countries"
    ALTER COLUMN "name" TYPE VARCHAR(70),
    ALTER COLUMN "country_code" TYPE VARCHAR(55);

ALTER TABLE "currencies"
    ALTER COLUMN "name" TYPE VARCHAR(60),
    ALTER COLUMN "symbol" TYPE VARCHAR(52),
    ALTER COLUMN "currency_code" TYPE VARCHAR(55);

ALTER TABLE "destinations"
    ALTER COLUMN "name" TYPE VARCHAR(100);

ALTER TABLE "overseas_offices"
    ALTER COLUMN "name" TYPE VARCHAR(75),
    ALTER COLUMN "email_address" TYPE VARCHAR(90),
    ALTER COLUMN "phone_no" TYPE VARCHAR(68),
    ALTER COLUMN "city" TYPE VARCHAR(65),
    ALTER COLUMN "zip" TYPE VARCHAR(58);

ALTER TABLE "terms"
    ALTER COLUMN "name" TYPE VARCHAR(55);

ALTER TABLE "banks"
    ALTER COLUMN "name" TYPE VARCHAR(150);

ALTER TABLE "fabrics"
    ALTER COLUMN "description" TYPE VARCHAR(305),
    ALTER COLUMN "unit" TYPE VARCHAR(60);

ALTER TABLE "product_types"
    ALTER COLUMN "name" TYPE VARCHAR(75);

ALTER TABLE "products"
    ALTER COLUMN "name" TYPE VARCHAR(305);

ALTER TABLE "banks_history"
    ALTER COLUMN "name" TYPE VARCHAR(150);

ALTER TABLE "companies_history"
    ALTER COLUMN "name" TYPE VARCHAR(80),
    ALTER COLUMN "email" TYPE VARCHAR(80),
    ALTER COLUMN "phone_no" TYPE VARCHAR(68),
    ALTER COLUMN "city" TYPE VARCHAR(65),
    ALTER COLUMN "zip_code" TYPE VARCHAR(56);

ALTER TABLE "countries_history"
    ALTER COLUMN "name" TYPE VARCHAR(70),
    ALTER COLUMN "country_code" TYPE VARCHAR(55);

ALTER TABLE "currencies_history"
    ALTER COLUMN "name" TYPE VARCHAR(60),
    ALTER COLUMN "symbol" TYPE VARCHAR(60),
    ALTER COLUMN "currency_code" TYPE VARCHAR(55);

ALTER TABLE "destinations_history"
    ALTER COLUMN "name" TYPE VARCHAR(100);

ALTER TABLE "fabrics_history"
    ALTER COLUMN "description" TYPE VARCHAR(305),
    ALTER COLUMN "unit" TYPE VARCHAR(60);

ALTER TABLE "overseas_office_history"
    ALTER COLUMN "name" TYPE VARCHAR(75),
    ALTER COLUMN "email_address" TYPE VARCHAR(90),
    ALTER COLUMN "phone_no" TYPE VARCHAR(68),
    ALTER COLUMN "city" TYPE VARCHAR(65),
    ALTER COLUMN "zip" TYPE VARCHAR(58);

ALTER TABLE "product_types_history"
    ALTER COLUMN "name" TYPE VARCHAR(75);

ALTER TABLE "products_history"
    ALTER COLUMN "name" TYPE VARCHAR(305);

ALTER TABLE "color_history"
    ALTER COLUMN "name" TYPE VARCHAR(100);

ALTER TABLE "colors"
    ALTER COLUMN "name" TYPE VARCHAR(125);

ALTER TABLE "courier_history"
    ALTER COLUMN "name" TYPE VARCHAR(100),
    ALTER COLUMN "email" TYPE VARCHAR(100),
    ALTER COLUMN "contact_person" TYPE VARCHAR(80),
    ALTER COLUMN "phone_no" TYPE VARCHAR(68),
    ALTER COLUMN "website" TYPE VARCHAR(75);

ALTER TABLE "couriers"
    ALTER COLUMN "name" TYPE VARCHAR(100),
    ALTER COLUMN "email" TYPE VARCHAR(100),
    ALTER COLUMN "contact_person" TYPE VARCHAR(80),
    ALTER COLUMN "phone_no" TYPE VARCHAR(68),
    ALTER COLUMN "website" TYPE VARCHAR(75);

ALTER TABLE "fabric_suppliers"
    ALTER COLUMN "name" TYPE VARCHAR(100),
    ALTER COLUMN "contact_person" TYPE VARCHAR(80),
    ALTER COLUMN "phone_no" TYPE VARCHAR(68),
    ALTER COLUMN "website" TYPE VARCHAR(80),
    ALTER COLUMN "email" TYPE VARCHAR(100);

ALTER TABLE "fabric_suppliers_history"
    ALTER COLUMN "name" TYPE VARCHAR(100),
    ALTER COLUMN "contact_person" TYPE VARCHAR(80),
    ALTER COLUMN "phone_no" TYPE VARCHAR(68),
    ALTER COLUMN "website" TYPE VARCHAR(80),
    ALTER COLUMN "email" TYPE VARCHAR(100);

ALTER TABLE "factories"
    ALTER COLUMN "name" TYPE VARCHAR(100),
    ALTER COLUMN "email" TYPE VARCHAR(100),
    ALTER COLUMN "contact_person" TYPE VARCHAR(80),
    ALTER COLUMN "prefix" TYPE VARCHAR(60),
    ALTER COLUMN "phone_no" TYPE VARCHAR(125),
    ALTER COLUMN "website" TYPE VARCHAR(75);

ALTER TABLE "factory_history"
    ALTER COLUMN "name" TYPE VARCHAR(100),
    ALTER COLUMN "email" TYPE VARCHAR(100),
    ALTER COLUMN "contact_person" TYPE VARCHAR(80),
    ALTER COLUMN "prefix" TYPE VARCHAR(60),
    ALTER COLUMN "phone_no" TYPE VARCHAR(68),
    ALTER COLUMN "website" TYPE VARCHAR(75);

ALTER TABLE "fob_types"
    ALTER COLUMN "name" TYPE VARCHAR(100);

ALTER TABLE "freight_term"
    ALTER COLUMN "name" TYPE VARCHAR(100);

ALTER TABLE "tna_actions"
    ALTER COLUMN "name" TYPE VARCHAR(100);

ALTER TABLE "tna_actions_history"
    ALTER COLUMN "name" TYPE VARCHAR(100);

ALTER TABLE "factory_bank"
    ALTER COLUMN "branch_name" TYPE VARCHAR(150),
    ALTER COLUMN "account_no" TYPE VARCHAR(70),
    ALTER COLUMN "account_name" TYPE VARCHAR(150),
    ALTER COLUMN "swift_code" TYPE VARCHAR(65);

ALTER TABLE "factory_bank_history"
    ALTER COLUMN "branch_name" TYPE VARCHAR(150),
    ALTER COLUMN "account_no" TYPE VARCHAR(70),
    ALTER COLUMN "account_name" TYPE VARCHAR(150),
    ALTER COLUMN "swift_code" TYPE VARCHAR(65);

ALTER TABLE "buyer_banks"
    ALTER COLUMN "branch_name" TYPE VARCHAR(305),
    ALTER COLUMN "account_no" TYPE VARCHAR(80),
    ALTER COLUMN "account_name" TYPE VARCHAR(305),
    ALTER COLUMN "swift" TYPE VARCHAR(70);

ALTER TABLE "buyer_banks_history"
    ALTER COLUMN "branch_name" TYPE VARCHAR(305),
    ALTER COLUMN "account_no" TYPE VARCHAR(80),
    ALTER COLUMN "account_name" TYPE VARCHAR(305),
    ALTER COLUMN "swift" TYPE VARCHAR(70);

ALTER TABLE "buyer_consignee"
    ALTER COLUMN "consignee_name" TYPE VARCHAR(305);

ALTER TABLE "buyer_consignee_history"
    ALTER COLUMN "consignee_name" TYPE VARCHAR(305);

ALTER TABLE "buyers"
    ALTER COLUMN "buyer_name" TYPE VARCHAR(305),
    ALTER COLUMN "short_name" TYPE VARCHAR(100),
    ALTER COLUMN "prefix" TYPE VARCHAR(100),
    ALTER COLUMN "contact_person" TYPE VARCHAR(100),
    ALTER COLUMN "phone_no" TYPE VARCHAR(100),
    ALTER COLUMN "email" TYPE VARCHAR(100),
    ALTER COLUMN "website" TYPE VARCHAR(100);

ALTER TABLE "buyers_history"
    ALTER COLUMN "buyer_name" TYPE VARCHAR(305),
    ALTER COLUMN "short_name" TYPE VARCHAR(100),
    ALTER COLUMN "prefix" TYPE VARCHAR(100),
    ALTER COLUMN "contact_person" TYPE VARCHAR(100),
    ALTER COLUMN "phone_no" TYPE VARCHAR(100),
    ALTER COLUMN "email" TYPE VARCHAR(100),
    ALTER COLUMN "website" TYPE VARCHAR(100);

ALTER TABLE "buyer_brands"
    ALTER COLUMN "brand" TYPE VARCHAR(90);

ALTER TABLE "buyer_brands_history"
    ALTER COLUMN "brand" TYPE VARCHAR(90);

ALTER TABLE "buyer_department_sizes"
    ALTER COLUMN "size" TYPE VARCHAR(90);

ALTER TABLE "buyer_department_sizes_history"
    ALTER COLUMN "size" TYPE VARCHAR(90);

ALTER TABLE "buyer_departments"
    ALTER COLUMN "department" TYPE VARCHAR(90);

ALTER TABLE "buyer_departments_history"
    ALTER COLUMN "department" TYPE VARCHAR(90);

ALTER TABLE "seasons"
    ALTER COLUMN "season_name" TYPE VARCHAR(105);

ALTER TABLE "seasons_history"
    ALTER COLUMN "season_name" TYPE VARCHAR(105);

ALTER TABLE "teams"
    ALTER COLUMN "team_name" TYPE VARCHAR(105);

ALTER TABLE "teams_history"
    ALTER COLUMN "team_name" TYPE VARCHAR(105);

ALTER TABLE "company_banks"
    ALTER COLUMN "branch_name" TYPE VARCHAR(305),
    ALTER COLUMN "account_no" TYPE VARCHAR(80),
    ALTER COLUMN "account_name" TYPE VARCHAR(305),
    ALTER COLUMN "swift" TYPE VARCHAR(70);

ALTER TABLE "company_banks_history"
    ALTER COLUMN "branch_name" TYPE VARCHAR(305),
    ALTER COLUMN "account_no" TYPE VARCHAR(80),
    ALTER COLUMN "account_name" TYPE VARCHAR(305),
    ALTER COLUMN "swift" TYPE VARCHAR(70);

ALTER TABLE "buyer_orders"
    ALTER COLUMN "ref_no" TYPE VARCHAR(100);

ALTER TABLE "buyer_orders_history"
    ALTER COLUMN "ref_no" TYPE VARCHAR(100);

ALTER TABLE "order_styles"
    ALTER COLUMN "style" TYPE VARCHAR(100);

ALTER TABLE "order_styles_history"
    ALTER COLUMN "style" TYPE VARCHAR(100);

ALTER TABLE "shipment_details"
    ALTER COLUMN "buyer_po" TYPE VARCHAR(100);

ALTER TABLE "shipment_details_history"
    ALTER COLUMN "buyer_po" TYPE VARCHAR(100);

ALTER TABLE "fob_type_history"
    ALTER COLUMN "name" TYPE VARCHAR(100);

ALTER TABLE "freight_term_history"
    ALTER COLUMN "name" TYPE VARCHAR(100);

ALTER TABLE "sales_contract_contact_person"
    ALTER COLUMN "name" TYPE VARCHAR(100),
    ALTER COLUMN "contact_number" TYPE VARCHAR(100),
    ALTER COLUMN "pabx" TYPE VARCHAR(100),
    ALTER COLUMN "email" TYPE VARCHAR(100);

ALTER TABLE "sales_contract_contact_person_history"
    ALTER COLUMN "name" TYPE VARCHAR(100),
    ALTER COLUMN "contact_number" TYPE VARCHAR(100),
    ALTER COLUMN "pabx" TYPE VARCHAR(100),
    ALTER COLUMN "email" TYPE VARCHAR(100);

ALTER TABLE "sales_contracts"
    ALTER COLUMN "sales_contract_no" TYPE VARCHAR(100);

ALTER TABLE "sales_contracts_history"
    ALTER COLUMN "sales_contract_no" TYPE VARCHAR(100);

ALTER TABLE "lc_master"
    ALTER COLUMN "lc_no" TYPE VARCHAR(100);

ALTER TABLE "lc_master_history"
    ALTER COLUMN "lc_no" TYPE VARCHAR(100);

ALTER TABLE "lc_orders"
    ALTER COLUMN "dm_pi_no" TYPE VARCHAR(80);

ALTER TABLE "lc_orders_history"
    ALTER COLUMN "dm_pi_no" TYPE VARCHAR(80);

ALTER TABLE "exfactory"
    ALTER COLUMN "exfactory_no" TYPE VARCHAR(100);

ALTER TABLE "exfactory_history"
    ALTER COLUMN "exfactory_no" TYPE VARCHAR(100);

ALTER TABLE "lc_amendment_orders"
    ALTER COLUMN "dm_pi_no" TYPE VARCHAR(100);

ALTER TABLE "lc_amendment_orders_history"
    ALTER COLUMN "dm_pi_no" TYPE VARCHAR(100);

ALTER TABLE "lc_amendment_shipments"
    ALTER COLUMN "dm_pi_no" TYPE VARCHAR(100);

ALTER TABLE "factory_invoice"
    ALTER COLUMN "invoice_no" TYPE VARCHAR(100);

ALTER TABLE "factory_invoice_history"
    ALTER COLUMN "invoice_no" TYPE VARCHAR(100);

ALTER TABLE "rdl_invoice"
    ALTER COLUMN "invoice_no" TYPE VARCHAR(100),
    ALTER COLUMN "pi_no" TYPE VARCHAR(100),
    ALTER COLUMN "container_no" TYPE VARCHAR(150),
    ALTER COLUMN "contact_no" TYPE VARCHAR(150);

ALTER TABLE "rdl_invoice_history"
    ALTER COLUMN "invoice_no" TYPE VARCHAR(100),
    ALTER COLUMN "pi_no" TYPE VARCHAR(100),
    ALTER COLUMN "container_no" TYPE VARCHAR(150),
    ALTER COLUMN "contact_no" TYPE VARCHAR(150);

ALTER TABLE "document_submission_factory_invoices"
    ALTER COLUMN "factory_fdbc_no" TYPE VARCHAR(150);

ALTER TABLE "document_submission_factory_invoices_history"
    ALTER COLUMN "factory_fdbc_no" TYPE VARCHAR(100);

ALTER TABLE "document_submissions"
    ALTER COLUMN "fdbc_no" TYPE VARCHAR(150),
    ALTER COLUMN "awb_no" TYPE VARCHAR(150);

ALTER TABLE "document_submissions_history"
    ALTER COLUMN "fdbc_no" TYPE VARCHAR(150),
    ALTER COLUMN "awb_no" TYPE VARCHAR(150);

ALTER TABLE "commission_invoice"
    ALTER COLUMN "ref_no" TYPE VARCHAR(100);

ALTER TABLE "commission_invoice_history"
    ALTER COLUMN "ref_no" TYPE VARCHAR(80);

ALTER TABLE "factory_payments"
    ALTER COLUMN "factory_payment_no" TYPE VARCHAR(150);

ALTER TABLE "factory_payments_history"
    ALTER COLUMN "factory_payment_no" TYPE VARCHAR(150);

ALTER TABLE "cross_payment_details"
    ALTER COLUMN "factory_payment_no" TYPE VARCHAR(100);

ALTER TABLE "cross_payment_details_history"
    ALTER COLUMN "factory_payment_no" TYPE VARCHAR(100);

ALTER TABLE "cross_payments"
    ALTER COLUMN "cross_payment_ref" TYPE VARCHAR(150);

ALTER TABLE "cross_payments_history"
    ALTER COLUMN "cross_payment_ref" TYPE VARCHAR(150);

ALTER TABLE "debit_note"
    ALTER COLUMN "debit_note_ref" TYPE VARCHAR(100);

ALTER TABLE "debit_note_details_history"
    ALTER COLUMN "exfactory_shipment_id" TYPE VARCHAR(90);

ALTER TABLE "debit_note_history"
    ALTER COLUMN "debit_note_ref" TYPE VARCHAR(100);

ALTER TABLE "error_logs"
    ALTER COLUMN "request_method" TYPE VARCHAR(60),
    ALTER COLUMN "error_name" TYPE VARCHAR(305),
    ALTER COLUMN "error_code" TYPE VARCHAR(150);
