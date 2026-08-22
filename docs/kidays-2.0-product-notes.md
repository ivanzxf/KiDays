# KiDays 2.0 Product Notes

## Product Direction

KiDays 2.0 should evolve from a primary-school application tracker into a parent-facing child schedule platform.

Core promise:
- One place to track school applications
- One place to enroll in activities and competitions
- One place to view a child's complete schedule

## Core Modules

After login, the product should gradually organize into these modules:

1. Overview
- Today / this week schedule
- Upcoming deadlines
- Recent additions and reminders

2. Calendar
- Unified calendar across all child-related items
- Includes applications, activities, and competitions

3. Applications
- Kindergarten applications
- Primary-school applications
- Future expansion: secondary / summer school / enrichment admissions

4. Activities
- Weekend activities
- Outdoor experiences
- Workshops
- Parent-child events

5. Competitions
- Sports
- Music
- Math
- English
- Other child competitions and assessments

6. Children
- Child profiles
- Age, gender, stage, interests, constraints

## Product Positioning

The system should not be treated as three isolated features.

Instead, it should be built as:
- Child profile
- Unified event system
- Unified enrollment / tracking system
- Unified calendar

This keeps the product modular and prevents separate logic stacks for school, activities, and competitions.

## Core Domain Model

### 1. Child
- Represents one child profile under a parent account
- Existing student profile logic can be evolved into this abstraction

Suggested fields:
- id
- parent_user_id
- name
- gender
- birth_year
- current_stage
- application_level_focus
- notes

### 2. Listing / Program
- A parent-facing item that can be tracked or enrolled in
- Can represent:
  - school application target
  - activity
  - competition

Suggested top-level type:
- `application`
- `activity`
- `competition`

### 3. Event
- A dated milestone under a listing / program
- This is the shared time-based building block for the entire system

Examples:
- application open
- deadline
- interview
- result release
- event day
- preliminary round
- final round

### 4. Child Enrollment / Tracking
- The relationship between a child and a listing / program

Examples:
- child is tracking a school
- child enrolled in an activity
- child enrolled in a competition

### 5. Calendar View Item
- A unified presentation layer based on child enrollments + dated events
- Goal: every relevant child event appears in one calendar

## Application Expansion Strategy

Kindergarten should be added by extending the existing school-application system rather than creating a separate parallel system.

Recommended approach:
- Keep shared school structure
- Extend `application_level`

Recommended values:
- `kindergarten`
- `primary`

This allows kindergarten and primary to share:
- schools
- cycles
- events
- child application records

## Unified Event Strategy

All future modules should align around:
- `category`
- `event_type`
- `date_status`

Recommended top-level categories:
- `application`
- `activity`
- `competition`

Keep `date_status`:
- `confirmed`
- `tbd`

This is already aligned with the current school-event structure and should remain a core rule.

## Dashboard Information Architecture

Recommended logged-in navigation:
- Overview
- Calendar
- Applications
- Activities
- Competitions
- Children

Recommended dashboard blocks:
- Today's schedule
- This week's upcoming items
- Application deadlines
- Upcoming activities
- Upcoming competitions
- Child quick summaries

## Monetization Direction

Recommended rollout order:

### Level 1: External referral
- Parents browse and click through to partner registration pages
- Revenue via referral / commission

### Level 2: On-platform registration
- Parents submit within KiDays
- KiDays forwards participant info to organizer

### Level 3: On-platform payment
- Later stage only
- Avoid introducing payment complexity too early

## Delivery Phases

### Phase 1: Unified application + calendar foundation
- Keep existing primary application logic
- Add kindergarten application level
- Build unified child calendar
- Show school-related milestones in one place

Primary goal:
- Build habit: parents check KiDays daily

### Phase 2: Activities
- Add partner activity listings
- Parent can enroll or register interest
- Enrolled activities appear in child calendar
- Start with non-payment or semi-manual fulfillment

Primary goal:
- Add monetizable daily-use content

### Phase 3: Competitions
- Reuse activity-style listing architecture
- Add competition-specific event nodes
- Add registration deadlines and schedule visibility

Primary goal:
- Expand KiDays into a broader child growth and schedule platform

## Immediate Design Principle

Before building more UI, keep these three artifacts aligned:

1. Unified data model
- child
- school application
- listing / program
- event
- enrollment / tracking

2. Logged-in information architecture
- dashboard
- calendar
- applications
- activities
- competitions
- children

3. Minimum viable flows
- track school -> show milestones
- enroll activity -> show in calendar
- enroll competition -> show in calendar

## Current Working Decision

For now, KiDays should continue to optimize the current primary-school workflow while preserving a clean path toward:
- kindergarten support
- activity listings
- competition listings
- one unified child calendar

This note should be treated as the starting point for KiDays 2.0 planning.
