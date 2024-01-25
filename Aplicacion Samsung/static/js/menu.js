const socket = io();

let contadorActivo = false;
let contadorInterval;
let vehiculoSeleccionado = null;
let cargar = false;

// Event listener para el botón de inicio del contador
document.getElementById('BtnIniciar').addEventListener('click', function() {
    if (!contadorActivo) {
        if (!vehiculoSeleccionado) {
            alert('Por favor, selecciona un vehículo para continuar.');
            return;
        }
        enviarAccion('abrir');
        socket.emit('obtener_inicio', { vehiculo: vehiculoSeleccionado, cargar: cargar });
    } else {
        enviarAccion('cerrar');
        socket.emit('finalizar_contador');
    }
});

// Event listeners para los botones de selección de vehículo
document.getElementById('btn-bici').addEventListener('click', function() {
    seleccionarVehiculo('Bicicleta');
});
document.getElementById('btn-scooter').addEventListener('click', function() {
    seleccionarVehiculo('Scooter');
});

// Event listener para agregar una tarjeta NFC
document.getElementById('btnNFC').addEventListener('click', function() {
    const numeroNFC = document.getElementById('numero-nfc').value;
    if (numeroNFC.trim() === '') {
        alert('Por favor, ingresa el número de la tarjeta NFC.');
        return;
    }
    enlazarNFC(numeroNFC);
});

// Event listener par cargar el vehiculo
document.getElementById('btnCargar').addEventListener('click', function() {
    cargar = !cargar;
    this.textContent = cargar ? 'Cargar' : 'No Cargar';
});

// Función para manejar la selección de vehículo
function seleccionarVehiculo(vehiculo) {
    document.getElementById('btn-bici').classList.remove('activo');
    document.getElementById('btn-scooter').classList.remove('activo');

    if (vehiculo === 'Bicicleta') {
        document.getElementById('btn-bici').classList.add('activo');
    } else if (vehiculo === 'Scooter') {
        document.getElementById('btn-scooter').classList.add('activo');
    }

    vehiculoSeleccionado = vehiculo;
}

// Función para enviar la acción 'abrir' o 'cerrar' al servidor
function enviarAccion(accion) {
    fetch('/accion_motor', {
        method: 'POST',
        body: JSON.stringify({ accion: accion }),
        headers: {
            'Content-Type': 'application/json'
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

// Función para enlazar una tarjeta NFC
function enlazarNFC(numeroNFC) {
    fetch('/enlazar_nfc', {
        method: 'POST',
        body: JSON.stringify({ nfc_number: numeroNFC }),
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.estado === 'Éxito') {
            alert('Tarjeta NFC enlazada con éxito!');
            document.getElementById('numero-nfc').value = '';
        } else {
            alert(data.mensaje);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al enlazar la tarjeta NFC.');
    });
}

// Escuchar el evento contador_iniciado
socket.on('contador_iniciado', function(data) {
    contadorActivo = true;
    toggleContadorButton('Finalizar');
    iniciarContador(new Date(data.tiempo_inicial));
});

// Escuchar el evento contador_finalizado
socket.on('contador_finalizado', function() {
    contadorActivo = false;
    resetearContador();
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

// Función para resetear el contador y regresarlo a Iniciar
function resetearContador() {
    detenerContador();
    document.getElementById('display_contador').textContent = '00:00:00';
    toggleContadorButton('Iniciar');
    contadorActivo = false;
}

// Función para detener el contador
function detenerContador() {
    clearInterval(contadorInterval);
}

// Función para dar formato al tiempo
function formatearTiempo(tiempo) {
    let horas = tiempo.getUTCHours();
    let minutos = tiempo.getUTCMinutes();
    let segundos = tiempo.getUTCSeconds();
    return [horas, minutos, segundos].map(v => v < 10 ? "0" + v : v).join(':');
}

// Verificar el estado del contador al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    socket.emit('cargar_estado_contador');
});

socket.on('actualizar_tiempo', function(data) {
    contadorActivo = true;
    toggleContadorButton('Finalizar');
    iniciarContador(new Date(data.tiempo_inicio));
});

// Escuchar errores emitidos por el servidor
socket.on('error', function(data) {
    console.error('Error:', data.mensaje);
    alert('Error: ' + data.mensaje);
});