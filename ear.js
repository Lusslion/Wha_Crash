const { jidDecode } = require('baileys');
const chalk = require('chalk');

class Ear {
    constructor(socket) {
        this.sock = socket;
        this.prefixes = ['#', '-', '!'];
    }

    processMessage(message) {
        try {
            const messageData = this.extractMessageData(message);
            // Solo loggear mensajes normales (no comandos)
            if (!messageData.isCommand) {
                this.logNormalMessage(messageData);
            }
            return messageData;
        } catch (error) {
            console.error(chalk.red.bold('❌ Error procesando mensaje:'), chalk.red(error));
            return null;
        }
    }

    extractMessageData(message) {
        const messageKey = message.key;
        const messageContent = message.message;
        
        // Extraer información del remitente
        const from = messageKey.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const isChannel = from.endsWith('@newsletter');
        const isPrivate = from.endsWith('@s.whatsapp.net');
        
        // Obtener el texto del mensaje
        let text = '';
        let messageType = 'unknown';
        
        if (messageContent.conversation) {
            text = messageContent.conversation;
            messageType = 'text';
        } else if (messageContent.extendedTextMessage) {
            text = messageContent.extendedTextMessage.text;
            messageType = 'extendedText';
        } else if (messageContent.imageMessage) {
            text = messageContent.imageMessage.caption || '';
            messageType = 'image';
        } else if (messageContent.videoMessage) {
            text = messageContent.videoMessage.caption || '';
            messageType = 'video';
        } else if (messageContent.documentMessage) {
            text = messageContent.documentMessage.caption || '';
            messageType = 'document';
        } else if (messageContent.audioMessage) {
            messageType = 'audio';
        } else if (messageContent.stickerMessage) {
            messageType = 'sticker';
        }

        // Información del participante (para grupos)
        const participant = messageKey.participant || from;
        
        // Verificar si es un comando
        const isCommand = this.isCommand(text);
        const command = isCommand ? this.extractCommand(text) : null;
        
        return {
            id: messageKey.id,
            from: from,
            participant: participant,
            text: text,
            messageType: messageType,
            isGroup: isGroup,
            isChannel: isChannel,
            isPrivate: isPrivate,
            isCommand: isCommand,
            command: command,
            timestamp: new Date(),
            raw: message
        };
    }

    isCommand(text) {
        if (!text || typeof text !== 'string') return false;
        return this.prefixes.some(prefix => text.startsWith(prefix));
    }

    extractCommand(text) {
        if (!this.isCommand(text)) return null;
        
        const prefix = this.prefixes.find(p => text.startsWith(p));
        const commandText = text.slice(prefix.length).trim();
        const parts = commandText.split(' ');
        
        return {
            prefix: prefix,
            name: parts[0].toLowerCase(),
            args: parts.slice(1),
            fullText: commandText
        };
    }

    // Método para loggear mensajes normales (no comandos)
    logNormalMessage(messageData) {
        if (!messageData) return;
        
        const timestamp = messageData.timestamp.toLocaleString();
        
        // Determinar el tipo de chat con colores
        let chatType, chatColor;
        if (messageData.isGroup) {
            chatType = '👥 GRUPO';
            chatColor = chalk.blue;
        } else if (messageData.isChannel) {
            chatType = '📢 CANAL';
            chatColor = chalk.magenta;
        } else if (messageData.isPrivate) {
            chatType = '👤 PRIVADO';
            chatColor = chalk.green;
        } else {
            chatType = '❓ DESCONOCIDO';
            chatColor = chalk.gray;
        }
        
        // Obtener nombre del chat
        let chatName = messageData.from;
        try {
            const decoded = jidDecode(messageData.from);
            chatName = decoded?.user || messageData.from;
        } catch (e) {
            // Si no se puede decodificar, usar el JID original
        }
        
        // Obtener nombre del participante
        let participantName = messageData.participant;
        try {
            if (messageData.participant && messageData.participant !== messageData.from) {
                const decoded = jidDecode(messageData.participant);
                participantName = decoded?.user || messageData.participant;
            }
        } catch (e) {
            // Si no se puede decodificar, usar el JID original
        }
        
        // Determinar color del tipo de mensaje
        let messageTypeColor;
        switch (messageData.messageType) {
            case 'text':
            case 'extendedText':
                messageTypeColor = chalk.white;
                break;
            case 'image':
                messageTypeColor = chalk.yellow;
                break;
            case 'video':
                messageTypeColor = chalk.cyan;
                break;
            case 'audio':
                messageTypeColor = chalk.green;
                break;
            case 'document':
                messageTypeColor = chalk.blue;
                break;
            case 'sticker':
                messageTypeColor = chalk.magenta;
                break;
            default:
                messageTypeColor = chalk.gray;
        }
        
        // Imprimir mensaje normal con formato simplificado
        console.log('\n' + chalk.cyan.bold('┌─ 💬 MENSAJE NORMAL ───────────────────────────────────────'));
        console.log(chalk.gray('│'));
        console.log(`${chalk.gray('│')} ${chalk.dim('⏰')} ${chalk.white(timestamp)} ${chalk.dim('│')} ${chatColor.bold(chatType)} ${chalk.dim('│')} ${messageTypeColor.bold(messageData.messageType.toUpperCase())}`);
        console.log(`${chalk.gray('│')} ${chalk.dim('🏠')} ${chalk.white(chatName)}`);
        
        if (messageData.isGroup && messageData.participant !== messageData.from) {
            console.log(`${chalk.gray('│')} ${chalk.dim('👤')} ${chalk.yellow(participantName)}`);
        }
        
        console.log(chalk.gray('│'));
        
        // Contenido del mensaje
        if (messageData.text) {
            console.log(`${chalk.gray('│')} ${chalk.white(messageData.text)}`);
        } else {
            console.log(`${chalk.gray('│')} ${chalk.dim('[Sin texto - ')}${messageTypeColor(messageData.messageType)}${chalk.dim(']')}`);
        }
        
        console.log(chalk.cyan.bold('└─────────────────────────────────────────────────────────────'));
    }

