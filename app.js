/**
 * App Controller & Event Handler
 * Manages UI interactions, real-time transliteration, Web Audio typing sounds, Dark Mode, Computer Font Access, and storage.
 */

document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements
    const singlishInput = document.getElementById('singlish-input');
    const sinhalaOutput = document.getElementById('sinhala-output');
    const inputStats = document.getElementById('input-stats');
    const outputStats = document.getElementById('output-stats');
    const saveStatus = document.getElementById('save-status');
    const modeStatusBadge = document.getElementById('mode-status-badge');

    // Action Buttons
    const btnClear = document.getElementById('btn-clear');
    const btnCopy = document.getElementById('btn-copy');
    const btnDownload = document.getElementById('btn-download');
    const btnWrapQuotes = document.getElementById('btn-wrap-quotes');

    // Mode Selector Buttons
    const modePopularBtn = document.getElementById('mode-popular');
    const modeEnglishBtn = document.getElementById('mode-english');
    const modeUcscBtn = document.getElementById('mode-ucsc');

    // Output Text Style Controls
    const selectOutputFont = document.getElementById('select-output-font');
    const btnOutputItalic = document.getElementById('btn-output-italic');
    const colorDots = document.querySelectorAll('.color-dot');

    // Toolbar Formatting Controls
    const btnSound = document.getElementById('btn-sound');
    const btnBold = document.getElementById('btn-bold');
    const btnFontInc = document.getElementById('btn-font-inc');
    const btnFontDec = document.getElementById('btn-font-dec');
    const btnFontReset = document.getElementById('btn-font-reset');

    // Theme & Navigation Controls
    const btnTheme = document.getElementById('btn-theme');
    const themeIconSun = document.getElementById('theme-icon-sun');
    const themeIconMoon = document.getElementById('theme-icon-moon');

    const btnCheatsheet = document.getElementById('btn-cheatsheet');
    const btnCloseCheatsheet = document.getElementById('btn-close-cheatsheet');
    const modalCheatsheet = document.getElementById('modal-cheatsheet');

    const btnHistory = document.getElementById('btn-history');
    const btnCloseHistory = document.getElementById('btn-close-history');
    const modalHistory = document.getElementById('modal-history');
    const historyContainer = document.getElementById('history-container');
    const btnClearHistory = document.getElementById('btn-clear-history');

    const toastContainer = document.getElementById('toast-container');

    // App State
    let currentMode = localStorage.getItem('singlish_mode') || 'popular';
    let fontSize = parseInt(localStorage.getItem('singlish_font_size')) || 18;
    let isBold = localStorage.getItem('singlish_bold') === 'true';
    let isOutputItalic = localStorage.getItem('singlish_output_italic') === 'true';
    let outputFont = localStorage.getItem('singlish_output_font') || 'Iskoola Pota';
    let outputColor = localStorage.getItem('singlish_output_color') || 'default';
    let isSoundEnabled = localStorage.getItem('singlish_sound') !== 'false';
    let history = JSON.parse(localStorage.getItem('singlish_history') || '[]');
    let saveTimeout = null;

    // Web Audio Synthesizer for Typing Sound Effect
    let audioCtx = null;

    function playKeyClickSound() {
        if (!isSoundEnabled) return;
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.03);

            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.035);
        } catch (e) {}
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('singlish_theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);

    // Initialize Mode & Formatting UI
    setMode(currentMode);
    updateFontSize(fontSize);
    setBoldState(isBold);
    setSoundState(isSoundEnabled);
    setOutputFont(outputFont);
    setOutputItalic(isOutputItalic);
    setOutputColor(outputColor);

    // Initial Transliteration
    performConversion();

    // ==========================================
    // Core Transliteration & Stats Handling
    // ==========================================

    function performConversion() {
        const inputText = singlishInput.value;
        
        if (!inputText.trim()) {
            sinhalaOutput.value = '';
            updateStats('', '');
            return;
        }

        const converted = SinglishConverter.convert(inputText, currentMode);
        sinhalaOutput.value = converted;

        updateStats(inputText, converted);

        // Schedule auto-save to history
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveToHistory(inputText, converted);
        }, 1200);
    }

    function updateStats(input, output) {
        const charCount = input.length;
        const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
        inputStats.textContent = `${charCount} characters | ${wordCount} words`;

        const outCharCount = output.length;
        outputStats.textContent = `${outCharCount} characters`;
    }

    // Input Event Listeners
    singlishInput.addEventListener('input', performConversion);
    singlishInput.addEventListener('keydown', (e) => {
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
            playKeyClickSound();
        }
    });

    // ==========================================
    // Computer Font Scanner & Output Styling
    // ==========================================

    async function scanAllComputerFonts(showToastOnSuccess = true) {
        if (!('queryLocalFonts' in window)) {
            if (showToastOnSuccess) showToast('Local font scanner requires Chrome or Edge. You can select installed fonts below!');
            return;
        }

        try {
            const availableFonts = await window.queryLocalFonts();
            const fontFamilies = new Set();
            for (const fontData of availableFonts) {
                fontFamilies.add(fontData.family);
            }

            const sortedFamilies = Array.from(fontFamilies).sort();

            if (sortedFamilies.length > 0) {
                selectOutputFont.innerHTML = '';

                const groupScan = document.createElement('optgroup');
                groupScan.label = "⚡ Computer Font Scanner";
                const scanOpt = document.createElement('option');
                scanOpt.value = "__scan_local__";
                scanOpt.textContent = "🔍 Scan All Installed Fonts...";
                groupScan.appendChild(scanOpt);
                selectOutputFont.appendChild(groupScan);

                const groupLocal = document.createElement('optgroup');
                groupLocal.label = `💻 All Computer Fonts (${sortedFamilies.length} found)`;

                sortedFamilies.forEach(family => {
                    const opt = document.createElement('option');
                    opt.value = family;
                    opt.textContent = family;
                    groupLocal.appendChild(opt);
                });

                selectOutputFont.appendChild(groupLocal);

                const groupCustom = document.createElement('optgroup');
                groupCustom.label = "✏️ Custom Font";
                const customOpt = document.createElement('option');
                customOpt.value = "__custom_font__";
                customOpt.textContent = "✏️ Type Custom Font Name...";
                groupCustom.appendChild(customOpt);
                selectOutputFont.appendChild(groupCustom);

                setOutputFont(outputFont);

                if (showToastOnSuccess) {
                    showToast(`Scanned ${sortedFamilies.length} installed fonts! 🎉`);
                }
            }
        } catch (err) {
            if (showToastOnSuccess) {
                showToast('Font scan cancelled or permission required');
            }
        }
    }

    function setOutputFont(fontName) {
        if (!fontName) return;

        if (fontName === '__scan_local__') {
            selectOutputFont.value = outputFont;
            scanAllComputerFonts(true);
            return;
        }

        if (fontName === '__custom_font__') {
            selectOutputFont.value = outputFont;
            const customName = prompt('Type installed font name (e.g. FM Abhaya, DL Manel, Kandy, Kaputa):', outputFont);
            if (customName && customName.trim()) {
                setOutputFont(customName.trim());
            }
            return;
        }

        outputFont = fontName;
        localStorage.setItem('singlish_output_font', fontName);

        let foundIndex = -1;
        for (let i = 0; i < selectOutputFont.options.length; i++) {
            if (selectOutputFont.options[i].value === fontName) {
                foundIndex = i;
                break;
            }
        }

        if (foundIndex >= 0) {
            selectOutputFont.selectedIndex = foundIndex;
        } else {
            const opt = document.createElement('option');
            opt.value = fontName;
            opt.textContent = `Installed: ${fontName}`;
            opt.selected = true;
            selectOutputFont.appendChild(opt);
        }

        const fontStack = `'${fontName}', 'Iskoola Pota', 'Nirmala UI', sans-serif`;
        document.documentElement.style.setProperty('--output-font-family', fontStack);
    }

    if (selectOutputFont) {
        selectOutputFont.addEventListener('change', (e) => {
            const val = e.target.value;
            setOutputFont(val);
        });
    }

    function setOutputItalic(italic) {
        isOutputItalic = italic;
        localStorage.setItem('singlish_output_italic', italic);
        if (btnOutputItalic) {
            if (italic) {
                btnOutputItalic.classList.add('active');
                sinhalaOutput.classList.add('output-italic');
            } else {
                btnOutputItalic.classList.remove('active');
                sinhalaOutput.classList.remove('output-italic');
            }
        }
    }

    if (btnOutputItalic) {
        btnOutputItalic.addEventListener('click', () => {
            setOutputItalic(!isOutputItalic);
            showToast(isOutputItalic ? 'Output italic enabled' : 'Output italic disabled');
        });
    }

    function setOutputColor(colorKey) {
        outputColor = colorKey;
        localStorage.setItem('singlish_output_color', colorKey);

        colorDots.forEach(dot => {
            if (dot.getAttribute('data-color') === colorKey) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const colorMap = {
            default: isDark ? "#f8fafc" : "var(--text-primary)",
            blue: "#2563eb",
            green: "#059669",
            purple: "#7c3aed"
        };

        const colorVal = colorMap[colorKey] || colorMap.default;
        document.documentElement.style.setProperty('--output-text-color', colorVal);
    }

    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const colorKey = dot.getAttribute('data-color');
            setOutputColor(colorKey);
        });
    });

    // Sound Toggle
    function setSoundState(enabled) {
        isSoundEnabled = enabled;
        localStorage.setItem('singlish_sound', enabled);
        if (enabled) {
            btnSound.classList.add('active');
            btnSound.textContent = '🔊';
            btnSound.title = 'Sound Effects: Enabled';
        } else {
            btnSound.classList.remove('active');
            btnSound.textContent = '🔇';
            btnSound.title = 'Sound Effects: Disabled';
        }
    }

    btnSound.addEventListener('click', () => {
        setSoundState(!isSoundEnabled);
        showToast(isSoundEnabled ? 'Typing sound enabled 🔊' : 'Typing sound disabled 🔇');
    });

    // Bold Toggle
    function setBoldState(bold) {
        isBold = bold;
        localStorage.setItem('singlish_bold', bold);
        if (bold) {
            btnBold.classList.add('active');
            singlishInput.classList.add('is-bold');
            sinhalaOutput.classList.add('is-bold');
        } else {
            btnBold.classList.remove('active');
            singlishInput.classList.remove('is-bold');
            sinhalaOutput.classList.remove('is-bold');
        }
    }

    btnBold.addEventListener('click', () => {
        setBoldState(!isBold);
        showToast(isBold ? 'Bold text enabled' : 'Bold text disabled');
    });

    // Wrap Quotes Helper
    if (btnWrapQuotes) {
        btnWrapQuotes.addEventListener('click', () => {
            const start = singlishInput.selectionStart;
            const end = singlishInput.selectionEnd;
            const val = singlishInput.value;

            if (start !== end) {
                const selected = val.substring(start, end);
                singlishInput.value = val.substring(0, start) + `"${selected}"` + val.substring(end);
                singlishInput.selectionStart = start + 1;
                singlishInput.selectionEnd = end + 1;
            } else {
                singlishInput.value = val.substring(0, start) + '""' + val.substring(end);
                singlishInput.selectionStart = start + 1;
                singlishInput.selectionEnd = start + 1;
            }

            performConversion();
            singlishInput.focus();
            showToast('Preserved in English script');
        });
    }

    // ==========================================
    // Light / Dark Theme Controller
    // ==========================================

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('singlish_theme', theme);

        if (theme === 'dark') {
            themeIconSun.style.display = 'none';
            themeIconMoon.style.display = 'block';
            btnTheme.title = 'Switch to Light Mode';
        } else {
            themeIconSun.style.display = 'block';
            themeIconMoon.style.display = 'none';
            btnTheme.title = 'Switch to Dark Mode';
        }

        // Re-apply output color for dark/light contrast
        setOutputColor(outputColor);
    }

    btnTheme.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        showToast(newTheme === 'dark' ? 'Switched to Dark Mode 🌙' : 'Switched to Light Mode ☀️');
    });

    // ==========================================
    // Toolbar Actions (Copy, Download, Clear)
    // ==========================================

    btnClear.addEventListener('click', () => {
        singlishInput.value = '';
        sinhalaOutput.value = '';
        updateStats('', '');
        singlishInput.focus();
        showToast('Cleared text');
    });

    btnCopy.addEventListener('click', async () => {
        const text = sinhalaOutput.value;
        if (!text) {
            showToast('Nothing to copy!');
            return;
        }

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                sinhalaOutput.select();
                document.execCommand('copy');
            }
            showToast('Copied text to clipboard! 📋');
        } catch (err) {
            showToast('Failed to copy text');
        }
    });

    btnDownload.addEventListener('click', () => {
        const text = sinhalaOutput.value;
        if (!text) {
            showToast('No converted text to download!');
            return;
        }

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sinhala-text-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Downloaded text file 💾');
    });

    // ==========================================
    // Mode Switcher (Popular vs English vs UCSC)
    // ==========================================

    function setMode(mode) {
        currentMode = mode;
        localStorage.setItem('singlish_mode', mode);

        modePopularBtn.classList.remove('active');
        modeEnglishBtn.classList.remove('active');
        modeUcscBtn.classList.remove('active');

        if (mode === 'english') {
            modeEnglishBtn.classList.add('active');
            modeStatusBadge.textContent = '📘 English Translator Mode';
            singlishInput.placeholder = 'Type English words or phrases (e.g. good morning, thank you, mother, water, home)...';
        } else if (mode === 'ucsc') {
            modeUcscBtn.classList.add('active');
            modeStatusBadge.textContent = 'Official UCSC Standard';
            singlishInput.placeholder = 'Type Singlish in UCSC spec (e.g. dh = ද, th = ත, mama game yanawa)...';
        } else {
            modePopularBtn.classList.add('active');
            modeStatusBadge.textContent = 'Singlish Phonetic Mode';
            singlishInput.placeholder = 'Type Singlish text (e.g. mama game yanawa, oyaa kohomada)...';
        }

        performConversion();
    }

    modePopularBtn.addEventListener('click', () => setMode('popular'));
    modeEnglishBtn.addEventListener('click', () => setMode('english'));
    modeUcscBtn.addEventListener('click', () => setMode('ucsc'));

    // ==========================================
    // Font Size Controls
    // ==========================================

    function updateFontSize(size) {
        fontSize = Math.min(Math.max(size, 14), 32);
        document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
        localStorage.setItem('singlish_font_size', fontSize);
    }

    btnFontInc.addEventListener('click', () => updateFontSize(fontSize + 2));
    btnFontDec.addEventListener('click', () => updateFontSize(fontSize - 2));
    btnFontReset.addEventListener('click', () => updateFontSize(18));

    // ==========================================
    // Modals (Cheatsheet & History)
    // ==========================================

    btnCheatsheet.addEventListener('click', () => modalCheatsheet.classList.add('active'));
    btnCloseCheatsheet.addEventListener('click', () => modalCheatsheet.classList.remove('active'));
    modalCheatsheet.addEventListener('click', (e) => {
        if (e.target === modalCheatsheet) modalCheatsheet.classList.remove('active');
    });

    btnHistory.addEventListener('click', () => {
        renderHistory();
        modalHistory.classList.add('active');
    });
    btnCloseHistory.addEventListener('click', () => modalHistory.classList.remove('active'));
    modalHistory.addEventListener('click', (e) => {
        if (e.target === modalHistory) modalHistory.classList.remove('active');
    });

    // ==========================================
    // History Management
    // ==========================================

    function saveToHistory(input, output) {
        if (!input.trim() || input.length < 2) return;

        if (history.length > 0 && history[0].input === input && history[0].mode === currentMode) return;

        history.unshift({
            input: input,
            output: output,
            mode: currentMode,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        if (history.length > 30) history.pop();

        localStorage.setItem('singlish_history', JSON.stringify(history));
    }

    function renderHistory() {
        if (history.length === 0) {
            historyContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:2rem;">No conversion history yet. Type something to save automatically!</p>';
            return;
        }

        historyContainer.innerHTML = history.map((item, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-text">
                    <span class="history-singlish">${escapeHtml(item.input)} (${item.mode === 'english' ? 'English' : 'Singlish'})</span>
                    <span class="history-sinhala">${escapeHtml(item.output)}</span>
                </div>
                <span style="font-size:0.75rem; color:var(--text-muted);">${item.timestamp}</span>
            </div>
        `).join('');

        document.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.getAttribute('data-index'));
                if (history[idx]) {
                    setMode(history[idx].mode || 'popular');
                    singlishInput.value = history[idx].input;
                    performConversion();
                    modalHistory.classList.remove('active');
                    singlishInput.focus();
                    showToast('Restored snippet from history');
                }
            });
        });
    }

    btnClearHistory.addEventListener('click', () => {
        history = [];
        localStorage.removeItem('singlish_history');
        renderHistory();
        showToast('Cleared conversion history');
    });

    // Utility Helpers
    function showToast(message) {
        const toastEl = document.createElement('div');
        toastEl.className = 'toast';
        toastEl.textContent = message;
        toastContainer.appendChild(toastEl);

        setTimeout(() => {
            toastEl.style.opacity = '0';
            toastEl.style.transform = 'translateY(100%)';
            toastEl.style.transition = 'all 0.3s ease';
            setTimeout(() => toastEl.remove(), 300);
        }, 2500);
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
});
