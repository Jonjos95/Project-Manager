# Component Architecture

This directory contains the modular JavaScript components for the N8tive.io Project Manager.

## Overview

The application has been refactored from a monolithic 1,929-line `script.js` into **6 specialized modules** for better maintainability, testing, and scalability.

---

## Component Structure

### 1. **auth.js** - Authentication Manager
**Responsibility:** User authentication and session management

**Features:**
- User registration and login
- Password hashing (client-side)
- Session persistence in localStorage
- User profile management
- Logout functionality

**Key Methods:**
- `handleRegister()` - Register new user
- `handleLogin()` - Authenticate user
- `logout()` - End session
- `isAuthenticated()` - Check auth status
- `getCurrentUser()` - Get logged-in user

---

### 2. **methodology-manager.js** - Project Methodology Manager
**Responsibility:** Handle different project management frameworks

**Features:**
- Support for 5 methodologies:
  - Kanban (7 stages)
  - Scrum (6 stages)
  - Waterfall (6 stages)
  - Lean (3 stages)
  - Simple (3 stages)
- Methodology switching
- Task status migration
- Methodology persistence

**Key Methods:**
- `changeMethodology()` - Switch framework
- `migrateTaskStatus()` - Migrate task statuses
- `getStatuses()` - Get current statuses
- `getStatusById()` - Lookup status details

---

### 3. **task-manager.js** - Task Management
**Responsibility:** All task CRUD operations and data persistence

**Features:**
- Task creation, reading, updating, deletion
- Row-level security (user-specific tasks)
- File attachments
- Activity logging
- Task filtering and search
- Data import/export
- LocalStorage persistence

**Key Methods:**
- `addTask()` - Create new task
- `updateTask()` - Modify task
- `deleteTask()` - Remove task
- `getFilteredTasks()` - Get tasks by filter
- `addFileToTask()` - Attach file
- `logActivity()` - Record activity
- `exportTasks()` / `importTasks()` - Data portability

---

### 4. **ui-controller.js** - UI State Management
**Responsibility:** Handle all UI interactions and state

**Features:**
- Theme management (light/dark mode)
- Sidebar collapse/expand
- Modal management
- View switching (Board, Analytics, Timeline, Reports)
- Dropdown menus
- Mobile menu
- Toast notifications

**Key Methods:**
- `toggleTheme()` - Switch theme
- `showView()` - Change view
- `showModal()` / `hideModal()` - Modal control
- `showToast()` - Show notification
- `toggleSidebarCollapse()` - Toggle sidebar

---

### 5. **kanban-board.js** - Kanban Board Renderer
**Responsibility:** Render and manage the Kanban board

**Features:**
- Dynamic board rendering
- Drag-and-drop task management
- Task card creation
- Column management
- Filter UI updates
- Task detail modals

**Key Methods:**
- `render()` - Render entire board
- `renderTasks()` - Populate tasks
- `handleDragStart()` / `handleDrop()` - Drag & drop
- `showTaskDetail()` - Show task modal
- `editTask()` / `deleteTask()` - Task actions
- `setFilter()` - Apply filter

---

### 6. **analytics.js** - Analytics & Reporting
**Responsibility:** Data visualization and metrics

**Features:**
- Key metrics calculation
- Chart.js integration (3 charts):
  - Status distribution (doughnut)
  - Priority breakdown (bar)
  - Completion trend (line)
- Timeline view
- Activity logging display
- Report generation (3 types):
  - Productivity report
  - Team report
  - Milestone report
- Data export (JSON, CSV)

**Key Methods:**
- `renderAnalytics()` - Render dashboard
- `calculateMetrics()` - Compute KPIs
- `renderCharts()` - Draw charts
- `renderTimeline()` - Show timeline
- `generateReport()` - Create report
- `exportReport()` - Export data

---

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│           script-new.js (App)               │
│         Main Application Controller          │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐      ┌──────────────────┐
│   auth.js    │──────│ methodology-    │
│ AuthManager  │      │    manager.js   │
└──────────────┘      │MethodologyMgr   │
        │             └──────────────────┘
        │                       │
        ▼                       ▼
┌──────────────────────────────────────┐
│      task-manager.js                 │
│      TaskManager                     │
│  (Depends on Auth & Methodology)     │
└──────────────────────────────────────┘
        │
    ┌───┴────┬──────────────┐
    │        │              │
    ▼        ▼              ▼
