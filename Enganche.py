from gpiozero import AngularServo
from time import sleep

print("Se movera motor")

servo= AngularServo(17,min_pulse_width=0.0006, max_pulse_width=0.0023)

servo.angle(0)




