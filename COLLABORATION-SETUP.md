# Collaborative Features Setup Guide

## Overview

N8tive.io Project Manager now supports **team collaboration** features, allowing users to:
- Create and manage teams
- Invite members with role-based permissions
- Share tasks across teams
- Switch between personal and team workspaces

---

## Database Setup

### 1. Run the Teams Schema Migration

Connect to your MySQL database and run the migration:

```bash
mysql -h your-rds-endpoint.rds.amazonaws.com -u your_username -p your_database < backend/teams-schema.sql
```

Or execute directly via SSH on EC2:

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
cd ~/Project-Manager/backend
mysql -h your-rds-endpoint -u your_username -p your_database < teams-schema.sql
```

This creates 4 new tables:
- `teams` - Team/project information
- `team_members` - User memberships with roles
- `team_invitations` - Pending invitations (future use)
- Updates `tasks` table with `team_id` column

---

## Backend API Endpoints

### Team Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | Get all teams for current user |
| POST | `/api/teams` | Create new team |
| GET | `/api/teams/:id` | Get team details |
| DELETE | `/api/teams/:id` | Delete team (owner only) |

### Team Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams/:id/members` | Get team members |
| POST | `/api/teams/:id/invite` | Invite user to team |
| PUT | `/api/teams/:id/members/:userId` | Update member role |
| DELETE | `/api/teams/:id/members/:userId` | Remove member |
| POST | `/api/teams/:id/leave` | Leave team |

### Task Sharing

Tasks now support a `team_id` field:
- When creating a task, optionally include `teamId` in the request body
- Tasks without `team_id` are personal tasks
- Tasks with `team_id` are visible to all team members

**Example:**
```javascript
// Create personal task
POST /api/tasks
{
  "title": "My Task",
  "status": "todo",
  "priority": "med"
}

// Create team task
POST /api/tasks
{
  "title": "Team Task",
  "status": "todo",
  "priority": "high",
  "teamId": 1
}
```

---

## User Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full control: manage members, edit team, delete team |
| **Admin** | Manage members, invite users |
| **Member** | Create/edit/delete team tasks |
| **Viewer** | View team tasks only |

---

## Frontend Features

### Team Switcher

Located in the header next to the logo:
- **Personal** - Your private workspace
- **Teams** - Switch to any team you're a member of
- **Create Team** - Start a new team

### Task Assignment

When creating a task:
- Select "Personal" to create a private task
- Select a team name to create a team task visible to all members

---

##  Deployment

### Backend Restart

After running the database migration, restart the backend:

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
cd ~/backend
pm2 restart server
```

### Frontend Deployment

The frontend is already configured. Just deploy as usual:

```bash
cd ~/Project-Manager
git pull origin main
./deploy-frontend.sh
```

---

## Usage Example

### 1. Create a Team

1. Click the team switcher button (next to logo)
2. Click "Create Team"
3. Enter team name and description
4. Click "Create"

### 2. Invite Members

1. Select the team from switcher
2. Go to Settings → Teams
3. Enter member's email address
4. Select their role (Admin/Member/Viewer)
5. Click "Invite"

### 3. Create Team Tasks

1. Switch to the team workspace
2. Use "Quick Add Task" form
3. Task will automatically be assigned to the active team
4. All team members can see and collaborate on the task

---

## Security

- ✅ Row-level security enforced at database level
- ✅ JWT authentication required for all endpoints
- ✅ Team membership verified before showing tasks
- ✅ Role-based permissions for team management
- ✅ Owner cannot be removed or have role changed

---

## Future Enhancements

- Email invitations with accept/decline
- Real-time collaboration with WebSockets
- Task comments and activity streams
- File sharing within teams
- Team-level analytics and reports
- Slack/Discord integrations

---

## Troubleshooting

**Issue:** Can't see team tasks
- Verify you're a member of the team
- Check team switcher is set to correct team
- Refresh the page

**Issue:** Can't invite users
- Verify the user has an account (email must exist)
- Check you have Admin or Owner role
- Verify user isn't already a member

**Issue:** Database migration fails
- Check MySQL version (requires 5.7+)
- Verify you have ALTER TABLE permissions
- Ensure all foreign key tables exist

---

🎉 **Your app now supports team collaboration!**

