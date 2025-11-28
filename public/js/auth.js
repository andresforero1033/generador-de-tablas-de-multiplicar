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

    // 3D Flip Logic
    const authCard = document.getElementById('auth-card');
    const toRegisterBtn = document.getElementById('to-register');
    const toLoginBtn = document.getElementById('to-login');
    
    // Forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Error Messages
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    // Toggle Flip
    if (toRegisterBtn && authCard) {
        toRegisterBtn.addEventListener('click', () => {
            authCard.classList.add('flipped');
            if (window.sounds) window.sounds.playWhoosh();
            // Limpiar errores al cambiar
            if (loginError) loginError.style.display = 'none';
            if (registerError) registerError.style.display = 'none';
        });
    }

    if (toLoginBtn && authCard) {
        toLoginBtn.addEventListener('click', () => {
            authCard.classList.remove('flipped');
            if (window.sounds) window.sounds.playWhoosh();
            // Limpiar errores al cambiar
            if (loginError) loginError.style.display = 'none';
            if (registerError) registerError.style.display = 'none';
        });
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Error en el inicio de sesión');
                }
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                
                if (window.notifications) window.notifications.show('¡Bienvenido!', 'success');
                
                setTimeout(() => {
                    window.location.href = '/app';
                }, 1000);
                
            } catch (error) {
                if (window.notifications) window.notifications.show(error.message, 'error');
                if (loginError) {
                    loginError.textContent = error.message;
                    loginError.style.display = 'block';
                }
                if (window.sounds) window.sounds.playError();
            }
        });
    }

    // Handle Register
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;
            
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Error en el registro');
                }
                
                if (window.notifications) window.notifications.show('Registro exitoso. Por favor inicia sesión.', 'success');
                
                // Volver a la cara frontal (Login)
                if (authCard) authCard.classList.remove('flipped');
                
                // Pre-llenar el usuario en login para conveniencia
                const loginUser = document.getElementById('login-username');
                const loginPass = document.getElementById('login-password');
                if (loginUser) loginUser.value = username;
                if (loginPass) loginPass.focus();
                
            } catch (error) {
                if (window.notifications) window.notifications.show(error.message, 'error');
                if (registerError) {
                    registerError.textContent = error.message;
                    registerError.style.display = 'block';
                }
                if (window.sounds) window.sounds.playError();
            }
        });
    }

    // Swipe Gesture Logic for Mobile
    if (authCard) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        authCard.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        authCard.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        const handleSwipe = () => {
            const swipeThreshold = 50; // Minimum distance for swipe
            const diff = touchEndX - touchStartX;

            // Swipe Left (Login -> Register)
            if (diff < -swipeThreshold && !authCard.classList.contains('flipped')) {
                authCard.classList.add('flipped');
                if (window.sounds) window.sounds.playWhoosh();
                if (loginError) loginError.style.display = 'none';
                if (registerError) registerError.style.display = 'none';
            }
            
            // Swipe Right (Register -> Login)
            if (diff > swipeThreshold && authCard.classList.contains('flipped')) {
                authCard.classList.remove('flipped');
                if (window.sounds) window.sounds.playWhoosh();
                if (loginError) loginError.style.display = 'none';
                if (registerError) registerError.style.display = 'none';
            }
        };
    }
});