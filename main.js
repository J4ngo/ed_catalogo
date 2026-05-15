if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado', reg))
      .catch(err => console.log('Error al registrar SW', err));
  });
}

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
            return {
                id: c[0]?.trim(),
                nombre: c[1]?.trim(),
                precio: c[2]?.trim(),
                categoria: c[3]?.trim(),
                imagen: `img/${c[4]?.trim()}`,
                descripcion: c[5]?.trim()?.replace(/"/g, "") // Limpiamos comillas si las hay
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

    contenedor.innerHTML = `
        <div class="pagina-producto">
            <div class="seccion-foto">
                <img src="${p.imagen}" alt="${p.nombre}">
            </div>
            <div class="seccion-info">
                <span class="numero-pag">${indiceActual + 1} / ${productosActuales.length}</span>
                <h2>${p.nombre}</h2>
                <hr class="divisor-elegante">
                <p class="descripcion">${p.descripcion}</p>
                <p class="precio">${p.precio}€</p>
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
