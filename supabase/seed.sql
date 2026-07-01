-- Seed data for schools
INSERT INTO schools (id, name_zh, name_en, type, district, gender, school_net) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '香港幼稚園', 'Hong Kong Kindergarten', 'kindergarten', '港島區', 'coed', '11'),
    ('550e8400-e29b-41d4-a716-446655440002', '九龍小學', 'Kowloon Primary School', 'primary', '九龍區', 'boys', '41'),
    ('550e8400-e29b-41d4-a716-446655440003', '新界幼稚園', 'New Territories Kindergarten', 'kindergarten', '新界區', 'girls', '91');

-- Seed data for school tasks
INSERT INTO school_tasks (school_id, title, description, sort_order) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '遞交申請', '網上或紙本申請', 1),
    ('550e8400-e29b-41d4-a716-446655440001', '遞交 Portfolio', '學生作品集', 2),
    ('550e8400-e29b-41d4-a716-446655440001', '繳費', '申請費用', 3),
    ('550e8400-e29b-41d4-a716-446655440001', '第一次面試', '家長面見', 4),
    ('550e8400-e29b-41d4-a716-446655440001', '第二次面試', '學生面試', 5),
    ('550e8400-e29b-41d4-a716-446655440002', '遞交申請', '入學申請', 1),
    ('550e8400-e29b-41d4-a716-446655440002', '遞交 Portfolio', '學生成績和作品', 2),
    ('550e8400-e29b-41d4-a716-446655440002', '繳費', '報名費', 3),
    ('550e8400-e29b-41d4-a716-446655440002', '面試', '入學面試', 4),
    ('550e8400-e29b-41d4-a716-446655440003', '遞交申請', '申請表格', 1),
    ('550e8400-e29b-41d4-a716-446655440003', '面試', '幼稚園面試', 2);

-- Seed data for events
INSERT INTO events (date, title, type) VALUES
    ('2026-07-15', '幼稚園申請開始', 'kindergarten'),
    ('2026-07-20', '小學入學申請', 'primary'),
    ('2026-07-25', '幼稚園面試日期', 'kindergarten');
