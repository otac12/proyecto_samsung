from flask import Flask, render_template, request, jsonify, url_for, redirect, session, flash
from flask_mysqldb import MySQL
from MySQLdb.cursors import DictCursor
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from flask_socketio import SocketIO, emit
from flask_redis import FlaskRedis
from flask_cors import CORS
import yaml
import json
import re

app = Flask(__name__)
CORS(app)
# Configuración de Flask-SocketIO
socketio = SocketIO(app)
# Configuración de Redis
app.config['REDIS_URL'] = "redis://localhost:6379/0"
redis_client = FlaskRedis(app)

# Configuración de la clave secreta
app.secret_key = 'tu_secret_key_aleatoria'

# Configuración de la base de datos (se usa el archivo yaml)
db = yaml.safe_load(open('db.yaml'))
app.config['MYSQL_HOST'] = db['mysql_host']
app.config['MYSQL_USER'] = db['mysql_user']
app.config['MYSQL_PASSWORD'] = db['mysql_password']
app.config['MYSQL_DB'] = db['mysql_db']
mysql = MySQL(app)


#Iniciar en la página de login si esta iniciada la sesión mandar a la principal
@app.route('/')
def index():
    if 'usuario_id' in session:
        return redirect('/main')
    return render_template('login.html')

# Página principal
@app.route('/main')
def principal():
    if 'usuario_id' in session:
        # Obtener el nombre del usuario de la base de datos
        cursor = mysql.connection.cursor(cursorclass=DictCursor)
        cursor.execute("SELECT Nombre FROM usuario WHERE ID = %s", (session['usuario_id'],))
        usuario = cursor.fetchone()
        cursor.close()

        tiempo_inicio = redis_client.get(f"contador:{session['usuario_id']}")
        # Pasar el nombre del usuario a la plantilla
        return render_template('menu.html', nombre_usuario=usuario['Nombre'], tiempo_inicio=tiempo_inicio.decode('utf-8') if tiempo_inicio else None)
    return redirect('/')


@app.route('/registro')
def registro():
    return render_template('registro.html')

# Inicio de sesión
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        correo = data['correo']
        contrasena_formulario = data['contrasena']
        
        # Obtener los resultados como diccionario
        cursor = mysql.connection.cursor(cursorclass=DictCursor)
        cursor.execute("SELECT * FROM usuario WHERE Correo = %s", (correo,))
        usuario = cursor.fetchone()
        cursor.close()
        
        # Verificar la contraseña haseada e iniciar sesión
        if usuario and check_password_hash(usuario['Contrasena'], contrasena_formulario):
            session['usuario_id'] = usuario['ID']
            return jsonify({"estado": "Login exitoso", "mensaje": "Inicio de sesión exitoso","usuario": usuario['Nombre']})
        else:
            return jsonify({"estado": "Error", "mensaje": "Correo o contraseña incorrectos"}), 401
    
    return render_template('login.html')

# Reigstrar usuarios
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"estado": "Error", "mensaje": "No se proporcionaron datos"}), 400

    nombre = data.get('nombre', '')
    correo = data.get('correo', '')
    contrasena = data.get('contrasena', '')

    # Verificar el formato del correo
    regex_correo = r'^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$'
    if not re.match(regex_correo, correo):
        return jsonify({"estado": "Error", "mensaje": "Correo electrónico no válido"}), 400

    # Hasear la contraseña
    contrasena_hash = generate_password_hash(contrasena, method='pbkdf2:sha256', salt_length=8)

    try:
        # Agregar los datos a la base de datos
        cur = mysql.connection.cursor(cursorclass=DictCursor)
        cur.execute("INSERT INTO usuario (Nombre, Correo, Contrasena) VALUES (%s, %s, %s)", (nombre, correo, contrasena_hash))
        mysql.connection.commit()
        cur.close()
        return jsonify({"estado": "Registro exitoso"}), 201
    except Exception as e:
        print(e)
        return jsonify({"estado": "Error", "mensaje": str(e)}), 500   

# Cerrar sesión    
@app.route('/logout')
def logout():
    # Elimina la información del usuario de la sesión
    session.pop('usuario_id', None)

    flash('Has cerrado sesión exitosamente', 'success')
    return redirect(url_for('index'))    
        
