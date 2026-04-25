async function obtenerDatos() {
    try {
        const respuesta = await fetch('http://localhost:5000/api/sistema');
        const datos = await respuesta.json();
        
        // 1. Inyectamos CPU y RAM
        document.getElementById('cpu-uso').innerText = datos.cpu + '%';
        document.getElementById('ram-uso').innerText = datos.ram.porcentaje + '%';
        document.getElementById('ram-total').innerText = datos.ram.total_gb + ' GB';
        
        // 2. Inyectamos el Almacenamiento (Disco)
        document.getElementById('disco-uso').innerText = datos.disco.porcentaje + '%';
        document.getElementById('disco-total').innerText = datos.disco.total_gb + ' GB';

        // 3. Inyectamos los Procesos en vivo
        const listaProcesos = document.getElementById('lista-procesos');
        listaProcesos.innerHTML = ''; // Limpiamos la lista anterior
        
        datos.procesos.forEach(proc => {
            const li = document.createElement('li');
            li.innerHTML = `PID: <b>${proc.pid}</b> | ${proc.name} <span class="valor" style="font-size: 0.9em; float: right;">${proc.memory_percent.toFixed(2)}%</span>`;
            li.style.borderBottom = "1px solid #444";
            li.style.padding = "5px 0";
            listaProcesos.appendChild(li);
        });
        
    } catch (error) {
        console.error("Error conectando con el servidor Python:", error);
    }
}

// Hacemos que la función se repita cada 1 segundo
setInterval(obtenerDatos, 1000);
obtenerDatos();

// --- LÓGICA DEL ADMINISTRADOR DE TAREAS (MODAL) ---

const modal = document.getElementById('modal-procesos');
const btnVerTodos = document.getElementById('btn-ver-todos');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const listaTodosProcesos = document.getElementById('lista-todos-procesos');
let intervaloModal; // Para actualizar el modal en tiempo real

// Función para obtener TODOS los procesos
async function cargarTodosLosProcesos() {
    try {
        const respuesta = await fetch('http://localhost:5000/api/procesos');
        const procesos = await respuesta.json();
        
        listaTodosProcesos.innerHTML = ''; // Limpiar lista
        
        procesos.forEach(proc => {
            const li = document.createElement('li');
            li.innerHTML = `PID: <b style="color:white;">${proc.pid}</b> | ${proc.name} <span class="valor" style="font-size: 0.9em; float: right;">${proc.memory_percent.toFixed(2)}%</span>`;
            li.style.borderBottom = "1px solid #444";
            li.style.padding = "8px 0";
            listaTodosProcesos.appendChild(li);
        });
    } catch (error) {
        console.error("Error cargando todos los procesos:", error);
        listaTodosProcesos.innerHTML = '<li>Error al cargar. Verifica que el servidor Python esté encendido.</li>';
    }
}

// Abrir el modal
btnVerTodos.addEventListener('click', () => {
    modal.style.display = 'block';
    cargarTodosLosProcesos(); // Cargar inmediatamente
    // Actualizar la lista cada 2 segundos mientras esté abierto
    intervaloModal = setInterval(cargarTodosLosProcesos, 2000); 
});

// Cerrar el modal
btnCerrarModal.addEventListener('click', () => {
    modal.style.display = 'none';
    clearInterval(intervaloModal); // Detener las actualizaciones para ahorrar recursos
});