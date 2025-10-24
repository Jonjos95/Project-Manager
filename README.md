---
title: N8tive.io Project Manager 🧭
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

- **Task CRUD Operations**: Add, edit (inline), and delete tasks with localStorage persistence
- **Kanban Board**: Three columns (To Do, In Progress, Done) with drag-and-drop functionality
- **Filters & Search**: Filter by All/Active/Completed and live keyword search
- **Task Counters**: Real-time display of remaining and completed tasks
- **Dark Mode**: Toggle between light and dark themes with preference persistence
- **Responsive Design**: Fully responsive with collapsible sidebar on mobile
- **Smooth Animations**: Fade and slide transitions for enhanced UX
- **Priority Levels**: Low, Medium, and High priority indicators

## 🚀 Quick Start

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
  "status": "todo|doing|done",
  "createdAt": "ISO timestamp",
  "completedAt": "ISO timestamp or null"
}
```

## 🎯 Usage

1. **Add Tasks**: Fill out the form and click "Add Task"
2. **Edit Tasks**: Click the edit icon on any task card
3. **Delete Tasks**: Click the trash icon on any task card
4. **Move Tasks**: Drag and drop cards between columns
5. **Filter Tasks**: Use sidebar buttons to filter by status
6. **Search Tasks**: Use the search bar to find specific tasks
7. **Toggle Dark Mode**: Click the dark mode toggle in the sidebar

## 🌈 Color Scheme

- Primary: #6b46c1 (Purple)
- Secondary: #4299e1 (Blue)

---

© 2025 N8tive.io. All rights reserved.
