document.addEventListener("DOMContentLoaded", function () {
    var formularioRegistro = document.getElementById("registroForm");

    formularioRegistro.onsubmit = function () {
        var contrasena = document.getElementById("contrasena").value;
        var confirmar_contrasena = document.getElementById("confirmar_contrasena").value;
        if (contrasena != confirmar_contrasena) {
            alert("Las contraseñas no coinciden.");
            return false; // Evitar que el formulario se envíe
        }
        return true; // Permitir que el formulario se envíe
    };
});
