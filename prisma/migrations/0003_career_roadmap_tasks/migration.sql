-- Persist user progress through generated, goal-specific preparation roadmaps.
CREATE TABLE career_roadmap_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES career_goals(id) ON DELETE CASCADE,
  task_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skill_key TEXT NOT NULL,
  module TEXT NOT NULL,
  phase TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT career_roadmap_tasks_goal_task_unique UNIQUE(goal_id, task_key),
  CONSTRAINT career_roadmap_tasks_status_check CHECK (status IN ('todo', 'in_progress', 'completed'))
);
CREATE INDEX career_roadmap_tasks_goal_order_idx ON career_roadmap_tasks(goal_id, sort_order);
