
from gpiozero import AngularServo
from time import sleep

servo = AngularServo(17, min_angle=0, max_angle=-90)

while True:
    servo.angle = 0
    sleep(2)
    servo.angle = 90
    sleep(2)
    servo.angle = 180
    sleep(2)
    servo.angle = -90
    sleep(2)


