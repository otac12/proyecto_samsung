/******************** SE PUEDE SELECCIONAR CUANDO FINALIZA *********************/

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

/******************** SI NO HAY UNA SELECCION PARA FINALIZAR *********************/

//const socket = io();

let contadorActivo = false;
let contadorInterval;

// Escuchar el evento contador_iniciado
socket.on('contador_iniciado', function(data) {
    contadorActivo = true;
    toggleContadorButton();
    iniciarContador(new Date(data.tiempo_inicial).getTime());
});

// Escuchar el evento contador_finalizado
socket.on('contador_finalizado', function(data) {
    contadorActivo = false;
    toggleContadorButton();
    detenerContador();
    // Mostrar tiempo finalizado en la consola o actualizar la interfaz según sea necesario
    console.log('Contador finalizado a las:', data.tiempo_finalizado);
});

// Escuchar errores emitidos por el servidor
socket.on('error', function(data) {
    console.error('Error:', data.mensaje);
    alert('Error: ' + data.mensaje);
});

// Event listener para el botón de inicio del contador
document.getElementById('BtnIniciar').addEventListener('click', function() {
    if (!contadorActivo) {
        socket.emit('obtener_inicio');
    } else {
        socket.emit('finalizar_contador');
    }
});

// Función para alternar el texto del botón basado en el estado del contador
function toggleContadorButton() {
    const btnContador = document.getElementById('BtnIniciar');
    if (contadorActivo) {
        btnContador.textContent = 'Finalizar';
    } else {
        btnContador.textContent = 'Iniciar';
    }
}

// Función para iniciar el contador
function iniciarContador(tiempoInicioMillis) {
    clearInterval(contadorInterval);
    contadorInterval = setInterval(() => {
        const tiempoActual = new Date().getTime();
        const tiempoTranscurrido = tiempoActual - tiempoInicioMillis;
        document.getElementById('display_contador').textContent = formatearTiempo(tiempoTranscurrido / 1000);
    }, 1000);
}

// Función para detener el contador
function detenerContador() {
    clearInterval(contadorInterval);
    document.getElementById('display_contador').textContent = '00:00:00';
}


// Solicitar el estado del contador cuando la página se carga
document.addEventListener('DOMContentLoaded', function() {
    socket.emit('cargar_estado_contador');
});

// Escuchar el evento actualizar_tiempo
socket.on('actualizar_tiempo', function(data) {
    const tiempoInicio = new Date(data.tiempo_inicio).getTime();
    const tiempoActual = Date.now();
    const tiempoTranscurrido = tiempoActual - tiempoInicio;
    iniciarContador(tiempoInicio, tiempoTranscurrido);
});

// Función para iniciar el contador basado en el tiempo transcurrido
function iniciarContador(tiempoInicioMillis, tiempoTranscurridoMillis) {
    clearInterval(contadorInterval);
    contadorInterval = setInterval(() => {
        const tiempoActual = Date.now();
        const nuevoTiempoTranscurrido = tiempoActual - tiempoInicioMillis;
        document.getElementById('display_contador').textContent = formatearTiempo(nuevoTiempoTranscurrido / 1000);
    }, 1000);
} 

// Función para dar formato al tiempo (segundos a HH:MM:SS)
/*function formatearTiempo(segundos) {
    let horas = Math.floor(segundos / 3600);
    let minutos = Math.floor((segundos % 3600) / 60);
    let segundosRestantes = Math.floor(segundos % 60);
    return [horas, minutos, segundosRestantes]
        .map(v => v < 10 ? "0" + v : v)
        .join(':'); 
}*/