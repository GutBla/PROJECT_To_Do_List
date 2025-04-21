/**
 * Inicializa la aplicación cuando el DOM está completamente cargado
 */
document.addEventListener("DOMContentLoaded", function () {
    // Elementos del DOM
    const newTaskBtn = document.getElementById("newTaskBtn");
    const taskModal = document.getElementById("taskModal");
    const closeModal = document.getElementById("closeModal");
    const cancelTaskBtn = document.getElementById("cancelTaskBtn");
    const taskForm = document.getElementById("taskForm");
    const modalTitle = document.getElementById("modalTitle");
    const taskIdInput = document.getElementById("taskId");
    const kanbanBoard = document.getElementById("kanbanBoard");

    // Constantes y variables de estado
    const statuses = ["NUEVA", "PENDIENTE", "EN_PROGRESO", "COMPLETADA"];
    let currentCategoryFilter = null;
    let currentSharedTaskId = null;

    // Carga inicial de tareas
    loadTasks();

    // Event Listeners
    newTaskBtn.addEventListener("click", () => openTaskModal());
    closeModal.addEventListener("click", closeTaskModal);
    cancelTaskBtn.addEventListener("click", closeTaskModal);
    taskForm.addEventListener("submit", handleFormSubmit);

    /**
     * Abre el modal de tarea para crear o editar
     * @param {number|null} taskId - ID de la tarea a editar (null para nueva tarea)
     */
    function openTaskModal(taskId = null) {
        if (taskId) {
            modalTitle.textContent = "Editar Tarea";
            taskIdInput.value = taskId;
            fetchTaskDetails(taskId);
        } else {
            modalTitle.textContent = "Nueva Tarea";
            taskForm.reset();
            taskIdInput.value = "";
        }
        taskModal.classList.add("active");
    }

    /**
     * Cierra el modal de tarea
     */
    function closeTaskModal() {
        taskModal.classList.remove("active");
    }

    /**
     * Obtiene los detalles de una tarea específica
     * @param {number} taskId - ID de la tarea
     */
    function fetchTaskDetails(taskId) {
        apiFetch(`/api/tareas/${taskId}`)
            .then((task) => {
                document.getElementById("taskTitle").value = task.titulo;
                document.getElementById("taskDescription").value =
                    task.descripcion || "";
                document.getElementById("taskDueDate").value =
                    task.fecha_vencimiento || "";
                document.getElementById("taskCategory").value =
                    task.categoria_id || "";
            })
            .catch((error) => {
                console.error("Error:", error);
                showNotification(
                    "Error al cargar los detalles de la tarea",
                    "error"
                );
            });
    }

    /**
     * Maneja el envío del formulario de tarea
     * @param {Event} e - Evento submit
     */
    function handleFormSubmit(e) {
        e.preventDefault();

        const taskId = taskIdInput.value;
        const method = taskId ? "PUT" : "POST";
        const url = taskId ? `/api/tareas/${taskId}` : "/api/tareas";

        const taskData = {
            titulo: document.getElementById("taskTitle").value,
            descripcion: document.getElementById("taskDescription").value,
            fecha_vencimiento:
                document.getElementById("taskDueDate").value || null,
            estado: taskId ? undefined : "NUEVA",
            categoria_id: document.getElementById("taskCategory").value || null,
        };

        // Obtener el token CSRF del meta tag
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");

        // Configuración de la solicitud
        const headers = {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken, // Agregar el token CSRF aquí
        };

        const body = JSON.stringify(taskData);

        apiFetch(url, { method, body, headers })
            .then(() => {
                showNotification(
                    taskId
                        ? "Tarea actualizada correctamente"
                        : "Tarea creada correctamente",
                    "success"
                );
                closeTaskModal();
                loadTasks();
            })
            .catch((error) => {
                console.error("Error:", error);
                showNotification("Error al guardar la tarea", "error");
            });
    }

    /**
     * Carga las tareas desde el servidor
     */
    function loadTasks() {
        const params = new URLSearchParams();
        if (currentCategoryFilter) {
            params.append("categoria_id", currentCategoryFilter);
        }

        apiFetch(`/api/tareas?${params.toString()}`)
            .then((tasks) => renderKanbanBoard(tasks))
            .catch((error) => {
                console.error("Error:", error);
                showNotification("Error al cargar las tareas", "error");
            });
    }

    /**
     * Renderiza el tablero Kanban con las tareas
     * @param {Array} tasks - Lista de tareas
     */
    function renderKanbanBoard(tasks) {
        kanbanBoard.innerHTML = "";

        if (tasks.length === 0) {
            kanbanBoard.innerHTML = `
        <div class="empty-tasks">
          <i class="material-icons">assignment</i>
          <p>No hay tareas registradas</p>
        </div>
      `;
            return;
        }

        statuses.forEach((status) => {
            const columnTasks = tasks.filter((task) => task.estado === status);

            const column = document.createElement("div");
            column.className = `kanban-column ${status}`;

            column.innerHTML = `
        <div class="kanban-column-header">
          ${status.replace("_", " ")} <span class="task-count">(${
                columnTasks.length
            })</span>
        </div>
        <div class="kanban-column-tasks" data-status="${status}">
        </div>

      `;

            kanbanBoard.appendChild(column);

            const tasksContainer = column.querySelector(".kanban-column-tasks");
            columnTasks.forEach((task) =>
                tasksContainer.appendChild(createTaskCard(task))
            );
            setupDragAndDrop(tasksContainer);
        });
    }

    /**
     * Crea una tarjeta de tarea para el tablero Kanban
     * @param {Object} task - Objeto de tarea
     * @returns {HTMLElement} Elemento HTML de la tarjeta
     */
    function createTaskCard(task) {
        const taskCard = document.createElement("div");
        taskCard.className = `task-card ${task.estado}`;
        taskCard.dataset.id = task.id;
        taskCard.draggable = true;

        const dueDate = task.fecha_vencimiento
            ? new Date(task.fecha_vencimiento)
            : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let dueDateInfo = "";
        if (dueDate) {
            const isOverdue = dueDate < today && task.estado !== "COMPLETADA";
            dueDateInfo = `
        <div class="task-card-due ${isOverdue ? "overdue" : ""}">
          <i class="material-icons" style="font-size:14px;">event</i>
          ${dueDate.toLocaleDateString()} ${isOverdue ? " (Vencida)" : ""}
        </div>
      `;
        }

        taskCard.innerHTML = `
    <div class="task-card-header">
      <div style="display: flex; align-items: center; gap: 8px;">
        <label class="custom-checkbox">
          <input type="checkbox" 
                ${task.estado === "COMPLETADA" ? "checked" : ""}
                onchange="toggleTaskCompletion(${task.id}, this.checked)">
          <span class="checkmark"></span>
        </label>
        <h3 class="task-card-title">${escapeHtml(task.titulo)}</h3>
      </div>
      <span class="task-card-status">${task.estado.replace("_", " ")}</span>
    </div>
      ${
          task.descripcion
              ? `<p style="font-size:14px;margin:5px 0;">${escapeHtml(
                    task.descripcion
                )}</p>`
              : ""
      }
      ${dueDateInfo}
      ${
          task.categoria_nombre
              ? `
        <div class="task-card-category">
          <i class="material-icons" style="font-size:14px;">${getCategoryIcon(
              task.categoria_nombre
          )}</i>
          ${escapeHtml(task.categoria_nombre)}
        </div>
      `
              : ""
      }
      <div class="task-card-actions">
        <div class="task-card-dropdown">
          <select onchange="updateTaskStatus(${task.id}, this.value)" 
            ${task.puede_editar ? "" : "disabled"}>
            <option value="NUEVA" ${
                task.estado === "NUEVA" ? "selected" : ""
            }>Nueva</option>
            <option value="EN_PROGRESO" ${
                task.estado === "EN_PROGRESO" ? "selected" : ""
            }>En Progreso</option>
            <option value="PENDIENTE" ${
                task.estado === "PENDIENTE" ? "selected" : ""
            }>Pendiente</option>
            <option value="COMPLETADA" ${
                task.estado === "COMPLETADA" ? "selected" : ""
            }>Completada</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
     </div>
        <div class="task-card-buttons">
          ${
              task.puede_editar
                  ? `
            <button class="task-card-button" onclick="event.stopPropagation(); editTask(${task.id})">
              <i class="material-icons" style="font-size:18px;">edit</i>
            </button>
          `
                  : ""
          }
          ${
              task.puede_eliminar
                  ? `
            <button class="task-card-button" onclick="event.stopPropagation(); deleteTask(${task.id})">
              <i class="material-icons" style="font-size:18px;">delete</i>
            </button>
          `
                  : ""
          }
          ${
              task.es_propia
                  ? `
            <button class="task-card-button" onclick="event.stopPropagation(); openShareModal(${task.id})">
              <i class="material-icons" style="font-size:18px;">share</i>
            </button>
          `
                  : ""
          }
        </div>
      </div>
    `;

        taskCard.addEventListener("dragstart", handleDragStart);
        taskCard.addEventListener("dragend", handleDragEnd);

        return taskCard;
    }

    // Funciones de Drag and Drop
    /**
     * Configura los eventos de drag and drop para un contenedor
     * @param {HTMLElement} container - Contenedor de tareas
     */
    function setupDragAndDrop(container) {
        container.addEventListener("dragover", handleDragOver);
        container.addEventListener("dragenter", handleDragEnter);
        container.addEventListener("dragleave", handleDragLeave);
        container.addEventListener("drop", handleDrop);
    }

    function handleDragStart(e) {
        e.dataTransfer.setData("text/plain", e.target.dataset.id);
        e.target.classList.add("dragging");
    }

    function handleDragEnd(e) {
        e.target.classList.remove("dragging");
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDragEnter(e) {
        e.preventDefault();
        if (e.target.classList.contains("kanban-column-tasks")) {
            e.target.style.backgroundColor = "rgba(0,0,0,0.05)";
        }
    }

    function handleDragLeave(e) {
        if (e.target.classList.contains("kanban-column-tasks")) {
            e.target.style.backgroundColor = "";
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        if (e.target.classList.contains("kanban-column-tasks")) {
            e.target.style.backgroundColor = "";

            const taskId = e.dataTransfer.getData("text/plain");
            const newStatus = e.target.dataset.status;

            updateTaskStatus(taskId, newStatus);
        }
    }

    // Funciones utilitarias
    /**
     * Obtiene el ícono correspondiente a una categoría
     * @param {string} categoryName - Nombre de la categoría
     * @returns {string} Nombre del ícono
     */
    function getCategoryIcon(categoryName) {
        if (!categoryName) return "category";
        return (
            {
                Trabajo: "work",
                Personal: "home",
                Estudio: "school",
            }[categoryName] || "category"
        );
    }

    /**
     * Escapa texto para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string} Texto escapado
     */
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // Funciones de categorías
    /**
     * Filtra tareas por categoría
     * @param {HTMLElement} element - Elemento de categoría clickeado
     * @param {number} categoryId - ID de la categoría
     */
    function filterTasksByCategory(element, categoryId) {
        document
            .querySelectorAll(".category-item")
            .forEach((item) => item.classList.remove("active"));
        element.classList.add("active");
        currentCategoryFilter = categoryId;
        loadTasks();
    }

    function openNewCategoryModal() {
        document.getElementById("categoryModal").classList.add("active");
    }

    function closeCategoryModal() {
        document.getElementById("categoryModal").classList.remove("active");
        document.getElementById("categoryForm").reset();
    }

    /**
     * Crea una nueva categoría
     * @param {Event} event - Evento submit
     */
    function createNewCategory(event) {
        event.preventDefault();

        const categoryData = {
            nombre: document.getElementById("categoryName").value,
            descripcion: document.getElementById("categoryDescription").value,
        };

        // Obtener el token CSRF del meta tag
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");

        // Configuración de la solicitud
        const headers = {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        };

        const body = JSON.stringify(categoryData);

        apiFetch("/api/categorias", { method: "POST", body, headers })
            .then(() => {
                showNotification("Categoría creada correctamente", "success");
                closeCategoryModal();
                window.location.reload();
            })
            .catch((error) => {
                console.error("Error:", error);
                showNotification("Error al crear la categoría", "error");
            });
    }

    // Funciones de compartir tareas
    /**
     * Abre el modal para compartir tarea
     * @param {number} taskId - ID de la tarea
     */
    function openShareModal(taskId) {
        currentSharedTaskId = taskId;
        document.getElementById("shareTaskId").value = taskId;
        document.getElementById("shareModal").classList.add("active");
        document.getElementById("shareError").textContent = "";
        loadSharedUsers(taskId);
    }

    function closeShareModal() {
        document.getElementById("shareModal").classList.remove("active");
        document.getElementById("shareForm").reset();
        currentSharedTaskId = null;
    }

    /**
     * Maneja el envío del formulario para compartir tarea
     * @param {Event} event - Evento submit
     */
    function handleShareSubmit(event) {
        event.preventDefault();

        const email = document.getElementById("shareEmail").value;
        const permissions = document.getElementById("sharePermissions").value;
        const taskId = document.getElementById("shareTaskId").value;
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");    

        if (!email) {
            document.getElementById("shareError").textContent = "El email es requerido";
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            document.getElementById("shareError").textContent = "Ingrese un email válido";
            return;
        }

        const headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        };

        const shareData = {
            email: email,
            permisos: permissions
        };

        const shareBtn = event.target.querySelector('button[type="submit"]');
        const originalText = shareBtn.innerHTML;
        shareBtn.innerHTML = '<i class="material-icons">hourglass_empty</i>';
        shareBtn.disabled = true;

        apiFetch(`/api/tareas/${taskId}/compartir`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(shareData)
        })
        .then(response => {
            showNotification("Tarea compartida exitosamente", "success");
            closeShareModal();
            loadSharedUsers(taskId); // Recargar la lista de usuarios compartidos
        })
        .catch(error => {
            console.error("Error al compartir tarea:", error);
            const errorMsg = error.details?.error || "Error al compartir la tarea";
            document.getElementById("shareError").textContent = errorMsg;
        })
        .finally(() => {
            shareBtn.innerHTML = originalText;
            shareBtn.disabled = false;
        });
    }
    
    /**
     * Carga los usuarios con acceso a una tarea
     * @param {number} taskId - ID de la tarea
     */
    function loadSharedUsers(taskId) {
        apiFetch(`/api/tareas/${taskId}`)
            .then((task) => {
                const container = document.getElementById(
                    "sharedUsersContainer"
                );
                container.innerHTML = "";

                const ownerItem = document.createElement("div");
                ownerItem.className = "shared-user-item owner";
                ownerItem.innerHTML = `
                <div class="shared-user-info">
                    <span class="shared-user-email">${escapeHtml(task.propietario.email)}</span>
                    <span class="shared-user-permissions">(Propietario)</span>
                </div>
                <div class="shared-user-actions">
                    <span class="owner-badge">Dueño</span>
                </div>
            `;
                container.appendChild(ownerItem);

                if (task.usuarios_compartidos && task.usuarios_compartidos.length > 0) {
                    task.usuarios_compartidos.forEach((user) => {
                        const userItem = document.createElement("div");
                        userItem.className = "shared-user-item";
                        userItem.innerHTML = `
                            <div class="shared-user-info">
                                <span class="shared-user-email">${escapeHtml(user.usuario.email)}</span>
                                <span class="shared-user-permissions">(${getPermissionText(user.permisos)})</span>
                            </div>
                            <div class="shared-user-actions">
                                <select class="permission-select" 
                                    onchange="updateUserPermission(${taskId}, ${user.usuario_id}, this.value)"
                                    ${user.permisos === 'PROPIETARIO' ? 'disabled' : ''}>
                                    <option value="LECTURA" ${user.permisos === "LECTURA" ? "selected" : ""}>Lectura</option>
                                    <option value="ESCRITURA" ${user.permisos === "ESCRITURA" ? "selected" : ""}>Escritura</option>
                                </select>
                                <button onclick="removeUserPermission(${taskId}, ${user.usuario_id})">
                                    <i class="material-icons">delete</i>
                                </button>
                            </div>
                        `;
                        container.appendChild(userItem);
                    });
                } else {
                    const emptyMsg = document.createElement("div");
                    emptyMsg.className = "empty-shared-users";
                    emptyMsg.innerHTML = `
                        <i class="material-icons">people</i>
                        <p>No hay otros usuarios con acceso</p>
                    `;
                    container.appendChild(emptyMsg);
                }
            })
            .catch((error) => {
                console.error("Error al cargar usuarios compartidos:", error);
                showNotification("Error al cargar usuarios con acceso", "error");
            });
    }

    /**
     * Actualiza los permisos de un usuario sobre una tarea
     * @param {number} taskId - ID de la tarea
     * @param {number} userId - ID del usuario
     * @param {string} newPermission - Nuevo nivel de permiso
     */
    function updateUserPermission(taskId, userId, newPermission) {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        
        if (!['LECTURA', 'ESCRITURA'].includes(newPermission)) {
            showNotification('Permiso inválido. Solo se permite LECTURA o ESCRITURA', 'error');
            return;
        }
    
        apiFetch(`/api/tareas/${taskId}/permisos`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                usuario_id: userId,
                permisos: newPermission
            })
        })
        .then(() => {
            showNotification('Permisos actualizados correctamente', 'success');
            loadSharedUsers(taskId);
        })
        .catch((error) => {
            console.error('Error al actualizar permisos:', error);
            const errorMsg = error.details?.error || 'Error al actualizar permisos';
            showNotification(errorMsg, 'error');
            loadSharedUsers(taskId);
        });
    }

    /**
     * Elimina los permisos de un usuario sobre una tarea
     * @param {number} taskId - ID de la tarea
     * @param {number} userId - ID del usuario
     */
    function removeUserPermission(taskId, userId) {
        if (!confirm('¿Estás seguro de eliminar el acceso de este usuario?')) {
            return;
        }
    
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        
        apiFetch(`/api/tareas/${taskId}/permisos`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                usuario_id: userId
            })
        })
        .then(() => {
            showNotification('Acceso eliminado correctamente', 'success');
            loadSharedUsers(taskId);
        })
        .catch((error) => {
            console.error('Error al eliminar permisos:', error);
            const errorMsg = error.details?.error || 'Error al eliminar acceso';
            showNotification(errorMsg, 'error');
            loadSharedUsers(taskId);
        });
    }

    /**
     * Obtiene el texto descriptivo de un permiso
     * @param {string} permiso - Código del permiso
     * @returns {string} Texto descriptivo
     */
    function getPermissionText(permiso) {
        switch (permiso) {
            case "LECTURA":
                return "Lectura";
            case "ESCRITURA":
                return "Escritura";
            case "PROPIETARIO":
                return "Propietario";
            default:
                return permiso;
        }
    }

    /**
     * Abre el modal para editar una categoría
     * @param {number} categoryId - ID de la categoría
     * @param {string} name - Nombre actual de la categoría
     * @param {string} description - Descripción actual de la categoría
     */
    function openEditCategoryModal(categoryId, name, description) {
        document.getElementById("editCategoryId").value = categoryId;
        document.getElementById("editCategoryName").value = name;
        document.getElementById("editCategoryDescription").value = description;
        document.getElementById("editCategoryModal").classList.add("active");
    }

    /**
     * Cierra el modal de edición de categoría
     */
    function closeEditCategoryModal() {
        document.getElementById("editCategoryModal").classList.remove("active");
        document.getElementById("editCategoryForm").reset();
    }

    /**
     * Actualiza una categoría existente
     * @param {Event} event - Evento submit
     */
    function updateCategory(event) {
        event.preventDefault();

        const categoryId = document.getElementById("editCategoryId").value;
        const categoryData = {
            nombre: document.getElementById("editCategoryName").value,
            descripcion: document.getElementById("editCategoryDescription")
                .value,
        };

        // Obtener el token CSRF del meta tag
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");

        // Configuración de la solicitud
        const headers = {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        };

        const body = JSON.stringify(categoryData);

        apiFetch(`/api/categorias/${categoryId}`, {
            method: "PUT",
            body,
            headers,
        })
            .then(() => {
                showNotification(
                    "Categoría actualizada correctamente",
                    "success"
                );
                closeEditCategoryModal();
                window.location.reload();
            })
            .catch((error) => {
                console.error("Error:", error);
                showNotification(
                    error.details && error.details.error
                        ? error.details.error
                        : "Error al actualizar la categoría",
                    "error"
                );
            });
    }

    /**
     * Muestra modal de confirmación para eliminar una categoría
     * @param {number} categoryId - ID de la categoría
     * @param {string} categoryName - Nombre de la categoría
     */
    function confirmDeleteCategory(categoryId, categoryName) {
        const confirmMessage = document.getElementById("confirmDeleteMessage");
        confirmMessage.textContent = `¿Estás seguro de que deseas eliminar la categoría "${categoryName}"?`;

        const confirmBtn = document.getElementById("confirmDeleteBtn");
        confirmBtn.onclick = () => deleteCategory(categoryId);

        document.getElementById("confirmDeleteModal").classList.add("active");
    }

    /**
     * Cierra el modal de confirmación de eliminación
     */
    function closeConfirmDeleteModal() {
        document
            .getElementById("confirmDeleteModal")
            .classList.remove("active");
    }

    /**
     * Elimina una categoría
     * @param {number} categoryId - ID de la categoría
     */
    function deleteCategory(categoryId) {
        // Obtener el token CSRF del meta tag
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");

        // Configuración de la solicitud
        const headers = {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        };

        apiFetch(`/api/categorias/${categoryId}`, { method: "DELETE", headers })
            .then(() => {
                showNotification(
                    "Categoría eliminada correctamente",
                    "success"
                );
                closeConfirmDeleteModal();
                window.location.reload();
            })
            .catch((error) => {
                console.error("Error:", error);
                closeConfirmDeleteModal();
                showNotification(
                    error.details && error.details.error
                        ? error.details.error
                        : "Error al eliminar la categoría",
                    "error"
                );
            });
    }

    // Funciones globales
    window.filterTasksByCategory = filterTasksByCategory;
    window.openNewCategoryModal = openNewCategoryModal;
    window.closeCategoryModal = closeCategoryModal;
    window.createNewCategory = createNewCategory;
    window.toggleTaskCompletion = function (taskId, completed) {
        const newStatus = completed ? "COMPLETADA" : "NUEVA";
        updateTaskStatus(taskId, newStatus);
    };
    window.editTask = function (taskId) {
        openTaskModal(taskId);
    };
    window.deleteTask = function (taskId) {
        if (confirm("¿Estás seguro de eliminar esta tarea?")) {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                .getAttribute("content");

            apiFetch(`/api/tareas/${taskId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken,
                },
            })
                .then(() => {
                    showNotification(
                        "Tarea eliminada correctamente",
                        "success"
                    );
                    loadTasks();
                })
                .catch((error) => {
                    console.error("Error:", error);
                    showNotification("Error al eliminar la tarea", "error");
                });
        }
    };
    window.updateTaskStatus = function (taskId, newStatus) {
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");

        apiFetch(`/api/tareas/${taskId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
            },
            body: { estado: newStatus },
        })
            .then(() => loadTasks())
            .catch((error) => {
                console.error("Error:", error);
                showNotification("Error al actualizar el estado", "error");
            });
    };
    window.openShareModal = openShareModal;
    window.closeShareModal = closeShareModal;
    window.handleShareSubmit = handleShareSubmit;
    window.updateUserPermission = updateUserPermission;
    window.removeUserPermission = removeUserPermission;
    window.openEditCategoryModal = openEditCategoryModal;
    window.closeEditCategoryModal = closeEditCategoryModal;
    window.updateCategory = updateCategory;
    window.confirmDeleteCategory = confirmDeleteCategory;
    window.closeConfirmDeleteModal = closeConfirmDeleteModal;
});
