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
            session['nombre_usuario'] = usuario['Nombre']
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
    if 'nombre_usuario' in session:
        return render_template('main.html')
    else:
        flash('Por favor, inicia sesión para continuar', 'danger')
        return redirect(url_for('index'))  # Redirige a la página de inicio de sesión
    
# Enviar los lugares en donde hay estaciones
@app.route('/estaciones')
def estaciones():
    if 'nombre_usuario' in session:
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
    
# Guardar las horas de inicio y final para iniciar el contador utilizando SocketIO
@socketio.on('iniciar_contador')
def iniciar_contador(json):
    if 'nombre_usuario' in session:
        duracion = json['duracion']
        tiempo_inicio = datetime.now()
        tiempo_final = tiempo_inicio + timedelta(minutes=duracion)
        session['tiempo_final'] = tiempo_final.strftime('%Y-%m-%d %H:%M:%S')
        
        try:
            # Guardar la hora de inicio y la hora final en la base de datos
            cursor = mysql.connection.cursor()
            cursor.execute(
                "INSERT INTO servicio (Usuario, Tiempo_inicio, Tiempo_final) VALUES (%s, %s, %s)",
                (session['nombre_usuario'], tiempo_inicio, tiempo_final))
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

""""
@socketio.on('iniciar_contador')
def iniciar_contador(json):
    if 'nombre_usuario' in session:
        duracion = json['duracion']
        tiempo_inicio = datetime.now()
        tiempo_final = tiempo_inicio + timedelta(minutes=duracion)
        
        try:
            # Guardar la hora de inicio y la hora final en la base de datos
            cursor = mysql.connection.cursor()
            cursor.execute(
                "INSERT INTO servicio (Usuario, Tiempo_inicio, Tiempo_final) VALUES (%s, %s, %s)",
                (session['id_usuario'], tiempo_inicio, tiempo_final))
            mysql.connection.commit()
            cursor.close()
            
            # Dar la respuesta al cliente con el tiempo final
            emit('actualizar_contador', {'tiempo_final': tiempo_final.strftime('%Y-%m-%d %H:%M:%S')})

        except Exception as e:
            return jsonify({"estado": "Error", "mensaje": str(e)}), 500
    else:
        emit('error', {'mensaje': "Usuario no autenticado"})
    
# Verificar el estado del contador utilizando SocketIO
@socketio.on('verificar_estado_contador')
def verificar_estado_contador():
    # Obteniendo el tiempo final de la base de datos
    if 'nombre_usuario' in session:
        try:
            # Obtener la hora final desde la base de datos
            cursor = mysql.connection.cursor()
            cursor.execute("SELECT Tiempo_final FROM servicio WHERE Usuario = %s ORDER BY ID DESC LIMIT 1",
                           (session['id_usuario'],))
            data = cursor.fetchone()
            cursor.close()

            if data:
                tiempo_final = data['Tiempo_final']
                emit('actualizar_contador', {'tiempo_final': tiempo_final.strftime('%Y-%m-%d %H:%M:%S')})
            else:
                return jsonify({"estado": "Error", "mensaje": "No hay contador activo"}), 404
        except Exception as e:
            return jsonify({"estado": "Error", "mensaje": str(e)}), 500
    else:
      return jsonify({"error": "Usuario no autenticado"}), 401


"""
       
# Correr el programa
if __name__ == '__main__':
    socketio.run(app, debug=True)