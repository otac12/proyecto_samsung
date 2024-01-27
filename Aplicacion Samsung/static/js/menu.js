// Espera a que el DOM esté completamente cargado antes de ejecutar el script
document.addEventListener('DOMContentLoaded', function() {
    // Inicialización del socket
    const socket = io();                

    let contadorActivo = false;
    let contadorInterval;
    let vehiculoSeleccionado = null;
    let cargar = false;

    const URL_ANCLAJE = 'http://10.87.15.80:5000/anclaje';

    /* FUNCIONES */
    // Función para manejar la selección del vehículo
    function seleccionarVehiculo(vehiculo) {
        document.getElementById('bici').classList.remove('activo');
        document.getElementById('scooter').classList.remove('activo');

        if (vehiculo === 'Bicicleta') {
            document.getElementById('bici').classList.add('activo');
        } else if (vehiculo === 'Scooter') {
            document.getElementById('scooter').classList.add('activo');
        }

        // Enviar la selección del vehículo al servidor
        fetch('/seleccionar_vehiculo', {
            method: 'POST',
            body: JSON.stringify({ vehiculo: vehiculo }),
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => response.json())
        .then(data => {
            console.log('Selección de vehículo guardada:', data);
        })
        .catch((error) => {
            console.error('Error al guardar la selección de vehículo:', error);
        });

        vehiculoSeleccionado = vehiculo;
    }

    // Función para manejar la selección
    function enviarAccion(accion, vehiculo = null) {
        const payload = vehiculo ? { accion: accion, vehiculo: vehiculo } : { accion: accion };
    
        fetch(URL_ANCLAJE, {
            method: 'POST',
            body: JSON.stringify(payload),
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

    // Event listeners para botones y elementos
    const btnIniciar = document.getElementById('BtnIniciar');
    const btnBici = document.getElementById('bici');
    const btnScooter = document.getElementById('scooter');
    const btnNFC = document.getElementById('btnNFC'); // Asegúrate de que este ID exista en tu HTML
    const btnCargar = document.getElementById('btnCargar');
    const botonAlerta = document.getElementById('botonAlerta');
    const rfid = document.getElementById('rfid');

    var imgCargar = document.getElementById('imgCargar');
    var imgNoCarg = document.getElementById('imgNoCarg');

    // Event listener para el botón de inicio
    if (btnIniciar) {
        btnIniciar.addEventListener('click', function() {
            if (!contadorActivo) {
                if (!vehiculoSeleccionado) {
                    alert('Por favor, selecciona un vehículo para continuar.');
                    return;
                }
                enviarAccion('cerrar');


                fetch(URL_ANCLAJE, {
                    method: 'POST',
                    body: JSON.stringify({ vehiculo: vehiculoSeleccionado }),
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


                socket.emit('obtener_inicio', { vehiculo: vehiculoSeleccionado, cargar: cargar });
            } else {
                enviarAccion('abrir');
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

    // Funciónpara actualizar la hora del div con la hora actual. 
    function actualizarHora() {
        const ahora = new Date();
        const horas = ahora.getHours().toString().padStart(2, '0');
        const minutos = ahora.getMinutes().toString().padStart(2, '0');
        const tiempo = horas + ':' + minutos;
    
        document.querySelector('#rb p').textContent = tiempo;
    }
    
    // Actualiza la hora al cargar y cada minuto
    actualizarHora();
    setInterval(actualizarHora, 60000);

    // Función para actualizar la fecha actual
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
    
    // Actualiza la fecha inmediatamente al cargar
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

            // Cambiar Imagenes
            if (cargar) {
                // Imagen cargando
                imgCargar.style.display = 'block'; 
                imgNoCarg.style.display = 'none';
            } else {
                // Imagen no cargar
                imgCargar.style.display = 'none';  
                imgNoCarg.style.display = 'block';
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

    // Socket para menejar el botón de inicio
    socket.on('estado_tarjeta', function(data) {
        if (data.tarjeta_recibida == true) {
            if (!contadorActivo) {
                // Cuando el contardor esta inactivo (no se ha iniciado)
                if (!vehiculoSeleccionado) {
                    alert('Por favor, selecciona un vehículo para continuar.');
                    return;
                }
                //enviarAccion('cerrar');
                
                if (cargar) {
                    fetch(URL_ANCLAJE, {
                        method: 'POST',
                        body: JSON.stringify({ vehiculo: vehiculoSeleccionado }),
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
    
                socket.emit('obtener_inicio', { vehiculo: vehiculoSeleccionado, cargar: cargar });
            } else {
                // Cuando el contador esta activado (dar en finalizar)
                //enviarAccion('abrir');
                socket.emit('finalizar_contador');
            }
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
