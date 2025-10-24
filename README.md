---
title: Project Manager
colorFrom: purple
colorTo: blue
emoji: 🧭
sdk: static
pinned: false
tags:
  - task-management
  - kanban
  - project-management
---

# N8tive.io Project Manager 🧭

A complete, responsive task management application built with HTML, Tailwind CSS, and Vanilla JavaScript.

## ✨ Features

- **Task CRUD Operations**: Add, edit, and delete tasks with localStorage persistence
- **Advanced Kanban Board**: Seven workflow stages (Backlog, To Do, In Progress, Review, Testing, Done, Archived) with drag-and-drop functionality
- **Detailed Ticket View**: Click any task to view complete metadata including creation date, last updated, completion date, and task ID
- **File Attachments**: Upload, download, and manage files attached to tasks (stored as base64 in localStorage)
- **Advanced Filters**: Filter by All, Backlog, To Do, In Progress, Review, Testing, Done, or Archived
- **Live Search**: Real-time keyword search across task titles and descriptions
- **Task Counters**: Real-time display of remaining and completed tasks
- **Dark Mode**: Toggle between light and dark themes with preference persistence
- **Responsive Design**: Fully responsive with horizontal scrolling Kanban board and collapsible sidebar on mobile
- **Smooth Animations**: Fade and slide transitions for enhanced UX
- **Priority Levels**: Low, Medium, and High priority indicators with color coding

##  Quick Start

Simply open `index.html` in your browser. No build process or dependencies required!

## 💾 Data Persistence

All tasks are automatically saved to `localStorage` under the key `n8tive.tasks`. Your data persists across browser sessions.

## 🎨 Tech Stack

- **HTML5**
- **Tailwind CSS** (CDN)
- **Vanilla JavaScript**
- **Feather Icons** (CDN)

## 📋 Task Schema

```json
{
  "id": "unique-id",
  "title": "Task title",
  "description": "Optional description",
  "priority": "low|med|high",
  "status": "backlog|todo|doing|review|testing|done|archived",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "completedAt": "ISO timestamp or null",
  "files": [
    {
      "id": "file-id",
      "name": "filename.ext",
      "size": 1024,
      "type": "mime-type",
      "data": "base64-encoded-data",
      "uploadedAt": "ISO timestamp"
    }
  ]
}
```

## 🎯 Usage

1. **Add Tasks**: Fill out the form, select initial status, and click "Add Task"
2. **View Task Details**: Click on any task card to open the detailed view with all metadata
3. **Edit Tasks**: Click the edit icon on any task card or use the Edit button in the detail view
4. **Delete Tasks**: Click the trash icon on any task card or use the Delete button in the detail view
5. **Move Tasks**: Drag and drop cards between columns (Backlog → To Do → In Progress → Review → Testing → Done → Archived)
6. **Attach Files**: Open task details and use the file upload area to attach documents, images, or any file type
7. **Download Files**: Click the download icon next to any attached file in the detail view
8. **Filter Tasks**: Use sidebar buttons to filter by specific stages or view all tasks
9. **Search Tasks**: Use the search bar to find specific tasks by title or description
10. **Toggle Dark Mode**: Click the dark mode toggle in the sidebar

##  Color Scheme

- Primary: #6b46c1 (Purple)
- Secondary: #4299e1 (Blue)

---

© 2025 N8tive.io. All rights reserved.
