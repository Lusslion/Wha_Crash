// plugins/ping.js - Plugin de ejemplo
module.exports = {
    command: 'ping',
    description: 'Comando de prueba que responde con pong',
    category: 'utilidades',
    usage: 'ping',
    
    async handler(context) {
        const { sock, message, command } = context;
        
        const startTime = Date.now();
        
        // Responder con pong
        await sock.sendMessage(message.from, {
            text: `🏓 Pong!\n⏱️ Latencia: ${Date.now() - startTime}ms`
        });
    }
};

// Ejemplo de otro plugin más complejo
// plugins/help.js
/*
module.exports = {
    command: 'help',
    description: 'Muestra la lista de comandos disponibles',
    category: 'utilidades',
    usage: 'help [comando]',
    
    async handler(context) {
        const { sock, message, command, brain } = context;
        const args = command.args;
        
        if (args.length > 0) {
            // Mostrar ayuda específica de un comando
            const commandName = args[0];
            const plugin = brain.plugins.get(commandName);
            
            if (plugin) {
                const helpText = `📋 *Comando: ${commandName}*\n\n` +
                    `📝 *Descripción:* ${plugin.description}\n` +
                    `🏷️ *Categoría:* ${plugin.category}\n` +
                    `💡 *Uso:* ${plugin.usage}`;
                
                await sock.sendMessage(message.from, { text: helpText });
            } else {
                await sock.sendMessage(message.from, { 
                    text: `❌ El comando "${commandName}" no existe.` 
                });
            }
        } else {
            // Mostrar lista de todos los comandos
            const commands = brain.getAvailableCommands();
            let helpText = '📋 *Lista de Comandos Disponibles:*\n\n';
            
            const categories = {};
            Object.keys(commands).forEach(cmd => {
                const category = commands[cmd].category;
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push(cmd);
            });
            
            Object.keys(categories).forEach(category => {
                helpText += `🏷️ *${category.toUpperCase()}:*\n`;
                categories[category].forEach(cmd => {
                    helpText += `   • ${cmd} - ${commands[cmd].description}\n`;
                });
                helpText += '\n';
            });
            
            helpText += '💡 *Usa:* help [comando] para más información';
            
            await sock.sendMessage(message.from, { text: helpText });
        }
    }
};
*/