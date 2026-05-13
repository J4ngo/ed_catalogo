const appContainer = document.getElementById('app-container');
let productosActuales = [];
let indiceActual = 0;

function navegar(categoria, botonPulsado) {
    // 1. Diseño de cabecera
    appContainer.classList.add('modo-galeria');

    const logoV = document.querySelector('.logo-v');
    const logoH = document.querySelector('.logo-h');
    logoV.classList.remove('active');
    logoH.classList.add('active');

    // 2. Botón activo y Home
    const botones = document.querySelectorAll('.menu-categorias button');
    botones.forEach(btn => btn.classList.remove('active-cat'));
    botonPulsado.classList.add('active-cat');
    document.getElementById('boton-home').classList.remove('oculto');

    // 3. Mostrar Vista Galería
    const vistaGaleria = document.getElementById('vista-galeria');
    vistaGaleria.classList.remove('oculto');
    vistaGaleria.classList.add('active');

    // 4. Cargar datos
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
    productosActuales = PRODUCTOS.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
    indiceActual = 0;
    renderizarProducto();
}

function renderizarProducto() {
    const contenedor = document.getElementById('visor-producto');
    const p = productosActuales[indiceActual];

    if (!p) return;

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