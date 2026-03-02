class CicadaApp {
    constructor() {
        this.projects = [];
        this.tasks = [];
        this.tags = new Set();
        this.currentProject = null;
        this.currentFilter = 'all';
        this.currentTag = null;
        this.searchTerm = '';
        this.importData = null; // Store import data temporarily
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupDataManagementListeners(); // Make sure this is called
        this.render();
    }

    loadData() {
        // Load projects
        const savedProjects = localStorage.getItem('cicada-projects');
        if (savedProjects) {
            this.projects = JSON.parse(savedProjects);
        } else {
            // Create default project
            this.projects = [{
                id: Date.now(),
                name: 'Default Project',
                color: '#4f46e5',
                createdAt: new Date().toISOString()
            }];
        }

        // Load tasks
        const savedTasks = localStorage.getItem('cicada-tasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }

        // Set current project (first one or last used)
        const lastProject = localStorage.getItem('cicada-last-project');
        this.currentProject = this.projects.find(p => p.id == lastProject) || this.projects[0];
        
        this.updateTags();
    }

    saveData() {
        localStorage.setItem('cicada-projects', JSON.stringify(this.projects));
        localStorage.setItem('cicada-tasks', JSON.stringify(this.tasks));
        if (this.currentProject) {
            localStorage.setItem('cicada-last-project', this.currentProject.id);
        }
        this.updateTags();
    }

    updateTags() {
        this.tags.clear();
        const projectTasks = this.getCurrentProjectTasks();
        projectTasks.forEach(task => {
            if (task.tags) {
                task.tags.forEach(tag => this.tags.add(tag));
            }
        });
    }

    getCurrentProjectTasks() {
        if (!this.currentProject) return [];
        return this.tasks.filter(t => t.projectId === this.currentProject.id);
    }

    setupEventListeners() {
        // Filter clicks
        document.querySelectorAll('.filters li').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.filters li').forEach(li => li.classList.remove('active'));
                item.classList.add('active');
                this.currentFilter = item.dataset.filter;
                this.currentTag = null;
                this.updateCurrentViewTitle();
                this.render();
            });
        });

        // Add project button
        const addProjectBtn = document.getElementById('add-project-btn');
        if (addProjectBtn) {
            addProjectBtn.addEventListener('click', () => {
                this.showProjectModal();
            });
        }

        // Add task button
        const addTaskBtn = document.getElementById('add-task-btn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                if (!this.currentProject) {
                    alert('Please select or create a project first');
                    return;
                }
                document.getElementById('task-form-container').style.display = 'block';
                document.getElementById('task-title').focus();
            });
        }

        // Cancel task button
        const cancelTaskBtn = document.getElementById('cancel-task-btn');
        if (cancelTaskBtn) {
            cancelTaskBtn.addEventListener('click', () => {
                document.getElementById('task-form-container').style.display = 'none';
                document.getElementById('task-form').reset();
            });
        }

        // Task form submit
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createTask();
            });
        }

        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.render();
            });
        }

        // Add tag button
        const addTagBtn = document.getElementById('add-tag-btn');
        if (addTagBtn) {
            addTagBtn.addEventListener('click', () => {
                const tagName = prompt('Enter tag name:');
                if (tagName && tagName.trim()) {
                    this.tags.add(tagName.trim());
                    this.renderTags();
                }
            });
        }
    }

    // NEW: Setup data management buttons
    setupDataManagementListeners() {
        console.log('Setting up data management listeners'); // Debug log
        
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            console.log('Export button found'); // Debug log
            exportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Export clicked'); // Debug log
                this.exportData();
            });
        } else {
            console.log('Export button NOT found'); // Debug log
        }

        const importBtn = document.getElementById('import-data-btn');
        if (importBtn) {
            console.log('Import button found'); // Debug log
            importBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Import clicked'); // Debug log
                this.showImportModal();
            });
        } else {
            console.log('Import button NOT found'); // Debug log
        }
    }

    // NEW: Export data to JSON file
    exportData() {
        console.log('Exporting data...'); // Debug log
        
        // Prepare the complete data package
        const dataPackage = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            appName: 'Cicada Task Manager',
            projects: this.projects,
            tasks: this.tasks,
            stats: {
                totalProjects: this.projects.length,
                totalTasks: this.tasks.length,
                completedTasks: this.tasks.filter(t => t.completed).length
            }
        };

        // Convert to JSON string with nice formatting
        const jsonString = JSON.stringify(dataPackage, null, 2);
        
        // Create a blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `cicada-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        this.showNotification('Data exported successfully!', 'success');
    }

    // NEW: Show import modal with preview
    showImportModal() {
        console.log('Showing import modal'); // Debug log
        
        // Create modal if it doesn't exist
        let modal = document.getElementById('import-modal');
        if (!modal) {
            console.log('Creating import modal'); // Debug log
            modal = document.createElement('div');
            modal.id = 'import-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="width: 500px; max-width: 90%;">
                    <h3>Import Data</h3>
                    <p>Select a Cicada backup file (.json) to import.</p>
                    <div class="form-group">
                        <label for="import-file">Choose File</label>
                        <input type="file" id="import-file" accept=".json">
                    </div>
                    <div id="import-preview" class="import-preview" style="display: none;">
                        <h4>Preview</h4>
                        <div id="preview-content"></div>
                        <div class="warning-text" id="import-warning"></div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" id="cancel-import-btn">Cancel</button>
                        <button class="btn btn-primary" id="confirm-import-btn" disabled>Import</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // File input change handler
            document.getElementById('import-file').addEventListener('change', (e) => {
                this.previewImportFile(e.target.files[0]);
            });

            // Cancel button
            document.getElementById('cancel-import-btn').addEventListener('click', () => {
                modal.classList.remove('active');
                document.getElementById('import-file').value = '';
                document.getElementById('import-preview').style.display = 'none';
            });

            // Confirm import button
            document.getElementById('confirm-import-btn').addEventListener('click', () => {
                this.confirmImport();
            });

            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    document.getElementById('import-file').value = '';
                    document.getElementById('import-preview').style.display = 'none';
                }
            });
        }

        modal.classList.add('active');
    }

    // NEW: Preview import file
    previewImportFile(file) {
        console.log('Previewing file:', file); // Debug log
        
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const preview = document.getElementById('preview-content');
                const warning = document.getElementById('import-warning');
                const confirmBtn = document.getElementById('confirm-import-btn');
                
                // Validate data structure
                if (!this.validateImportData(data)) {
                    preview.innerHTML = '<p style="color: var(--danger-color);">Invalid backup file format!</p>';
                    warning.textContent = 'This doesn\'t appear to be a valid Cicada backup file.';
                    confirmBtn.disabled = true;
                    return;
                }

                // Show preview
                let previewHtml = `
                    <div class="preview-item">
                        <span class="preview-badge">File</span>
                        <strong>${file.name}</strong>
                    </div>
                    <div class="preview-item">
                        <span class="preview-badge">Exported</span>
                        ${new Date(data.exportedAt).toLocaleString()}
                    </div>
                    <div class="preview-item">
                        <span class="preview-badge">Projects</span>
                        ${data.projects.length} projects
                    </div>
                    <div class="preview-item">
                        <span class="preview-badge">Tasks</span>
                        ${data.tasks.length} tasks (${data.stats.completedTasks} completed)
                    </div>
                `;

                // Check for conflicts
                const conflicts = this.checkImportConflicts(data);
                if (conflicts.hasConflicts) {
                    previewHtml += `
                        <div class="preview-item" style="color: var(--warning-color);">
                            <i class="fas fa-exclamation-triangle"></i>
                            ${conflicts.message}
                        </div>
                    `;
                    warning.textContent = 'Importing will merge with existing data. No data will be overwritten.';
                } else {
                    warning.textContent = '';
                }

                // Store data for import
                this.importData = data;
                
                preview.innerHTML = previewHtml;
                document.getElementById('import-preview').style.display = 'block';
                confirmBtn.disabled = false;

            } catch (error) {
                console.error('Import preview error:', error);
                document.getElementById('preview-content').innerHTML = 
                    '<p style="color: var(--danger-color);">Error reading file: Invalid JSON</p>';
                document.getElementById('confirm-import-btn').disabled = true;
            }
        };
        reader.readAsText(file);
    }

    // NEW: Validate import data structure
    validateImportData(data) {
        return (
            data &&
            data.version &&
            data.exportedAt &&
            data.appName === 'Cicada Task Manager' &&
            Array.isArray(data.projects) &&
            Array.isArray(data.tasks) &&
            data.stats
        );
    }

    // NEW: Check for conflicts with existing data
    checkImportConflicts(importData) {
        const existingProjectIds = new Set(this.projects.map(p => p.id));
        const existingTaskIds = new Set(this.tasks.map(t => t.id));
        
        const newProjects = importData.projects.filter(p => !existingProjectIds.has(p.id));
        const newTasks = importData.tasks.filter(t => !existingTaskIds.has(t.id));
        
        return {
            hasConflicts: newProjects.length < importData.projects.length || 
                         newTasks.length < importData.tasks.length,
            message: `${importData.projects.length - newProjects.length} projects and ${importData.tasks.length - newTasks.length} tasks already exist (will be skipped)`,
            newProjects,
            newTasks
        };
    }

    // NEW: Confirm and perform import
    confirmImport() {
        console.log('Confirming import'); // Debug log
        
        if (!this.importData) return;

        const conflicts = this.checkImportConflicts(this.importData);
        
        // Add new projects (skip duplicates)
        const newProjects = conflicts.newProjects;
        this.projects.push(...newProjects);

        // Add new tasks (skip duplicates)
        const newTasks = conflicts.newTasks;
        this.tasks.push(...newTasks);

        // Update tags
        this.updateTags();

        // Save to localStorage
        this.saveData();

        // Close modal
        document.getElementById('import-modal').classList.remove('active');
        document.getElementById('import-file').value = '';
        document.getElementById('import-preview').style.display = 'none';
        
        // Refresh display
        this.render();

        // Show success message
        const message = `Imported ${newProjects.length} projects and ${newTasks.length} tasks successfully!`;
        this.showNotification(message, 'success');
    }

    // NEW: Show notification
    showNotification(message, type = 'info') {
        // Remove any existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add styles if not present
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    z-index: 2000;
                    animation: slideIn 0.3s ease;
                    border-left: 4px solid var(--primary-color);
                }
                
                .notification-success {
                    border-left-color: var(--success-color);
                }
                
                .notification-success i {
                    color: var(--success-color);
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showProjectModal() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('project-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'project-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>Create New Project</h3>
                    <div class="form-group">
                        <label for="project-name">Project Name</label>
                        <input type="text" id="project-name" placeholder="e.g., Mobile App API">
                    </div>
                    <div class="form-group">
                        <label for="project-color">Color</label>
                        <input type="color" id="project-color" value="#4f46e5">
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" id="cancel-project-btn">Cancel</button>
                        <button class="btn btn-primary" id="save-project-btn">Create Project</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Add event listeners for modal
            document.getElementById('cancel-project-btn').addEventListener('click', () => {
                modal.classList.remove('active');
            });

            document.getElementById('save-project-btn').addEventListener('click', () => {
                const name = document.getElementById('project-name').value.trim();
                const color = document.getElementById('project-color').value;
                
                if (name) {
                    this.createProject(name, color);
                    modal.classList.remove('active');
                }
            });

            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }

        modal.classList.add('active');
        document.getElementById('project-name').focus();
    }

    createProject(name, color) {
        const project = {
            id: Date.now(),
            name: name,
            color: color || '#4f46e5',
            createdAt: new Date().toISOString()
        };

        this.projects.push(project);
        this.currentProject = project;
        this.saveData();
        this.render();
    }

    deleteProject(projectId) {
        if (this.projects.length <= 1) {
            alert('Cannot delete the last project');
            return;
        }

        if (confirm('Are you sure you want to delete this project? All tasks will be moved to the default project.')) {
            const defaultProject = this.projects[0];
            
            // Move tasks to default project
            this.tasks.forEach(task => {
                if (task.projectId === projectId) {
                    task.projectId = defaultProject.id;
                }
            });

            // Remove project
            this.projects = this.projects.filter(p => p.id !== projectId);
            
            // Set current project to default if needed
            if (this.currentProject && this.currentProject.id === projectId) {
                this.currentProject = defaultProject;
            }

            this.saveData();
            this.render();
        }
    }

    switchProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            this.currentProject = project;
            this.currentTag = null;
            this.currentFilter = 'all';
            this.searchTerm = '';
            
            // Update UI
            document.querySelectorAll('.filters li').forEach(li => li.classList.remove('active'));
            document.querySelector('[data-filter="all"]').classList.add('active');
            document.getElementById('search-input').value = '';
            
            this.updateTags();
            this.updateCurrentViewTitle();
            this.render();
            this.saveData();
        }
    }

    updateCurrentViewTitle() {
        const viewTitle = document.getElementById('current-view');
        if (viewTitle && this.currentProject) {
            let title = `${this.currentProject.name} / `;
            if (this.currentTag) {
                title += `Tag: ${this.currentTag}`;
            } else {
                title += this.currentFilter.charAt(0).toUpperCase() + this.currentFilter.slice(1);
            }
            viewTitle.textContent = title;
        }
    }

    createTask() {
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const priority = document.getElementById('task-priority').value;
        const estimate = document.getElementById('task-estimate').value;
        const tagsInput = document.getElementById('task-tags').value;

        const task = {
            id: Date.now(),
            projectId: this.currentProject.id,
            title,
            description,
            priority,
            estimate: parseFloat(estimate) || 0,
            completed: false,
            createdAt: new Date().toISOString(),
            tags: tagsInput ? tagsInput.split(',').map(t => t.trim()) : []
        };

        this.tasks.push(task);
        this.saveData();
        this.render();
        
        // Reset and hide form
        document.getElementById('task-form').reset();
        document.getElementById('task-form-container').style.display = 'none';
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveData();
            this.render();
        }
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveData();
            this.render();
        }
    }

    getFilteredTasks() {
        let filtered = this.getCurrentProjectTasks();

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
                (t.description && t.description.toLowerCase().includes(this.searchTerm)) ||
                (t.tags && t.tags.some(tag => tag.toLowerCase().includes(this.searchTerm)))
            );
        }

        return filtered;
    }

    render() {
        this.renderProjects();
        this.renderTasks();
        this.renderStats();
        this.renderTags();
    }

    renderProjects() {
        const projectsList = document.getElementById('projects-list');
        if (!projectsList) return;

        projectsList.innerHTML = this.projects.map(project => {
            const taskCount = this.tasks.filter(t => t.projectId === project.id).length;
            const isActive = this.currentProject && this.currentProject.id === project.id;
            
            return `
                <div class="project-item ${isActive ? 'active' : ''}" data-project-id="${project.id}">
                    <span class="project-name">
                        <i class="fas fa-folder" style="color: ${project.color}"></i>
                        ${this.escapeHtml(project.name)}
                    </span>
                    <span class="project-count">${taskCount}</span>
                </div>
            `;
        }).join('');

        // Add click handlers
        document.querySelectorAll('.project-item').forEach(item => {
            item.addEventListener('click', () => {
                const projectId = parseInt(item.dataset.projectId);
                this.switchProject(projectId);
            });

            // Add delete option (right-click or long press)
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const projectId = parseInt(item.dataset.projectId);
                this.deleteProject(projectId);
            });
        });
    }

    renderTasks() {
        const tasksList = document.getElementById('tasks-list');
        const filteredTasks = this.getFilteredTasks();

        if (!this.currentProject) {
            tasksList.innerHTML = `
                <div class="no-tasks">
                    <i class="fas fa-folder-open"></i>
                    <h3>No Project Selected</h3>
                    <p>Select a project or create a new one to get started!</p>
                </div>
            `;
            return;
        }

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="no-tasks">
                    <i class="fas fa-tasks"></i>
                    <h3>No tasks found</h3>
                    <p>Create a new task in ${this.escapeHtml(this.currentProject.name)} to get started!</p>
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
            
            const checkbox = card.querySelector('.task-checkbox');
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    e.stopPropagation();
                    this.toggleTask(taskId);
                });
            }

            const deleteBtn = card.querySelector('.delete-task');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteTask(taskId);
                });
            }
        });
    }

    renderStats() {
        const projectTasks = this.getCurrentProjectTasks();
        const total = projectTasks.length;
        const completed = projectTasks.filter(t => t.completed).length;
        const active = total - completed;

        const allCount = document.getElementById('all-count');
        const activeCount = document.getElementById('active-count');
        const completedCount = document.getElementById('completed-count');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');

        if (allCount) allCount.textContent = total;
        if (activeCount) activeCount.textContent = active;
        if (completedCount) completedCount.textContent = completed;

        const progress = total > 0 ? (completed / total) * 100 : 0;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${completed}/${total} tasks completed`;
    }

    renderTags() {
        const tagsList = document.getElementById('tags-list');
        if (!tagsList) return;
        
        const tagsArray = Array.from(this.tags);

        if (tagsArray.length === 0) {
            tagsList.innerHTML = '<p style="color: var(--text-secondary); font-size: 13px;">No tags in this project</p>';
            return;
        }

        const projectTasks = this.getCurrentProjectTasks();

        tagsList.innerHTML = tagsArray.map(tag => {
            const count = projectTasks.filter(t => t.tags && t.tags.includes(tag)).length;
            return `
                <div class="tag-item ${this.currentTag === tag ? 'active' : ''}" data-tag="${tag}">
                    <span><i class="fas fa-tag"></i> ${this.escapeHtml(tag)}</span>
                    <span class="count">${count}</span>
                </div>
            `;
        }).join('');

        // Add click handlers
        document.querySelectorAll('.tag-item').forEach(item => {
            item.addEventListener('click', () => {
                const tag = item.dataset.tag;
                this.currentTag = this.currentTag === tag ? null : tag;
                this.currentFilter = 'all';
                
                document.querySelectorAll('.filters li').forEach(li => li.classList.remove('active'));
                const allFilter = document.querySelector('[data-filter="all"]');
                if (allFilter) allFilter.classList.add('active');
                
                this.updateCurrentViewTitle();
                this.render();
            });
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing CicadaApp'); // Debug log
    new CicadaApp();
});
