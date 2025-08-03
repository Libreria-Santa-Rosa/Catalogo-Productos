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
        const productoCard = document.createElement('div');
        productoCard.classList.add('producto-card');
        
        // Determinar la cantidad actual en el carrito para este producto
        const itemEnCarrito = carrito.find(item => item.id === producto.id);
        const cantidadActual = itemEnCarrito ? itemEnCarrito.cantidad : 0;

        productoCard.innerHTML = `
            <img src="imagenes/${producto.imagen}" alt="${producto.nombre}">
            <h3>${producto.nombre}</h3>
            <p>${producto.descripcion}</p>
            <p class="precio">$${producto.precio.toFixed(2)}</p>
            <div class="add-to-cart-controls">
                <button class="agregar-carrito" data-id="${producto.id}">Agregar (${cantidadActual})</button>
                <input type="number" value="" min="1" placeholder="Cant." class="cantidad-input-directa" data-id="${producto.id}">
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
        input.addEventListener('change', (event) => agregarCantidadDirecta(event.target.dataset.id, parseInt(event.target.value)));
        input.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                agregarCantidadDirecta(event.target.dataset.id, parseInt(event.target.value));
                event.target.blur(); // Quitar el foco del input
            }
        });
    });

    actualizarBotonesCantidad(); // Actualizar el texto de los botones al mostrar productos
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


// --- Lógica de Agregar al Carrito (Incremento y Cantidad Directa) ---

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

function agregarCantidadDirecta(productoId, cantidad) {
    // Validar que la cantidad sea un número válido y mayor o igual a 0
    if (isNaN(cantidad) || cantidad < 0) {
        alert('Por favor, ingresa una cantidad válida (mínimo 0).');
        return;
    }

    const producto = todosLosProductos.find(p => p.id === productoId);
    if (!producto) return;

    const itemEnCarrito = carrito.find(item => item.id === productoId);

    if (cantidad === 0) {
        // Si la cantidad es 0, eliminar el producto del carrito
        carrito = carrito.filter(item => item.id !== productoId);
    } else if (itemEnCarrito) {
        // Si ya está en el carrito, actualizar la cantidad
        itemEnCarrito.cantidad = cantidad;
    } else {
        // Si no está en el carrito, añadirlo con la cantidad especificada
        carrito.push({ ...producto, cantidad: cantidad });
    }
    actualizarCarrito();
    // Limpiar el input después de agregar/actualizar
    const inputElement = document.querySelector(`.cantidad-input-directa[data-id="${productoId}"]`);
    if (inputElement) {
        inputElement.value = '';
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

    // Actualizar el texto de los botones y inputs de cantidad en las tarjetas de productos
    actualizarBotonesCantidad();
}

function eliminarDelCarrito(evento) {
    const productoId = evento.target.dataset.id;
    const itemIndex = carrito.findIndex(item => item.id === productoId);

    if (itemIndex > -1) {
        carrito[itemIndex].cantidad--; // Decrementar la cantidad
        if (carrito[itemIndex].cantidad <= 0) {
            carrito.splice(itemIndex, 1); // Eliminar si la cantidad llega a 0
        }
    }
    actualizarCarrito();
}

function actualizarBotonesCantidad() {
    // Itera sobre todos los botones de "Agregar" y actualiza su texto y el input directo
    document.querySelectorAll('.agregar-carrito').forEach(boton => {
        const productoId = boton.dataset.id;
        const itemEnCarrito = carrito.find(item => item.id === productoId);
        const cantidadActual = itemEnCarrito ? itemEnCarrito.cantidad : 0;
        boton.textContent = `Agregar (${cantidadActual})`;

        // También actualiza el placeholder/value del input directo si es necesario
        // (Aunque lo limpiamos después de usarlo, esto asegura consistencia si se recarga)
        const inputDirecto = boton.nextElementSibling; // El input está justo después del botón
        if (inputDirecto && inputDirecto.classList.contains('cantidad-input-directa')) {
            // No seteamos el valor para que el placeholder sea visible, 
            // solo limpiamos si el producto no está en el carrito
            if (!itemEnCarrito) {
                inputDirecto.value = '';
            }
        }
    });
}


// --- Lógica del Modal de Confirmación y Envío a WhatsApp ---

// Al hacer clic en finalizar pedido, abrimos el modal
finalizarPedidoBtn.addEventListener('click', () => {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío. ¡Agrega algunos productos antes de finalizar!');
        return;
    }

    // Llenar el modal con el resumen del pedido
    modalListaCarrito.innerHTML = '';
    let totalModal = 0;
    carrito.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.nombre} (x${item.cantidad}) - $${(item.precio * item.cantidad).toFixed(2)}`;
        modalListaCarrito.appendChild(li);
        totalModal += item.precio * item.cantidad;
    });
    modalTotalPedidoSpan.textContent = totalModal.toFixed(2);

    // Mostrar el modal
    confirmOrderModal.style.display = 'block';
});

// Cerrar el modal cuando se hace clic en la X
closeButton.addEventListener('click', () => {
    confirmOrderModal.style.display = 'none';
    // Opcional: Limpiar los campos de la empresa al cerrar el modal
    empresaNombreInput.value = ''; 
    empresaRifInput.value = '';
});

// Cerrar el modal cuando se hace clic fuera de él
window.addEventListener('click', (event) => {
    if (event.target == confirmOrderModal) {
        confirmOrderModal.style.display = 'none';
        // Opcional: Limpiar los campos de la empresa al cerrar el modal
        empresaNombreInput.value = ''; 
        empresaRifInput.value = '';
    }
});

// Lógica para enviar el pedido desde el botón dentro del modal
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
    mensaje += `\nTotal del Pedido: $${modalTotalPedidoSpan.textContent}\n`; // Usamos el total del modal
    mensaje += `\nDatos de la Empresa:\n`;
    mensaje += `Nombre: ${empresaNombre}\n`;
    mensaje += `RIF: ${empresaRif}\n\n`;
    mensaje += `¡Espero su confirmación!`;

    // ¡¡¡RECUERDA CAMBIAR ESTO POR TU NÚMERO DE WHATSAPP REAL!!!
    // Formato: Código de país + número (sin el signo + ni espacios)
    // Ejemplo para Venezuela: "584121234567"
    const numeroWhatsApp = "584244237456"; 
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

    window.open(urlWhatsApp, '_blank');
    
    // Aquí puedes añadir un alert de confirmación antes de limpiar si lo deseas
    alert('Tu pedido ha sido enviado a Librería Santa Rosa por WhatsApp. ¡Gracias por tu compra!');
    
    // Limpiar carrito, cerrar modal y limpiar campos
    carrito = []; 
    actualizarCarrito();
    confirmOrderModal.style.display = 'none';
    empresaNombreInput.value = ''; // Limpiar campos del formulario
    empresaRifInput.value = '';
});


// Iniciar la carga de productos cuando la página se cargue
cargarProductos();