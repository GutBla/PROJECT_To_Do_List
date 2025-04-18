/**
 * Valida el formulario de login antes del envío
 * @param {Event} event - Evento submit del formulario
 */
function validateLoginForm(event) {
    const form = event.target;
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    let isValid = true;

    // Validación del campo email
    if (!email) {
        showError('email', 'El email es requerido');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('email', 'Ingrese un email válido');
        isValid = false;
    } else {
        clearError('email');
    }

    // Validación del campo contraseña
    if (!password) {
        showError('password', 'La contraseña es requerida');
        isValid = false;
    } else if (password.length < 6) {
        showError('password', 'La contraseña debe tener al menos 6 caracteres');
        isValid = false;
    } else {
        clearError('password');
    }

    // Previene el envío si hay errores
    if (!isValid) {
        event.preventDefault();
    }
}

/**
 * Valida el formulario de registro antes del envío
 * @param {Event} event - Evento submit del formulario
 */
function validateRegisterForm(event) {
    const form = event.target;
    const nombre = form.nombre.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    let isValid = true;

    // Validación del campo nombre
    if (!nombre) {
        showError('nombre', 'El nombre es requerido');
        isValid = false;
    } else {
        clearError('nombre');
    }

    // Validación del campo email
    if (!email) {
        showError('email', 'El email es requerido');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('email', 'Ingrese un email válido');
        isValid = false;
    } else {
        clearError('email');
    }

    // Validación del campo contraseña
    if (!password) {
        showError('password', 'La contraseña es requerida');
        isValid = false;
    } else if (password.length < 6) {
        showError('password', 'La contraseña debe tener al menos 6 caracteres');
        isValid = false;
    } else {
        clearError('password');
    }

    // Previene el envío si hay errores
    if (!isValid) {
        event.preventDefault();
    }
}

/**
 * Valida si un email tiene formato válido
 * @param {string} email - Email a validar
 * @returns {boolean} True si el email es válido
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Muestra un mensaje de error para un campo del formulario
 * @param {string} fieldId - ID del campo con error
 * @param {string} message - Mensaje de error a mostrar
 */
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`) || createErrorElement(field, fieldId);
    errorElement.textContent = message;
    field.classList.add('error-field');
}

/**
 * Crea un elemento para mostrar mensajes de error
 * @param {HTMLElement} field - Campo de formulario
 * @param {string} fieldId - ID del campo
 * @returns {HTMLElement} Elemento creado para mostrar errores
 */
function createErrorElement(field, fieldId) {
    const errorElement = document.createElement('div');
    errorElement.id = `${fieldId}-error`;
    errorElement.className = 'error-message';
    field.parentNode.insertBefore(errorElement, field.nextSibling);
    return errorElement;
}

/**
 * Limpia los errores de un campo del formulario
 * @param {string} fieldId - ID del campo a limpiar
 */
function clearError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const field = document.getElementById(fieldId);

    if (errorElement) {
        errorElement.textContent = '';
    }

    if (field) {
        field.classList.remove('error-field');
    }
}

/**
 * Inicializa los event listeners para los formularios de autenticación
 */
function initAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', validateLoginForm);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', validateRegisterForm);
    }
}

// Inicializa los formularios cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initAuthForms);