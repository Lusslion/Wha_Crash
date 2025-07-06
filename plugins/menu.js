const chalk = require('chalk');

const plugin = {
    command: 'menu',
    description: 'Muestra la lista de comandos disponibles con sus descripciones y uso',
    category: 'utilidades',
    usage: 'menu [categoría]',
    
    handler: async (context) => {
        const { sock, message, command, brain } = context;
        
        console.log(`${chalk.gray('│')} ${chalk.blue.bold('📋 Mostrando menú de comandos')}`);
        
        try {
            const availableCommands = brain.getAvailableCommands();
            const categoryFilter = command.args.join(' ').toLowerCase();
            
            if (Object.keys(availableCommands).length === 0) {
                await sock.sendMessage(message.from, { 
                    text: '```No hay comandos disponibles en este momento```' 
                });
                return;
            }
            
            // Agrupar comandos por categoría
            const categories = {};
            Object.entries(availableCommands).forEach(([cmd, info]) => {
                const category = info.category || 'general';
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push({ command: cmd, ...info });
            });
            
            // Filtrar por categoría si se especifica
            if (categoryFilter) {
                const filteredCategories = {};
                Object.keys(categories).forEach(cat => {
                    if (cat.toLowerCase().includes(categoryFilter)) {
                        filteredCategories[cat] = categories[cat];
                    }
                });
                
                if (Object.keys(filteredCategories).length === 0) {
                    const availableCategories = Object.keys(categories).join(' • ');
                    await sock.sendMessage(message.from, { 
                        text: `*Categoría no encontrada*\n\n*Categorías disponibles:*\n${availableCategories}` 
                    });
                    return;
                }
                
                Object.assign(categories, filteredCategories);
                Object.keys(categories).forEach(cat => {
                    if (!filteredCategories[cat]) {
                        delete categories[cat];
                    }
                });
            }
            
            // Construir mensaje del menú
            let menuText = `*MENÚ DE COMANDOS*\n`;
            menuText += `${getCategoryIcon('system')} ${Object.keys(availableCommands).length} comandos disponibles\n\n`;
            
            // Mostrar comandos por categoría
            Object.entries(categories).forEach(([category, commands]) => {
                const categoryIcon = getCategoryIcon(category);
                menuText += `${categoryIcon} *${category.toUpperCase()}*\n`;
                
                commands.forEach(cmd => {
                    menuText += `  ∟ ~${cmd.command}~\n`;
                    menuText += `     ${cmd.description}\n`;
                    
                    // Mostrar uso si es diferente del comando básico
                    if (cmd.usage && cmd.usage !== cmd.command) {
                        const simpleUsage = cmd.usage.split('\n')[0];
                        menuText += `     ◦ \`${simpleUsage}\`\n`;
                    }
                    menuText += '\n';
                });
            });
            
            // Información adicional
            menuText += `${getCategoryIcon('info')} *INFORMACIÓN*\n`;
            menuText += `  ∟ Para filtrar por categoría: ~menu [categoría]~\n`;
            menuText += `  ∟ Ejemplo: ~menu utilidades~\n`;
            menuText += `  ∟ Para ayuda detallada usa el comando sin parámetros\n\n`;
            
            menuText += `${getCategoryIcon('list')} *CATEGORÍAS*\n`;
            menuText += Object.keys(categories).map(cat => `  ◦ ${cat}`).join('\n');
            
            await sock.sendMessage(message.from, { text: menuText });
            
            console.log(`${chalk.gray('│')} ${chalk.green('✅ Menú enviado con')} ${chalk.white.bold(Object.keys(availableCommands).length)} ${chalk.green('comandos')}`);
            
        } catch (error) {
            console.error(`${chalk.gray('│')} ${chalk.red.bold('❌ Error mostrando menú:')} ${chalk.red(error.message)}`);
            await sock.sendMessage(message.from, { 
                text: '```Error al mostrar el menú de comandos```\n*Inténtalo de nuevo*' 
            });
        }
    }
};

// Función para obtener iconos elegantes según la categoría
function getCategoryIcon(category) {
    const icons = {
        'utilidades': '▣',
        'comunicación': '◈',
        'información': '◉',
        'entretenimiento': '◎',
        'moderación': '◆',
        'música': '♪',
        'descargas': '↓',
        'admin': '★',
        'sistema': '⚡',
        'general': '●',
        'system': '◦',
        'info': '◈',
        'list': '▤'
    };
    
    return icons[category.toLowerCase()] || '●';
}

module.exports = plugin;