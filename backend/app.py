from flask import Flask, jsonify, request, session, redirect, url_for, render_template
from datetime import datetime
from config import Config
from models import db, Tarea, UsuarioTarea, Usuario, CategoriaPredeterminada, Categoria

# Configuración inicial de la aplicación Flask
# ----------------------------------------------
app = Flask(__name__, static_folder='../frontend/static')
app.config.from_object(Config)

# Inicialización de SQLAlchemy con la app
# ------------------------------------------------
db.init_app(app)

# Inicialización de la base de datos
# ------------------------------------------------
with app.app_context():
    db.create_all()

# Funciones de ayuda -------------------------------------
def validate_write_permission(tarea_id, usuario_id):
    if Tarea.query.get(tarea_id).usuario_id == usuario_id:
        return True
    
    permiso = UsuarioTarea.query.filter_by(
        usuario_id=usuario_id,
        tarea_id=tarea_id
    ).first()
    
    return permiso and permiso.permisos in ('ESCRITURA', 'PROPIETARIO')

def validate_task_owner(tarea_id, usuario_id):
    return Tarea.query.get(tarea_id).usuario_id == usuario_id


# Rutas de autenticación ----------------------------------
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

# Rutas principales ---------------------------
@app.route('/tareas')
def tareas():
    if 'user_id' not in session:
        return redirect('/login')
    
    usuario = Usuario.query.get(session['user_id'])
    categorias = Categoria.query.filter_by(usuario_id=usuario.id).all()
    
    return render_template('tareas.html', usuario=usuario, categorias=categorias)


