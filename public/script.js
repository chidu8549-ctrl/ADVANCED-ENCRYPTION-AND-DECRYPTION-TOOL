window.state = {
    currentUser: null,
    currentView: 'login',
    stegoImageFile: null,
    stegoExtractFile: null
};

async function copyToClipboard(elementId, btn) {
    const text = document.getElementById(elementId).innerText;
    if (!text || text === "Morse symbols will appear here..." || text === "Morse will appear here..." || text === "Decoded text will appear here..." || text === "Output..." || text === "Text..." || text === "No hidden data found.") return;
    
    try {
        await navigator.clipboard.writeText(text);
        const originalContent = btn.innerHTML;
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            <span>Copied!</span>
        `;
        setTimeout(() => btn.innerHTML = originalContent, 2000);
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
}

function resetCategory(category) {
    if (category === 'encrypt') {
        const morseInput = document.getElementById('morse-input');
        const morseOutput = document.getElementById('morse-output');
        if (morseInput) morseInput.value = '';
        if (morseOutput) morseOutput.innerText = 'Morse will appear here...';
        
        window.state.stegoImageFile = null;
        const stegoInput = document.getElementById('stego-file-input');
        const stegoLabel = document.getElementById('stego-file-label');
        const stegoText = document.getElementById('stego-text-input');
        if (stegoInput) stegoInput.value = '';
        if (stegoLabel) stegoLabel.innerText = 'Select Image File';
        if (stegoText) stegoText.value = '';
    } else if (category === 'decrypt') {
        const morseDecodeInput = document.getElementById('morse-decode-input');
        const morseDecodeOutput = document.getElementById('morse-decode-output');
        if (morseDecodeInput) morseDecodeInput.value = '';
        if (morseDecodeOutput) morseDecodeOutput.innerText = 'Decoded text will appear here...';
        
        window.state.stegoExtractFile = null;
        const stegoExtractInput = document.getElementById('stego-extract-input');
        const stegoExtractLabel = document.getElementById('stego-extract-label');
        const stegoExtractOutput = document.getElementById('stego-extract-output');
        const stegoExtractContainer = document.getElementById('stego-extract-container');
        if (stegoExtractInput) stegoExtractInput.value = '';
        if (stegoExtractLabel) stegoExtractLabel.innerText = 'Select Processed Image';
        if (stegoExtractOutput) stegoExtractOutput.innerText = '';
        if (stegoExtractContainer) stegoExtractContainer.classList.add('hidden');
    }
}
const MORSE_CODE = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..',

    '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..',
    '9': '----.', '0': '-----',

    ' ': '/',

    '.': '.-.-.-',
    ',': '--..--',
    '?': '..--..',
    "'": '.----.',
    '!': '-.-.--',
    '/': '-..-.',
    '(': '-.--.',
    ')': '-.--.-',
    '&': '.-...',
    ':': '---...',
    ';': '-.-.-.',
    '=': '-...-',
    '+': '.-.-.',
    '-': '-....-',
    '_': '..--.-',
    '"': '.-..-.',
    '$': '...-..-',
    '@': '.--.-.',
    '%': '----- -..-. -----',
    '#': '......',
    '*': '-..-',
    '<': '.-.-',
    '>': '-.-.-',
    '[': '-.--.',
    ']': '-.--.-',
    '{': '-.--.',
    '}': '-.--.-',
    '\\': '.-..-.',
    '|': '-...-.-',
    '^': '......',
    '~': '.-.-',
    '`': '.----.',
};
const REVERSE_MORSE = Object.fromEntries(Object.entries(MORSE_CODE).map(([k, v]) => [v, k]));

function onMorseTextInput() {
    const input = document.getElementById('morse-input').value.toUpperCase();
    const output = input.split('').map(char => MORSE_CODE[char] || char).join(' ');
    document.getElementById('morse-output').innerText = output || "Morse will appear here...";
}

function handleMorseDecode() {
    const input = document.getElementById('morse-decode-input').value.trim();
    if (!input) return;
    const output = input.split(' ').map(symbol => REVERSE_MORSE[symbol] || symbol).join('');
    document.getElementById('morse-decode-output').innerText = output;
}

async function copyMorse() {
    copyToClipboard('morse-output', event.currentTarget);
}

async function copyDecodedMorse() {
    copyToClipboard('morse-decode-output', event.currentTarget);
}

function onStegoFileChange(input) {
    if (input.files?.[0]) {
        window.state.stegoImageFile = input.files[0];
        document.getElementById('stego-file-label').innerText = window.state.stegoImageFile.name;
    }
}

function onStegoExtractFileChange(input) {
    if (input.files?.[0]) {
        window.state.stegoExtractFile = input.files[0];
        document.getElementById('stego-extract-label').innerText = window.state.stegoExtractFile.name;
    }
}

async function handleStegoEmbed() {
    const text = document.getElementById('stego-text-input').value;
    const btn = document.getElementById('stego-embed-btn');
    if (!window.state.stegoImageFile || !text) return alert('File and text required');

    btn.disabled = true;
    btn.innerText = "Processing...";

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        const buffer = new Uint8Array(text.length + 1);
        for(let i = 0; i < text.length; i++) buffer[i] = text.charCodeAt(i);
        buffer[text.length] = 0; 

        if (buffer.length * 8 > (pixels.length / 4) * 3) {
            btn.disabled = false;
            btn.innerText = "Process & Save";
            return alert('Message too long for this image');
        }

        let bitIdx = 0;
        for (let i = 0; i < buffer.length; i++) {
            const byte = buffer[i];
            for (let bit = 7; bit >= 0; bit--) {
                const bitValue = (byte >> bit) & 1;
                const pixelIdx = Math.floor(bitIdx / 3) * 4 + (bitIdx % 3);
                pixels[pixelIdx] = (pixels[pixelIdx] & 0xFE) | bitValue;
                bitIdx++;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        const link = document.createElement('a');
        const originalExt = window.state.stegoImageFile.name.split('.').pop() || 'png';
        link.download = `secure_${Date.now()}.${originalExt}`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        btn.disabled = false;
        btn.innerText = "Process & Save";
    };
    img.src = URL.createObjectURL(window.state.stegoImageFile);
}

async function handleStegoExtract() {
    if (!window.state.stegoExtractFile) return alert('Upload file');
    const outputEl = document.getElementById('stego-extract-output');
    outputEl.innerText = "Extracting...";
    outputEl.classList.remove('hidden');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        const result = [];
        let currentByte = 0;
        let bitsRead = 0;
        let bitIdx = 0;

        while (bitIdx < (pixels.length / 4) * 3) {
            const pixelIdx = Math.floor(bitIdx / 3) * 4 + (bitIdx % 3);
            const bit = pixels[pixelIdx] & 1;
            
            currentByte = (currentByte << 1) | bit;
            bitsRead++;

            if (bitsRead === 8) {
                if (currentByte === 0) break;
                result.push(String.fromCharCode(currentByte));
                currentByte = 0;
                bitsRead = 0;
            }
            bitIdx++;
            if (result.length > 10000) break;
        }
        
        const extractedText = result.join('');
        const container = document.getElementById('stego-extract-container');
        outputEl.innerText = extractedText || "No hidden data found.";
        
        if (container) container.classList.remove('hidden');
        const copyBtn = document.getElementById('copy-stego-btn');
        if (copyBtn) {
            if (extractedText) copyBtn.classList.remove('hidden');
            else copyBtn.classList.add('hidden');
        }
    };
    img.src = URL.createObjectURL(window.state.stegoExtractFile);
}

async function copyExtractedText() {
    copyToClipboard('stego-extract-output', document.getElementById('copy-stego-btn'));
}

async function copyHidingMessage() {
    const input = document.getElementById('stego-text-input');
    const text = input.value;
    if (!text) return;
    
    try {
        await navigator.clipboard.writeText(text);
        const btn = event.currentTarget;
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<span>Copied!</span>`;
        setTimeout(() => btn.innerHTML = originalContent, 2000);
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;
    const errorEl = document.getElementById('login-error');

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
            window.state.currentUser = data;
            document.getElementById('navbar').classList.remove('hidden');
            showView('dashboard');
        } else {
            errorEl.innerText = data.message;
            errorEl.classList.remove('hidden');
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    window.state.currentUser = null;
    document.getElementById('navbar').classList.add('hidden');
    showView('login');
}

const viewCache = {};

async function fetchView(viewId) {
    if (viewCache[viewId]) return viewCache[viewId];
    try {
        const response = await fetch(`/views/${viewId}.html`);
        const html = await response.text();
        viewCache[viewId] = html;
        return html;
    } catch (error) {
        console.error(`Failed to fetch view ${viewId}:`, error);
        return `<div class="text-red-500">Error loading view ${viewId}</div>`;
    }
}

async function showView(viewId) {
    const container = document.getElementById('app-container');
    
    if (viewId === 'dashboard') {
        const dashHtml = await fetchView('dashboard');
        container.innerHTML = dashHtml;
        
        const encHtml = await fetchView('encrypt');
        const decHtml = await fetchView('decrypt');
        
        const encContainer = document.getElementById('encrypt-view-container');
        const decContainer = document.getElementById('decrypt-view-container');
        
        if (encContainer) encContainer.innerHTML = encHtml;
        if (decContainer) decContainer.innerHTML = decHtml;
    } else {
        const html = await fetchView(viewId);
        container.innerHTML = html;
    }
    
    window.state.currentView = viewId;
}

window.onload = () => {
    showView('login');
};
