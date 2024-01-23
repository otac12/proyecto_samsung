/******************** SE PUEDE SELECCIONAR CUANDO FINALIZA *********************/
/*
// Inicializar una conexión WebSocket con el servidor Flask-SocketIO
const socket = io();

// Escuchar el evento actualizar_contador emitido por el servidor
socket.on('actualizar_contador', function(data) {
    // Actualiza el contador con el tiempo final recibido de la base de datos dado por el servidor
    actualizarContador(new Date(data.tiempo_final).getTime());
});

// Escuchar errores emitidos por el servidor
socket.on('error', function(data) {
    console.error('Error:', data.mensaje);
    alert('Error: ' + data.mensaje);
});

// Event listener para el botón de inicio del contador
document.getElementById('iniciar_contador').addEventListener('click', function() {
    let duracion = parseInt(document.getElementById('duracion').value);
    socket.emit('iniciar_contador', { duracion: duracion });
});

// Solicitar el estado del contador al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    socket.emit('verificar_estado_contador');
});

// Función para actualizar el contador en la página
function actualizarContador(tiempoFinalMillis) {
    clearInterval(window.contadorInterval);

    window.contadorInterval = setInterval(() => {
        let tiempoRestante = (tiempoFinalMillis - new Date().getTime()) / 1000;
        if (tiempoRestante > 0) {
            document.getElementById('display_contador').textContent = formatearTiempo(tiempoRestante);
        } else {
            clearInterval(window.contadorInterval);
            document.getElementById('display_contador').textContent = '00:00:00';
            socket.emit('contador_finalizado');
        }
    }, 1000);
}

// Función para dar formato al tiempo (segundos a HH:MM:SS)
function formatearTiempo(segundos) {
    let horas = Math.floor(segundos / 3600);
    let minutos = Math.floor((segundos % 3600) / 60);
    let segundosRestantes = Math.floor(segundos % 60);
    return [horas, minutos, segundosRestantes]
        .map(v => v < 10 ? "0" + v : v)
        .join(':'); 
}
*/

/******************** SI NO HAY UNA SELECCION PARA FINALIZAR *********************/

const socket = io();

let contadorActivo = false;
let contadorInterval;
let tiempoFinal;

// Event listener para el botón de inicio del contador
document.getElementById('BtnIniciar').addEventListener('click', function() {
    if (!contadorActivo) {
        // Cuando el contador está inactivo y se quiere iniciar
        enviarAccion('abrir');
        socket.emit('obtener_inicio');
    } else if (contadorActivo && this.textContent === 'Finalizar') {
        // Cuando el contador está activo y se quiere finalizar
        enviarAccion('cerrar');
        socket.emit('finalizar_contador');
    } else if (this.textContent === 'Pagar') {
        // Cuando se ha finalizado el contador y se quiere pagar
        resetearContador();
        enviarAccion('abrir'); // Enviar abrir cuando se quiere reiniciar después de pagar
    }
});

// Función para enviar la acción 'abrir' o 'cerrar' al servidor
function enviarAccion(accion) {
    fetch('/accion_contador', {
        method: 'POST',
        body: new URLSearchParams({ 'accion': accion }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log('Acción enviada:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Escuchar el evento contador_iniciado
socket.on('contador_iniciado', function(data) {
    contadorActivo = true;
    toggleContadorButton('Finalizar');
    iniciarContador(new Date(data.tiempo_inicial));
});

// Escuchar el evento contador_finalizado
socket.on('contador_finalizado', function(data) {
    contadorActivo = false;
    tiempoFinal = new Date(data.tiempo_final_servidor).getTime();
    toggleContadorButton('Pagar');
    mantenerTiempoFinal();
});

// Escuchar errores emitidos por el servidor
socket.on('error', function(data) {
    console.error('Error:', data.mensaje);
    alert('Error: ' + data.mensaje);
});

// Función para alternar el texto del botón basado en el estado del contador
function toggleContadorButton(text) {
    const btnContador = document.getElementById('BtnIniciar');
    btnContador.textContent = text;
    contadorActivo = (text === 'Finalizar');
}

// Función para iniciar el contador
function iniciarContador(tiempoInicio) {
    clearInterval(contadorInterval);
    const inicio = new Date(tiempoInicio).getTime();
    contadorInterval = setInterval(() => {
        const ahora = Date.now(); 
        const transcurrido = new Date(ahora - inicio);
        document.getElementById('display_contador').textContent = formatearTiempo(transcurrido);
    }, 1000);
}

// Función para actualizar el contador
function actualizarContador(tiempoInicio) {
    const tiempoActual = new Date();
    const tiempoTranscurrido = new Date(tiempoActual - tiempoInicio);
    document.getElementById('display_contador').textContent = formatearTiempo(tiempoTranscurrido);
}

// Función para mantener el tiempo final en el contador
function mantenerTiempoFinal() {
    clearInterval(contadorInterval);
    document.getElementById('display_contador').textContent = formatearTiempo(new Date(tiempoFinal));
}

// Función para detener el contador
function detenerContador() {
    clearInterval(contadorInterval);
}

// Función para resetear el contador y regresarlo a Iniciar
function resetearContador() {
    detenerContador();
    document.getElementById('display_contador').textContent = '00:00:00';
    toggleContadorButton('Iniciar');
    contadorActivo = false;
    tiempoFinal = null;
}

// Solicitar el estado del contador cuando la página se carga
document.addEventListener('DOMContentLoaded', function() {
    socket.emit('cargar_estado_contador');
});

// Cuando la página se carga, verificar si existe un tiempo de inicio
document.addEventListener('DOMContentLoaded', function() {
    let tiempoInicio = document.getElementById('tiempo_inicio') ? document.getElementById('tiempo_inicio').value : null;
    if (tiempoInicio) {
        iniciarContador(tiempoInicio);
        toggleContadorButton('Finalizar');
    } else {
        toggleContadorButton('Iniciar');
    }
});

// Escuchar el evento actualizar_tiempo
socket.on('actualizar_tiempo', function(data) {
    contadorActivo = true;
    toggleContadorButton('Finalizar');
    iniciarContador(new Date(data.tiempo_inicio));
});

// Función para dar formato al tiempo
function formatearTiempo(tiempo) {
    let horas = tiempo.getUTCHours();
    let minutos = tiempo.getUTCMinutes();
    let segundos = tiempo.getUTCSeconds();
    return [horas, minutos, segundos]
        .map(v => v < 10 ? "0" + v : v)
        .join(':'); 
}