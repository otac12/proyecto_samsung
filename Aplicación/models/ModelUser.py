from .entities.User import User
from db import get_db_connection  
from werkzeug.security import check_password_hash, generate_password_hash

class ModelUser:
    @staticmethod
    def login(user):
        # Establecer conexión con la base de datos
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            # Ejecutar la consulta SQL para encontrar el usuario por correo electrónico
            cursor.execute('SELECT id, correo, contrasena, nombre FROM usuario WHERE correo = %s', (user.correo,))
            row = cursor.fetchone()
            
            # Verificar que existe un resultado y que la contraseña es correcta
            if row and check_password_hash(row['contrasena'], user.contrasena):
                # Crear y retornar una instancia de User con los datos obtenidos
                return User(row['id'], row['correo'], None, row['nombre']) 
            else:
                return None
        except Exception as ex:
            print(ex)
            return None
        finally:
            # Cerrar el cursor y la conexión
            cursor.close()
            conn.close()

    @staticmethod
    def register_user(user):
        # Conexión a la base de datos
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            # Generar hash de la contraseña
            hashed_password = generate_password_hash(user.contrasena)
            
            # Insertar el nuevo usuario en la base de datos
            cursor.execute('INSERT INTO usuario (nombre, correo, contrasena) VALUES (%s, %s, %s)',
                           (user.nombre, user.correo, hashed_password))
            conn.commit()  # Confirmar
            return True
        except Exception as ex:
            print(ex)
            return False
        finally:
            # Cerrar el cursor y la conexión
            cursor.close()
            conn.close()


