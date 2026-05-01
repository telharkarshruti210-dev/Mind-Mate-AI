// --- 1. USER REGISTRATION (Details Page) ---
const options = document.querySelectorAll('.option');
options.forEach(btn => {
    btn.addEventListener('click', () => {
        options.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

const continueBtn = document.querySelector('.continue');
if (continueBtn) {
    continueBtn.addEventListener('click', () => {
        const nameInput = document.querySelector('input');
        const activeOption = document.querySelector('.option.active');
        const name = nameInput ? nameInput.value.trim() : "";
        const pronoun = activeOption ? activeOption.innerText : "";

        if (name === "") { alert("Please enter your name"); return; }
        if (pronoun === "") { alert("Please select pronouns"); return; }

        localStorage.setItem("username", name);
        localStorage.setItem("pronoun", pronoun);
        window.location.href = "/age"; 
    });
}

// --- 2. GREETING & NAVIGATION ---
document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem("username");
    const aiHeading = document.getElementById("ai-name");
    if (user && aiHeading) {
        aiHeading.innerText = "Meet Nova, " + user;
    }
});

let selectedAge = "";
function selectAge(btn) {
    document.querySelectorAll(".age-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedAge = btn.innerText;

    let nextBtn = document.getElementById("continueBtn");
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.classList.add("enabled");
    }
}

function goNext() {
    window.location.href = '/ai'; 
}
// ===================================================
// 1. GLOBAL STATE & CORE NAVIGATION
// ===================================================
let breathingTimer; 
let gameScore = 0, gameLives = 3, gameLevel = 1, gameActive = false;
let highScore = localStorage.getItem('highScore') || 0;
let isNewHighScore = false;

// Pomodoro State
let pomoMinutes = 25, pomoSeconds = 0, pomoTimer = null, isPomoRunning = false;

// Quiz & Personality State
let currentQuestionIndex = 0, quizScore = 0;
let testScores = { focus: 0, calm: 0, social: 0, creative: 0 }, currentQ = 0;

// Memory pointer for mood selection
let selectedMood = null;

function toggleMenu() {
    const menu = document.getElementById("sideMenu");
    if (menu) menu.classList.toggle("active");
}

function closeOverlay() {
    const overlay = document.getElementById('fullScreenOverlay');
    if (overlay) overlay.classList.remove('active');
    
    // Cleanup active background processes
    gameActive = false;
    if (pomoTimer) clearInterval(pomoTimer);
    if (typeof breathingTimer !== 'undefined') clearTimeout(breathingTimer);
}

// ===================================================
// 2. ULTIMATE ACTIVITY CONTROLLER
// ===================================================
function showActivity(type) {
    const overlay = document.getElementById('fullScreenOverlay');
    const detailsArea = document.getElementById('activityFullArea');
    if (!overlay || !detailsArea) return;

    overlay.classList.add('active');
    detailsArea.innerHTML = ""; 

    if (type === 'mood') {
        detailsArea.innerHTML = `
            <div class="mood-dashboard-large premium-card" style="padding:20px; color:#2d3748; max-width: 500px; margin: 0 auto;">
                <h2 style="text-align:center; font-size:1.6rem; margin-bottom:5px; font-weight: 800; color:#1a202c;">📊 Advanced Mood Intelligence</h2>
                <p style="text-align:center; color:#718096; margin-bottom:20px; font-size: 14px;">Track your inner balance with advanced metrics</p>
                
                <div class="mood-stats" style="display:flex; justify-content:space-around; margin-bottom:20px; background:#f7fafc; padding:15px; border-radius:16px; border: 1px solid #edf2f7;">
                    <div class="stat-box" style="text-align:center;">
                        <span id="avgMood" style="font-size:1.8rem; font-weight:bold; color:#3182ce;">--</span><br>
                        <label style="font-size:11px; font-weight: 600; color:#a0aec0; text-transform: uppercase; letter-spacing: 0.5px;">Avg Score</label>
                    </div>
                    <div class="stat-box" style="text-align:center;">
                        <span id="moodCount" style="font-size:1.8rem; font-weight:bold; color:#3182ce;">0</span><br>
                        <label style="font-size:11px; font-weight: 600; color:#a0aec0; text-transform: uppercase; letter-spacing: 0.5px;">Total Logs</label>
                    </div>
                </div>

                <div class="chart-container-premium" style="position:relative; height:180px; width:100%; margin-bottom:20px; background: #fff; padding: 10px; border-radius: 14px; border: 1px solid #edf2f7;">
                    <canvas id="moodChart"></canvas>
                </div>

                <div id="moodInsightsBanner" style="background:#ebf8ff; border-left: 4px solid #3182ce; padding:12px; border-radius:8px; margin-bottom:20px; font-size: 13px; color: #2b6cb0;">
                    💡 <strong>Insight:</strong> Logging your first mood reveals personal wellness trends over time.
                </div>

                <div class="emoji-selector-card" style="background:#f8fafc; padding:18px; border-radius:18px; border: 1px solid #e2e8f0;">
                    <p style="font-weight:bold; margin-bottom:12px; font-size:14px; color:#4a5568; text-align: center;">1. Choose your current Vibe</p>
                    <div class="emoji-flex" style="display:flex; justify-content:space-between; margin-bottom: 20px;">
                        <button onclick="selectEmoji('Amazing', 5, '🤩', this)" class="mood-emoji-btn" style="font-size:2.2rem; background:none; border:none; cursor:pointer; transition:transform 0.2s; filter: grayscale(30%);">🤩</button>
                        <button onclick="selectEmoji('Neutral', 3, '😐', this)" class="mood-emoji-btn" style="font-size:2.2rem; background:none; border:none; cursor:pointer; transition:transform 0.2s; filter: grayscale(30%);">😐</button>
                        <button onclick="selectEmoji('Down', 2, '😔', this)" class="mood-emoji-btn" style="font-size:2.2rem; background:none; border:none; cursor:pointer; transition:transform 0.2s; filter: grayscale(30%);">😔</button>
                    </div>

                    <div class="sliders-area" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px;">
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:bold; color:#4a5568;">
                                <span>⚡ Energy Level</span>
                                <span id="energyVal">3/5</span>
                            </div>
                            <input type="range" id="energySlider" min="1" max="5" value="3" oninput="document.getElementById('energyVal').innerText=this.value+'/5'" style="width:100%; accent-color:#3182ce;">
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:bold; color:#4a5568;">
                                <span>🎯 Focus/Productivity</span>
                                <span id="focusVal">3/5</span>
                            </div>
                            <input type="range" id="focusSlider" min="1" max="5" value="3" oninput="document.getElementById('focusVal').innerText=this.value+'/5'" style="width:100%; accent-color:#38a169;">
                        </div>
                    </div>

                    <button onclick="submitMoodLog()" style="width: 100%; background: #3182ce; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 15px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);">Save Entry to Logs</button>
                </div>
            </div>
        `;
        setTimeout(updateChart, 300); 
    } 
    else if (type === 'journal') {
        detailsArea.innerHTML = `
            <div class="diary-container-large premium-card" style="padding:20px;">
                <h2 style="text-align:center; color:#2d3748;">📖 My Aesthetic Digital Diary</h2>
                <p style="text-align:center; color:#718096; margin-bottom:15px;">A safe sanctuary for your raw thoughts</p>
                <div class="diary-paper" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:15px; box-shadow:0 4px 6px rgba(0,0,0,0.02);">
                    <div class="diary-lines">
                        <textarea id="journalInput" style="width:100%; height:250px; border:none; outline:none; font-size:16px; line-height:2; resize:none; background:transparent;" placeholder="Dear Diary, what's on your mind today? Let it flow..."></textarea>
                    </div>
                </div>
                <div class="diary-controls" style="display:flex; gap:15px; align-items:center; margin-top:20px;">
                    <select id="diaryMood" style="flex:1; padding:12px; border-radius:10px; border:1px solid #cbd5e0; outline:none; background:#fff; font-size:15px;">
                        <option value="Neutral">Tag your vibe</option>
                        <option value="Happy">Happy 😊</option>
                        <option value="Productive">Productive 💪</option>
                        <option value="Tired">Tired 😴</option>
                        <option value="Anxious">Anxious 😰</option>
                        <option value="Excited">Excited 🎉</option>
                    </select>
                    <button onclick="saveJournal()" class="diary-save-btn" style="background:#3182ce; color:white; padding:12px 24px; border:none; border-radius:10px; cursor:pointer; font-weight:bold; transition:all 0.2s;">Seal Entry</button>
                </div>
                <p id="saveStatus" style="text-align:center; margin-top:12px; font-weight:bold; color:#38a169; height:20px;"></p>
            </div>
        `;
        const saved = localStorage.getItem('dailyJournal');
        if (saved) document.getElementById('journalInput').value = saved;
    }
    else if (type === 'relax') {
        detailsArea.innerHTML = `
            <div class="relax-container-large premium-card" style="text-align:center; padding:20px;">
                <h2 style="color:#2d3748;">🌬️ Cosmic Deep Breathing</h2>
                <p style="color:#718096; margin-bottom:30px;">Inhale & Exhale slowly with the pulse to release anxiety</p>
                <div class="breathing-space" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:320px;">
                    <div id="breathingCircle" class="relax-circle" style="width:140px; height:140px; border-radius:50%; background:radial-gradient(circle, #63b3ed, #3182ce); box-shadow:0 0 25px rgba(49,130,206,0.4); transition:all 4s ease-in-out;"></div>
                    <p id="breathText" style="font-size:22px; font-weight:bold; color:#2d3748; margin-top:40px; min-height:35px;">Prepare to relax...</p>
                </div>
                <button onclick="startBreathing()" class="relax-btn" id="relaxBtn" style="background:#3182ce; color:#fff; padding:14px 40px; border:none; border-radius:30px; font-size:18px; cursor:pointer; font-weight:bold; transition:0.3s; width: 220px; margin: 0 auto;">Start Session</button>
            </div>
        `;
    }
    else if (type === 'game') {
        detailsArea.innerHTML = `
            <div class="game-container-large premium-card" style="padding:15px;">
                <h2 style="text-align:center; color:#2d3748; margin-bottom:5px;">🎮 CalmSphere (Premium Arcade)</h2>
                <p style="text-align:center; color:#64748b; margin-bottom:15px;">Tap glowing neon bubbles before they fade to release adrenaline</p>
                <div id="gameCanvas" class="calm-sphere-area" style="height: 400px; background:linear-gradient(to bottom, #1a202c, #2d3748); border-radius:18px; position:relative; overflow:hidden; border:2px solid #4a5568; box-shadow:inset 0 4px 10px rgba(0,0,0,0.5);">
                    <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; color:#fff;">
                        <p style="font-size:1.2rem; margin-bottom:20px; font-weight:300;">Release your tension now</p>
                        <button onclick="startCalmSphere()" class="relax-btn" style="background:#4fd1c5; color:#1a202c; padding:12px 30px; border-radius:25px; border:none; font-weight:bold; font-size:16px; cursor:pointer;">Launch Session</button>
                    </div>
                </div>
            </div>
        `;
    }
    else if (type === 'gratitude') {
        detailsArea.innerHTML = `
            <div class="gratitude-container-large premium-card" style="padding:20px;">
                <h2 style="text-align:center; color:#2d3748;">✨ Digital Gratitude Jar</h2>
                <p style="text-align:center; color:#718096; margin-bottom:20px;">Add one positive thing that happened today to the jar</p>
                <div style="display:flex; flex-direction:column; gap:15px;">
                    <div style="display:flex; gap:10px;">
                        <input id="gratitudeText" type="text" placeholder="I am grateful for..." style="flex:1; padding:12px; border-radius:10px; border:1px solid #cbd5e0; font-size:15px; outline:none;" />
                        <button onclick="addGratitude()" style="background:#dd6b20; color:white; padding:12px 20px; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">Save to Jar</button>
                    </div>
                    <div id="jarItems" style="height:250px; background:#fffaf0; border:2px dashed #f6ad55; border-radius:16px; padding:15px; overflow-y:auto; display:flex; flex-wrap:wrap; gap:8px; align-content: flex-start;">
                    </div>
                </div>
            </div>
        `;
        renderGratitude();
    }
    else if (type === 'pomodoro') {
        detailsArea.innerHTML = `
            <div class="pomodoro-container-large premium-card" style="padding:20px; text-align:center;">
                <h2 style="color:#2d3748;">⏱️ Focus Pomodoro</h2>
                <p style="color:#718096; margin-bottom:25px;">25 mins focus time with 5 mins restorative pause</p>
                <div style="font-size: 5rem; font-weight:bold; color:#1a202c; margin-bottom:20px; font-family: monospace;" id="timerDisplay">25:00</div>
                <div style="display:flex; gap:15px; justify-content:center;">
                    <button onclick="toggleTimer()" id="pomoBtn" style="background:#38a169; color:white; padding:12px 30px; border-radius:10px; border:none; font-weight:bold; cursor:pointer; font-size:16px;">Start Timer</button>
                    <button onclick="resetTimer()" style="background:#e2e8f0; color:#2d3748; padding:12px 30px; border-radius:10px; border:none; font-weight:bold; cursor:pointer; font-size:16px;">Reset</button>
                </div>
            </div>
        `;
    }
    else if (type === 'quiz') {
        detailsArea.innerHTML = `
            <div class="quiz-container premium-card" style="padding:20px;">
                <div class="progress-bar-container" style="height:10px; background:#e2e8f0; border-radius:10px; margin-bottom:20px; overflow:hidden;">
                    <div id="quizProgress" class="progress-fill" style="height:100%; width:0%; background:linear-gradient(to right, #4299e1, #3182ce); border-radius:10px; transition:width 0.3s;"></div>
                </div>
                <h2 id="questionText" style="text-align:center; font-size:1.5rem; color:#2d3748; margin-bottom:25px;">Ready for Wellness Quiz?</h2>
                <div id="quizOptions" class="quiz-grid" style="display:flex; flex-direction:column; gap:12px;">
                    <button onclick="startQuiz()" class="relax-btn" style="background:#3182ce; color:white; padding:14px; border:none; border-radius:12px; font-size:16px; font-weight:bold; cursor:pointer; text-align:center;">Start Quiz Now</button>
                </div>
            </div>
        `;
    }
    else if (type === 'personality') {
        detailsArea.innerHTML = `
            <div class="personality-container premium-card" style="padding:20px; max-width: 500px; margin: 0 auto;">
                <h2 style="text-align:center; font-size:1.6rem; margin-bottom:5px; font-weight: 800; color:#1a202c;">🧩 Advanced Personality Test</h2>
                <p style="text-align:center; color:#718096; margin-bottom:25px; font-size:14px;">Understand your mind's core traits</p>
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 20px 0;">
                    <p style="font-size:15px; color:#4a5568; margin-bottom:25px; line-height:1.5; text-align:center;">This interactive assessment determines your natural working and personal vibe based on 10 quick self-reflection metrics.</p>
                    <button onclick="startPersonalityTest()" class="relax-btn" style="background:#3182ce; color:white; padding:14px 35px; border:none; border-radius:12px; font-size:16px; font-weight:bold; cursor:pointer; width:100%; transition:all 0.2s; box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);">Begin Test Now</button>
                </div>
            </div>
        `;
    }
}
// ===================================================
// 3. ULTRA-ADVANCED MOOD TRACKER LOGIC
// ===================================================
function selectEmoji(name, score, emoji, element) {
    selectedMood = { name, score, emoji };
    
    // Dim all emojis and highlight selected
    document.querySelectorAll('.mood-emoji-btn').forEach(btn => {
        btn.style.transform = "scale(1)";
        btn.style.filter = "grayscale(80%)";
    });
    element.style.transform = "scale(1.35)";
    element.style.filter = "grayscale(0%)";
}

function submitMoodLog() {
    if (!selectedMood) {
        alert("Please pick a mood emoji before saving!");
        return;
    }

    const energy = document.getElementById('energySlider').value;
    const focus = document.getElementById('focusSlider').value;

    let moodData = JSON.parse(localStorage.getItem('moodHistory')) || [];
    moodData.push({ 
        date: new Date().toLocaleDateString('en-US', { weekday: 'short' }), 
        score: selectedMood.score,
        emoji: selectedMood.emoji,
        energy: parseInt(energy),
        focus: parseInt(focus),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    
    localStorage.setItem('moodHistory', JSON.stringify(moodData));
    
    // Clear selection for next log
    selectedMood = null;
    document.querySelectorAll('.mood-emoji-btn').forEach(btn => {
        btn.style.transform = "scale(1)";
        btn.style.filter = "grayscale(30%)";
    });
    
    // Reset sliders
    document.getElementById('energySlider').value = 3;
    document.getElementById('focusSlider').value = 3;
    document.getElementById('energyVal').innerText = "3/5";
    document.getElementById('focusVal').innerText = "3/5";

    updateChart();
}

function updateChart() {
    const canvas = document.getElementById('moodChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let moodData = JSON.parse(localStorage.getItem('moodHistory')) || [];
    let last7 = moodData.slice(-7); 

    // Update Score and Count metrics
    document.getElementById('moodCount').innerText = moodData.length;
    if (moodData.length > 0) {
        let avg = moodData.reduce((a, b) => a + b.score, 0) / moodData.length;
        document.getElementById('avgMood').innerText = avg.toFixed(1);
        
        // Generate Dynamic Insight
        const lastEntry = moodData[moodData.length - 1];
        let tip = "Keep up the consistent tracking!";
        if (lastEntry.score >= 4 && lastEntry.energy >= 4) tip = "High Vibe detected! Perfect time to tackle hard goals.";
        if (lastEntry.score <= 2) tip = "Looks like a low energy day. Try a 5-min relaxation session.";
        if (lastEntry.focus >= 4 && lastEntry.energy <= 2) tip = "High focus but low energy. Burnout warning! Take breaks.";
        
        document.getElementById('moodInsightsBanner').innerHTML = `💡 <strong>AI Insight:</strong> ${tip}`;
    }

    if (window.myChart) { window.myChart.destroy(); }

    // Visual Gradient Setup
    let gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, 'rgba(49, 130, 206, 0.35)');
    gradient.addColorStop(1, 'rgba(49, 130, 206, 0.0)');

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7.map(d => `${d.date} (${d.emoji})`),
            datasets: [{
                data: last7.map(d => d.score),
                borderColor: '#3182ce',
                borderWidth: 3.5,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#3182ce',
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.4, 
                fill: true,
                backgroundColor: gradient
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let entry = last7[context.dataIndex];
                            return ` Mood Score: ${context.raw}/5 | Energy: ${entry.energy || 3} | Focus: ${entry.focus || 3}`;
                        }
                    }
                }
            },
            scales: {
                y: { min: 1, max: 5, grid: { color: '#f7fafc' }, ticks: { stepSize: 1, color: '#718096' } },
                x: { grid: { display: false }, ticks: { color: '#718096' } }
            }
        }
    });
}

