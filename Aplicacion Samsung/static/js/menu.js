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
