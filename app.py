from flask import Flask, render_template, request, redirect, url_for, flash, session
from werkzeug.security import generate_password_hash

app = Flask(__name__)
app.secret_key = 'tu_clave_secreta'  # Clave secreta para mantener seguras las sesiones

# Validar correo
def es_correo_valido(correo):
    import re
    patron_correo = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(patron_correo, correo)

@app.route('/')
def inicio():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def iniciar_sesion():
    if request.method == 'POST':
        # Obtener datos del formulario (el hmtl)
        nombre_usuario = request.form['nombre_usuario']
        contrasena = request.form['contrasena']
        
        # Aquí se agregaría la lógica para validar los datos de la base de datos

        # Simulamos una autenticación exitosa
        session['nombre_usuario'] = nombre_usuario
        flash('Inicio exitoso', 'success')
        return redirect(url_for('inicio'))  # Ir a ventana de principal
    else:
        return render_template('login.html')

@app.route('/registro', methods=['GET', 'POST'])
def registro():
    if request.method == 'POST':
        # Obtener los datos del registro
        nombre = request.form['nombre']
        apellido = request.form['apellido']
        nombre_usuario = request.form['nombre_usuario']     # Este podría ser el ID
        correo = request.form['correo']                     # O podría ser este
        contrasena = request.form['contrasena']
        confirmar_contrasena = request.form['confirmar_contrasena']

        # Imprime los datos para ver si funciona 
        print(f"Registrando a: {nombre} {apellido}, Usuario: {nombre_usuario}, Correo: {correo}")

        # Validar que las contraseñas coincidan y que el correo sea valido 
        if contrasena != confirmar_contrasena:
            flash('Las contraseñas no coinciden', 'error')
            return render_template('registro.html', nombre=nombre, apellido=apellido, nombre_usuario=nombre_usuario, correo=correo)

        # Validar el correo electrónico
        if not es_correo_valido(correo):
            flash('El correo electrónico no es válido', 'error')
            return render_template('registro.html', nombre=nombre, apellido=apellido, nombre_usuario=nombre_usuario, correo=correo)

        # Hashear la contraseña (Ponerla segura)
        contrasena_hash = generate_password_hash(contrasena)
        print(f"Contraseña: {contrasena}, Contraseña Hash: {contrasena_hash}")
        
        # Enviar datos a la base de datos para que se guarde el usuario

        flash('Registro exitoso. Por favor, inicia sesión.', 'success')
        return redirect(url_for('iniciar_sesion'))
    else:
        return render_template('registro.html')

if __name__ == '__main__':
    app.run(debug=True)