// ===================================================
// 4. DIGITAL DIARY LOGIC
// ===================================================
function saveJournal() {
    const text = document.getElementById('journalInput').value;
    const mood = document.getElementById('diaryMood').value;
    
    if (text.trim() === "") {
        alert("Empty diary? Let's jot down something meaningful first!");
        return;
    }

    localStorage.setItem('dailyJournal', text); 
    localStorage.setItem('lastMoodTag', mood);

    const status = document.getElementById('saveStatus');
    if (status) {
        status.innerText = "✨ Your narrative was safely locked.";
        setTimeout(() => status.innerText = "", 3000);
    }
}

// ===================================================
// 5. BREATHING GUIDE LOGIC
// ===================================================
function startBreathing() {
    const circle = document.getElementById('breathingCircle');
    const text = document.getElementById('breathText');
    const btn = document.getElementById('relaxBtn');

    if (!circle || !text || !btn) return;

    if (btn.innerText === "Stop Session") {
        clearTimeout(breathingTimer);
        circle.style.transform = "scale(1)";
        text.innerText = "Session Ended";
        btn.innerText = "Start Session";
        btn.style.background = "#3182ce";
        return;
    }

    btn.innerText = "Stop Session";
    btn.style.background = "#e53e3e";

    function runCycle() {
        text.innerText = "Inhale... 🌬️";
        circle.style.transform = "scale(1.6)";

        breathingTimer = setTimeout(() => {
            text.innerText = "Exhale... 🌬️";
            circle.style.transform = "scale(0.8)";
            breathingTimer = setTimeout(runCycle, 4000); 
        }, 4000); 
    }
    runCycle();
}