    // Método para loggear comandos (será llamado desde Brain)
    logCommandMessage(messageData) {
        if (!messageData || !messageData.isCommand) return;
        
        const timestamp = messageData.timestamp.toLocaleString();
        
        // Determinar el tipo de chat con colores
        let chatType, chatColor;
        if (messageData.isGroup) {
            chatType = '👥 GRUPO';
            chatColor = chalk.blue;
        } else if (messageData.isChannel) {
            chatType = '📢 CANAL';
            chatColor = chalk.magenta;
        } else if (messageData.isPrivate) {
            chatType = '👤 PRIVADO';
            chatColor = chalk.green;
        } else {
            chatType = '❓ DESCONOCIDO';
            chatColor = chalk.gray;
        }
        
        // Obtener nombre del chat
        let chatName = messageData.from;
        try {
            const decoded = jidDecode(messageData.from);
            chatName = decoded?.user || messageData.from;
        } catch (e) {
            // Si no se puede decodificar, usar el JID original
        }
        
        // Obtener nombre del participante
        let participantName = messageData.participant;
        try {
            if (messageData.participant && messageData.participant !== messageData.from) {
                const decoded = jidDecode(messageData.participant);
                participantName = decoded?.user || messageData.participant;
            }
        } catch (e) {
            // Si no se puede decodificar, usar el JID original
        }
        
        // Imprimir comando con formato destacado
        console.log('\n' + chalk.red.bold('┌─ 🤖 COMANDO EJECUTADO ────────────────────────────────────'));
        console.log(chalk.gray('│'));
        console.log(`${chalk.gray('│')} ${chalk.dim('⏰')} ${chalk.white(timestamp)} ${chalk.dim('│')} ${chatColor.bold(chatType)}`);
        console.log(`${chalk.gray('│')} ${chalk.dim('🏠')} ${chalk.white(chatName)}`);
        
        if (messageData.isGroup && messageData.participant !== messageData.from) {
            console.log(`${chalk.gray('│')} ${chalk.dim('👤')} ${chalk.yellow(participantName)}`);
        }
        
        console.log(chalk.gray('│'));
        console.log(`${chalk.gray('│')} ${chalk.dim('💭 Mensaje:')} ${chalk.white(messageData.text)}`);
        console.log(chalk.gray('│'));
        
        // Información del comando
        console.log(`${chalk.gray('│')} ${chalk.red.bold('🎯 COMANDO:')} ${chalk.red.bold(messageData.command.prefix + messageData.command.name)}`);
        
        if (messageData.command.args.length > 0) {
            console.log(`${chalk.gray('│')} ${chalk.dim('📝 Argumentos:')} ${chalk.yellow(messageData.command.args.join(', '))}`);
        }
        
        console.log(chalk.red.bold('└─────────────────────────────────────────────────────────────'));
    }

    // Método para obtener información del contacto
    async getContactInfo(jid) {
        try {
            const contact = await this.sock.onWhatsApp(jid);
            return contact;
        } catch (error) {
            console.error(chalk.red('Error obteniendo información del contacto:'), chalk.red.dim(error));
            return null;
        }
    }

    // Método para obtener información del grupo
    async getGroupInfo(jid) {
        try {
            if (!jid.endsWith('@g.us')) return null;
            const groupMetadata = await this.sock.groupMetadata(jid);
            return groupMetadata;
        } catch (error) {
            console.error(chalk.red('Error obteniendo información del grupo:'), chalk.red.dim(error));
            return null;
        }
    }
}

module.exports = Ear;