┌────────┐ ┌────────┐ ┌──────────┐
│kanban- │ │ui-     │ │analytics │
│board.js│ │ctrl.js │ │.js       │
│Kanban  │ │UI      │ │Analytics │
│Board   │ │Ctrl    │ │          │
└────────┘ └────────┘ └──────────┘
```

---

## Data Flow

### Task Creation Flow:
```
1. User fills form (UI)
2. App.handleAddTask() called
3. TaskManager.addTask() creates task
4. TaskManager.saveTasks() persists to localStorage
5. TaskManager.logActivity() records action
6. KanbanBoard.render() updates UI
```

### Authentication Flow:
```
1. User enters credentials
2. AuthManager.handleLogin() validates
3. AuthManager.saveSession() persists session
4. App.initializeAfterLogin() initializes modules
5. TaskManager loads user-specific tasks
6. UI updates with user info
```

### Methodology Switch Flow:
```
1. User selects methodology
2. MethodologyManager.changeMethodology()
3. MethodologyManager.migrateTaskStatus() for each task
4. TaskManager.updateTask() updates tasks
5. MethodologyManager.updateStatusSelectors() updates forms
6. KanbanBoard.render() rebuilds board
```

---

## Benefits of Modularization

### 1. **Maintainability** ✅
- Each module has a single responsibility
- Easy to locate and fix bugs
- Clear boundaries between features

### 2. **Testability** ✅
- Each module can be tested independently
- Mocking dependencies is straightforward
- Unit tests can target specific functionality

### 3. **Scalability** ✅
- Easy to add new features
- Modules can be extended without affecting others
- New methodologies can be added easily

### 4. **Reusability** ✅
- Modules can be reused in other projects
- Authentication logic is self-contained
- UI components are independent

### 5. **Collaboration** ✅
- Multiple developers can work on different modules
- Reduced merge conflicts
- Clear ownership of features

### 6. **Performance** ✅
- Lazy loading potential
- Selective module loading
- Better code splitting opportunities

---

## File Size Comparison

| File | Lines | Description |
|------|-------|-------------|
| **OLD: script.js** | 1,929 | Monolithic file |
| **NEW: Total** | ~1,950 | Across 7 files |
| auth.js | 260 | Authentication |
| methodology-manager.js | 185 | Methodologies |
| task-manager.js | 385 | Task CRUD |
| ui-controller.js | 280 | UI management |
| kanban-board.js | 335 | Board rendering |
| analytics.js | 480 | Analytics |
| script-new.js | 325 | Main controller |

---

## Usage in HTML

Load modules in order (dependencies first):

```html
<!-- Component Modules -->
<script src="components/auth.js"></script>
<script src="components/methodology-manager.js"></script>
<script src="components/task-manager.js"></script>
<script src="components/ui-controller.js"></script>
<script src="components/kanban-board.js"></script>
<script src="components/analytics.js"></script>

<!-- Main Application Controller -->
<script src="script-new.js"></script>
```

---

## Future Enhancements

### Potential Improvements:
1. **TypeScript** - Add type safety
2. **Module Bundler** - Use Webpack/Rollup
3. **ES6 Modules** - Convert to import/export
4. **Service Workers** - Offline support
5. **Web Components** - Custom elements
6. **State Management** - Redux/Vuex pattern
7. **API Integration** - Replace localStorage
8. **WebSocket** - Real-time collaboration

---

## Development Guidelines

### Adding a New Module:
1. Create `components/new-module.js`
2. Define class with constructor
3. Implement required methods
4. Add to `index.html` before `script-new.js`
5. Initialize in `App` constructor
6. Document in this README

### Modifying a Module:
1. Keep single responsibility
2. Don't add dependencies unnecessarily
3. Update method signatures carefully
4. Document breaking changes
5. Test thoroughly

---

## Testing

### Manual Testing Checklist:
- [ ] User can register
- [ ] User can login/logout
- [ ] Tasks can be created
- [ ] Tasks can be edited
- [ ] Tasks can be deleted
- [ ] Drag-and-drop works
- [ ] Filters work
- [ ] Search works
- [ ] Methodology switching works
- [ ] Analytics render correctly
- [ ] Timeline shows activity
- [ ] Dark mode works
- [ ] Sidebar collapse works
- [ ] Data export works
- [ ] Data import works

---

## Troubleshooting

### Module not found:
- Check script load order in `index.html`
- Ensure all files are in `components/` directory

### Function not defined:
- Check global function wrappers in `script-new.js`
- Verify method exists in module

### Data not persisting:
- Check localStorage in browser DevTools
- Verify `saveTasks()` is called after changes

### UI not updating:
- Call `board.render()` after data changes
- Call `ui.refreshIcons()` after DOM changes

---

**This modular architecture provides a solid foundation for future development and maintenance!** 🚀

