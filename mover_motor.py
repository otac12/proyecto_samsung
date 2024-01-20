from gpiozero import Servo,Button

pin = 22
pinfinal = 27

servo= Servo(pin)
final=Button(pinfinal)

servo.value=0.6

while True:

    accion=input("Ingrese su accion")

    if accion== "cerrar":
        print("se cerro el scooter")
        servo.value=-1

    elif accion== "abrir":
        print("se abrio el scooter")
        servo.value=0.6
    else:

        print("no se encuentra la acción")
    


