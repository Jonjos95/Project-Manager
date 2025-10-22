class ProjectVisualization extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        .visualization-container {
          background: rgba(255, 255, 255, 0.7);
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.4);
        }
.tabs {
          display: flex;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 1.5rem;
        }
        .tab {
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          font-weight: 500;
          color: #64748b;
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;
        }
        .tab.active {
          color: #6b46c1;
          border-bottom-color: #6b46c1;
          background: linear-gradient(to right, rgba(107, 70, 193, 0.1), transparent);
        }
        .tab:hover:not(.active) {
          color: #8a63d2;
        }
.visualization-content {
          min-height: 300px;
        }
        .kanban-board {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding-bottom: 1rem;
        }
        .kanban-column {
          min-width: 280px;
          background: rgba(248, 250, 252, 0.6);
          border-radius: 12px;
          padding: 1rem;
          border: 1px solid rgba(226, 232, 240, 0.5);
          backdrop-filter: blur(5px);
        }
.column-header {
          font-weight: 600;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .kanban-task {
          background: rgba(255, 255, 255, 0.8);
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 0.75rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.03);
          cursor: move;
          transition: transform 0.2s, box-shadow 0.2s;
          border: 1px solid rgba(226, 232, 240, 0.5);
        }
.waterfall-chart {
          height: 400px;
          position: relative;
          border-left: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }
        .phase {
          position: absolute;
          background: rgba(107, 70, 193, 0.1);
          border-left: 3px solid #6b46c1;
          padding: 0.75rem;
          border-radius: 4px;
          transition: all 0.3s ease;
          backdrop-filter: blur(2px);
        }
        .phase:hover {
          background: rgba(107, 70, 193, 0.2);
        }
.phase-name {
          font-weight: 600;
          color: #6b46c1;
        }
        .phase-period {
          font-size: 0.75rem;
          color: #64748b;
        }
      </style>
      <div class="visualization-container">
        <div class="tabs">
          <div class="tab active" data-view="kanban">Kanban</div>
          <div class="tab" data-view="waterfall">Waterfall</div>
          <div class="tab" data-view="gantt">Gantt Chart</div>
        </div>
        <div class="visualization-content">
          <!-- Kanban Board -->
          <div class="kanban-board" data-view-content="kanban">
            <div class="kanban-column">
              <div class="column-header">
                <span>To Do</span>
                <span class="text-sm text-gray-500">2 tasks</span>
              </div>
              <div class="kanban-task" draggable="true">
                <div>Create project requirements</div>
              </div>
              <div class="kanban-task" draggable="true">
                <div>Design UI mockups</div>
              </div>
            </div>
            <div class="kanban-column">
              <div class="column-header">
                <span>In Progress</span>
                <span class="text-sm text-gray-500">1 task</span>
              </div>
              <div class="kanban-task" draggable="true">
                <div>Develop core features</div>
              </div>
            </div>
            <div class="kanban-column">
              <div class="column-header">
                <span>Review</span>
                <span class="text-sm text-gray-500">0 tasks</span>
              </div>
            </div>
            <div class="kanban-column">
              <div class="column-header">
                <span>Done</span>
                <span class="text-sm text-gray-500">3 tasks</span>
              </div>
              <div class="kanban-task" draggable="true">
                <div>Project kickoff</div>
              </div>
              <div class="kanban-task" draggable="true">
                <div>Initial research</div>
              </div>
              <div class="kanban-task" draggable="true">
                <div>Team setup</div>
              </div>
            </div>
          </div>

          <!-- Waterfall Chart -->
          <div class="waterfall-chart" style="display: none;" data-view-content="waterfall">
            <div class="phase" style="left: 0%; width: 20%; top: 20px; height: 50px;">
              <div class="phase-name">Planning</div>
              <div class="phase-period">Week 1-2</div>
            </div>
            <div class="phase" style="left: 20%; width: 25%; top: 20px; height: 80px;">
              <div class="phase-name">Design</div>
              <div class="phase-period">Week 3-5</div>
            </div>
            <div class="phase" style="left: 45%; width: 30%; top: 20px; height: 120px;">
              <div class="phase-name">Development</div>
              <div class="phase-period">Week 6-9</div>
            </div>
            <div class="phase" style="left: 75%; width: 15%; top: 20px; height: 60px;">
              <div class="phase-name">Testing</div>
              <div class="phase-period">Week 10</div>
            </div>
            <div class="phase" style="left: 90%; width: 10%; top: 20px; height: 40px;">
              <div class="phase-name">Launch</div>
              <div class="phase-period">Week 11</div>
            </div>
          </div>

          <!-- Gantt Chart -->
          <div style="display: none;" data-view-content="gantt">
            Gantt chart will be implemented here
          </div>
        </div>
      </div>
    `;

    // Tab switching functionality
    this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.shadowRoot.querySelector('.tab.active').classList.remove('active');
        tab.classList.add('active');
        
        const view = tab.dataset.view;
        this.shadowRoot.querySelectorAll('[data-view-content]').forEach(content => {
          content.style.display = 'none';
        });
        this.shadowRoot.querySelector(`[data-view-content="${view}"]`).style.display = 'block';
      });
    });

    // Drag and drop for Kanban
    const kanbanTasks = this.shadowRoot.querySelectorAll('.kanban-task');
    kanbanTasks.forEach(task => {
      task.addEventListener('dragstart', () => {
        task.classList.add('dragging');
      });
      task.addEventListener('dragend', () => {
        task.classList.remove('dragging');
      });
    });

    const columns = this.shadowRoot.querySelectorAll('.kanban-column');
    columns.forEach(column => {
      column.addEventListener('dragover', e => {
        e.preventDefault();
        const draggingTask = this.shadowRoot.querySelector('.dragging');
        column.appendChild(draggingTask);
      });
    });
  }
}
customElements.define('project-visualization', ProjectVisualization);