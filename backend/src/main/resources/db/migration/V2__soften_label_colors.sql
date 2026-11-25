-- ラベルの5色を、画面のパステルカラーに合わせたやわらかい色に変える
-- （ラベルの名前・並び順と、カードに付いているラベルは変わらない）
UPDATE labels SET color_code = '#F0949B', updated_at = now() WHERE name = '赤';
UPDATE labels SET color_code = '#ECC45C', updated_at = now() WHERE name = '黄';
UPDATE labels SET color_code = '#8FCFAE', updated_at = now() WHERE name = '緑';
UPDATE labels SET color_code = '#8DBDEB', updated_at = now() WHERE name = '青';
UPDATE labels SET color_code = '#BFA0E0', updated_at = now() WHERE name = '紫';
