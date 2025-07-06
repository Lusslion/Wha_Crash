# Wha_Crash 🤖

**Wha_Crash** es un bot de WhatsApp simple y eficiente que te permite automatizar mensajes y gestionar grupos de manera sencilla. Perfecto para pruebas, comunicación masiva y administración de grupos.

## 🚀 Características

- **Envío de mensajes**: Envía mensajes a números específicos, grupos o al chat actual
- **Repetición de mensajes**: Repite mensajes múltiples veces
- **Gestión de grupos**: Obtén información detallada de los grupos donde está el bot
- **Interfaz simple**: Comandos fáciles de usar y recordar
- **Multiplataforma**: Funciona en Windows, macOS y Linux

## 📋 Requisitos

Antes de instalar, asegúrate de tener:

- **Node.js** (versión 16 o superior)
- **npm** (viene incluido con Node.js)
- **Git** (para clonar el repositorio)
- Una cuenta de WhatsApp activa

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Lusslion/Wha_Crash.git
cd Wha_Crash
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar el bot

El bot se configurará automáticamente al ejecutarse por primera vez. Necesitarás escanear un código QR con tu WhatsApp.

### 4. Ejecutar el bot

```bash
npm start
```

o

```bash
node index.js
```

### 5. Escanear código QR

1. Abre WhatsApp en tu teléfono
2. Ve a **Configuración** > **Dispositivos vinculados**
3. Toca **Vincular un dispositivo**
4. Escanea el código QR que aparece en tu terminal

¡Listo! El bot ya está funcionando.

## 📱 Comandos Disponibles

### 🔧 Utilidades

#### `ping`
Comando de prueba que responde con "pong"
```
ping
```

#### `menu`
Muestra la lista de comandos disponibles con sus descripciones
```
menu
menu [categoría]
```

### 💬 Comunicación

#### `send`
Envía mensajes a números específicos, grupos o al chat actual

**Formas de uso:**

- **Enviar al chat actual:**
  ```
  send Hola mundo
  send Hola mundo n=5
  ```

- **Enviar a número específico:**
  ```
  send 51987654321 Hola desde el bot
  send 51987654321 Spam test n=10
  ```

- **Enviar a múltiples números:**
  ```
  send 51987654321,51923456789 Mensaje masivo
  ```

- **Enviar a grupo específico:**
  ```
  send 120363417034970626@g.us Mensaje para el grupo
  send 120363417034970626@g.us,120363417034970627@g.us Mensaje masivo a grupos
  ```

- **Enviar al grupo actual:**
  ```
  send group Mensaje para el grupo
  ```

- **Enviarte a ti mismo:**
  ```
  send me Recordatorio personal n=3
  ```

### 📊 Información

#### `grupos`
Muestra información detallada de los grupos donde está el bot
```
grupos
grupos detalle
grupos stats
grupos lista
```


## 🚨 Consideraciones de Uso

- **Términos de servicio**: Usa el bot respetando los términos de servicio de WhatsApp
- **Spam**: Evita el spam masivo para no ser bloqueado
- **Privacidad**: Respeta la privacidad de otros usuarios
- **Límites**: WhatsApp puede limitar el envío de mensajes si detecta uso excesivo

## 🐛 Solución de Problemas

### El bot no se conecta
- Verifica que tu conexión a internet esté estable
- Asegúrate de que WhatsApp esté activo en tu teléfono
- Intenta reiniciar el bot

### Error al instalar dependencias
```bash
npm cache clean --force
npm install
```

### El código QR no aparece
- Verifica que no tengas múltiples sesiones abiertas
- Elimina la carpeta `auth_info/` y vuelve a ejecutar el bot

## 📝 Changelog

- **v1.0.0**: Versión inicial con comandos básicos
- Comando `ping` para pruebas
- Comando `send` para envío de mensajes
- Comando `grupos` para información de grupos
- Comando `menu` para ayuda


## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

- Abre un [Issue](https://github.com/Lusslion/Wha_Crash/issues)
- Contacta al desarrollador: [@Lusslion](https://github.com/Lusslion)

## ⚠️ Descargo de Responsabilidad

Este bot es solo para fines educativos y de prueba. Los usuarios son responsables del uso que le den y deben cumplir con los términos de servicio de WhatsApp.

---

**Desarrollado con ❤️ por [Lusslion](https://github.com/Lusslion)**