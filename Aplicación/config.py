class Config:
    SECRET_KEY = 'B!1weNAt1T^%kvhUI*S^'

class DevelopmentConfig(Config):
    DEBUG = True                  # Activa el modo de depuración en Flask
    MYSQL_HOST = 'localhost'      # Dirección del servidor MySQL
    MYSQL_USER = 'root'           # Usuario de la base de datos
    # MYSQL_PASSWORD = '123456'     # Contraseña del usuario de la base de datos
    MYSQL_DB = 'flask_login'      # Nombre de la base de datos a utilizar
    MYSQL_PORT = 3306             # Puerto para la conexión MySQL (El mio es 3307- Normal: 3306)


# Diccionario para acceder a las configuraciones según el entorno.
config = {
    'development': DevelopmentConfig,
}