document.addEventListener('DOMContentLoaded', () => {
    // --- INICIALIZACIÓN GENERAL ---
    lucide.createIcons();

    // URL remota por defecto (ajusta si usas otra deployment)
    // 📢 REEMPLAZA ESTA LÍNEA CON TU NUEVA URL DE RENDER
    const REMOTE_BASE_URL = "https://salud-y-belleza-gema.onrender.com"; 

    const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168');
    let BASE_URL = IS_LOCALHOST ? "http://localhost:4000" : REMOTE_BASE_URL;
    
    // --- MANEJO DE PESTAÑAS ---
    const tabs = document.querySelectorAll(".tab-btn");
    const contents = document.querySelectorAll(".tab-content");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            contents.forEach(c => c.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(tab.dataset.tab).classList.add("active");
        });
    });

    // --- Cerrar cualquier modal al hacer click en el fondo ---
    document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
        modal.classList.add("hidden");

        // Si dentro del modal hay un form, lo resetea
        const form = modal.querySelector("form");
        if (form) form.reset();

        // Si hay algún div de campos dinámicos, lo vuelve a ocultar
        const campos = modal.querySelector("[id^='campos']");
        if (campos) campos.classList.add("hidden");
        }
    });
    });

    // --- RESUMEN FINANCIERO ---
    async function fetchSummary() {
        try {
            const res = await fetch(`${API_BASE_URL}/summary`);
            if (!res.ok) throw new Error('Error al obtener el resumen');
            const data = await res.json();
            document.getElementById("totalVentas").textContent = "$" + Number(data.totalVentas || 0).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            document.getElementById("totalAbonos").textContent = "$" + Number(data.totalAbonos || 0).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            document.getElementById("totalPorCobrar").textContent = "$" + Number(data.totalPorCobrar || 0).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            document.getElementById("totalGananciaPorDia").textContent = "$" + Number(data.totalGananciaPorDia || 0).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            document.getElementById("totalInvertidoEnProductos").textContent = "$" + Number(data.totalInvertidoEnProductos || 0).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        } catch (err) { console.error("Error fetching summary:", err); }
    }
    document.getElementById("refresh").addEventListener("click", fetchSummary);
    fetchSummary();

    // --- ELEMENTOS GLOBALES DE MODALES ---
    const modalProducto = document.getElementById("modalProducto");
    const modalCliente = document.getElementById("modalCliente");
    const modalAbono = document.getElementById("modalAbono");
    const modalVenta = document.getElementById("modalVenta");

    // --- LÓGICA MODAL PRODUCTOS ---
    const openBtnProducto = document.getElementById("openAddProduct");
    const closeBtnProducto = document.getElementById("closeModal");
    const formProducto = document.getElementById("formProducto");
    const selectProducto = document.getElementById("selectProducto");
    const camposNuevoProducto = document.getElementById("camposNuevoProducto");
    const inputNombreNuevoProducto = formProducto.querySelector('input[name="nombre_producto"]');
    const selectCategoria = document.getElementById("selectCategoria");
    const campoNuevaCategoria = document.getElementById("campoNuevaCategoria");
    const inputNuevaCategoria = formProducto.querySelector('input[name="nombre_categoria"]');
    let productosData = [];

    async function populateProductsDropdown() {
        try {
            const res = await fetch(`${API_BASE_URL}/productos`);
            if (!res.ok) throw new Error('No se pudo cargar la lista de productos');
            productosData = await res.json();
            selectProducto.innerHTML = '<option value="">-- Selecciona un producto --</option>';
            productosData.forEach(p => {
                const option = document.createElement('option');
                option.value = p.producto_id;
                option.textContent = p.nombre_producto;
                selectProducto.appendChild(option);
            });
            selectProducto.innerHTML += '<option value="nuevo">-- Agregar Nuevo Producto --</option>';
        } catch (err) { console.error('Error al cargar productos:', err); }
    }

    async function populateCategoriesDropdown() {
        try {
            const res = await fetch(`${API_BASE_URL}/categorias`);
            if (!res.ok) throw new Error('No se pudo cargar la lista de categorías');
            const categoriasData = await res.json();
            selectCategoria.innerHTML = '<option value="">-- Selecciona una categoría --</option>';
            categoriasData.forEach(c => {
                const option = document.createElement('option');
                option.value = c.categoria_id;
                option.textContent = c.nombre_categoria;
                selectCategoria.appendChild(option);
            });
            selectCategoria.innerHTML += '<option value="nueva">-- Crear Nueva Categoría --</option>';
        } catch (err) { console.error('Error al cargar categorías:', err); }
    }

    openBtnProducto.addEventListener("click", () => {
        formProducto.reset();
        camposNuevoProducto.classList.add('hidden');
        campoNuevaCategoria.classList.add('hidden');
        populateProductsDropdown();
        populateCategoriesDropdown();
        modalProducto.classList.remove("hidden");
    });
    closeBtnProducto.addEventListener("click", () => {
        modalProducto.classList.add("hidden");
        modalProducto.classList.remove('on-top');
    });

    selectProducto.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        formProducto.querySelector('input[name="precio_compra"]').value = '';
        formProducto.querySelector('input[name="codigo_barras"]').value = '';
        if (selectedValue === 'nuevo') {
            camposNuevoProducto.classList.remove('hidden');
            inputNombreNuevoProducto.required = true;
            selectCategoria.required = true;
        } else if (selectedValue) {
            camposNuevoProducto.classList.add('hidden');
            inputNombreNuevoProducto.required = false;
            selectCategoria.required = false;
            const producto = productosData.find(p => p.producto_id == selectedValue);
            if (producto) {
                formProducto.querySelector('input[name="precio_compra"]').value = producto.precio_compra || '';
                formProducto.querySelector('input[name="codigo_barras"]').value = producto.codigo_barras || '';
            }
        } else {
            camposNuevoProducto.classList.add('hidden');
        }
    });

    selectCategoria.addEventListener('change', (e) => {
        campoNuevaCategoria.classList.toggle('hidden', e.target.value !== 'nueva');
        inputNuevaCategoria.required = e.target.value === 'nueva';
    });

    formProducto.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(formProducto);
        const data = Object.fromEntries(formData.entries());
        if (data.producto_id !== 'nuevo') {
            delete data.nombre_producto; delete data.categoria_id; delete data.nombre_categoria;
        } else { delete data.producto_id; }
        if (data.categoria_id !== 'nueva') { delete data.nombre_categoria; } else { delete data.categoria_id; }
        try {
            const res = await fetch(`${API_BASE_URL}/productos/agregar`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            alert(`✅ ${result.message}`);
            modalProducto.classList.add("hidden");
            modalProducto.classList.remove('on-top');
            fetchSummary();
            if (!modalVenta.classList.contains('hidden')) {
                await populateProductsDropdownVenta();
                selectProductoVenta.value = result.producto.producto_id;
                selectProductoVenta.dispatchEvent(new Event('change'));
            }
        } catch (err) { alert(`❌ Error: ${err.message}`); }
    });

    // --- LÓGICA MODAL CLIENTES ---
    const openBtnCliente = document.getElementById("openAddClient");
    const closeBtnCliente = document.getElementById("closeModalCliente");
    const formCliente = document.getElementById("formCliente");

    openBtnCliente.addEventListener("click", () => modalCliente.classList.remove("hidden"));
    closeBtnCliente.addEventListener("click", () => {
        modalCliente.classList.add("hidden");
        modalCliente.classList.remove('on-top');
        formCliente.reset();
        // Oculta campos dinámicos si existen
        const campos = modalCliente.querySelector('[id^="campos"]');
        if (campos) campos.classList.add('hidden');
    });
    formCliente.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(formCliente);
        const data = Object.fromEntries(formData.entries());
        try {
            const res = await fetch(`${API_BASE_URL}/clientes/agregar`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            alert(`✅ ${result.message}`);
            modalCliente.classList.add("hidden");
            modalCliente.classList.remove('on-top');
            if (!modalVenta.classList.contains('hidden')) {
                await populateClientsDropdown(selectClienteVenta);
                selectClienteVenta.value = result.cliente.cliente_id;
            }
        } catch (err) { alert(`❌ Error: ${err.message}`); }
    });


    // =============================================================
    // ===== LÓGICA PARA ENVIAR RECORDATORIOS POR WHATSAPP =====
    // =============================================================

    const openWhatsappModalBtn = document.getElementById("openWhatsappModal");
    const whatsappSelectionModal = document.getElementById("modalWhatsappSelection");
    const closeWhatsappSelectionModalBtn = document.getElementById("closeWhatsappSelectionModal");
    const clientListContainer = document.getElementById("whatsapp-client-list");
    const selectAllCheckbox = document.getElementById("whatsapp-select-all");
    const generateMessagesBtn = document.getElementById("generateWhatsappMessages");
    
    const whatsappSenderModal = document.getElementById("modalWhatsappSender");
    const closeWhatsappSenderModalBtn = document.getElementById("closeWhatsappSenderModal");
    const senderTableBody = document.querySelector("#whatsapp-sender-table tbody");

    // 1. Abrir el modal de selección de clientes
    if(openWhatsappModalBtn) {
        openWhatsappModalBtn.addEventListener("click", async () => {
            whatsappSelectionModal.classList.remove("hidden");
            clientListContainer.innerHTML = "<p>Cargando clientes con saldo pendiente...</p>";
            selectAllCheckbox.checked = false;

            try {
                const res = await fetch(`${API_BASE_URL}/clientes/con-saldo`);
                if (!res.ok) throw new Error("No se pudo obtener la lista de clientes con saldo.");
                
                const clientes = await res.json();
                
                if (clientes.length === 0) {
                    clientListContainer.innerHTML = "<p>No hay clientes con saldo deudor en este momento.</p>";
                    return;
                }

                // Poblar la lista
                clientListContainer.innerHTML = '';
                clientes.forEach(cliente => {
                    const saldoFormateado = Number(cliente.saldo_deudor).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
                    const itemHTML = `
                        <div class="client-item">
                            <input type="checkbox" class="whatsapp-client-checkbox" value="${cliente.cliente_id}" data-cliente='${JSON.stringify(cliente)}'>
                            <label>${cliente.nombre}</label>
                            <span class="saldo">${saldoFormateado}</span>
                        </div>
                    `;
                    clientListContainer.innerHTML += itemHTML;
                });

            } catch (err) {
                clientListContainer.innerHTML = `<p style="color: red;">${err.message}</p>`;
            }
        });
    }

    // 2. Funcionalidad del checkbox "Seleccionar todos"
    selectAllCheckbox.addEventListener("change", () => {
        const checkboxes = document.querySelectorAll(".whatsapp-client-checkbox");
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });

    // 3. Cerrar el modal de selección
    closeWhatsappSelectionModalBtn.addEventListener("click", () => {
        whatsappSelectionModal.classList.add("hidden");
    });

    // 4. Generar los mensajes y abrir el segundo modal
    generateMessagesBtn.addEventListener("click", () => {
        const selectedCheckboxes = document.querySelectorAll(".whatsapp-client-checkbox:checked");
        if (selectedCheckboxes.length === 0) {
            alert("Por favor, selecciona al menos un cliente.");
            return;
        }

        senderTableBody.innerHTML = ''; // Limpiar la tabla
        const nombreNegocio = "Tu Negocio"; // <-- CAMBIAR POR EL NOMBRE REAL

        selectedCheckboxes.forEach(checkbox => {
            const cliente = JSON.parse(checkbox.dataset.cliente);
            
            // Validar que el cliente tenga teléfono
            if (!cliente.telefono || cliente.telefono.length < 10) {
                 const row = `
                    <tr>
                        <td>${cliente.nombre}</td>
                        <td><span style="color: red;">Teléfono no válido</span></td>
                        <td class="status pendiente">Pendiente</td>
                    </tr>`;
                senderTableBody.innerHTML += row;
                return; // Saltar al siguiente cliente
            }

            // Construir mensaje y URL de WhatsApp
            const totalAbonado = Number(cliente.total_abonado || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
            const saldoDeudor = Number(cliente.saldo_deudor).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
            
            const mensaje = `Hola ${cliente.nombre}, te saludamos de ${nombreNegocio}. Te escribimos para informarte sobre el estado de tu cuenta. Hasta la fecha, has abonado un total de ${totalAbonado} y tienes un saldo pendiente de ${saldoDeudor}. ¡Gracias!`;
            
            // Asegurarse de que el número esté en formato internacional (ej. 52 para México)
            const telefonoInternacional = `521${cliente.telefono.replace(/\s+/g, '')}`;

            const whatsappUrl = `https://wa.me/${telefonoInternacional}?text=${encodeURIComponent(mensaje)}`;

            const row = `
                <tr data-cliente-id="${cliente.cliente_id}">
                    <td>${cliente.nombre}</td>
                    <td>
                        <a href="${whatsappUrl}" target="_blank" class="btn-send-whatsapp" data-cliente-id="${cliente.cliente_id}">
                            <i data-lucide="send"></i> Enviar Mensaje
                        </a>
                    </td>
                    <td class="status pendiente">Pendiente</td>
                </tr>
            `;
            senderTableBody.innerHTML += row;
        });

        lucide.createIcons(); // Re-renderizar los íconos de Lucide
        whatsappSelectionModal.classList.add("hidden");
        whatsappSenderModal.classList.remove("hidden");
    });

    // 5. Marcar como enviado al hacer clic en el botón de la tabla
    senderTableBody.addEventListener("click", (e) => {
        const target = e.target.closest(".btn-send-whatsapp");
        if (target) {
            const clienteId = target.dataset.clienteId;
            const row = senderTableBody.querySelector(`tr[data-cliente-id="${clienteId}"]`);
            if (row) {
                const statusCell = row.querySelector(".status");
                statusCell.textContent = "Enviado ✔️";
                statusCell.classList.remove("pendiente");
                statusCell.classList.add("enviado");
                target.classList.add("disabled"); // Deshabilitar el botón visualmente
            }
        }
    });

    // 6. Cerrar el modal de envío
    closeWhatsappSenderModalBtn.addEventListener("click", () => {
        whatsappSenderModal.classList.add("hidden");
    });


    // --- LÓGICA MODAL ABONOS ---
    const openBtnAbono = document.getElementById("openAddAbono");
    const closeBtnAbono = document.getElementById("closeModalAbono");
    const formAbono = document.getElementById("formAbono");
    const selectClienteAbono = document.getElementById("selectClienteAbono");

    async function populateClientsDropdown(selectElement) {
        try {
            const res = await fetch(`${API_BASE_URL}/clientes`);
            if (!res.ok) throw new Error('No se pudo cargar la lista de clientes');
            const clientes = await res.json();
            const currentValue = selectElement.value;
            selectElement.innerHTML = '<option value="">-- Selecciona un cliente --</option>';
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.cliente_id;
                option.textContent = cliente.nombre;
                selectElement.appendChild(option);
            });
            if (selectElement.id === 'selectClienteVenta') {
                selectElement.innerHTML += '<option value="nuevo_cliente">-- Agregar Nuevo Cliente --</option>';
            }
            selectElement.value = currentValue;
        } catch (err) {
            console.error('Error al cargar clientes:', err);
            selectElement.innerHTML = `<option value="">${err.message}</option>`;
        }
    }

    openBtnAbono.addEventListener("click", () => {
        formAbono.reset();
        formAbono.querySelector('input[name="fecha_abono"]').value = new Date().toISOString().split('T')[0];
        populateClientsDropdown(selectClienteAbono);
        modalAbono.classList.remove("hidden");
    });
    closeBtnAbono.addEventListener("click", () => {
        modalAbono.classList.add("hidden");
        modalAbono.classList.remove('on-top');
        formAbono.reset();
        // Oculta campos dinámicos si existen
        const campos = modalAbono.querySelector('[id^="campos"]');
        if (campos) campos.classList.add('hidden');
    });
    formAbono.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(formAbono);
        const data = Object.fromEntries(formData.entries());
        try {
            const res = await fetch(`${API_BASE_URL}/abonos/agregar`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            alert(`✅ ${result.message}`);
            modalAbono.classList.add("hidden");
            fetchSummary();
        } catch (err) { alert(`❌ Error: ${err.message}`); }
    });

    // --- LÓGICA MODAL VENTAS ---
    const openBtnVenta = document.getElementById("openAddVenta");
    const closeBtnVenta = document.getElementById("closeModalVenta");
    const formVenta = document.getElementById("formVenta");
    const selectProductoVenta = document.getElementById("selectProductoVenta");
    const selectClienteVenta = document.getElementById("selectClienteVenta");

    async function populateProductsDropdownVenta() {
        try {
            const res = await fetch(`${API_BASE_URL}/productos`);
            if (!res.ok) throw new Error('No se pudo cargar la lista de productos');
            const productos = await res.json();
            selectProductoVenta.productosData = productos;
            const currentValue = selectProductoVenta.value;
            selectProductoVenta.innerHTML = '<option value="">-- Selecciona un producto --</option>';
            productos.forEach(p => {
                const option = document.createElement('option');
                option.value = p.producto_id;
                option.textContent = `${p.nombre_producto} (Stock: ${p.unidades_disponibles})`;
                selectProductoVenta.appendChild(option);
            });
            selectProductoVenta.innerHTML += '<option value="nuevo_producto">-- Agregar Nuevo Producto --</option>';
            selectProductoVenta.value = currentValue;
        } catch (err) { console.error('Error al cargar productos para venta:', err); }
    }

    selectProductoVenta.addEventListener('change', async (e) => { // Se añade 'async'
        const selectedId = e.target.value;

        if (selectedId === 'nuevo_producto') {
            // 1. Cargamos los datos necesarios para el pop-up de producto
            await populateProductsDropdown();
            await populateCategoriesDropdown();
            
            // 2. Abrimos el pop-up
            modalProducto.classList.add('on-top');
            modalProducto.classList.remove('hidden');
            
            // 3. Forzamos el estado a "nuevo producto"
            document.getElementById('formProducto').reset();
            const selectProductoAnidado = document.getElementById('selectProducto');
            selectProductoAnidado.value = 'nuevo';
            selectProductoAnidado.dispatchEvent(new Event('change'));
            
        } else {
            // Esto se mantiene igual para cuando seleccionas un producto existente
            const producto = selectProductoVenta.productosData?.find(p => p.producto_id == selectedId);
            formVenta.querySelector('input[name="precio_unitario"]').value = producto ? (producto.precio_venta || '') : '';
        }
    });

    selectClienteVenta.addEventListener('change', (e) => {
        if (e.target.value === 'nuevo_cliente') {
            modalCliente.classList.add('on-top');
            modalCliente.classList.remove('hidden');
        }
    });

    openBtnVenta.addEventListener("click", () => {
        formVenta.reset();
        formVenta.querySelector('input[name="fecha_venta"]').value = new Date().toISOString().split('T')[0];
        populateProductsDropdownVenta();
        populateClientsDropdown(selectClienteVenta);
        modalVenta.classList.remove("hidden");
    });
    closeBtnVenta.addEventListener("click", () => modalVenta.classList.add("hidden"));
    formVenta.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(formVenta);
        const data = Object.fromEntries(formData.entries());
        try {
            const res = await fetch(`${API_BASE_URL}/ventas/agregar`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            alert(`✅ ${result.message}`);
            modalVenta.classList.add("hidden");
            fetchSummary();
        } catch (err) { alert(`❌ Error: ${err.message}`); }
    });

    // --- LÓGICA ELIMINAR ABONOS ---
    const openBtnDeleteAbono = document.getElementById("openDeleteAbono");
    const closeBtnDeleteAbono = document.getElementById("closeModalDeleteAbono");
    const modalDeleteAbono = document.getElementById("modalDeleteAbono");
    const formDeleteAbono = document.getElementById("formDeleteAbono");
    const selectDeleteAbono = document.getElementById("selectDeleteAbono");

    async function populateDeleteAbonosDropdown() {
        try {
            const res = await fetch(`${API_BASE_URL}/abonos`);
            if (!res.ok) throw new Error("No se pudo cargar la lista de abonos");
            const abonos = await res.json();
            selectDeleteAbono.innerHTML = '<option value="">-- Selecciona un abono --</option>';
            abonos.forEach(a => {
                const option = document.createElement("option");
                option.value = a.abono_id;
                option.textContent = `${a.cliente} | ${a.fecha_abono} | $${a.monto_abono}`;
                selectDeleteAbono.appendChild(option);
            });
        } catch (err) {
            console.error("Error al cargar abonos:", err);
            selectDeleteAbono.innerHTML = `<option value="">${err.message}</option>`;
        }
    }

    openBtnDeleteAbono.addEventListener("click", () => {
        populateDeleteAbonosDropdown();
        modalDeleteAbono.classList.remove("hidden");
    });

    closeBtnDeleteAbono.addEventListener("click", () => {
        modalDeleteAbono.classList.add("hidden");
    });

    formDeleteAbono.addEventListener("submit", async (e) => {
        e.preventDefault();
        const abonoId = selectDeleteAbono.value;
        if (!abonoId) return;
        if (!confirm("¿Seguro que deseas eliminar este abono?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/abonos/${abonoId}`, { method: "DELETE" });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            alert(`✅ ${result.message}`);
            modalDeleteAbono.classList.add("hidden");
            fetchSummary();
        } catch (err) {
            alert(`❌ Error: ${err.message}`);
        }
    });


    // --- Eliminar Producto ---
    const btnDeleteProducto = document.querySelector('#eliminar .option-btn:nth-child(2)');
    const modalDeleteProducto = document.getElementById('modalDeleteProducto');
    const closeModalDeleteProducto = document.getElementById('closeModalDeleteProducto');
    const selectDeleteProducto = document.getElementById('selectDeleteProducto');
    const formDeleteProducto = document.getElementById('formDeleteProducto');

    // Abrir modal de eliminar producto
    btnDeleteProducto.addEventListener('click', async () => {
        modalDeleteProducto.classList.remove('hidden');

        // Llenar el select con los productos
        try {
            const res = await fetch(`${API_BASE_URL}/productos`);
            if (!res.ok) throw new Error('No se pudo cargar la lista de productos');
            const productos = await res.json();

            // Limpiar antes de volver a cargar
            selectDeleteProducto.innerHTML = '<option value="">-- Selecciona un producto --</option>';

            productos.forEach(p => {
                const option = document.createElement('option');
                option.value = p.producto_id;
                option.textContent = `${p.nombre_producto} (${p.unidades_disponibles} unidades)`;
                selectDeleteProducto.appendChild(option);
            });
        } catch (err) {
            console.error('Error al cargar productos:', err);
            selectDeleteProducto.innerHTML = `<option value="">${err.message}</option>`;
        }
    });

    // Cerrar modal
    closeModalDeleteProducto.addEventListener('click', () => {
        modalDeleteProducto.classList.add('hidden');
    });

    // Enviar formulario para eliminar producto
    formDeleteProducto.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productoId = selectDeleteProducto.value;
        if (!productoId) return alert('Selecciona un producto para eliminar.');
        if (!confirm('¿Seguro que deseas eliminar este producto?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/productos/${productoId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                alert('Producto eliminado correctamente.');
                modalDeleteProducto.classList.add('hidden');
                formDeleteProducto.reset();
                fetchSummary();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error('Error al eliminar producto:', err);
            alert('Error al eliminar producto.');
        }
    });


    // --- Eliminar Venta ---
    const btnDeleteVenta = document.querySelector('#eliminar .option-btn:nth-child(3)'); // botón de eliminar venta
    const modalDeleteVenta = document.getElementById('modalDeleteVenta');
    const closeModalDeleteVenta = document.getElementById('closeModalDeleteVenta');
    const selectDeleteVenta = document.getElementById('selectDeleteVenta');
    const formDeleteVenta = document.getElementById('formDeleteVenta');

    async function populateDeleteVentasDropdown() {
    try {
        const res = await fetch(`${API_BASE_URL}/ventas`);
        const ventas = await res.json();
        selectDeleteVenta.innerHTML = '<option value="">-- Selecciona una venta --</option>';
        ventas.forEach(v => {
        const option = document.createElement('option');
        option.value = v.venta_id;
        option.textContent = `ID:${v.venta_id} | ${v.nombre_producto} | Cant: ${v.cantidad}`;
        selectDeleteVenta.appendChild(option);
        });
    } catch (err) {
        console.error('Error al cargar ventas:', err);
        selectDeleteVenta.innerHTML = `<option value="">${err.message}</option>`;
    }
    }

    // Abrir modal
    btnDeleteVenta.addEventListener('click', () => {
    populateDeleteVentasDropdown();
    modalDeleteVenta.classList.remove('hidden');
    });

    // Cerrar modal
    closeModalDeleteVenta.addEventListener('click', () => {
    modalDeleteVenta.classList.add('hidden');
    });

    // Eliminar venta
    formDeleteVenta.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ventaId = selectDeleteVenta.value;
    if (!ventaId) return alert('Selecciona una venta para eliminar.');
    if (!confirm('¿Seguro que deseas eliminar esta venta?')) return;

    try {
        const res = await fetch(`${API_BASE_URL}/ventas/${ventaId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
        alert('Venta eliminada correctamente.');
        modalDeleteVenta.classList.add('hidden');
        formDeleteVenta.reset();
        fetchSummary(); // actualizar resumen financiero
        } else {
        alert('Error: ' + data.error);
        }
    } catch (err) {
        console.error('Error al eliminar venta:', err);
        alert('Error al eliminar venta.');
    }
    });


    // --- Eliminar Cliente ---
    const btnDeleteCliente = document.getElementById("openDeleteCliente");
    const modalDeleteCliente = document.getElementById("modalDeleteCliente");
    const cancelDeleteCliente = document.getElementById("cancelDeleteCliente");
    const selectDeleteCliente = document.getElementById("selectDeleteCliente");
    const formDeleteCliente = document.getElementById("formDeleteCliente");

    // Llenar el selector con los clientes
    async function populateDeleteClientesDropdown() {
        try {
            selectDeleteCliente.innerHTML = '<option value="">-- Cargando clientes... --</option>';
            const res = await fetch(`${API_BASE_URL}/clientes`);
            if (!res.ok) throw new Error("No se pudo cargar la lista de clientes");
            const clientes = await res.json();

            selectDeleteCliente.innerHTML = '<option value="">-- Selecciona un cliente --</option>';
            clientes.forEach(c => {
                const option = document.createElement("option");
                option.value = c.cliente_id;
                option.textContent = c.nombre;
                selectDeleteCliente.appendChild(option);
            });
        } catch (err) {
            console.error("Error al cargar clientes:", err);
            selectDeleteCliente.innerHTML = `<option value="">${err.message}</option>`;
        }
    }

    // Abrir el pop-up (modal) para eliminar cliente
    btnDeleteCliente.addEventListener("click", () => {
        populateDeleteClientesDropdown();
        modalDeleteCliente.classList.remove("hidden");
    });

    // Cerrar el pop-up con el botón "Cancelar"
    cancelDeleteCliente.addEventListener("click", () => {
        modalDeleteCliente.classList.add("hidden");
    });

    // Manejar el envío del formulario para eliminar el cliente
    formDeleteCliente.addEventListener("submit", async (e) => {
        // 1. Prevenir que la página se recargue (¡Esta era la clave del error!)
        e.preventDefault(); 
        
        const clienteId = selectDeleteCliente.value;
        if (!clienteId) {
            alert("Por favor, selecciona un cliente para eliminar.");
            return;
        }
        
        if (!confirm("¿Seguro que deseas eliminar este cliente? Esta acción no se puede deshacer.")) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/clientes/${clienteId}`, { 
                method: "DELETE" 
            });
            const data = await res.json();

            // Verificar si la respuesta del servidor fue exitosa
            if (res.ok && data.success) {
                alert("✅ Cliente eliminado correctamente.");
                modalDeleteCliente.classList.add("hidden");
                formDeleteCliente.reset();
                fetchSummary(); // Actualiza el resumen financiero
            } else {
                // Muestra el error específico que viene del servidor (ej. "cliente con ventas asociadas")
                throw new Error(data.error || "No se pudo eliminar el cliente.");
            }
        } catch (err) {
            console.error("Error al eliminar cliente:", err);
            alert(`❌ Error: ${err.message}`);
        }
    });


    // =================================================================
    // LÓGICA PARA LA PESTAÑA "CONSULTAS" (COMPLETA)
    // =================================================================

    // --- Elementos de la Pestaña de Consultas ---
    const consultasTab = document.getElementById('consultas');

    // Elementos de la Vista de Consulta de Clientes
    const consultaClientesView = document.getElementById('consulta-clientes-view');
    const btnOpenConsultaClientes = document.getElementById('btn-open-consulta-clientes');
    const btnVolverConsultas = document.getElementById('btn-volver-consultas');
    const selectConsultaCliente = document.getElementById('selectConsultaCliente');
    const clienteDetalleInfo = document.getElementById('cliente-detalle-info');
    const tablaVentasBody = document.querySelector('#tabla-historial-ventas tbody');
    const tablaAbonosBody = document.querySelector('#tabla-historial-abonos tbody');

    // Elementos de la Vista de Consulta de Productos
    const consultaProductosView = document.getElementById('consulta-productos-view');
    const btnOpenConsultaProductos = document.getElementById('btn-open-consulta-productos');
    const btnVolverDesdeProductos = document.getElementById('btn-volver-consultas-desde-productos');
    const tablaConsultaProductosBody = document.querySelector('#tabla-consulta-productos tbody');
    const filtroCategoriaSelect = document.getElementById('filtroCategoria');

    let todosLosProductos = []; // Almacenará la lista completa de productos
    let estadoOrdenamiento = {
        columna: null, // 'subtotal', 'categoria'
        direccion: 'asc' // 'asc', 'desc'
    };

    // Elementos de la Vista de Consulta de ventas
    const consultaVentasView = document.getElementById('consulta-ventas-view');
    const btnOpenConsultaVentas = document.getElementById('btn-open-consulta-ventas');
    const btnVolverDesdeVentas = document.getElementById('btn-volver-consultas-desde-ventas');
    const tablaConsultaVentasBody = document.querySelector('#tabla-consulta-ventas tbody');

    // Filtros
    const filtroFechaInicio = document.getElementById('filtro-fecha-inicio');
    const filtroFechaFin = document.getElementById('filtro-fecha-fin');
    const filtroCliente = document.getElementById('filtro-cliente');
    const filtroProducto = document.getElementById('filtro-producto');
    const totalVentasFiltradas = document.getElementById('total-ventas-filtradas');

    
    // --- Función para mostrar la vista correcta dentro de "Consultas" ---
    function mostrarVista(vistaAMostrar) {
        document.querySelectorAll('main > .tab-content').forEach(el => el.classList.remove('active'));
        
        if (vistaAMostrar === 'principal') {
            consultasTab.classList.add('active');
        } else if (vistaAMostrar === 'detalle-cliente') {
            consultaClientesView.classList.add('active');
        } else if (vistaAMostrar === 'detalle-productos') {
            consultaProductosView.classList.add('active');
        } else if (vistaAMostrar === 'detalle-ventas') { // <- Nuevo caso
            consultaVentasView.classList.add('active');
        }
    }


    // --- Lógica para la Consulta de Clientes ---
    if (btnOpenConsultaClientes) {
        btnOpenConsultaClientes.addEventListener('click', async () => {
            mostrarVista('detalle-cliente');
            clienteDetalleInfo.classList.add('hidden');
            try {
                selectConsultaCliente.innerHTML = '<option value="">-- Cargando clientes... --</option>';
                const res = await fetch(`${API_BASE_URL}/clientes`);
                if (!res.ok) throw new Error('No se pudo cargar la lista de clientes');
                const clientes = await res.json();
                
                selectConsultaCliente.innerHTML = '<option value="">-- Selecciona un cliente --</option>';
                clientes.forEach(cliente => {
                    const option = document.createElement('option');
                    option.value = cliente.cliente_id;
                    option.textContent = cliente.nombre;
                    selectConsultaCliente.appendChild(option);
                });
            } catch (err) {
                console.error(err);
                selectConsultaCliente.innerHTML = '<option value="">Error al cargar clientes</option>';
            }
        });
    }

    // Renderizar historial de ventas de un cliente
    function renderizarHistorialVentas(ventas) {
        tablaVentasBody.innerHTML = '';
        if (!ventas || ventas.length === 0) {
            tablaVentasBody.innerHTML = '<tr><td colspan="5">No hay ventas registradas.</td></tr>';
            return;
        }
        ventas.forEach(venta => {
            const row = `<tr>
                <td>${new Date(venta.fecha_venta).toLocaleDateString()}</td>
                <td>${venta.nombre_producto}</td>
                <td>${venta.cantidad}</td>
                <td>$${Number(venta.precio_unitario).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>$${Number(venta.subtotal).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            </tr>`;
            tablaVentasBody.innerHTML += row;
        });
    }

    // Renderizar historial de abonos de un cliente
    function renderizarHistorialAbonos(abonos) {
        tablaAbonosBody.innerHTML = '';
        if (!abonos || abonos.length === 0) {
            tablaAbonosBody.innerHTML = '<tr><td colspan="2">No hay abonos registrados.</td></tr>';
            return;
        }
        abonos.forEach(abono => {
            const row = `<tr>
                <td>${new Date(abono.fecha_abono).toLocaleDateString()}</td>
                <td>$${Number(abono.monto_abono).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            </tr>`;
            tablaAbonosBody.innerHTML += row;
        });
    }

    selectConsultaCliente.addEventListener('change', async (e) => {
        const clienteId = e.target.value;
        if (!clienteId) {
            clienteDetalleInfo.classList.add('hidden');
            return;
        }
        try {
            const [detallesRes, ventasRes, abonosRes] = await Promise.all([
                fetch(`${API_BASE_URL}/clientes/${clienteId}/detalles`),
                fetch(`${API_BASE_URL}/ventas/cliente/${clienteId}`),
                fetch(`${API_BASE_URL}/abonos/cliente/${clienteId}`)
            ]);

            if (!detallesRes.ok) throw new Error('No se pudo obtener la información del cliente.');
            
            const detalles = await detallesRes.json();
            const historialVentas = await ventasRes.json();
            const historialAbonos = await abonosRes.json();

            document.getElementById('detalle-nombre').textContent = detalles.nombre || 'N/A';
            document.getElementById('detalle-telefono').textContent = detalles.telefono || 'N/A';
            document.getElementById('detalle-domicilio').textContent = detalles.domicilio || 'N/A';
            document.getElementById('detalle-comprado').textContent = `$${Number(detalles.totalComprado || 0).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            document.getElementById('detalle-abonado').textContent = `$${Number(detalles.totalAbonado || 0).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            const saldo = Number(detalles.saldoDeudor || 0);
            const totalComprado = Number(detalles.totalComprado || 0);
            const totalAbonado = Number(detalles.totalAbonado || 0);
            const saldoCard = document.getElementById('saldo-card');
            const saldoTitulo = document.getElementById('detalle-saldo-titulo');
            const saldoValue = document.getElementById('detalle-saldo');
            saldoValue.textContent = `$${Math.abs(saldo).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            if (totalAbonado > totalComprado) {
                saldoCard.classList.remove('saldo-deudor');
                saldoCard.classList.add('saldo-favor');
                saldoTitulo.textContent = 'Saldo a Favor';
            } else {
                saldoCard.classList.remove('saldo-favor');
                saldoCard.classList.add('saldo-deudor');
                saldoTitulo.textContent = 'Saldo Deudor';
            }

            // Mostrar gráfica de ventas vs abonos
            const ctxGrafica = document.getElementById('grafica-ventas-abonos').getContext('2d');
            if (window.graficaVentasAbonosInstance) {
                window.graficaVentasAbonosInstance.destroy();
            }
            window.graficaVentasAbonosInstance = new Chart(ctxGrafica, {
                type: 'bar',
                data: {
                    labels: ['Ventas', 'Abonos'],
                    datasets: [{
                        label: 'Montos',
                        data: [Number(detalles.totalComprado || 0), Number(detalles.totalAbonado || 0)],
                        backgroundColor: ['#F39F9F', '#2ecc71'],
                        borderRadius: 8,
                        borderWidth: 1
                    }]
                },
                options: {
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { grid: { display: false } },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => '$' + Number(value).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})
                            }
                        }
                    }
                }
            });

            renderizarHistorialVentas(historialVentas);
            renderizarHistorialAbonos(historialAbonos);

            clienteDetalleInfo.classList.remove('hidden');
        } catch (err) {
            alert(err.message);
            clienteDetalleInfo.classList.add('hidden');
        }
    });

    btnVolverConsultas.addEventListener('click', () => {
        mostrarVista('principal');
    });


    // --- Renderizar la tabla de productos ---
    function renderizarTablaProductos(productos) {
        tablaConsultaProductosBody.innerHTML = '';
        if (!productos || productos.length === 0) {
            tablaConsultaProductosBody.innerHTML = '<tr><td colspan="6">No se encontraron productos con los filtros aplicados.</td></tr>';
            return;
        }
        productos.forEach(p => {
            const subtotal = (p.unidades_disponibles * p.precio_compra) || 0;
            const row = `
                <tr>
                    <td>${p.nombre_producto}</td>
                    <td>${p.nombre_categoria || 'N/A'}</td>
                    <td>${p.unidades_disponibles}</td>
                    <td>$${Number(p.precio_compra).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td>$${Number(subtotal).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td>${p.codigo_barras || 'N/A'}</td>
                </tr>
            `;
            tablaConsultaProductosBody.innerHTML += row;
        });
        // Volver a cargar los iconos por si se añadieron nuevos
        lucide.createIcons(); 
    }

    // --- Aplicar filtros y ordenamiento ---
    function aplicarFiltrosYOrdenar() {
        let productosFiltrados = [...todosLosProductos];
        const categoriaId = filtroCategoriaSelect.value;

        // 1. Aplicar filtro de categoría
        if (categoriaId) {
            productosFiltrados = productosFiltrados.filter(p => p.categoria_id == categoriaId);
        }

        // 2. Aplicar ordenamiento
        if (estadoOrdenamiento.columna) {
            productosFiltrados.sort((a, b) => {
                let valA, valB;
                if (estadoOrdenamiento.columna === 'subtotal') {
                    valA = a.unidades_disponibles * a.precio_compra;
                    valB = b.unidades_disponibles * b.precio_compra;
                } else if (estadoOrdenamiento.columna === 'categoria') {
                    valA = a.nombre_categoria || '';
                    valB = b.nombre_categoria || '';
                }
                
                if (valA < valB) return estadoOrdenamiento.direccion === 'asc' ? -1 : 1;
                if (valA > valB) return estadoOrdenamiento.direccion === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        renderizarTablaProductos(productosFiltrados);
    }


    // --- Abrir la vista de Consulta de Productos ---
    if (btnOpenConsultaProductos) {
        btnOpenConsultaProductos.addEventListener('click', async () => {
            mostrarVista('detalle-productos');
            tablaConsultaProductosBody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';
            
            try {
                const [productosRes, categoriasRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/productos`),
                    fetch(`${API_BASE_URL}/categorias`)
                ]);
                if (!productosRes.ok || !categoriasRes.ok) throw new Error('No se pudo cargar la información inicial');

                todosLosProductos = await productosRes.json();
                const categorias = await categoriasRes.json();

                // Poblar filtro de categorías
                filtroCategoriaSelect.innerHTML = '<option value="">Todas las categorías</option>';
                categorias.forEach(cat => {
                    filtroCategoriaSelect.innerHTML += `<option value="${cat.categoria_id}">${cat.nombre_categoria}</option>`;
                });

                // Renderizar la tabla inicial
                aplicarFiltrosYOrdenar();

            } catch (err) {
                console.error(err);
                tablaConsultaProductosBody.innerHTML = `<tr><td colspan="6">${err.message}</td></tr>`;
            }
        });
    }

    // --- Event Listeners para filtros y ordenamiento ---

    // Al cambiar el filtro de categoría
    filtroCategoriaSelect.addEventListener('change', aplicarFiltrosYOrdenar);

    // Al hacer clic en un encabezado para ordenar
    document.querySelector('#tabla-consulta-productos thead').addEventListener('click', (e) => {
        const th = e.target.closest('th');
        if (!th || !th.classList.contains('sortable')) return;

        const columna = th.dataset.sort;
        if (estadoOrdenamiento.columna === columna) {
            // Si ya se está ordenando por esta columna, invertir la dirección
            estadoOrdenamiento.direccion = estadoOrdenamiento.direccion === 'asc' ? 'desc' : 'asc';
        } else {
            // Si es una nueva columna, establecerla y ordenar ascendentemente
            estadoOrdenamiento.columna = columna;
            estadoOrdenamiento.direccion = 'asc';
        }

        // Actualizar clases CSS para feedback visual
        document.querySelectorAll('#tabla-consulta-productos .sortable').forEach(header => {
            header.classList.remove('asc', 'desc');
        });
        th.classList.add(estadoOrdenamiento.direccion);

        aplicarFiltrosYOrdenar();
    });


    // Lógica para el botón de "Volver"
    if (btnVolverDesdeProductos) {
        btnVolverDesdeProductos.addEventListener('click', () => {
            mostrarVista('principal');
        });
    }
  
    
    //Logica para la consulta de ventas
    // Poblar un selector
    async function poblarSelectorFiltro(selectElement, endpoint, valueKey, textKey) {
        try {
            const res = await fetch(`${API_BASE_URL}/${endpoint}`);
            const data = await res.json();
            selectElement.innerHTML = `<option value="">Todos</option>`;
            data.forEach(item => {
                selectElement.innerHTML += `<option value="${item[valueKey]}">${item[textKey]}</option>`;
            });
        } catch (err) {
            console.error(`Error al poblar ${endpoint}:`, err);
        }
    }

    // Función principal para buscar y mostrar ventas filtradas
    async function buscarYRenderizarVentas() {
        const params = new URLSearchParams();
        if (filtroFechaInicio.value) params.append('fechaInicio', filtroFechaInicio.value);
        if (filtroFechaFin.value) params.append('fechaFin', filtroFechaFin.value);
        if (filtroCliente.value) params.append('clienteId', filtroCliente.value);
        if (filtroProducto.value) params.append('productoId', filtroProducto.value);

        tablaConsultaVentasBody.innerHTML = '<tr><td colspan="6">Buscando...</td></tr>';
        
        try {
            const res = await fetch(`${API_BASE_URL}/ventas/filtrar?${params.toString()}`);
            const ventas = await res.json();

            tablaConsultaVentasBody.innerHTML = '';
            let total = 0;

            if (ventas.length === 0) {
                tablaConsultaVentasBody.innerHTML = '<tr><td colspan="6">No se encontraron ventas con los filtros aplicados.</td></tr>';
            } else {
                ventas.forEach(v => {
                    const subtotal = parseFloat(v.subtotal);
                    total += subtotal;
                    const row = `
                        <tr>
                            <td>${new Date(v.fecha_venta).toLocaleDateString()}</td>
                            <td>${v.cliente}</td>
                            <td>${v.nombre_producto}</td>
                            <td>${v.cantidad}</td>
                            <td>$${parseFloat(v.precio_unitario).toFixed(2)}</td>
                            <td>$${subtotal.toFixed(2)}</td>
                        </tr>
                    `;
                    tablaConsultaVentasBody.innerHTML += row;
                });
            }
            totalVentasFiltradas.textContent = `$${total.toFixed(2)}`;
        } catch (err) {
            console.error(err);
            tablaConsultaVentasBody.innerHTML = '<tr><td colspan="6">Error al cargar las ventas.</td></tr>';
        }
    }

    // Abrir la vista de consulta de ventas
    if (btnOpenConsultaVentas) {
        btnOpenConsultaVentas.addEventListener('click', () => {
            mostrarVista('detalle-ventas'); // Nuevo estado para la función mostrarVista
            poblarSelectorFiltro(filtroCliente, 'clientes', 'cliente_id', 'nombre');
            poblarSelectorFiltro(filtroProducto, 'productos', 'producto_id', 'nombre_producto');
            // Realiza una búsqueda inicial sin filtros
            buscarYRenderizarVentas();
        });
    }

    // Listeners para los filtros
    filtroFechaInicio.addEventListener('change', buscarYRenderizarVentas);
    filtroFechaFin.addEventListener('change', buscarYRenderizarVentas);
    filtroCliente.addEventListener('change', buscarYRenderizarVentas);
    filtroProducto.addEventListener('change', buscarYRenderizarVentas);

    // Botón para volver
    if (btnVolverDesdeVentas) {
        btnVolverDesdeVentas.addEventListener('click', () => {
            mostrarVista('principal');
        });
    }


    // =================================================================
    // LÓGICA PARA LA PESTAÑA "REPORTES"
    // =================================================================

    const reportesTab = document.getElementById('reportes');
    const btnRefreshReportes = document.getElementById('refresh-reportes');
    const monthFilter = document.getElementById('reportes-month-filter');

    // Función principal para actualizar todos los datos de la pestaña de reportes
    function actualizarReportesCompletos() {
        const mesSeleccionado = monthFilter.value;
        if (!mesSeleccionado) {
            alert("Por favor, selecciona un mes.");
            return;
        }
        fetchAndRenderKPIs(mesSeleccionado);
        fetchAndRenderCharts(mesSeleccionado);
        fetchAndRenderAnalisis(mesSeleccionado);
    }

    // Inicializar el filtro con el mes y año actual
    function setInitialMonth() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        monthFilter.value = `${year}-${month}`;
    }

    async function fetchAndRenderKPIs(mes) {
        // Poner textos de "cargando" para dar feedback al usuario
    document.getElementById("kpi-total-invertido").textContent = "Cargando...";
    document.getElementById("kpi-total-ventas").textContent = "Cargando...";
    document.getElementById("kpi-categoria-estrella").textContent = "Cargando...";
    document.getElementById("kpi-producto-rentable").textContent = "Cargando...";

        try {
            const res = await fetch(`${API_BASE_URL}/reportes/kpis?mes=${mes}`);
            if (!res.ok) throw new Error('Error al obtener los reportes');
            const data = await res.json();

            // Actualizar las tarjetas con los datos recibidos
            document.getElementById("kpi-total-invertido").textContent = "$" + Number(data.totalInvertido || 0).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            document.getElementById("kpi-total-ventas").textContent = "$" + Number(data.totalVentas || 0).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            document.getElementById("kpi-categoria-estrella").textContent = data.categoriaMasVendida || 'N/A';
            document.getElementById("kpi-producto-rentable").textContent = data.productoMayorMargen || 'N/A';

        } catch (err) {
            console.error("Error fetching KPIs:", err);
            alert("No se pudieron cargar los reportes.");
        }
    }

    // Cargar los reportes la primera vez que se hace clic en la pestaña
    const reportesTabBtn = document.querySelector('.tab-btn[data-tab="reportes"]');
    if (reportesTabBtn) {
        reportesTabBtn.addEventListener('click', () => {
            setTimeout(() => {
                if (reportesTab && reportesTab.classList.contains('active')) {
                    setInitialMonth(); // Pone el mes actual al abrir la pestaña
                    actualizarReportesCompletos();
                }
            }, 50);
        });
    }

    // Variables para guardar las instancias de las gráficas y poder actualizarlas
    let ventasChartInstance = null;
    let inversionChartInstance = null;
    let ventasVsInversionChartInstance = null;

    async function fetchAndRenderCharts(mes) {
        try {
            const res = await fetch(`${API_BASE_URL}/reportes/graficas?mes=${mes}`);
            if (!res.ok) throw new Error('Error al obtener datos para las gráficas');
            const data = await res.json();

            // Preparar los datos para Chart.js
            const labels = data.map(item => item.categoria); // Nombres de las categorías
            const ventasData = data.map(item => parseFloat(item.totalVentas || 0));
            const inversionData = data.map(item => parseFloat(item.totalInversion || 0));

            // --- Gráfica 1: Ventas por Categoría ---
            const ctxVentas = document.getElementById('ventasPorCategoriaChart').getContext('2d');
            if (ventasChartInstance) {
                ventasChartInstance.destroy(); // Destruir gráfica anterior si existe
            }
            ventasChartInstance = new Chart(ctxVentas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Total de Ventas',
                        data: ventasData,
                        backgroundColor: 'rgba(52, 152, 219, 0.6)',
                        borderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) { return '$' + value; }
                            }
                        }
                    }
                }
            });

            // --- Gráfica 2: Inversión por Categoría ---
            const ctxInversion = document.getElementById('inversionPorCategoriaChart').getContext('2d');
            if (inversionChartInstance) {
                inversionChartInstance.destroy();
            }
            inversionChartInstance = new Chart(ctxInversion, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Inversión en Inventario',
                        data: inversionData,
                        backgroundColor: 'rgba(44, 62, 80, 0.6)',
                        borderColor: 'rgba(44, 62, 80, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) { return '$' + value; }
                            }
                        }
                    }
                }
            });

            // --- GRÁFICA 3: Ventas vs. Inversión ---
            const ctxVentasVsInversion = document.getElementById('ventasVsInversionChart').getContext('2d');
            if(ventasVsInversionChartInstance) ventasVsInversionChartInstance.destroy();
            ventasVsInversionChartInstance = new Chart(ctxVentasVsInversion, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Total de Ventas',
                            data: ventasData,
                            backgroundColor: 'rgba(52, 152, 219, 0.7)',
                            borderColor: 'rgba(52, 152, 219, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Inversión en Inventario',
                            data: inversionData,
                            backgroundColor: 'rgba(231, 76, 60, 0.7)',
                            borderColor: 'rgba(231, 76, 60, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });

        } catch (err) {
            console.error("Error fetching chart data:", err);
        }
    }

    // --- Lógica para los botones de las gráficas ---
    const chartControlButtons = document.querySelectorAll('.chart-btn');
    const chartWrappers = document.querySelectorAll('.chart-wrapper');

    chartControlButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Solo cambiamos el color de "activo", no ocultamos los demás
            chartControlButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Mostrar solo la gráfica correspondiente
            chartWrappers.forEach(wrapper => wrapper.classList.remove('active'));
            const chartIdToShow = button.dataset.chart + '-wrapper';
            const wrapperToShow = document.getElementById(chartIdToShow);
            if (wrapperToShow) {
                wrapperToShow.classList.add('active');
            }
        });
    });



    // Función para poblar una lista de análisis con formato detallado
    function poblarListaAnalisis(ulId, data, mensajeVacio, formateador) {
        const ul = document.getElementById(ulId);
        ul.innerHTML = '';
        if (data && data.length > 0) {
            data.forEach(item => {
                const li = document.createElement('li');
                // La función 'formateador' crea el HTML interno del <li>
                li.innerHTML = formateador(item);
                ul.appendChild(li);
            });
        } else {
            ul.innerHTML = `<li>${mensajeVacio}</li>`;
        }
    }

    // Función principal para buscar y mostrar el análisis
    async function fetchAndRenderAnalisis(mes) {
        try {
            const res = await fetch(`${API_BASE_URL}/reportes/analisis-rapido?mes=${mes}`);
            if (!res.ok) throw new Error('No se pudo cargar el análisis rápido');
            const data = await res.json();

            // Usamos funciones 'formateador' para cada tipo de dato
            poblarListaAnalisis('analisis-categorias-riesgo', data.categoriasEnRiesgo, 'Ninguna', item => {
                if (window.innerWidth <= 700) {
                    return `${item.categoria} <span class="detalle-analisis">(V: $${Number(item.totalVentas).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})} < I: $${Number(item.totalInversion).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>`;
                } else {
                    return `${item.categoria} <span class="detalle-analisis">(Venta: $${Number(item.totalVentas).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})} vs Inversión: $${Number(item.totalInversion).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>`;
                }
            });
            poblarListaAnalisis('analisis-productos-bajos', data.productosBajasVentas, 'Ninguno', item => 
                `${item.nombre_producto} <span class="detalle-analisis">(${item.numero_ventas} ventas)</span>`
            );
            poblarListaAnalisis('analisis-productos-top', data.productosTop, 'Sin datos', item => 
                `${item.nombre_producto} <span class="detalle-analisis">($${Number(item.totalVendido).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})} vendidos)</span>`
            );
            poblarListaAnalisis('analisis-clientes-adeudo', data.clientesConAdeudo, 'Ninguno', item => 
                `${item.nombre} <span class="detalle-analisis">(Debe: $${Number(item.saldo).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>`
            );

        } catch (err) {
            console.error("Error fetching quick analysis:", err);
        }
    }

    // Actualizar al cambiar el mes en el selector
    if (monthFilter) {
        monthFilter.addEventListener('change', actualizarReportesCompletos);
    }

    // Actualizar con el botón de refrescar
    if (btnRefreshReportes) {
        btnRefreshReportes.addEventListener('click', actualizarReportesCompletos);
    }


    // =================================================================
    // LÓGICA PARA LA PESTAÑA "MODIFICAR"
    // =================================================================

    // --- Modificar Cliente ---
    const openBtnModifyCliente = document.getElementById("openModifyCliente");
    const modalModifyCliente = document.getElementById("modalModificarCliente");
    const formModifyCliente = document.getElementById("formModificarCliente");
    const selectModifyCliente = document.getElementById("selectModificarCliente");
    const camposModifyCliente = document.getElementById("camposModificarCliente");

    if (openBtnModifyCliente) {
        openBtnModifyCliente.addEventListener("click", async () => {
            // Llenar el selector de clientes
            selectModifyCliente.innerHTML = '<option value="">-- Cargando clientes... --</option>';
            camposModifyCliente.classList.add('hidden'); // Ocultar campos mientras carga
            formModifyCliente.reset(); // Limpiar formulario anterior

            try {
                const res = await fetch(`${API_BASE_URL}/clientes`);
                const clientes = await res.json();
                selectModifyCliente.innerHTML = '<option value="">-- Selecciona un cliente --</option>';
                clientes.forEach(cliente => {
                    const option = document.createElement("option");
                    option.value = cliente.cliente_id;
                    option.textContent = cliente.nombre;
                    selectModifyCliente.appendChild(option);
                });
            } catch (err) {
                console.error(err);
                selectModifyCliente.innerHTML = '<option value="">Error al cargar</option>';
            }
            
            modalModifyCliente.classList.remove('hidden');
        });
    }

    // Cuando se selecciona un cliente del dropdown, llenar el formulario
    if (selectModifyCliente) {
        selectModifyCliente.addEventListener('change', async (e) => {
            const clienteId = e.target.value;
            if (!clienteId) {
                camposModifyCliente.classList.add('hidden');
                return;
            }
            
            try {
                // Pedir los datos completos del cliente seleccionado
                const res = await fetch(`${API_BASE_URL}/clientes/${clienteId}`);
                const cliente = await res.json();
                
                // Llenar los campos del formulario con los datos
                formModifyCliente.querySelector('input[name="nombre"]').value = cliente.nombre;
                formModifyCliente.querySelector('input[name="telefono"]').value = cliente.telefono || '';
                formModifyCliente.querySelector('input[name="domicilio"]').value = cliente.domicilio || '';
                
                // Mostrar los campos
                camposModifyCliente.classList.remove('hidden');
            } catch (err) {
                console.error('Error al obtener datos del cliente:', err);
                camposModifyCliente.classList.add('hidden');
            }
        });
    }

    // Al enviar el formulario de modificación
    if (formModifyCliente) {
        formModifyCliente.addEventListener('submit', async (e) => {
            e.preventDefault();
            const clienteId = selectModifyCliente.value;
            if (!clienteId) {
                alert("Primero debes seleccionar un cliente.");
                return;
            }

            const formData = new FormData(formModifyCliente);
            const data = Object.fromEntries(formData.entries());
            delete data.cliente_id; // No necesitamos enviar el id en el cuerpo

            try {
                const res = await fetch(`${API_BASE_URL}/clientes/modificar/${clienteId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await res.json();
                if (!res.ok) throw new Error(result.error);

                alert('✅ Cliente actualizado con éxito.');
                modalModifyCliente.classList.add("hidden");
                fetchSummary(); // Actualizar los datos del resumen
                
            } catch (err) {
                alert(`❌ Error: ${err.message}`);
            }
        });
    }


    // --- Modificar abono ---
    const openBtnModifyAbono = document.getElementById("openModifyAbono");
    const modalModifyAbono = document.getElementById("modalModificarAbono");
    const formModifyAbono = document.getElementById("formModificarAbono");
    const selectModifyAbono = document.getElementById("selectModificarAbono");
    const camposModifyAbono = document.getElementById("camposModificarAbono");

    // 1. Abrir el modal y cargar los abonos
    if (openBtnModifyAbono) {
        openBtnModifyAbono.addEventListener("click", async () => {
            modalModifyAbono.classList.remove("hidden");
            camposModifyAbono.classList.add('hidden'); // Ocultar campos
            formModifyAbono.reset(); // Limpiar formulario

            // Cargar abonos en el select
            selectModifyAbono.innerHTML = '<option value="">-- Cargando abonos... --</option>';
            try {
                const res = await fetch(`${API_BASE_URL}/abonos`);
                if (!res.ok) throw new Error('No se pudo cargar la lista de abonos');
                const abonos = await res.json();

                selectModifyAbono.innerHTML = '<option value="">-- Selecciona un abono --</option>';
                abonos.forEach(abono => {
                    const option = document.createElement("option");
                    option.value = abono.abono_id;
                    // Guardamos los datos del abono en el 'dataset' del option
                    option.dataset.fecha = abono.fecha_abono.split('T')[0];
                    option.dataset.monto = abono.monto_abono;
                    option.textContent = `${abono.cliente} - $${abono.monto_abono} - ${new Date(abono.fecha_abono).toLocaleDateString()}`;
                    selectModifyAbono.appendChild(option);
                });
            } catch (err) {
                console.error(err);
                selectModifyAbono.innerHTML = `<option value="">${err.message}</option>`;
            }
        });
    }

    // 2. Cuando se selecciona un abono, mostrar sus datos
    if (selectModifyAbono) {
        selectModifyAbono.addEventListener('change', (e) => {
            const selectedOption = e.target.selectedOptions[0];
            if (!selectedOption.value) {
                camposModifyAbono.classList.add('hidden');
                return;
            }
            
            // Rellenar el formulario con los datos del 'dataset'
            formModifyAbono.querySelector('input[name="fecha_abono"]').value = selectedOption.dataset.fecha;
            formModifyAbono.querySelector('input[name="monto_abono"]').value = selectedOption.dataset.monto;

            // Mostrar los campos del formulario
            camposModifyAbono.classList.remove('hidden');
        });
    }

    // 3. Al enviar el formulario, guardar los cambios
    if (formModifyAbono) {
        formModifyAbono.addEventListener('submit', async (e) => {
            e.preventDefault();
            const abonoId = selectModifyAbono.value;
            if (!abonoId) {
                alert("Por favor, selecciona un abono para modificar.");
                return;
            }

            const formData = new FormData(formModifyAbono);
            const data = {
                fecha_abono: formData.get('fecha_abono'),
                monto_abono: parseFloat(formData.get('monto_abono'))
            };

            try {
                const res = await fetch(`${API_BASE_URL}/abonos/modificar/${abonoId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Error desconocido del servidor');

                alert('✅ Abono actualizado con éxito.');
                modalModifyAbono.classList.add("hidden");
                fetchSummary(); // Actualizar el resumen financiero
                
            } catch (err) {
                alert(`❌ Error al modificar el abono: ${err.message}`);
            }
        });
    }



    // --- Modificar Producto ---
    const modalModificarProducto = document.getElementById("modalModificarProducto");
    const formModificarProducto = document.getElementById("formModificarProducto");
    const selectModificarProducto = document.getElementById("selectModificarProducto");
    const camposModificarProducto = document.getElementById("camposModificarProducto");
    const selectCategoriaModificar = document.getElementById("selectCategoriaModificar");
    const btnOpenModificarProducto = document.getElementById("openModifyProducto");

    // Abrir modal
    if (btnOpenModificarProducto) {
        btnOpenModificarProducto.addEventListener("click", () => {
        modalModificarProducto.classList.remove("hidden");
        cargarProductosModificar();
        cargarCategoriasModificar();
        });
    }

    // Cargar productos desde API
    async function cargarProductosModificar() {
        try {
        const res = await fetch("http://localhost:4000/api/productos");
        const productos = await res.json();

        selectModificarProducto.innerHTML = `<option value="">-- Seleccionar producto --</option>`;
        productos.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.producto_id;
            opt.textContent = `${p.nombre_producto} (${p.nombre_categoria || 'Sin categoría'})`;
            opt.dataset.producto = JSON.stringify(p);
            selectModificarProducto.appendChild(opt);
        });
        } catch (err) {
        console.error("Error al cargar productos:", err);
        }
    }

    // Cargar categorías desde API
    async function cargarCategoriasModificar() {
        try {
        const res = await fetch("http://localhost:4000/api/categorias");
        const categorias = await res.json();

        selectCategoriaModificar.innerHTML = `<option value="">-- Seleccionar categoría --</option>`;
        categorias.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat.categoria_id;
            opt.textContent = cat.nombre_categoria;
            selectCategoriaModificar.appendChild(opt);
        });
        } catch (err) {
        console.error("Error al cargar categorías:", err);
        }
    }

    // Mostrar campos al seleccionar producto
    selectModificarProducto.addEventListener("change", (e) => {
        const selectedOption = e.target.selectedOptions[0];
        if (!selectedOption.value) {
        camposModificarProducto.classList.add("hidden");
        return;
        }

        const producto = JSON.parse(selectedOption.dataset.producto);
        camposModificarProducto.classList.remove("hidden");

        formModificarProducto.nombre_producto.value = producto.nombre_producto;
        formModificarProducto.codigo_barras.value = producto.codigo_barras || "";
        formModificarProducto.precio_compra.value = producto.precio_compra;
        formModificarProducto.unidades_disponibles.value = producto.unidades_disponibles;
        formModificarProducto.categoria_id.value = producto.categoria_id || "";
    });

    // Guardar cambios en la API
    formModificarProducto.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(formModificarProducto);
        const data = Object.fromEntries(formData.entries());

        data.precio_compra = parseFloat(data.precio_compra);
        data.unidades_disponibles = parseInt(data.unidades_disponibles);

        try {
        const res = await fetch(`http://localhost:4000/api/productos/${data.producto_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await res.json();
        if (res.ok && result.success) {
            alert("✅ Producto modificado correctamente");
            modalModificarProducto.classList.add("hidden");
            formModificarProducto.reset();
            camposModificarProducto.classList.add("hidden");
        } else {
            alert("⚠️ Error: " + (result.error || "No se pudo modificar"));
        }
        } catch (err) {
        console.error("Error al modificar producto:", err);
        alert("❌ Error en el servidor");
        }
    });


    // --- Modificar Ventas ---
    const modalModificarVenta = document.getElementById("modalModificarVenta");
    const formModificarVenta = document.getElementById("formModificarVenta");
    const selectModificarVenta = document.getElementById("selectModificarVenta");
    const camposModificarVenta = document.getElementById("camposModificarVenta");
    const selectProductoModificarVenta = document.getElementById("selectProductoModificarVenta");
    const selectClienteModificarVenta = document.getElementById("selectClienteModificarVenta");
    const btnOpenModificarVenta = document.getElementById("openModifyVenta");

    // Abrir modal
    if (btnOpenModificarVenta) {
        btnOpenModificarVenta.addEventListener("click", async () => {
            modalModificarVenta.classList.remove("hidden");

            // Primero cargar productos y clientes
            await cargarProductos();
            await cargarClientes();

            // Luego cargar ventas
            await cargarVentas();
        });
    }

    // Cargar ventas
    async function cargarVentas() {
        try {
            const res = await fetch("http://localhost:4000/api/ventas");
            const ventas = await res.json();

            selectModificarVenta.innerHTML = `<option value="">-- Seleccionar venta --</option>`;
            ventas.forEach(v => {
                const opt = document.createElement("option");
                opt.value = v.venta_id;
                opt.textContent = `${v.cliente} - ${v.nombre_producto} (${v.cantidad})`;
                // Guardamos solo los datos necesarios
                opt.dataset.venta = JSON.stringify({
                    venta_id: v.venta_id,
                    nombre_producto: v.nombre_producto,
                    cliente_id: v.cliente_id,
                    fecha_venta: v.fecha_venta,
                    cantidad: v.cantidad,
                    precio_unitario: v.precio_unitario
                });
                selectModificarVenta.appendChild(opt);
            });
        } catch (err) {
            console.error("Error al cargar ventas:", err);
        }
    }

    // Cargar productos
    async function cargarProductos() {
        try {
            const res = await fetch("http://localhost:4000/api/productos");
            const productos = await res.json();

            selectProductoModificarVenta.innerHTML = `<option value="">-- Seleccionar producto --</option>`;
            productos.forEach(p => {
                const opt = document.createElement("option");
                // Corrección: Usar producto_id como el valor
                opt.value = p.producto_id; 
                opt.textContent = p.nombre_producto;
                selectProductoModificarVenta.appendChild(opt);
            });
        } catch (err) {
            console.error("Error al cargar productos:", err);
        }
    }

    // Cargar clientes
    async function cargarClientes() {
        try {
            const res = await fetch("http://localhost:4000/api/clientes");
            const clientes = await res.json();

            selectClienteModificarVenta.innerHTML = `<option value="">-- Seleccionar cliente --</option>`;
            clientes.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.cliente_id;
                opt.textContent = c.nombre;
                selectClienteModificarVenta.appendChild(opt);
            });
        } catch (err) {
            console.error("Error al cargar clientes:", err);
        }
    }

    // Mostrar campos al seleccionar venta
    selectModificarVenta.addEventListener("change", (e) => {
        const selectedOption = e.target.selectedOptions[0];
        if (!selectedOption || !selectedOption.value) {
            camposModificarVenta.classList.add("hidden");
            return;
        }

        const venta = JSON.parse(selectedOption.dataset.venta);
        camposModificarVenta.classList.remove("hidden");

        // Corrección: Asignar valores a los campos del formulario
        formModificarVenta.producto_id.value = venta.producto_id || "";
        formModificarVenta.cliente_id.value = venta.cliente_id || "";
        formModificarVenta.fecha_venta.value = venta.fecha_venta ? venta.fecha_venta.split('T')[0] : "";
        formModificarVenta.cantidad.value = venta.cantidad || "";
        formModificarVenta.precio_unitario.value = venta.precio_unitario || "";
    });

    // Guardar cambios
    formModificarVenta.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(formModificarVenta);
        const data = Object.fromEntries(formData.entries());
        data.cantidad = parseInt(data.cantidad);
        data.precio_unitario = parseFloat(data.precio_unitario);

        try {
            const res = await fetch(`http://localhost:4000/api/ventas/${data.venta_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await res.json();

            if (res.ok && result.success) {
                alert("✅ Venta modificada correctamente");
                modalModificarVenta.classList.add("hidden");
                formModificarVenta.reset();
                camposModificarVenta.classList.add("hidden");
            } else {
                alert("⚠️ Error: " + (result.error || "No se pudo modificar"));
            }
        } catch (err) {
            console.error("Error al modificar venta:", err);
            alert("❌ Error en el servidor");
        }
    }); 
    
    
    // --- Lógica para cerrar TODOS los modales con el botón de "Cancelar" ---
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
                const form = modal.querySelector('form');
                if (form) {
                    form.reset();
                }
                const campos = modal.querySelector('[id^="campos"]');
                if (campos) {
                    campos.classList.add('hidden');
                }
            }
        });
    });






    // FAB y menú móvil
    const fabMenu = document.getElementById('fab-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileBottomSheet = document.getElementById('mobile-bottom-sheet');
    const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');

    function openMobileMenu() {
        mobileMenuOverlay.classList.remove('hidden');
        mobileBottomSheet.classList.remove('hidden');
        mobileBottomSheet.classList.add('active');
    }
    function closeMobileMenu() {
        mobileMenuOverlay.classList.add('hidden');
        mobileBottomSheet.classList.add('hidden');
        mobileBottomSheet.classList.remove('active');
    }
    fabMenu.addEventListener('click', openMobileMenu);
    mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    mobileNavBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Cambia la pestaña activa
            const tab = btn.getAttribute('data-tab');
            tabBtns.forEach(t => {
                t.classList.remove('active');
                document.getElementById(t.dataset.tab).classList.remove('active');
            });
            document.querySelector('.tab-btn[data-tab="' + tab + '"]').classList.add('active');
            document.getElementById(tab).classList.add('active');
            // Cierra el menú móvil
            closeMobileMenu();
        });
    });

    // --- Lógica para Ocultar/Mostrar el FAB Automáticamente ---
    const mainContainer = document.body; // El elemento a observar

    // Esta función revisa si hay algún pop-up visible y oculta el botón del menú
    const toggleFabVisibility = () => {
        // Si la pantalla es más ancha que 700px (escritorio), SIEMPRE oculta el botón.
        if (window.innerWidth > 700) {
            fabMenu.style.display = 'none';
            return;
        }

        // Si estamos en móvil, revisa si hay algún pop-up (modal) abierto.
        const isModalOpen = document.querySelector('.modal:not(.hidden)');
        
        // Muestra el botón solo si estamos en móvil Y no hay pop-ups abiertos.
        fabMenu.style.display = isModalOpen ? 'none' : 'flex';
    };

    // Creamos un "observador" que vigila los cambios en los pop-ups.
    const observer = new MutationObserver(() => {
        toggleFabVisibility();
    });

    // Le decimos al observador que vigile todos los pop-ups.
    const modalsToObserve = document.querySelectorAll('.modal');
    modalsToObserve.forEach(modal => {
        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['class']
        });
    });

    // Añadimos un listener para re-evaluar si se cambia el tamaño de la ventana.
    window.addEventListener('resize', toggleFabVisibility);

    // Ejecutamos la función una vez al cargar la página para el estado inicial correcto.
    toggleFabVisibility();





    // --- LÓGICA PARA RETIRAR GANANCIAS ---
    const btnRetirarGanancia = document.getElementById("btnRetirarGanancia");

    if (btnRetirarGanancia) {
        btnRetirarGanancia.addEventListener("click", async () => {
            const gananciaElement = document.getElementById("totalGananciaPorDia");
            const gananciaTexto = gananciaElement.textContent; // Formato: "$1,234.56"

            // Convertir el texto a un número
            const montoStr = gananciaTexto.replace(/[$,]/g, "");
            const monto = parseFloat(montoStr);

            if (isNaN(monto) || monto <= 0) {
                alert("No hay ganancias disponibles para retirar.");
                return;
            }

            const confirmar = confirm(`¿Estás seguro que deseas retirar la ganancia de $${monto.toFixed(2)}?`);

            if (confirmar) {
                try {
                    const res = await fetch(`${API_BASE_URL}/retiros`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ monto: monto }),
                    });

                    const result = await res.json();

                    if (!res.ok) {
                        throw new Error(result.error || 'Ocurrió un error al registrar el retiro.');
                    }

                    alert(`✅ ${result.message}`);
                    fetchSummary(); // Actualizar el resumen para reflejar el cambio

                } catch (err) {
                    console.error('Error al retirar ganancia:', err);
                    alert(`❌ Error: ${err.message}`);
                }
            }
        });
    }


     // --- LÓGICA PARA ACCIONES RÁPIDAS EN RESUMEN ---
    const actionAddVentaBtn = document.getElementById("actionAddVenta");
    const actionAddAbonoBtn = document.getElementById("actionAddAbono");
    const agregarTab = document.querySelector('.tab-btn[data-tab="agregar"]');

    if (actionAddVentaBtn) {
        actionAddVentaBtn.addEventListener('click', () => {
            if (agregarTab) agregarTab.click();
            document.getElementById("openAddVenta").click();
        });
    }

    if (actionAddAbonoBtn) {
        actionAddAbonoBtn.addEventListener('click', () => {
            if (agregarTab) agregarTab.click();
            document.getElementById("openAddAbono").click();
        });
    }

});

