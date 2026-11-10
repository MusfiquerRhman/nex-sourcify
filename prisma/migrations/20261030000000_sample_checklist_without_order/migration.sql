BEGIN;

ALTER TABLE sample_check_list
    ADD COLUMN IF NOT EXISTS with_order BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS style_no_manual VARCHAR(50),
    ALTER COLUMN style_id DROP NOT NULL,
    ALTER COLUMN with_order SET DEFAULT TRUE;

-- Existing checklists with a linked style were created using the order-based workflow.
UPDATE sample_check_list
SET with_order = TRUE
WHERE style_id IS NOT NULL AND NULLIF(BTRIM(style_no_manual), '') IS NULL;

ALTER TABLE sample_check_list_history
    ADD COLUMN IF NOT EXISTS with_order BOOLEAN,
    ADD COLUMN IF NOT EXISTS style_no_manual VARCHAR(50);

UPDATE sample_check_list_history
SET with_order = TRUE
WHERE style_id IS NOT NULL AND with_order IS NULL;

COMMIT;
