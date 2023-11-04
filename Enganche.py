from gpiozero import AngularServo
from time import sleep

print("Se movera motor")

servo= AngularServo(17)
myCorrection=0.45
maxPW=(2.0+myCorrection)/1000
minPW=(1.0-myCorrection)/1000

print("Max:"+ str(maxPW)+"\n min:"+ str(minPW))

servo.angle=0

while (True):
    respuesta=input("Cerrar o abrir",min_pulse_width=minPW,max_pulse_width=maxPW)

    if respuesta=="Cerrar":
        servo.angle=90
    
    if respuesta=="abrir":
        servo.angle=0




