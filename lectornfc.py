from mfrc522 import SimpleMFRC522
from gpiozero import LED
import subprocess
import time
import json
import sys
import signal

pin=20
pin2=21

led=LED(pin)
ledrojo=LED(pin2)

rdr = SimpleMFRC522()

def manejar_terminacion(signal, frame):
    print("Proceso secundario recibió la señal de terminación")
    sys.exit(0)

signal.signal(signal.SIGTERM, manejar_terminacion)


def leer():
    while True:
        print("Coloca la tarjeta RFID cerca del lector...")

        print("Esperando a que se coloque la tarjeta...")
        id, text = rdr.read()
    
        print("Tarjeta detectada con ID: {}".format(id))
        print("Datos le dos desde la tarjeta RFID:", text)

        respuesta="429407900606"

        if respuesta==str(id):
            led.on()
            # Ruta al programa Python que deseas ejecutar
            programa_path = 'abrir.py'
        
            # Llamada al sistema para ejecutar el programa
            resultado = subprocess.check_output(['python3', programa_path], stderr=subprocess.STDOUT, text=True)

            print("Puede ingresar su vehiculo")
            time.sleep(2)
            led.off()
        else:
            ledrojo.on()
            print("Tu tarjeta fue denegada")
            time.sleep(2)
            ledrojo.off()

        data = json.loads(text)

        print("Datos le      dos desde la tarjeta RFID:", data)
