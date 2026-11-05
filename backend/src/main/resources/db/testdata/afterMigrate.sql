-- 開発用のテストデータ（dev プロファイルのときだけ使う）
-- Flyway が毎回の起動時に、テーブルを作ったあとで実行する。
-- リストが1件もないときだけ入れるので、何度起動しても増えない。

DO $$
DECLARE
    todo_id  BIGINT;
    doing_id BIGINT;
    done_id  BIGINT;
BEGIN
    IF EXISTS (SELECT 1 FROM lists) THEN
        RETURN;
    END IF;

    INSERT INTO lists (name, position, is_done) VALUES ('未着手', 0, false) RETURNING id INTO todo_id;
    INSERT INTO lists (name, position, is_done) VALUES ('進行中', 1, false) RETURNING id INTO doing_id;
    INSERT INTO lists (name, position, is_done) VALUES ('完了', 2, true) RETURNING id INTO done_id;

    INSERT INTO cards (list_id, label_id, title, priority, due_date, position) VALUES
        (todo_id,  1,    '買い物に行く',         1, CURRENT_DATE - 1, 0),
        (todo_id,  4,    '本を返す',             2, CURRENT_DATE + 1, 1),
        (todo_id,  NULL, '部屋の掃除',           3, NULL,             2),
        (doing_id, 3,    'レポートを書く',       1, CURRENT_DATE,     0),
        (doing_id, 5,    'API の勉強',           2, CURRENT_DATE + 7, 1),
        (done_id,  2,    '歯医者の予約',         2, CURRENT_DATE - 3, 0);
END $$;
