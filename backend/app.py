from flask import Flask, jsonify, request, session, redirect, url_for, render_template
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from config import Config
import os

app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = os.environ['FLASK_SECRET_KEY']

db = SQLAlchemy(app)

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
    
    categoria = db.relationship('Categoria')
    usuario = db.relationship('Usuario', backref='tareas')
    usuarios_compartidos = db.relationship('UsuarioTarea', backref='tarea', cascade='all, delete-orphan')

class UsuarioTarea(db.Model):
    __tablename__ = 'Usuario_Tarea'
    usuario_id = db.Column(db.Integer, db.ForeignKey('Usuario.id'), primary_key=True)
    tarea_id = db.Column(db.Integer, db.ForeignKey('Tarea.id'), primary_key=True)
    fecha_asignacion = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    permisos = db.Column(db.Enum('LECTURA', 'ESCRITURA', 'PROPIETARIO'), default='LECTURA')
    
    usuario = db.relationship('Usuario', backref='tareas_compartidas')

def tiene_permiso_escritura(tarea_id, usuario_id):
    if Tarea.query.get(tarea_id).usuario_id == usuario_id:
        return True
    
    permiso = UsuarioTarea.query.filter_by(
        usuario_id=usuario_id,
        tarea_id=tarea_id
    ).first()
    
    return permiso and permiso.permisos in ('ESCRITURA', 'PROPIETARIO')

def es_propietario(tarea_id, usuario_id):
    return Tarea.query.get(tarea_id).usuario_id == usuario_id

@app.route('/')
def home():
    if 'user_id' in session:
        return redirect('/tareas')
    return redirect('/login')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = Usuario.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['user_name'] = user.nombre_completo
            return redirect('/tareas')
        return render_template('login.html', error="Credenciales inválidas")
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        nombre = request.form['nombre']
        
        if Usuario.query.filter_by(email=email).first():
            return render_template('register.html', error="El email ya está registrado")
            
        new_user = Usuario(email=email, nombre_completo=nombre)
        new_user.set_password(password)
        db.session.add(new_user)
        
        categorias_pred = CategoriaPredeterminada.query.all()
        for cat in categorias_pred[:3]:
            db.session.add(Categoria(
                usuario_id=new_user.id,
                categoria_predeterminada_id=cat.id,
                es_predeterminada=True
            ))
        
        db.session.commit()
        return redirect('/login')
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')

@app.route('/tareas')
def tareas():
    if 'user_id' not in session:
        return redirect('/login')
    
    usuario = Usuario.query.get(session['user_id'])
    categorias = Categoria.query.filter_by(usuario_id=usuario.id).all()
    
    return render_template('tareas.html', 
                         usuario=usuario,
                         categorias=categorias)

@app.route('/api/tareas', methods=['GET'])
def get_tareas():
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    tareas_propias = Tarea.query.filter_by(usuario_id=session['user_id']).all()
    
    tareas_compartidas = db.session.query(Tarea).join(UsuarioTarea).filter(
        UsuarioTarea.usuario_id == session['user_id']
    ).all()
    
    tareas = tareas_propias + tareas_compartidas
    
    return jsonify([{
        'id': t.id,
        'titulo': t.titulo,
        'descripcion': t.descripcion,
        'estado': t.estado,
        'fecha_vencimiento': t.fecha_vencimiento.isoformat() if t.fecha_vencimiento else None,
        'fecha_creacion': t.fecha_creacion.isoformat(),
        'categoria_id': t.categoria_id,
        'categoria_nombre': t.categoria.categoria_predeterminada.nombre if t.categoria and t.categoria.categoria_predeterminada else 'Personalizada',
        'es_propia': t.usuario_id == session['user_id'],
        'puede_editar': t.usuario_id == session['user_id'] or tiene_permiso_escritura(t.id, session['user_id']),
        'puede_eliminar': t.usuario_id == session['user_id']
    } for t in tareas])

@app.route('/api/tareas', methods=['POST'])
def create_tarea():
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    data = request.get_json()
    
    nueva_tarea = Tarea(
        titulo=data['titulo'],
        descripcion=data.get('descripcion'),
        estado='NUEVA',
        usuario_id=session['user_id'],
        categoria_id=data.get('categoria_id'),
        fecha_vencimiento=datetime.fromisoformat(data['fecha_vencimiento']).date() if data.get('fecha_vencimiento') else None
    )
    
    db.session.add(nueva_tarea)
    db.session.commit()
    
    db.session.add(UsuarioTarea(
        usuario_id=session['user_id'],
        tarea_id=nueva_tarea.id,
        permisos='PROPIETARIO'
    ))
    db.session.commit()
    
    return jsonify({
        'id': nueva_tarea.id,
        'mensaje': 'Tarea creada exitosamente'
    }), 201

@app.route('/api/tareas/<int:tarea_id>', methods=['GET'])
def get_tarea(tarea_id):
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    tarea = Tarea.query.get_or_404(tarea_id)
    
    if tarea.usuario_id != session['user_id'] and not UsuarioTarea.query.filter_by(
        usuario_id=session['user_id'],
        tarea_id=tarea_id
    ).first():
        return jsonify({'error': 'No tienes acceso a esta tarea'}), 403
    
    return jsonify({
        'id': tarea.id,
        'titulo': tarea.titulo,
        'descripcion': tarea.descripcion,
        'estado': tarea.estado,
        'fecha_vencimiento': tarea.fecha_vencimiento.isoformat() if tarea.fecha_vencimiento else None,
        'categoria_id': tarea.categoria_id,
        'usuario_id': tarea.usuario_id,
        'es_propia': tarea.usuario_id == session['user_id']
    })

