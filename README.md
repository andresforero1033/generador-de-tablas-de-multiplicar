# ✨ Creative - Plataforma Educativa de Matemáticas

**Creative** es una aplicación web educativa Full Stack diseñada para transformar el aprendizaje de las matemáticas en una experiencia interactiva, moderna y divertida. Enfocada en estudiantes de primaria y secundaria, ofrece herramientas para dominar la multiplicación y la división.

![Estado del Proyecto](https://img.shields.io/badge/Estado-En_Desarrollo-green)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)

## 📚 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#️-tecnologías-utilizadas-mern-stack)
- [Arquitectura General](#-arquitectura-general)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Flujo de Usuario y Autenticación](#-flujo-de-usuario-y-autenticación)
- [API REST](#-api-rest)
- [Variables de Entorno](#-variables-de-entorno)
- [Instalación y Ejecución Local](#-instalación-y-ejecución-local)
- [Scripts Disponibles](#-scripts-disponibles)
- [Pruebas Automatizadas](#-pruebas-automatizadas)
- [Roadmap](#-roadmap)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

## ✨ Características Principales

### 🎨 Experiencia de Usuario (UI/UX)
*   **Diseño 'Modern Playful':** Interfaz limpia con Glassmorphism, animaciones suaves y una paleta de colores vibrante.
*   **Navegación Flexible:** Menú lateral inteligente que permite tres estados: expandido, colapsado (solo iconos) y totalmente oculto para maximizar el área de trabajo.
*   **🌙 Modo Oscuro:** Soporte nativo para tema oscuro, ideal para reducir la fatiga visual.
*   **⚡ Tema Aurora Neon:** Tercer modo cromático con glassmorphism translúcido, gradientes energéticos y microinteracciones que aportan dinamismo sin perder accesibilidad.
*   **Diseño Responsivo:** Adaptable a cualquier dispositivo (Móvil, Tablet, Escritorio).
*   **Footer Dinámico:** Información de contacto, servicios y legal accesible al final del contenido.

### 🧮 Herramientas Educativas
*   **Tablas de Multiplicar:** Generador instantáneo de tablas del 1 al 10.
*   **Generador de Ejercicios:**
    *   **Multiplicación:** Niveles progresivos (1, 2, 3 cifras).
    *   **División:** Niveles progresivos (1, 2, 3 cifras).
*   **Visualización de Procesos:** Muestra el paso a paso de las operaciones ("Show your work"), simulando el proceso en papel.
*   **Calculadora Integrada:** Para verificaciones rápidas sin salir de la app.
*   **Modulo de Juegos:** Reto contrarreloj de 60 segundos que genera multiplicaciones aleatorias, suma puntos por respuestas correctas y entrega bonos de estrellas por racha.

### 🎮 Gamificación y Progreso
*   **Modo Juegos dedicado:** Sólo visible dentro del módulo “Juegos”, con tablero, historial y controles accesibles desde cualquier dispositivo.
*   **Historial de Partidas:** Registra tus últimos intentos e identifica mejoras en tu velocidad mental.
*   **Récords Globales del Perfil:** Cada puntaje máximo se sincroniza con la sección “Records de los juegos” en el perfil del usuario.
*   **Bonos de Estrellas y Trofeos:** Cada 10 aciertos consecutivos se otorgan recompensas adicionales que alimentan el progreso general.

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

## 🧱 Arquitectura General

- **Cliente SPA (`public/`)**: HTML/CSS/JS con módulos especializados (`math_core.js`, `module_manager.js`, `ui.js`) que renderizan la interfaz, generan ejercicios y gestionan la experiencia gamificada sin frameworks adicionales.
- **Servidor Express (`server.js`)**: Exposición de rutas públicas (`/`, `/app`) y endpoints `/api/register` y `/api/login`, además de servir los activos estáticos.
- **Persistencia (`models/User.js`)**: Usuarios almacenados en MongoDB Atlas con `Mongoose`, incluyendo hooks `pre-save` para hashing y métodos personalizados para validar contraseñas.
- **Autenticación**: JWT firmados con `JWT_SECRET`, enviados al frontend para proteger las secciones privadas mediante almacenamiento local.
- **Testing**: Suite con `Jest` + `Supertest` que valida tanto la lógica matemática como las rutas del servidor para prevenir regresiones.

## 🗂️ Estructura del Proyecto

```text
.
├── public/
│   ├── index.html           # Aplicación principal (SPA)
│   ├── login.html           # Vista de autenticación con animaciones 3D
│   ├── css/styles.css       # Diseño modern playful + dark mode
│   └── js/
│       ├── auth.js          # Flujos de login/registro y manejo de tokens
│       ├── math_core.js     # Motor matemático (N, Z, Q, conjuntos)
│       ├── module_manager.js# UI/estado de módulos y progreso
│       ├── script.js        # Inicialización general y navegación
│       └── ui.js            # Sonidos, notificaciones, modales y tour
├── models/User.js           # Esquema y lógica de usuarios
├── server.js                # Servidor Express + endpoints REST
├── tests/
│   ├── math_core.test.js    # Cobertura de utilidades y operaciones
│   └── server.test.js       # Smoke tests de rutas principales
├── package.json             # Dependencias y scripts npm
└── README.md                # Documentación del proyecto
```

## 🔁 Flujo de Usuario y Autenticación

1. **Ingreso**: Los usuarios acceden a `/` y, si no tienen token, ven `login.html` con modo oscuro, animaciones y formularios.
2. **Registro/Login**: `auth.js` consume `/api/register` o `/api/login`, valida respuestas y almacena `token` + `username` en `localStorage`.
3. **Protección de rutas**: Al detectar un token válido, se redirige automáticamente a `/app`, donde la SPA carga módulos educativos, perfil y juegos.
4. **Persistencia local**: Progreso, récords y configuraciones (tema, audio, tour guiado) se guardan en `localStorage` para mantener la experiencia personalizada incluso offline.

## 🔌 API REST

| Método | Ruta           | Descripción                               | Cuerpo esperado                   | Respuesta exitosa |
|--------|----------------|-------------------------------------------|-----------------------------------|-------------------|
| POST   | `/api/register`| Crea un usuario nuevo en MongoDB          | `{ "username", "password" }`      | `201 + mensaje`   |
| POST   | `/api/login`   | Autentica y entrega un JWT válido por 1h  | `{ "username", "password" }`      | `200 + token + username` |

- **Errores controlados**: Respuestas `400` para duplicados, `401` para credenciales inválidas y `500` para fallos internos.
- **Protección adicional**: Contraseñas hasheadas con `bcryptjs` y tokens firmados con expiración para reducir riesgos.

## ⚙️ Variables de Entorno

Define un archivo `.env` en la raíz con las siguientes claves:

| Variable      | Uso                                                          |
|---------------|---------------------------------------------------------------|
| `PORT`        | Puerto HTTP para Express. Valor por defecto: `3000`.          |
| `MONGODB_URI` | Cadena de conexión a MongoDB Atlas o instancia local.         |
| `JWT_SECRET`  | Frase segura utilizada para firmar y validar los tokens JWT.  |

> Mantén este archivo fuera del control de versiones para proteger credenciales.

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
    > Durante el desarrollo puedes usar `npm run dev` para recarga automática mediante `nodemon`.

5.  **Acceder a la aplicación:**
    Abre tu navegador en `http://localhost:3000`.

6. **Ejecutar pruebas automatizadas:**
    ```bash
    npm test
    ```

## 📦 Scripts Disponibles

- `npm start`: Lanza el servidor Express en modo producción simple.
- `npm run dev`: Ejecuta el servidor con `nodemon` para reinicios en caliente durante el desarrollo.
- `npm test`: Corre la suite de pruebas con `Jest` y `Supertest`.

## 🧪 Pruebas Automatizadas

- **`tests/math_core.test.js`** valida el corazón matemático: utilidades (`gcd`, simplificación de fracciones), generadores y resolución de operaciones para conjuntos `N`, `Z` y `Q`.
- **`tests/server.test.js`** verifica que las rutas principales respondan correctamente, incluyendo redirecciones y el fallback hacia `/`.
- Ejecuta `npm test` antes de publicar cambios para asegurar que no existan regresiones en la lógica crítica.

## 🛣️ Roadmap

- Integrar almacenamiento de progreso y récords en base de datos para sincronizar múltiples dispositivos.
- Agregar endpoints autenticados para ejercicios personalizados y analíticas de desempeño.
- Internacionalizar la interfaz para soportar inglés y portugués.
- Añadir más módulos teóricos (fracciones avanzadas, álgebra básica) con sus respectivos juegos.

## 🔍 Estrategia SEO y Contenido

### Metadatos y estructura técnica
- La SPA (`public/index.html`) y la vista pública (`public/login.html`) ahora incluyen títulos, descripciones largas, keywords y etiquetas sociales orientadas a la palabra clave **“Creative”**, además de etiquetas `canonical`, `alternate` y `robots` para guiar a los motores de búsqueda.
- Se añadieron tarjetas Open Graph + Twitter Card, lo que mejora los _snippets_ cuando se comparte Creative en redes.
- Se incorporó _structured data_ JSON-LD (`EducationalOrganization` y `WebSite`) con relación explícita a **Devora Software Inc.**, ayudando a Google a comprender la marca.
- Mantén el dominio público sirviendo siempre vía HTTPS (`https://creativebymariana.com`) para que las señales de canonicalidad y la indexación sean consistentes.

### Recomendaciones on-page
- **Estructura de URLs:** idealmente expón rutas semánticas (`/app/multiplicacion`, `/app/juegos`, `/app/aprendizaje/guia-tablas`) en lugar de solo `#` o controladores JS. Puedes hacer `app/:section` en Express y mapearlo a la misma SPA para que los buscadores rastreen cada módulo.
- **Encabezados:** garantiza que exista un único `h1` (“Creative | Plataforma Educativa de Matemáticas”) en cada vista y usa `h2/h3` para módulos (Perfil, Juegos, Herramientas) para reforzar las palabras clave.
- **Contenido descriptivo:** agrega copys introductorios en cada sección explicando el beneficio (“Creative Multiplicación: práctica guiada con pasos”). Esto genera densidad semántica natural sin _keyword stuffing_.
- **Enlaces internos:** enlaza desde tarjetas y botones del dashboard hacia las rutas descritas arriba (por ejemplo, `<a href="/app/juegos">Ir a Juegos Creative</a>`). Esto reparte autoridad entre secciones clave.
- **Activos multimedia:** sirve un `og:image` real (1200×630) optimizado y nómbralo con la keyword (`creative-platform-cover.png`). Compleméntalo con texto alternativo descriptivo.
- **Rendimiento e indexabilidad:** genera un `sitemap.xml` y un `robots.txt` sencillo (`User-agent: * / Allow: /`) desde Express para agilizar el descubrimiento. Mantén pesos de CSS/JS minificados para mejorar Core Web Vitals.

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si tienes ideas para mejorar la aplicación, por favor abre un "Issue" o envía un "Pull Request".

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
