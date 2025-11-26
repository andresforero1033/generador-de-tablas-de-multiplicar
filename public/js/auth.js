document.addEventListener('DOMContentLoaded', () => {
    // Verificar si ya hay sesión
    if (localStorage.getItem('token')) {
        window.location.href = '/app';
        return; // Detener ejecución si redirigimos
    }

    // Theme Logic
    const themeBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeBtn) themeBtn.textContent = '☀️';
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeBtn.textContent = isDark ? '☀️' : '🌙';
        });
    }

    const authForm = document.getElementById('auth-form');
    const formTitle = document.getElementById('form-title');
    const toggleAuth = document.getElementById('toggle-auth');
    const errorMessage = document.getElementById('error-message');
    const submitBtn = authForm.querySelector('button');

    let isLogin = true;

    toggleAuth.addEventListener('click', () => {
        isLogin = !isLogin;
        if (isLogin) {
            formTitle.textContent = 'Iniciar Sesión';
            submitBtn.textContent = 'Entrar';
            toggleAuth.textContent = '¿No tienes cuenta? Regístrate';
        } else {
            formTitle.textContent = 'Registrarse';
            submitBtn.textContent = 'Crear Cuenta';
            toggleAuth.textContent = '¿Ya tienes cuenta? Inicia Sesión';
        }
        errorMessage.style.display = 'none';
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const endpoint = isLogin ? '/api/login' : '/api/register';
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error en la solicitud');
            }
            
            if (isLogin) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                window.notifications.show('¡Bienvenido!', 'success');
                setTimeout(() => {
                    window.location.href = '/app';
                }, 1000);
            } else {
                window.notifications.show('Registro exitoso. Por favor inicia sesión.', 'success');
                // Cambiar a vista de login
                toggleAuth.click();
            }
            
        } catch (error) {
            window.notifications.show(error.message, 'error');
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
            window.sounds.playError();
        }
    });
});