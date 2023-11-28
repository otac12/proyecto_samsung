import pymysql
from config import config

def get_db_connection():
    try:
        # Conexión a la base de datos usando las credenciales y configuraciones.
        connection = pymysql.connect(
            host=config['development'].MYSQL_HOST,
            user=config['development'].MYSQL_USER,
            # password=config['development'].MYSQL_PASSWORD,
            db=config['development'].MYSQL_DB,
            charset='utf8mb4',  
            cursorclass=pymysql.cursors.DictCursor,  # Obtener datos como diccionario
            port=config['development'].MYSQL_PORT  # Porque use un puerto diferente 
        )
        return connection
    
    except pymysql.MySQLError as e:
        print(f"Error al conectar a MySQL: {e}")
        return None
