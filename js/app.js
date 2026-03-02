class CicadaApp {
    constructor() {
        this.tasks = [];
        this.tags = new Set();
        this.currentFilter = 'all';
        this.currentTag = null;
        this.searchTerm = '';
        
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.render();
    }

    loadTasks() {
        const saved = localStorage.getItem('cicada-tasks');
        if (saved) {
            this.tasks = JSON.parse(saved);
            this.updateTags();
        }
    }

    saveTasks() {
        localStorage.setItem('cicada-tasks', JSON.stringify(this.tasks));
        this.updateTags();
    }

    updateTags() {
        this.tags.clear();
        this.tasks.forEach(task => {
            if (task.tags) {
                task.tags.forEach(tag => this.tags.add(tag));
            }
        });
    }

    setupEventListeners() {
        // Filter clicks
        document.querySelectorAll('.filters li').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.filters li').forEach(li => li.classList.remove('active'));
                item.classList.add('active');
                this.currentFilter = item.dataset.filter;
                this.currentTag = null;
                document.getElementById('current-view').textContent = item.textContent.trim();
                this.render();
            });
        });

        // Add task button
        document.getElementById('add-task-btn').addEventListener('click', () => {
            document.getElementById('task-form-container').style.display = 'block';
            document.getElementById('task-title').focus();
        });

        // Cancel task button
        document.getElementById('cancel-task-btn').addEventListener('click', () => {
            document.getElementById('task-form-container').style.display = 'none';
            document.getElementById('task-form').reset();
        });

        // Task form submit
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTask();
        });

        // Search input
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.render();
        });

        // Add tag button
        document.getElementById('add-tag-btn').addEventListener('click', () => {
            const tagName = prompt('Enter tag name:');
            if (tagName && tagName.trim()) {
                this.tags.add(tagName.trim());
                this.renderTags();
            }
        });
    }

    createTask() {
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const priority = document.getElementById('task-priority').value;
        const estimate = document.getElementById('task-estimate').value;
        const tagsInput = document.getElementById('task-tags').value;

        const task = {
            id: Date.now(),
            title,
            description,
            priority,
            estimate: parseFloat(estimate) || 0,
            completed: false,
            createdAt: new Date().toISOString(),
            tags: tagsInput ? tagsInput.split(',').map(t => t.trim()) : []
        };

        this.tasks.push(task);
        this.saveTasks();
        this.render();
        
        // Reset and hide form
        document.getElementById('task-form').reset();
        document.getElementById('task-form-container').style.display = 'none';
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.render();
        }
    }

    getFilteredTasks() {
        let filtered = this.tasks;

        // Apply status filter
        if (this.currentFilter === 'active') {
            filtered = filtered.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = filtered.filter(t => t.completed);
        }

        // Apply tag filter
        if (this.currentTag) {
            filtered = filtered.filter(t => t.tags && t.tags.includes(this.currentTag));
        }

        // Apply search
        if (this.searchTerm) {
            filtered = filtered.filter(t => 
                t.title.toLowerCase().includes(this.searchTerm) ||
                t.description.toLowerCase().includes(this.searchTerm) ||
                (t.tags && t.tags.some(tag => tag.toLowerCase().includes(this.searchTerm)))
            );
        }

        return filtered;
    }

    render() {
        this.renderTasks();
        this.renderStats();
        this.renderTags();
    }

    renderTasks() {
        const tasksList = document.getElementById('tasks-list');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="no-tasks">
                    <i class="fas fa-tasks"></i>
                    <h3>No tasks found</h3>
                    <p>Create a new task to get started!</p>
                </div>
            `;
            return;
        }

        tasksList.innerHTML = filteredTasks.map(task => `
            <div class="task-card ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-title">${this.escapeHtml(task.title)}</span>
                    <span class="task-priority priority-${task.priority}">${task.priority}</span>
                    <i class="fas fa-trash delete-task"></i>
                </div>
                ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                <div class="task-footer">
                    <div class="task-tags">
                        ${task.tags ? task.tags.map(tag => 
                            `<span class="task-tag">${this.escapeHtml(tag)}</span>`
                        ).join('') : ''}
                    </div>
                    <div class="task-meta">
                        <span><i class="far fa-clock"></i> ${task.estimate}h</span>
                        <span><i class="far fa-calendar"></i> ${new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners to new tasks
        document.querySelectorAll('.task-card').forEach(card => {
            const taskId = parseInt(card.dataset.taskId);
            
            card.querySelector('.task-checkbox').addEventListener('change', (e) => {
                e.stopPropagation();
                this.toggleTask(taskId);
            });

            card.querySelector('.delete-task').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTask(taskId);
            });

            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('task-checkbox') && 
                    !e.target.classList.contains('delete-task')) {
                    this.showTaskDetails(taskId);
                }
            });
        });
    }

    renderStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;

        document.getElementById('all-count').textContent = total;
        document.getElementById('active-count').textContent = active;
        document.getElementById('completed-count').textContent = completed;

        const progress = total > 0 ? (completed / total) * 100 : 0;
        document.getElementById('progress-bar').style.width = `${progress}%`;
        document.getElementById('progress-text').textContent = `${completed}/${total} tasks completed`;
    }

    renderTags() {
        const tagsList = document.getElementById('tags-list');
        const tagsArray = Array.from(this.tags);

        if (tagsArray.length === 0) {
            tagsList.innerHTML = '<p style="color: var(--text-secondary); font-size: 13px;">No tags yet</p>';
            return;
        }

        tagsList.innerHTML = tagsArray.map(tag => `
            <div class="tag-item ${this.currentTag === tag ? 'active' : ''}" data-tag="${tag}">
                <span><i class="fas fa-tag"></i> ${this.escapeHtml(tag)}</span>
                <span class="count">${this.tasks.filter(t => t.tags && t.tags.includes(tag)).length}</span>
            </div>
        `).join('');

        // Add click handlers
        document.querySelectorAll('.tag-item').forEach(item => {
            item.addEventListener('click', () => {
                const tag = item.dataset.tag;
                this.currentTag = this.currentTag === tag ? null : tag;
                this.currentFilter = 'all';
                
                document.querySelectorAll('.filters li').forEach(li => li.classList.remove('active'));
                document.querySelector('[data-filter="all"]').classList.add('active');
                document.getElementById('current-view').textContent = tag ? `Tag: ${tag}` : 'All Tasks';
                
                this.render();
            });
        });
    }

    showTaskDetails(taskId) {
        // Implement task details view (could be a modal)
        console.log('Show details for task:', taskId);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new CicadaApp();
});
