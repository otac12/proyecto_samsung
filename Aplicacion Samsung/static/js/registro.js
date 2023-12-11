document.addEventListener('DOMContentLoaded', function() {
    // Obtener formulario de registro
    var formulario = document.getElementById('registroForm');

    formulario.addEventListener('submit', function(e) {
        e.preventDefault();

        // Validación del correo electrónico
        var correo = document.querySelector('input[name="correo"]').value;
        var regexCorreo = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!regexCorreo.test(correo)) {
            alert('Por favor, ingrese un correo electrónico válido.');
            return;
        }

        // Obtener datos del formulario
        var nombreCompleto = document.querySelector('input[name="nombre"]').value;
        var correo = document.querySelector('input[name="correo"]').value;
        var contrasena = document.querySelector('input[name="contrasena"]').value;
        var confirmarContrasena = document.querySelector('input[name="confirmar_contrasena"]').value;

        // Verificar que se hayan llenado todos los datos
        if (!nombreCompleto || !correo || !contrasena || !confirmarContrasena) {
            alert('Por favor, complete todos los campos.');
            return;
        }

        // Verificar si las contraseñas coinciden
        if (contrasena !== confirmarContrasena) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        // Datos para enviar al formulario
        var datos = {
            nombre: nombreCompleto,
            correo: correo,
            contrasena: contrasena
        };

        // Petición POST al servidor para registrar al usuario
        fetch('/register', {
            method: 'POST',
            body: JSON.stringify(datos), // Convertir los datos del formlulario a JSON
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(respuesta => respuesta.json())    // Convierta la respuesta a JSON
        .then(datos => {
            // Comprueba la respuesta del servidor
            if (datos.estado === 'Registro exitoso') {
                window.location.href = '/';
            } else {
                alert('Error en el registro: ' + datos.mensaje);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error en la comunicación con el servidor.');
        });

    });
});
