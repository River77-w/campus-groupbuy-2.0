-- 为 group_buys 表添加 RLS 策略（允许匿名用户读写）

-- 1. 开启 RLS（如果还没开）
ALTER TABLE group_buys ENABLE ROW LEVEL SECURITY;

-- 2. 允许匿名用户查看所有拼单
CREATE POLICY "Allow anon select" ON group_buys
    FOR SELECT
    TO anon
    USING (true);

-- 3. 允许匿名用户发布拼单
CREATE POLICY "Allow anon insert" ON group_buys
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- 4. 允许匿名用户更新拼单（如加入拼单增加人数）
CREATE POLICY "Allow anon update" ON group_buys
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- 5. 允许匿名用户删除自己发布的拼单（可选）
-- CREATE POLICY "Allow anon delete" ON group_buys
--     FOR DELETE
--     TO anon
--     USING (true);
