// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    // Global state
    let currentSessionId = null;

    // View elements
    const connectionView = document.getElementById('connectionView');
    const senderView = document.getElementById('senderView');

    // Form elements
    const phoneForm = document.getElementById('phoneForm');
    const senderForm = document.getElementById('senderForm');

    // Button elements
    const generateBtn = document.getElementById('generateBtn');
    const sendBtn = document.getElementById('sendBtn');
    
    // Display elements
    const codeDisplay = document.getElementById('codeDisplay');
    const pairingCodeDiv = document.getElementById('pairingCode');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const successDiv = document.getElementById('success');

    // --- UTILITY FUNCTIONS ---
    function showLoading(show) {
        loadingDiv.classList.toggle('hidden', !show);
    }

    function showMessage(type, message) {
        const div = type === 'error' ? errorDiv : successDiv;
        const otherDiv = type === 'error' ? successDiv : errorDiv;
        div.textContent = message;
        div.classList.remove('hidden');
        otherDiv.classList.add('hidden');
    }

    function hideMessages() {
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');
    }

    function switchView(view) {
        if (view === 'sender') {
            connectionView.classList.add('hidden');
            senderView.classList.remove('hidden');
        } else {
            connectionView.classList.remove('hidden');
            senderView.classList.add('hidden');
        }
    }

    // --- EVENT HANDLERS ---
    phoneForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideMessages();

        const phoneNumber = document.getElementById('phoneNumber').value;
        generateBtn.disabled = true;
        showLoading(true);

        try {
            const response = await fetch('/generate-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber }),
            });

            const data = await response.json();
            showLoading(false);

            if (response.ok && data.success) {
                currentSessionId = data.sessionId;
                pairingCodeDiv.textContent = data.code.match(/.{1,4}/g).join('-'); // Format code
                codeDisplay.classList.remove('hidden');
                // A simple timeout to assume connection and switch views
                setTimeout(() => {
                    showMessage('success', 'Session ready! Enter the target number.');
                    switchView('sender');
                }, 15000); // Switch after 15 seconds
            } else {
                showMessage('error', data.message || 'An unknown error occurred.');
                generateBtn.disabled = false;
            }
        } catch (error) {
            showLoading(false);
            showMessage('error', 'Failed to connect to the server.');
            generateBtn.disabled = false;
        }
    });

    senderForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideMessages();

        const target = document.getElementById('targetNumber').value;
        if (!currentSessionId) {
            showMessage('error', 'No active session. Please connect first.');
            return;
        }

        sendBtn.disabled = true;
        showLoading(true);

        try {
            const response = await fetch('/send-crash-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: currentSessionId, target }),
            });

            const data = await response.json();
            if (response.ok && data.success) {
                showMessage('success', data.message);
            } else {
                showMessage('error', data.message || 'Failed to send.');
            }
        } catch (error) {
            showMessage('error', 'A network error occurred.');
        } finally {
            showLoading(false);
            sendBtn.disabled = false;
        }
    });
});
