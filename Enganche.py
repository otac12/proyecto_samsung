from gpiozero import AngularServo
from time import sleep

print("Se movera motor")

servo= AngularServo(17,min_pulse_width=0.0006, max_pulse_width=0.0023)

while (True):
    respuesta=input("Cerrar o abrir")

    if respuesta=="Cerrar":
        servo.angle=180
    
    if respuesta=="abrir":
        servo.angle=0




