// --- AUDIO ENGINE (Web Audio API) ---
// Generates 8-bit style sound effects programmatically.
window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

window.playSynthSound = (type) => {
    if (window.audioCtx.state === 'suspended') window.audioCtx.resume();
    
    const osc = window.audioCtx.createOscillator();
    const gainNode = window.audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(window.audioCtx.destination);

    const now = window.audioCtx.currentTime;

    if (type === 'complete') {
        // "Coin" Sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'levelUp') {
        // "Victory" Arpeggio
        osc.type = 'triangle';
        gainNode.gain.value = 0.1;
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.1); // C#
        osc.frequency.setValueAtTime(659, now + 0.2); // E
        osc.frequency.setValueAtTime(880, now + 0.3); // A
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
    } else if (type === 'notify') {
        // "New Quest" Ping
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
};

// --- HELPER UTILS ---
window.generateId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

window.getRandomPos = () => ({
    x: Math.floor(Math.random() * (window.innerWidth - 300)),
    y: Math.floor(Math.random() * (window.innerHeight - 200)) + 50
});