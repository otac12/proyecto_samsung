from gpiozero import Servo

pin = 22

servo= Servo(pin)

servo.value=-1

while True:

    accion=input("Ingrese su accion")

    if accion== "cerrar":
        print("se cerror el scooter")
        servo.value=0

    elif accion== "abrir":
        print("se abrio el scooter")
        servo.value=-1
    else:

        print("no se encuentra la acción")
    


