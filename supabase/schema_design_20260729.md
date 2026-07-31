# KiDays 数据库设计稿（2026-07-29）

## 目标
- 将“学校固定资料”“学校某一年度的申请周期”“用户申请进度”彻底拆开
- 兼容当前已有基础表：`user_profiles`、`students`、`schools`、`student_schools`
- 同时支持：
  - 小一申请（优先）
  - 后续可扩展到幼稚园申请
- 支持任意数量的关键日期：开放日、简介会、申请开始/截止、一/二/三面、放榜、注册等

## 一、核心关系
- `auth.users` 1:1 `user_profiles`
- `user_profiles` 1:N `students`
- `schools` 1:N `school_cycles`
  - 同一间学校可有不同招生年度
- `school_cycles` 1:N `school_events`
  - 每个周期可有多个关键日期事件
- `students` 1:N `student_applications`
- `school_cycles` 1:N `student_applications`
  - 代表“某个学生申请某学校的某一年度”
- `student_applications` 1:N `student_application_progress`
- `school_events` 1:N `student_application_progress`
  - 代表“这个学生对这个节点走到了哪一步”

## 二、业务表清单

### 1. user_profiles
用户个人资料扩展表，基于 Supabase auth

字段：
- `id uuid PK` -> `auth.users.id`
- `display_name text`
- `phone text`
- `preferred_language text`
- `created_at timestamptz`
- `updated_at timestamptz`

### 2. students
学生档案

字段：
- `id uuid PK`
- `user_id uuid FK -> user_profiles.id NOT NULL`
- `name text NOT NULL`
- `gender text CHECK IN ('boy', 'girl')`
- `birth_date date`
- `application_level text CHECK IN ('kindergarten', 'primary')`
- `notes text`
- `created_at timestamptz`
- `updated_at timestamptz`

说明：
- 现有迁移里的 `application_type` 后续统一语义为 `application_level`

### 3. schools
学校固定资料，不存放每年变化日期

字段：
- `id uuid PK`
- `name_zh text NOT NULL`
- `name_en text`
- `address_zh text`
- `address_en text`
- `district text`
- `gender_policy text CHECK IN ('coed', 'boys', 'girls')`
- `school_type text CHECK IN ('government', 'aided', 'direct_subsidy', 'private', 'international', 'special')`
- `application_level text CHECK IN ('kindergarten', 'primary')`
- `school_net text`
- `website text`
- `phone text`
- `email text`
- `remarks text`
- `is_active boolean DEFAULT true`
- `created_at timestamptz`
- `updated_at timestamptz`

说明：
- 现有迁移中的 `type` 更准确应为 `application_level`
- 现有迁移中的 `gender` 更准确应为 `gender_policy`
- 新增 `school_type` 用来区分直资 / 国际 / 津贴 等

### 4. school_cycles
学校某一年的申请周期主体

字段：
- `id uuid PK`
- `school_id uuid FK -> schools.id NOT NULL`
- `academic_year text NOT NULL`
  - 格式建议：`2027-2028`
- `application_level text CHECK IN ('kindergarten', 'primary')`
- `status text CHECK IN ('draft', 'published', 'archived') DEFAULT 'draft'`
- `notes text`
- `created_at timestamptz`
- `updated_at timestamptz`

唯一约束：
- `UNIQUE(school_id, academic_year, application_level)`

### 5. school_events
每个申请周期中的关键日期事件

字段：
- `id uuid PK`
- `school_cycle_id uuid FK -> school_cycles.id NOT NULL`
- `event_type text NOT NULL`
  - 支持枚举：
    - `open_day`
    - `info_session`
    - `application_open`
    - `application_deadline`
    - `assessment`
    - `first_interview`
    - `second_interview`
    - `third_interview`
    - `result_release`
    - `registration`
    - `parent_meeting`
    - `waiting_list`
    - `other`
- `sequence_no int`
  - 用于一/二/三面或同类事件的排序
- `title_zh text`
- `title_en text`
- `start_at timestamptz`
- `end_at timestamptz`
- `all_day boolean DEFAULT true`
- `location text`
- `source_url text`
- `notes text`
- `created_at timestamptz`
- `updated_at timestamptz`

### 6. student_applications
某个学生申请某学校的某一年度

字段：
- `id uuid PK`
- `student_id uuid FK -> students.id NOT NULL`
- `school_cycle_id uuid FK -> school_cycles.id NOT NULL`
- `status text NOT NULL`
  - `planned`
  - `interested`
  - `applied`
  - `interviewing`
  - `waitlisted`
  - `offered`
  - `rejected`
  - `accepted`
  - `declined`
- `priority_order int`
- `applied_at timestamptz`
- `result_at timestamptz`
- `is_shortlisted boolean DEFAULT false`
- `notes text`
- `created_at timestamptz`
- `updated_at timestamptz`

唯一约束：
- `UNIQUE(student_id, school_cycle_id)`

### 7. student_application_progress
某个学生在某个申请中的每个节点的完成状态

字段：
- `id uuid PK`
- `student_application_id uuid FK -> student_applications.id NOT NULL`
- `school_event_id uuid FK -> school_events.id NOT NULL`
- `status text NOT NULL`
  - `pending`
  - `completed`
  - `skipped`
- `completed_at timestamptz`
- `reminder_at timestamptz`
- `notes text`
- `created_at timestamptz`
- `updated_at timestamptz`

唯一约束：
- `UNIQUE(student_application_id, school_event_id)`

## 三、与现有表的衔接策略
- 保留 `student_schools`，它可继续作为“学生候选学校清单”的轻量关系
- 新增的 `student_applications` 用于“正式申请进度”
- 短期可允许两套并存：
  - 看板展示继续走 `student_schools + school_tasks`
  - 新的“申请日历 / 关键节点管理”走 `school_cycles + school_events + student_applications`
- 后续可在 UI 层再慢慢统一

## 四、读取建议
### 1. 学校主数据
- 小学学校列表：从 `schools where application_level = 'primary'` 读取
- 按地区 / 学校类型 / 男女校 / 校网筛选

### 2. 某学校本年度节点
- 先找到目标 `school_cycle`（某学年）
- 再读取该 `school_cycle_id` 下的所有 `school_events`
- 按 `start_at` 与 `sequence_no` 排序显示

### 3. 某学生的申请总览
- 读 `student_applications where student_id = xxx`
- join `school_cycles` 与 `schools`
- 得到申请状态、志愿顺序、申请时间等

### 4. 某学生某申请的节点进度
- 先找到 `student_application_id`
- 再读 `student_application_progress` 与 `school_events`
- 得到该申请每个关键日期节点是否完成

## 五、权限策略（RLS）
- `schools` / `school_cycles` / `school_events`：公开可读，建议只允许后台写
- `user_profiles`：本人读写
- `students`：所属用户读写
- `student_applications`：所属学生所属用户读写
- `student_application_progress`：所属用户读写
