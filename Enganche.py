from gpiozero import Servo
from time import sleep

print("Se movera motor")

servo= Servo(17)

servo.value=0

while (True):
    respuesta=input("Cerrar o abrir")

    if respuesta=="Cerrar":
        servo.value=180/180
    
    if respuesta=="abrir":
        servo.value=0




