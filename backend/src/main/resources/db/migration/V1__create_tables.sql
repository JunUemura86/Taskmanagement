-- テーブルを作る（docs/database-design.md に合わせる）

-- リスト表
CREATE TABLE lists (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       VARCHAR(30) NOT NULL CHECK (char_length(name) >= 1),
    position   INTEGER     NOT NULL,
    is_done    BOOLEAN     NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 完了用リストは1つだけ
CREATE UNIQUE INDEX lists_only_one_done ON lists (is_done) WHERE is_done;

-- ラベル表
CREATE TABLE labels (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       VARCHAR(10) NOT NULL UNIQUE,
    color_code VARCHAR(7)  NOT NULL CHECK (color_code ~ '^#[0-9A-F]{6}$'),
    position   INTEGER     NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- カード表
CREATE TABLE cards (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    list_id    BIGINT       NOT NULL REFERENCES lists (id) ON DELETE CASCADE,
    label_id   BIGINT       REFERENCES labels (id),
    title      VARCHAR(100) NOT NULL CHECK (char_length(title) >= 1),
    priority   INTEGER      NOT NULL DEFAULT 2 CHECK (priority IN (1, 2, 3)),
    due_date   DATE,
    position   INTEGER      NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ラベルの最初のデータ（5件）
INSERT INTO labels (name, color_code, position) VALUES
    ('赤', '#E5484D', 0),
    ('黄', '#F5C400', 1),
    ('緑', '#30A46C', 2),
    ('青', '#0090FF', 3),
    ('紫', '#8E4EC6', 4);
