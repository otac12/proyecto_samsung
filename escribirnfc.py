                                                                                    
from mfrc522 import SimpleMFRC522
import json

data={"id_cliente":"1"}

rdr = SimpleMFRC522()
print("Coloca una tarjeta RFID en blanco cerca del lector...")

print("Esperando a que se coloque la tarjeta...")
id, text = rdr.read()

print("Tarjeta detectada con ID: {}".format(id))

json_data=json.dumps(data)

rdr.write(json_data)

print("Datos escritos en la tarjeta RFID:", data)