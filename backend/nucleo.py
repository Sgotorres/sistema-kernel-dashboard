from flask import Flask, jsonify
from flask_cors import CORS
import psutil
import logging # Añadimos esto

app = Flask(__name__)
CORS(app) 

# Añadimos el silenciador
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

@app.route('/api/sistema', methods=['GET'])
def obtener_datos():
    # 1. CPU y RAM
    uso_cpu = psutil.cpu_percent(interval=0.1) # Intervalo más corto para respuestas rápidas
    memoria = psutil.virtual_memory()
    ram_total_gb = memoria.total / (1024**3)
    
    # 2. Almacenamiento (Disco C)
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
    
    # Empaquetamos todo en un diccionario (JSON)
    datos_sistema = {
        "cpu": uso_cpu,
        "ram": {
            "porcentaje": memoria.percent,
            "total_gb": round(ram_total_gb, 2)
        },
        "disco": {
            "porcentaje": disco.percent,
            "total_gb": round(disco_total_gb, 2)
        },
        "procesos": procesos_ordenados
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

# ==========================================
# NUEVA RUTA: MATAR PROCESOS POR PID
# ==========================================
@app.route('/api/matar/<int:pid>', methods=['POST'])
def matar_proceso(pid):
    try:
        proceso = psutil.Process(pid)
        proceso.terminate() # Cierra el proceso de forma limpia
        return jsonify({"exito": True, "mensaje": f"Proceso {pid} terminado correctamente."})
    
    except psutil.NoSuchProcess:
        return jsonify({"exito": False, "error": "El proceso ya no existe o se cerró solo."}), 404
    except psutil.AccessDenied:
        return jsonify({"exito": False, "error": "Permiso denegado. Faltan privilegios de Administrador."}), 403
    except Exception as e:
        return jsonify({"exito": False, "error": str(e)}), 500

if __name__ == "__main__":
    print("Servidor del Kernel iniciado en el puerto 5000...")
    print("Entra en tu navegador a: http://localhost:5000/api/sistema")
    # debug=False para evitar que reinicie dos veces los hilos de psutil
    app.run(port=5000, debug=False)