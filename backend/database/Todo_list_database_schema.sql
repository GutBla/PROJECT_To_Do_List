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

CREATE TABLE Usuario_Tarea (
    usuario_id INT NOT NULL,
    tarea_id INT NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    permisos ENUM('LECTURA', 'ESCRITURA', 'PROPIETARIO') NOT NULL DEFAULT 'LECTURA',
    PRIMARY KEY (usuario_id, tarea_id),
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (tarea_id) REFERENCES Tarea(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_usuario_tarea_tarea_id ON Usuario_Tarea(tarea_id);

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

INSERT INTO Usuario (email, password_hash, nombre_completo)
VALUES
('usuario1@gmail.com', '$2b$12$8eJH5zB/rPFXu6tnZ2GiUOEz3bZ9pGCtV8xU/h1.S9FYHJ9M7QZLe', 'Usuario 1'),
('usuario2@gmail.com', '$2b$12$8eJH5zB/rPFXu6tnZ2GiUOEz3bZ9pGCtV8xU/h1.S9FYHJ9M7QZLe', 'Usuario 2'),
('usuario3@gmail.com', '$2b$12$8eJH5zB/rPFXu6tnZ2GiUOEz3bZ9pGCtV8xU/h1.S9FYHJ9M7QZLe', 'Usuario 3');

INSERT INTO CategoriaPredeterminada (nombre, descripcion)
VALUES
('Personal', 'Tareas de la vida personal'),
('Trabajo', 'Tareas del entorno laboral'),
('Estudio', 'Tareas académicas');

INSERT INTO Categoria (usuario_id, categoria_predeterminada_id, es_predeterminada)
VALUES
(1, 1, TRUE),
(1, 3, FALSE),
(2, 2, TRUE),
(3, 3, TRUE);

INSERT INTO Tarea (categoria_id, usuario_id, titulo, descripcion, estado, fecha_vencimiento, fecha_completado)
VALUES
(1, 1, 'Leer libro de psicología', 'Avanzar en la lectura semanal', 'EN_PROGRESO', CURDATE() + INTERVAL 5 DAY, NULL),
(2, 1, 'Entregar práctica de BD', 'Subir el ejercicio al portal', 'PENDIENTE', CURDATE() + INTERVAL 2 DAY, NULL),
(3, 2, 'Enviar reporte mensual', 'Enviar reporte financiero al gerente', 'COMPLETADA', CURDATE() - INTERVAL 2 DAY, NOW()),
(4, 3, 'Ir al médico', 'Consulta general programada', 'NUEVA', CURDATE() + INTERVAL 7 DAY, NULL);

INSERT INTO Usuario_Tarea (usuario_id, tarea_id, permisos)
VALUES
(2, 1, 'LECTURA'),
(3, 2, 'ESCRITURA');

INSERT INTO LogTareaEliminada (id, tarea_id, usuario_id, titulo, descripcion, estado, fecha_vencimiento, fecha_completado)
VALUES
(1, 2, 1, 'Tarea eliminada', 'Esta tarea fue borrada por el usuario', 'PENDIENTE', CURDATE() + INTERVAL 3 DAY, NULL);

DROP TRIGGER IF EXISTS trigger_log_tarea_eliminada;

DELIMITER //
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
//
DELIMITER;

DROP PROCEDURE IF EXISTS actualizar_tareas_vencidas;

DELIMITER //
CREATE PROCEDURE actualizar_tareas_vencidas()
BEGIN
    UPDATE Tarea
    SET estado = 'PENDIENTE'
    WHERE fecha_vencimiento <= CURDATE()
    AND estado != 'COMPLETADA';
END;
//
DELIMITER ;

CALL actualizar_tareas_vencidas()