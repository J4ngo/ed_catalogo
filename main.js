if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado', reg))
      .catch(err => console.log('Error al registrar SW', err));
  });
}

let indiceFotoInterna = 0; // Controla qué foto del carrusel se está mostrando
const appContainer = document.getElementById('app-container');
let productosActuales = [];
let indiceActual = 0;

// --- NUEVO: Variable global para guardar TODO lo que venga del Excel ---
let TODOS_LOS_PRODUCTOS = [];
const URL_EXCEL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRV8YzgaJZ4fdbRhiJckJIg6DZR_gX3LvJ_HlnB6T_l53QgGJiX7egMUaZ5zCDXr-PEuwUVnLvtV1bW/pub?output=csv";

// --- NUEVO: Función para cargar los datos al abrir la web ---
async function cargarDatosExcel() {
    try {
        const respuesta = await fetch(`${URL_EXCEL}&cacheBuster=${new Date().getTime()}`);
        const data = await respuesta.text();
        
        // Convertimos el CSV a objetos
        const filas = data.split('\n').slice(1);
        TODOS_LOS_PRODUCTOS = filas.map(fila => {
            // Usamos una expresión regular para separar por comas (por si hay comas dentro de descripciones)
            const c = fila.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
            
            // --- FILTRO INTELIGENTE PARA LA IMAGEN ---
            // 1. Limpiamos posibles comillas y espacios en blanco del enlace/archivo
            let rutaImagen = c[4]?.trim()?.replace(/"/g, "") || "";
            let imagenFinal = "";

            // 2. Si empieza por http o https, es un enlace directo de ImgBB
            if (rutaImagen.startsWith("http://") || rutaImagen.startsWith("https://")) {
                imagenFinal = rutaImagen;
            } else {
                // Si no, es una foto de tu repositorio local
                imagenFinal = `img/${rutaImagen}`;
            }
            // -----------------------------------------

            return {
                id: c[0]?.trim(),
                nombre: c[1]?.trim(),
                precio: c[2]?.trim(),
                categoria: c[3]?.trim(),
                imagen: imagenFinal, // Usamos el resultado del filtro inteligente
                descripcion: c[5]?.trim()?.replace(/"/g, "") // Limpiamos comillas si las hay
                tamanos: c[6]?.trim() || ""
            };
        });
        console.log("Catálogo actualizado desde Excel");
    } catch (error) {
        console.error("Error cargando Excel, usando datos locales si existen", error);
    }
}

// Llamamos a la carga nada más empezar
cargarDatosExcel();

function navegar(categoria, botonPulsado) {
    appContainer.classList.add('modo-galeria');
    const logoV = document.querySelector('.logo-v');
    const logoH = document.querySelector('.logo-h');
    logoV.classList.remove('active');
    logoH.classList.add('active');

    const botones = document.querySelectorAll('.menu-categorias button');
    botones.forEach(btn => btn.classList.remove('active-cat'));
    botonPulsado.classList.add('active-cat');
    document.getElementById('boton-home').classList.remove('oculto');

    const vistaGaleria = document.getElementById('vista-galeria');
    vistaGaleria.classList.remove('oculto');
    vistaGaleria.classList.add('active');

    mostrarProductos(categoria);
}

function volverAlInicio() {
    appContainer.classList.remove('modo-galeria');
    document.querySelector('.logo-v').classList.add('active');
    document.querySelector('.logo-h').classList.remove('active');
    document.getElementById('vista-galeria').classList.add('oculto');
    document.getElementById('vista-galeria').classList.remove('active');
    document.getElementById('boton-home').classList.add('oculto');
    const botones = document.querySelectorAll('.menu-categorias button');
    botones.forEach(btn => btn.classList.remove('active-cat'));
}

function mostrarProductos(categoria) {
    // --- CAMBIO: Ahora filtramos sobre TODOS_LOS_PRODUCTOS (lo que vino del Excel) ---
    productosActuales = TODOS_LOS_PRODUCTOS.filter(p => 
        p.categoria && p.categoria.toLowerCase() === categoria.toLowerCase()
    );
    indiceActual = 0;
    renderizarProducto();
}

function renderizarProducto() {
    const contenedor = document.getElementById('visor-producto');
    const p = productosActuales[indiceActual];

    if (!p) {
        contenedor.innerHTML = "<p>Cargando productos...</p>";
        return;
    }

    // [Control de la Parte 1] Reseteo de fotos
    if (!window.cambiandoFotoInterna) { indiceFotoInterna = 0; }
    window.cambiandoFotoInterna = false;

    // [Control de la Parte 2] Reseteo de tamaños
    // Si el usuario cambia de producto entero, volvemos a seleccionar el primer tamaño (índice 0)
    if (!window.cambiandoTamanoInterno) {
        indiceTamanoSeleccionado = 0;
    }
    window.cambiandoTamanoInterno = false; // Reseteamos el chivato

    // Procesamos las imágenes (Parte 1)
    const imagenes = p.imagen.split('|').map(img => img.trim());
    const fotoActual = imagenes[indiceFotoInterna];

    let flechasHTML = '';
    if (imagenes.length > 1) {
        flechasHTML = `
            <button class="flecha-interna prev" onclick="pasarFotoInterna(-1, ${imagenes.length})">&#10094;</button>
            <button class="flecha-interna next" onclick="pasarFotoInterna(1, ${imagenes.length})">&#10095;</button>
        `;
    }

    // --- NUEVA LÓGICA: PROCESAR TAMAÑOS Y PRECIOS ---
    // 1. Convertimos los precios y tamaños del Excel en Arrays
    const listaPrecios = p.precio.split('|').map(pr => pr.trim());
    // Suponiendo que los tamaños vienen en la columna 7 (c[7]). Asegúrate de mapearla en tu cargarDatosExcel
    const listaTamanos = p.tamanos ? p.tamanos.split('|').map(t => t.trim()) : [];

    // 2. Elegimos qué precio mostrar en base al botón que esté pulsado
    const precioActual = listaPrecios[indiceTamanoSeleccionado] || listaPrecios[0];

    // 3. Si el producto TIENE tamaños en el Excel, fabricamos los botones
    let botonesTamanosHTML = '';
    if (listaTamanos.length > 0 && listaTamanos[0] !== "") {
        botonesTamanosHTML = `<div class="contenedor-tamanos">`;
        listaTamanos.forEach((tamano, index) => {
            // Si es el tamaño seleccionado, le añadimos la clase 'activo' para que resalte
            const claseActivo = index === indiceTamanoSeleccionado ? 'activo' : '';
            botonesTamanosHTML += `
                <button class="btn-tamano ${claseActivo}" onclick="cambiarTamano(${index})">
                    ${tamano}
                </button>
            `;
        });
        botonesTamanosHTML += `</div>`;
    }

    // 4. Inyectamos el HTML final en tu estructura elegante
    contenedor.innerHTML = `
        <div class="pagina-producto">
            <div class="seccion-foto" style="position: relative; display: inline-block;">
                ${flechasHTML}
                <img src="${fotoActual}" alt="${p.nombre}">
            </div>
            
            <div class="seccion-info">
                <span class="numero-pag">${indiceActual + 1} / ${productosActuales.length}</span>
                <h2>${p.nombre}</h2>
                <hr class="divisor-elegante">
                <p class="descripcion">${p.descripcion}</p>
                
                ${botonesTamanosHTML}
                
                <p class="precio">${precioActual}€</p>
            </div>
        </div>
    `;
}

function siguienteProducto() {
    if (productosActuales.length === 0) return;
    indiceActual = (indiceActual + 1) % productosActuales.length;
    
    const visor = document.getElementById('visor-producto');
    visor.style.opacity = 0;
    
    setTimeout(() => {
        renderizarProducto();
        visor.style.opacity = 1;
    }, 300);
}

function retrocederProducto() {
    // 1. Restamos uno al índice para ir al producto anterior
    indiceActual--;

    // 2. Control de seguridad: si bajamos de 0, saltamos al final del catálogo
    if (indiceActual < 0) {
        indiceActual = productosActuales.length - 1;
    }

    // 3. Volvemos a pintar el producto que corresponde en el visor
    renderizarProducto();
}

function pasarFotoInterna(direccion, totalFotos) {
    window.cambiandoFotoInterna = true; // Avisamos que no queremos resetear la foto al renderizar
    indiceFotoInterna += direccion;

    // Bucle continuo para las fotos
    if (indiceFotoInterna < 0) {
        indiceFotoInterna = totalFotos - 1;
    } else if (indiceFotoInterna >= totalFotos) {
        indiceFotoInterna = 0;
    }

    renderizarProducto(); // Volvemos a pintar
}

function cambiarTamano(nuevoIndice) {
    window.cambiandoTamanoInterno = true; // Chivato para que no se resetee el tamaño al repintar
    indiceTamanoSeleccionado = nuevoIndice; // Guardamos la posición (0, 1, 2...)
    
    renderizarProducto(); // Volvemos a pintar el visor con el nuevo precio
}
