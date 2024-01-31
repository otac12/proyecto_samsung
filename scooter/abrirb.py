from gpiozero import Servo
from time import sleep

pin_servo = 16

servo = Servo(pin_servo)
servo.value = 1  # Posición inicial del servo (ajusta según sea necesario)

try:
    
    servo.value = 1
    print("Motor abierto.")
    # Puedes ajustar el tiempo de espera según sea necesario
    sleep(0.5)

except KeyboardInterrupt:
    print("\nPrograma interrumpido manualmente.")

finally:
    # Limpieza de pines GPIO
    servo.close()
