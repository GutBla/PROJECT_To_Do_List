/**
 * Validación del Formulario de Login
 * ------------------------------------------------------- 
 */
function validateLoginForm(event) {
    const form = event.target;
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    let isValid = true;

    if (!email) {
        showError('email', 'El email es requerido');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('email', 'Ingrese un email válido');
        isValid = false;
    } else {
        clearError('email');
    }

    if (!password) {
        showError('password', 'La contraseña es requerida');
        isValid = false;
    } else if (password.length < 6) {
        showError('password', 'La contraseña debe tener al menos 6 caracteres');
        isValid = false;
    } else {
        clearError('password');
    }

    if (!isValid) {
        event.preventDefault();
    }
}

/**
 * Validación del Formulario de Registro
 * ------------------------------------------------------- 
 */
function validateRegisterForm(event) {
    const form = event.target;
    const nombre = form.nombre.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    let isValid = true;

    if (!nombre) {
        showError('nombre', 'El nombre es requerido');
        isValid = false;
    } else {
        clearError('nombre');
    }

    if (!email) {
        showError('email', 'El email es requerido');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('email', 'Ingrese un email válido');
        isValid = false;
    } else {
        clearError('email');
    }

    if (!password) {
        showError('password', 'La contraseña es requerida');
        isValid = false;
    } else if (password.length < 6) {
        showError('password', 'La contraseña debe tener al menos 6 caracteres');
        isValid = false;
    } else {
        clearError('password');
    }

    if (!isValid) {
        event.preventDefault();
    }
}

/**
 * Validación de un Email Válido
 * ------------------------------------------------------- 
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Mostrar Mensaje de Error en el Formulario
 * ------------------------------------------------------- 
 */
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`) || createErrorElement(field, fieldId);
    errorElement.textContent = message;
    field.classList.add('error-field');
}

/**
 * Crear Elemento para Mostrar Errores
 * ------------------------------------------------------- 
 */
function createErrorElement(field, fieldId) {
    const errorElement = document.createElement('div');
    errorElement.id = `${fieldId}-error`;
    errorElement.className = 'error-message';
    field.parentNode.insertBefore(errorElement, field.nextSibling);
    return errorElement;
}

/**
 * Limpiar Errores en el Formulario
 * ------------------------------------------------------- 
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
 * Inicializar Formularios de Autenticación
 * ------------------------------------------------------- 
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

/**
 * Alternar Visibilidad de la Contraseña
 * ------------------------------------------------------- 
 */
function togglePassword(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const formGroup = passwordField.closest('.form-group');
    const toggleIcon = formGroup.querySelector('.toggle-password');
    
    if (passwordField.type === "password") {
      passwordField.type = "text";
      passwordField.classList.add('password-visible');
      toggleIcon.textContent = "visibility";
      setTimeout(() => {
        passwordField.type = "password";
        passwordField.classList.remove('password-visible');
        toggleIcon.textContent = "visibility_off";
      }, 3000);
    } else {
      passwordField.type = "password";
      passwordField.classList.remove('password-visible');
      toggleIcon.textContent = "visibility_off";
    }
}

/**
 * Configuración de los Event Listeners en el DOM
 * ------------------------------------------------------- 
 */
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.toggle-password').forEach(icon => {
      icon.addEventListener('click', function() {
        const fieldId = this.closest('.form-group').querySelector('input').id;
        togglePassword(fieldId);
      });
    });
});

document.addEventListener('DOMContentLoaded', initAuthForms);
