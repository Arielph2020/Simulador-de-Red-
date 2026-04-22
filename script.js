// ================= SISTEMA DE DEPURACIÓN =================
// Si hay un error crítico, lo mostrará en la terminal en lugar de congelarse
window.addEventListener('error', function(e) {
    const out = document.getElementById('terminal-output');
    if(out) out.innerHTML += `<br><span style="color:#f6264a; font-weight:bold;">[FALLO DEL SISTEMA] Error interno: ${e.message} en la línea ${e.lineno}.</span><br>`;
});

document.addEventListener("DOMContentLoaded", () => {
    
    // ================= ELEMENTOS DEL DOM =================
    const input = document.getElementById('terminal-input');
    const output = document.getElementById('terminal-output');
    const terminalContent = document.getElementById('terminal-content');
    const promptText = document.getElementById('prompt-text');
    const miniProgress = document.getElementById('mini-progress');
    const miniPercent = document.getElementById('mini-percent');
    const taskStatus = document.getElementById('task-status');
    const activeTimeLabel = document.getElementById('active-time');
    const userRankLabel = document.getElementById('user-rank');

    if (!input || !output) return;

    // ================= FUNCIONES DE SEGURIDAD =================
    function safeParse(key, fallback) {
        try {
            let val = sessionStorage.getItem(key);
            return val ? JSON.parse(val) : fallback;
        } catch(e) {
            return fallback;
        }
    }

    // ================= VARIABLES DE ESTADO Y PERSISTENCIA =================
    let isProcessing = false;
    let secondsActive = 0;
    let commandHistory = [];
    let historyIndex = -1;
    let currentDir = "C:\\Users\\Administrador";
    
    // Persistencia de Red y Seguridad
    let firewallState = sessionStorage.getItem("fwState") || "on";
    let currentIP = sessionStorage.getItem("savedIP") || "192.168.1.105";
    let currentGateway = sessionStorage.getItem("savedGateway") || "192.168.1.105"; // Inicia desviado para Misión 13
    
    // Persistencia de Progreso
    let completedMissions = safeParse("compMissions", []);
    let completedMissionsCount = completedMissions.length;
    let tutorialStatus = safeParse("tutStatus", { red: false, dos: false, fw: false, atk: false });

    // ================= SISTEMA DE ARCHIVOS VIRTUAL (VFS) =================
    let vfs = {
        "C:\\Users\\Administrador": {
            "apuntes.txt": { type: "file", content: "Topología: 3 Laboratorios. Total 60 PCs activos." },
            "Descargas": { type: "dir" },
            "Oculto": { type: "dir" }
        },
        "C:\\Users\\Administrador\\Descargas": {
            "gusano.bat": { type: "file", content: "copy %0 copia.bat\ngoto loop" },
            "broma_gigante.txt": { type: "file", content: "[ARCHIVO DE 50GB DETECTADO]" }
        },
        "C:\\Users\\Administrador\\Oculto": { "Sistema": { type: "dir" } },
        "C:\\Users\\Administrador\\Oculto\\Sistema": {
            "respuestas.txt": { type: "file", content: "Respuestas: 1.A, 2.B, 3.TCP/IP" }
        },
        "Z:": { 
            "spiderman.mp4": { type: "file", content: "[CONTENIDO ILEGAL - PELÍCULA 2GB]" },
            "juego.iso": { type: "file", content: "[ARCHIVO PESADO - INSTALADOR]" }
        }
    };

    let localGroupAdmins = ["Administrador"];
    let sharedFolders = { "Peliculas": true };

    // ================= GENERADOR DE TOPOLOGÍA (60 PCs - Labs 1, 2 y 3) =================
    const generarMAC = () => "xx-xx-xx-xx-xx-xx".replace(/x/g, () => (Math.random()*16|0).toString(16)).toLowerCase();
    let generatedHosts = [];

    // Infraestructura Crítica
    generatedHosts.push({ ip: "192.168.1.1", mac: "00-1a-2b-3c-4d-5e", type: "estático", name: "ROUTER-EEST10" });
    generatedHosts.push({ ip: "192.168.1.15", mac: "08-00-27-88-99-aa", type: "dinámico", name: "SERVER-SALA" });

    // Lab 1 (25 PCs): IPs .101 a .125
    for(let i = 1; i <= 25; i++) {
        let ip = `192.168.1.${100 + i}`;
        if(ip === "192.168.1.105") generatedHosts.push({ ip: ip, mac: "a4-b1-c2-d3-00-00", type: "dinámico", name: "CLON-PC" });
        else if(ip === "192.168.1.106") generatedHosts.push({ ip: ip, mac: "ff-aa-bb-cc-dd-ee", type: "dinámico", name: "Gamer-PC" });
        else generatedHosts.push({ ip: ip, mac: generarMAC(), type: "dinámico", name: `LAB1-PC${i.toString().padStart(2, '0')}` });
    }

    // Lab 2 (15 PCs): IPs .126 a .140
    for(let i = 1; i <= 15; i++) {
        generatedHosts.push({ ip: `192.168.1.${125 + i}`, mac: generarMAC(), type: "dinámico", name: `LAB2-PC${i.toString().padStart(2, '0')}` });
    }

    // Lab 3 (20 PCs): IPs .141 a .160
    for(let i = 1; i <= 20; i++) {
        generatedHosts.push({ ip: `192.168.1.${140 + i}`, mac: generarMAC(), type: "dinámico", name: `LAB3-PC${i.toString().padStart(2, '0')}` });
    }

    let netData = {
        localIP: currentIP,
        subnet: "255.255.255.0",
        gateway: currentGateway,
        macLocal: "A4-B1-C2-D3-E4-F5",
        hostname: "PC-DOCENTE",
        dnsCacheEnvenenada: true,
        hosts: generatedHosts
    };

    // ================= DICCIONARIO DE MISIONES =================
    let currentMissionId = 0; 

    const missionsData = {
        1: {
            title: "D1: El Servidor Fantasma",
            desc: "El servidor .10 cayó. Descubre su nueva IP y restáuralo.",
            steps: [
                { text: "1. Confirma caída: ping 192.168.1.10", regex: /^ping 192\.168\.1\.10/i, done: false },
                { text: "2. Mapea la red: arp -a", regex: /^arp -a/i, done: false },
                { text: "3. Identifica la IP .15: nbtstat -A 192.168.1.15", regex: /^nbtstat -A 192\.168\.1\.15/i, done: false },
                { text: "4. Restaura IP (netsh interface ip set address...)", regex: /static 192\.168\.1\.10/i, done: false },
                { text: "5. Verifica conexión: ping 192.168.1.10", regex: /^ping 192\.168\.1\.10/i, done: false }
            ]
        },
        2: {
            title: "D2: El Polizón en la Red",
            desc: "Hay un dispositivo no autorizado. Búscalo y bloquéalo.",
            steps: [
                { text: "1. Revisa conectados: arp -a", regex: /^arp -a/i, done: false },
                { text: "2. Identifica al intruso .106: nbtstat -A 192.168.1.106", regex: /^nbtstat -A 192\.168\.1\.106/i, done: false },
                { text: "3. Bloquea IP en Firewall", regex: /remoteip=192\.168\.1\.106/i, done: false }
            ]
        },
        3: {
            title: "D3: Ataque de Fuerza Bruta",
            desc: "Atacante en puerto 3389. Elimina el proceso y bloquea.",
            steps: [
                { text: "1. Detectar conexión: netstat -an", regex: /^netstat -an/i, done: false },
                { text: "2. Trazar ruta: tracert 203.0.113.45", regex: /^tracert 203\.0\.113\.45/i, done: false },
                { text: "3. Buscar proceso: tasklist", regex: /^tasklist/i, done: false },
                { text: "4. Matar malware: taskkill /PID 4055 /F", regex: /taskkill.*4055/i, done: false },
                { text: "5. Bloquear IP en Firewall", regex: /remoteip=203\.0\.113\.45/i, done: false }
            ]
        },
        6: {
            title: "D6: La Falsa Internet",
            desc: "Redirección maliciosa. Limpia la caché DNS.",
            steps: [
                { text: "1. Comprobar ping: ping google.com", regex: /^ping google\.com/i, done: false },
                { text: "2. Investigar DNS: nslookup google.com", regex: /^nslookup google\.com/i, done: false },
                { text: "3. Limpiar DNS: ipconfig /flushdns", regex: /^ipconfig\s?\/flushdns/i, done: false }
            ]
        },
        7: {
            title: "D7: El Infiltrado VIP",
            desc: "Audita cuentas y borra al administrador intruso.",
            steps: [
                { text: "1. Listar usuarios: net user", regex: /^net user$/i, done: false },
                { text: "2. Ver administradores: net localgroup administradores", regex: /^net localgroup administradores/i, done: false },
                { text: "3. Identidad actual: whoami", regex: /^whoami/i, done: false },
                { text: "4. Borrar intruso: net user Mantenimiento_Falso /delete", regex: /Mantenimiento_Falso \/delete/i, done: false }
            ]
        },
        8: {
            title: "D8: El Agujero Negro",
            desc: "Encuentra y borra el archivo gigante en Descargas.",
            steps: [
                { text: "1. Explorar: dir", regex: /^dir/i, done: false },
                { text: "2. Entrar a Descargas: cd Descargas", regex: /^cd Descargas/i, done: false },
                { text: "3. Eliminar broma: del broma_gigante.txt", regex: /^del broma_gigante\.txt/i, done: false }
            ]
        },
        9: {
            title: "D9: El Escudo Caído",
            desc: "Levanta el firewall y borra 'gusano.bat'.",
            steps: [
                { text: "1. Ver estado Firewall: netsh advfirewall show allprofiles", regex: /show allprofiles/i, done: false },
                { text: "2. Encender: netsh advfirewall set allprofiles state on", regex: /state on/i, done: false },
                { text: "3. Entrar a Descargas: cd Descargas", regex: /^cd Descargas/i, done: false },
                { text: "4. Eliminar gusano: del gusano.bat", regex: /^del gusano\.bat/i, done: false }
            ]
        },
        10: {
            title: "D10: El Clon en la Red",
            desc: "Resuelve el conflicto de IP renovando tu dirección.",
            steps: [
                { text: "1. Ver tu MAC: getmac", regex: /^getmac/i, done: false },
                { text: "2. Ver IPs duplicadas: arp -a", regex: /^arp -a/i, done: false },
                { text: "3. Liberar IP: ipconfig /release", regex: /^ipconfig\s?\/release/i, done: false },
                { text: "4. Renovar IP: ipconfig /renew", regex: /^ipconfig\s?\/renew/i, done: false }
            ]
        },
        11: {
            title: "D11: La Puerta Trasera",
            desc: "Cierra el puerto 4444 matando el proceso y bloqueando IP.",
            steps: [
                { text: "1. Escanear puertos: netstat -an", regex: /^netstat -an/i, done: false },
                { text: "2. Listar procesos: tasklist", regex: /^tasklist/i, done: false },
                { text: "3. Matar proceso: taskkill /PID 9921 /F", regex: /taskkill.*9921/i, done: false },
                { text: "4. Bloquear atacante en Firewall", regex: /remoteip=203\.0\.113\.45/i, done: false }
            ]
        },
        12: {
            title: "D12: El Laberinto",
            desc: "Borra respuestas.txt en el árbol oculto.",
            steps: [
                { text: "1. Mapear árbol: tree", regex: /^tree/i, done: false },
                { text: "2. Navegar: cd Oculto", regex: /^cd Oculto/i, done: false },
                { text: "3. Navegar: cd Sistema", regex: /^cd Sistema/i, done: false },
                { text: "4. Borrar archivo: del respuestas.txt", regex: /^del respuestas\.txt/i, done: false }
            ]
        },
        13: {
            title: "D13: Tráfico Desviado",
            desc: "Restaura la puerta de enlace original .1",
            steps: [
                { text: "1. Ver tabla de rutas: route print", regex: /^route print/i, done: false },
                { text: "2. Prueba de desvío: tracert 8.8.8.8", regex: /^tracert 8\.8\.8\.8/i, done: false },
                { text: "3. Restaurar IP y Gateway a .1", regex: /192\.168\.1\.1$/i, done: false },
                { text: "4. Verificación: tracert 8.8.8.8", regex: /^tracert 8\.8\.8\.8/i, done: false }
            ]
        },
        14: {
            title: "D14: Bodega Clandestina",
            desc: "Bórrala contenido de la red y clausura el recurso.",
            steps: [
                { text: "1. Ver compartidos: net share", regex: /^net share$/i, done: false },
                { text: "2. Montar unidad: net use Z: \\\\servidor\\Peliculas", regex: /^net use Z:/i, done: false },
                { text: "3. Entrar a Z:", regex: /^Z:/i, done: false },
                { text: "4. Borrar videos: del *.mp4", regex: /^del \*\.mp4/i, done: false },
                { text: "5. Eliminar recurso: net share Peliculas /delete", regex: /Peliculas \/delete/i, done: false }
            ]
        },
        15: {
            title: "D15: Código Rojo",
            desc: "Repara los archivos del sistema dañados.",
            steps: [
                { text: "1. Revisar estado: systeminfo", regex: /^systeminfo/i, done: false },
                { text: "2. Reparar Windows: sfc /scannow", regex: /^sfc \/scannow/i, done: false }
            ]
        },
        101: {
            title: "M101 (Red): Denegación de Servicio (DoS)",
            desc: "Satura la red del servidor .15.",
            steps: [
                { text: "1. Reconocimiento: ping 192.168.1.15", regex: /^ping 192\.168\.1\.15$/i, done: false },
                { text: "2. Ping de la Muerte: ping -t -l 65500 192.168.1.15", regex: /ping -t -l 65500 192\.168\.1\.15/i, done: false }
            ]
        },
        102: {
            title: "M102 (Red): Escaneo",
            desc: "Mapea la red completa y puertos del servidor .15.",
            steps: [
                { text: "1. Descubrimiento: nmap 192.168.1.0/24", regex: /nmap 192\.168\.1\.0\/24/i, done: false },
                { text: "2. Escaneo de puertos: nmap 192.168.1.15", regex: /^nmap 192\.168\.1\.15$/i, done: false }
            ]
        },
        103: {
            title: "M103 (Red): Escalada de Privilegios",
            desc: "Crea un usuario y hazlo Administrador.",
            steps: [
                { text: "1. Crear usuario: net user Mantenimiento_Falso /add", regex: /net user Mantenimiento_Falso \/add/i, done: false },
                { text: "2. Elevar a Admin: net localgroup administradores Mantenimiento_Falso /add", regex: /administradores Mantenimiento_Falso \/add/i, done: false },
                { text: "3. Verificar: net user", regex: /^net user$/i, done: false }
            ]
        },
        104: {
            title: "M104 (Red): Fuerza Bruta",
            desc: "Rompe la contraseña del puerto 3389.",
            steps: [
                { text: "1. Verificar puertos: nmap 192.168.1.15", regex: /^nmap 192\.168\.1\.15/i, done: false },
                { text: "2. Lanzar ataque: crack 192.168.1.15 3389", regex: /crack 192\.168\.1\.15 3389/i, done: false }
            ]
        },
        105: {
            title: "M105 (Red): Desarmar Defensas",
            desc: "Apaga el firewall del sistema objetivo.",
            steps: [
                { text: "1. Apagar Firewall: netsh advfirewall set allprofiles state off", regex: /state off/i, done: false },
                { text: "2. Confirmar: netsh advfirewall show allprofiles", regex: /show allprofiles/i, done: false }
            ]
        }
    };

    // ================= FUNCIONES DE AYUDA Y TUTORIALES (IMPRESIONES) =================
    function printLine(text, color = "var(--cmd-gray)") {
        const p = document.createElement('span');
        p.style.color = color; 
        p.innerText = text + '\n';
        output.appendChild(p); 
        scrollToBottom();
    }

    function showHelp() {
        printLine(`[MÓDULOS DE APRENDIZAJE]\ntutorial-red      : Comandos IP, Ping, DNS y Rutas.\ntutorial-dos      : Navegación de Archivos y Carpetas.\ntutorial-firewall : Defensa, Firewall y Procesos (BLUE TEAM).\ntutorial-ataque   : Escaneo y Fuerza Bruta (RED TEAM).\n\nEscribe 'misiones' para listar el catálogo de crisis.`, "var(--ui-blue)");
    }

    function showMissions() {
        printLine(`\n--- CATÁLOGO DE CRISIS (MISIONES) ---`, "var(--warning)");
        Object.keys(missionsData).forEach(k => { printLine(`mision ${k} : ${missionsData[k].title}`); });
        printLine(`\nEscribe 'mision <numero>' para iniciar. Ej: mision 105`, "white");
    }

    function showTutorialRed() { 
        printLine(`\n--- MÓDULO: REDES (Diagnóstico Básico) ---
1. ipconfig : Muestra tu IP actual.
2. ipconfig /release y /renew : Libera tu IP actual y solicita una nueva al router.
3. ipconfig /flushdns : Limpia la caché de dominios (útil si hay redirecciones falsas).
4. getmac : Muestra la dirección física (MAC) de tu tarjeta de red.
5. arp -a : Muestra las IPs y MACs de todos los equipos en tu red local.
6. ping <ip> : Prueba la conexión con otro equipo midiendo el tiempo de respuesta.
7. tracert <ip> : Muestra el camino salto por salto (routers) hacia un destino.
8. netstat -an : Lista las conexiones activas y puertos abiertos en tu PC.
9. nslookup <dominio> : Consulta al servidor DNS cuál es la IP real de una web.
10. nbtstat -A <ip> : Muestra el nombre (hostname) del equipo dueño de esa IP.
11. route print : Muestra la tabla de rutas y tu puerta de enlace (Gateway).
12. netsh interface ip set address "Ethernet" static <IP> <Masc> <Gateway> : Cambia tu IP y ruta manualmente.
13. systeminfo : Muestra la información general del hardware y SO.

[ACCIÓN]: Prueba 'ipconfig' para completar este tutorial.`, "var(--matrix-green)"); 
    }

    function showTutorialDos() { 
        printLine(`\n--- MÓDULO: DOS (Sistema de Archivos) ---
1. dir : Lista el contenido y carpetas donde te encuentras ahora.
2. cd <carpeta> : Entra a una carpeta. Escribe 'cd ..' para retroceder.
3. mkdir <nombre> : Crea una carpeta nueva.
4. echo <texto> > <archivo> : Crea un archivo de texto. (Ej: echo Hola > saludo.txt)
5. type <archivo> : Lee el contenido de un archivo de texto en pantalla.
6. del <archivo> : Elimina un archivo permanentemente.
7. tree : Muestra el árbol visual completo de carpetas y subcarpetas.

[ACCIÓN]: Ejecuta 'dir' para ver tus archivos y completar el tutorial.`, "var(--matrix-green)"); 
    }
    
    function showTutorialFirewall() { 
        printLine(`\n--- MÓDULO: BLUE TEAM (Defensa y Administración) ---
1. netsh advfirewall show allprofiles : Muestra si tu Firewall está ON u OFF.
2. netsh advfirewall set allprofiles state on / off : Enciende o apaga el escudo de Windows.
3. netsh advfirewall firewall add rule name="Bloqueo" dir=in action=block remoteip=<IP> : Bloquea permanentemente el acceso de un atacante a tu red.
4. tasklist : Lista todos los procesos y programas corriendo en la memoria RAM.
5. taskkill /PID <numero> /F : Fuerza el cierre de un proceso malicioso.
6. net user : Lista todos los usuarios registrados en tu PC.
7. net user <nombre> /delete : Elimina un usuario del sistema.
8. net localgroup administradores : Muestra qué usuarios tienen control total.
9. whoami : Muestra qué usuario estás utilizando en este momento.
10. net share : Lista qué carpetas estás compartiendo con el resto de la red.
11. net share <nombre> /delete : Deshabilita una carpeta compartida.
12. net use Z: \\\\servidor\\<carpeta> : Conecta una carpeta remota a tu disco Z:.
13. sfc /scannow : Escanea y repara archivos corruptos del sistema operativo.

[ACCIÓN]: Ejecuta 'netsh advfirewall show allprofiles' para completar.`, "var(--matrix-green)"); 
    }
    
    function showTutorialAtaque() {
        printLine(`\n--- MÓDULO: RED TEAM (Ataque y Penetración) ---
1. nmap <ip> o <ip/24> : Escanea una IP para ver sus puertos vulnerables, o escanea toda la red buscando equipos encendidos.
2. ping -t -l 65500 <ip> : Ataque de Denegación de Servicio (DoS). Satura la red del objetivo enviando paquetes gigantes.
3. crack <ip> <puerto> : Herramienta de fuerza bruta. Intenta adivinar contraseñas remotas usando un diccionario.
4. net user <nombre> /add : Comando para inyectar un usuario fantasma en la PC objetivo.
5. net localgroup administradores <nombre> /add : Eleva los permisos del usuario fantasma para robar el control total.

[ACCIÓN]: Escanea la red con 'nmap 192.168.1.0/24' para completar el entrenamiento.`, "var(--warning)");
    }

    // ================= FUNCIONES DE RANGO Y UI =================
    function checkRank() {
        let tutsDone = Object.values(tutorialStatus).filter(Boolean).length === 4;
        let missionsDone = completedMissionsCount;
        let currentRank = sessionStorage.getItem("userRank") || "ESTUDIANTE";
        let newRank = "ESTUDIANTE";
        let msg = "";

        if (missionsDone >= 20) {
            newRank = "THE KING/QUEEN OF THE HACKER";
            msg = "Has conquistado todos los desafíos absolutos del simulador.";
        } else if (missionsDone >= 15) {
            newRank = "FUTURO HACKER";
            msg = "Tu conocimiento supera las barreras estándar.";
        } else if (missionsDone >= 10) {
            newRank = "ADMINISTRADOR DE REDES SENIOR";
            msg = "Controlas la red con maestría y seguridad.";
        } else if (missionsDone >= 5) {
            newRank = "ADMINISTRADOR DE REDES SEMI-SENIOR";
            msg = "Tus habilidades de resolución de crisis son notables.";
        } else if (tutsDone) {
            newRank = "ADMINISTRADOR DE REDES - JUNIOR";
            msg = "Haz completado todos los tutoriales ahora eres administrador de redes junior.";
        }

        if (newRank !== currentRank && newRank !== "ESTUDIANTE") {
            sessionStorage.setItem("userRank", newRank);
            if(userRankLabel) userRankLabel.innerText = "RANGO: " + newRank;
            printLine(`\n=================================================`, "var(--matrix-green)");
            printLine(`¡ASCENSO CONCEDIDO!`, "var(--matrix-green)");
            printLine(`${msg}`, "var(--matrix-green)");
            printLine(`Nuevo Rango: ${newRank}`, "var(--ui-blue)");
            printLine(`=================================================\n`, "var(--matrix-green)");
        } else if (currentRank !== "ESTUDIANTE") {
            if(userRankLabel) userRankLabel.innerText = "RANGO: " + currentRank;
        }
    }

    function completeTutorial(tut) {
        if(currentMissionId !== 0) return; 
        if (!tutorialStatus[tut]) {
            tutorialStatus[tut] = true;
            sessionStorage.setItem("tutStatus", JSON.stringify(tutorialStatus));
            const el = document.getElementById(`m_${tut}`);
            if(el) el.innerHTML = `Módulo <span class="status-done">[COMPLETADO]</span>`;
            checkRank(); 
        }
    }

    setInterval(() => {
        if(activeTimeLabel) {
            secondsActive++;
            const hrs = String(Math.floor(secondsActive / 3600)).padStart(2, '0');
            const mins = String(Math.floor((secondsActive % 3600) / 60)).padStart(2, '0');
            const secs = String(secondsActive % 60).padStart(2, '0');
            activeTimeLabel.innerText = `TIEMPO ACTIVO: ${hrs}:${mins}:${secs}`;
        }
    }, 1000);

    setInterval(() => {
        if(!isProcessing && document.getElementById('gauge-cpu')) {
            document.getElementById('gauge-cpu').style.setProperty('--p', Math.floor(Math.random() * 15) + 5);
            document.getElementById('gauge-red').style.setProperty('--p', Math.floor(Math.random() * 10) + 1);
        }
    }, 2000);

    function scrollToBottom() { if(terminalContent) terminalContent.scrollTop = terminalContent.scrollHeight; }
    function updatePrompt() { if(promptText) promptText.innerText = `${currentDir}>`; }

    function loadMissionUI(id) {
        const list = document.getElementById('mission-list-ui');
        if(!list) return;
        list.innerHTML = "";
        
        if(id === 0) {
            document.getElementById('mission-title').innerText = "GUÍA DE APRENDIZAJE";
            document.getElementById('mission-desc').innerText = "Aprende herramientas Ofensivas y Defensivas.";
            list.innerHTML = `
                <li id="m_red">Módulo Redes <span class="m-status">${tutorialStatus.red ? '[COMPLETADO]' : '[PENDIENTE]'}</span></li>
                <li id="m_dos">Módulo DOS <span class="m-status">${tutorialStatus.dos ? '[COMPLETADO]' : '[PENDIENTE]'}</span></li>
                <li id="m_fw">Módulo Defensa <span class="m-status">${tutorialStatus.fw ? '[COMPLETADO]' : '[PENDIENTE]'}</span></li>
                <li id="m_atk">Módulo Ataque <span class="m-status">${tutorialStatus.atk ? '[COMPLETADO]' : '[PENDIENTE]'}</span></li>`;
        } else {
            const m = missionsData[id];
            document.getElementById('mission-title').innerText = m.title;
            document.getElementById('mission-desc').innerText = m.desc;
            m.steps.forEach((step, idx) => {
                list.innerHTML += `<li id="step_${idx}">${step.text} <span class="m-status"></span></li>`;
            });
        }
    }

    // ================= FUNCIONES DE EJECUCIÓN REALISTAS =================
    function getDirObj(path) {
        if (path.endsWith("\\") && path.length > 3) path = path.slice(0, -1);
        if (!vfs[path]) vfs[path] = {}; 
        return vfs[path];
    }
    
    function executeCd(t) {
        if (!t) { printLine(currentDir); } 
        else if (t === '..') { if(currentDir.length > 3) currentDir = currentDir.substring(0, currentDir.lastIndexOf('\\')) || "C:\\"; } 
        else if (getDirObj(currentDir)[t] && getDirObj(currentDir)[t].type === "dir") { currentDir += (currentDir.endsWith("\\") ? "" : "\\") + t; } 
        else { printLine("El sistema no puede encontrar la ruta especificada."); }
    }
    
    function executeDir() {
        let folder = getDirObj(currentDir);
        let result = `\n El volumen de la unidad C no tiene etiqueta.\n El Número de serie del volumen es: 843E-12AB\n\n Directorio de ${currentDir}\n\n`;
        let d = 2, f = 0; 
        result += `10/05/2026  10:00 a. m.    <DIR>          .\n10/05/2026  10:00 a. m.    <DIR>          ..\n`;
        for (let key in folder) {
            if(folder[key]) {
                if(folder[key].type === "dir") { result += `10/05/2026  10:01 a. m.    <DIR>          ${key}\n`; d++; } 
                else { let size = key === "broma_gigante.txt" ? "53687091200" : "1024"; result += `10/05/2026  10:05 a. m.       ${size.padStart(10, ' ')}  ${key}\n`; f++; }
            }
        }
        result += `               ${f} archivos          1.024 bytes\n               ${d} dirs     45.234.122.112 bytes libres\n`;
        printLine(result);
    }

    const sleep = ms => new Promise(res => setTimeout(res, ms));

    async function executeIpconfig() {
        await sleep(400);
        printLine(`\nConfiguración IP de Windows\n\nAdaptador de Ethernet:\n   Dirección IPv4. . . . . . . . . . . . . . : ${netData.localIP}\n   Máscara de subred . . . . . . . . . . . . : ${netData.subnet}\n   Puerta de enlace predeterminada . . . . . : ${netData.gateway}\n`);
    }

    async function executeArp() {
        await sleep(600);
        let result = `\nInterfaz: ${netData.localIP} --- 0x12\n  Dirección de Internet      Dirección física      Tipo\n`;
        netData.hosts.forEach(h => { result += `  ${h.ip.padEnd(25)}  ${h.mac.toLowerCase()}     ${h.type}\n`; });
        printLine(result);
    }

    async function executePing(args) {
        const fullArg = args.join(" ");
        const isDos = fullArg.includes("-t") && fullArg.includes("-l 65500");
        const ip = args[args.length - 1];
        if (isDos) {
            printLine(`\nHaciendo ping a ${ip} con 65500 bytes de datos:`);
            if (document.getElementById('gauge-red')) document.getElementById('gauge-red').style.setProperty('--p', 99);
            for(let i=0; i<8; i++) { await sleep(300); printLine(`Respuesta desde ${ip}: bytes=65500 tiempo=999ms TTL=128`); }
            printLine(`\n[!] SOBRECARGA DETECTADA. Host ${ip} dejó de responder. Ping finalizado.`, "var(--warning)");
            if (document.getElementById('gauge-red')) document.getElementById('gauge-red').style.setProperty('--p', 5);
        } else {
            const host = netData.hosts.find(h => h.ip === ip) || (ip === netData.localIP ? {ip} : null);
            printLine(`\nHaciendo ping a ${ip} con 32 bytes de datos:`);
            let rec = 0;
            for(let i=0; i<4; i++) {
                await sleep(800);
                if (host || ip.includes("google")) { printLine(`Respuesta desde ${ip}: bytes=32 tiempo=${Math.floor(Math.random()*15+2)}ms TTL=128`); rec++; } 
                else { printLine(`Tiempo de espera agotado para esta solicitud.`); }
            }
            printLine(`\nEstadísticas de ping para ${ip}:\n    Paquetes: enviados = 4, recibidos = ${rec}, perdidos = ${4-rec} (${(4-rec)*25}% perdidos)`);
        }
    }

    async function executeNetstat() {
        await sleep(1000);
        printLine(`\nConexiones activas\n\n  Proto  Dirección local        Dirección remota       Estado\n  TCP    ${netData.localIP}:135       0.0.0.0:0              LISTENING\n  TCP    ${netData.localIP}:4444       0.0.0.0:0              LISTENING\n  TCP    ${netData.localIP}:3389       203.0.113.45:51234     ESTABLISHED\n`);
    }

    async function executeTracert(ip) {
        printLine(`\nTraza a ${ip} sobre un máximo de 30 saltos:\n`); await sleep(1000);
        if(netData.gateway === "192.168.1.105" && ip === "8.8.8.8") { printLine(`  1     1 ms    <1 ms     1 ms  192.168.1.105 [CLON-PC]\n  2    15 ms    14 ms    15 ms  ${ip}\nTraza completa.`); } 
        else { printLine(`  1     1 ms    <1 ms     1 ms  ${netData.gateway}\n  2    15 ms    14 ms    15 ms  10.20.30.1\n  3    22 ms    21 ms    22 ms  ${ip}\nTraza completa.`); }
    }

    async function executeNbtstat(ip) {
        await sleep(600);
        const host = netData.hosts.find(h => h.ip === ip);
        if(host) { printLine(`\nTabla NetBIOS del equipo remoto\n    ${host.name.padEnd(15)}  <00>  Registrado\n    MAC = ${host.mac}\n`); } 
        else { printLine(`\nHost no encontrado.`); }
    }

    async function executeRoutePrint() { await sleep(500); printLine(`\nDestino de red        Máscara de red   Puerta de enlace\n0.0.0.0               0.0.0.0          ${netData.gateway}\n`); }
    async function executeSystemInfo() { await sleep(600); printLine(`\nNombre del host: ${netData.hostname}\nSO: Microsoft Windows 10 Pro\n`); }
    async function executeTasklist() {
        await sleep(600);
        printLine(`\nNombre de imagen               PID  Uso de memo\n========================= ======== ===========\nSystem                           4      1,248 KB\nexplorer.exe                  1852     85,412 KB\nbackdoor.exe                  9921     10,500 KB\nremote_spy.exe                4055     15,000 KB\n`);
    }

    async function executeNmap(target) {
        printLine(`\nIniciando Nmap 7.92 ( https://nmap.org ) al objetivo...`); await sleep(1500);
        if(target.includes("/24")) { printLine(`Nmap scan report for 192.168.1.1\nHost is up (0.0010s latency).\nNmap scan report for 192.168.1.15\nHost is up (0.0020s latency).\nNmap scan report for 192.168.1.106\nHost is up (0.0050s latency).\n`); } 
        else { printLine(`Nmap scan report for ${target}\nHost is up (0.0020s latency).\nNot shown: 997 closed tcp ports\nPORT     STATE SERVICE\n80/tcp   open  http\n445/tcp  open  microsoft-ds\n3389/tcp open  ms-wbt-server\n`); }
        printLine(`Nmap done: 1 IP address scanned.`);
    }

    async function executeCrack(ip, port) {
        printLine(`\nIniciando herramienta de fuerza bruta a ${ip} en puerto ${port}...`); await sleep(1000); printLine(`Cargando diccionario (rockyou.txt)... [OK]`);
        for(let i=0; i<5; i++) { await sleep(400); printLine(`[INTENTO] Admin:password${i} -> Denegado`, "var(--cmd-gray)"); }
        await sleep(800);
        printLine(`[+] ¡CONTRASEÑA ENCONTRADA!`, "var(--matrix-green)");
        printLine(`[+] IP: ${ip} | PORT: ${port} | LOGIN: Administrador | PASS: P@ssw0rd2026\n`, "var(--matrix-green)");
    }

    async function executeNetsh(cmd) {
        if(cmd.includes("show allprofiles")) { 
            printLine(`\nPerfil de dominio:\nEstado del firewall:   ${firewallState.toUpperCase()}\nPolítica de entrada:   BlockInbound\nPolítica de salida:    AllowOutbound\n`); 
            completeTutorial('fw');
        }
        else if(cmd.includes("state on")) { 
            firewallState = "on"; sessionStorage.setItem("fwState", "on"); printLine("Aceptar.\n"); 
        }
        else if(cmd.includes("state off")) { 
            firewallState = "off"; sessionStorage.setItem("fwState", "off"); printLine("Aceptar.\n[ADVERTENCIA] Sistema expuesto.", "var(--warning)"); 
        }
        else if(cmd.includes("action=block remoteip")) { printLine("Aceptar. Regla de bloqueo añadida.\n"); }
        else if(cmd.includes("set address")) { 
            netData.gateway = "192.168.1.1"; netData.localIP = "192.168.1.10"; 
            sessionStorage.setItem("savedIP", "192.168.1.10"); sessionStorage.setItem("savedGateway", "192.168.1.1");
            printLine("Aceptar. La configuración de red se ha actualizado correctamente.\n"); 
        }
        else { printLine("El comando no es válido o está incompleto."); }
    }

    async function executeNet(args) {
        if(args[1] === "user") {
            if(args[3] === "/add") { localGroupAdmins.push(args[2]); printLine("El comando se completó correctamente."); }
            else if(args[3] === "/delete") { localGroupAdmins = localGroupAdmins.filter(u => u !== args[2]); printLine("El comando se completó correctamente."); }
            else { printLine(`\nCuentas de usuario de \\\\${netData.hostname}\n-------------------------------------------------------------------\nAdministrador            Invitado                 ${localGroupAdmins.includes("Mantenimiento_Falso") ? "Mantenimiento_Falso" : ""}\nEl comando se completó correctamente.\n`); }
        }
        else if(args[1] === "localgroup") { 
            if(args[4] === "/add") { printLine("El comando se completó correctamente."); } 
            else { printLine(`\nNombre de alias     administradores\nComentario          Acceso completo al equipo.\n\nMiembros\n-------------------------------------------------------------------\n${localGroupAdmins.join("\n")}\nEl comando se completó correctamente.\n`); }
        }
        else if(args[1] === "share") {
            if(args[3] === "/delete") { sharedFolders["Peliculas"] = false; printLine("Peliculas se eliminó correctamente."); } 
            else { printLine(`\nRecurso compartido   Recurso\n----------------------------------------\nC$                   C:\\\n${sharedFolders["Peliculas"] ? "Peliculas            C:\\Users\\Public\\Videos" : ""}\n`); }
        }
        else if(args[1] === "use") { printLine("El comando se completó correctamente."); }
    }

    // ================= COMPROBADOR DE MISIONES =================
    function checkMissionProgress(cmd) {
        if(currentMissionId === 0) return;
        const mission = missionsData[currentMissionId];
        
        mission.steps.forEach((step, idx) => {
            if(!step.done && step.regex.test(cmd)) {
                step.done = true;
                const li = document.getElementById(`step_${idx}`);
                if (li) { li.classList.add('done'); li.querySelector('.m-status').innerText = "[HECHO]"; }
                printLine(`\n>>> OBJETIVO ${idx+1} COMPLETADO <<<`, "var(--matrix-green)");
            }
        });

        if(mission.steps.every(s => s.done)) {
            setTimeout(() => {
                printLine(`\n=================================================`, "var(--ui-blue)");
                printLine(`¡MISIÓN ${currentMissionId} COMPLETADA CON ÉXITO!`, "var(--matrix-green)");
                printLine(`=================================================\n`, "var(--ui-blue)");
                
                if(miniProgress) miniProgress.style.width = '100%';
                if(miniPercent) miniPercent.innerText = '100%';
                
                if(!completedMissions.includes(currentMissionId)) {
                    completedMissions.push(currentMissionId);
                    sessionStorage.setItem("compMissions", JSON.stringify(completedMissions));
                    completedMissionsCount = completedMissions.length;
                    checkRank();
                }
            }, 1000);
        } else {
            const doneCount = mission.steps.filter(s => s.done).length;
            if(miniProgress) miniProgress.style.width = ((doneCount / mission.steps.length) * 100) + '%';
            if(miniPercent) miniPercent.innerText = Math.round((doneCount / mission.steps.length) * 100) + '%';
        }
    }

    // ================= NÚCLEO DE LA CONSOLA (PARSEADOR) =================
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !isProcessing) {
            let fullCmdRaw = input.value.trim();
            if (fullCmdRaw === '') return;
            
            commandHistory.push(fullCmdRaw);
            historyIndex = commandHistory.length;
            
            printLine(`\n${currentDir}> ${fullCmdRaw}`, 'white');
            input.value = "";
            
            isProcessing = true; input.disabled = true; 
            if(taskStatus) taskStatus.innerText = "EJECUTANDO COMANDO...";

            try {
                await parseCommand(fullCmdRaw);
                checkMissionProgress(fullCmdRaw);
            } catch (err) {
                console.error(err);
                printLine(`\n[FALLO DEL SISTEMA]: Error interno al ejecutar.`, "var(--warning)");
            } finally {
                updatePrompt(); input.disabled = false; input.focus(); isProcessing = false; 
                if(taskStatus) taskStatus.innerText = "ESPERANDO INSTRUCCIONES...";
            }
        } 
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (historyIndex > 0) { historyIndex--; input.value = commandHistory[historyIndex]; } } 
        else if (e.key === 'ArrowDown') { e.preventDefault(); if (historyIndex < commandHistory.length - 1) { historyIndex++; input.value = commandHistory[historyIndex]; } else { historyIndex = commandHistory.length; input.value = ''; } }
    });

    async function parseCommand(fullCmdRaw) {
        const args = fullCmdRaw.split(/\s+/);
        const cmd = args[0].toLowerCase();

        if(cmd.match(/^[a-z]:$/i)) {
            let drive = cmd.toUpperCase();
            if(vfs[drive] || drive === "C:") { currentDir = drive + (drive === "C:" ? "\\Users\\Administrador" : "\\"); } 
            else { printLine("El sistema no puede encontrar la unidad especificada."); }
        }
        else if (cmd === 'echo' && fullCmdRaw.includes('>')) {
            const parts = fullCmdRaw.substring(4).split('>');
            getDirObj(currentDir)[parts[1].trim()] = { type: "file", content: parts[0].trim() };
        } 
        else {
            switch(cmd) {
                case 'help': showHelp(); break;
                case 'cls': case 'clear': output.innerHTML = ''; break;
                case 'misiones': showMissions(); break;
                case 'mision': 
                    if(missionsData[args[1]]) { currentMissionId = parseInt(args[1]); loadMissionUI(currentMissionId); printLine(`Misión ${currentMissionId} Iniciada.`, "var(--ui-blue)"); } 
                    else { printLine("Misión no encontrada. Escribe 'misiones' para ver la lista."); }
                    break;
                
                case 'tutorial-red': showTutorialRed(); break;
                case 'tutorial-dos': showTutorialDos(); break;
                case 'tutorial-firewall': showTutorialFirewall(); break;
                case 'tutorial-ataque': showTutorialAtaque(); break;

                case 'ipconfig': await executeIpconfig(); completeTutorial('red'); break;
                case 'ipconfig/flushdns': netData.dnsCacheEnvenenada = false; printLine("Se vació con éxito la caché de resolución de DNS."); break;
                case 'ipconfig/release': netData.localIP = "0.0.0.0"; printLine("Dirección IP liberada."); break;
                case 'ipconfig/renew': netData.localIP = "192.168.1.150"; printLine("Nueva IP asignada: 192.168.1.150"); break;
                case 'arp': await executeArp(); break;
                case 'ping': if(args[1]) await executePing(args); break;
                case 'netstat': await executeNetstat(); break;
                case 'tracert': if(args[1]) await executeTracert(args[1]); break;
                case 'nbtstat': if(args[2]) await executeNbtstat(args[2]); break;
                case 'getmac': printLine(`\nDirección física    Transporte Nombre\n=================== ==========================================================\n${netData.macLocal.toUpperCase()}   \\Device\\Tcpip_{AAAA-BBBB-CCCC-DDDD}`); break;
                case 'hostname': printLine(netData.hostname); break;
                case 'route': if(args[1] === 'print') await executeRoutePrint(); break;
                case 'systeminfo': await executeSystemInfo(); break;
                case 'nslookup': 
                    if(netData.dnsCacheEnvenenada) { printLine(`Servidor: dns.google\nNombre: ${args[1]}\nAddress: 192.168.1.111`); } 
                    else { printLine(`Servidor: dns.google\nNombre: ${args[1]}\nAddress: 142.250.190.46`); }
                    break;
                
                case 'nmap': if(args[1]) await executeNmap(args[1]); else printLine("Uso: nmap <ip>"); completeTutorial('atk'); break;
                case 'crack': if(args[1] && args[2]) await executeCrack(args[1], args[2]); else printLine("Uso: crack <ip> <puerto>"); break;

                case 'netsh': await executeNetsh(fullCmdRaw); break;
                case 'net': await executeNet(args); break;
                case 'whoami': printLine("redescolar\\Administrador"); break;
                case 'sfc': await sleep(1500); printLine("Protección de recursos de Windows encontró archivos dañados y los reparó correctamente."); break;

                case 'dir': executeDir(); completeTutorial('dos'); break;
                case 'cd': executeCd(args[1]); break;
                case 'mkdir': case 'md': if(args[1]) getDirObj(currentDir)[args[1]] = { type: "dir" }; break;
                case 'del': 
                    if(args[1] === '*.mp4') { getDirObj(currentDir)["spiderman.mp4"] = null; printLine("Archivos eliminados."); } 
                    else if(getDirObj(currentDir)[args[1]]) { delete getDirObj(currentDir)[args[1]]; printLine("Archivo eliminado."); } 
                    else { printLine("No se pudo encontrar el archivo."); }
                    break;
                case 'type': if(getDirObj(currentDir)[args[1]]) printLine(getDirObj(currentDir)[args[1]].content); else printLine("El sistema no puede encontrar el archivo."); break;
                case 'tree': printLine("C:.\n├───Descargas\n│   ├───gusano.bat\n│   └───broma_gigante.txt\n└───Oculto\n    └───Sistema\n        └───respuestas.txt"); break;

                case 'tasklist': await executeTasklist(); break;
                case 'taskkill': printLine("CORRECTO: Se envió la señal de terminación al proceso."); break;

                default: printLine(`'${cmd}' no se reconoce como un comando interno o externo, programa o archivo por lotes ejecutable.`);
            }
        }
    }

    // Check UI at load
    loadMissionUI(currentMissionId);
    printLine(">> Entorno de Simulación EEST N°10 Operativo. 60 nodos detectados.", "var(--matrix-green)");
    checkRank(); // Verifica por si ya había datos guardados

}); // Cierre del DOMContentLoaded

// Funciones Globales para el Modal
window.exitSimulator = function() { document.getElementById('edu-modal').classList.remove('hidden'); }
window.resumeSimulator = function() { document.getElementById('edu-modal').classList.add('hidden'); document.getElementById('terminal-input').focus(); }
window.restartSimulator = function() { sessionStorage.clear(); location.reload(); }
window.closeSimulator = function() { window.close(); setTimeout(() => alert("Cierra la pestaña desde la 'X' superior."), 500); }