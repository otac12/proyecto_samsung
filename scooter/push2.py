from gpiozero import Servo, Button
from gpiozero.pins.pigpio import PiGPIOFactory
from signal import pause
import json
import requests
import subprocess
import sys

vehiculo=sys.argv[1]
factory = PiGPIOFactory()

pin_servo = 13
pin_final = 26

pin_servo_B = 16
pin_final_B = 21

servo = Servo(pin_servo,pin_factory=factory)
interruptor_final = Button(pin_final)

servoB = Servo(pin_servo_B,pin_factory=factory)
interruptor_finalB = Button(pin_final_B)


if vehiculo=="Scooter":
    servo.value=-1
    
else :
    servoB.value =-1

corriendo=1

url='http://10.87.29.74:4999/confirmacion'
url1='http://10.87.29.74:4999/recibir_alertas'
urlInicio = 'http://10.87.29.74:4999/accion_inicio'
urlTarjeta = 'http://10.87.29.74:4999/accion_tarjeta'

def final_carrera_presionado():
    servo.close()
    print("Final de carrera alcanzado. Cerrando el servo.")
    
    print(vehiculo)

    if vehiculo == "Scooter":
        subprocess.check_output(['python3', "cerray.py"], stderr=subprocess.STDOUT, text=True)
    else:
        subprocess.check_output(['python3', "cerrab.py"], stderr=subprocess.STDOUT, text=True)
    
    status={"status":"cerrado"}
    datos = json.dumps(status)
    headers = { 'Content-type': 'application/json','Authorization': '123'}

    json_respuesta = requests.post(urlInicio, data=datos, headers=headers)
    json_respuesta2 = requests.post(urlTarjeta, data=datos, headers=headers)
    print(json_respuesta.status_code)
    print(json_respuesta2.status_code)
    corriendo=2
    

def final_carrera_suelto():
    print("El final de carrera se soltó. ¡Alerta!")
    status = {"alerta": 1}
    datos = json.dumps(status)
    headers = { 'Content-type': 'application/json','Authorization': '123'}

    json_respuesta = requests.post(url1, data=datos, headers=headers)
    print(json_respuesta.status_code)

# Asociar funciones a eventos del interruptor final de carrera
interruptor_final.when_pressed = final_carrera_presionado
interruptor_final.when_released = final_carrera_suelto

interruptor_finalB.when_pressed = final_carrera_presionado
interruptor_finalB.when_released = final_carrera_suelto

while True:
    if corriendo == 2:
        print("esta cerrado el Scooter")