// ===================================================
// 6. GAME LOGIC (Arcade Mode)
// ===================================================
function startCalmSphere() {
    const area = document.getElementById('gameCanvas');
    if (!area) return;
    
    gameScore = 0; gameLives = 3; gameLevel = 1; gameActive = true; isNewHighScore = false;

    area.innerHTML = `
        <div class="game-stats" style="display:flex; justify-content:space-between; position:absolute; width:100%; padding:15px; color:#fff; font-weight:bold; z-index:10; background:rgba(0,0,0,0.15);">
            <div>Score: <span id="currentScore" style="color:#63b3ed;">0</span></div>
            <div>Hearts: <span id="currentLives" style="color:#e53e3e;">❤️❤️❤️</span></div>
            <div id="highScoreText" style="color:#ffd700;">High: ${highScore}</div>
        </div>
        <div id="celebration" style="display:none; position:absolute; top:40%; text-align:center; width:100%; color:#ffd700; font-size:20px; font-weight:bold; z-index:11;">NEW RECORD SMASHED! 🏆</div>
    `;
    spawnOrbs();
}

function spawnOrbs() {
    if (!gameActive || !document.getElementById('gameCanvas')) return;

    const area = document.getElementById('gameCanvas');
    const orb = document.createElement('div');
    orb.className = 'orb';
    
    let size = Math.random() * 30 + 35;
    orb.style.width = size + 'px';
    orb.style.height = size + 'px';
    orb.style.background = `radial-gradient(circle, #63b3ed, #3182ce)`;
    orb.style.boxShadow = `0 0 15px rgba(66,153,225,0.8)`;
    orb.style.borderRadius = "50%";
    orb.style.position = "absolute";
    orb.style.cursor = "pointer";
    orb.style.left = Math.random() * (area.clientWidth - 50) + 'px';
    orb.style.top = area.clientHeight + 'px';
    orb.style.transition = "transform 0.1s linear";

    orb.onclick = function() {
        if (!this.classList.contains('blast')) {
            this.classList.add('blast');
            gameScore += 10;
            checkGameProgress();
            this.remove();
        }
    };

    area.appendChild(orb);

    let currentY = area.clientHeight;
    let speed = 1.6 + (gameLevel * 0.45);

    const move = setInterval(() => {
        if (!gameActive) { clearInterval(move); return; }
        
        currentY -= speed;
        orb.style.top = currentY + 'px';

        if (currentY < -50) {
            clearInterval(move);
            if (orb.parentNode) { orb.remove(); handleMiss(); }
        }
    }, 20);

    let nextSpawn = Math.max(450, 1400 - (gameLevel * 120));
    setTimeout(spawnOrbs, nextSpawn);
}

