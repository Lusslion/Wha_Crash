const chalk = require('chalk');

module.exports = {
    command: 'send',
    description: 'Envía mensajes a números específicos, grupos o al chat actual',
    category: 'comunicación',
    usage: `*SEND COMMAND*

*Sintaxis básica:*
│ send [mensaje]
│ send [mensaje] n=[cantidad]
│ send [número] [mensaje]
│ send [número] [mensaje] n=[cantidad]

*Destinatarios múltiples:*
│ send [número1,número2,...] [mensaje]
│ send [grupo_id1,grupo_id2,...] [mensaje]

*Comandos especiales:*
│ send group [mensaje]
│ send me [mensaje]

*Ejemplos de uso:*
  ◦ send Hola mundo
  ◦ send Hola mundo n=5
  ◦ send 51987654321 Hola desde el bot
  ◦ send 51987654321 Test n=10
  ◦ send 51987654321,51923456789 Mensaje masivo
  ◦ send 120363417034970626@g.us Mensaje para grupo
  ◦ send group Mensaje para el grupo actual
  ◦ send me Recordatorio personal n=3`,

    async handler(context) {
        const { sock, message, command } = context;
        const args = command.args;
        
        if (!args || args.length === 0) {
            await sock.sendMessage(message.from, { 
                text: `${this.usage}` 
            });
            return;
        }

        try {
            // Determinar el destino y el mensaje
            let destination = null;
            let messageText = '';
            let isMultiple = false;
            let recipients = [];
            let repeatCount = 1; // Por defecto enviar solo 1 vez

            // Buscar parámetro n= en los argumentos
            let argsString = args.join(' ');
            const repeatMatch = argsString.match(/\s+n=(\d+)/);
            
            // Crear una copia modificable de args
            let processedArgs = [...args];
            
            if (repeatMatch) {
                repeatCount = parseInt(repeatMatch[1]);
                // Remover el parámetro n= de los argumentos
                argsString = argsString.replace(/\s+n=\d+/, '');
                processedArgs = argsString.split(' ').filter(arg => arg.trim());
                
                // Validar el número de repeticiones
                if (repeatCount < 1) {
                    await sock.sendMessage(message.from, { 
                        text: '⚠ El número de repeticiones debe ser mayor a 0' 
                    });
                    return;
                }
            }

            const firstArg = processedArgs[0].toLowerCase();
            
            // Caso 1: send group [mensaje]
            if (firstArg === 'group') {
                if (!message.isGroup) {
                    await sock.sendMessage(message.from, { 
                        text: '⚠ Este comando requiere estar en un grupo' 
                    });
                    return;
                }
                destination = message.from;
                messageText = processedArgs.slice(1).join(' ');
            }
            // Caso 2: send me [mensaje]
            else if (firstArg === 'me') {
                destination = message.participant;
                messageText = processedArgs.slice(1).join(' ');
            }
            // Caso 3: send [número(s)/grupo(s)] [mensaje] o send [mensaje]
            else {
                // Verificar si el primer argumento es un número, grupo o lista de números/grupos
                const numberPattern = /^[\d,+\-\s]+$/;
                const groupPattern = /^[\d@g.us,\-\s]+$/;
                const mixedPattern = /^[\d@g.us,+\-\s]+$/;
                
                if (numberPattern.test(processedArgs[0]) || groupPattern.test(processedArgs[0]) || mixedPattern.test(processedArgs[0])) {
                    // Es un número, grupo o lista de números/grupos
                    const recipientsStr = processedArgs[0];
                    messageText = processedArgs.slice(1).join(' ');
                    
                    // Verificar si hay múltiples destinatarios (separados por coma)
                    if (recipientsStr.includes(',')) {
                        isMultiple = true;
                        recipients = recipientsStr.split(',').map(recipient => {
                            const cleanRecipient = recipient.trim();
                            
                            // Si es un grupo (contiene @g.us)
                            if (cleanRecipient.includes('@g.us')) {
                                return cleanRecipient;
                            }
                            // Si es un número
                            else {
                                const cleanNum = cleanRecipient.replace(/[^\d]/g, '');
                                return cleanNum.includes('@') ? cleanNum : `${cleanNum}@s.whatsapp.net`;
                            }
                        });
                    } else {
                        // Un solo destinatario
                        const cleanRecipient = recipientsStr.trim();
                        
                        // Si es un grupo (contiene @g.us)
                        if (cleanRecipient.includes('@g.us')) {
                            destination = cleanRecipient;
                        }
                        // Si es un número
                        else {
                            const cleanNum = cleanRecipient.replace(/[^\d]/g, '');
                            destination = cleanNum.includes('@') ? cleanNum : `${cleanNum}@s.whatsapp.net`;
                        }
                    }
                } else {
                    // No es un número o grupo, asumir que todo es el mensaje para el chat actual
                    destination = message.from;
                    messageText = processedArgs.join(' ');
                }
            }

            // Verificar que hay mensaje para enviar
            if (!messageText.trim()) {
                await sock.sendMessage(message.from, { 
                    text: '⚠ Especifica un mensaje para enviar' 
                });
                return;
            }

            // Función para obtener el nombre del destinatario
            const getRecipientName = (recipient) => {
                if (recipient === message.from) return 'este chat';
                if (recipient === message.participant) return 'ti mismo';
                if (recipient.includes('@g.us')) {
                    return `grupo ${recipient.replace('@g.us', '')}`;
                }
                return recipient.replace('@s.whatsapp.net', '');
            };

            // Enviar el mensaje
            if (isMultiple) {
                // Enviar a múltiples destinatarios
                let successCount = 0;
                let failedCount = 0;
                const results = [];

                for (const recipient of recipients) {
                    try {
                        // Enviar el mensaje N veces a cada destinatario
                        for (let i = 0; i < repeatCount; i++) {
                            const finalMessage = repeatCount > 1 ? `${messageText} (${i + 1}/${repeatCount})` : messageText;
                            await sock.sendMessage(recipient, { text: finalMessage });
                        }
                        successCount++;
                        const recipientName = getRecipientName(recipient);
                        results.push(`✓ ${recipientName}`);
                    } catch (error) {
                        failedCount++;
                        const recipientName = getRecipientName(recipient);
                        results.push(`✗ ${recipientName} - ${error.message}`);
                    }
                }

                // Reporte de envío masivo
                const totalMessages = successCount * repeatCount;
                const report = `*REPORTE DE ENVÍO*\n\n` +
                              `◦ Enviados: ${successCount}\n` +
                              `◦ Fallidos: ${failedCount}\n` +
                              `◦ Total destinatarios: ${recipients.length}\n` +
                              `◦ Repeticiones: ${repeatCount}\n` +
                              `◦ Mensajes totales: ${totalMessages}\n\n` +
                              `*DETALLES*\n${results.join('\n')}`;

                await sock.sendMessage(message.from, { text: report });
                
                console.log(chalk.green(`${totalMessages} mensajes enviados a ${successCount}/${recipients.length} destinatarios`));
                
            } else {
                // Enviar a un solo destinatario
                for (let i = 0; i < repeatCount; i++) {
                    const finalMessage = repeatCount > 1 ? `${messageText} (${i + 1}/${repeatCount})` : messageText;
                    await sock.sendMessage(destination, { text: finalMessage });
                }
                
                // Confirmación de envío
                const destinationName = getRecipientName(destination);
                
                const confirmMessage = repeatCount > 1 ? 
                    `✓ ${repeatCount} mensajes enviados a ${destinationName}` :
                    `✓ Mensaje enviado a ${destinationName}`;
                
                await sock.sendMessage(message.from, { text: confirmMessage });
                
                console.log(chalk.green(`${repeatCount} mensaje(s) enviado(s) a ${destinationName}`));
            }

        } catch (error) {
            console.error(chalk.red('Error enviando mensaje:'), error);
            await sock.sendMessage(message.from, { 
                text: `⚠ Error: ${error.message}` 
            });
        }
    }
};