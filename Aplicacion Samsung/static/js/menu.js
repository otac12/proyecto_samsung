document.addEventListener('DOMContentLoaded', function() {
    const socket = io();

    let contadorActivo = false;
    let contadorInterval;
    let vehiculoSeleccionado = null;
    let cargar = false;

    // Funciones
    function seleccionarVehiculo(vehiculo) {
        document.getElementById('bici').classList.remove('activo');
        document.getElementById('scooter').classList.remove('activo');

        if (vehiculo === 'Bicicleta') {
            document.getElementById('bici').classList.add('activo');
        } else if (vehiculo === 'Scooter') {
            document.getElementById('scooter').classList.add('activo');
        }

        vehiculoSeleccionado = vehiculo;
    }

    function enviarAccion(accion) {
        fetch('http://10.87.15.80:5000/anclaje', {
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

    function mostrarDialogoNFC() {
        // Implementa la lógica para mostrar un cuadro de diálogo aquí
    }

    function desactivarAlerta() {
        var boton = document.getElementById('botonAlerta');
        boton.classList.remove('boton-alerta-activo');
        boton.classList.add('boton-alerta-inactivo');
    }

    function toggleContadorButton(text) {
        const btnContador = document.getElementById('BtnIniciar');
        btnContador.textContent = text;
        contadorActivo = (text === 'Finalizar');
    }

    function iniciarContador(tiempoInicio) {
        clearInterval(contadorInterval);
        const inicio = new Date(tiempoInicio).getTime();
        contadorInterval = setInterval(() => {
            const ahora = Date.now();
            const transcurrido = new Date(ahora - inicio);
            formatearTiempo(transcurrido);
        }, 1000);
    }

    function formatearTiempo(tiempo) {
        let horas = tiempo.getUTCHours();
        let minutos = tiempo.getUTCMinutes();
        let segundos = tiempo.getUTCSeconds();

        document.getElementById('ca').textContent = horas < 10 ? "0" + horas : horas;
        document.getElementById('cd').textContent = minutos < 10 ? "0" + minutos : minutos;
        document.getElementById('cg').textContent = segundos < 10 ? "0" + segundos : segundos;
    }

    function resetearContador() {
        detenerContador();
        document.getElementById('ca').textContent = '00';
        document.getElementById('cd').textContent = '00';
        document.getElementById('cg').textContent = '00';
        toggleContadorButton('Inicio');
        contadorActivo = false;
    }

    function detenerContador() {
        clearInterval(contadorInterval);
    }

    // Event listeners
    const btnIniciar = document.getElementById('BtnIniciar');
    const btnBici = document.getElementById('bici');
    const btnScooter = document.getElementById('scooter');
    const btnNFC = document.getElementById('btnNFC'); // Asegúrate de que este ID exista en tu HTML
    const btnCargar = document.getElementById('btnCargar');
    const botonAlerta = document.getElementById('botonAlerta');
    const rfid = document.getElementById('rfid');

    if (btnIniciar) {
        btnIniciar.addEventListener('click', function() {
            if (!contadorActivo) {
                if (!vehiculoSeleccionado) {
                    alert('Por favor, selecciona un vehículo para continuar.');
                    return;
                }
                enviarAccion('cerrar');
                socket.emit('obtener_inicio', { vehiculo: vehiculoSeleccionado, cargar: cargar });
            } else {
                enviarAccion('abrir');
                socket.emit('finalizar_contador');
            }
        });
    }

    if (btnBici && btnScooter) {
        btnBici.addEventListener('click', () => seleccionarVehiculo('Bicicleta'));
        btnScooter.addEventListener('click', () => seleccionarVehiculo('Scooter'));
    }

    if (btnNFC) {
        btnNFC.addEventListener('click', function() {
            const numeroNFC = document.getElementById('numero-nfc').value;
            if (numeroNFC.trim() === '') {
                alert('Por favor, ingresa el número de la tarjeta NFC.');
                return;
            }
            enlazarNFC(numeroNFC);
        });
    }

    if (btnCargar) {
        btnCargar.addEventListener('click', function() {
            cargar = !cargar;
            this.textContent = cargar ? 'Cargar' : 'No Cargar';
        });
    }

    if (botonAlerta) {
        botonAlerta.addEventListener('click', function() {
            if (this.classList.contains('boton-alerta-activo')) {
                desactivarAlerta();
            }
        });
    }

    if (rfid) {
        rfid.addEventListener('click', mostrarDialogoNFC);
    }

    document.querySelectorAll('.alertas').forEach(function(alertaElem) {
        alertaElem.addEventListener('click', function() {
            if (this.textContent.includes('Alerta de Forsejeo')) {
                desactivarAlerta();
            }
        });
    });

    // Socket listeners
    socket.on('alerta_recibida', function(data) {
        if (data.alerta === 1) {
            document.getElementById('botonAlerta').classList.remove('boton-alerta-inactivo');
            document.getElementById('botonAlerta').classList.add('boton-alerta-activo');
        }
    });

    socket.on('contador_iniciado', function(data) {
        contadorActivo = true;
        toggleContadorButton('Finalizar');
        iniciarContador(new Date(data.tiempo_inicial));
    });

    socket.on('contador_finalizado', function() {
        contadorActivo = false;
        resetearContador();
    });

    socket.on('error', function(data) {
        console.error('Error:', data.mensaje);
        alert('Error: ' + data.mensaje);
    });

    socket.emit('cargar_estado_contador');

    socket.on('actualizar_tiempo', function(data) {
        contadorActivo = true;
        toggleContadorButton('Finalizar');
        iniciarContador(new Date(data.tiempo_inicio));
    });
});
