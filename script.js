const addTaskButtons = document.querySelectorAll('.add-task-button');
const addTaskBtn = document.querySelector('.add-task-btn');
const clearBoardBtn = document.querySelector('.clear-board-btn');
const allTasks = document.querySelectorAll('.task-list');
const modalOverlay = document.getElementById('modalOverlay');
const confirmDialog = document.getElementById('confirmDialog');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const cancelBtn = document.querySelector('.cancel-btn');
const addTaskInColumn = document.querySelector('.add-task-in-column');
const taskStatusInput = document.getElementById('taskStatus');
const taskTitleInput = document.getElementById('taskTitle');
const taskTagsInput = document.getElementById('taskTags');
const editTaskIdInput = document.getElementById('editTaskId');
const deleteTaskIdInput = document.getElementById('deleteTaskId');
const confirmDialogCancel = document.querySelector('.confirm-dialog-cancel');
const confirmDialogConfirm = document.querySelector('.confirm-dialog-confirm');

let taskCounter = 4; // Starting from 4 since we already have 3 tasks

function saveTasksToLocalStorage() {
    try {
        console.log('Saving tasks to local storage');
        
        const columns = document.querySelectorAll('.column');
        const boardData = {};
        
        columns.forEach(column => {
            const columnId = column.classList[1]; // 'todo', 'doing', or 'done'
            const tasks = [];
            
            column.querySelectorAll('.task').forEach(task => {
                try {
                    const taskId = task.getAttribute('data-task-id');
                    
                    let status = null;
                    if (task.classList.contains('Urgent')) status = 'Urgent';
                    else if (task.classList.contains('High')) status = 'High';
                    else if (task.classList.contains('Medium')) status = 'Medium';
                    
                    if (!status) {
                        const statusElement = task.querySelector('.task-status');
                        if (statusElement && statusElement.innerText) {
                            status = statusElement.innerText.trim();
                        }
                    }
                    
                    if (!status) status = 'Urgent';
                    
                    const titleElement = task.querySelector('.task-title');
                    const title = titleElement ? titleElement.innerText : 'Untitled Task';
                    
                    const tags = Array.from(task.querySelectorAll('.task-tag'))
                        .map(tag => tag.innerText);
                    
                    const datetimeElement = task.querySelector('.task-datetime');
                    let timestamp = '';
                    if (datetimeElement) {
                        const datetimeText = datetimeElement.textContent || datetimeElement.innerText;
                        timestamp = datetimeText.replace(/\(updated\)/g, '').trim();
                        
                        const timeMatch = timestamp.match(/\d+:\d+\s+[AP]M,\s+\d{2}-\d{2}-\d{4}/);
                        if (timeMatch) {
                            timestamp = timeMatch[0];
                        }
                    }
                    
                    const validPriorities = ['Urgent', 'High', 'Medium'];
                    let validStatus = status;
                    if (!validStatus || !validPriorities.includes(validStatus)) {
                        console.log("Invalid priority when saving:", validStatus);
                        validStatus = 'Urgent'; // Default to Urgent if invalid
                    }
                    
                    console.log(`Saving task: ${title} with priority: ${validStatus}`);
                    
                    tasks.push({
                        id: taskId,
                        status: validStatus,
                        title,
                        tags,
                        timestamp
                    });
                } catch (err) {
                    console.error('Error processing task for saving:', err);
                }
            });
            
            boardData[columnId] = tasks;
        });
        
        boardData.taskCounter = taskCounter;
        
        localStorage.setItem('kanbanBoardData', JSON.stringify(boardData));
        console.log('Tasks saved to local storage successfully');
    } catch (error) {
        console.error('Error saving to local storage:', error);
    }
}

function loadTasksFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('kanbanBoardData');
        if (!savedData) {
            console.log('No saved tasks found in local storage');
            saveInitialTasksToLocalStorage();
            return;
        }
        
        console.log('Loading tasks from local storage');
        
        let boardData;
        try {
            boardData = JSON.parse(savedData);
            console.log('Parsed board data:', boardData);
        } catch (parseError) {
            console.error('Error parsing board data:', parseError);
            localStorage.removeItem('kanbanBoardData');
            saveInitialTasksToLocalStorage();
            return;
        }
        
        document.querySelectorAll('.task-list').forEach(list => {
            list.innerHTML = '';
        });
        
        if (boardData.taskCounter) {
            taskCounter = boardData.taskCounter;
        }
        
        Object.keys(boardData).forEach(columnId => {
            if (columnId === 'taskCounter') return; // Skip the counter property
            
            const column = document.querySelector(`.column.${columnId}`);
            if (!column) return;
            
            const taskList = column.querySelector('.task-list');
            if (!taskList) return;
            
            console.log(`Loading tasks for column: ${columnId}`);
            
            if (!Array.isArray(boardData[columnId])) {
                console.error(`Invalid tasks array for column ${columnId}`);
                return;
            }
            
            boardData[columnId].forEach(taskData => {
                try {
                    if (!taskData) {
                        console.error('Empty task data');
                        return;
                    }
                    
                    const validPriorities = ['Urgent', 'High', 'Medium'];
                    let status = taskData.status;
                    
                    if (typeof status !== 'string') {
                        console.log("Non-string priority:", status);
                        status = String(status || '').trim();
                    } else {
                        status = status.trim();
                    }
                    
                    if (!status || !validPriorities.includes(status)) {
                        console.log("Invalid priority in loaded task:", status);
                        status = 'Urgent'; // Default to Urgent if invalid
                    }
                    
                    const title = taskData.title || 'Untitled Task';
                    
                    let tags = [];
                    if (Array.isArray(taskData.tags)) {
                        tags = taskData.tags;
                    } else if (typeof taskData.tags === 'string') {
                        tags = taskData.tags.split(',').map(t => t.trim());
                    }
                    
                    console.log(`Loading task: ${title} with priority: ${status}`);
                    
                    const task = createTaskElement(
                        status,
                        title,
                        tags.join(', '),
                        taskData.id,
                        taskData.timestamp
                    );
                    
                    task.classList.remove('Urgent', 'High', 'Medium');
                    task.classList.add(status);
                    
                    const statusElement = task.querySelector('.task-status');
                    if (statusElement) {
                        statusElement.classList.remove('Urgent', 'High', 'Medium');
                        statusElement.classList.add(status);
                        statusElement.innerText = status;
                    }
                    
                    taskList.appendChild(task);
                } catch (err) {
                    console.error('Error creating task element:', err, taskData);
                }
            });
        });
        
        updateColumnCounts();
        console.log('Tasks loaded from local storage successfully');
    } catch (error) {
        console.error('Error loading from local storage:', error);
        localStorage.removeItem('kanbanBoardData');
        saveInitialTasksToLocalStorage();
    }
}

function saveInitialTasksToLocalStorage() {
    console.log('Saving initial tasks to local storage');
    
    const tasks = document.querySelectorAll('.task');
    
    if (tasks.length > 0) {
        console.log(`Found ${tasks.length} initial tasks to save`);
        
        tasks.forEach(task => {
            const hasPriority = ['Urgent', 'High', 'Medium'].some(priority => 
                task.classList.contains(priority)
            );
            
            if (!hasPriority) {
                task.classList.add('Urgent');
                
                const statusElement = task.querySelector('.task-status');
                if (statusElement) {
                    statusElement.classList.remove('Urgent', 'High', 'Medium');
                    statusElement.classList.add('Urgent');
                    statusElement.innerText = 'Urgent';
                }
            }
        });
        
        saveTasksToLocalStorage();
    } else {
        console.log('No initial tasks found to save');
    }
}

// Function to clear all tasks from the board
function clearBoard() {
    try {
        console.log('Clearing board...');
        
        document.querySelectorAll('.task-list').forEach(list => {
            list.innerHTML = '';
        });
        
        // Reset task counter
        taskCounter = 4;
        
        localStorage.removeItem('kanbanBoardData');
        
        updateColumnCounts();
        
        showToast('Board has been reset', 'info');
        
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } catch (error) {
        console.error('Error clearing board:', error);
        showToast('Error clearing board', 'error');
    }
}

function showClearBoardConfirmation() {
    const dialogTitle = confirmDialog.querySelector('h3');
    const dialogText = confirmDialog.querySelector('p');
    const confirmButton = confirmDialog.querySelector('.confirm-dialog-confirm');
    
    dialogTitle.innerText = 'Reset Board';
    dialogText.innerText = 'Are you sure you want to reset the board? This will delete all tasks and cannot be undone.';
    confirmButton.innerText = 'Reset';
    
    confirmDialog.setAttribute('data-action', 'clear-board');
    
    confirmDialog.style.display = 'block';
}

document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('task')) {
        e.target.classList.add('dragging');
    }
});

document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('task')) {
        e.target.classList.remove('dragging');
        showToast('Task moved successfully!', 'success');
        saveTasksToLocalStorage();
    }
});

