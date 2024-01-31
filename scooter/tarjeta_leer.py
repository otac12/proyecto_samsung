from mfrc522 import SimpleMFRC522
from gpiozero import LED
from gpiozero.pins.pigpio import PiGPIOFactory
import subprocess
import time
import json
import sys
import signal
import requests

pin = 17
pin2 = 27

pigpio_factory = PiGPIOFactory()

led=LED(pin, pin_factory=pigpio_factory)
ledrojo=LED(pin2, pin_factory=pigpio_factory)

rdr = SimpleMFRC522()

url='http://10.87.29.74:4999/recibir_tarjeta'

def leer():
    while True:
        print("Coloca la tarjeta RFID cerca del lector...")
        print("Esperando a que se coloque la tarjeta...")
        
        try:
            id, text = rdr.read()

            print("Tarjeta detectada con ID: {}".format(id))
            print("Datos le dos desde la tarjeta RFID:", text)
            
            idv = {"no": id}
            datos = json.dumps(idv)
            headers = {
                'Content-type': 'application/json',
                'Authorization': '123'
            }

            json_respuesta = requests.post(url, data=datos, headers=headers)
            print(json_respuesta.status_code)
            
            respuesta= json_respuesta.json()

            validacion= respuesta["validacion"]
        

            if validacion==True:
                led.on()

                print("Puede ingresar su vehiculo")
            
                subprocess.Popen(['python3', 'push2.py',"Scooter"])
                time.sleep(2)
                led.off()
            else:
                ledrojo.on()
                print("Tu tarjeta fue denegada")
                time.sleep(4)
                ledrojo.off()

            data = json.loads(text)

            print("Datos le      dos desde la tarjeta RFID:", data)
            
        except Exception as e:
            print("Error: ", str(e))