@app.route('/api/tareas/<int:tarea_id>', methods=['PUT'])
def update_tarea(tarea_id):
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    tarea = Tarea.query.get_or_404(tarea_id)
    
    if not tiene_permiso_escritura(tarea_id, session['user_id']):
        return jsonify({'error': 'No tienes permisos para editar esta tarea'}), 403
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Datos no proporcionados'}), 400
        
    if 'titulo' in data:
        if not data['titulo'] or len(data['titulo']) > 255:
            return jsonify({'error': 'Título inválido'}), 400
        tarea.titulo = data['titulo']
        
    if 'descripcion' in data:
        tarea.descripcion = data['descripcion']
        
    if 'estado' in data:
        if data['estado'] not in ['NUEVA', 'EN_PROGRESO', 'COMPLETADA', 'PENDIENTE']:
            return jsonify({'error': 'Estado inválido'}), 400
        tarea.estado = data['estado']
        if data['estado'] == 'COMPLETADA' and tarea.estado != 'COMPLETADA':
            tarea.fecha_completado = db.func.current_timestamp()
        elif data['estado'] != 'COMPLETADA' and tarea.estado == 'COMPLETADA':
            tarea.fecha_completado = None
            
    if 'fecha_vencimiento' in data:
        try:
            tarea.fecha_vencimiento = datetime.fromisoformat(data['fecha_vencimiento']).date() if data['fecha_vencimiento'] else None
        except ValueError:
            return jsonify({'error': 'Formato de fecha inválido'}), 400
            
    if 'categoria_id' in data:
        if data['categoria_id']:
            categoria = Categoria.query.get(data['categoria_id'])
            if not categoria or categoria.usuario_id != session['user_id']:
                return jsonify({'error': 'Categoría inválida'}), 400
        tarea.categoria_id = data['categoria_id']
    
    db.session.commit()
    return jsonify({
        'mensaje': 'Tarea actualizada exitosamente',
        'tarea': {
            'id': tarea.id,
            'titulo': tarea.titulo,
            'estado': tarea.estado,
            'fecha_vencimiento': tarea.fecha_vencimiento.isoformat() if tarea.fecha_vencimiento else None
        }
    })

@app.route('/api/tareas/<int:tarea_id>', methods=['DELETE'])
def delete_tarea(tarea_id):
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    tarea = Tarea.query.get_or_404(tarea_id)
    
    if tarea.usuario_id != session['user_id']:
        return jsonify({'error': 'Solo el propietario puede eliminar la tarea'}), 403
    
    db.session.delete(tarea)
    db.session.commit()
    return jsonify({'mensaje': 'Tarea eliminada exitosamente'})

@app.route('/api/categorias', methods=['GET'])
def get_categorias():
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    categorias = Categoria.query.filter_by(usuario_id=session['user_id']).all()
    return jsonify([{
        'id': c.id,
        'nombre': c.categoria_predeterminada.nombre if c.categoria_predeterminada else 'Personalizada',
        'es_predeterminada': c.es_predeterminada,
        'descripcion': c.categoria_predeterminada.descripcion if c.categoria_predeterminada else None
    } for c in categorias])

@app.route('/api/tareas/<int:tarea_id>/compartir', methods=['POST'])
def compartir_tarea(tarea_id):
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    if not es_propietario(tarea_id, session['user_id']):
        return jsonify({'error': 'Solo el propietario puede compartir la tarea'}), 403
    
    data = request.get_json()
    usuario_email = data['email']
    permisos = data.get('permisos', 'LECTURA')
    
    usuario = Usuario.query.filter_by(email=usuario_email).first()
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    if usuario.id == session['user_id']:
        return jsonify({'error': 'No puedes compartir contigo mismo'}), 400
    
    existente = UsuarioTarea.query.filter_by(
        usuario_id=usuario.id,
        tarea_id=tarea_id
    ).first()
    
    if existente:
        return jsonify({'error': 'La tarea ya está compartida con este usuario'}), 400
    
    compartir = UsuarioTarea(
        usuario_id=usuario.id,
        tarea_id=tarea_id,
        permisos=permisos
    )
    db.session.add(compartir)
    db.session.commit()
    
    return jsonify({'mensaje': f'Tarea compartida con {usuario_email}'})

with app.app_context():
    if not CategoriaPredeterminada.query.first():
        categorias_pred = [
            ('Trabajo', 'Tareas relacionadas con el trabajo'),
            ('Personal', 'Tareas personales'),
            ('Estudio', 'Tareas de estudio'),
            ('Hogar', 'Tareas del hogar')
        ]
        
        for nombre, desc in categorias_pred:
            db.session.add(CategoriaPredeterminada(
                nombre=nombre,
                descripcion=desc
            ))
        db.session.commit()
        print("Categorías predeterminadas creadas exitosamente")

if __name__ == '__main__':
    app.run(debug=True)