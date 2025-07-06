const chalk = require('chalk');

// Plugin para mostrar información de grupos
const groupInfoPlugin = {
    command: 'grupos',
    description: 'Muestra información detallada de los grupos donde está el bot',
    usage: 'grupos [detalle|stats|lista]',
    category: 'información',
    
    handler: async (context) => {
        const { sock, message, command, memory, brain } = context;
        
        // Verificar si hay grupos en memoria
        if (!memory.groups || Object.keys(memory.groups).length === 0) {
            await brain.sendMessage(message.from, 
                '📭 No hay información de grupos disponible.\n\n' +
                'El bot necesita recibir al menos un mensaje en los grupos para registrarlos.'
            );
            return;
        }
        
        const subCommand = command.args[0]?.toLowerCase() || 'lista';
        
        switch (subCommand) {
            case 'detalle':
            case 'detail':
                await showGroupDetails(context);
                break;
                
            case 'stats':
            case 'estadisticas':
                await showGroupStats(context);
                break;
                
            case 'lista':
            case 'list':
            default:
                await showGroupList(context);
                break;
        }
    }
};

// Función para mostrar lista básica de grupos
async function showGroupList(context) {
    const { sock, memory, brain, message } = context;
    
    const groups = memory.groups;
    const groupCount = Object.keys(groups).length;
    
    let response = `📋 *GRUPOS REGISTRADOS* (${groupCount})\n`;
    response += '═'.repeat(30) + '\n\n';
    
    let counter = 1;
    for (const [groupId, groupData] of Object.entries(groups)) {
        const participantCount = groupData.participants ? 
            (groupData.participants instanceof Set ? 
                groupData.participants.size : 
                Object.keys(groupData.participants).length) : 0;
        
        const lastActivity = groupData.lastActivity ? 
            new Date(groupData.lastActivity).toLocaleDateString('es-ES') : 
            'N/A';
        
        // Obtener nombre del grupo
        let groupName = 'Sin nombre';
        try {
            const groupMetadata = await sock.groupMetadata(groupId);
            groupName = groupMetadata.subject || 'Sin nombre';
        } catch (error) {
            // Si no puede obtener metadatos, usar valor por defecto
        }
        
        response += `${counter}. 🏠 *${groupName}*\n`;
        response += `   📊 ${groupData.messageCount || 0} mensajes\n`;
        response += `   👥 ${participantCount} participantes\n`;
        response += `   📅 Última actividad: ${lastActivity}\n\n`;
        
        counter++;
    }
    
    response += '💡 *Comandos disponibles:*\n';
    response += '• `grupos detalle` - Información detallada\n';
    response += '• `grupos stats` - Estadísticas generales';
    
    await brain.sendMessage(message.from, response);
}

// Función para mostrar detalles completos de grupos
async function showGroupDetails(context) {
    const { sock, memory, brain, message } = context;
    
    const groups = memory.groups;
    
    let response = `📊 *INFORMACIÓN DETALLADA DE GRUPOS*\n`;
    response += '═'.repeat(40) + '\n\n';
    
    let counter = 1;
    for (const [groupId, groupData] of Object.entries(groups)) {
        const participantCount = groupData.participants ? 
            (groupData.participants instanceof Set ? 
                groupData.participants.size : 
                Object.keys(groupData.participants).length) : 0;
        
        const firstSeen = groupData.firstSeen ? 
            new Date(groupData.firstSeen).toLocaleString('es-ES') : 
            'N/A';
        
        const lastActivity = groupData.lastActivity ? 
            new Date(groupData.lastActivity).toLocaleString('es-ES') : 
            'N/A';
        
        // Calcular días desde la primera vez visto
        const daysSinceFirst = groupData.firstSeen ? 
            Math.floor((Date.now() - new Date(groupData.firstSeen).getTime()) / (1000 * 60 * 60 * 24)) : 
            0;
        
        // Intentar obtener información del grupo desde WhatsApp
        let groupName = 'Sin nombre';
        let groupDescription = '';
        
        try {
            const groupMetadata = await sock.groupMetadata(groupId);
            groupName = groupMetadata.subject || 'Sin nombre';
            groupDescription = groupMetadata.desc || '';
        } catch (error) {
            // Si no puede obtener metadatos, usar valores por defecto
            console.log(`No se pudo obtener información del grupo ${groupId}: ${error.message}`);
        }
        
        response += `🏠 *GRUPO ${counter}*\n`;
        response += `┌─────────────────────────────────────\n`;
        response += `│ 📛 Nombre: ${groupName}\n`;
        response += `│ 🆔 ID: ${groupId}\n`;
        response += `│ 💬 Mensajes: ${groupData.messageCount || 0}\n`;
        response += `│ 👥 Participantes: ${participantCount}\n`;
        response += `│ 📅 Primer contacto: ${firstSeen}\n`;
        response += `│ 🕐 Última actividad: ${lastActivity}\n`;
        response += `│ 📊 Días activo: ${daysSinceFirst}\n`;
        
        if (groupDescription) {
            // Limitar descripción a 50 caracteres
            const shortDesc = groupDescription.length > 50 ? 
                groupDescription.substring(0, 50) + '...' : 
                groupDescription;
            response += `│ 📝 Descripción: ${shortDesc}\n`;
        }
        
        response += `└─────────────────────────────────────\n\n`;
        
        counter++;
    }
    
    await brain.sendMessage(message.from, response);
}

