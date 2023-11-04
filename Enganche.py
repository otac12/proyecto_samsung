from gpiozero import AngularServo
from time import sleep

print("Se movera motor")

servo= AngularServo(17)

servo.angle=0

while (True):
    respuesta=input("Cerrar o abrir")

    if respuesta=="Cerrar":
        servo.angle=90
    
    if respuesta=="abrir":
        servo.angle=0




