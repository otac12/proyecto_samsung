document.addEventListener('DOMContentLoaded', function() {
  // Verificar el estado del contador al cargar la página
  verificarEstadoContador();

  // Aquí supondre que el nombre del botón es inicar_contador
  document.getElementById('iniciar_contador').addEventListener('click', function() {
      // Obtener la duración que seleccoione el usuario
      let duracion = parseInt(document.getElementById('duracion').value); // Aquí supondré que se llamará duración en donde se eliga el tiempo
      iniciarContador(duracion);
  });
});

// Función para iniciar el contador en 
function iniciarContador(duracion) {
  // Hacer la petición para la función de inicar el contador
  fetch('/iniciar_contador', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ duracion: duracion }) // Enviar la duración
  })
  .then(response => response.json())
  .then(data => {
      if (data.estado === "Exito") {
          // Iniciar o reiniciar el contador en el frontend
          actualizarContador(new Date(data.tiempo_final).getTime());
      } else {
          console.error('Error al iniciar el contador:', data.mensaje);
      }
  })
  .catch((error) => {
      console.error('Error:', error);
  });
}

// Función para verificar el estado del contador y actualizarlo si es necesario
function verificarEstadoContador() {
  // Hacer una petición al servidor para obtener el tiempo final del contador
  fetch('/obtener_tiempo_final')
  .then(response => response.json())
  .then(data => {
      if (data.tiempo_final) {
          // Si hay un contador activo, actualiza el contador
          actualizarContador(new Date(data.tiempo_final).getTime());
      }
  })
  .catch((error) => {
      console.error('Error:', error);
  });
}

// Función para actualizar el contador
function actualizarContador(tiempoFinalMillis) {
  // Detener cualquier intervalo del contador que esté corriendo
  clearInterval(window.contadorInterval);
  let tiempoFinal = tiempoFinalMillis;

  // Establecer el intervalo para actualizar el contador cada segundo
  window.contadorInterval = setInterval(() => {
      // Calcular el tiempo restante en segundos
      let tiempoRestante = (tiempoFinal - new Date().getTime()) / 1000;

      if (tiempoRestante > 0) {
          // Si aún hay tiempo restante, actualizar el DOM con el tiempo formateado
          document.getElementById('display_contador').textContent = formatearTiempo(tiempoRestante);
      } else {
          // Si el contador llegó a 0, detener el intervalo y mostrar 00:00:00
          clearInterval(window.contadorInterval);
          document.getElementById('display_contador').textContent = '00:00:00';
      }
  }, 1000);
}

// Función para formatear el tiempo de segundos a HH:MM:SS
function formatearTiempo(segundos) {
  let horas = Math.floor(segundos / 3600);
  let minutos = Math.floor((segundos % 3600) / 60);
  let segundosRestantes = Math.floor(segundos % 60);

  return [horas, minutos, segundosRestantes]
      .map(v => v < 10 ? "0" + v : v)
      .join(':');
}
