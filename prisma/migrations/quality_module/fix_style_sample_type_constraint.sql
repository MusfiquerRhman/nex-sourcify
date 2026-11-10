BEGIN;

ALTER TABLE sample_check_list DROP CONSTRAINT IF EXISTS unique_style_and_sample_type;
ALTER TABLE sample_check_list ADD CONSTRAINT unique_style_and_sample_type UNIQUE (style_id, sample_type);

COMMIT;
