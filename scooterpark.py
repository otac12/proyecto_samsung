from flask import Flask, render_template, request
from gpiozero import Servo,Button

pinmotor = 22
servo= Servo(pinmotor)

servo.value=-1

app = Flask(__name__)

@app.route('/anclaje', methods=['POST'])
def anclaje():
    accion = request.form.get('accion') 
    print("esta sera la accion a realizar"+accion)

    if accion == "cerrar":
        print("se cerro el scooter")
        servo.value=0.4
    elif accion == "abrir":
       print("se abrio el scooter")
       servo.value=-1
    else:
        print("no se encuentra la acción")


if __name__ == '__main__':
    app.run(debug=True)