from gpiozero import Servo
from gpiozero.pins.pigpio import PiGPIOFactory
from time import sleep

pin_servo = 13

factory = PiGPIOFactory()
servo = Servo(pin_servo, pin_factory=factory)
servo.value = 0.4  # Posición inicial del servo (ajusta según sea necesario)

try:
    # Cierra el servo
    servo.value = -0.8
    print("Motor abierto.")
    # Puedes ajustar el tiempo de espera según sea necesario
    sleep(0.5)

except KeyboardInterrupt:
    print("\nPrograma interrumpido manualmente.")

finally:
    # Limpieza de pines GPIO
    servo.close()
