/**
* Script de creación inicial para la base de datos del proyecto To Do List
*/

CREATE DATABASE IF NOT EXISTS todo_list;
USE todo_list;

CREATE TABLE Usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_usuario_email ON Usuario(email);

CREATE TABLE CategoriaPredeterminada (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT NULL
) ENGINE=InnoDB;

CREATE TABLE Categoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    categoria_predeterminada_id INT NULL,
    es_predeterminada BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_predeterminada_id) REFERENCES CategoriaPredeterminada(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_categoria_usuario_id ON Categoria(usuario_id);

CREATE TABLE Tarea (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NULL,
    usuario_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado ENUM('NUEVA', 'EN_PROGRESO', 'COMPLETADA', 'PENDIENTE') DEFAULT 'NUEVA',
    fecha_vencimiento DATE NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_completado TIMESTAMP NULL,
    FOREIGN KEY (categoria_id) REFERENCES Categoria(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_tarea_usuario_id ON Tarea(usuario_id);
CREATE INDEX idx_tarea_categoria_id ON Tarea(categoria_id);
CREATE INDEX idx_tarea_estado ON Tarea(estado);
CREATE INDEX idx_tarea_fecha_vencimiento ON Tarea(fecha_vencimiento);

CREATE TABLE UsuarioTarea (
    usuario_id INT NOT NULL,
    tarea_id INT NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    permisos ENUM('LECTURA', 'ESCRITURA', 'PROPIETARIO') NOT NULL DEFAULT 'LECTURA',
    PRIMARY KEY (usuario_id, tarea_id),
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (tarea_id) REFERENCES Tarea(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_usuario_tarea_tarea_id ON UsuarioTarea(tarea_id);

CREATE TABLE LogTareaEliminada (
    id INTEGER PRIMARY KEY,
    tarea_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado ENUM('NUEVA', 'EN_PROGRESO', 'COMPLETADA', 'PENDIENTE') NOT NULL,
    fecha_vencimiento DATE,
    fecha_completado TIMESTAMP,
    fecha_eliminacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE PROCEDURE actualizar_tareas_vencidas()
    BEGIN
        UPDATE tarea
        SET estado = 'Pendiente'
        WHERE fecha_vencimiento <= CURDATE()
        AND estado != 'Completada';
    END;

DROP PROCEDURE IF EXISTS actualizar_tareas_vencidas;

CALL actualizar_tareas_vencidas();

CREATE TRIGGER trigger_log_tarea_eliminada
    AFTER DELETE ON Tarea
    FOR EACH ROW
    BEGIN
        INSERT INTO LogTareaEliminada (
            tarea_id,
            usuario_id,
            titulo,
            descripcion,
            estado,
            fecha_vencimiento,
            fecha_completado
        )
        VALUES (
            OLD.id,
            OLD.usuario_id,
            OLD.titulo,
            OLD.descripcion,
            OLD.estado,
            OLD.fecha_vencimiento,
            OLD.fecha_completado
        );
    END;

DROP TRIGGER IF EXISTS trigger_log_tarea_eliminada;


/*
CASOS DE PRUEBA:

1. Crear un nuevo usuario válido:
    INSERT INTO Usuario (email, password_hash, nombre_completo)
    VALUES ('usuario1@example.com', 'hash123', 'Usuario Uno');

1.2 Crear un nuevo usuario con email duplicado:
    INSERT INTO Usuario (email, password_hash, nombre_completo)
    VALUES ('usuario1@example.com', 'otrohash', 'Duplicado');

2. Crear una categoría predeterminada:
    INSERT INTO CategoriaPredeterminada (nombre, descripcion)
    VALUES ('Trabajo', 'Tareas laborales');

3. Insertar una categoría asosciada a un usuario y predeterminada:
    INSERT INTO Categoria (usuario_id, categoria_predeterminada_id, es_predeterminada)
    VALUES (1, 1, TRUE);

4. INSERT INTO Categoria (usuario_id, categoria_predeterminada_id, es_predeterminada)
VALUES (30, 1, TRUE); --Revisar

5. Crear una tarea asociada a un usuario y categoría válidos:
    INSERT INTO Tarea (categoria_id, usuario_id, titulo, descripcion)
    VALUES (1, 1, 'Preparar informe', 'Informe mensual para el cliente');

6. Asignar tarea existente a otro usuario:
    INSERT INTO UsuarioTarea (usuario_id, tarea_id, permisos)
    VALUES (1, 1, 'ESCRITURA');


7. Eliminar una tarea y verificar que se loguea:
    -- Primero inserta tarea:
    INSERT INTO Tarea (usuario_id, titulo)
    VALUES (1, 'Tarea para eliminar');

    -- Luego eliminarla:
    DELETE FROM Tarea WHERE titulo = 'Tarea para eliminar';

    -- Verificar el log:
    SELECT * FROM LogTareaEliminada;


8. Crear una tarea con fecha de vencimiento pasada:
    INSERT INTO Tarea (usuario_id, titulo, estado, fecha_vencimiento)
    VALUES (1, 'Tarea vencida', 'NUEVA', CURDATE() - INTERVAL 1 DAY);

    CALL actualizar_tareas_vencidas();

    -- Verificar que el estado sea 'PENDIENTE'
    SELECT * FROM Tarea WHERE titulo = 'Tarea vencida';

*/