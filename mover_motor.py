from gpiozero import Servo,Button

pin = 22
pinfinal = 27

servo= Servo(pin)
final=Button(pinfinal)

servo.value=-1

accion= "abrir"

def final():
    print("Final de carrera alcanzado.")

final.whenpressed = final

while True:
   
    accion = input("Ingresa la accion: ")
    
    if accion== "cerrar":
        print("se cerro el scooter")
        servo.value=0.4

    elif accion== "abrir":
        print("se abrio el scooter")
        servo.value=-1

    else:
        print("no se encuentra la acción")