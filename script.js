const productosContainer = document.getElementById('productos-container');
const listaCarrito = document.getElementById('lista-carrito');
const totalPedidoSpan = document.getElementById('total-pedido');
const finalizarPedidoBtn = document.getElementById('finalizar-pedido');
const searchInput = document.getElementById('searchInput');
const categoriesContainer = document.getElementById('categories-container');

// Nuevas variables para el modal y los campos de empresa
const confirmOrderModal = document.getElementById('confirmOrderModal');
const closeButton = document.querySelector('.close-button');
const modalListaCarrito = document.getElementById('modal-lista-carrito');
const modalTotalPedidoSpan = document.getElementById('modal-total-pedido');
const empresaNombreInput = document.getElementById('empresaNombre');
const empresaRifInput = document.getElementById('empresaRif');
const sendOrderBtn = document.getElementById('sendOrderBtn');

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
        const itemEnCarrito = carrito.find(item => item.id === producto.id);
        const cantidadActual = itemEnCarrito ? itemEnCarrito.cantidad : 0;

        const productoCard = document.createElement('div');
        productoCard.classList.add('producto-card');
        productoCard.innerHTML = `
            <img src="imagenes/${producto.imagen}" alt="${producto.nombre}">
            <h3>${producto.nombre}</h3>
            <p>${producto.descripcion}</p>
            <p class="precio">$${producto.precio.toFixed(2)}</p>
            <div class="add-to-cart-controls">
                <button class="agregar-carrito" data-id="${producto.id}">Agregar</button>
                <div class="cantidad-selector">
                    <button class="cantidad-btn decrementar" data-id="${producto.id}">-</button>
                    <input type="number" value="${cantidadActual > 0 ? cantidadActual : ''}" min="0" placeholder="Cant." class="cantidad-input-directa" data-id="${producto.id}">
                    <button class="cantidad-btn incrementar" data-id="${producto.id}">+</button>
                </div>
            </div>
        `;
        productosContainer.appendChild(productoCard);
    });

    // Añadir event listeners a los botones de "Agregar"
    const botonesAgregar = document.querySelectorAll('.agregar-carrito');
    botonesAgregar.forEach(boton => {
        boton.addEventListener('click', agregarIncrementarCantidad);
    });

    // Añadir event listeners a los inputs de cantidad directa (al presionar Enter o cambiar el valor)
    const inputsCantidadDirecta = document.querySelectorAll('.cantidad-input-directa');
    inputsCantidadDirecta.forEach(input => {
        input.addEventListener('change', (event) => {
            const cantidad = parseInt(event.target.value);
            if (!isNaN(cantidad) && event.target.value !== '') {
                agregarCantidadDirecta(event.target.dataset.id, cantidad);
            }
        });
        input.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                const cantidad = parseInt(event.target.value);
                if (!isNaN(cantidad) && event.target.value !== '') {
                    agregarCantidadDirecta(event.target.dataset.id, cantidad);
                    event.target.blur(); // Quitar el foco del input
                }
            }
        });
    });

    // Añadir event listeners a los nuevos botones de incremento/decremento
    const botonesIncrementar = document.querySelectorAll('.cantidad-btn.incrementar');
    botonesIncrementar.forEach(boton => {
        boton.addEventListener('click', incrementarCantidad);
    });

    const botonesDecrementar = document.querySelectorAll('.cantidad-btn.decrementar');
    botonesDecrementar.forEach(boton => {
        boton.addEventListener('click', decrementarCantidad);
    });

    actualizarBotonesCantidad();
}

// --- Lógica del Buscador y Categorías ---

function cargarCategorias() {
    const categorias = new Set();
    todosLosProductos.forEach(producto => {
        if (producto.categoria) {
            categorias.add(producto.categoria);
        }
    });

    categoriesContainer.innerHTML = '';

    const btnTodos = document.createElement('button');
    btnTodos.textContent = 'Todos';
    btnTodos.classList.add('category-button');
    btnTodos.classList.add('active');
    btnTodos.dataset.categoria = 'Todos';
    btnTodos.addEventListener('click', filtrarPorCategoria);
    categoriesContainer.appendChild(btnTodos);

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

    if (categoriaSeleccionada !== 'Todos') {
        productosFiltrados = productosFiltrados.filter(producto => 
            producto.categoria && producto.categoria === categoriaSeleccionada
        );
    }

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
    document.querySelectorAll('.category-button').forEach(btn => {
        btn.classList.remove('active');
    });

    event.target.classList.add('active');

    categoriaSeleccionada = event.target.dataset.categoria;
    filtrarProductos();
    searchInput.value = '';
}

searchInput.addEventListener('keyup', filtrarProductos);

// --- Fin Lógica del Buscador y Categorías ---


// --- Lógica de Agregar al Carrito (Incremento, Cantidad Directa, +/-) ---

