# Reglas y Contexto del Proyecto: App de Sorteos (app-sorteos)

Este archivo (`AGENTS.md`) define el comportamiento, reglas y el contexto técnico esperado por los agentes de IA (como Antigravity) cuando trabajan en este repositorio.

## 1. Contexto del Proyecto
Es una aplicación web para realizar sorteos interactivos en vivo, integrada con chats (como YouTube) a través de un backend con WebSockets.

**Stack Tecnológico:**
- **Frontend**: React + Vite (Vanilla CSS, lucide-react para iconos). Archivo principal: `client/src/App.jsx`.
- **Backend**: Node.js + Express + Socket.io (ubicado en la carpeta `server/`).

## 2. Perfiles y Temáticas (Themes)
El sistema soporta distintos perfiles o "modos", cada uno con su estilo y diseño particular. Todos se controlan desde `client/src/App.jsx` cambiando la clase principal en el `html`.

- **Joquer**: Diseño oscuro, textura de madera (`wood_texture.jpg`), panel totalmente opaco (`#111111`), partículas interactivas (`tsparticles`). Canal hardcodeado: `25583107`.
- **Fox ("EL DEL FOX")**: Diseño inspirado en VW Fox, colores neón, luces de auto de fondo. Requiere contraseña de acceso: `eldelfox1122`. Canal hardcodeado: `17912002`.
- **Chona**: Temática del Club Atlético Boca Juniors. Requiere contraseña de acceso: `chona1122`.
- **Pato**: Diseño vibrante con colores neón amarillo/naranja.
- **Jack**: Diseño estilo gaming con tonos cyan neón, fondo del espacio.

## 3. UI/UX y Panel de Validación
- **Estética**: Se prioriza un diseño "premium", usando *glassmorphism* (paneles con `backdrop-filter: blur()`), sombras de neón, animaciones suaves y cursores personalizados.
- **Panel Emergente (Verification Panel)**: 
  - Al salir un ganador (en ciertos perfiles), se abre un panel flotante que contiene el chat en vivo y un cronómetro de validación (tiempo en el cual el ganador debe reclamar su premio).
  - El panel es arrastrable (`draggable`) pero cuenta con un botón para cerrarse (`X`).
  - El texto dentro del panel emergente siempre debe ser seleccionable (la propiedad `userSelect: 'none'` solo debe aplicar mientras se lo arrastra).
  - En perfiles como Joquer, cuando se abre el panel de validación, el botón de "Sortear Ganador" pasa a estar adentro del panel.

## 4. Estándares de Código
- **Evitar librerías externas pesadas** siempre que sea posible. Se utiliza CSS nativo puro (`index.css`) en lugar de Tailwind u otros frameworks.
- **Evitar reescribir funciones troncales**: El manejo de estados con `useState` y referencias de temporizadores (`useRef`) en `App.jsx` es bastante delicado por las animaciones en tiempo real. Cualquier cambio debe considerar el ciclo de vida del componente para no resetear temporizadores en curso.

## 5. Comandos de Utilidad
- Iniciar frontend: `cd client && npm run dev`
- Iniciar backend: `cd server && npm start`
- Compilar frontend a producción: `cd client && npm run build`
