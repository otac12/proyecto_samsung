from flask import Flask, request
from gpiozero import Servo, DigitalOutputDevice
import threading
import subprocess
from time import sleep
import atexit
from concurrent.futures import ThreadPoolExecutor
import tarjeta_leer
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

@app.route('/cargar', methods=['POST'])
def cargar():
    data=request.json
    accion =data.get('cargar')
    
    if accion == False:
        pin_rele = 23
        rele = DigitalOutputDevice(pin_rele)
        rele.on()   # Activa el relé 
        rele.close()
        

@app.route('/anclaje', methods=['POST'])
def anclaje():
    data=request.json
    accion =data.get('accion')
    vehiculo = data.get('vehiculo') 
    carga=data.get('cargar')
    
    print("esta sera la accion a realizar"+accion)
    print(accion)
    print(vehiculo)
    print("Estado carga: %s" % carga)
    
    if accion == 'abrir' and vehiculo == 'Scooter':
        print("se cerro el scooter")

        # Ruta al programa Python que deseas ejecutar
        programa_path = 'abrir.py'
        
        
        
        if carga==True:
            print("Estado carga: Cargando")
            pin_rele = 23
            rele = DigitalOutputDevice(pin_rele)
            rele.off()   # Activa el relé 
            rele.close()
        else: 
            print("Sin carga")
            
        # Llamada al sistema para ejecutar el programa
        resultado = subprocess.check_output(['python3', programa_path], stderr=subprocess.STDOUT, text=True)
        
        # Llamada al sistema para ejecutar el programa
        print("Puede ingresar su vehiculo")
        subprocess.Popen(['python3', 'push2.py',vehiculo])
        
        
        
    elif accion == 'abrir' and vehiculo == 'Bicicleta':
        print("se cerro la bicicleta")

        # Ruta al programa Python que deseas ejecutar
        programa_path = 'abrirb.py'
        
        # Llamada al sistema para ejecutar el programa
        resultado = subprocess.check_output(['python3', programa_path], stderr=subprocess.STDOUT, text=True)  
        
        # Llamada al sistema para ejecutar el programa
        print("Puede ingresar su vehiculo")
        subprocess.Popen(['python3', 'push2.py',vehiculo]) 
        
    elif accion == 'cerrar' and vehiculo == 'Scooter':
        print("se abrio el scooter")
        
        
        resultado = subprocess.check_output(['python3', 'abrir.py'], stderr=subprocess.STDOUT, text=True)
       
        
        
    elif accion == 'cerrar' and vehiculo == 'Bicicleta':
        print("se abrio la Bici")
        resultado = subprocess.check_output(['python3', 'abrirb.py'], stderr=subprocess.STDOUT, text=True)
        
                
    else:
        print("no se encuentra la accion")

    return "Accion realizada con exito", 200
    

hilo_rfid = threading.Thread(target=tarjeta_leer.leer)
hilo_rfid.start()

if __name__ == '__main__':
    
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
