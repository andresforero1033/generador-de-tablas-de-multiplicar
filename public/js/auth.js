document.addEventListener('DOMContentLoaded', () => {
    // Verificar si ya hay sesión
    if (localStorage.getItem('token')) {
        window.location.href = '/app';
        return; // Detener ejecución si redirigimos
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
                window.location.href = '/app';
            } else {
                alert('Registro exitoso. Por favor inicia sesión.');
                // Cambiar a vista de login
                toggleAuth.click();
            }
            
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
    });
});