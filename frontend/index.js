// 1. VARIABLES GLOBALES Y ESTADOS

const historialCpu = Array(60).fill(0); 
const historialRam = Array(60).fill(0);
const historialDisco = Array(60).fill(0);
const etiquetasTiempo = Array(60).fill(''); 

let graficoCpu;
let graficoRam;
let graficoDisco;
let intervaloModal; 


// 2. INICIALIZACIÓN DE GRÁFICAS (Al cargar la ventana)

window.onload = () => {
    try {
        const ctxCpu = document.getElementById('grafico-cpu').getContext('2d');
        graficoCpu = new Chart(ctxCpu, {
            type: 'line',
            data: {
                labels: etiquetasTiempo,
                datasets: [{
                    label: 'Uso de CPU (%)',
                    data: historialCpu,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa' } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { labels: { color: 'white' } } }
            }
        });
    } catch (e) {
        console.error("Error cargando gráfica CPU:", e);
    }

    try {
        const ctxRam = document.getElementById('grafico-ram').getContext('2d');
        graficoRam = new Chart(ctxRam, {
            type: 'line',
            data: {
                labels: etiquetasTiempo,
                datasets: [{
                    label: 'Uso de RAM (%)',
                    data: historialRam,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa' } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { labels: { color: 'white' } } }
            }
        });
    } catch (e) {
        console.error("Error cargando gráfica RAM:", e);
    }

    try {
        const ctxDisco = document.getElementById('grafico-disco').getContext('2d');
        graficoDisco = new Chart(ctxDisco, {
            type: 'line',
            data: {
                labels: etiquetasTiempo,
                datasets: [{
                    label: 'Uso de Disco (%)',
                    data: historialDisco,
                    borderColor: '#FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.2)',
                    borderWidth: 2,
                    fill: true, tension: 0.4, pointRadius: 0
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa' } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { labels: { color: 'white' } } }
            }
        });
    } catch (e) { console.error("Error en gráfica Disco:", e); }

    
    obtenerDatos();
    setInterval(obtenerDatos, 1000);
};


// 3. OBTENCIÓN Y ACTUALIZACIÓN DE DATOS (API)

async function obtenerDatos() {
    try {
        const respuesta = await fetch('http://localhost:5000/api/sistema');
        const datos = await respuesta.json();
        
        document.getElementById('cpu-uso').innerText = datos.cpu + '%';
        document.getElementById('cpu-modelo').innerText = datos.procesador_modelo;
        document.getElementById('ram-uso').innerText = datos.ram.porcentaje + '%';
        document.getElementById('ram-total').innerText = datos.ram.total_gb + ' GB';
        document.getElementById('disco-uso').innerText = datos.disco.porcentaje + '%';
        document.getElementById('disco-total').innerText = datos.disco.total_gb + ' GB';
        
        if (graficoCpu) {
            historialCpu.push(datos.cpu);
            historialCpu.shift();
            graficoCpu.update();
        }

        if (graficoRam) {
            historialRam.push(datos.ram.porcentaje);
            historialRam.shift();
            graficoRam.update();
        }

        if (graficoDisco) {
            historialDisco.push(datos.disco.porcentaje);
            historialDisco.shift();
            graficoDisco.update();
        }

        const listaProcesos = document.getElementById('lista-procesos');
        listaProcesos.innerHTML = ''; 
        
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

async function cargarTodosLosProcesos() {
    try {
        const respuesta = await fetch('http://localhost:5000/api/procesos');
        const procesos = await respuesta.json();
        
        const listaTodosProcesos = document.getElementById('lista-todos-procesos');
        listaTodosProcesos.innerHTML = ''; 
        
        procesos.forEach(proc => {
            const li = document.createElement('li');
            li.style.borderBottom = "1px solid rgba(255, 255, 255, 0.1)";
            li.style.padding = "10px 0";
            
            li.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <span>PID: <b style="color:white;">${proc.pid}</b> | ${proc.name} <span class="valor" style="font-size: 0.9em; margin-left: 10px;">${proc.memory_percent.toFixed(2)}%</span></span>
                    
                    <button onclick="matarProceso(${proc.pid})" style="background: rgba(110, 36, 30, 0.2); border: 1px solid #bd4138; color: #ee3a2e; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-weight: bold; transition: 0.3s;" onmouseover="this.style.background='#bd443c'; this.style.color='white';" onmouseout="this.style.background='rgba(244, 67, 54, 0.2)'; this.style.color='#f44336';">
                        Terminar
                    </button>
                </div>
            `;
            listaTodosProcesos.appendChild(li);
        });
    } catch (error) {
        console.error("Error cargando todos los procesos:", error);
        document.getElementById('lista-todos-procesos').innerHTML = '<li>Error al cargar. Verifica que el servidor Python esté encendido.</li>';
    }
}

// --- LÓGICA DE CONFIRMACIÓN PARA MATAR PROCESOS ---

let pidSeleccionado = null;r
const modalConfirmacion = document.getElementById('modal-confirmacion');
const spanConfirmPid = document.getElementById('confirm-pid');
const btnCancelarMatar = document.getElementById('btn-cancelar-matar');
const btnConfirmarMatar = document.getElementById('btn-confirmar-matar');

function matarProceso(pid) {
    pidSeleccionado = pid;
    spanConfirmPid.innerText = pid;
    modalConfirmacion.style.display = 'flex';
}

btnCancelarMatar.addEventListener('click', () => {
    modalConfirmacion.style.display = 'none'; 
    pidSeleccionado = null; 
});

btnConfirmarMatar.addEventListener('click', async () => {
    modalConfirmacion.style.display = 'none'; 
    
    if (!pidSeleccionado) return; 

    try {
        // Ejecutamos la orden al servidor Python
        const respuesta = await fetch(`http://localhost:5000/api/matar/${pidSeleccionado}`, {
            method: 'POST'
        });
        
        const resultado = await respuesta.json();

        if (resultado.exito) {
            cargarTodosLosProcesos(); 
        } else {
            alert("No se pudo cerrar: " + resultado.error);
        }
    } catch (error) {
        console.error("Error de conexión al intentar matar el proceso:", error);
        alert("Error de conexión con el núcleo del sistema.");
    }
    
    pidSeleccionado = null;
});

// 4. LÓGICA DE INTERFAZ Y MODALES (Eventos de Clic)

const modalProcesos = document.getElementById('modal-procesos');
const btnVerTodos = document.getElementById('btn-ver-todos');
const btnCerrarModalProcesos = document.getElementById('btn-cerrar-modal');

btnVerTodos.addEventListener('click', () => {
    modalProcesos.style.display = 'block';
    cargarTodosLosProcesos(); 
    intervaloModal = setInterval(cargarTodosLosProcesos, 2000); 
});

btnCerrarModalProcesos.addEventListener('click', () => {
    modalProcesos.style.display = 'none';
    clearInterval(intervaloModal); 
});


const modalCpu = document.getElementById('modal-cpu');
const tarjetaCpu = document.getElementById('tarjeta-cpu');
const btnCerrarModalCpu = document.getElementById('btn-cerrar-modal-cpu');

tarjetaCpu.addEventListener('click', () => {
    modalCpu.style.display = 'block';
});

btnCerrarModalCpu.addEventListener('click', () => {
    modalCpu.style.display = 'none';
});

tarjetaCpu.addEventListener('mouseover', () => {
    tarjetaCpu.style.transform = 'translateY(-2px)';
    tarjetaCpu.style.boxShadow = '0 8px 32px 0 rgba(76, 175, 80, 0.3)';
});
tarjetaCpu.addEventListener('mouseout', () => {
    tarjetaCpu.style.transform = 'none';
    tarjetaCpu.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
});


const modalRam = document.getElementById('modal-ram');
const tarjetaRam = document.getElementById('tarjeta-ram');
const btnCerrarModalRam = document.getElementById('btn-cerrar-modal-ram');

tarjetaRam.addEventListener('click', () => {
    modalRam.style.display = 'block';
});

btnCerrarModalRam.addEventListener('click', () => {
    modalRam.style.display = 'none';
});

tarjetaRam.addEventListener('mouseover', () => {
    tarjetaRam.style.transform = 'translateY(-2px)';
    tarjetaRam.style.boxShadow = '0 8px 32px 0 rgba(33, 150, 243, 0.3)'; // Sombra azulada
});

tarjetaRam.addEventListener('mouseout', () => {
    tarjetaRam.style.transform = 'none';
    tarjetaRam.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)'; // Vuelve a la sombra oscura original
});

const modalDisco = document.getElementById('modal-disco');
const tarjetaDisco = document.getElementById('tarjeta-disco');
const btnCerrarDisco = document.getElementById('btn-cerrar-modal-disco');

tarjetaDisco.onclick = () => modalDisco.style.display = 'block';
btnCerrarDisco.onclick = () => modalDisco.style.display = 'none';

tarjetaDisco.addEventListener('mouseover', () => {
    tarjetaDisco.style.transform = 'translateY(-2px)';
    tarjetaDisco.style.boxShadow = '0 8px 32px 0 rgba(255, 152, 0, 0.3)';
});
tarjetaDisco.addEventListener('mouseout', () => {
    tarjetaDisco.style.transform = 'none';
    tarjetaDisco.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
});