function agregarIncrementarCantidad(evento) {
    const productoId = evento.target.dataset.id;
    const producto = todosLosProductos.find(p => p.id === productoId);

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

function incrementarCantidad(evento) {
    const productoId = evento.target.dataset.id;
    const itemEnCarrito = carrito.find(item => item.id === productoId);

    if (itemEnCarrito) {
        itemEnCarrito.cantidad++;
    } else {
        const producto = todosLosProductos.find(p => p.id === productoId);
        if (producto) {
            carrito.push({ ...producto, cantidad: 1 });
        }
    }
    actualizarCarrito();
}

function decrementarCantidad(evento) {
    const productoId = evento.target.dataset.id;
    const itemIndex = carrito.findIndex(item => item.id === productoId);

    if (itemIndex > -1) {
        carrito[itemIndex].cantidad--;
        if (carrito[itemIndex].cantidad <= 0) {
            carrito.splice(itemIndex, 1);
        }
    }
    actualizarCarrito();
}

function agregarCantidadDirecta(productoId, cantidad) {
    if (isNaN(cantidad) || cantidad < 0) {
        alert('Por favor, ingresa una cantidad válida (mínimo 0).');
        return;
    }

    const producto = todosLosProductos.find(p => p.id === productoId);
    if (!producto) return;

    const itemEnCarrito = carrito.find(item => item.id === productoId);

    if (cantidad === 0) {
        carrito = carrito.filter(item => item.id !== productoId);
    } else if (itemEnCarrito) {
        itemEnCarrito.cantidad = cantidad;
    } else {
        carrito.push({ ...producto, cantidad: cantidad });
    }
    actualizarCarrito();
}

function actualizarCarrito() {
    listaCarrito.innerHTML = '';
    let total = 0;
    carrito.forEach(item => {
        const li = document.createElement('li');
        // Usamos el mismo ID de producto para el botón eliminar,
        // ya que ahora eliminará la línea completa.
        li.innerHTML = `${item.nombre} (x${item.cantidad}) - $${(item.precio * item.cantidad).toFixed(2)} 
                        <button data-id="${item.id}" class="eliminar-item">X</button>`;
        listaCarrito.appendChild(li);
        total += item.precio * item.cantidad;
    });
    totalPedidoSpan.textContent = total.toFixed(2);

    document.querySelectorAll('.eliminar-item').forEach(button => {
        // Asegúrate de que este listener apunte a la nueva lógica de eliminación completa.
        button.addEventListener('click', eliminarItemCompletamenteDelCarrito);
    });

    actualizarBotonesCantidad();
}

// Nueva función para eliminar el ítem completamente del carrito
function eliminarItemCompletamenteDelCarrito(evento) {
    const productoId = evento.target.dataset.id;
    // Filtramos el carrito para remover el producto con el ID correspondiente
    carrito = carrito.filter(item => item.id !== productoId);
    actualizarCarrito();
}


function actualizarBotonesCantidad() {
    document.querySelectorAll('.producto-card').forEach(card => {
        const productoId = card.querySelector('.agregar-carrito').dataset.id;
        const itemEnCarrito = carrito.find(item => item.id === productoId);
        const cantidadActual = itemEnCarrito ? itemEnCarrito.cantidad : 0;

        // Actualizar el input de cantidad directa
        const inputDirecto = card.querySelector('.cantidad-input-directa');
        if (inputDirecto) {
            // Si el producto no está en el carrito (cantidad 0), limpiar el input
            inputDirecto.value = cantidadActual > 0 ? cantidadActual : '';
        }

        // Deshabilitar botón de decrementar si la cantidad es 0
        const botonDecrementar = card.querySelector('.cantidad-btn.decrementar');
        if (botonDecrementar) {
            botonDecrementar.disabled = cantidadActual === 0;
        }
    });
}


// --- Lógica del Modal de Confirmación y Envío a WhatsApp ---

finalizarPedidoBtn.addEventListener('click', () => {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío. ¡Agrega algunos productos antes de finalizar!');
        return;
    }

    modalListaCarrito.innerHTML = '';
    let totalModal = 0;
    carrito.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.nombre} (x${item.cantidad}) - $${(item.precio * item.cantidad).toFixed(2)}`;
        modalListaCarrito.appendChild(li);
        totalModal += item.precio * item.cantidad;
    });
    modalTotalPedidoSpan.textContent = totalModal.toFixed(2);

    confirmOrderModal.style.display = 'block';
});

closeButton.addEventListener('click', () => {
    confirmOrderModal.style.display = 'none';
    empresaNombreInput.value = ''; 
    empresaRifInput.value = '';
});

window.addEventListener('click', (event) => {
    if (event.target == confirmOrderModal) {
        confirmOrderModal.style.display = 'none';
        empresaNombreInput.value = ''; 
        empresaRifInput.value = '';
    }
});

sendOrderBtn.addEventListener('click', () => {
    const empresaNombre = empresaNombreInput.value.trim();
    const empresaRif = empresaRifInput.value.trim();

    if (!empresaNombre || !empresaRif) {
        alert('Por favor, ingresa el Nombre de la Empresa y el Número de RIF para continuar.');
        return;
    }

    let mensaje = `¡Hola! Quisiera realizar el siguiente pedido a Librería Santa Rosa:\n\n`;
    carrito.forEach(item => {
        mensaje += `- ${item.nombre} (x${item.cantidad}) - $${(item.precio * item.cantidad).toFixed(2)}\n`;
    });
    mensaje += `\nTotal del Pedido: $${modalTotalPedidoSpan.textContent}\n`;
    mensaje += `\nDatos de la Empresa:\n`;
    mensaje += `Nombre: ${empresaNombre}\n`;
    mensaje += `RIF: ${empresaRif}\n\n`;
    mensaje += `¡Espero su confirmación!`;

    // ¡¡¡RECUERDA CAMBIAR ESTO POR TU NÚMERO DE WHATSAPP REAL!!!
    const numeroWhatsApp = "584244237456"; 
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

    window.open(urlWhatsApp, '_blank');
    
    alert('Tu pedido ha sido enviado a Librería Santa Rosa por WhatsApp. ¡Gracias por tu compra!');
    
    carrito = []; 
    actualizarCarrito();
    confirmOrderModal.style.display = 'none';
    empresaNombreInput.value = '';
    empresaRifInput.value = '';
});

cargarProductos();