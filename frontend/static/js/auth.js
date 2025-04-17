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

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`) || createErrorElement(field, fieldId);
    errorElement.textContent = message;
    field.classList.add('error-field');
}

function createErrorElement(field, fieldId) {
    const errorElement = document.createElement('div');
    errorElement.id = `${fieldId}-error`;
    errorElement.className = 'error-message';
    field.parentNode.insertBefore(errorElement, field.nextSibling);
    return errorElement;
}

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

document.addEventListener('DOMContentLoaded', initAuthForms);