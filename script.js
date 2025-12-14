const STORAGE_KEY = 'todoTasks';

let tasks = [];
let currentFilter = 'all';

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const filterBtns = document.querySelectorAll('.filter-btn');
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const completedCount = document.getElementById('completedCount');
const clearCompletedBtn = document.getElementById('clearCompleted');

function init() {
    loadTasks();
    renderTasks();
    setupEventListeners();
}

function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch (e) {
            tasks = [];
        }
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function addTask(text) {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    
    const task = {
        id: generateId(),
        text: trimmedText,
        completed: false,
        createdAt: Date.now()
    };
    
    tasks.unshift(task);
    saveTasks();
    renderTasks();
    taskInput.value = '';
    taskInput.focus();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function updateTask(id, newText) {
    const trimmedText = newText.trim();
    if (!trimmedText) return false;
    
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.text = trimmedText;
        saveTasks();
        return true;
    }
    return false;
}

function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        default:
            return tasks;
    }
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    
    totalCount.textContent = `Total: ${total}`;
    activeCount.textContent = `Active: ${active}`;
    completedCount.textContent = `Completed: ${completed}`;
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item${task.completed ? ' completed' : ''}`;
    li.dataset.id = task.id;
    
    li.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-text">${escapeHtml(task.text)}</span>
        <div class="task-actions">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>
    `;
    
    return li;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderTasks() {
    const filteredTasks = getFilteredTasks();
    taskList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        if (tasks.length === 0) {
            emptyState.innerHTML = '<p>No tasks yet</p><p>Add your first task above!</p>';
        } else {
            emptyState.innerHTML = `<p>No ${currentFilter} tasks</p>`;
        }
        
        taskList.appendChild(emptyState);
    } else {
        filteredTasks.forEach(task => {
            taskList.appendChild(createTaskElement(task));
        });
    }
    
    updateStats();
}

function enterEditMode(taskItem) {
    const taskId = taskItem.dataset.id;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const textSpan = taskItem.querySelector('.task-text');
    const actionsDiv = taskItem.querySelector('.task-actions');
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-text-input';
    input.value = task.text;
    
    textSpan.replaceWith(input);
    
    actionsDiv.innerHTML = `
        <button class="save-btn">Save</button>
        <button class="cancel-btn">Cancel</button>
    `;
    
    input.focus();
    input.select();
    
    function saveEdit() {
        const newText = input.value.trim();
        if (newText && updateTask(taskId, newText)) {
            renderTasks();
        } else if (!newText) {
            cancelEdit();
        }
    }
    
    function cancelEdit() {
        renderTasks();
    }
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });
    
    input.addEventListener('blur', (e) => {
        if (!e.relatedTarget || !actionsDiv.contains(e.relatedTarget)) {
            setTimeout(() => {
                if (document.activeElement !== input && 
                    !actionsDiv.contains(document.activeElement)) {
                    saveEdit();
                }
            }, 100);
        }
    });
    
    actionsDiv.querySelector('.save-btn').addEventListener('click', saveEdit);
    actionsDiv.querySelector('.cancel-btn').addEventListener('click', cancelEdit);
}

function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
}

function setupEventListeners() {
    addBtn.addEventListener('click', () => addTask(taskInput.value));
    
    taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addTask(taskInput.value);
        }
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    taskList.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        
        const taskId = taskItem.dataset.id;
        
        if (e.target.classList.contains('task-checkbox')) {
            toggleTask(taskId);
        } else if (e.target.classList.contains('delete-btn')) {
            deleteTask(taskId);
        } else if (e.target.classList.contains('edit-btn')) {
            enterEditMode(taskItem);
        }
    });
    
    taskList.addEventListener('dblclick', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (taskItem && e.target.classList.contains('task-text')) {
            enterEditMode(taskItem);
        }
    });
    
    clearCompletedBtn.addEventListener('click', clearCompleted);
}

document.addEventListener('DOMContentLoaded', init);
