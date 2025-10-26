-- Migration: Custom Stages and Milestones for Teams
-- N8tive.io Project Manager - Custom Workflow Enhancement
-- Date: 2025-10-26

USE n8tive_project_manager;

-- Custom workflow stages table (team-specific stages)
CREATE TABLE IF NOT EXISTS team_stages (
    id VARCHAR(50) PRIMARY KEY,
    team_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT 'gray',
    order_index INT NOT NULL DEFAULT 0,
    is_initial BOOLEAN DEFAULT FALSE,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_team_id (team_id),
    INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Milestones table (major checkpoints in projects)
CREATE TABLE IF NOT EXISTS milestones (
    id VARCHAR(50) PRIMARY KEY,
    team_id VARCHAR(50) NULL,
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    handoff_to VARCHAR(50) NULL,  -- User to handoff tasks to after completion
    handoff_stage VARCHAR(50) NULL,  -- Stage to move tasks to after completion
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (handoff_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_team_id (team_id),
    INDEX idx_user_id (user_id),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Task milestones association (link tasks to milestones)
CREATE TABLE IF NOT EXISTS task_milestones (
    task_id VARCHAR(50) NOT NULL,
    milestone_id VARCHAR(50) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, milestone_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE,
    INDEX idx_milestone_id (milestone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add milestone_id to tasks table for quick reference
ALTER TABLE tasks
ADD COLUMN milestone_id VARCHAR(50) NULL DEFAULT NULL AFTER dependency;

ALTER TABLE tasks
ADD INDEX idx_milestone_id (milestone_id);

-- Show updated table structures
DESCRIBE team_stages;
DESCRIBE milestones;
DESCRIBE task_milestones;
DESCRIBE tasks;

SELECT 'Migration completed successfully!' as Status;

