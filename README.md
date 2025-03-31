# TO-DO List Project

![Portada To Do List](images/Portada_Base_de_Datos_To_Do_List.png)

## Descripción del Proyecto
El proyecto **TO-DO List** es una aplicación web diseñada para gestionar de manera eficiente las tareas diarias de los usuarios. La aplicación permite realizar operaciones fundamentales sobre las tareas, tales como agregar, editar, eliminar y marcar tareas como completadas. Asimismo, incluye funcionalidades para organizar las tareas por categorías y permite la autenticación de usuarios con encriptación de contraseñas, asegurando la privacidad y protección de los datos personales.

### Características principales

- Autenticación de usuarios con encriptación de contraseñas.
- Gestión de tareas (Agregar, Editar, Eliminar, Completar).
- Asignación de tareas a categorías (por defecto o personalizadas).
- Interfaz de usuario simple y adaptable.
- Conexión a la base de datos MySQL para el almacenamiento persistente de tareas y usuarios.
- Documentación clara sobre cómo ejecutar y mantener la aplicación.

## Reglas y Convenciones del Proyecto

### 1. Convenciones de Nombres

Dado que el proyecto utiliza diversas tecnologías, se deberán seguir las siguientes convenciones:

#### Código Fuente (Python, JavaScript, HTML, CSS)
- **Python:**
  - Los nombres de módulos y paquetes se escribirán en minúsculas, utilizando guiones bajos para separar palabras (ejemplo: `app.py`, `database_utils.py`).
  - Los nombres de clases se escribirán en CamelCase (ejemplo: `UserAuthentication`, `TaskManager`).
- **JavaScript:**
  - Las funciones y variables se escribirán en camelCase (ejemplo: `getTaskList()`, `userLogin`).
  - Los nombres de clases se escribirán en PascalCase (ejemplo: `TaskController`).
- **HTML y CSS:**
  - Los archivos deberán tener nombres descriptivos y en minúsculas (ejemplo: `index.html`, `style.css`).
  - Para las clases CSS se recomienda la convención BEM (Block__Element--Modifier) (ejemplo: `header__title--main`).

#### Archivos de Configuración y Documentación
- Los archivos de configuración (por ejemplo, `config.py`, `.env`) y documentos de apoyo (por ejemplo, `README.md`, `LICENSE`) se nombrarán de forma clara y sin espacios, utilizando la extensión correspondiente.

### 2. Convenciones de Commit

Los mensajes de commit se redactarán en español y deberán seguir el siguiente formato:


#### Tabla de Convenciones de Commit

| Prefijo   | Descripción                                                             | Ejemplo                                                      |
|-----------|-------------------------------------------------------------------------|--------------------------------------------------------------|
| feat      | Nueva funcionalidad                                                   | feat(estructura): Creación de la estructura inicial del proyecto |
| fix       | Corrección de errores o incidencias                                   | fix(conexion): Corrección en la conexión a la base de datos    |
| docs      | Actualización o modificaciones en la documentación                    | docs(user-guide): Actualización de la guía del usuario         |
| style     | Cambios en el formato o presentación (sin afectar la lógica)            | style(css): Ajuste en el formato de los estilos               |
| refactor  | Reorganización o mejoras en el código sin modificar funcionalidades     | refactor(auth): Reestructuración de la lógica de autenticación  |
| perf      | Optimización del rendimiento                                            | perf(query): Mejora en el rendimiento de consultas a la base de datos |
| test      | Incorporación o modificación de pruebas unitarias o de integración      | test(api): Agregado de pruebas para los endpoints de la API     |
| chore     | Tareas de mantenimiento, actualización de dependencias o ajustes de configuración | chore(config): Actualización de la configuración del entorno    |
| build     | Cambios en las herramientas de construcción o en el entorno de despliegue | build(webpack): Ajuste en la configuración de Webpack           |
| ci        | Modificaciones relacionadas con la integración y despliegue continuo      | ci(gitlab): Configuración del pipeline en GitLab                |
| revert    | Reversión de un commit previo                                           | revert(feat): Reversión del commit de creación de la estructura    |

### 3. Política de Ramas

- **Rama Principal (main):**
  - La rama `main` contendrá únicamente el código listo para producción. No se debe trabajar directamente en esta rama.
  
- **Rama de Desarrollo (develop):**
  - Todas las tareas de desarrollo y la integración de nuevas funcionalidades se realizarán en la rama `develop`.
  - Los desarrolladores deberán crear ramas de trabajo a partir de `develop`, siguiendo la convención de nombres (por ejemplo, `feature/nueva-funcionalidad`, `bugfix/correccion-error-login`).
  - Una vez finalizadas las tareas, se enviará un merge request para integrar los cambios a la rama `develop`.
  
- **Integración a main:**
  - La integración de cambios a la rama `main` solo se realizará tras una revisión previa y mediante un merge request aprobado o siguiendo el procedimiento de etiquetado de versiones.
  - No se permitirá realizar push directo a `main` sin la autorización correspondiente.

## Instalación y Configuración
### 1. Clonar el Repositorio
Para obtener una copia local del repositorio, ejecute el siguiente comando:

```bash
git clone https://gitlab.com/usuario/proyecto-todolist.git
```
## Documentación Adicional
1. Diagrama ER: Ver Diagrama ER
2. Modelo Relacional: Ver Modelo Relacional
3. Guía del Usuario: Ver Guía del Usuario
4. Notas de la Reunión: Ver Notas de la Reunión

## 🚀 Contribuciones

Las contribuciones al proyecto son bienvenidas. Para colaborar con el desarrollo del proyecto, por favor siga los siguientes pasos:

1. Haga un fork del repositorio.
2. Cree una nueva rama:
    ```bash
    git checkout -b feature/nueva-funcionalidad
    ```
3. Realice los cambios necesarios en el código.
4. Haga un commit con el mensaje adecuado:
    ```bash
    git commit -m 'feat(nueva-funcionalidad): Descripción de la mejora'
    ```
5. Realice un push a su rama:
    ```bash
    git push origin feature/nueva-funcionalidad
    ```
6. Abra un Pull Request para que se revisen sus cambios.
Gracias por su colaboración y contribuciones al proyecto.