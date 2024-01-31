from mfrc522 import SimpleMFRC522
from gpiozero import LED
import json

pin=20

led=LED(20)

data={"id":"2","vehiculo":"Bicicleta"}

rdr = SimpleMFRC522()
print("Coloca una tarjeta RFID en blanco cerca del lector...")

print("Esperando a que se coloque la tarjeta...")
id, text = rdr.read()
led.on()
print("Tarjeta detectada con ID: {}".format(id))

json_data=json.dumps(data)

rdr.write(json_data)

print("Datos escritos en la tarjeta RFID:", data)
led.off()
