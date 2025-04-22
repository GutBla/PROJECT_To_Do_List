"""
Modelos de Base de Datos para Aplicación Flask
-------------------------------------------------------
Define los modelos SQLAlchemy para la gestión de usuarios, categorías y tareas.
Incluye relaciones entre tablas y métodos para manejo de contraseñas seguras.
"""

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# Configuración de la base de datos ----------------------
db = SQLAlchemy()

# Modelo de Usuario ----------------------

class Usuario(db.Model):
    """Modelo para la tabla de usuarios del sistema"""
    
    __tablename__ = 'Usuario'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    nombre_completo = db.Column(db.String(255), nullable=False)
    fecha_creacion = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    fecha_actualizacion = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    
    def set_password(self, password):
        """Genera hash seguro para la contraseña"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verifica si la contraseña coincide con el hash almacenado"""
        return check_password_hash(self.password_hash, password)

# Modelo de Categorías Predeterminadas ----------------------

class CategoriaPredeterminada(db.Model):
    """Modelo para categorías predefinidas del sistema"""
    
    __tablename__ = 'CategoriaPredeterminada'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(255), unique=True, nullable=False)
    descripcion = db.Column(db.Text)

# Modelo de Categorías de Usuario ----------------------

class Categoria(db.Model):
    """Modelo para categorías personalizadas de usuarios"""
    
    __tablename__ = 'Categoria'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('Usuario.id'), nullable=False, index=True)
    categoria_predeterminada_id = db.Column(db.Integer, db.ForeignKey('CategoriaPredeterminada.id'))
    es_predeterminada = db.Column(db.Boolean, default=False)
    fecha_creacion = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    fecha_actualizacion = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    
    usuario = db.relationship('Usuario', backref='categorias')
    categoria_predeterminada = db.relationship('CategoriaPredeterminada')

# Modelo de Tareas ----------------------

class Tarea(db.Model):
    """Modelo principal para la gestión de tareas"""
    
    __tablename__ = 'Tarea'
    id = db.Column(db.Integer, primary_key=True)
    categoria_id = db.Column(db.Integer, db.ForeignKey('Categoria.id'), index=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('Usuario.id'), nullable=False, index=True)
    titulo = db.Column(db.String(255), nullable=False)
    descripcion = db.Column(db.Text)
    estado = db.Column(db.Enum('NUEVA', 'EN_PROGRESO', 'COMPLETADA', 'PENDIENTE'), default='NUEVA', index=True)
    fecha_vencimiento = db.Column(db.Date, index=True)
    fecha_creacion = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    fecha_actualizacion = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    fecha_completado = db.Column(db.TIMESTAMP)
    
    categoria = db.relationship('Categoria', lazy='joined')
    usuario = db.relationship('Usuario', backref='tareas')
    usuarios_compartidos = db.relationship('UsuarioTarea', backref='tarea', cascade='all, delete-orphan')
    
    @property
    def usuarios_compartidos(self):
        """Obtiene los usuarios con acceso a esta tarea"""
        return UsuarioTarea.query.filter_by(tarea_id=self.id).join(Usuario).all()

# Modelo de Tareas Compartidas ----------------------

class UsuarioTarea(db.Model):
    """Modelo para la relación muchos-a-muchos entre usuarios y tareas compartidas"""
    
    __tablename__ = 'Usuario_Tarea'
    usuario_id = db.Column(db.Integer, db.ForeignKey('Usuario.id'), primary_key=True)
    tarea_id = db.Column(db.Integer, db.ForeignKey('Tarea.id'), primary_key=True, index=True)
    fecha_asignacion = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    permisos = db.Column(db.Enum('LECTURA', 'ESCRITURA', 'PROPIETARIO'), default='LECTURA')
    
    usuario = db.relationship('Usuario', backref='tareas_compartidas')

# Modelo de Log de Tareas Eliminadas ----------------------

class LogTareaEliminada(db.Model):
    """Modelo para registrar tareas eliminadas (histórico)"""
    
    __tablename__ = 'LogTareaEliminada'
    id = db.Column(db.Integer, primary_key=True)
    tarea_id = db.Column(db.Integer, nullable=False)
    usuario_id = db.Column(db.Integer, nullable=False)
    titulo = db.Column(db.String(255), nullable=False)
    descripcion = db.Column(db.Text)
    estado = db.Column(db.Enum('NUEVA', 'EN_PROGRESO', 'COMPLETADA', 'PENDIENTE'), nullable=False)
    fecha_vencimiento = db.Column(db.Date)
    fecha_completado = db.Column(db.TIMESTAMP)
    fecha_eliminacion = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    
    def __repr__(self):
        return f"<LogTareaEliminada {self.id} - Tarea {self.tarea_id}>"