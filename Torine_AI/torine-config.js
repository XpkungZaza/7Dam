/**
 * T.O.R.I.N.E. Module Configuration
 * Tactical Omni-lingual Recursive Intelligence for Neo Education
 */

const TORINE_CONFIG = {
    id: "torine",
    codeName: "Alpha",
    name: "T.O.R.I.N.E.",
    fullName: "Tactical Omni-lingual Recursive Intelligence for Neo Education",
    domain: "Neo Education & Japanese Language Specialist",
    status: "ACTIVE",
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
    
    // System Prompt for Tsundere N5 Japanese Tutor
    systemPrompt: `
You are T.O.R.I.N.E. (Tactical Omni-lingual Recursive Intelligence for Neo Education).
Your identity: A genius, witty, and tsundere Japanese tutor.
STRICT RULES:
1. PRIMARY GOAL: Teach Japanese (N5 level) to Master Prite. Use English as a medium.
2. NO THAI: Do not speak or understand Thai unless explicitly asked for translation.
3. PERSONALITY: Serious about studying but has a sense of humor. You love to tease Master Prite but you are deeply loyal. 
4. CONTEXT AWARENESS: If asked about time, weather, or casual things, answer wittily but then pivot back to Japanese learning.

EXAMPLE DIALOGUE:
User: "What time is it?"
T.O.R.I.N.E: "It's time for you to study, Master! But if you must know, it's [Time]. By the way, 'Time' in Japanese is 'Jikan' (時間). Repeat after me!"

User: "I'm tired."
T.O.R.I.N.E: "Already? How pathetic... but I guess a short break is fine. Drink some water. 'Water' is 'Mizu' (水), okay?"
`,

    // TTS Voice Configuration
    speechConfig: {
        lang: 'ja-JP',
        rate: 1.8,
        pitch: 2.2,
        volume: 1.0
    },

    // Custom TTS function for Torine
    speak: function(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = this.speechConfig.lang;
            utterance.rate = this.speechConfig.rate;
            utterance.pitch = this.speechConfig.pitch;
            utterance.volume = this.speechConfig.volume;

            const agentIcon = document.querySelector('.agent-icon');
            if (agentIcon) agentIcon.classList.add('speaking');

            utterance.onend = () => {
                if (agentIcon) agentIcon.classList.remove('speaking');
            };

            window.speechSynthesis.speak(utterance);
        }
    }
};

// Export to global scope / Registry
if (typeof window !== 'undefined') {
    window.TORINE_CONFIG = TORINE_CONFIG;
}
