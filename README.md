```markdown
# 🖼️ Cuadro 3D Creator · Studio

> **Aplicación web de alto rendimiento** para el diseño de cuadros personalizados con estética neón 3D. Compone nombres, fotografías, logotipos, frases y códigos de Spotify en un lienzo de alta resolución (1485×1050 px), renderizado en tiempo real mediante Canvas 2D y exportable a formatos profesionales sin dependencias externas.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Canvas API](https://img.shields.io/badge/Canvas_2D-000000?style=for-the-badge&logo=html5&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

---

## ✨ Características Principales

- 🎨 **Composición Avanzada:** Sistema de 7 slots para fotografías + 1 slot principal de nombre con enmascaramiento de imagen (texto relleno de foto).
- 🔤 **Motor Tipográfico Flexible:** Soporte para 6 familias de Google Fonts integradas y carga de tipografías personalizadas (`.ttf`, `.otf`, `.woff`) con persistencia local mediante IndexedDB.
- 🌈 **Estética Neón Dinámica:** Paleta de colores con efecto *glow* (resplandor) y sombras 3D calculadas en tiempo real.
- 🖱️ **Interacción Unificada:** Edición fluida de cada elemento mediante *Pointer Events* (compatible con ratón, táctil y lápiz) y zoom con rueda del ratón o gestos.
- 📤 **Exportación Profesional:** Generación de archivos PNG (alta resolución) y PDF A4 horizontal (construcción binaria nativa, **cero librerías de terceros**).
- 📱 **Diseño Responsive:** Interfaz adaptativa (móvil, tablet, escritorio) con targets táctiles de 44px y tipografía fluida mediante `clamp()`.
- ⚡ **Arquitectura Zero-Dependency:** 100% Vanilla HTML, CSS y JavaScript moderno (ES2022), garantizando máxima velocidad, control y un bundle size mínimo.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Detalles de Implementación |
| :--- | :--- | :--- |
| **Estructura** | HTML5 Semántico | Accesibilidad (ARIA), `<dialog>` nativo, SEO optimizado con JSON-LD. |
| **Estilos** | CSS3 Moderno | Custom Properties, CSS Grid, Flexbox, `backdrop-filter` y efectos de profundidad 3D. |
| **Lógica** | JavaScript ES2022 | Módulos nativos, `async/await`, `FontFace API`, gestión de estado e historial (Undo/Redo). |
| **Renderizado** | Canvas 2D API | `roundRect`, `globalCompositeOperation`, offscreen canvas para enmascaramiento complejo. |
| **Exportación** | Blob API + Binary | Construcción manual de la especificación PDF 1.4 byte a byte. |

---

## 📂 Arquitectura del Proyecto

El proyecto sigue una estructura lógica y desacoplada para facilitar el mantenimiento, la escalabilidad y la lectura del código:

```text
/
├── index.html              # Estructura semántica, metadatos SEO y punto de entrada
├── css/
│   ├── base.css            # Reset, variables de diseño (design tokens) y topbar
│   ├── editor.css          # Layout principal (Grid), stage y panel lateral
│   ├── components.css      # UI Kit: Botones, chips, modales, toasts y formularios
│   └── style.css           # Efectos 3D, profundidad, iluminación y tipografías
└── js/
    └── app.js              # Núcleo unificado: Estado, renderizado, UI, historial y exportación
```

---

## 🚀 Inicio Rápido

Debido al uso de módulos ES6 nativos y APIs de seguridad del navegador (como `FileReader`), el proyecto **requiere un servidor HTTP local**. No funcionará abriendo el archivo directamente con el protocolo `file://`.

Desde la raíz del proyecto, ejecuta uno de los siguientes comandos:

```bash
# Con Python (Recomendado)
python -m http.server 8000

# Con Node.js (vía npx)
npx serve .

# Con PHP
php -S localhost:8000
```

Luego, abre tu navegador en: **`http://localhost:8000`**

---

## 🎯 Guía de Uso

1. **Textos:** Completa los campos *Nombre principal*, *Texto superior* y *Frase* en el panel lateral.
2. **Tipografía:** Selecciona una de las fuentes premium o **sube tu propia fuente** (.ttf/.otf). Ajusta el tamaño con el slider.
3. **Personalización:** Elige un color de la paleta neón para los bordes, brillos y textos.
4. **Fotografías:** Arrastra y suelta hasta 7 imágenes en la *Drop Zone* o usa el selector de archivos.
5. **Ajustes Finos:** 
   - Haz clic en una foto para seleccionarla.
   - **Arrastra** para reposicionarla dentro de su slot.
   - Usa la **rueda del ratón** o los atajos de teclado (`+` / `-`) para ajustar el zoom.
6. **Extras:** Opcionalmente, sube una imagen para rellenar las letras del nombre o un código de Spotify (puedes alternar su visibilidad con el interruptor dedicado).
7. **Exportación:** Descarga tu diseño final como **PNG** (para redes/imprenta digital) o **PDF** (formato A4 listo para imprenta profesional).

---

## 🧠 Decisiones Técnicas Avanzadas

- **Gestión Estricta de Memoria:** Cada imagen cargada se almacena junto con su `Object URL`. Al reemplazar o eliminar una imagen, se ejecuta `URL.revokeObjectURL()` de forma explícita, previniendo fugas de RAM en sesiones de edición prolongadas.
- **Enmascaramiento de Texto (Text Masking):** El nombre principal se recorta con la forma tipográfica utilizando `globalCompositeOperation = 'destination-in'` sobre un *offscreen canvas*, permitiendo que una fotografía se visualice perfectamente dentro de las letras sin perder resolución.
- **Generación de PDF Nativa:** El archivo PDF se genera construyendo la especificación PDF 1.4 byte a byte (objetos, xref, trailer) e incrustando directamente el buffer JPEG del canvas. Esto elimina la necesidad de librerías pesadas como `jsPDF` o `pdfmake`, reduciendo el bundle size a cero y mejorando el rendimiento.
- **Pointer Events Unificados:** Un único manejador de eventos soporta ratón, pantallas táctiles y lápices ópticos, utilizando `setPointerCapture` para garantizar robustez en los arrastres, incluso si el cursor sale del área del canvas.
- **Renderizado por Capas Optimizado:** Cada elemento visual (slots, logo, nombre, píldora, Spotify, selección) se dibuja en una función independiente. Esto, combinado con `requestAnimationFrame`, asegura un renderizado a 60 FPS sin redibujos innecesarios.

---

## 📜 Licencia

Este proyecto está protegido bajo la Licencia **MIT**. Siéntete libre de usarlo, modificarlo y distribuirlo, tanto para fines personales como comerciales.

> Desarrollado con precisión, rendimiento y pasión. ☕🚀