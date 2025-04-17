function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    notification.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
}

function apiFetch(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'include'
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };
    
    if (mergedOptions.body && typeof mergedOptions.body === 'object') {
        mergedOptions.body = JSON.stringify(mergedOptions.body);
    }
    
    return fetch(url, mergedOptions)
        .then(async response => {
            if (!response.ok) {
                const error = new Error(response.statusText);
                error.response = response;
                try {
                    error.details = await response.json();
                } catch (e) {}
                throw error;
            }
            
            if (response.status === 204) return null;
            return response.json();
        })
        .catch(error => {
            handleFetchError(error, `Error en petición a ${url}`);
            throw error;
        });
}

function handleFetchError(error, context = '') {
    console.error(`${context ? context + ': ' : ''}`, error);
    
    let message = 'Ocurrió un error. Por favor intente nuevamente.';
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        message = 'Error de conexión. Verifique su conexión a internet.';
    } else if (error.response && error.response.status === 401) {
        message = 'Sesión expirada. Por favor inicie sesión nuevamente.';
        setTimeout(() => window.location.href = '/login', 2000);
    } else if (error.details && error.details.error) {
        message = error.details.error;
    }
    
    showNotification(message, 'error');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}