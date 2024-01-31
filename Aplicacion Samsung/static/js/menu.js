// Espera a que el DOM esté completamente cargado antes de ejecutar el script
document.addEventListener('DOMContentLoaded', function() {
    // Inicialización del socket
    const socket = io();                

    let contadorActivo = false;
    let contadorInterval;
    let vehiculoSeleccionado = null;
    let cargar = false;
    let tarjetaNFCVinculada = false;
    const URL_ANCLAJE = 'http://10.87.15.80:5000/anclaje';

    // Event listeners para botones y elementos
    const btnIniciar = document.getElementById('BtnIniciar');
    const btnBici = document.getElementById('bici');
    const btnScooter = document.getElementById('scooter');
    const btnNFC = document.getElementById('btnNFC'); // Asegúrate de que este ID exista en tu HTML
    const btnCargar = document.getElementById('btnCargar');
    const botonAlerta = document.getElementById('botonAlerta');
    const divAlertaTiempo = document.getElementById('alertaTiempo');
    const divForsejeo = document.getElementById('alertaForsejeo');
    const rfid = document.getElementById('rfid');
    const imgCargar = document.getElementById('imgCargar');
    const imgNoCarg = document.getElementById('imgNoCarg');
    const puertoLocalizacion = document.getElementById('puertoLocalizacion');
    const puertoLocalizacion2 = document.getElementById('puertoLocalizacion2');
    const puertoc = document.getElementById('puertoc');

    /*  FUNCIONES PARA MENEJAR EVENTOS  */
    // Función para manejar la selección del vehículo
    function seleccionarVehiculo(vehiculo) {
        document.getElementById('bici').classList.remove('activo');
        document.getElementById('scooter').classList.remove('activo');

        if (vehiculo === 'Bicicleta') {
            document.getElementById('bici').classList.add('activo');
        } else if (vehiculo === 'Scooter') {
            document.getElementById('scooter').classList.add('activo');
        }
        vehiculoSeleccionado = vehiculo;
        // Enviar la selección del vehículo al servidor
        enviarSeleccionVehiculo(vehiculo);
        actualizarPuerto(vehiculo);
    }

    // Función para actualizar la información del puerto
    function actualizarPuerto(vehiculo) {
        if (vehiculo === 'Scooter') {
            puertoLocalizacion.textContent = 'SP-001 República de Salvador -';
            puertoLocalizacion2.textContent = 'Pino Suarez';
            puertoc.textContent = 'A001';
        } else if (vehiculo === 'Bicicleta') {
            puertoLocalizacion.textContent = 'SP-002 Nezahualcóyotl -';
            puertoLocalizacion2.textContent = 'Isabel la Católica';
            puertoc.textContent = 'A002';
        } 
    }

    // Event listeners para selección de vehículos (que no se cambie mientras se haya iniciado)
    /*if (btnBici && btnScooter) {
        btnBici.addEventListener('click', function() {
            if (!contadorActivo) {
                seleccionarVehiculo('Bicicleta');
            } else {
                Swal.fire({
                    icon: 'error',
                    title: '¡Error!',
                    text: 'No puedes cambiar de vehículo mientras el contador está activo.',
                    confirmButtonColor: "#69CBBA",
                    confirmButtonText: 'Aceptar'
                });
            }
        });
        btnScooter.addEventListener('click', function() {
            if (!contadorActivo) {
                seleccionarVehiculo('Scooter');
            } else {
                Swal.fire({
                    icon: 'error',
                    title: '¡Error!',
                    text: 'No puedes cambiar de vehículo mientras el contador está activo.',
                    confirmButtonColor: "#69CBBA",
                    confirmButtonText: 'Aceptar'
                });
            }
        });
    }*/

    /*      FUNCIÓN DE PETICIONES AL SERVIDOR       */
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

    // Función para vincular la tarjeta NFC
    function enlazarNFC(numeroNFC) {
        fetch('/enlazar_nfc', {
            method: 'POST',
            body: JSON.stringify({ nfc_number: numeroNFC }),
            headers: { 'Content-Type': 'application/json' },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.estado === 'Éxito') {
                tarjetaNFCVinculada = true; // Actualiza el estado de la tarjeta NFC
                Swal.fire({
                    icon: 'success',
                    title: '¡Vinculado!',
                    text: 'Tarjeta RFID enlazada con éxito.',
                    confirmButtonColor: "#69CBBA",
                    confirmButtonText: 'Aceptar'
                });
            } else {
                tarjetaNFCVinculada = false;
                Swal.fire({
                    icon: 'error',
                    title: '¡Error!',
                    text: data.mensaje,
                    confirmButtonColor: "#69CBBA",
                    confirmButtonText: 'Aceptar'
                });
            }
        })
        .catch(error => {
            tarjetaNFCVinculada = false;
            console.error('Error al enlazar la tarjeta NFC:', error);
            Swal.fire({
                icon: 'error',
                title: '¡Error!',
                text: 'No se pudo enlazar la tarjeta NFC.',
                confirmButtonColor: "#69CBBA",
                confirmButtonText: 'Aceptar'
            });
        });
    }

    // Verificar si hay una tarjeta NFC enlazada
    function verificarTarjetaNFC() {
        fetch('/verificar_nfc')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                tarjetaNFCVinculada = data.tarjetaNFCVinculada;
                if (!tarjetaNFCVinculada) {
                    // Si no hay tarjeta vinculada, muestra una alerta o haz algo
                    Swal.fire({
                        icon: 'error',
                        title: '¡Error!',
                        text: 'No hay una tarjeta NFC vinculada. Por favor, vincula una tarjeta para continuar.',
                        confirmButtonColor: "#69CBBA",
                        confirmButtonText: 'Aceptar'
                    });
                }
            })
            .catch(error => {
                console.error('Error al verificar la tarjeta NFC:', error);
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

    /*      OTRAS FUNCIONES     */

    // Función para mostrar el cuadro de diálogo NFC
    function mostrarDialogoNFC() {
        document.getElementById('dialogoNFC').classList.add('dialogo-visible');
    }

    // Cambiar la la Imagen dependiendo de el botón de carga
    function actualizarEstadoCargaImagen() {
        imgCargar.style.display = cargar ? 'block' : 'none';
        imgNoCarg.style.display = cargar ? 'none' : 'block';
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
        // Asegúrate de que el tiempo de inicio existe antes de iniciar el contador
        if (tiempoInicio) {
            clearInterval(contadorInterval);
            const inicio = new Date(tiempoInicio).getTime();
            contadorInterval = setInterval(() => {
                const ahora = Date.now();
                const transcurrido = new Date(ahora - inicio);
                formatearTiempo(transcurrido);
            }, 1000);
        }
    }

    // Función para dar formato al tiempo transcurrido
    function formatearTiempo(tiempo) {
        let horas = tiempo.getUTCHours();
        let minutos = tiempo.getUTCMinutes();
        let segundos = tiempo.getUTCSeconds();

        document.getElementById('ca').textContent = horas < 10 ? "0" + horas : horas;
        document.getElementById('cd').textContent = minutos < 10 ? "0" + minutos : minutos;
        document.getElementById('cg').textContent = segundos < 10 ? "0" + segundos : segundos;
        
        // Ver cuando el contador llegue antes de los minutos. 
        if (horas === 0 && minutos === 1 && segundos === 50) {
            activarAlertaTiempo();
        } else if (minutos > 1 || (minutos === 2 && segundos > 0)) {
            cambiarColorContador(true);
        }
    }

    // Activar alerta de tiempo
    function activarAlertaTiempo() {
        divAlertaTiempo.classList.add('parpadeo', 'boton-activo');
        divAlertaTiempo.addEventListener('click', desactivarAlertaTiempo);
    }
    
    // Desactivar alerta de tiempo
    function desactivarAlertaTiempo() {
        divAlertaTiempo.classList.remove('parpadeo', 'boton-activo');
        divAlertaTiempo.removeEventListener('click', desactivarAlertaTiempo);
    }

    // Cambiar color del contador
    function cambiarColorContador(activo) {
        const elementosContador = document.querySelectorAll('#contador p');
        if (activo) {
            elementosContador.forEach(elemento => elemento.classList.add('contador-rojo'));
        } else {
            elementosContador.forEach(elemento => elemento.classList.remove('contador-rojo'));
        }
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
                // Verificar si hay una Tarjeta
                /*if (!tarjetaNFCVinculada) {
                    Swal.fire({
                        icon: 'error',
                        title: '¡Error!',
                        text: 'Por favor, vincula una tarjeta NFC para continuar.',
                        confirmButtonColor: "#69CBBA",
                        confirmButtonText: 'Aceptar'
                    });
                    return;
                }*/
                verificarTarjetaNFC();
                // Verificar si se selecciono algún vehiculo
                if (!vehiculoSeleccionado) {
                    Swal.fire({
                        icon: 'error',
                        title: '¡Error!',
                        text: 'Por favor, selecciona un vehículo para continuar.',
                        confirmButtonColor: "#69CBBA",
                        confirmButtonText: 'Aceptar'
                    });
                    //alert('Por favor, selecciona un vehículo para continuar.');
                    return;
                }

                // Enviar la acción y el estado de carga al servidor
                enviarAccion('abrir', vehiculoSeleccionado, cargar);
                //actualizarPuerto(vehiculo);

                //socket.emit('obtener_inicio', { vehiculo: vehiculoSeleccionado, cargar: cargar });
            } else {
                enviarAccion('cerrar', vehiculoSeleccionado, cargar);
                socket.emit('finalizar_contador');
                cambiarColorContador(false);
                if (divAlertaTiempo.classList.contains('parpadeo')) {
                    desactivarAlertaTiempo(); // Desactivar alerta de tiempo si está activa
                }
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
        divForsejeo.classList.add('parpadeo');
    }

    // Función para desactivar la alerta de Forsejeo
    function desactivarAlertaForsejeo() {
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

    socket.on('accion_inicio', function(data){
        if (data.status == 'cerrado'){
                socket.emit('obtener_inicio', { vehiculo: vehiculoSeleccionado, cargar: cargar });
        }
    });

    socket.on('accion_tarjeta', function(data) {
        if (data.status == 'cerrado') {
            socket.emit('obtener_inicio', { vehiculo: vehiculoSeleccionado, cargar: cargar });
        }
    });

    // Socket para menejar el botón de inicio cuando se utiliza la tarjeta
    /*socket.on('accion_tarjeta', function(data){
        if (data.accion == 'abrir'){
            if (contadorActivo){
                socket.emit('finalizar_contador');
                cambiarColorContador(false);
                if (divAlertaTiempo.classList.contains('parpadeo')) {
                    desactivarAlertaTiempo(); // Desactivar alerta de tiempo si está activa
                }
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

    });*/

    // Socket listeners para manejar eventos del servidor
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

    // Mensajes de error
    /*socket.on('error', function(data) {
        console.error('Error:', data.mensaje);
        alert('Error: ' + data.mensaje);
    });*/

    // Socket listeners para manejar eventos del servidor
    socket.emit('cargar_estado_contador');

    // Socket listener para el evento 'actualizar_tiempo'
    socket.on('actualizar_tiempo', function(data) {
        if (data.tiempo_inicio) {
            contadorActivo = true;
            toggleContadorButton('Finalizar');
            iniciarContador(new Date(data.tiempo_inicio));
        }
    });
});