# Enviar los lugares en donde hay estaciones
@app.route('/estaciones')
def estaciones():
    if 'usuario_id' in session:
        cursor = mysql.connection.cursor(cursorclass=DictCursor)  
        cursor.execute("SELECT Localizacion, Lugares_ocupados, Lugares_disponibles FROM estaciones")
        estaciones_raw = cursor.fetchall()
        cursor.close()
        
        estaciones = []
        for estacion in estaciones_raw:
            total_lugares = estacion['Lugares_ocupados'] + estacion['Lugares_disponibles']
            estaciones.append({
                'Localizacion': estacion['Localizacion'],
                'Lugares_ocupados': estacion['Lugares_ocupados'],
                'Lugares_disponibles': estacion['Lugares_disponibles'],
                'Total_lugares': total_lugares
            })
        
        return jsonify(estaciones)
    else:
        return jsonify({"error": "Usuario no encontrado"}), 401
    
# Guardar la tarjeta NFC en la base de datos
@app.route('/enlazar_nfc', methods=['POST'])
def enlazar_nfc():
    if 'usuario_id' in session:
        # Obtiene el número de la tarjeta NFC del cuerpo de la solicitud
        nfc_number = request.json.get('nfc_number')
        usuario_id = session['usuario_id']

        try:
            # Inserta los datos en la base de datos
            cursor = mysql.connection.cursor(cursorclass=DictCursor)
            cursor.execute("INSERT INTO metodos_pago (Metodo_pago, no_cuenta, ID) VALUES (%s, %s, %s)", 
                           ('tarjeta', nfc_number, usuario_id))
            mysql.connection.commit()
            cursor.close()
            return jsonify({"estado": "Éxito", "mensaje": "Tarjeta NFC enlazada con éxito"})
        except Exception as e:
            return jsonify({"estado": "Error", "mensaje": str(e)}), 500
    else:
        return jsonify({"estado": "Error", "mensaje": "Usuario no autenticado"}), 401
    
# Obtener el vehiculo
@app.route('/seleccionar_vehiculo', methods=['POST'])
def seleccionar_vehiculo():
    if 'usuario_id' in session:
        data = request.get_json()
        session['vehiculo_seleccionado'] = data['vehiculo']
        return jsonify({"mensaje": "Vehículo seleccionado guardado"})
    else:
        return jsonify({"error": "Usuario no autenticado"}), 401
 
API_TOKEN = '123'   
# Obtener la tarjeta del servidor
@app.route('/recibir_tarjeta', methods=['POST'])
def recibir_tarjeta():
    token = request.headers.get('Authorization')
    print("El numero autentificador es: %s" % token)
    
    if token != API_TOKEN:
        print("Autenticación fallida")
        return jsonify({"estado": "Error", "mensaje": "Autenticación fallida"}), 401
    else: 
        print ("Se logro autentificar")    

        datos = request.get_json()  
        tarjeta_recibida = str(datos['no'])
        
        print("Se recibió tarjeta: %s" % tarjeta_recibida)
        
        # Consultar la base de datos para obtener el numero de cuenta
        cursor = mysql.connection.cursor(cursorclass=DictCursor)
        cursor.execute("SELECT * FROM metodos_pago WHERE no_cuenta = '"+tarjeta_recibida+"'")
        tarjeta_base = cursor.fetchone()
        cursor.close()
        
         # Verificar si son iguales
        if tarjeta_base and tarjeta_base['no_cuenta'] == tarjeta_recibida:
            vehiculo_seleccionado = session.get('vehiculo_seleccionado', 'sin selección')
            return jsonify({"validacion": True, "vehiculo": vehiculo_seleccionado})
        else: 
            vehiculo_seleccionado = session.get('vehiculo_seleccionado', 'sin selección')
            return jsonify({"validacion": False, "vehiculo": vehiculo_seleccionado})
        
# Obtener las alertas del servidor
# ALERTA DE ROBO = 1
@app.route('/recibir_alertas', methods=['POST'])
def recibir_alerta():

    datos = request.get_json()
    alerta_recibida = datos['alerta']
    print("Alerta recibida: %s" % alerta_recibida)
    
    try:
        usuario_id = session['usuario_id']
        cursor = mysql.connection.cursor(cursorclass=DictCursor)
        cursor.execute(
            "INSERT INTO servicio (Usuario, Alerta) VALUES (%s, %s)",
            (usuario_id, alerta_recibida))
        mysql.connection.commit()
        cursor.close()
        
        emit_to_web('alerta_recibida', {'alerta': alerta_recibida}, broadcast=True)
        
        return jsonify({"estado":  "Alerta guardada"})
    except Exception as e:
        return jsonify({"estado": "Error", "mensaje": str(e)}), 500
    
