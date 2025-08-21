document.addEventListener('DOMContentLoaded', () => {
    // Main View Elements
    const mainTaskView = document.getElementById('main-task-view');
    const taskList = document.getElementById('task-list');
    const showModalBtn = document.getElementById('show-modal-btn');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('search-input');

    // Subtask View Elements
    const subtaskDetailsView = document.getElementById('subtask-details-view');
    const backToMainBtn = document.getElementById('back-to-main-btn');
    const currentMainTaskTitle = document.getElementById('current-main-task-title');
    const currentMainTaskDate = document.getElementById('current-main-task-date');
    const subtaskList = document.getElementById('subtask-list');

    // Modal Elements
    const modal = document.getElementById('task-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const taskForm = document.getElementById('task-form');
    const modalTitle = document.getElementById('modal-title');
    const taskTextInput = document.getElementById('task-text');
    const dueDateInput = document.getElementById('due-date');
    const taskIdInput = document.getElementById('task-id');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const subtaskManagement = document.getElementById('subtask-management');
    const subtaskInputModal = document.getElementById('subtask-input-modal');
    const addSubtaskBtnModal = document.getElementById('add-subtask-btn-modal');
    const subtaskListModal = document.getElementById('subtask-list-modal');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentMainTaskId = null;
    let tempSubtasks = []; // Temporary array for subtasks in the modal

    // Initialize Flatpickr
    flatpickr(dueDateInput, {
        dateFormat: "Y-m-d"
    });

    // Initialize SortableJS for Main Tasks with a handle for drag-and-drop
    new Sortable(taskList, {
        handle: '.drag-handle', // This specifies the drag handle
        animation: 150,
        onEnd: (evt) => {
            const movedItem = tasks.splice(evt.oldIndex, 1)[0];
            tasks.splice(evt.newIndex, 0, movedItem);
            saveTasks();
        }
    });

    let subtaskSortable; // Reference to the Sortable instance for subtasks

    // Helper function to check if a main task is complete
    function isMainTaskComplete(task) {
        if (task.subtasks && task.subtasks.length > 0) {
            return task.subtasks.every(subtask => subtask.progress >= 100);
        } else {
            return task.progress >= 100;
        }
    }
    
    // Helper function to calculate total progress for a task with subtasks
    function calculateSubtaskProgress(task) {
        if (!task.subtasks || task.subtasks.length === 0) {
            return 0;
        }
        const totalProgress = task.subtasks.reduce((sum, subtask) => sum + subtask.progress, 0);
        return Math.round(totalProgress / task.subtasks.length);
    }


    // Function to render tasks to the page based on the current filter and search query
    function renderTasks() {
        taskList.innerHTML = '';
        const searchQuery = searchInput.value.toLowerCase();
        const today = new Date().toISOString().slice(0, 10);
        
        const filteredTasks = tasks.filter(task => {
            const isTaskComplete = isMainTaskComplete(task);
            
            // Filter by current filter button
            const isFiltered = (currentFilter === 'all')
                || (currentFilter === 'today' && task.dueDate === today)
                || (currentFilter === 'pending' && !isTaskComplete && task.dueDate > today)
                || (currentFilter === 'overdue' && !isTaskComplete && task.dueDate < today)
                || (currentFilter === 'completed' && isTaskComplete);

            // Filter by search query
            const isMatchingSearch = task.text.toLowerCase().includes(searchQuery);

            return isFiltered && isMatchingSearch;
        });

        // Add empty state message if no tasks are found
        if (filteredTasks.length === 0) {
            const emptyStateHtml = '<p id="empty-state">You\'re all caught up! Add a new task to get started. 🎉</p>';
            taskList.innerHTML = emptyStateHtml;
            return;
        }

        filteredTasks.forEach(task => {
            const isComplete = isMainTaskComplete(task);
            const li = document.createElement('li');
            li.setAttribute('data-id', task.id);
            li.classList.add('new-task'); // Animation class
            
            const hasSubtasks = task.subtasks && task.subtasks.length > 0;
            const taskProgress = hasSubtasks ? calculateSubtaskProgress(task) : (task.progress || 0);

            // Conditional HTML to show due date or a "Completed" label
            const taskStatusHtml = isComplete 
                ? `
                    <div class="completed-label">
                        <span class="checkmark">✔</span>
                        <span>COMPLETED</span>
                    </div>
                `
                : `<span class="due-date">Due: ${task.dueDate}</span>`;
            
            const subtaskNamesHtml = hasSubtasks
                ? `<span class="subtask-box">${task.subtasks.map(st => st.text).join(', ')}</span>`
                : '';

            // Render progress bar and options based on whether task has subtasks
            let progressBarHtml = '';
            if (hasSubtasks || (task.progress !== undefined && task.progress !== null)) {
                 progressBarHtml = `
                    <div class="progress-container">
                        <div class="progress-bar-wrapper">
                            <div class="progress-bar">
                                <div class="progress-bar-fill" style="width: ${taskProgress}%;"></div>
                            </div>
                            <span class="progress-text">${taskProgress}%</span>
                        </div>
                    </div>
                `;
            }

            // Button to open subtask view
            const subtaskUpdateBtnHtml = hasSubtasks 
                ? `<button class="update-subtask-btn">Update</button>` 
                : '';

            if (!hasSubtasks) {
                 progressBarHtml = `
                    <div class="progress-container">
                        <div class="progress-bar-wrapper">
                            <div class="progress-bar">
                                <div class="progress-bar-fill" style="width: ${taskProgress}%;"></div>
                            </div>
                            <span class="progress-text">${taskProgress}%</span>
                        </div>
                        <div class="progress-options">
                            <button class="update-btn">Update</button>
                            <div class="progress-controls" style="display: none;">
                                <input type="number" class="progress-input" min="0" max="100" value="${taskProgress}">
                                <button class="update-progress-btn">Update Progress</button>
                            </div>
                        </div>
                    </div>
                `;
            }


            li.innerHTML = `
                <div class="task-header">
                    <div class="task-details">
                        <span class="drag-handle">☰</span>
                        <input type="checkbox" disabled ${isComplete ? 'checked' : ''}>
                        <span class="task-text">${task.text}</span>
                        ${subtaskNamesHtml}
                        ${taskStatusHtml}
                    </div>
                    <div class="task-actions">
                        ${subtaskUpdateBtnHtml}
                        <button class="edit-btn">✏️</button>
                        <button class="delete-btn">🗑️</button>
                    </div>
                </div>
                ${progressBarHtml}
            `;
            
            taskList.appendChild(li);
        });
    }

    // Function to render subtask details view
    function renderSubtaskDetails(taskId) {
        const mainTask = tasks.find(t => t.id == taskId);
        if (!mainTask) return;

        currentMainTaskId = taskId;
        mainTaskView.style.display = 'none';
        subtaskDetailsView.style.display = 'block';

        currentMainTaskTitle.textContent = mainTask.text;
        currentMainTaskDate.textContent = `Due: ${mainTask.dueDate}`;
        subtaskList.innerHTML = '';

        if (mainTask.subtasks) {
            mainTask.subtasks.forEach(subtask => {
                const li = document.createElement('li');
                li.setAttribute('data-id', subtask.id);
                li.setAttribute('data-editing', 'false');
                
                let subtaskActionsHTML = '';
                if (subtask.progress >= 100) {
                    subtaskActionsHTML = `
                        <div class="progress-info">
                            <div class="completed-label">
                                <span class="checkmark">✔</span>
                                <span>COMPLETED</span>
                            </div>
                        </div>
                        <button class="subtask-delete-btn">🗑️</button>
                    `;
                } else {
                    subtaskActionsHTML = `
                        <div class="progress-info">
                            <span>Progress: ${subtask.progress}%</span>
                            <button class="update-btn">Update</button>
                        </div>
                        <div class="progress-controls" style="display:none;">
                            <input type="number" class="progress-input" min="0" max="100" value="${subtask.progress}">
                            <button class="update-progress-btn">Update Progress</button>
                        </div>
                        <button class="subtask-delete-btn">🗑️</button>
                    `;
                }

                li.innerHTML = `
                    <span>${subtask.text}</span>
                    <div class="subtask-actions">
                        ${subtaskActionsHTML}
                    </div>
                `;
                subtaskList.appendChild(li);
            });
            // Initialize SortableJS for subtasks after rendering
            if (subtaskSortable) {
                subtaskSortable.destroy(); // Destroy previous instance if it exists
            }
            subtaskSortable = new Sortable(subtaskList, {
                animation: 150,
                onEnd: (evt) => {
                    const mainTask = tasks.find(t => t.id == currentMainTaskId);
                    if (mainTask) {
                        const movedItem = mainTask.subtasks.splice(evt.oldIndex, 1)[0];
                        mainTask.subtasks.splice(evt.newIndex, 0, movedItem);
                        saveTasks();
                    }
                }
            });
        }
    }

    // Function to render subtasks in the modal
    function renderSubtasksInModal() {
        subtaskListModal.innerHTML = '';
        tempSubtasks.forEach(subtask => {
            const li = document.createElement('li');
            li.setAttribute('data-id', subtask.id);
            li.innerHTML = `
                <span>${subtask.text}</span>
                <button type="button" class="subtask-delete-btn-modal">🗑️</button>
            `;
            subtaskListModal.appendChild(li);
        });
    }

    // Function to save tasks to local storage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Show the modal for adding a new task
    showModalBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Add New Task';
        taskTextInput.value = '';
        dueDateInput.value = '';
        taskIdInput.value = '';
        saveTaskBtn.textContent = 'Add Task';
        
        tempSubtasks = [];
        renderSubtasksInModal();
        subtaskManagement.style.display = 'block';
        modal.style.display = 'block';
    });
    
    // Close modal when the close button or outside the modal is clicked
    closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle main task form submission (add/edit)
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskText = taskTextInput.value.trim();
        const dueDate = dueDateInput.value;
        const taskId = taskIdInput.value;

        if (taskId) {
            // Edit existing main task
            const taskIndex = tasks.findIndex(t => t.id == taskId);
            tasks[taskIndex].text = taskText;
            tasks[taskIndex].dueDate = dueDate;
            
            // If subtasks are added/removed in edit modal, adjust progress logic
            if (tempSubtasks.length > 0) {
                 tasks[taskIndex].subtasks = tempSubtasks.map(st => ({
                    id: st.id,
                    text: st.text,
                    progress: st.progress || 0
                }));
                 delete tasks[taskIndex].progress; // Remove manual progress
            } else {
                tasks[taskIndex].subtasks = [];
                // Initialize manual progress if it doesn't exist
                if (tasks[taskIndex].progress === undefined) {
                    tasks[taskIndex].progress = 0;
                }
            }
        } else {
            // Add new main task with subtasks from modal
            const newTaskId = Date.now();
            const newTask = {
                id: newTaskId,
                text: taskText,
                completed: false,
                dueDate: dueDate || new Date().toISOString().slice(0, 10),
            };

            if (tempSubtasks.length > 0) {
                newTask.subtasks = tempSubtasks.map(st => ({...st, progress: 0}));
            } else {
                newTask.subtasks = [];
                newTask.progress = 0;
            }
            
            tasks.push(newTask);
        }
        
        saveTasks();
        renderTasks();
        modal.style.display = 'none';
    });

    // Handle main task list actions
    taskList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        const taskId = li.getAttribute('data-id');
        const taskIndex = tasks.findIndex(t => t.id == taskId);
        
        // Handle delete
        if (e.target.classList.contains('delete-btn')) {
             // Add deleting class for animation
            li.classList.add('deleting');
            setTimeout(() => {
                tasks.splice(taskIndex, 1);
                saveTasks();
                renderTasks();
            }, 300); // Match animation duration
        }
        
        // Handle the new "Update" button for tasks with subtasks
        if (e.target.classList.contains('update-subtask-btn')) {
            renderSubtaskDetails(taskId);
        }
        
        // Open modal to edit
        if (e.target.classList.contains('edit-btn')) {
            const task = tasks.find(t => t.id == taskId);
            modalTitle.textContent = 'Edit Task';
            taskTextInput.value = task.text;
            dueDateInput.value = task.dueDate;
            taskIdInput.value = task.id;
            saveTaskBtn.textContent = 'Save Changes';
            
            tempSubtasks = task.subtasks ? [...task.subtasks] : [];
            renderSubtasksInModal();
            subtaskManagement.style.display = 'block';
            modal.style.display = 'block';
        }

        // Click on task name to show subtasks
        if (e.target.classList.contains('task-text')) {
            const task = tasks.find(t => t.id == taskId);
            if (task.subtasks && task.subtasks.length > 0) {
                renderSubtaskDetails(taskId);
            }
        }

        // Handle progress update for main tasks (if no subtasks)
        if (e.target.classList.contains('update-btn') && tasks[taskIndex].subtasks.length === 0) {
            const progressControls = li.querySelector('.progress-controls');
            const updateBtn = li.querySelector('.update-btn');

            updateBtn.style.display = 'none';
            progressControls.style.display = 'flex';
        }

        if (e.target.classList.contains('update-progress-btn') && tasks[taskIndex].subtasks.length === 0) {
            const progressInput = li.querySelector('.progress-input');
            const progressValue = parseInt(progressInput.value);
            
            tasks[taskIndex].progress = progressValue;
            saveTasks();
            renderTasks();
        }
    });

    // Back to main task view
    backToMainBtn.addEventListener('click', () => {
        subtaskDetailsView.style.display = 'none';
        mainTaskView.style.display = 'block';
        currentMainTaskId = null;
        renderTasks();
    });

    // Add subtask in the modal
    addSubtaskBtnModal.addEventListener('click', () => {
        const subtaskText = subtaskInputModal.value.trim();
        if (subtaskText !== '') {
            tempSubtasks.push({
                id: Date.now(),
                text: subtaskText,
                progress: 0
            });
            subtaskInputModal.value = '';
            renderSubtasksInModal();
        }
    });

    // Delete subtask in the modal
    subtaskListModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('subtask-delete-btn-modal')) {
            const subtaskLi = e.target.closest('li');
            const subtaskId = subtaskLi.getAttribute('data-id');
            tempSubtasks = tempSubtasks.filter(st => st.id != subtaskId);
            renderSubtasksInModal();
        }
    });

    // Handle subtask actions in the subtask details view
    subtaskList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        const subtaskId = li.getAttribute('data-id');
        const taskIndex = tasks.findIndex(t => t.id == currentMainTaskId);

        // Delete a subtask
        if (e.target.classList.contains('subtask-delete-btn')) {
            if (taskIndex !== -1) {
                 li.classList.add('deleting');
                 setTimeout(() => {
                    tasks[taskIndex].subtasks = tasks[taskIndex].subtasks.filter(st => st.id != subtaskId);
                    saveTasks();
                    renderSubtaskDetails(currentMainTaskId);
                    renderTasks();
                 }, 300);
            }
        }

        // Show/hide progress input box
        if (e.target.classList.contains('update-btn')) {
            const progressInfo = li.querySelector('.progress-info');
            const progressControls = li.querySelector('.progress-controls');

            progressInfo.style.display = 'none';
            progressControls.style.display = 'flex';
        }
        
        // Update progress of a subtask
        if (e.target.classList.contains('update-progress-btn')) {
            const progressInput = li.querySelector('.progress-input');
            const progressValue = parseInt(progressInput.value);

            if (taskIndex !== -1) {
                const subtaskIndex = tasks[taskIndex].subtasks.findIndex(st => st.id == subtaskId);
                if (subtaskIndex !== -1) {
                    tasks[taskIndex].subtasks[subtaskIndex].progress = progressValue;
                    saveTasks();
                    renderSubtaskDetails(currentMainTaskId);
                    renderTasks();
                }
            }
        }
    });
    
    // Handle filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderTasks();
        });
    });

    // Event listener for the search input
    searchInput.addEventListener('input', renderTasks);

    // Initial render of tasks
    renderTasks();
});