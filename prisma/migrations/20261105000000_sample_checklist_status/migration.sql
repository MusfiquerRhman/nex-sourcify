BEGIN;

DO $$
DECLARE
    target_table TEXT;
BEGIN
    FOREACH target_table IN ARRAY ARRAY['sample_check_list', 'sample_check_list_history']
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
                AND table_name = target_table
                AND column_name = 'status'
                AND data_type = 'boolean'
        ) THEN
            EXECUTE format(
                'ALTER TABLE %I ALTER COLUMN status TYPE INTEGER USING CASE WHEN status IS TRUE THEN 1 WHEN status IS FALSE THEN -1 ELSE NULL END',
                target_table
            );
        END IF;
    END LOOP;
END $$;

COMMIT;
