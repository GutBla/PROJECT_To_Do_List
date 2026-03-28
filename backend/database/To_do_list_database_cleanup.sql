USE todo_list;

SELECT * FROM Usuario;

SELECT * FROM logtareaeliminada;

SELECT T.*
FROM Tarea T
JOIN Usuario U ON T.usuario_id = U.id
WHERE U.email = 'andrealogtareaeliminadatest@gmail.com';

DROP DATABASE IF EXISTS todo_list;