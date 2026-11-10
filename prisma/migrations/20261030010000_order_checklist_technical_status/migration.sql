BEGIN;

DO $$
DECLARE
    target_table TEXT;
BEGIN
    FOREACH target_table IN ARRAY ARRAY['order_checklist_details', 'order_checklist_details_history']
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
                AND table_name = target_table
                AND column_name = 'technical_check'
                AND data_type = 'boolean'
        ) THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN technical_check DROP DEFAULT', target_table);
            EXECUTE format(
                'ALTER TABLE %I ALTER COLUMN technical_check TYPE INTEGER USING CASE WHEN technical_check IS TRUE THEN 1 WHEN technical_check IS FALSE THEN 0 ELSE NULL END',
                target_table
            );
        END IF;

        EXECUTE format('ALTER TABLE %I ALTER COLUMN technical_check SET DEFAULT 0', target_table);
    END LOOP;
END $$;

COMMIT;
