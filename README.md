# ✨ Creative - Plataforma Educativa de Matemáticas

**Creative** es una aplicación web educativa Full Stack diseñada para transformar el aprendizaje de las matemáticas en una experiencia interactiva, moderna y divertida. Enfocada en estudiantes de primaria y secundaria, ofrece herramientas para dominar la multiplicación y la división.

![Estado del Proyecto](https://img.shields.io/badge/Estado-En_Desarrollo-green)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)

## ✨ Características Principales

### 🎨 Experiencia de Usuario (UI/UX)
*   **Diseño 'Modern Playful':** Interfaz limpia con Glassmorphism, animaciones suaves y una paleta de colores vibrante.
*   **Navegación Flexible:** Menú lateral inteligente que permite tres estados: expandido, colapsado (solo iconos) y totalmente oculto para maximizar el área de trabajo.
*   **🌙 Modo Oscuro:** Soporte nativo para tema oscuro, ideal para reducir la fatiga visual.
*   **Diseño Responsivo:** Adaptable a cualquier dispositivo (Móvil, Tablet, Escritorio).
*   **Footer Dinámico:** Información de contacto, servicios y legal accesible al final del contenido.

### 🧮 Herramientas Educativas
*   **Tablas de Multiplicar:** Generador instantáneo de tablas del 1 al 10.
*   **Generador de Ejercicios:**
    *   **Multiplicación:** Niveles progresivos (1, 2, 3 cifras).
    *   **División:** Niveles progresivos (1, 2, 3 cifras).
*   **Visualización de Procesos:** Muestra el paso a paso de las operaciones ("Show your work"), simulando el proceso en papel.
*   **Calculadora Integrada:** Para verificaciones rápidas sin salir de la app.

### 📚 Material de Aprendizaje
*   **Multiplicación:** Guías interactivas desde conceptos básicos hasta multiplicación con decimales (Nivel 4).
*   **División:** Explicaciones detalladas desde repartos simples hasta división larga y con resto (Nivel 4).

### 🔐 Seguridad y Gestión
*   **Autenticación Segura:** Sistema de Registro y Login protegido con JWT.
*   **Protección de Rutas:** Acceso restringido a las herramientas educativas solo para usuarios autenticados.

## 🛠️ Tecnologías Utilizadas (MERN Stack)

*   **Frontend:**
    *   HTML5 Semántico.
    *   CSS3 (Variables, Flexbox, Grid, Animaciones).
    *   JavaScript (Vanilla ES6+).
*   **Backend:**
    *   Node.js.
    *   Express.js.
*   **Base de Datos:**
    *   MongoDB Atlas (Cloud).
    *   Mongoose (ODM).
*   **Seguridad:**
    *   JWT (JSON Web Tokens).
    *   Bcryptjs (Hashing de contraseñas).

## 🚀 Instalación y Ejecución Local

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/andresforero1033/generador-de-tablas-de-multiplicar.git
    cd generador-de-tablas-de-multiplicar
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto:
    ```env
    PORT=3000
    MONGODB_URI=tu_cadena_de_conexion_mongodb
    JWT_SECRET=tu_secreto_super_seguro
    ```

4.  **Iniciar el servidor:**
    ```bash
    npm start
    ```

5.  **Acceder a la aplicación:**
    Abre tu navegador en `http://localhost:3000`.

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si tienes ideas para mejorar la aplicación, por favor abre un "Issue" o envía un "Pull Request".

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