// Función para mostrar estadísticas generales
async function showGroupStats(context) {
    const { sock, memory, brain, message } = context;
    
    const groups = memory.groups;
    const groupCount = Object.keys(groups).length;
    
    if (groupCount === 0) {
        await brain.sendMessage(message.from, '📭 No hay grupos registrados.');
        return;
    }
    
    // Calcular estadísticas
    let totalMessages = 0;
    let totalParticipants = 0;
    let mostActiveGroup = null;
    let mostActiveMessages = 0;
    let mostActiveGroupName = 'Sin nombre';
    let oldestGroup = null;
    let oldestDate = null;
    let oldestGroupName = 'Sin nombre';
    
    for (const [groupId, groupData] of Object.entries(groups)) {
        const messages = groupData.messageCount || 0;
        const participants = groupData.participants ? 
            (groupData.participants instanceof Set ? 
                groupData.participants.size : 
                Object.keys(groupData.participants).length) : 0;
        
        totalMessages += messages;
        totalParticipants += participants;
        
        // Grupo más activo
        if (messages > mostActiveMessages) {
            mostActiveMessages = messages;
            mostActiveGroup = groupId;
            
            // Obtener nombre del grupo más activo
            try {
                const groupMetadata = await sock.groupMetadata(groupId);
                mostActiveGroupName = groupMetadata.subject || 'Sin nombre';
            } catch (error) {
                mostActiveGroupName = 'Sin nombre';
            }
        }
        
        // Grupo más antiguo
        if (groupData.firstSeen) {
            const groupDate = new Date(groupData.firstSeen);
            if (!oldestDate || groupDate < oldestDate) {
                oldestDate = groupDate;
                oldestGroup = groupId;
                
                // Obtener nombre del grupo más antiguo
                try {
                    const groupMetadata = await sock.groupMetadata(groupId);
                    oldestGroupName = groupMetadata.subject || 'Sin nombre';
                } catch (error) {
                    oldestGroupName = 'Sin nombre';
                }
            }
        }
    }
    
    const avgMessages = Math.round(totalMessages / groupCount);
    const avgParticipants = Math.round(totalParticipants / groupCount);
    
    let response = `📊 *ESTADÍSTICAS DE GRUPOS*\n`;
    response += '═'.repeat(30) + '\n\n';
    
    response += `📈 *Resumen General:*\n`;
    response += `• 🏠 Total de grupos: ${groupCount}\n`;
    response += `• 💬 Total de mensajes: ${totalMessages}\n`;
    response += `• 👥 Total de participantes: ${totalParticipants}\n`;
    response += `• 📊 Promedio mensajes/grupo: ${avgMessages}\n`;
    response += `• 👥 Promedio participantes/grupo: ${avgParticipants}\n\n`;
    
    if (mostActiveGroup) {
        response += `🔥 *Grupo más activo:*\n`;
        response += `• 📛 ${mostActiveGroupName}\n`;
        response += `• 💬 ${mostActiveMessages} mensajes\n`;
        response += `• 🆔 ${mostActiveGroup}\n\n`;
    }
    
    if (oldestGroup && oldestDate) {
        response += `👴 *Grupo más antiguo:*\n`;
        response += `• 📛 ${oldestGroupName}\n`;
        response += `• 📅 ${oldestDate.toLocaleDateString('es-ES')}\n`;
        response += `• 🆔 ${oldestGroup}\n\n`;
    }
    
    // Distribución de actividad
    const activityRanges = {
        'Muy activos (>50 mensajes)': 0,
        'Activos (11-50 mensajes)': 0,
        'Moderados (1-10 mensajes)': 0,
        'Inactivos (0 mensajes)': 0
    };
    
    Object.values(groups).forEach(group => {
        const messages = group.messageCount || 0;
        if (messages > 50) activityRanges['Muy activos (>50 mensajes)']++;
        else if (messages > 10) activityRanges['Activos (11-50 mensajes)']++;
        else if (messages > 0) activityRanges['Moderados (1-10 mensajes)']++;
        else activityRanges['Inactivos (0 mensajes)']++;
    });
    
    response += `📊 *Distribución de Actividad:*\n`;
    Object.entries(activityRanges).forEach(([range, count]) => {
        if (count > 0) {
            response += `• ${range}: ${count}\n`;
        }
    });
    
    await brain.sendMessage(message.from, response);
}

module.exports = groupInfoPlugin;