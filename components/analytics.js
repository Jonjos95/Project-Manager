// Analytics Module
// Handles analytics, metrics, charts, and reporting

class Analytics {
    constructor(taskManager, methodologyManager) {
        this.taskManager = taskManager;
        this.methodologyManager = methodologyManager;
        this.charts = {};
    }

    // Render analytics dashboard
    renderAnalytics() {
        this.calculateMetrics();
        this.renderCharts();
        this.renderStageAnalytics();
    }

    // Calculate key metrics
    calculateMetrics() {
        const tasks = this.taskManager.getAllTasks();
        const counts = this.taskManager.getTaskCounts();
        
        // Total tasks
        const totalTasksEl = document.getElementById('totalTasksMetric');
        if (totalTasksEl) totalTasksEl.textContent = counts.total;
        
        // Completion rate
        const completionRate = counts.total > 0 
            ? Math.round((counts.completed / counts.total) * 100) 
            : 0;
        const completionRateEl = document.getElementById('completionRateMetric');
        if (completionRateEl) completionRateEl.textContent = `${completionRate}%`;
        
        // Average completion time
        const completedTasks = tasks.filter(t => t.completedAt);
        let avgTime = 0;
        
        if (completedTasks.length > 0) {
            const totalTime = completedTasks.reduce((sum, task) => {
                const created = new Date(task.createdAt);
                const completed = new Date(task.completedAt);
                return sum + (completed - created);
            }, 0);
            
            avgTime = Math.round(totalTime / completedTasks.length / (1000 * 60 * 60 * 24)); // Days
        }
        
        const avgCompletionEl = document.getElementById('avgCompletionMetric');
        if (avgCompletionEl) avgCompletionEl.textContent = `${avgTime}d`;
        
        // Active tasks
        const activeTasksEl = document.getElementById('activeTasksMetric');
        if (activeTasksEl) activeTasksEl.textContent = counts.active;
    }

    // Render all charts
    renderCharts() {
        this.renderStatusDistributionChart();
        this.renderPriorityBreakdownChart();
        this.renderCompletionTrendChart();
    }

