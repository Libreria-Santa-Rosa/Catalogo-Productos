const productosContainer = document.getElementById('productos-container');
const listaCarrito = document.getElementById('lista-carrito');
const totalPedidoSpan = document.getElementById('total-pedido');
const finalizarPedidoBtn = document.getElementById('finalizar-pedido');
const searchInput = document.getElementById('searchInput');
const categoriesContainer = document.getElementById('categories-container');

let carrito = [];
let todosLosProductos = []; // Almacenará todos los productos una vez cargados
let categoriaSeleccionada = 'Todos'; // Para el filtro de categorías

async function cargarProductos() {
    try {
        const response = await fetch('productos.json');
        todosLosProductos = await response.json(); // Guardamos todos los productos
        mostrarProductos(todosLosProductos); // Mostramos todos por defecto
        cargarCategorias(); // Cargamos las categorías una vez que los productos estén listos
    } catch (error) {
        console.error('Error al cargar los productos:', error);
        productosContainer.innerHTML = '<p>Lo sentimos, no pudimos cargar los productos.</p>';
    }
}

function mostrarProductos(productosAMostrar) {
    productosContainer.innerHTML = ''; // Limpiar el contenedor antes de añadir productos
    if (productosAMostrar.length === 0) {
        productosContainer.innerHTML = '<p>No se encontraron productos que coincidan con su búsqueda o filtro.</p>';
        return;
    }

    productosAMostrar.forEach(producto => {
        const productoCard = document.createElement('div');
        productoCard.classList.add('producto-card');
        productoCard.innerHTML = `
            <img src="imagenes/${producto.imagen}" alt="${producto.nombre}">
            <h3>${producto.nombre}</h3>
            <p>${producto.descripcion}</p>
            <p class="precio">$${producto.precio.toFixed(2)}</p>
            <button class="agregar-carrito" data-id="${producto.id}">Agregar al carrito</button>
        `;
        productosContainer.appendChild(productoCard);
    });

    const botonesAgregar = document.querySelectorAll('.agregar-carrito');
    botonesAgregar.forEach(boton => {
        boton.addEventListener('click', agregarAlCarrito);
    });
}

// --- Lógica del Buscador y Categorías ---

function cargarCategorias() {
    const categorias = new Set(); // Usamos Set para obtener categorías únicas
    todosLosProductos.forEach(producto => {
        if (producto.categoria) {
            categorias.add(producto.categoria);
        }
    });

    categoriesContainer.innerHTML = ''; // Limpiar antes de añadir botones

    // Botón "Todos" para ver todos los productos
    const btnTodos = document.createElement('button');
    btnTodos.textContent = 'Todos';
    btnTodos.classList.add('category-button');
    btnTodos.classList.add('active'); // Activo por defecto
    btnTodos.dataset.categoria = 'Todos';
    btnTodos.addEventListener('click', filtrarPorCategoria);
    categoriesContainer.appendChild(btnTodos);

    // Botones para cada categoría única
    // Ordenamos las categorías alfabéticamente para una mejor UX
    Array.from(categorias).sort().forEach(categoria => {
        const button = document.createElement('button');
        button.textContent = categoria;
        button.classList.add('category-button');
        button.dataset.categoria = categoria;
        button.addEventListener('click', filtrarPorCategoria);
        categoriesContainer.appendChild(button);
    });
}

function filtrarProductos() {
    let productosFiltrados = todosLosProductos;
    const searchTerm = searchInput.value.toLowerCase().trim();

    // 1. Filtrar por categoría (si hay una seleccionada y no es 'Todos')
    if (categoriaSeleccionada !== 'Todos') {
        productosFiltrados = productosFiltrados.filter(producto => 
            producto.categoria && producto.categoria === categoriaSeleccionada
        );
    }

    // 2. Filtrar por término de búsqueda (si hay un término)
    if (searchTerm) {
        productosFiltrados = productosFiltrados.filter(producto =>
            producto.nombre.toLowerCase().includes(searchTerm) ||
            producto.descripcion.toLowerCase().includes(searchTerm) ||
            (producto.categoria && producto.categoria.toLowerCase().includes(searchTerm))
        );
    }

    mostrarProductos(productosFiltrados);
}

function filtrarPorCategoria(event) {
    // Eliminar la clase 'active' de todos los botones
    document.querySelectorAll('.category-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Añadir la clase 'active' al botón clickeado
    event.target.classList.add('active');

    categoriaSeleccionada = event.target.dataset.categoria;
    filtrarProductos(); // Llama a la función de filtro general
    searchInput.value = ''; // Limpia el buscador al cambiar de categoría
}

// Escuchador de eventos para el campo de búsqueda
searchInput.addEventListener('keyup', filtrarProductos);

// --- Fin Lógica del Buscador y Categorías ---


// --- Lógica existente del carrito (sin cambios significativos) ---

function agregarAlCarrito(evento) {
    const productoId = evento.target.dataset.id;
    const producto = todosLosProductos.find(p => p.id === productoId); // Usamos todosLosProductos

    if (producto) {
        const itemEnCarrito = carrito.find(item => item.id === productoId);
        if (itemEnCarrito) {
            itemEnCarrito.cantidad++;
        } else {
            carrito.push({ ...producto, cantidad: 1 });
        }
        actualizarCarrito();
    }
}

function actualizarCarrito() {
    listaCarrito.innerHTML = '';
    let total = 0;
    carrito.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `${item.nombre} (x${item.cantidad}) - $${(item.precio * item.cantidad).toFixed(2)} 
                        <button data-id="${item.id}" class="eliminar-item">X</button>`;
        listaCarrito.appendChild(li);
        total += item.precio * item.cantidad;
    });
    totalPedidoSpan.textContent = total.toFixed(2);

    document.querySelectorAll('.eliminar-item').forEach(button => {
        button.addEventListener('click', eliminarDelCarrito);
    });
}

function eliminarDelCarrito(evento) {
    const productoId = evento.target.dataset.id;
    carrito = carrito.filter(item => item.id !== productoId);
    actualizarCarrito();
}

finalizarPedidoBtn.addEventListener('click', () => {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío. ¡Agrega algunos productos antes de finalizar!');
        return;
    }

    let mensaje = "¡Hola! Quisiera realizar el siguiente pedido a Librería Santa Rosa:\n\n"; // Título personalizado
    carrito.forEach(item => {
        mensaje += `- ${item.nombre} (x${item.cantidad}) - $${(item.precio * item.cantidad).toFixed(2)}\n`;
    });
    mensaje += `\nTotal del Pedido: $${totalPedidoSpan.textContent}\n`;
    mensaje += "\n¡Espero tu confirmación! Mi nombre es [Tu Nombre] y mi teléfono es [Tu Teléfono]"; // Sugiere al cliente añadir sus datos

    const numeroWhatsApp = "584244237456"; // ¡RECUERDA CAMBIAR ESTO POR TU NÚMERO!
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

    window.open(urlWhatsApp, '_blank');
    alert('Tu pedido ha sido enviado a Librería Santa Rosa por WhatsApp. ¡Gracias!');
    
    carrito = []; 
    actualizarCarrito();
});

// Iniciar la carga de productos cuando la página se cargue
cargarProductos();