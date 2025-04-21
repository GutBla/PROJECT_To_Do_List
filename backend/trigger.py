def create_trigger():
    script_sql = """
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
    """
    return script_sql

def drop_trigger():
    script_sql = """
    DROP TRIGGER IF EXISTS trigger_log_tarea_eliminada;
    """
    return script_sql