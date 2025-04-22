"""
Configuración de la Aplicación Flask
-------------------------------------------------------
Maneja la configuración centralizada de la aplicación Flask,
incluyendo conexión a base de datos MySQL y variables de entorno.
Utiliza python-dotenv para cargar variables sensibles desde un archivo .env
y genera una clave secreta segura para la aplicación.
"""

import os
from dotenv import load_dotenv
import secrets

# Cargar variables de entorno desde el archivo .env
load_dotenv()

class Config:
    """Configuración principal de la aplicación Flask
    
    Attributes:
        MYSQL_HOST (str): Host de la base de datos MySQL
        MYSQL_USER (str): Usuario de MySQL
        MYSQL_PASSWORD (str): Contraseña de MySQL
        MYSQL_DB (str): Nombre de la base de datos
        MYSQL_PORT (str): Puerto de conexión a MySQL
        
        SQLALCHEMY_DATABASE_URI (str): URI de conexión para SQLAlchemy
        SECRET_KEY (str): Clave secreta generada automáticamente
        SQLALCHEMY_TRACK_MODIFICATIONS (bool): Flag para seguimiento de modificaciones
    """
    
    MYSQL_HOST = os.getenv('MYSQL_HOST')
    MYSQL_USER = os.getenv('MYSQL_USER')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
    MYSQL_DB = os.getenv('MYSQL_DB')
    MYSQL_PORT = os.getenv('MYSQL_PORT')
    
    SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}'
    SECRET_KEY = secrets.token_hex(16)
    SQLALCHEMY_TRACK_MODIFICATIONS = False