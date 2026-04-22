Simulador de Redes y Ciberseguridad: Red Team vs. Blue Team 
Escuela de Educación Secundaria Técnica N°10 

1. ¿Qué es el Simulador? 
El Simulador de Redes y Ciberseguridad es una aplicación de software interactiva diseñada 
específicamente para entornos educativos. Emula una Terminal de Comandos (CLI) realista e 
inmersiva, conectada a una infraestructura de red virtual que representa los 3 laboratorios de 
informática de la escuela (con un total de 60 computadoras interconectadas). 
Este entorno permite a los estudiantes interactuar con sistemas de archivos, diagnosticar redes 
y ejecutar herramientas de seguridad informática sin poner en riesgo la infraestructura real de 
la institución, todo dentro de un entorno seguro, aislado y controlado. 

2. ¿Qué hace y cómo funciona? 
La plataforma está dividida en dos paneles principales: 
• La Terminal Táctica (Panel Izquierdo): Una consola realista donde los alumnos 
introducen comandos de Windows (DOS, Redes, Procesos). El "motor" del simulador 
interpreta estos comandos, simula latencias de red y devuelve respuestas idénticas a 
las de un sistema operativo real. 
• El Monitor de Infraestructura (Panel Derecho): Un panel de control (Dashboard) que 
muestra en tiempo real el consumo simulado de CPU/RAM/Red, el rango actual del 
estudiante y los objetivos de la misión activa. 
El simulador cuenta con un Motor de Misiones integrado que evalúa constantemente lo que el 
alumno escribe. Posee 20 escenarios de crisis basados en la metodología Red Team (Ataque) 
vs. Blue Team (Defensa). Si el estudiante ejecuta el comando correcto para solucionar el 
problema, el sistema lo detecta automáticamente, tacha el objetivo de la lista y le otorga 
progreso. 

3. Objetivos Pedagógicos 
El proyecto fue diseñado bajo el paradigma de la Gamificación (aprender jugando) y el 
aprendizaje basado en problemas (PBL), buscando cumplir los siguientes objetivos: 
• Transición a la Práctica Segura: Permitir a los alumnos practicar comandos de alto 
riesgo (como manipular el Firewall, detener procesos críticos o simular ataques de 
denegación de servicio) en un entorno 100% libre de consecuencias reales. 
• Comprensión Dual (Atacante y Defensor): Bajo la filosofía del Hacking Ético, los 
estudiantes aprenden primero cómo piensa un atacante (Red Team: usando nmap, 
fuerza bruta) para luego comprender cómo mitigar esos mismos ataques (Blue Team: 
configurando reglas de Firewall y auditando usuarios). 
• Resolución bajo Presión: Entrenar el pensamiento lógico y técnico mediante la 
resolución de crisis reales de infraestructura (ej. "El servidor se cayó", "Hay un intruso 
en la red", "El disco duro se llenó de malware"). 
• Motivación mediante Logros: El sistema incluye un motor de rangos persistente. Los 
alumnos comienzan como "Estudiantes" y, a medida que superan misiones, ascienden 
a Administrador Junior, Semi-Senior, Senior, Futuro Hacker y finalmente The 
King/Queen of the Hacker. 

4. Tecnologías Utilizadas en el Desarrollo 
Para garantizar que el software sea ligero, rápido y no dependa de internet ni instalaciones 
complejas, se utilizaron las siguientes tecnologías: 
• Frontend (Interfaz y Lógica): Desarrollado enteramente con tecnologías web puras: 
HTML5, CSS3 y Vanilla JavaScript (ES6+). Todo el cerebro del simulador, el Sistema de 
Archivos Virtual (VFS), el generador dinámico de nodos y las validaciones mediante 
Expresiones Regulares (Regex) ocurren en la memoria del programa. 
• Persistencia de Datos: Uso de sessionStorage para guardar el progreso, rangos y 
estados críticos (como reglas del Firewall), permitiendo mantener la continuidad 
educativa sin necesidad de bases de datos externas. 
• Empaquetado (Backend): Compilado utilizando Node.js y Electron.js (junto a electron
builder). Esto transforma el código web en una aplicación de escritorio nativa e 
independiente (.exe) para Windows, lista para ejecutarse offline en cualquier PC de la 
escuela. 

5. ¿Cómo usarlo? (Guía Básica) 
El simulador es intuitivo y autoguiado: 
1. Inicio: Al ejecutar el programa, el estudiante se encuentra frente a la consola. 
2. Tutoriales: Escribiendo el comando help, el sistema despliega los módulos de 
entrenamiento disponibles (tutorial-red, tutorial-dos, tutorial-firewall, tutorial-ataque). 
Estos tutoriales enseñan paso a paso el uso de los comandos. 
3. Misiones: Una vez entrenados, los alumnos escriben el comando misiones para abrir el 
catálogo de crisis (Ej: Misión 1: El servidor fantasma). 
4. Ejecución: Escribiendo mision 1, el panel derecho muestra los pasos a seguir. El alumno 
debe aplicar los comandos aprendidos (ej: ping, arp -a, netsh) para salvar el sistema y 
ganar su ascenso. 

6. Equipo Técnico, Pedagógico y Desarrollador 
Este proyecto ha sido modelado, diseñado, con una programacion asistida, por el equipo docente 
de la institución, adaptando las necesidades curriculares a las tecnologías modernas: 
• Prof. Soto Diego Ariel 
• Prof. Gareca Cristian 
APLICACIÓN CREADA PARA USO EN LOS LABORATORIOS DE LA ESCUELA SECUNDARIA TÉCNICA EN LA EEST N°10.
SU CODIGO FUENTE ES DE LIBRE DISTRIBUCION, ADAPTACION Y ACTUALIZACION
EL OBJETIVO DEL SIMULADOR ES MERAMENTE CON FINES PEDAGOGICOS Y DE APRENDIZAJE. 