allTasks.forEach((taskContainer) => {
    taskContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        taskContainer.classList.add('drag-over');
        
        const draggingTask = document.querySelector('.dragging');
        if (!draggingTask) return;
        
        const taskAfterDraggingTask = getTaskAfterDraggingTask(taskContainer, e.clientY);
        
        if (taskAfterDraggingTask) {
            taskContainer.insertBefore(draggingTask, taskAfterDraggingTask);
        } else {
            taskContainer.appendChild(draggingTask);
        }
    });

    taskContainer.addEventListener('dragleave', () => {
        taskContainer.classList.remove('drag-over');
    });

    taskContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        taskContainer.classList.remove('drag-over');
        updateColumnCounts();
    });
});

function getTaskAfterDraggingTask(container, yPosition) {
    const tasks = [...container.querySelectorAll('.task:not(.dragging)')];
    
    return tasks.reduce((closest, task) => {
        const box = task.getBoundingClientRect();
        const offset = yPosition - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: task };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Format date as "4:20 PM, 07-03-2025"
function formatDateTime(date) {
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${hours}:${minutes} ${ampm}, ${month}-${day}-${year}`;
}

// Function to update task count in each column
function updateColumnCounts() {
    document.querySelectorAll('.column').forEach((column) => {
        const taskContainer = column.querySelector('.task-list');
        const countElement = column.querySelector('.column-count');
        countElement.innerText = taskContainer.children.length;
    });
}

function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = 'toast';
    toast.classList.add(`toast-${type}`);
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function createTaskElement(status, title, tag, taskId, timestamp) {
    const validPriorities = ['Urgent', 'High', 'Medium'];
    
    if (typeof status !== 'string') {
        console.log("Non-string priority:", status);
        status = String(status).trim();
    } else {
        status = status.trim();
    }
    
    if (!status || !validPriorities.includes(status)) {
        console.log("Invalid priority in createTaskElement:", status);
        status = 'Urgent'; // Default to Urgent if invalid
    }
    
    console.log("Creating task with priority:", status);
    
    const taskElement = document.createElement('div');
    taskElement.classList.add('task', 'task-creating');
    taskElement.classList.add(status);
    taskElement.setAttribute('draggable', 'true');
    taskElement.setAttribute('data-task-id', taskId || `task-${taskCounter++}`);
    
    const taskActions = document.createElement('div');
    taskActions.classList.add('task-actions');
    
    const editBtn = document.createElement('button');
    editBtn.classList.add('task-action-btn', 'edit-btn');
    editBtn.setAttribute('title', 'Edit task');
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.addEventListener('click', handleEditTask);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('task-action-btn', 'delete-btn');
    deleteBtn.setAttribute('title', 'Delete task');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', handleDeleteTask);
    
    taskActions.appendChild(editBtn);
    taskActions.appendChild(deleteBtn);
    
    const statusElement = document.createElement('div');
    statusElement.classList.add('task-status');
    statusElement.classList.add(status);
    statusElement.innerText = status;
    
    const titleElement = document.createElement('div');
    titleElement.classList.add('task-title');
    titleElement.innerText = title || 'Untitled Task';
    
    const tagElement = document.createElement('div');
    tagElement.classList.add('task-tags');
    
    const tags = tag ? tag.split(',').map(t => t.trim()) : [];
    tags.forEach(tagText => {
        if (tagText) {
            const tagSpan = document.createElement('span');
            tagSpan.classList.add('task-tag');
            tagSpan.innerText = tagText;
            tagElement.appendChild(tagSpan);
        }
    });
    
    const dateElement = document.createElement('div');
    dateElement.classList.add('task-datetime');
    
    let timeValue;
    if (timestamp && timestamp.trim() !== '') {
        timeValue = timestamp;
    } else {
        const now = new Date();
        timeValue = formatDateTime(now);
    }
    
    dateElement.innerHTML = `<i class="far fa-clock"></i> ${timeValue}`;
    
    taskElement.appendChild(taskActions);
    taskElement.appendChild(statusElement);
    taskElement.appendChild(titleElement);
    taskElement.appendChild(tagElement);
    taskElement.appendChild(dateElement);
    
    taskElement.addEventListener('dblclick', () => {
        if (taskElement.closest('.column.done')) {
            taskElement.classList.add('task-complete');
            setTimeout(() => {
                taskElement.classList.remove('task-complete');
            }, 1000);
            showToast('Task completed! 🎉', 'success');
        }
    });
    
    return taskElement;
}

function showModal() {
    modalOverlay.style.display = 'flex';
    void modalOverlay.offsetWidth;
    modalOverlay.classList.add('show');
    
    setTimeout(() => {
        taskTitleInput.focus();
    }, 100);
}

function hideModal() {
    modalOverlay.classList.remove('show');
    // Wait for the transition to complete before hiding
    setTimeout(() => {
        modalOverlay.style.display = 'none';
    }, 300);
}

function handleEditTask(e) {
    const taskElement = e.currentTarget.closest('.task');
    const taskId = taskElement.getAttribute('data-task-id');
    const statusElement = taskElement.querySelector('.task-status');
    const taskStatus = statusElement ? statusElement.innerText.trim() : 'Urgent';
    const taskTitle = taskElement.querySelector('.task-title').innerText;
    const taskTags = Array.from(taskElement.querySelectorAll('.task-tag'))
        .map(tag => tag.innerText)
        .join(', ');
    
    console.log("Editing task with priority:", taskStatus);
    
    editTaskIdInput.value = taskId;
    
    taskTitleInput.value = taskTitle;
    taskTagsInput.value = taskTags;
    
    taskStatusInput.value = 'Urgent';
    
    let priorityFound = false;
    
    for (let i = 0; i < taskStatusInput.options.length; i++) {
        if (taskStatusInput.options[i].value === taskStatus) {
            taskStatusInput.selectedIndex = i;
            priorityFound = true;
            console.log("Priority matched exactly:", taskStatus);
            break;
        }
    }
    
    if (!priorityFound) {
        for (let i = 0; i < taskStatusInput.options.length; i++) {
            if (taskStatusInput.options[i].value.toLowerCase() === taskStatus.toLowerCase()) {
                taskStatusInput.selectedIndex = i;
                priorityFound = true;
                console.log("Priority matched case-insensitive:", taskStatus);
                break;
            }
        }
    }
    
    if (!priorityFound) {
        console.log("No priority match found, defaulting to first option");
        taskStatusInput.selectedIndex = 0;
    }
    
    addTaskInColumn.innerText = 'Update Task';
    
    showModal();
}

function handleDeleteTask(e) {
    const taskElement = e.currentTarget.closest('.task');
    const taskId = taskElement.getAttribute('data-task-id');
    
    deleteTaskIdInput.value = taskId;
    
    confirmDialog.style.display = 'block';
}

document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', handleEditTask);
});

document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', handleDeleteTask);
});

addTaskBtn.addEventListener('click', () => {
    taskStatusInput.selectedIndex = 0; // Set to first option (Urgent)
    taskTitleInput.value = '';
    taskTagsInput.value = '';
    editTaskIdInput.value = '';
    
    addTaskInColumn.innerText = 'Add Task';
    
    showModal();
});

addTaskButtons.forEach((button) => {
    button.addEventListener('click', () => {
        taskStatusInput.selectedIndex = 0; // Set to first option (Urgent)
        taskTitleInput.value = '';
        taskTagsInput.value = '';
        editTaskIdInput.value = '';
        
        addTaskInColumn.innerText = 'Add Task';
        
        showModal();
    });
});

cancelBtn.addEventListener('click', () => {
    hideModal();
});

addTaskInColumn.addEventListener('click', () => {
    const taskStatus = taskStatusInput.value ? taskStatusInput.value.trim() : 'Urgent';
    const taskTitle = taskTitleInput.value ? taskTitleInput.value.trim() : '';
    const taskTags = taskTagsInput.value ? taskTagsInput.value.trim() : '';
    const editTaskId = editTaskIdInput.value;
    
    console.log("Form submission - Priority:", taskStatus);
    
    if (taskTitle === '') {
        showToast('Please enter a task title', 'error');
        return;
    }
    
    const validPriorities = ['Urgent', 'High', 'Medium'];
    if (!validPriorities.includes(taskStatus)) {
        console.log("Invalid priority selected:", taskStatus);
        showToast('Invalid priority selected, using Urgent instead', 'warning');
        taskStatusInput.selectedIndex = 0;
    }
    
    const finalPriority = taskStatusInput.value;
    
    if (editTaskId) {
        const taskElement = document.querySelector(`[data-task-id="${editTaskId}"]`);
        if (taskElement) {
            console.log(`Updating task: ${taskTitle} with priority: ${finalPriority}`);
            
            taskElement.classList.remove('Urgent', 'High', 'Medium');
            taskElement.classList.add(finalPriority);
            
            const statusElement = taskElement.querySelector('.task-status');
            if (statusElement) {
                statusElement.classList.remove('Urgent', 'High', 'Medium');
                statusElement.classList.add(finalPriority);
                statusElement.innerText = finalPriority;
            }
            
            const titleElement = taskElement.querySelector('.task-title');
            if (titleElement) {
                titleElement.innerText = taskTitle;
            }
            
            const tagElement = taskElement.querySelector('.task-tags');
            if (tagElement) {
                tagElement.innerHTML = '';
                
                if (taskTags) {
                    const tags = taskTags.split(',').map(t => t.trim());
                    tags.forEach(tagText => {
                        if (tagText) {
                            const tagSpan = document.createElement('span');
                            tagSpan.classList.add('task-tag');
                            tagSpan.innerText = tagText;
                            tagElement.appendChild(tagSpan);
                        }
                    });
                }
            }
            
            const dateElement = taskElement.querySelector('.task-datetime');
            if (dateElement) {
                const now = new Date();
                const timeValue = formatDateTime(now);
                dateElement.innerHTML = `<i class="far fa-clock"></i> ${timeValue} (updated)`;
            } else {
                const dateElement = document.createElement('div');
                dateElement.classList.add('task-datetime');
                const now = new Date();
                const timeValue = formatDateTime(now);
                dateElement.innerHTML = `<i class="far fa-clock"></i> ${timeValue}`;
                taskElement.appendChild(dateElement);
            }
            
            showToast('Task updated successfully!', 'success');
            
            saveTasksToLocalStorage();
        }
    } else {
        const newTask = createTaskElement(finalPriority, taskTitle, taskTags);
        
        const todoColumn = document.querySelector('.column.todo .task-list');
        todoColumn.appendChild(newTask);
        
        showToast('Task added successfully!', 'success');
        
        saveTasksToLocalStorage();
    }
    
    updateColumnCounts();
    
    hideModal();
});

confirmDialogCancel.addEventListener('click', () => {
    confirmDialog.style.display = 'none';
});

confirmDialogConfirm.addEventListener('click', () => {
    const action = confirmDialog.getAttribute('data-action');
    
    if (action === 'clear-board') {
        clearBoard();
    } else {
        const taskId = deleteTaskIdInput.value;
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        
        if (taskElement) {
            taskElement.classList.add('task-deleting');
            
            setTimeout(() => {
                taskElement.remove();
                updateColumnCounts();
                showToast('Task deleted successfully!', 'info');
                
                saveTasksToLocalStorage();
            }, 300);
        }
    }
    
    confirmDialog.style.display = 'none';
    confirmDialog.removeAttribute('data-action');
});

updateColumnCounts();

document.addEventListener('keydown', (e) => {
    if (modalOverlay.style.display === 'flex') {
        // Enter key to submit form
        if (e.key === 'Enter' && !e.ctrlKey) {
            e.preventDefault();
            addTaskInColumn.click();
        }
        
        // Escape key to close modal
        if (e.key === 'Escape') {
            hideModal();
        }
        
        // Tab key to cycle through form fields
        if (e.key === 'Tab') {
            const focusableElements = modalOverlay.querySelectorAll('button, input, select');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            // If shift+tab and focus is on first element, move to last element
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
            
            // If tab and focus is on last element, move to first element
            if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }
    
    // If confirmation dialog is visible
    if (confirmDialog.style.display === 'block') {
        // Enter key to confirm
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmDialogConfirm.click();
        }
        
        // Escape key to cancel
        if (e.key === 'Escape') {
            confirmDialog.style.display = 'none';
        }
    }
    
    // Ctrl+N to add new task (only if modal is not visible)
    if (e.ctrlKey && e.key === 'n' && modalOverlay.style.display !== 'flex') {
        e.preventDefault();
        addTaskBtn.click();
    }
});

// Close modal when clicking outside of it
window.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        hideModal();
    }
    
    if (e.target === confirmDialog) {
        confirmDialog.style.display = 'none';
    }
});

// Prevent clicks inside the modal from closing it
document.querySelector('.modal').addEventListener('click', (e) => {
    e.stopPropagation();
});

document.querySelector('.confirm-dialog').addEventListener('click', (e) => {
    e.stopPropagation();
});

// Handle clear board button click
clearBoardBtn.addEventListener('click', () => {
    showClearBoardConfirmation();
});

// Load tasks from local storage when the page loads
window.addEventListener('load', () => {
    loadTasksFromLocalStorage();
});