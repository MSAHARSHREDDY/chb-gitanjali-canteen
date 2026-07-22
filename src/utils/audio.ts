/**
 * Generates an elegant, crystal-clear school chime sound using Web Audio API synthesis.
 */
export function playOrderBell() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Primary fundamental bell chime frequency
    const osc1 = ctx.createOscillator();
    // High overtone frequency to add bright, metallic crystal characteristics
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.type = "sine";
    // Standard sweet Gitanjali silver bell chime: B5 note (approx 987.77 Hz)
    osc1.frequency.setValueAtTime(987.77, ctx.currentTime);
    
    osc2.type = "triangle";
    // Perfect fifth overtone in higher octave (approx 1479.98 Hz)
    osc2.frequency.setValueAtTime(1479.98, ctx.currentTime);
    
    // Fine-tuned volume envelope for professional bell ring
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05); // metallic chime attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5); // long premium decay
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    
    osc1.stop(ctx.currentTime + 1.6);
    osc2.stop(ctx.currentTime + 1.6);
  } catch (e) {
    console.warn("Web Audio chime playback bypassed or interaction-blocked:", e);
  }
}
