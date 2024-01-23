from flask import Flask, render_template, request, jsonify, url_for, redirect, session, flash
from flask_mysqldb import MySQL
from MySQLdb.cursors import DictCursor
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from flask_socketio import SocketIO, emit
from flask_redis import FlaskRedis
import yaml
import re

app = Flask(__name__)
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


@app.route('/')
def index():
    return render_template('login.html')


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
    
@app.route('/main')
def principal():
    if 'usuario_id' in session:
        # Se envía el tiempo de inicio si existe, para sincronizar el contador
        tiempo_inicio = redis_client.get(f"contador:{session['usuario_id']}")
        # Cambiar 'main.html por 'menu.hmtl'
        return render_template('main.html', tiempo_inicio=tiempo_inicio.decode('utf-8') if tiempo_inicio else None)
    else:
        flash('Por favor, inicia sesión para continuar', 'danger')
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

### EN EL CASO EN DONDE SE UTILICE LA SELECCIÓN DE LA HORA EN LA QUE SE TERMINA

"""

# Guardar las horas de inicio y final para iniciar el contador utilizando SocketIO
@socketio.on('iniciar_contador')
def iniciar_contador(json):
    if 'nombre_usuario' in session:
        duracion = json['duracion']
        tiempo_inicio = datetime.now()
        tiempo_final = tiempo_inicio + timedelta(minutes=duracion)
        session['tiempo_final'] = tiempo_final.strftime('%Y-%m-%d %H:%M:%S')
        
        try:
            # Obtener el ID del usuario a partir del nombre de usuario en la sesión
            cursor = mysql.connection.cursor(cursorclass=DictCursor)
            cursor.execute("SELECT ID FROM usuario WHERE Nombre = %s", (session['nombre_usuario'],))
            usuario_id = cursor.fetchone()['ID']
           
            # Guardar la hora de inicio y la hora final en la base de datos
            cursor.execute(
                "INSERT INTO servicio (Tiempo_inicio, Tiempo_final, Usuario) VALUES (%s, %s, %s)",
                (tiempo_inicio, tiempo_final, usuario_id))
            mysql.connection.commit()
            cursor.close()

            # Almacenar tiempo final en Redis
            redis_client.set('tiempo_final_{}'.format(session['nombre_usuario']), session['tiempo_final'])
            
            emit('actualizar_contador', {'tiempo_final': session['tiempo_final']})
        except Exception as e:
            emit('error', {'mensaje': str(e)})
            
@socketio.on('verificar_estado_contador')
def verificar_estado_contador():
    if 'nombre_usuario' in session:
        tiempo_final = redis_client.get('tiempo_final_{}'.format(session['nombre_usuario']))
        if tiempo_final:
            emit('actualizar_contador', {'tiempo_final': tiempo_final.decode('utf-8')})
        else:
            emit('error', {'mensaje': "No hay contador activo"})
            
 
"""           
            
### EN CASO DE QUE NO SE SELECCIONE CUANTO TIEMPO QUIERE ESTAR

# Obtener hora de inicio
@socketio.on('obtener_inicio')
def obtener_inicio():
    if 'usuario_id' in session:
        tiempo_inicio = datetime.now()

        # Guardar el tiempo de inicio en Redis
        redis_client.set(f"contador:{session['usuario_id']}", tiempo_inicio.isoformat())

        try:
            # Guardar el tiempo de inicio en MySQL
            cursor = mysql.connection.cursor(cursorclass=DictCursor)
            cursor.execute(
                "INSERT INTO servicio (Usuario, Tiempo_inicio) VALUES (%s, %s)",
                (session['usuario_id'], tiempo_inicio))
            mysql.connection.commit()
            session['id_servicio'] = cursor.lastrowid
            cursor.close()
            emit('contador_iniciado', {'tiempo_inicial': tiempo_inicio.isoformat()})
        except Exception as e:
            emit('error', {'mensaje': str(e)})
            
@socketio.on('finalizar_contador')
def finalizar_contador():
    if 'usuario_id' in session and 'id_servicio' in session:
        tiempo_final = datetime.now()

        # Eliminar el estado del contador de Redis
        redis_client.delete(f"contador:{session['usuario_id']}")

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
        tiempo_inicio = redis_client.get(f"contador:{session['usuario_id']}")
        if tiempo_inicio:
            emit('actualizar_tiempo', {'tiempo_inicio': tiempo_inicio.decode('utf-8')})
        else:
            emit('error', {'mensaje': "No se encontró un contador activo para el usuario."})
            
@app.route('/accion_motor', methods=['POST'])
def accion_motor():
    accion = request.json.get('accion')
    if accion == 'abrir':
        print('Se abre el sistema')
    elif accion == 'cerrar':
        print('Se cierra el sistema')
    else:
        return jsonify({"estado": "Error", "mensaje": "Acción no reconocida"}), 400

    return jsonify({"estado": "Éxito", "accion": accion})

# Correr el programa
if __name__ == '__main__':
    socketio.run(app, debug=True)