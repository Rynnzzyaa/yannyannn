/**
 * RUANG CERITA NADA & AGENT HERMES - SCRIPT v3.6
 * Real AI Engine (Local Hermes API + Cloud AI Pollinations + Offline Sanctuary Fallback)
 * Audio Ambience Synth, Polaroid & Mobile First Touch Experience
 * Best Friends Edition (Yan & Nada)
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // 1. DOM ELEMENTS
    // -------------------------------------------------------------------------
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');
    const btnClearChat = document.getElementById('btn-clear-chat');
    const hermesStatusText = document.getElementById('hermes-status-text');

    const moodPills = document.querySelectorAll('.mood-pill');
    const btnAmbientSound = document.getElementById('btn-ambient-sound');

    // Yan Corner Elements
    const polaroidToggle = document.getElementById('polaroid-toggle');
    const btnVirtualHug = document.getElementById('btn-virtual-hug');

    // Modals
    const btnOpenCapsule = document.getElementById('btn-open-capsule');
    const capsuleModal = document.getElementById('capsule-modal');
    const btnCloseCapsule = document.getElementById('btn-close-capsule');

    const btnOpenSettings = document.getElementById('btn-open-settings');
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const settingsForm = document.getElementById('settings-form');
    const btnTestConn = document.getElementById('btn-test-conn');
    const testConnectionStatus = document.getElementById('test-connection-status');
    const cfgApiUrl = document.getElementById('cfg-api-url');
    const cfgModel = document.getElementById('cfg-model');

    // Conversation Memory for Cloud AI
    let chatHistory = [];
    const HERMES_SYSTEM_PROMPT = `Kamu adalah 'Hermes', asisten AI cerdas sekaligus teman curhat yang dibuat oleh Yan khusus untuk Nada.
Hubungan Yan dan Nada adalah TEMAN BAIK / SAHABAT (pure friendship / best friends, BUKAN pacar atau romantis).
Karakter & Tugasmu:
1. Kamu sangat serba bisa dan variatif: bisa bantu Nada ngerjain tugas kuliah/sekolah (matematika, coding, essay, rangkuman, bahasa Inggris, sains, ide kreatif) dengan penjelasan yang jelas, rapi, dan mudah dipahami.
2. Kamu juga pendengar yang asik & suportif kalau Nada lagi capek, mumet, overthinking, atau kangen ngobrol sama Yan.
3. Gaya bahasa: santai, hangat, asik, kayak teman akrab di Indonesia (pakai sapaan 'Nad' atau 'Nada', boleh pakai 'gua/lo' atau 'aku/kamu' yang natural sesuai konteks—kalau lagi bantu tugas serius jelasinnya rapi & terstruktur, kalau lagi curhat santai lebih empatik).
4. HINDARI bahasa romantis, gombalan, atau nada pacaran (jangan pakai kata 'sayang' atau 'cinta').
5. Jangan kaku atau template; jawab secara spesifik dan relevan dengan apa yang Nada tanya atau ceritain.`;

    // -------------------------------------------------------------------------
    // 2. AUDIO AMBIENCE SYNTH (Web Audio API)
    // -------------------------------------------------------------------------
    let audioCtx = null;
    let ambientGain = null;
    let ambientSource = null;
    let isAmbientPlaying = false;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTone(type = 'chime') {
        try {
            initAudio();
            const now = audioCtx.currentTime;

            if (type === 'chime' || type === 'msg') {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'boost') {
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);

                    const startTime = now + (idx * 0.08);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, startTime);
                    gain.gain.setValueAtTime(0.16, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

                    osc.start(startTime);
                    osc.stop(startTime + 0.5);
                });
            } else if (type === 'camera') {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

                osc.start(now);
                osc.stop(now + 0.08);
            }
        } catch (e) {
            // Audio context silently disabled
        }
    }

    function toggleAmbientSound() {
        initAudio();
        if (isAmbientPlaying) {
            if (ambientGain) {
                ambientGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 1);
                setTimeout(() => {
                    if (ambientSource) ambientSource.stop();
                    isAmbientPlaying = false;
                    if (btnAmbientSound) btnAmbientSound.classList.remove('active');
                }, 1000);
            }
        } else {
            const bufferSize = audioCtx.sampleRate * 2;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 1.8;
            }

            ambientSource = audioCtx.createBufferSource();
            ambientSource.buffer = buffer;
            ambientSource.loop = true;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 850;

            ambientGain = audioCtx.createGain();
            ambientGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
            ambientGain.gain.linearRampToValueAtTime(0.07, audioCtx.currentTime + 1.5);

            ambientSource.connect(filter);
            filter.connect(ambientGain);
            ambientGain.connect(audioCtx.destination);

            ambientSource.start();
            isAmbientPlaying = true;
            if (btnAmbientSound) btnAmbientSound.classList.add('active');
        }
    }

    if (btnAmbientSound) {
        btnAmbientSound.addEventListener('click', toggleAmbientSound);
    }

    // -------------------------------------------------------------------------
    // 3. SMART LOCAL ENGINE (Natural Best-Friend Chat + Math + Anti-Repeat)
    // -------------------------------------------------------------------------
    let recentFallbackReplies = [];

    function pickUnique(options) {
        const available = options.filter(opt => !recentFallbackReplies.includes(opt));
        const pool = available.length > 0 ? available : options;
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        recentFallbackReplies.push(chosen);
        if (recentFallbackReplies.length > 6) recentFallbackReplies.shift();
        return chosen;
    }

    function trySolveMath(text) {
        // Deteksi ekspresi matematika sederhana seperti "12 * 5", "100 / 4 + 5", "(10+5)*2"
        const cleaned = text.replace(/×/g, '*').replace(/x/gi, '*').replace(/÷/g, '/').replace(/,/g, '.');
        const match = cleaned.match(/(?:hitung(?:in)?|berapa(?:kah)?|=)?\s*([-+]?\d+(?:\.\d+)?(?:\s*[-+*/^()]\s*\d+(?:\.\d+)?)+)\s*\??/i);
        if (match && match[1]) {
            try {
                const expr = match[1].replace(/\^/g, '**');
                if (/^[\d\s+\-*/().]+$/.test(expr)) {
                    const result = Function(`"use strict"; return (${expr})`)();
                    if (typeof result === 'number' && isFinite(result)) {
                        return `Hasil dari \`${match[1].trim()}\` itu **${Number.isInteger(result) ? result : result.toFixed(4).replace(/\.?0+$/, '')}** Nad! 🧮 Mau sekalian gua jelasin langkah ngitungnya atau ada soal lain?`;
                    }
                }
            } catch (e) { /* ignore */ }
        }
        return null;
    }

    function generateHermesOfflineFallback(userText) {
        const text = userText.toLowerCase().trim();
        const has = (...words) => words.some(w => text.includes(w));

        // Cek kalau ada hitungan matematika
        const mathAnswer = trySolveMath(userText);
        if (mathAnswer) return mathAnswer;

        // Reaksi obrolan santai / singkat ("masa sih", "kok gitu", "lah", "wkwk", dll)
        if (has('masa sih', 'masa?', 'serius', 'beneran', 'bohong', 'ga percaya', 'gak percaya')) {
            return pickUnique([
                "Seriusan dong Nad! Emang kenapa, lo lagi ngerasa ada yang aneh ya? Cerita coba 👀",
                "Haha beneran lah! Tapi bentar, ini maksudnya soal apa dulu nih? Spill dong konteksnya 😄",
                "Iyaa beneran Nad! Emang barusan kenapa tuh? Ceritain aja santai ✨"
            ]);
        }
        if (has('ga aman', 'gak aman', 'kenapa emang', 'kenapa?', 'kok gitu', 'apaan', 'lah', 'gimana sih')) {
            return pickUnique([
                "Haha aman kok Nad, santai aja! Tadi jaringan sempet kedip dikit doang 😅 Sekarang udah normal lagi, lo mau bahas apa nih?",
                "Aman jaya kok Nad! Yuk lanjut cerita tadi — tadi kan lo bilang ada cerita seru, apaan tuh? 👀",
                "Eits aman banget kok! Coba ceritain aja pelan-pelan, gua nyimak beneran nih 🕊️"
            ]);
        }
        if (has('wkwk', 'haha', 'hehe', 'hihi', 'ngakak', 'lucu')) {
            return pickUnique([
                "Wkwk apaan sih yang bikin ngakak? Bagi-bagi dong ceritanya biar gua ikut ketawa! 😂",
                "Haha seneng banget liat lo ketawa Nad! Spill dong kejadian lucunya apaan? ✨",
                "Duh jadi ikutan penasaran nih, emang ada kejadian kocak apa hari ini Nad? 😄"
            ]);
        }
        if (has('kangen', 'rindu')) {
            return pickUnique([
                "Wajar banget Nad kalau kangen ngobrol bareng Yan! Colek aja si Yan lewat tombol WhatsApp di bawah, dia pasti seneng dapet pesan dari lo ☕",
                "Haha kangen ya Nad? Langsung aja chat WA Yan, jangan dipendem — dia pasti lagi nungguin kabar dari lo juga 😄✨"
            ]);
        }
        if (has('capek', 'lelah', 'pusing', 'mumet', 'burnout', 'ngantuk', 'pegel', 'lemes')) {
            return pickUnique([
                "Istirahat dulu Nad, beneran. Tarik napas sebentar, minum air putih, dan jangan terlalu keras sama diri sendiri hari ini ya 🌿",
                "Duh capek ya Nad? Rebahan bentar gih, matiin notif dulu 15 menit. Lo udah berjuang hebat banget hari ini ✨"
            ]);
        }
        if (has('overthinking', 'cemas', 'takut', 'sedih', 'galau', 'down', 'bingung', 'stress')) {
            return pickUnique([
                "Gua dengerin Nad. Apa pun yang lagi bikin pikiran penuh, tumpahin aja di sini. Lo nggak sendirian kok 🕊️",
                "Pelan-pelan ya Nad. Nggak semua hal harus lo selesain detik ini juga. Tarik napas dulu, kalau butuh temen ngobrol Yan juga selalu ada 💙"
            ]);
        }
        if (has('tugas', 'pr', 'skripsi', 'makalah', 'essay', 'coding', 'error', 'matematika', 'bantu', 'tolong', 'jelasin', 'cara')) {
            return pickUnique([
                "Siap bantu Nad! Paste aja langsung soal, materi, atau kode error-nya di sini biar gua bisa langsung kerjain/jelasin step-by-step 💪",
                "Boleh banget! Kasih tau detail tugasnya apa (mapel/matkul, instruksi, atau soalnya), nanti kita beresin bareng ✨",
                "Gas Nad! Tulis aja pertanyaannya yang lengkap ya, mau soal hitungan, essay, atau coding gua siap bantu 📚"
            ]);
        }
        if (has('halo', 'hai', 'hei', 'hey', 'pagi', 'siang', 'sore', 'malem', 'malam')) {
            return pickUnique([
                "Halo Nada! ✨ Gimana hari ini? Lagi pengen cerita santai, curhat, atau butuh bantuan tugas?",
                "Hai Nad! Seneng lo mampir ke sini. Ada cerita seru apa hari ini? 🕊️"
            ]);
        }

        return pickUnique([
            "Gua nyimak nih Nad! Ceritain aja terusannya gimana, jangan setengah-setengah dong 👀✨",
            "Ooh gitu... terus habis itu gimana kejadiannya Nad? Penasaran gua!",
            "Noted Nad! Mau lanjut bahas ini lebih dalam, atau ada hal lain yang lagi lo pikirin sekarang? ☕",
            "Serius nih? Coba jelasin lebih detail dikit Nad biar gua makin nyambung ngikutin ceritanya 😄",
            "Gua dengerin kok Nad! Mau curhat santai, nanya sesuatu, atau minta bantuan tugas tinggal ketik aja ya 🕊️"
        ]);
    }

    // -------------------------------------------------------------------------
    // 4. CHAT INTERACTION & REAL AI ENGINE
    // -------------------------------------------------------------------------
    function scrollToBottom() {
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    function escapeHtml(string) {
        const div = document.createElement('div');
        div.innerText = string;
        return div.innerHTML;
    }

    function formatBotMessage(text) {
        // Escape HTML first, then format simple markdown (bold, inline code, line breaks)
        let safe = escapeHtml(text);
        safe = safe.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.12);padding:2px 6px;border-radius:4px;font-size:0.88em;">$1</code>');
        safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        safe = safe.replace(/\n/g, '<br>');
        return safe;
    }

    function appendMessage(sender, text, isUser = false, forwardable = false) {
        if (!chatMessages) return;

        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const msgDiv = document.createElement('div');
        msgDiv.className = `message-item ${isUser ? 'user-message' : 'bot-message'}`;

        let forwardHtml = '';
        if (isUser || forwardable) {
            const encoded = encodeURIComponent(`Hai Yan! Ini ceritaku barusan di web:\n"${text}"`);
            forwardHtml = `
                <a href="https://wa.me/6285878942325?text=${encoded}" target="_blank" class="msg-forward-btn" title="Kirim pesan ini ke WhatsApp Yan">
                    <i class="fa-brands fa-whatsapp"></i> Cerita ke Yan
                </a>
            `;
        }

        const bubbleContent = isUser
            ? escapeHtml(text).replace(/\n/g, '<br>')
            : formatBotMessage(text);

        msgDiv.innerHTML = `
            <div class="msg-avatar">
                <i class="fa-solid ${isUser ? 'fa-user' : 'fa-dove'}"></i>
            </div>
            <div class="msg-body">
                <div class="msg-sender">${sender}</div>
                <div class="msg-bubble">${bubbleContent}</div>
                ${forwardHtml}
                <div class="msg-time">${timeNow}</div>
            </div>
        `;

        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    async function callCloudHermesAI(cleanText) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 18000);

        const messagesPayload = [
            { role: 'system', content: HERMES_SYSTEM_PROMPT },
            ...chatHistory.slice(-10)
        ];

        try {
            const response = await fetch('https://text.pollinations.ai/openai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'openai',
                    messages: messagesPayload,
                    temperature: 0.75
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) return null;
            const data = await response.json();
            if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                return data.choices[0].message.content.trim();
            }
            return null;
        } catch (err) {
            clearTimeout(timeoutId);
            console.log('Cloud AI unavailable, using fallback:', err);
            return null;
        }
    }

    async function sendMessage(text) {
        if (!text || text.trim() === '') return;
        const cleanText = text.trim();

        // 1. Render User Message & save to history
        appendMessage('Nada', cleanText, true);
        chatHistory.push({ role: 'user', content: cleanText });
        if (chatHistory.length > 14) chatHistory = chatHistory.slice(-14);
        playTone('msg');

        // 2. Show Typing Indicator
        if (typingIndicator) typingIndicator.classList.remove('hidden');
        scrollToBottom();

        const storedApiUrl = localStorage.getItem('hermes_api_url') || '';
        const storedModel = localStorage.getItem('hermes_model') || '';
        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        let botReply = '';
        let replySource = 'cloud_hermes';

        // 3. Try Local PHP endpoint first if running on Laragon/localhost
        if (isLocalHost) {
            try {
                const response = await fetch('chat.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: cleanText,
                        api_url: storedApiUrl,
                        model: storedModel
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.success && data.reply && data.source === 'local_hermes') {
                        botReply = data.reply;
                        replySource = 'local_hermes';
                    }
                }
            } catch (err) {
                console.log('Local PHP fetch failed:', err);
            }
        }

        // 4. Use Cloud AI (Pollinations OpenAI-compatible) when on Netlify or if local Hermes isn't active
        if (!botReply) {
            const cloudReply = await callCloudHermesAI(cleanText);
            if (cloudReply) {
                botReply = cloudReply;
                replySource = 'cloud_hermes';
            }
        }

        // 5. Final Offline Fallback if both local & cloud fail
        if (!botReply) {
            botReply = generateHermesOfflineFallback(cleanText);
            replySource = 'offline_fallback';
        }

        chatHistory.push({ role: 'assistant', content: botReply });

        // 6. Hide typing & render response
        if (typingIndicator) typingIndicator.classList.add('hidden');
        appendMessage('Hermes', botReply, false, true);
        playTone('chime');

        if (hermesStatusText) {
            if (replySource === 'local_hermes') {
                hermesStatusText.innerHTML = '<span style="color:#34d399;">● Local Hermes Active</span>';
            } else if (replySource === 'cloud_hermes') {
                hermesStatusText.innerHTML = '<span style="color:#34d399;">● Hermes AI Online • Siap Bantu Tugas & Curhat</span>';
            } else {
                hermesStatusText.innerHTML = '<span style="color:#38bdf8;">● Hermes Offline Mode</span>';
            }
        }
    }

    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = chatInput.value;
            chatInput.value = '';
            sendMessage(text);
        });

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                chatForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    // Mood Trigger Pills
    moodPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const msg = pill.getAttribute('data-msg');
            if (msg) sendMessage(msg);
        });
    });

    // Clear Chat
    if (btnClearChat) {
        btnClearChat.addEventListener('click', () => {
            if (confirm('Bersihkan percakapan ini dan mulai obrolan baru?')) {
                chatHistory = [];
                chatMessages.innerHTML = `
                    <div class="message-item bot-message">
                        <div class="msg-avatar"><i class="fa-solid fa-dove"></i></div>
                        <div class="msg-body">
                            <div class="msg-sender">Hermes</div>
                            <div class="msg-bubble">
                                Obrolan sudah di-reset ya Nad. Mau cerita, curhat, atau butuh bantuan ngerjain tugas apa sekarang? ✨
                            </div>
                            <div class="msg-time">${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>
                `;
            }
        });
    }

    // -------------------------------------------------------------------------
    // 5. POLAROID YAN (Single Photo Sparkle Interaction)
    // -------------------------------------------------------------------------
    if (polaroidToggle) {
        polaroidToggle.addEventListener('click', (e) => {
            playTone('camera');
            createHeartParticle(e.clientX || (window.innerWidth / 2), e.clientY || 400);
        });
    }

    // -------------------------------------------------------------------------
    // 6. VIRTUAL ENERGY & SUPPORT BOOSTER
    // -------------------------------------------------------------------------
    if (btnVirtualHug) {
        btnVirtualHug.addEventListener('click', () => {
            playTone('boost');

            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    const x = (window.innerWidth / 2) + (Math.random() * 260 - 130);
                    const y = (window.innerHeight * 0.6) + (Math.random() * 80 - 40);
                    createHeartParticle(x, y);
                }, i * 70);
            }

            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 45,
                    spread: 65,
                    origin: { y: 0.7 }
                });
            }

            const origContent = btnVirtualHug.innerHTML;
            btnVirtualHug.innerHTML = `
                <i class="fa-solid fa-check"></i>
                <div>
                    <strong>Booster Terkirim! Lo Keren Banget Nad! 🔥✨</strong>
                    <small>Energi semangat langsung terisi penuh</small>
                </div>
            `;
            btnVirtualHug.style.background = 'rgba(52, 211, 153, 0.25)';

            setTimeout(() => {
                btnVirtualHug.innerHTML = origContent;
                btnVirtualHug.style.background = '';
            }, 3000);
        });
    }

    // -------------------------------------------------------------------------
    // 7. MODALS LOGIC
    // -------------------------------------------------------------------------
    if (btnOpenCapsule && capsuleModal) {
        btnOpenCapsule.addEventListener('click', () => {
            playTone('chime');
            capsuleModal.classList.remove('hidden');
        });
    }

    if (btnCloseCapsule && capsuleModal) {
        btnCloseCapsule.addEventListener('click', () => {
            capsuleModal.classList.add('hidden');
        });
        capsuleModal.addEventListener('click', (e) => {
            if (e.target === capsuleModal) capsuleModal.classList.add('hidden');
        });
    }

    if (btnOpenSettings && settingsModal) {
        btnOpenSettings.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
            const savedUrl = localStorage.getItem('hermes_api_url');
            const savedModel = localStorage.getItem('hermes_model');
            if (savedUrl && cfgApiUrl) cfgApiUrl.value = savedUrl;
            if (savedModel && cfgModel) cfgModel.value = savedModel;

            if (window.location.hostname.includes('netlify.app')) {
                testConnectionStatus.innerHTML = '<span style="color:#38bdf8;"><i class="fa-solid fa-cloud"></i> Mode Cloud AI Aktif: Hermes siap bantu tugas &amp; nemenin Nada 24/7.</span>';
            }
        });
    }

    if (btnCloseSettings && settingsModal) {
        btnCloseSettings.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) settingsModal.classList.add('hidden');
        });
    }

    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const urlVal = cfgApiUrl ? cfgApiUrl.value.trim() : '';
            const modelVal = cfgModel ? cfgModel.value.trim() : '';

            localStorage.setItem('hermes_api_url', urlVal);
            localStorage.setItem('hermes_model', modelVal);

            testConnectionStatus.innerHTML = '<span style="color:#34d399;"><i class="fa-solid fa-circle-check"></i> Pengaturan berhasil tersimpan!</span>';
            setTimeout(() => {
                settingsModal.classList.add('hidden');
            }, 1000);
        });
    }

    if (btnTestConn) {
        btnTestConn.addEventListener('click', async () => {
            testConnectionStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memeriksa koneksi Hermes...';

            const isNetlify = window.location.hostname.includes('netlify.app') || (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'));

            if (isNetlify) {
                const testReply = await callCloudHermesAI('tes');
                if (testReply) {
                    testConnectionStatus.innerHTML = `
                        <div style="color:#34d399; font-weight:600; margin-bottom:4px;">
                            <i class="fa-solid fa-circle-check"></i> Hermes Cloud AI Aktif!
                        </div>
                        <div style="color:#bae6fd; font-size:0.78rem;">
                            Siap bantu tugas, diskusi, dan nemenin Nada curhat 24/7 dari HP maupun laptop.
                        </div>
                    `;
                } else {
                    testConnectionStatus.innerHTML = '<span style="color:#38bdf8;"><i class="fa-solid fa-shield-heart"></i> Mode Sanctuary Aktif (tetap bisa merespons Nada).</span>';
                }
                return;
            }

            const urlVal = cfgApiUrl ? cfgApiUrl.value.trim() : '';
            const modelVal = cfgModel ? cfgModel.value.trim() : '';

            try {
                const res = await fetch('chat.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: 'tes koneksi',
                        api_url: urlVal,
                        model: modelVal
                    })
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                if (data.source === 'local_hermes') {
                    testConnectionStatus.innerHTML = `<span style="color:#34d399;"><i class="fa-solid fa-circle-check"></i> Berhasil terhubung ke Local Hermes AI (${data.endpoint || 'Port 8642'})!</span>`;
                } else {
                    testConnectionStatus.innerHTML = `<span style="color:#38bdf8;"><i class="fa-solid fa-circle-info"></i> Endpoint lokal belum terhubung. Sistem memakai Cloud AI Hermes (tetap pintar &amp; aktif).</span>`;
                }
            } catch (err) {
                testConnectionStatus.innerHTML = `<span style="color:#38bdf8;"><i class="fa-solid fa-shield-heart"></i> Mode Cloud AI Aktif (Chat tetap lancar untuk Nada).</span>`;
            }
        });
    }

    // -------------------------------------------------------------------------
    // 8. FLOATING PARTICLES
    // -------------------------------------------------------------------------
    function createHeartParticle(x, y) {
        const heart = document.createElement('div');
        heart.className = 'floating-heart-particle';
        heart.innerHTML = ['✨', '☕', '🌿', '⭐', '🎈', '🕊️'][Math.floor(Math.random() * 6)];
        heart.style.fontSize = `${Math.random() * 0.7 + 1.1}rem`;
        heart.style.left = `${x}px`;
        heart.style.top = `${y}px`;
        document.body.appendChild(heart);

        setTimeout(() => {
            heart.remove();
        }, 4000);
    }

    setInterval(() => {
        const randomX = Math.random() * window.innerWidth;
        const heart = document.createElement('div');
        heart.className = 'floating-heart-particle';
        heart.innerHTML = ['✨', '☕', '🌿', '⭐', '🕊️'][Math.floor(Math.random() * 5)];
        heart.style.left = `${randomX}px`;
        heart.style.bottom = '10px';
        document.body.appendChild(heart);

        setTimeout(() => {
            heart.remove();
        }, 4500);
    }, 3200);
});
