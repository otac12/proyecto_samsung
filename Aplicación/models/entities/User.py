from werkzeug.security import check_password_hash

class User:
    def __init__(self, id_usuario, correo, contrasena, nombre=""):
        self.id_usuario = id_usuario
        self.correo = correo
        self.contrasena = contrasena
        self.nombre = nombre

    @classmethod
    def check_contrasena(cls, contrasena_hasheada, contrasena):
        return check_password_hash(contrasena_hasheada, contrasena)

        