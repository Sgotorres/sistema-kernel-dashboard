from flask import Flask, jsonify # Flask crea el servidor web local.
from flask_cors import CORS # Da permiso de seguridad
import psutil # Es el motor principal
import platform # Obtiene la información de la computadora
import datetime # Maneja fechas y tiempos
import logging # Controla los mensajes de la terminal
import subprocess # Permite hablar con el sistema de Windows

app = Flask(__name__)
CORS(app) 

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

# nombre real del procesador
def obtener_nombre_procesador():
    try:
        # Pide a Windows el nombre comercial exacto
        comando = subprocess.check_output(["wmic", "cpu", "get", "name"]).decode().strip().split('\n')[1]
        
        # Limpia el texto
        nombre_limpio = comando.replace("(R)", "").replace("(TM)", "").replace("CPU", "").split("@")[0].strip()
        return nombre_limpio
    except Exception:
        return platform.processor() # Plan B por si algo falla

@app.route('/api/sistema', methods=['GET'])
def obtener_datos():
    # 1. CPU y RAM
    uso_cpu = psutil.cpu_percent(interval=0.1)
    memoria = psutil.virtual_memory()
    ram_total_gb = memoria.total / (1024**3)
    
    # 2. Almacenamiento
    disco = psutil.disk_usage('C:\\')
    disco_total_gb = disco.total / (1024**3)
    
    # 3. Procesos en vivo
    procesos = []
    for proc in psutil.process_iter(['pid', 'name', 'memory_percent']):
        try:
            if proc.info['memory_percent'] is not None:
                procesos.append(proc.info)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
            
    procesos_ordenados = sorted(procesos, key=lambda p: p['memory_percent'], reverse=True)[:3]
    
    # 4. Información del Sistema
    info_so = {
        "sistema": f"{platform.system()} {platform.release()}",
        "arquitectura": platform.machine(),
        "nucleos": psutil.cpu_count(logical=False)
    }

    # 5. Uptime
    fecha_encendido = datetime.datetime.fromtimestamp(psutil.boot_time())
    tiempo_actual = datetime.datetime.now()
    diferencia = tiempo_actual - fecha_encendido
    uptime_str = str(diferencia).split('.')[0] 

    # Empaquetamos todo
    datos_sistema = {
        "cpu": uso_cpu,
        "procesador_modelo": obtener_nombre_procesador(), # <--- USAMOS LA FUNCIÓN AQUÍ
        "ram": { "porcentaje": memoria.percent, "total_gb": round(ram_total_gb, 2) },
        "disco": { "porcentaje": disco.percent, "total_gb": round(disco_total_gb, 2) },
        "procesos": procesos_ordenados,
        "info": info_so,
        "uptime": uptime_str
    }
    
    return jsonify(datos_sistema)

@app.route('/api/procesos', methods=['GET'])
def obtener_todos_procesos():
    procesos = []
    for proc in psutil.process_iter(['pid', 'name', 'memory_percent']):
        try:
            if proc.info['memory_percent'] is not None:
                procesos.append(proc.info)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
            
    # Ordenamos de mayor a menor consumo de RAM, pero esta vez los devolvemos TODOS
    procesos_ordenados = sorted(procesos, key=lambda p: p['memory_percent'], reverse=True)
    return jsonify(procesos_ordenados)

# NUEVA RUTA: MATAR PROCESOS POR PID

@app.route('/api/matar/<int:pid>', methods=['POST'])
def matar_proceso(pid):
    try:
        # /F = Force (Fuerza el cierre inmediato, no pregunta)
        # /T = Tree (Mata al proceso padre y a absolutamente todos sus hijos a la vez)
        comando = f"taskkill /F /T /PID {pid}"
        
        # Ejecutamos la orden en la consola invisible de Windows
        subprocess.run(comando, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        return jsonify({"exito": True, "mensaje": f"Árbol del proceso {pid} aniquilado con éxito."})
    
    except subprocess.CalledProcessError:
        return jsonify({"exito": False, "error": "El sistema bloqueó el cierre. Se requieren permisos de Administrador."}), 403
    except Exception as e:
        return jsonify({"exito": False, "error": str(e)}), 500

if __name__ == "__main__":
    print("Servidor del Kernel iniciado en el puerto 5000...")
    print("Entra en tu navegador a: http://localhost:5000/api/sistema")
    # debug=False para evitar que reinicie dos veces los hilos de psutil
    app.run(port=5000, debug=False)