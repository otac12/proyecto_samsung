// Espera a que el DOM esté completamente cargado antes de ejecutar el script
document.addEventListener('DOMContentLoaded', function() {
    // Inicialización del socket
    const socket = io();                

    let contadorActivo = false;
    let contadorInterval;
    let vehiculoSeleccionado = null;
    let cargar = false;
    const URL_ANCLAJE = 'http://10.87.15.80:5000/anclaje';

    // Elementos del DOM
    const btnIniciar = document.getElementById('BtnIniciar');
    const btnBici = document.getElementById('bici');
    const btnScooter = document.getElementById('scooter');
    const btnNFC = document.getElementById('btnNFC');
    const btnCargar = document.getElementById('btnCargar');
    const botonAlerta = document.getElementById('botonAlerta');
    const rfid = document.getElementById('rfid');
    const imgCargar = document.getElementById('imgCargar');
    const imgNoCarg = document.getElementById('imgNoCarg');

    // Event Listeners
    btnBici.addEventListener('click', () => seleccionarVehiculo('Bicicleta'));
    btnScooter.addEventListener('click', () => seleccionarVehiculo('Scooter'));
    btnNFC.addEventListener('click', enlazarNFCEventHandler);
    btnCargar.addEventListener('click', cargarEventHandler);
    botonAlerta.addEventListener('click', desactivarAlerta);
    rfid.addEventListener('click', mostrarDialogoNFC);
    btnIniciar.addEventListener('click', iniciarEventHandler);

    /* FUNCIONES PARA MANEJAR EVENTOS*/

    // Función para manejar la selección del vehículo
    function seleccionarVehiculo(vehiculo) {
        btnBici.classList.remove('activo');
        btnScooter.classList.remove('activo');
        document.getElementById(vehiculo === 'Bicicleta' ? 'bici' : 'scooter').classList.add('activo');
        vehiculoSeleccionado = vehiculo;
        enviarSeleccionVehiculo(vehiculo);
    }

    // Función para enlzar la terjata NFC al usuario
    function enlazarNFCEventHandler() {
        const numeroNFC = document.getElementById('numero-nfc').value.trim();
        if (numeroNFC === '') {
            alert('Por favor, ingresa el número de la tarjeta NFC.');
            return;
        }
        enlazarNFC(numeroNFC);
    }

    // Función para el botón de cargar
    function cargarEventHandler() {
        cargar = !cargar;
        actualizarEstadoCargaImagen();
        if (contadorActivo) enviarEstadoCarga(cargar);
    }

    // Función para el botón de Inicio/Finalizar
    function iniciarEventHandler() {
        if (!contadorActivo) {
            if (!vehiculoSeleccionado) {
                alert('Por favor, selecciona un vehículo para continuar.');
                return;
            }
            enviarAccion('cerrar', vehiculoSeleccionado, cargar);
            socket.emit('obtener_inicio', { vehiculo: vehiculoSeleccionado, cargar: cargar });
        } else {
            enviarAccion('abrir', vehiculoSeleccionado, cargar);
            socket.emit('finalizar_contador');
        }
    }

    /*  FUNCIÓN DE PETICIONES AL SERVIDOR   **/
    // Función para enviar el vehiculo al Servidor Web y que se lo mande a la Raspberry
    function enviarSeleccionVehiculo(vehiculo) {
        fetch('/seleccionar_vehiculo', {
            method: 'POST',
            body: JSON.stringify({ vehiculo: vehiculo }),
            headers: { 'Content-Type': 'application/json' },
        })
        .then(response => response.json())
        .then(data => console.log('Selección de vehículo guardada:', data))
        .catch(error => console.error('Error al guardar la selección de vehículo:', error));
    }

    // Función para enviar la tarjeta NFC
    function enlazarNFC(numeroNFC) {
        fetch('/enlazar_nfc', {
            method: 'POST',
            body: JSON.stringify({ nfc_number: numeroNFC }),
            headers: { 'Content-Type': 'application/json' },
        })
        .then(response => response.json())
        .then(data => {
            alert(data.estado === 'Éxito' ? 'Tarjeta NFC enlazada con éxito!' : data.mensaje);
            document.getElementById('numero-nfc').value = '';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al enlazar la tarjeta NFC.');
        });
    }

    // Función para enviar a la Raspberry la acción, el vehiculo y la carga
    function enviarAccion(accion, vehiculo, cargar) {
        fetch(URL_ANCLAJE, {
            method: 'POST',
            body: JSON.stringify({ accion, vehiculo, cargar }),
            headers: { 'Content-Type': 'application/json' },
        })
        .then(response => response.json())
        .then(data => console.log('Acción enviada:', data))
        .catch(error => console.error('Error:', error));
    }

    // Función para enviar la carga a la Raspberry
    function enviarEstadoCarga(cargar) {
        fetch(URL_ANCLAJE, {
            method: 'POST',
            body: JSON.stringify({ cargar }),
            headers: { 'Content-Type': 'application/json' },
        })
        .then(response => response.json())
        .then(data => console.log('Estado de carga enviado:', data))
        .catch(error => console.error('Error al enviar estado de carga:', error));
    }

    // Cambiar la la Imagen dependiendo de el botón de carga
    function actualizarEstadoCargaImagen() {
        imgCargar.style.display = cargar ? 'block' : 'none';
        imgNoCarg.style.display = cargar ? 'none' : 'block';
    }

    // Función para mostrar el cuadro de diálogo NFC
    function mostrarDialogoNFC() {
        document.getElementById('dialogoNFC').classList.add('dialogo-visible');
    }

    // Función para desactivar la alerta visual
    function desactivarAlerta() {
        var boton = document.getElementById('botonAlerta');
        boton.classList.remove('boton-alerta-activo');
        boton.classList.add('boton-alerta-inactivo');
    }

    // Función para cambiar el texto del botón de inicio/finalizar del contador
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
            formatearTiempo(transcurrido);
        }, 1000);
    }

    // Función para dar formato al tiempo transcurrido
    function formatearTiempo(tiempo) {
        let horas = tiempo.getUTCHours();
        let minutos = tiempo.getUTCMinutes();
        let segundos = tiempo.getUTCSeconds();

        document.getElementById('ca').textContent = horas < 10 ? "0" + horas : horas;
        document.getElementById('cd').textContent = minutos < 10 ? "0" + minutos : minutos;
        document.getElementById('cg').textContent = segundos < 10 ? "0" + segundos : segundos;
    }

    // Función para resetear el contador a su estado inicial
    function resetearContador() {
        detenerContador();
        document.getElementById('ca').textContent = '00';
        document.getElementById('cd').textContent = '00';
        document.getElementById('cg').textContent = '00';
        toggleContadorButton('Inicio');
        contadorActivo = false;
    }

    // Función para detener el contador
    function detenerContador() {
        clearInterval(contadorInterval);
    }

    // Event listener para el botón de inicio
    if (btnIniciar) {
        btnIniciar.addEventListener('click', function() {
            if (!contadorActivo) {
                if (!vehiculoSeleccionado) {
                    alert('Por favor, selecciona un vehículo para continuar.');
                    return;
                }

                // Enviar la acción y el estado de carga al servidor
                enviarAccion('cerrar', vehiculoSeleccionado, cargar);

                socket.emit('obtener_inicio', { vehiculo: vehiculoSeleccionado, cargar: cargar });
            } else {
                enviarAccion('abrir', vehiculoSeleccionado, cargar);
                socket.emit('finalizar_contador');
            }
        });
    }

    // Event listener para el diálogo NFC
    document.getElementById('rfid').addEventListener('click', mostrarDialogoNFC);
    document.getElementById('btnCerrarDialogo').addEventListener('click', function() {
        document.getElementById('dialogoNFC').classList.remove('dialogo-visible');
    });
    document.getElementById('btnEnlazarNFC').addEventListener('click', function() {
        const numeroNFC = document.getElementById('numeroNFC').value;
        if (numeroNFC.trim() === '') {
            alert('Por favor, ingresa el número de la tarjeta NFC.');
            return;
        }
        enlazarNFC(numeroNFC);
        document.getElementById('dialogoNFC').classList.remove('dialogo-visible');
    });

    // Funciones para actualizar la hora y la fecha
    function actualizarHora() {
        const ahora = new Date();
        const horas = ahora.getHours().toString().padStart(2, '0');
        const minutos = ahora.getMinutes().toString().padStart(2, '0');
        const tiempo = horas + ':' + minutos;
        document.querySelector('#rb p').textContent = tiempo;
    }
    
    function actualizarFecha() {
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    
        const hoy = new Date();
        const diaSemana = dias[hoy.getDay()];
        const dia = hoy.getDate();
        const mes = meses[hoy.getMonth()];
        const año = hoy.getFullYear();
    
        const fechaTexto = `${diaSemana}, ${mes} ${dia}, ${año}`;
        document.querySelector('#rd p').textContent = fechaTexto;
    }

    // Inicializar la hora y la fecha al cargar
    actualizarHora();
    setInterval(actualizarHora, 60000);
    actualizarFecha();

    // Función para que parpade le alerta de Forsejeo
    function activarAlertaForsejeo() {
        const divForsejeo = document.getElementById('alertaForsejeo');
        divForsejeo.classList.add('parpadeo');
    }

    // Función para desactivar la alerta de Forsejeo
    function desactivarAlertaForsejeo() {
        const divForsejeo = document.getElementById('alertaForsejeo');
        divForsejeo.classList.remove('parpadeo');
    }

    // Event listeners para selección de vehículos
    if (btnBici && btnScooter) {
        btnBici.addEventListener('click', () => seleccionarVehiculo('Bicicleta'));
        btnScooter.addEventListener('click', () => seleccionarVehiculo('Scooter'));
    }

    // Event listener para la tarjeta NFC
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

    // Event listener para el botón de carga
    if (btnCargar) {
        btnCargar.addEventListener('click', function() {
            cargar = !cargar;
            this.textContent = cargar ? 'Cargar' : 'No Cargar';
            actualizarEstadoCargaImagen();

            // Si el contador está activo, enviar el estado al servidor.
            if (contadorActivo) {
                enviarEstadoCarga(cargar);
            }
        });
    }

    // Event listener para el botón de alerta
    if (botonAlerta) {
        botonAlerta.addEventListener('click', function() {
            if (this.classList.contains('boton-alerta-activo')) {
                desactivarAlerta();
            }
        });
    }

    // Event listener para el diálogo NFC
    if (rfid) {
        rfid.addEventListener('click', mostrarDialogoNFC);
    }

    // Event listeners para las alertas
    document.querySelectorAll('.alertas').forEach(function(alertaElem) {
        alertaElem.addEventListener('click', function() {
            if (this.textContent.includes('Alerta de Forsejeo')) {
                desactivarAlerta();
            }
        });
    });

    // Socket listeners para manejar eventos del servidor
    socket.on('alerta_recibida', function(data) {
        if (data.alerta === 1) {
            document.getElementById('botonAlerta').classList.remove('boton-alerta-inactivo');
            document.getElementById('botonAlerta').classList.add('boton-alerta-activo');
        }
    });

    // Socket para menejar el botón de inicio cuando se utiliza la tarjeta
    socket.on('accion_tarjeta', function(data){
        if (data.accion == 'abrir'){
            if (contadorActivo){
                socket.emit('finalizar_contador');
            }
        } else if (data.accion == 'cerrar'){
            if (!contadorActivo) {
                socket.emit('obtener_inicio', { vehiculo: vehiculoSeleccionado, cargar: cargar });
            }
            fetch(URL_ANCLAJE, {
                method: 'POST',
                body: JSON.stringify({ cargar: cargar }),
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(response => response.json())
            .then(data => {
                console.log('Datos enviados:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
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

    // Socket listeners para manejar eventos del servidor
    socket.emit('cargar_estado_contador');

    // Socket listeners para manejar eventos del servidor
    socket.on('actualizar_tiempo', function(data) {
        contadorActivo = true;
        toggleContadorButton('Finalizar');
        iniciarContador(new Date(data.tiempo_inicio));
    });
});