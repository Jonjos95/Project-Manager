-- Migration: Add Task Assignment, Ownership, and Dependency Fields
-- N8tive.io Project Manager - Collaboration Enhancement
-- Date: 2025-10-26

USE n8tive_project_manager;

-- Add assignee field (who the task is assigned to)
ALTER TABLE tasks
ADD COLUMN assignee VARCHAR(50) NULL DEFAULT NULL AFTER status;

-- Add assignee_name for performance (cached name)
ALTER TABLE tasks
ADD COLUMN assignee_name VARCHAR(100) NULL DEFAULT NULL AFTER assignee;

-- Add owner field (who created the task)
ALTER TABLE tasks
ADD COLUMN owner VARCHAR(50) NULL DEFAULT NULL AFTER assignee_name;

-- Add owner_name for performance (cached name)
ALTER TABLE tasks
ADD COLUMN owner_name VARCHAR(100) NULL DEFAULT NULL AFTER owner;

-- Add dependency field (task this depends on)
ALTER TABLE tasks
ADD COLUMN dependency VARCHAR(50) NULL DEFAULT NULL AFTER owner_name;

-- Add team_id field (team context)
ALTER TABLE tasks
ADD COLUMN team_id VARCHAR(50) NULL DEFAULT NULL AFTER dependency;

-- Add foreign keys
ALTER TABLE tasks
ADD CONSTRAINT fk_task_assignee
FOREIGN KEY (assignee) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tasks
ADD CONSTRAINT fk_task_owner
FOREIGN KEY (owner) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tasks
ADD CONSTRAINT fk_task_dependency
FOREIGN KEY (dependency) REFERENCES tasks(id) ON DELETE SET NULL;

-- Add indexes for performance
ALTER TABLE tasks
ADD INDEX idx_assignee (assignee);

ALTER TABLE tasks
ADD INDEX idx_owner (owner);

ALTER TABLE tasks
ADD INDEX idx_team_id (team_id);

ALTER TABLE tasks
ADD INDEX idx_dependency (dependency);

-- Show updated table structure
DESCRIBE tasks;

SELECT 'Migration completed successfully!' as Status;