function handleMiss() {
    gameLives--;
    let hearts = "❤️".repeat(gameLives) + "🖤".repeat(3 - gameLives);
    const livesEl = document.getElementById('currentLives');
    if (livesEl) livesEl.innerText = hearts;

    if (gameLives <= 0) endGame();
}

function checkGameProgress() {
    const scoreEl = document.getElementById('currentScore');
    if (scoreEl) scoreEl.innerText = gameScore;

    if (gameScore > highScore && !isNewHighScore && highScore > 0) {
        isNewHighScore = true;
        const celeb = document.getElementById('celebration');
        const hsText = document.getElementById('highScoreText');
        if (celeb) celeb.style.display = 'block';
        if (hsText) hsText.innerText = "MAX RECORD! 🏆";
    }

    if (gameScore % 100 === 0) {
        gameLevel++;
        showLevelUp();
    }
}

function showLevelUp() {
    const area = document.getElementById('gameCanvas');
    if (!area) return;
    const lvlTxt = document.createElement('div');
    lvlTxt.innerText = `LEVEL UP: ${gameLevel} ⚡`;
    lvlTxt.style.cssText = "position:absolute; top:40%; text-align:center; width:100%; color:#4fd1c5; font-size:25px; font-weight:bold; animation: fadeOut 1.5s forwards;";
    area.appendChild(lvlTxt);
    setTimeout(() => lvlTxt.remove(), 1500);
}

