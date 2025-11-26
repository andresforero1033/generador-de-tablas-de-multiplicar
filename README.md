# 🧮 Generador de Tablas de Multiplicar y Divisiones

Una aplicación web educativa Full Stack diseñada para ayudar a estudiantes a practicar matemáticas de manera interactiva y divertida.

![Estado del Proyecto](https://img.shields.io/badge/Estado-En_Desarrollo-green)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)

## ✨ Características

*   **Tablas de Multiplicar:** Genera tablas del 1 al 10 de cualquier número.
*   **Generador de Ejercicios:**
    *   Multiplicaciones por niveles (1, 2 y 3 cifras).
    *   Divisiones por niveles (1, 2 y 3 cifras).
*   **Visualización de Procesos:** Muestra paso a paso cómo resolver las operaciones (estilo "papel y lápiz").
*   **Calculadora Integrada:** Herramienta básica para verificaciones rápidas.
*   **Material de Aprendizaje:** Explicaciones teóricas sobre métodos de división y multiplicación.
*   **Sistema de Usuarios:** Registro e inicio de sesión seguro para proteger el acceso.
*   **Diseño Responsivo:** Interfaz moderna y amigable que funciona en PC, Tablets y Celulares.

## 🛠️ Tecnologías Utilizadas (MERN Stack)

*   **Frontend:**
    *   HTML5, CSS3 (Diseño Moderno & Responsive).
    *   JavaScript (Vanilla ES6+).
*   **Backend:**
    *   Node.js.
    *   Express.js.
*   **Base de Datos:**
    *   MongoDB Atlas (Nube).
    *   Mongoose (ODM).
*   **Seguridad:**
    *   JWT (JSON Web Tokens) para autenticación.
    *   Bcryptjs para encriptación de contraseñas.
*   **Despliegue:**
    *   Render (Web Service).

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
    Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
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

## 🌐 Despliegue

El proyecto está configurado para desplegarse automáticamente en **Render**.
1.  Conecta tu repositorio de GitHub a Render.
2.  Configura las variables de entorno en el panel de Render (`MONGODB_URI`, `JWT_SECRET`, `PORT`).
3.  El comando de construcción es `npm install` y el de inicio es `node server.js`.

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si tienes ideas para mejorar la aplicación, por favor abre un "Issue" o envía un "Pull Request".

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
