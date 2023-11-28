from flask import Flask, render_template, request, redirect, url_for, flash, session
from werkzeug.security import generate_password_hash, check_password_hash
from models.ModelUser import ModelUser
from models.entities.User import User
from config import config

# Inicialización de la aplicación Flask
app = Flask(__name__)

# Carga la configuración de desarrollo desde el objeto config
app.config.from_object(config['development'])

# Página de inicio
@app.route('/')
def inicio():
    # Muestra la página de inicio
    return render_template('index.html')

# Inicio de sesión
@app.route('/login', methods=['GET', 'POST'])
def iniciar_sesion():
    if request.method == 'POST':
        # Obtener datos del formulario
        correo = request.form['correo']
        contrasena = request.form['contrasena']
        
        # Crear instancia de usuario con los datos del formulario
        user = User(None, correo, contrasena)

        # Verificar las credenciales del usuario
        logged_user = ModelUser.login(user)
        if logged_user is not None:
            # Si las credenciales son correctas, iniciar sesión y redirigir al inicio
            session['nombre_usuario'] = logged_user.nombre
            flash('Inicio exitoso', 'success')
            return redirect(url_for('inicio'))
        else:
            # Si las credenciales son incorrectas, mostrar mensaje de error
            flash('El correo o la contraseña son incorrectos', 'error')
    # Mostrar página de inicio de sesión
    return render_template('login.html')

# Ruta para la página de registro con métodos GET y POST
@app.route('/registro', methods=['GET', 'POST'])
def registro():
    if request.method == 'POST':
        # Obtener los datos del formulario
        nombre = request.form['nombre']
        correo = request.form['correo']
        contrasena = request.form['contrasena']
        confirmar_contrasena = request.form['confirmar_contrasena']

        # Verificar que las contraseñas coincidan y que el correo sea válido
        if contrasena != confirmar_contrasena:
            flash('Las contraseñas no coinciden', 'error')
        else:
            # Si las contraseñas coinciden, proceder a registrar al usuario
            hashed_password = generate_password_hash(contrasena)
            new_user = User(nombre, correo, hashed_password)
            
            # Registrar al usuario en la base de datos
            success = ModelUser.register_user(new_user)
            if success:
                # Si el registro es exitoso, redirigir al inicio de sesión
                flash('Registro exitoso. Por favor, inicia sesión.', 'success')
                return redirect(url_for('iniciar_sesion'))
            else:
                # Si hay un error en el registro, mostrar mensaje de error
                flash('Error al registrarse. Por favor, intente de nuevo.', 'error')

    # Mostrar página de registro
    return render_template('registro.html')

# Verificar si el correo es válido (podrías mover esta función a un módulo utilitario)
def es_correo_valido(correo):
    import re
    patron_correo = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(patron_correo, correo)

# Punto de entrada principal
if __name__ == '__main__':
    # Ejecutar la aplicación en modo de desarrollo
    app.run(debug=True)
