document.addEventListener('DOMContentLoaded', function() {

    var botonLogin = document.getElementById('loginBoton');
    
    botonLogin.addEventListener('click', function(e) {
        var correo = document.getElementById('correo').value;
        var contrasena = document.getElementById('contrasena').value;

        // Datos del formulario para enviarlos como JSON.
        var datosLogin = {
            correo: correo,
            contrasena: contrasena
        };

        // Realiza una petición POST al login.
        fetch('/login', {
            method: 'POST',
            body: JSON.stringify(datosLogin), // Convierte los datos a una cadena JSON.
            headers: {
                'Content-Type': 'application/json' // Establece el tipo de contenido como JSON.
            },
            credentials: 'same-origin' // Sirve para las cookies 
        })
        .then(respuesta => {
            // Comprueba la respuesta del servidor
            if (respuesta.ok) {
                // Si es exitosa, convierte la respuesta a JSON.
                return respuesta.json();
            } else {
                throw new Error('Error en el inicio de sesión');
            }
        })
        .then(datos => {
            // Procesa los datos de respuesta.
            if (datos.estado === 'Login exitoso') {
                // Si el inicio de sesión es exitoso, redirige al usuario a '/main'.
                window.location.href = '/main';
            } else {
                alert(datos.mensaje);
            }
        })
        .catch((error) => {
            // Error en la red o en la respuesta
            console.error('Error:', error);
            alert('Error en la comunicación con el servidor.');
        });
    });
});