# API Endpoints -------------------------------
@app.route('/api/tareas', methods=['GET'])
def get_tareas():
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    user_id = session['user_id']
    
    query = Tarea.query.filter(
        (Tarea.usuario_id == user_id) |
        (Tarea.id.in_(
            db.session.query(UsuarioTarea.tarea_id)
            .filter(UsuarioTarea.usuario_id == user_id)
        ))
    )

    categoria_id = request.args.get('categoria_id', type=int)
    if categoria_id:
        query = query.filter(Tarea.categoria_id == categoria_id)
    
    tareas = query.all()
    
    return jsonify([{
        'id': t.id,
        'titulo': t.titulo,
        'descripcion': t.descripcion,
        'estado': t.estado,
        'fecha_vencimiento': t.fecha_vencimiento.isoformat() if t.fecha_vencimiento else None,
        'fecha_creacion': t.fecha_creacion.isoformat(),
        'categoria_id': t.categoria_id,
        'categoria_nombre': (
            t.categoria.categoria_predeterminada.nombre 
            if t.categoria and t.categoria.categoria_predeterminada 
            else (
                'Personalizada' 
                if t.categoria 
                else 'Sin categoría'
            )
        ),
        'es_propia': t.usuario_id == user_id,
        'puede_editar': t.usuario_id == user_id or validate_write_permission(t.id, user_id),
        'puede_eliminar': t.usuario_id == user_id
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
    
    tarea = db.session.get(Tarea, tarea_id)
    if not tarea:
        return jsonify({'error': 'Tarea no encontrada'}), 404
    
    if tarea.usuario_id != session['user_id'] and not db.session.query(UsuarioTarea).filter_by(
        usuario_id=session['user_id'],
        tarea_id=tarea_id
    ).first():
        return jsonify({'error': 'No tienes acceso a esta tarea'}), 403
    
    owner = db.session.get(Usuario, tarea.usuario_id)
    
    shared_users = db.session.query(UsuarioTarea).filter_by(tarea_id=tarea_id).join(Usuario).all()
    
    return jsonify({
        'id': tarea.id,
        'titulo': tarea.titulo,
        'descripcion': tarea.descripcion,
        'estado': tarea.estado,
        'fecha_vencimiento': tarea.fecha_vencimiento.isoformat() if tarea.fecha_vencimiento else None,
        'categoria_id': tarea.categoria_id,
        'propietario': {
            'usuario_id': owner.id,
            'email': owner.email,
            'nombre_completo': owner.nombre_completo,
            'permisos': 'PROPIETARIO'
        },
        'usuarios_compartidos': [{
            'usuario_id': ut.usuario.id,
            'usuario': {
                'id': ut.usuario.id,
                'email': ut.usuario.email,
                'nombre_completo': ut.usuario.nombre_completo
            },
            'permisos': ut.permisos,
            'fecha_asignacion': ut.fecha_asignacion.isoformat()
        } for ut in shared_users]
    })

@app.route('/api/tareas/<int:tarea_id>', methods=['PUT'])
def update_tarea(tarea_id):
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    tarea = Tarea.query.get_or_404(tarea_id)
    
    if not validate_write_permission(tarea_id, session['user_id']):
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
    
    try:
        #Se elimina las relaciones de usuario_tarea asociadas a la tarea
        # ---------------------
        relaciones = UsuarioTarea.query.filter_by(tarea_id=tarea_id).all()
        for relacion in relaciones:
            db.session.delete(relacion)
    
        db.session.delete(tarea)
        db.session.commit()
        
        return jsonify({'mensaje': 'Tarea eliminada exitosamente'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al eliminar la tarea'}), 500

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

@app.route('/api/categorias', methods=['POST'])
def create_categoria():
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    data = request.get_json()
    
    if not data or not data.get('nombre'):
        return jsonify({'error': 'El nombre es requerido'}), 400
    
    if len(data['nombre']) > 255:
        return jsonify({'error': 'El nombre no puede exceder los 255 caracteres'}), 400
    
    try:
        nueva_categoria = Categoria(
            usuario_id=session['user_id'],
            es_predeterminada=False
        )
        
        cat_pred = CategoriaPredeterminada.query.filter_by(nombre=data['nombre']).first()
        if cat_pred:
            nueva_categoria.categoria_predeterminada_id = cat_pred.id
        else:
            nueva_predeterminada = CategoriaPredeterminada(
                nombre=data['nombre'],
                descripcion=data.get('descripcion')
            )
            db.session.add(nueva_predeterminada)
            db.session.flush() 
            nueva_categoria.categoria_predeterminada_id = nueva_predeterminada.id
        
        db.session.add(nueva_categoria)
        db.session.commit()
        
        return jsonify({
            'id': nueva_categoria.id,
            'nombre': data['nombre'],
            'mensaje': 'Categoría creada exitosamente'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al crear la categoría', 'detalle': str(e)}), 500

@app.route('/api/tareas/<int:tarea_id>/compartir', methods=['POST'])
def compartir_tarea(tarea_id):
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({'error': 'Datos incompletos'}), 400
    
    usuario_email = data['email']
    permisos = data.get('permisos', 'LECTURA')
    
    tarea = db.session.get(Tarea, tarea_id)
    if not tarea or tarea.usuario_id != session['user_id']:
        return jsonify({'error': 'No tienes permisos para compartir esta tarea'}), 403
    
    usuario = db.session.query(Usuario).filter_by(email=usuario_email).first()
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    if usuario.id == session['user_id']:
        return jsonify({'error': 'No puedes compartir la tarea contigo mismo'}), 400
    
    existente = db.session.query(UsuarioTarea).filter_by(
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
    
    return jsonify({
        'mensaje': f'Tarea compartida con {usuario_email}',
        'usuario': {
            'usuario_id': usuario.id,
            'email': usuario.email,
            'nombre_completo': usuario.nombre_completo,
            'permisos': permisos
        }
    }), 201

@app.route('/api/tareas/<int:tarea_id>/permisos', methods=['PUT', 'DELETE'])
def gestionar_permisos(tarea_id):
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    if not validate_task_owner(tarea_id, session['user_id']):
        return jsonify({'error': 'Solo el propietario puede gestionar permisos'}), 403
    
    data = request.get_json()
    usuario_id = data['usuario_id']
    
    permiso = UsuarioTarea.query.filter_by(
        usuario_id=usuario_id,
        tarea_id=tarea_id
    ).first()
    
    if not permiso:
        return jsonify({'error': 'El usuario no tiene acceso a esta tarea'}), 404
    
    if request.method == 'PUT':
        nuevos_permisos = data.get('permisos')
        if not nuevos_permisos or nuevos_permisos not in ['LECTURA', 'ESCRITURA']:
            return jsonify({'error': 'Permisos inválidos'}), 400
        
        permiso.permisos = nuevos_permisos
        db.session.commit()
        return jsonify({'mensaje': 'Permisos actualizados correctamente'})
    
    elif request.method == 'DELETE':
        db.session.delete(permiso)
        db.session.commit()
        return jsonify({'mensaje': 'Permisos eliminados correctamente'})

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

def initialize_default_categories():
    try:
        default_categories = [
            ('Trabajo', 'Tareas relacionadas con el trabajo'),
            ('Personal', 'Tareas personales'),
            ('Estudio', 'Tareas de estudio'),
            ('Hogar', 'Tareas del hogar')
        ]
        
        for nombre, desc in default_categories:
            if not CategoriaPredeterminada.query.filter_by(nombre=nombre).first():
                db.session.add(CategoriaPredeterminada(
                    nombre=nombre,
                    descripcion=desc
                ))
        
        db.session.commit()
        print("Categorías predeterminadas inicializadas correctamente")
        
    except Exception as e:
        print(f"Error inicializando categorías: {str(e)}")
        db.session.rollback()

with app.app_context():
    # db.create_all()
    initialize_default_categories()

if __name__ == '__main__':
    app.run(debug=True)