function endGame() {
    gameActive = false;
    const area = document.getElementById('gameCanvas');
    if (!area) return;
    
    if (gameScore > highScore) {
        localStorage.setItem('highScore', gameScore);
        highScore = gameScore;
    }

    area.innerHTML = `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; color:#fff; text-align:center; padding:15px;">
            <h1 style="color:#fc8181; font-size:2.2rem; margin-bottom:10px;">MISSION ENDED</h1>
            <p style="font-size:1.1rem; margin-bottom:5px;">Your Score: ${gameScore}</p>
            <p style="color:#ffd700; margin-bottom:20px;">Top Record: ${highScore}</p>
            <button onclick="startCalmSphere()" class="relax-btn" style="background:#4299e1; color:white; padding:12px 30px; border-radius:12px; border:none; font-weight:bold; cursor:pointer;">Play Again</button>
        </div>
    `;
}

// ===================================================
// 7. NEW ADDITION: POMODORO TIMER
// ===================================================
function toggleTimer() {
    const btn = document.getElementById('pomoBtn');
    if (!btn) return;
    if (isPomoRunning) {
        clearInterval(pomoTimer);
        btn.innerText = "Resume Session";
        btn.style.background = "#3182ce";
        isPomoRunning = false;
    } else {
        isPomoRunning = true;
        btn.innerText = "Pause Session";
        btn.style.background = "#e53e3e";
        pomoTimer = setInterval(() => {
            if (pomoSeconds === 0) {
                if (pomoMinutes === 0) {
                    clearInterval(pomoTimer);
                    alert("Focus cycle completed! Have a short break.");
                    resetTimer();
                    return;
                }
                pomoMinutes--;
                pomoSeconds = 59;
            } else {
                pomoSeconds--;
            }
            updateTimerDisplay();
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(pomoTimer);
    isPomoRunning = false;
    pomoMinutes = 25; pomoSeconds = 0;
    const btn = document.getElementById('pomoBtn');
    if (btn) { btn.innerText = "Start Timer"; btn.style.background = "#38a169"; }
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const disp = document.getElementById('timerDisplay');
    if (disp) {
        let m = pomoMinutes < 10 ? "0" + pomoMinutes : pomoMinutes;
        let s = pomoSeconds < 10 ? "0" + pomoSeconds : pomoSeconds;
        disp.innerText = `${m}:${s}`;
    }
}

// ===================================================
// 8. NEW ADDITION: GRATITUDE JAR
// ===================================================
function addGratitude() {
    const input = document.getElementById('gratitudeText');
    if (!input || input.value.trim() === "") return;
    
    let entries = JSON.parse(localStorage.getItem('gratitudeEntries')) || [];
    entries.push({ id: Date.now(), text: input.value.trim() });
    localStorage.setItem('gratitudeEntries', JSON.stringify(entries));
    input.value = "";
    renderGratitude();
}

function removeGratitude(id) {
    let entries = JSON.parse(localStorage.getItem('gratitudeEntries')) || [];
    entries = entries.filter(item => item.id !== id);
    localStorage.setItem('gratitudeEntries', JSON.stringify(entries));
    renderGratitude();
}

function renderGratitude() {
    const container = document.getElementById('jarItems');
    if (!container) return;
    container.innerHTML = "";
    let entries = JSON.parse(localStorage.getItem('gratitudeEntries')) || [];
    
    if (entries.length === 0) {
        container.innerHTML = `<p style="color:#718096; margin:auto; font-style:italic;">Your jar is currently empty. Pour some good vibes into it!</p>`;
        return;
    }
    
    entries.forEach(entry => {
        const item = document.createElement('div');  
        item.style.cssText = "background:#fff; border: 1px solid #fbd38d; padding:8px 14px; border-radius:20px; font-size:14px; color:#744210; box-shadow:0 2px 4px rgba(0,0,0,0.03); display:flex; align-items:center; gap:8px;";
        item.innerHTML = `
            <span>✨ ${entry.text}</span>
            <button onclick="removeGratitude(${entry.id})" style="background:transparent; border:none; color:#dd6b20; font-weight:bold; cursor:pointer; font-size:14px; padding:0; margin-left:4px;">✕</button>
        `;
        container.appendChild(item);
    });
}
// ===================================================
// 8. NEW ADDITION: GRATITUDE JAR
// ===================================================
function addGratitude() {
    const input = document.getElementById('gratitudeText');
    if (!input || input.value.trim() === "") return;
    
    let entries = JSON.parse(localStorage.getItem('gratitudeEntries')) || [];
    entries.push({ id: Date.now(), text: input.value.trim() });
    localStorage.setItem('gratitudeEntries', JSON.stringify(entries));
    input.value = "";
    renderGratitude();
}

function removeGratitude(id) {
    let entries = JSON.parse(localStorage.getItem('gratitudeEntries')) || [];
    entries = entries.filter(item => item.id !== id);
    localStorage.setItem('gratitudeEntries', JSON.stringify(entries));
    renderGratitude();
}

function renderGratitude() {
    const container = document.getElementById('jarItems');
    if (!container) return;
    container.innerHTML = "";
    let entries = JSON.parse(localStorage.getItem('gratitudeEntries')) || [];
    
    if (entries.length === 0) {
        container.innerHTML = `<p style="color:#718096; margin:auto; font-style:italic;">Your jar is currently empty. Pour some good vibes into it!</p>`;
        return;
    }
    
    entries.forEach(entry => {
        const item = document.createElement('div');
        item.style.cssText = "background:#fff; border:1px solid #fbd38d; padding:8px 14px; border-radius:20px; font-size:14px; display:flex; gap:10px; align-items:center; box-shadow:0 2px 4px rgba(0,0,0,0.02); color:#4a5568;";
        item.innerHTML = `<span>✨ ${entry.text}</span><span onclick="removeGratitude(${entry.id})" style="cursor:pointer; color:#e53e3e; font-weight:bold;">&times;</span>`;
        container.appendChild(item);
    });
}

// ===================================================
// 9. WELLNESS QUIZ LOGIC
// ===================================================
const wellnessQuestions = [
    {
        q: "Aaj aapki focus capability kaisi hai?",
        options: [
            { text: "Sharp 🧠", weight: 3 },
            { text: "Okay okay 🙂", weight: 2 },
            { text: "Distracted 😵‍💫", weight: 1 },
            { text: "Blank 😶", weight: 0 }
        ]
    },
    {
        q: "Body mein energy level kaisa feel ho raha hai?",
        options: [
            { text: "Super Active ⚡", weight: 3 },
            { text: "Normal 🚶", weight: 2 },
            { text: "Tired 😴", weight: 1 },
            { text: "Exhausted 😫", weight: 0 }
        ]
    },
    {
        q: "Social interactions ke liye kitne ready hain?",
        options: [
            { text: "Let's Talk! 🗣️", weight: 3 },
            { text: "Maybe later 😶", weight: 2 },
            { text: "Need space 🤫", weight: 1 },
            { text: "Not at all 🙅", weight: 0 }
        ]
    },
    {
        q: "Overall emotional mood kaisa hai?",
        options: [
            { text: "Balanced ⚖️", weight: 3 },
            { text: "Anxious 😰", weight: 1 },
            { text: "Calm 😌", weight: 2 },
            { text: "Upset 😢", weight: 0 }
        ]
    }
];

function startQuiz() {
    currentQuestionIndex = 0; quizScore = 0;
    updateProgressBar(0);
    showQuestion();
}

function showQuestion() {
    const qText = document.getElementById('questionText');
    const qOptions = document.getElementById('quizOptions');
    if (!qText || !qOptions) return;
    
    qOptions.innerHTML = "";
    
    if (currentQuestionIndex < wellnessQuestions.length) {
        let currentQ = wellnessQuestions[currentQuestionIndex];
        qText.innerText = currentQ.q;

        let progressPercent = (currentQuestionIndex / wellnessQuestions.length) * 100;
        updateProgressBar(progressPercent);

        currentQ.options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "option-btn-quiz";
            btn.style.cssText = "width:100%; padding:14px; text-align:left; border:1px solid #e2e8f0; background:white; border-radius:12px; font-size:15px; cursor:pointer; font-weight:bold; color:#4a5568; transition:all 0.2s;";
            btn.innerHTML = `<span class="opt-text">${opt.text}</span>`;
            
            btn.onclick = () => {
                quizScore += opt.weight;
                currentQuestionIndex++;
                showQuestion();
            };
            qOptions.appendChild(btn);
        });
    } else {
        showResults();
    }
}

function updateProgressBar(percent) {
    const bar = document.getElementById('quizProgress');
    if(bar) bar.style.width = percent + "%";
}

function showResults() {
    const qText = document.getElementById('questionText');
    const qOptions = document.getElementById('quizOptions');
    if (!qText || !qOptions) return;
    
    updateProgressBar(100);
    let recommendation = "", bgColor = "";

    if (quizScore >= 10) {
        recommendation = "You're in Zen mode! Perfect balance. Good time to reflect or focus.";
        bgColor = "#c6f6d5"; 
    } else if (quizScore >= 7) {
        recommendation = "Moderate mental balance. Try the Pomodoro timer or clear stress with CalmSphere!";
        bgColor = "#bee3f8"; 
    } else if (quizScore >= 4) {
        recommendation = "You seem distracted or tired. Rest and breathing sessions are highly advised.";
        bgColor = "#fef3c7"; 
    } else {
        recommendation = "High stress levels flagged. Let's record your vibe or clear your head.";
        bgColor = "#fed7d7"; 
    }

    qText.innerText = "Your Wellness Metric Result";
    qOptions.innerHTML = `
        <div class="result-box" style="background-color: ${bgColor}; padding: 15px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05); margin-bottom: 15px;">
            <p style="font-size: 16px; font-weight: bold; color: #333;">Score: ${quizScore} / 12</p>
            <p style="font-size: 14px; color: #4a5568; line-height: 1.5; margin-top: 8px;">${recommendation}</p>
        </div>
        <button onclick="startQuiz()" class="relax-btn" style="width:100%; background:#3182ce; color:#fff; border:none; padding:12px; border-radius:10px; cursor:pointer; font-weight:bold;">Run Quiz Again</button>
    `;
}

// ===================================================
// 10. ADVANCED PERSONALITY TEST
// ===================================================
const personalityQuestions = [
    { q: "Aap ek anjaan party mein hain. Aap kya karenge?", options: [{t:"Sabse baat karunga", v:"social"}, {t:"Corner mein baithunga", v:"calm"}] },
    { q: "Kaam karte waqt thoda sa shor (noise) aapko kitna disturb karta hai?", options: [{t:"Bahut zyada", v:"focus"}, {t:"Farak nahi padta", v:"calm"}] },
    { q: "Aapka workspace (table) kaisa dikhta hai?", options: [{t:"Ekdum saaf", v:"focus"}, {t:"Thoda messy par creative", v:"creative"}] },
    { q: "Nayi cheezein sikhne ke liye aapka approach?", options: [{t:"Pura plan bana kar", v:"focus"}, {t:"Direct jump karke", v:"creative"}] },
    { q: "Stressful situation mein aap kya karte hain?", options: [{t:"Deep breathing", v:"calm"}, {t:"Logon se discuss", v:"social"}] },
    { q: "Aapko kya pasand hai?", options: [{t:"Puraani yaadein", v:"calm"}, {t:"Future ke sapne", v:"creative"}] },
    { q: "Doston ke saath trip par jaana ho toh?", options: [{t:"I am the Leader", v:"social"}, {t:"I just follow", v:"calm"}] },
    { q: "Aap decisions kaise lete hain?", options: [{t:"Dil se (Emotionally)", v:"creative"}, {t:"Dimag se (Logically)", v:"focus"}] },
    { q: "Kya aapko akele rehna pasand hai?", options: [{t:"Haan, energy milti hai", v:"calm"}, {t:"Nahi, boriyat hoti hai", v:"social"}] },
    { q: "Aapka dream goal kya hai?", options: [{t:"Duniya badalna", v:"creative"}, {t:"Sukoon se jeena", v:"calm"}] }
];

function startPersonalityTest() {
    currentQ = 0; testScores = { focus: 0, calm: 0, social: 0, creative: 0 };
    showNextQuestion();
}

function showNextQuestion() {
    const area = document.getElementById('activityFullArea');
    if (!area) return;

    if (currentQ < personalityQuestions.length) {
        let q = personalityQuestions[currentQ];
        area.innerHTML = `
            <div class="test-card-pro" style="padding:15px;">
                <div class="progress-bar-mini" style="background:#edf2f7; border-radius:10px; margin-bottom:15px;">
                    <div style="width:${(currentQ+1)*10}%; height:8px; background:#4fd1c5; border-radius:10px; transition: width 0.3s;"></div>
                </div>
                <p style="color:#718096; font-size:14px;">Question ${currentQ+1} of 10</p>
                <h2 style="margin: 15px 0; font-size:1.3rem; color:#2d3748;">${q.q}</h2>
                <div class="test-options" style="display:flex; flex-direction:column; gap:12px;">
                    ${q.options.map(opt => `<button style="padding:14px; border-radius:10px; border:1px solid #cbd5e0; background:#fff; cursor:pointer; text-align:left; font-size:15px; font-weight:bold; color:#4a5568; transition:all 0.2s;" onclick="handleTestAnswer('${opt.v}')">${opt.t}</button>`).join('')}
                </div>
            </div>
        `;
    } else {
        showTestResult();
    }
}

function handleTestAnswer(trait) {
    testScores[trait]++; currentQ++;
    showNextQuestion();
}

function showTestResult() {
    const area = document.getElementById('activityFullArea');
    if (!area) return;

    const topTrait = Object.keys(testScores).reduce((a, b) => testScores[a] > testScores[b] ? a : b);
    
    const descriptions = {
        focus: "The Architect: Precise & methodical. Your power lies in deep analytics.",
        calm: "The Zen Master: The peaceful anchor. You navigate crisis with quiet poise.",
        social: "The Social Connector: Your energy radiates through warm human communication.",
        creative: "The Visionary: Boundless ideation. You map new dimensions of reality."
    };

    area.innerHTML = `
        <div class="result-card-pro" style="text-align:center; padding: 20px;">
            <div style="font-size:45px; margin-bottom:15px;">✨</div>
            <h1 style="font-size:1.7rem; color:#1a202c; margin-bottom:10px;">Mind Type: ${topTrait.toUpperCase()}</h1>
            <p style="color:#4a5568; margin-bottom:25px; line-height:1.5;">${descriptions[topTrait]}</p>
            <div style="margin-bottom:25px;">
                ${Object.entries(testScores).map(([k, v]) => `
                    <div style="margin-bottom:12px;">
                        <span style="display:inline-block; width:110px; text-align:left; font-weight:bold; font-size:13px; color:#4a5568;">${k.toUpperCase()}</span>
                        <div style="display:inline-block; width:calc(100% - 120px); height:12px; background:#edf2f7; border-radius:6px; vertical-align:middle; overflow:hidden;">
                            <div style="width:${v*25}%; height:100%; background:#4fd1c5; border-radius:6px; transition:width 0.4s;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button onclick="closeOverlay()" class="relax-btn" style="background:#3182ce; color:white; padding:12px 35px; border-radius:10px; border:none; cursor:pointer; font-weight:bold;">Proceed to Chat</button>
        </div>
    `;
}

// ===================================================
// 11. MESSAGING SYSTEM WITH AI
// ===================================================
async function sendMessage() {
    const input = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');
    if (!input || input.value.trim() === "") return;

    const message = input.value.trim();
    appendMessage("user", message);
    input.value = "";

    const typingDiv = document.createElement("div");
    typingDiv.className = "message ai";
    typingDiv.id = "typing-indicator";
    typingDiv.innerHTML = `<div class="text-bubble typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message, username: localStorage.getItem("username") || "Friend" })
        });
        const data = await response.json();
        const indicator = document.getElementById("typing-indicator");
        if (indicator) indicator.remove();
        appendMessage("ai", data.reply);
    } catch (error) {
        const indicator = document.getElementById("typing-indicator");
        if (indicator) indicator.remove();
        appendMessage("ai", "Internal connection drop. Check if Python terminal is active.");
    }
}

function appendMessage(role, text) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    msgDiv.innerHTML = `<div class="text-bubble">${text}</div>`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement.id === 'userInput') sendMessage();
});