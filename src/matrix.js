const OFFSET = 10;

// 允許拖放
function allowDrop(event) {
    event.preventDefault();
}

// 拖曳事件
function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
    event.target.style.opacity = '0.5';
}

// 放置事件
async function drop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text");
    const task = document.getElementById(data);
    if (!task) return;

    // 計算新位置
    const matrix = document.getElementById('matrix');
    const rect = matrix.getBoundingClientRect();
    const matrixWidth = matrix.clientWidth;
    const matrixHeight = matrix.clientHeight;

    let x = Math.max(OFFSET, Math.min(event.clientX - rect.left, matrixWidth - task.offsetWidth - OFFSET));
    let y = Math.max(OFFSET, Math.min(event.clientY - rect.top, matrixHeight - task.offsetHeight - OFFSET));

    const importance = Math.round(((x - OFFSET) / (matrixWidth - 2 * OFFSET)) * 100);
    const urgency = Math.round(100 - ((y - OFFSET) / (matrixHeight - 2 * OFFSET)) * 100);

    task.style.left = `${x}px`;
    task.style.top = `${y}px`;

    // 更新後端數據
    const taskId = task.id.split('-')[1];
    try {
        const response = await fetch(`/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ importance, urgency }),
        });

        if (!response.ok) throw new Error('Failed to update task position');
        fetchTasks(); // 更新任務
    } catch (error) {
        console.error(error);
    }
}

// 添加任務
async function addTask() {
    const taskName = document.getElementById('taskName').value;
    const importance = parseInt(document.getElementById('importance').value);
    const urgency = parseInt(document.getElementById('urgency').value);

    if (!taskName) {
        alert('請輸入任務名稱');
        return;
    }

    try {
        const response = await fetch('/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: taskName, importance, urgency }),
        });

        if (!response.ok) throw new Error('Failed to add task');
        fetchTasks();
    } catch (error) {
        console.error(error);
    }
}

// 獲取任務
async function fetchTasks() {
    try {
        const response = await fetch('/tasks');
        if (!response.ok) throw new Error('Failed to fetch tasks');
        const tasks = await response.json();
        updateMatrix(tasks);
        updatePriorityQueue(tasks);
    } catch (error) {
        console.error(error);
    }
}

// 更新矩陣
function updateMatrix(tasks) {
    const matrix = document.getElementById('matrix');
    matrix.querySelectorAll('.task').forEach(task => task.remove());

    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        taskElement.id = `task-${task.id}`;
        taskElement.textContent = task.name;
        taskElement.draggable = true;
        taskElement.ondragstart = drag;
        taskElement.style.left = `${(task.importance / 100) * matrix.clientWidth}px`;
        taskElement.style.top = `${(1 - task.urgency / 100) * matrix.clientHeight}px`;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.onclick = () => deleteTask(task.id);
        taskElement.appendChild(deleteBtn);

        matrix.appendChild(taskElement);
    });
}

// 刪除任務
async function deleteTask(taskId) {
    try {
        const response = await fetch(`/tasks/${taskId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete task');
        fetchTasks();
    } catch (error) {
        console.error(error);
    }
}

// 更新優先順序佇列
function updatePriorityQueue(tasks) {
    const priorityQueue = document.getElementById('priorityQueue');
    priorityQueue.innerHTML = '';

    tasks.sort((a, b) => (b.importance + b.urgency) - (a.importance + a.urgency))
        .forEach(task => {
            const queueItem = document.createElement('div');
            queueItem.className = 'queue-item';
            queueItem.innerHTML = `
                <div class="task-info">
                    <span class="priority-score">${task.importance + task.urgency}</span>
                    <span class="task-name">${task.name}</span>
                    <span class="task-metrics">重要性: ${task.importance}% | 緊急性: ${task.urgency}%</span>
                </div>`;
            priorityQueue.appendChild(queueItem);
        });
}

// 切換選單顯示
function toggleMenu() {
    const menuContent = document.getElementById('menuContent');
    menuContent.style.display = menuContent.style.display === 'block' ? 'none' : 'block';
}

// 初始化
window.onload = fetchTasks;
