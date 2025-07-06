const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class Brain {
    constructor(socket, ear) {
        this.sock = socket;
        this.ear = ear; // Referencia al módulo Ear
        this.plugins = new Map();
        this.memory = {};
        this.pluginsPath = path.join(__dirname, 'plugins');
        this.memoryPath = path.join(__dirname, 'memory.json');
        
        this.initialize();
    }

    async initialize() {
        console.log(chalk.blue.bold('🧠 Inicializando Brain...'));
        
        // Crear carpeta de plugins si no existe
        if (!fs.existsSync(this.pluginsPath)) {
            fs.mkdirSync(this.pluginsPath, { recursive: true });
            console.log(chalk.green('📁 Carpeta de plugins creada'));
        }

        // Cargar memoria
        this.loadMemory();
        
        // Cargar plugins
        await this.loadPlugins();
        
        console.log(chalk.green.bold('✅ Brain inicializado correctamente'));
    }

    loadMemory() {
        try {
            if (fs.existsSync(this.memoryPath)) {
                const data = fs.readFileSync(this.memoryPath, 'utf8');
                this.memory = JSON.parse(data);
                
                // Convertir arrays de participantes a Set para grupos existentes
                if (this.memory.groups) {
                    Object.keys(this.memory.groups).forEach(groupId => {
                        const group = this.memory.groups[groupId];
                        if (group.participants) {
                            // Si participants es un array, convertirlo a Set
                            if (Array.isArray(group.participants)) {
                                group.participants = new Set(group.participants);
                            }
                            // Si participants es un objeto, convertir sus keys a Set
                            else if (typeof group.participants === 'object' && !group.participants.add) {
                                group.participants = new Set(Object.keys(group.participants));
                            }
                        }
                    });
                }
                
                console.log(chalk.cyan('🧠 Memoria cargada:'), chalk.white.bold(Object.keys(this.memory).length), chalk.cyan('registros'));
            } else {
                this.memory = {
                    commands: {},
                    users: {},
                    groups: {},
                    settings: {},
                    stats: {
                        totalMessages: 0,
                        totalCommands: 0,
                        startTime: new Date().toISOString()
                    }
                };
                this.saveMemory();
                console.log(chalk.cyan('🧠 Memoria inicializada'));
            }
        } catch (error) {
            console.error(chalk.red.bold('❌ Error cargando memoria:'), chalk.red(error));
            this.memory = {
                commands: {},
                users: {},
                groups: {},
                settings: {},
                stats: {
                    totalMessages: 0,
                    totalCommands: 0,
                    startTime: new Date().toISOString()
                }
            };
        }
    }

    saveMemory() {
        try {
            // Crear una copia de la memoria para serialización
            const memoryToSave = JSON.parse(JSON.stringify(this.memory));
            
            // Convertir Sets a arrays para la serialización
            if (memoryToSave.groups) {
                Object.keys(memoryToSave.groups).forEach(groupId => {
                    const group = memoryToSave.groups[groupId];
                    if (group.participants && group.participants instanceof Set) {
                        group.participants = Array.from(group.participants);
                    }
                });
            }
            
            fs.writeFileSync(this.memoryPath, JSON.stringify(memoryToSave, null, 2));
        } catch (error) {
            console.error(chalk.red.bold('❌ Error guardando memoria:'), chalk.red(error));
        }
    }

    async loadPlugins() {
        try {
            const files = fs.readdirSync(this.pluginsPath);
            const pluginFiles = files.filter(file => file.endsWith('.js'));
            
            console.log(chalk.blue('📋 Cargando'), chalk.white.bold(pluginFiles.length), chalk.blue('plugins...'));
            
            let loadedCount = 0;
            let failedCount = 0;
            
            for (const file of pluginFiles) {
                try {
                    const pluginPath = path.join(this.pluginsPath, file);
                    
                    // Limpiar caché del require
                    delete require.cache[require.resolve(pluginPath)];
                    
                    const plugin = require(pluginPath);
                    
                    if (plugin && plugin.command && plugin.handler) {
                        this.plugins.set(plugin.command, plugin);
                        
                        // Guardar en memoria
                        this.memory.commands[plugin.command] = {
                            file: file,
                            description: plugin.description || 'Sin descripción',
                            category: plugin.category || 'general',
                            usage: plugin.usage || `${plugin.command}`,
                            loadTime: new Date().toISOString()
                        };
                        
                        console.log(chalk.green('  ✅'), chalk.white.bold(plugin.command), chalk.dim(`(${file})`));
                        loadedCount++;
                    } else {
                        console.log(chalk.yellow('  ⚠️  Plugin inválido:'), chalk.yellow(file));
                        failedCount++;
                    }
                } catch (error) {
                    console.log(chalk.red('  ❌'), chalk.red(file), chalk.red.dim(`- ${error.message}`));
                    failedCount++;
                }
            }
            
            this.saveMemory();
            
            // Resumen de carga
            console.log(chalk.green.bold('\n🎉 Resumen de carga de plugins:'));
            console.log(chalk.green('  ✅ Exitosos:'), chalk.white.bold(loadedCount));
            if (failedCount > 0) {
                console.log(chalk.red('  ❌ Fallidos:'), chalk.white.bold(failedCount));
            }
            console.log(chalk.cyan('  📊 Total cargados:'), chalk.white.bold(this.plugins.size));
            
        } catch (error) {
            console.error(chalk.red.bold('❌ Error cargando plugins:'), chalk.red(error));
        }
    }

    async processMessage(messageData) {
        if (!messageData) return;
        
        // Actualizar estadísticas
        this.memory.stats.totalMessages++;
        
        // Guardar información del usuario
        this.updateUserInfo(messageData);
        
        // Si es un comando, procesarlo
        if (messageData.isCommand) {
            // Loggear el comando antes de procesarlo
            this.ear.logCommandMessage(messageData);
            await this.processCommand(messageData);
        }
        
        // Guardar memoria cada 10 mensajes
        if (this.memory.stats.totalMessages % 10 === 0) {
            this.saveMemory();
        }
    }

    updateUserInfo(messageData) {
        const userId = messageData.participant;
        
        if (!this.memory.users[userId]) {
            this.memory.users[userId] = {
                id: userId,
                firstSeen: new Date().toISOString(),
                messageCount: 0,
                commandCount: 0,
                lastSeen: new Date().toISOString()
            };
        }
        
        this.memory.users[userId].messageCount++;
        this.memory.users[userId].lastSeen = new Date().toISOString();
        
        if (messageData.isCommand) {
            this.memory.users[userId].commandCount++;
        }
        
        // Guardar información del grupo si es necesario
        if (messageData.isGroup) {
            const groupId = messageData.from;
            if (!this.memory.groups[groupId]) {
                this.memory.groups[groupId] = {
                    id: groupId,
                    firstSeen: new Date().toISOString(),
                    messageCount: 0,
                    participants: new Set()
                };
            }
            
            this.memory.groups[groupId].messageCount++;
            
            // Asegurar que participants sea un Set
            if (!(this.memory.groups[groupId].participants instanceof Set)) {
                this.memory.groups[groupId].participants = new Set();
            }
            
            this.memory.groups[groupId].participants.add(userId);
            this.memory.groups[groupId].lastActivity = new Date().toISOString();
        }
    }

    async processCommand(messageData) {
        const command = messageData.command;
        
        // Actualizar estadísticas
        this.memory.stats.totalCommands++;
        
        // Buscar plugin correspondiente
        const plugin = this.plugins.get(command.name);
        
        if (plugin) {
            try {
                const startTime = Date.now();
                
                const context = {
                    sock: this.sock,
                    message: messageData,
                    command: command,
                    memory: this.memory,
                    brain: this
                };
                
                await plugin.handler(context);
                
                const executionTime = Date.now() - startTime;
                
                // Mostrar resultado de ejecución con formato compacto
                console.log(`${chalk.gray('│')} ${chalk.green('✅ Ejecutado en')} ${chalk.white.bold(executionTime + 'ms')}`);
                console.log(chalk.red.bold('└─────────────────────────────────────────────────────────────'));
                
            } catch (error) {
                console.error(`${chalk.gray('│')} ${chalk.red.bold('❌ Error:')} ${chalk.red(error.message)}`);
                console.log(chalk.red.bold('└─────────────────────────────────────────────────────────────'));
                
                // Enviar mensaje de error al usuario
                await this.sendMessage(messageData.from, 
                    `❌ Error ejecutando el comando "${command.name}": ${error.message}`);
            }
        } else {
            console.log(`${chalk.gray('│')} ${chalk.yellow.bold('⚠️  Comando no encontrado')}`);
            console.log(chalk.red.bold('└─────────────────────────────────────────────────────────────'));
            
            // Mensaje actualizado para comando no reconocido
            const notFoundMessage = `⚠ *Comando no reconocido*
─────────────────────────────
→ Escriba *#menu* para ver la lista completa de comandos disponibles`;
            
            await this.sendMessage(messageData.from, notFoundMessage);
        }
    }

    async sendMessage(jid, text) {
        try {
            await this.sock.sendMessage(jid, { text: text });
        } catch (error) {
            console.error(chalk.red.bold('❌ Error enviando mensaje:'), chalk.red(error));
        }
    }

    async reloadPlugins() {
        console.log(chalk.blue.bold('🔄 Recargando plugins...'));
        this.plugins.clear();
        await this.loadPlugins();
        return this.plugins.size;
    }

    getStats() {
        const uptime = Date.now() - new Date(this.memory.stats.startTime).getTime();
        const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
        const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
            totalMessages: this.memory.stats.totalMessages,
            totalCommands: this.memory.stats.totalCommands,
            totalUsers: Object.keys(this.memory.users).length,
            totalGroups: Object.keys(this.memory.groups).length,
            totalPlugins: this.plugins.size,
            uptime: uptime,
            uptimeFormatted: `${uptimeHours}h ${uptimeMinutes}m`,
            startTime: this.memory.stats.startTime
        };
    }

    // Método para obtener comandos disponibles
    getAvailableCommands() {
        const commands = {};
        this.plugins.forEach((plugin, command) => {
            commands[command] = {
                description: plugin.description || 'Sin descripción',
                usage: plugin.usage || command,
                category: plugin.category || 'general'
            };
        });
        return commands;
    }

    // Método para mostrar estadísticas en consola
    logStats() {
        const stats = this.getStats();
        
        console.log(chalk.magenta.bold('\n📊 ESTADÍSTICAS DEL BOT'));
        console.log(chalk.magenta('─'.repeat(40)));
        console.log(chalk.cyan('💬 Mensajes totales:'), chalk.white.bold(stats.totalMessages));
        console.log(chalk.cyan('🤖 Comandos ejecutados:'), chalk.white.bold(stats.totalCommands));
        console.log(chalk.cyan('👥 Usuarios únicos:'), chalk.white.bold(stats.totalUsers));
        console.log(chalk.cyan('🏠 Grupos activos:'), chalk.white.bold(stats.totalGroups));
        console.log(chalk.cyan('🔌 Plugins cargados:'), chalk.white.bold(stats.totalPlugins));
        console.log(chalk.cyan('⏱️  Tiempo activo:'), chalk.white.bold(stats.uptimeFormatted));
        console.log(chalk.magenta('─'.repeat(40)));
    }
}

module.exports = Brain;