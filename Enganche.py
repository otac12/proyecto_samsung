from gpiozero import Servo
from time import sleep

print("Se movera motor")

servo= Servo(17,min_pulse_width = 1.0,max_pulse_width = 2.0)

servo.value=-1

while (True):
    respuesta=input("Cerrar o abrir")

    if respuesta=="Cerrar":
        servo.value=1
    
    if respuesta=="abrir":
        servo.value=0




