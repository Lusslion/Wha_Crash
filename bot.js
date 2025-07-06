const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, delay } = require('baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Importar módulos
const Ear = require('./ear');
const Brain = require('./brain');

class WhatsAppBot {
    constructor() {
        this.sock = null;
        this.ear = null;
        this.brain = null;
        this.isConnected = false;
    }

    async start() {
        try {
            console.log(chalk.blue.bold('🤖 Iniciando bot de WhatsApp...'));
            
            // Configurar autenticación
            const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
            
            // Crear socket de conexión
            this.sock = makeWASocket({
                logger: pino({ level: 'silent' }),
                auth: state,
                printQRInTerminal: false, // Desactivamos el QR interno
                browser: ['Wha-Crash', 'Chrome', '1.0.0'],
                generateHighQualityLinkPreview: true
            });

            // Inicializar módulos
            this.ear = new Ear(this.sock);
            this.brain = new Brain(this.sock, this.ear); // Pasar referencia del ear al brain

            // Eventos de conexión
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                // Mostrar QR Code si está disponible
                if (qr) {
                    console.log('\n' + chalk.cyan.bold('📱 Escanea el código QR para conectar tu WhatsApp:'));
                    console.log(chalk.cyan('─'.repeat(60)));
                    qrcode.generate(qr, { small: true });
                    console.log(chalk.cyan('─'.repeat(60)));
                    console.log(chalk.yellow('⏰ El QR expira en 60 segundos...\n'));
                }
                
                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
                        ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                        : true;
                    
                    console.log(chalk.red('❌ Conexión cerrada debido a:'), chalk.red.dim(lastDisconnect?.error));
                    
                    if (shouldReconnect) {
                        console.log(chalk.yellow('🔄 Reconectando en 3 segundos...'));
                        await delay(3000);
                        this.start();
                    } else {
                        console.log(chalk.red.bold('🚪 Sesión cerrada.'), chalk.red('Elimina la carpeta auth_info y vuelve a escanear el QR.'));
                    }
                    
                    this.isConnected = false;
                } else if (connection === 'open') {
                    console.log(chalk.green.bold('✅ Bot conectado exitosamente'));
                    console.log(chalk.green('🎉 ¡Listo para recibir mensajes!'));
                    console.log(chalk.magenta('═'.repeat(60)));
                    this.isConnected = true;
                }
            });

            // Guardar credenciales cuando se actualicen
            this.sock.ev.on('creds.update', saveCreds);

            // Manejar mensajes entrantes
            this.sock.ev.on('messages.upsert', async ({ messages }) => {
                for (const message of messages) {
                    if (!message.key.fromMe && message.message) {
                        // Procesar mensaje con Ear
                        const processedMessage = this.ear.processMessage(message);
                        
                        // Enviar al Brain para análisis
                        await this.brain.processMessage(processedMessage);
                    }
                }
            });

            console.log(chalk.blue('🔄 Iniciando conexión...'));
            
        } catch (error) {
            console.error(chalk.red.bold('❌ Error al iniciar el bot:'), chalk.red(error));
            process.exit(1);
        }
    }

    async stop() {
        if (this.sock) {
            await this.sock.logout();
            console.log(chalk.yellow.bold('🛑 Bot desconectado'));
        }
    }
}

// Crear instancia del bot
const bot = new WhatsAppBot();

// Manejar señales de terminación
process.on('SIGINT', async () => {
    console.log(chalk.yellow.bold('\n🛑 Deteniendo bot...'));
    await bot.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log(chalk.yellow.bold('\n🛑 Deteniendo bot...'));
    await bot.stop();
    process.exit(0);
});

// Mostrar banner de inicio
console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════╗'));
console.log(chalk.cyan.bold('║                    WHATSAPP BOT                         ║'));
console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════╝'));

// Iniciar el bot
bot.start().catch(console.error);

module.exports = WhatsAppBot;