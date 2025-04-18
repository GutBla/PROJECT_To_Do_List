from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# Inicialización de la base de datos con SQLAlchemy
# -------------------------------------------------
db = SQLAlchemy()

# Modelos de la base de datos ----------------------
class Usuario(db.Model):
    __tablename__ = 'Usuario'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    nombre_completo = db.Column(db.String(255), nullable=False)
    fecha_creacion = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    fecha_actualizacion = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class CategoriaPredeterminada(db.Model):
    __tablename__ = 'CategoriaPredeterminada'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(255), unique=True, nullable=False)
    descripcion = db.Column(db.Text)

class Categoria(db.Model):
    __tablename__ = 'Categoria'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('Usuario.id'), nullable=False)
    categoria_predeterminada_id = db.Column(db.Integer, db.ForeignKey('CategoriaPredeterminada.id'))
    es_predeterminada = db.Column(db.Boolean, default=False)
    fecha_creacion = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    fecha_actualizacion = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    
    usuario = db.relationship('Usuario', backref='categorias')
    categoria_predeterminada = db.relationship('CategoriaPredeterminada')

class Tarea(db.Model):
    __tablename__ = 'Tarea'
    id = db.Column(db.Integer, primary_key=True)
    categoria_id = db.Column(db.Integer, db.ForeignKey('Categoria.id'))
    usuario_id = db.Column(db.Integer, db.ForeignKey('Usuario.id'), nullable=False)
    titulo = db.Column(db.String(255), nullable=False)
    descripcion = db.Column(db.Text)
    estado = db.Column(db.Enum('NUEVA', 'EN_PROGRESO', 'COMPLETADA', 'PENDIENTE'), default='NUEVA')
    fecha_vencimiento = db.Column(db.Date)
    fecha_creacion = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    fecha_actualizacion = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    fecha_completado = db.Column(db.TIMESTAMP)
    
    categoria = db.relationship('Categoria', lazy='joined')
    usuario = db.relationship('Usuario', backref='tareas')
    usuarios_compartidos = db.relationship('UsuarioTarea', backref='tarea', cascade='all, delete-orphan')
    @property
    def usuarios_compartidos(self):
        return UsuarioTarea.query.filter_by(tarea_id=self.id).join(Usuario).all()

class UsuarioTarea(db.Model):
    __tablename__ = 'Usuario_Tarea'
    usuario_id = db.Column(db.Integer, db.ForeignKey('Usuario.id'), primary_key=True)
    tarea_id = db.Column(db.Integer, db.ForeignKey('Tarea.id'), primary_key=True)
    fecha_asignacion = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    permisos = db.Column(db.Enum('LECTURA', 'ESCRITURA', 'PROPIETARIO'), default='LECTURA')
    
    usuario = db.relationship('Usuario', backref='tareas_compartidas')