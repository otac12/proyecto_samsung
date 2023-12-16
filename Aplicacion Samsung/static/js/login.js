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
                var minutos=30;
                var expiracion = new Date();
                expiracion.getTime(expiracion.getTime+(minutos*1000))

                //se crea la cockie con un tiempoo de vida de 30 min

                var cockie = "usuario = " + datos.usuario+ "; expires=" + expiracion.toUTCString() + "; path=/";

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


