def create_stored_procedure():
    script_sql = """
    CREATE PROCEDURE actualizar_tareas_vencidas()
    BEGIN
        UPDATE tarea
        SET estado = 'Pendiente'
        WHERE fecha_vencimiento <= CURDATE()
        AND estado != 'Completada';
    END;
    """
    return script_sql

def drop_stored_procedure():
    script_sql = """
    DROP PROCEDURE IF EXISTS actualizar_tareas_vencidas
    """
    return script_sql

def execute_stored_procedure():
    script_sql = """
    CALL actualizar_tareas_vencidas()
    """
    return script_sql