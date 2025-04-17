document.addEventListener('DOMContentLoaded', function() {
    const newTaskBtn = document.getElementById('newTaskBtn');
    const taskModal = document.getElementById('taskModal');
    const closeModal = document.getElementById('closeModal');
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    const taskForm = document.getElementById('taskForm');
    const modalTitle = document.getElementById('modalTitle');
    const taskIdInput = document.getElementById('taskId');
    const kanbanBoard = document.getElementById('kanbanBoard');

    const statuses = ['NUEVA', 'EN_PROGRESO', 'PENDIENTE', 'COMPLETADA'];
    let currentCategoryFilter = null;

    loadTasks();

    newTaskBtn.addEventListener('click', () => openTaskModal());
    closeModal.addEventListener('click', closeTaskModal);
    cancelTaskBtn.addEventListener('click', closeTaskModal);
    taskForm.addEventListener('submit', handleFormSubmit);
    
    function openTaskModal(taskId = null) {
        if (taskId) {
            modalTitle.textContent = 'Editar Tarea';
            taskIdInput.value = taskId;
            fetchTaskDetails(taskId);
        } else {
            modalTitle.textContent = 'Nueva Tarea';
            taskForm.reset();
            taskIdInput.value = '';
        }
        taskModal.classList.add('active');
    }
    
    function closeTaskModal() {
        taskModal.classList.remove('active');
    }
    
    function fetchTaskDetails(taskId) {
        apiFetch(`/api/tareas/${taskId}`)
            .then(task => {
                document.getElementById('taskTitle').value = task.titulo;
                document.getElementById('taskDescription').value = task.descripcion || '';
                document.getElementById('taskDueDate').value = task.fecha_vencimiento || '';
                document.getElementById('taskCategory').value = task.categoria_id || '';
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error al cargar los detalles de la tarea', 'error');
            });
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const taskId = taskIdInput.value;
        const method = taskId ? 'PUT' : 'POST';
        const url = taskId ? `/api/tareas/${taskId}` : '/api/tareas';
        
        const taskData = {
            titulo: document.getElementById('taskTitle').value,
            descripcion: document.getElementById('taskDescription').value,
            fecha_vencimiento: document.getElementById('taskDueDate').value || null,
            estado: taskId ? undefined : 'NUEVA', // Solo para nuevas tareas
            categoria_id: document.getElementById('taskCategory').value || null
        };
        
        apiFetch(url, {
            method: method,
            body: taskData
        })
        .then(data => {
            showNotification(
                taskId ? 'Tarea actualizada correctamente' : 'Tarea creada correctamente', 
                'success'
            );
            closeTaskModal();
            loadTasks();
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al guardar la tarea', 'error');
        });
    }
    
    function loadTasks() {
        let url = '/api/tareas';
        if (currentCategoryFilter) {
            url += `?categoria_id=${currentCategoryFilter}`;
        }
        
        apiFetch(url)
            .then(tasks => {
                renderKanbanBoard(tasks);
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error al cargar las tareas', 'error');
            });
    }
    
    function renderKanbanBoard(tasks) {
        kanbanBoard.innerHTML = '';
        
        if (tasks.length === 0) {
            kanbanBoard.innerHTML = `
                <div class="empty-tasks">
                    <i class="material-icons">assignment</i>
                    <p>No hay tareas registradas</p>
                </div>
            `;
            return;
        }
        
        statuses.forEach(status => {
            const columnTasks = tasks.filter(task => task.estado === status);
            
            const column = document.createElement('div');
            column.className = `kanban-column ${status}`;
            
            column.innerHTML = `
                <div class="kanban-column-header">
                    ${status.replace('_', ' ')} (${columnTasks.length})
                </div>
                <div class="kanban-column-tasks" data-status="${status}"></div>
            `;
            
            kanbanBoard.appendChild(column);
            
            const tasksContainer = column.querySelector('.kanban-column-tasks');
            columnTasks.forEach(task => {
                tasksContainer.appendChild(createTaskCard(task));
            });
            setupDragAndDrop(tasksContainer);
        });
    }
    
    function createTaskCard(task) {
        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${task.estado}`;
        taskCard.dataset.id = task.id;
        taskCard.draggable = true;
        
        const dueDate = task.fecha_vencimiento ? new Date(task.fecha_vencimiento) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let dueDateInfo = '';
        if (dueDate) {
            const isOverdue = dueDate < today && task.estado !== 'COMPLETADA';
            dueDateInfo = `
                <div class="task-card-due ${isOverdue ? 'overdue' : ''}">
                    <i class="material-icons" style="font-size:14px;">event</i>
                    ${dueDate.toLocaleDateString()} ${isOverdue ? ' (Vencida)' : ''}
                </div>
            `;
        }
        
        taskCard.innerHTML = `
            <div class="task-card-header">
                <h3 class="task-card-title">${escapeHtml(task.titulo)}</h3>
                <span class="task-card-status">${task.estado.replace('_', ' ')}</span>
            </div>
            
            ${task.descripcion ? `<p style="font-size:14px;margin:5px 0;">${escapeHtml(task.descripcion)}</p>` : ''}
            
            ${dueDateInfo}
            
            ${task.categoria_nombre ? `
                <div class="task-card-category">
                    <i class="material-icons" style="font-size:14px;">${getCategoryIcon(task.categoria_nombre)}</i>
                    ${escapeHtml(task.categoria_nombre)}
                </div>
            ` : ''}
            
            <div class="task-card-actions">
                <div class="task-card-dropdown">
                    <select onchange="updateTaskStatus(${task.id}, this.value)" 
                        ${task.puede_editar ? '' : 'disabled'}>
                        <option value="NUEVA" ${task.estado === 'NUEVA' ? 'selected' : ''}>Nueva</option>
                        <option value="EN_PROGRESO" ${task.estado === 'EN_PROGRESO' ? 'selected' : ''}>En Progreso</option>
                        <option value="PENDIENTE" ${task.estado === 'PENDIENTE' ? 'selected' : ''}>Pendiente</option>
                        <option value="COMPLETADA" ${task.estado === 'COMPLETADA' ? 'selected' : ''}>Completada</option>
                    </select>
                </div>
                
                <div class="task-card-buttons">
                    ${task.puede_editar ? `
                        <button class="task-card-button" onclick="event.stopPropagation(); editTask(${task.id})">
                            <i class="material-icons" style="font-size:18px;">edit</i>
                        </button>
                    ` : ''}
                    
                    ${task.puede_eliminar ? `
                        <button class="task-card-button" onclick="event.stopPropagation(); deleteTask(${task.id})">
                            <i class="material-icons" style="font-size:18px;">delete</i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        taskCard.addEventListener('dragstart', handleDragStart);
        taskCard.addEventListener('dragend', handleDragEnd);
        
        return taskCard;
    }
    
    function setupDragAndDrop(container) {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('dragenter', handleDragEnter);
        container.addEventListener('dragleave', handleDragLeave);
        container.addEventListener('drop', handleDrop);
    }
    
    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
        e.target.classList.add('dragging');
    }
    
    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }
    
    function handleDragOver(e) {
        e.preventDefault();
    }
    
    function handleDragEnter(e) {
        e.preventDefault();
        if (e.target.classList.contains('kanban-column-tasks')) {
            e.target.style.backgroundColor = 'rgba(0,0,0,0.05)';
        }
    }
    
    function handleDragLeave(e) {
        if (e.target.classList.contains('kanban-column-tasks')) {
            e.target.style.backgroundColor = '';
        }
    }
    
    function handleDrop(e) {
        e.preventDefault();
        if (e.target.classList.contains('kanban-column-tasks')) {
            e.target.style.backgroundColor = '';
            
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = e.target.dataset.status;
            
            updateTaskStatus(taskId, newStatus);
        }
    }
    
    function getCategoryIcon(categoryName) {
        if (!categoryName) return 'category';
        return {
            'Trabajo': 'work',
            'Personal': 'home',
            'Estudio': 'school'
        }[categoryName] || 'category';
    }
    
    function filterTasksByCategory(element, categoryId) {
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        element.classList.add('active');
        currentCategoryFilter = categoryId;
        loadTasks();
    }
    
    function openNewCategoryModal() {
        document.getElementById('categoryModal').classList.add('active');
    }
    
    function closeCategoryModal() {
        document.getElementById('categoryModal').classList.remove('active');
        document.getElementById('categoryForm').reset();
    }
    
    function createNewCategory(event) {
        event.preventDefault();
        
        const categoryData = {
            nombre: document.getElementById('categoryName').value,
            descripcion: document.getElementById('categoryDescription').value
        };
        
        apiFetch('/api/categorias', {
            method: 'POST',
            body: categoryData
        })
        .then(() => {
            showNotification('Categoría creada correctamente', 'success');
            closeCategoryModal();
            window.location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al crear la categoría', 'error');
        });
    }
    
    window.filterTasksByCategory = filterTasksByCategory;
    window.openNewCategoryModal = openNewCategoryModal;
    window.closeCategoryModal = closeCategoryModal;
    window.createNewCategory = createNewCategory;
    window.editTask = function(taskId) {
        openTaskModal(taskId);
    };
    
    window.deleteTask = function(taskId) {
        if (confirm('¿Estás seguro de eliminar esta tarea?')) {
            apiFetch(`/api/tareas/${taskId}`, {
                method: 'DELETE'
            })
            .then(() => {
                showNotification('Tarea eliminada correctamente', 'success');
                loadTasks();
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error al eliminar la tarea', 'error');
            });
        }
    };
    
    window.updateTaskStatus = function(taskId, newStatus) {
        apiFetch(`/api/tareas/${taskId}`, {
            method: 'PUT',
            body: {
                estado: newStatus
            }
        })
        .then(() => {
            loadTasks();
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al actualizar el estado', 'error');
        });
    };
});