# Recibir la acción del servidor cuando se utiliza la tarjeta    
@app.route('/accion_tarjeta', methods=['POST'])
def accion_motor():
    data = request.get_json()
    accion = data.get('accion')
    
    if accion not in ['abrir', 'cerrar']:
        return jsonify({"estado": "Error", "mensaje": "Acción no reconocida"}), 400
    
    # Enviar al servidor Web
    emit_to_web('accion_tarjeta', {'accion': accion})
    
    # Regresar al servidor de la Rasp
    return jsonify({"estado": "Éxito"})

# Para enviar mensaje al servidor Web    
def emit_to_web(event, data, namespace='/'):
    with app.app_context():
        socketio.emit(event, data, namespace=namespace)        
          

# Cuando se da inicio se obtiene la hora de inicio y el vehiculo a utilizar
@socketio.on('obtener_inicio')
def obtener_inicio(data):
    usuario_id = session.get('usuario_id')
    vehiculo = data['vehiculo']
    carga = data['cargar']

    if usuario_id:
        
        # Verificar si el usuario tiene un número de cuenta NFC asociado
        cursor = mysql.connection.cursor(cursorclass=DictCursor)
        cursor.execute("SELECT * FROM metodos_pago WHERE ID = %s AND Metodo_pago = 'tarjeta'", (usuario_id,))
        tarjeta_nfc = cursor.fetchone()

        if not tarjeta_nfc:
            cursor.close()
            emit('error', {'mensaje': 'No hay tarjeta NFC enlazada'})
            return
        
        tiempo_inicio = datetime.now()

        # Guardar el tiempo de inicio en Redis
        redis_client.set(f"contador:{usuario_id}", tiempo_inicio.isoformat())
        redis_client.set('contador_activo:{}'.format(session['usuario_id']), 'true')
        
        if carga == True:
            valorCarga = 1
        else:
            valorCarga = 0

        try:
            # Guardar el tiempo de inicio, el vehículo y la carga en la base de datos
            cursor = mysql.connection.cursor(cursorclass=DictCursor)
            cursor.execute(
                "INSERT INTO servicio (Usuario, Tiempo_inicio, Vehiculo, Carga) VALUES (%s, %s, %s, %s)",
                (usuario_id, tiempo_inicio, vehiculo, valorCarga))
            mysql.connection.commit()
            session['id_servicio'] = cursor.lastrowid
            cursor.close()
            emit('contador_iniciado', {'tiempo_inicial': tiempo_inicio.isoformat()})
        except Exception as e:
            emit('error', {'mensaje': str(e)})
    else:
        emit('error', {'mensaje': 'Usuario no autenticado'})
            
@socketio.on('finalizar_contador')
def finalizar_contador():
    if 'usuario_id' in session and 'id_servicio' in session:
        tiempo_final = datetime.now()

        # Eliminar el estado del contador de Redis
        redis_client.delete(f"contador:{session['usuario_id']}")
        redis_client.delete('contador_activo:{}'.format(session['usuario_id']))

        try:
            # Guardar el tiempo final en MySQL
            cursor = mysql.connection.cursor(cursorclass=DictCursor)
            cursor.execute(
                "UPDATE servicio SET Tiempo_final = %s WHERE ID = %s",
                (tiempo_final, session['id_servicio']))
            mysql.connection.commit()
            cursor.close()
            emit('contador_finalizado', {'tiempo_final_servidor': tiempo_final.isoformat()})
        except Exception as e:
            emit('error', {'mensaje': str(e)})
            
@socketio.on('cargar_estado_contador')
def cargar_estado_contador():
    if 'usuario_id' in session:
        tiempo_actual = datetime.now()
        tiempo_inicio = redis_client.get(f"contador:{session['usuario_id']}")
        if tiempo_inicio:
            emit('actualizar_tiempo', {'tiempo_inicio': tiempo_inicio.decode('utf-8')})
        else:
            emit('error', {'mensaje': "No se encontró un contador activo para el usuario."})
            
# Cuando se carga la página, verifica el estado del contador.
@app.route('/estado_contador')
def estado_contador():
    if 'usuario_id' in session:
        estado = redis_client.get('contador_activo:{}'.format(session['usuario_id']))
        return jsonify({'contador_activo': bool(estado)})
    return jsonify({'contador_activo': False})

# Correr el programa
if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port='4999')