    // Status distribution doughnut chart
    renderStatusDistributionChart() {
        const ctx = document.getElementById('statusDistributionChart');
        if (!ctx) return;
        
        const statuses = this.methodologyManager.getStatuses();
        const tasks = this.taskManager.getAllTasks();
        
        const data = statuses.map(status => ({
            label: status.name,
            value: tasks.filter(t => t.status === status.id).length,
            color: this.getStatusColor(status.color)
        }));
        
        // Destroy existing chart
        if (this.charts.statusDistribution) {
            this.charts.statusDistribution.destroy();
        }
        
        // Create new chart
        this.charts.statusDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.label),
                datasets: [{
                    data: data.map(d => d.value),
                    backgroundColor: data.map(d => d.color),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Priority breakdown bar chart
    renderPriorityBreakdownChart() {
        const ctx = document.getElementById('priorityBreakdownChart');
        if (!ctx) return;
        
        const tasks = this.taskManager.getAllTasks();
        
        const priorities = [
            { id: 'high', label: 'High', color: '#ef4444' },
            { id: 'med', label: 'Medium', color: '#eab308' },
            { id: 'low', label: 'Low', color: '#22c55e' }
        ];
        
        const data = priorities.map(p => ({
            label: p.label,
            value: tasks.filter(t => t.priority === p.id).length,
            color: p.color
        }));
        
        // Destroy existing chart
        if (this.charts.priorityBreakdown) {
            this.charts.priorityBreakdown.destroy();
        }
        
        // Create new chart
        this.charts.priorityBreakdown = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.label),
                datasets: [{
                    label: 'Tasks by Priority',
                    data: data.map(d => d.value),
                    backgroundColor: data.map(d => d.color),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Completion trend line chart
    renderCompletionTrendChart() {
        const ctx = document.getElementById('completionTrendChart');
        if (!ctx) return;
        
        const tasks = this.taskManager.getAllTasks();
        const completedTasks = tasks.filter(t => t.completedAt).sort((a, b) => 
            new Date(a.completedAt) - new Date(b.completedAt)
        );
        
        // Group by date
        const dateGroups = {};
        completedTasks.forEach(task => {
            const date = new Date(task.completedAt).toLocaleDateString();
            dateGroups[date] = (dateGroups[date] || 0) + 1;
        });
        
        // Get last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toLocaleDateString());
        }
        
        const data = last7Days.map(date => ({
            date,
            count: dateGroups[date] || 0
        }));
        
        // Destroy existing chart
        if (this.charts.completionTrend) {
            this.charts.completionTrend.destroy();
        }
        
        // Create new chart
        this.charts.completionTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    label: 'Completed Tasks',
                    data: data.map(d => d.count),
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Render stage analytics table
    renderStageAnalytics() {
        const tbody = document.getElementById('stageAnalyticsBody');
        if (!tbody) return;
        
        const statuses = this.methodologyManager.getStatuses();
        const tasks = this.taskManager.getAllTasks();
        
        tbody.innerHTML = statuses.map(status => {
            const statusTasks = tasks.filter(t => t.status === status.id);
            const count = statusTasks.length;
            const avgTime = this.calculateAvgTimeInStatus(statusTasks, status.id);
            
            return `
                <tr class="border-b border-gray-200 dark:border-gray-700">
                    <td class="px-4 py-3">
                        <div class="flex items-center space-x-2">
                            <i data-feather="${status.icon}" class="w-4 h-4"></i>
                            <span>${status.name}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3">${count}</td>
                    <td class="px-4 py-3">${avgTime}d</td>
                    <td class="px-4 py-3">
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div class="bg-purple-600 h-2 rounded-full" 
                                 style="width: ${tasks.length > 0 ? (count / tasks.length * 100) : 0}%"></div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Update Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    // Calculate average time in status
    calculateAvgTimeInStatus(tasks, statusId) {
        if (tasks.length === 0) return 0;
        
        // For simplicity, calculate time from creation to now for active tasks
        const totalTime = tasks.reduce((sum, task) => {
            const created = new Date(task.createdAt);
            const now = new Date();
            return sum + (now - created);
        }, 0);
        
        return Math.round(totalTime / tasks.length / (1000 * 60 * 60 * 24)); // Days
    }

    // Get color for status
    getStatusColor(color) {
        const colors = {
            gray: '#6b7280',
            blue: '#3b82f6',
            yellow: '#eab308',
            purple: '#8b5cf6',
            green: '#22c55e',
            orange: '#f97316',
            red: '#ef4444'
        };
        
        return colors[color] || colors.gray;
    }

    // Render timeline view
    renderTimeline() {
        const container = document.getElementById('timelineContainer');
        if (!container) return;
        
        const activityLog = this.taskManager.getActivityLog(20);
        
        if (activityLog.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No activity yet</p>';
            return;
        }
        
        container.innerHTML = activityLog.map(activity => {
            const icon = activity.action === 'created' ? 'plus-circle' :
                        activity.action === 'updated' ? 'edit' :
                        activity.action === 'deleted' ? 'trash-2' :
                        'arrow-right';
            
            const color = activity.action === 'created' ? 'text-green-500' :
                         activity.action === 'deleted' ? 'text-red-500' :
                         'text-blue-500';
            
            return `
                <div class="flex space-x-4 mb-6">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full bg-white dark:bg-gray-700 border-2 border-purple-500 flex items-center justify-center ${color}">
                            <i data-feather="${icon}" class="w-5 h-5"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                            <p class="font-medium text-gray-800 dark:text-white">${activity.taskTitle}</p>
                            <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">${activity.details}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${this.formatRelativeTime(activity.timestamp)}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Update Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    // Format relative time
    formatRelativeTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    }

    // Render reports view
    renderReports() {
        this.renderActivityLog();
    }

    // Render activity log
    renderActivityLog() {
        const container = document.getElementById('activityLogContainer');
        if (!container) return;
        
        const activityLog = this.taskManager.getActivityLog(50);
        
        if (activityLog.length === 0) {
            container.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-500">No activity yet</td></tr>';
            return;
        }
        
        container.innerHTML = activityLog.map(activity => `
            <tr class="border-b border-gray-200 dark:border-gray-700">
                <td class="px-4 py-3">${new Date(activity.timestamp).toLocaleString()}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs rounded ${
                        activity.action === 'created' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        activity.action === 'deleted' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }">
                        ${activity.action}
                    </span>
                </td>
                <td class="px-4 py-3">${activity.taskTitle}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">${activity.details}</td>
            </tr>
        `).join('');
    }

    // Generate report
    generateReport(reportType) {
        const tasks = this.taskManager.getAllTasks();
        
        let report = {};
        
        switch (reportType) {
            case 'productivity':
                report = this.generateProductivityReport(tasks);
                break;
            case 'team':
                report = this.generateTeamReport(tasks);
                break;
            case 'milestone':
                report = this.generateMilestoneReport(tasks);
                break;
            default:
                return null;
        }
        
        this.showReportSummary(report, reportType);
        return report;
    }

    // Generate productivity report
    generateProductivityReport(tasks) {
        const counts = this.taskManager.getTaskCounts();
        const completedTasks = tasks.filter(t => t.completedAt);
        
        let avgCompletionTime = 0;
        if (completedTasks.length > 0) {
            const totalTime = completedTasks.reduce((sum, task) => {
                return sum + (new Date(task.completedAt) - new Date(task.createdAt));
            }, 0);
            avgCompletionTime = totalTime / completedTasks.length / (1000 * 60 * 60 * 24);
        }
        
        return {
            title: 'Productivity Report',
            totalTasks: counts.total,
            completedTasks: counts.completed,
            activeTasks: counts.active,
            completionRate: counts.total > 0 ? (counts.completed / counts.total * 100).toFixed(1) : 0,
            avgCompletionTime: avgCompletionTime.toFixed(1),
            velocity: this.calculateVelocity(completedTasks)
        };
    }

    // Generate team report (single user for now)
    generateTeamReport(tasks) {
        return {
            title: 'Team Report',
            totalMembers: 1,
            totalTasks: tasks.length,
            tasksPerMember: tasks.length
        };
    }

    // Generate milestone report
    generateMilestoneReport(tasks) {
        const statuses = this.methodologyManager.getStatuses();
        const milestones = statuses.map(status => ({
            name: status.name,
            tasks: tasks.filter(t => t.status === status.id).length
        }));
        
        return {
            title: 'Milestone Report',
            milestones,
            totalMilestones: statuses.length
        };
    }

    // Calculate velocity (tasks completed per week)
    calculateVelocity(completedTasks) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentCompleted = completedTasks.filter(t => 
            new Date(t.completedAt) >= oneWeekAgo
        );
        
        return recentCompleted.length;
    }

    // Show report summary
    showReportSummary(report, type) {
        const summary = document.getElementById('reportSummary');
        if (!summary) return;
        
        let html = `<h4 class="font-semibold mb-4">${report.title}</h4>`;
        
        if (type === 'productivity') {
            html += `
                <div class="space-y-2">
                    <p><strong>Total Tasks:</strong> ${report.totalTasks}</p>
                    <p><strong>Completed:</strong> ${report.completedTasks}</p>
                    <p><strong>Active:</strong> ${report.activeTasks}</p>
                    <p><strong>Completion Rate:</strong> ${report.completionRate}%</p>
                    <p><strong>Avg Completion Time:</strong> ${report.avgCompletionTime} days</p>
                    <p><strong>Weekly Velocity:</strong> ${report.velocity} tasks/week</p>
                </div>
            `;
        }
        
        summary.innerHTML = html;
        summary.classList.remove('hidden');
    }

    // Export report
    exportReport(format) {
        const report = this.generateReport('productivity');
        
        if (format === 'json') {
            const data = JSON.stringify(report, null, 2);
            this.downloadFile('report.json', data, 'application/json');
        } else if (format === 'csv') {
            const csv = this.generateCSV(report);
            this.downloadFile('report.csv', csv, 'text/csv');
        }
    }

    // Generate CSV from report
    generateCSV(report) {
        let csv = 'Metric,Value\n';
        Object.entries(report).forEach(([key, value]) => {
            if (typeof value !== 'object') {
                csv += `${key},${value}\n`;
            }
        });
        return csv;
    }

    // Download file
    downloadFile(filename, content, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Analytics;
}

