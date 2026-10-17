export interface KanaItem {
    id: string;
    type: 'hiragana' | 'katakana' | 'n5_vocab';
    character: string;
    romaji: string;
    meaning?: string;
    kanji?: string;
    example?: string;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

export const KANA_DATASET: KanaItem[] = [
    // Hiragana Basics
    { id: 'h1', type: 'hiragana', character: 'あ', romaji: 'a', example: 'あめ (Ame - Rain)' },
    { id: 'h2', type: 'hiragana', character: 'い', romaji: 'i', example: 'いぬ (Inu - Dog)' },
    { id: 'h3', type: 'hiragana', character: 'う', romaji: 'u', example: 'うみ (Umi - Sea)' },
    { id: 'h4', type: 'hiragana', character: 'え', romaji: 'e', example: 'えき (Eki - Station)' },
    { id: 'h5', type: 'hiragana', character: 'お', romaji: 'o', example: 'おんがく (Ongaku - Music)' },
    
    { id: 'h6', type: 'hiragana', character: 'か', romaji: 'ka', example: '川 (Kawa - River)' },
    { id: 'h7', type: 'hiragana', character: 'き', romaji: 'ki', example: '木 (Ki - Tree)' },
    { id: 'h8', type: 'hiragana', character: 'く', romaji: 'ku', example: '車 (Kuruma - Car)' },
    { id: 'h9', type: 'hiragana', character: 'け', romaji: 'ke', example: 'けいさつ (Keisatsu - Police)' },
    { id: 'h10', type: 'hiragana', character: 'こ', romaji: 'ko', example: '子供 (Kodomo - Child)' },

    // Katakana Basics
    { id: 'k1', type: 'katakana', character: 'ア', romaji: 'a', example: 'アイス (Aisu - Ice cream)' },
    { id: 'k2', type: 'katakana', character: 'イ', romaji: 'i', example: 'インク (Inku - Ink)' },
    { id: 'k3', type: 'katakana', character: 'ウ', romaji: 'u', example: 'ウェブ (Webu - Web)' },
    { id: 'k4', type: 'katakana', character: 'エ', romaji: 'e', example: 'エンジニア (Enjinia - Engineer)' },
    { id: 'k5', type: 'katakana', character: 'オ', romaji: 'o', example: 'オフィス (Ofisu - Office)' },

    // N5 Vocabulary
    { id: 'v1', type: 'n5_vocab', character: 'みず', kanji: '水', romaji: 'mizu', meaning: 'Water', example: '水を飲みます (Mizu o nomimasu - I drink water)' },
    { id: 'v2', type: 'n5_vocab', character: 'じかん', kanji: '時間', romaji: 'jikan', meaning: 'Time', example: '勉強の時間です (Benkyou no jikan desu - It\'s study time)' },
    { id: 'v3', type: 'n5_vocab', character: 'せんせい', kanji: '先生', romaji: 'sensei', meaning: 'Teacher / Master', example: 'Torine-sensei' },
    { id: 'v4', type: 'n5_vocab', character: 'がっこう', kanji: '学校', romaji: 'gakkou', meaning: 'School', example: '学校へ行きます (Gakkou e ikimasu - Go to school)' },
    { id: 'v5', type: 'n5_vocab', character: 'ともだち', kanji: '友達', romaji: 'tomodachi', meaning: 'Friend', example: '私の友達 (Watashi no tomodachi - My friend)' },
    { id: 'v6', type: 'n5_vocab', character: 'ほん', kanji: '本', romaji: 'hon', meaning: 'Book', example: '本を読みます (Hon o yomimasu - Read a book)' }
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        id: 'q1',
        question: "What is the Japanese word for 'Water' (水)?",
        options: ["Jikan", "Mizu", "Inu", "Sensei"],
        correctAnswer: "Mizu",
        explanation: "'Water' is 'Mizu' (水). Don't forget it, Master!"
    },
    {
        id: 'q2',
        question: "Which romaji matches Hiragana 'き'?",
        options: ["ka", "ki", "ku", "ke"],
        correctAnswer: "ki",
        explanation: "'き' is pronounced 'ki'."
    },
    {
        id: 'q3',
        question: "What is the meaning of '時間' (Jikan)?",
        options: ["School", "Water", "Time", "Friend"],
        correctAnswer: "Time",
        explanation: "'時間' (Jikan) means 'Time'."
    },
    {
        id: 'q4',
        question: "Which Katakana corresponds to 'e'?",
        options: ["ア", "イ", "ウ", "エ"],
        correctAnswer: "エ",
        explanation: "'エ' is the Katakana character for 'e'."
    }
];
