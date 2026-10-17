import React, { useState } from 'react';
import { KANA_DATASET, QUIZ_QUESTIONS, KanaItem } from '../data/kanaData';
import { Volume2, Sparkles, CheckCircle, XCircle, RotateCcw, BookOpen, Award } from 'lucide-react';

interface KanaDojoProps {
    onSpeak: (text: string) => void;
}

export const KanaDojo: React.FC<KanaDojoProps> = ({ onSpeak }) => {
    const [activeTab, setActiveTab] = useState<'practice' | 'quiz'>('practice');
    const [filter, setFilter] = useState<'all' | 'hiragana' | 'katakana' | 'n5_vocab'>('all');
    const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

    // Quiz State
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);

    const filteredItems = KANA_DATASET.filter(item => filter === 'all' || item.type === filter);

    const toggleCard = (id: string) => {
        setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAnswerSelect = (option: string) => {
        if (isAnswerSubmitted) return;
        setSelectedAnswer(option);
    };

    const submitAnswer = () => {
        if (!selectedAnswer || isAnswerSubmitted) return;
        setIsAnswerSubmitted(true);
        const currentQ = QUIZ_QUESTIONS[currentQuestionIdx];
        if (selectedAnswer === currentQ.correctAnswer) {
            setScore(prev => prev + 1);
            onSpeak("正解! Correct! Not bad, Master!");
        } else {
            onSpeak("残念! Wrong answer! Focus more, Master!");
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIdx < QUIZ_QUESTIONS.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswerSubmitted(false);
        } else {
            setQuizCompleted(true);
            onSpeak(`Dojo quiz completed! Score: ${score + (selectedAnswer === QUIZ_QUESTIONS[currentQuestionIdx].correctAnswer ? 1 : 0)} out of ${QUIZ_QUESTIONS.length}`);
        }
    };

    const restartQuiz = () => {
        setCurrentQuestionIdx(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);
        setQuizCompleted(false);
    };

    return (
        <div className="kana-dojo-container">
            <header className="dojo-header">
                <div className="dojo-title-box">
                    <span className="dojo-badge">T.O.R.I.N.E. DOJO</span>
                    <h2>KANADOJO (かな道場)</h2>
                    <p>Master Japanese Characters & N5 Vocabulary with T.O.R.I.N.E.</p>
                </div>

                <div className="dojo-nav-tabs">
                    <button 
                        className={`dojo-tab ${activeTab === 'practice' ? 'active' : ''}`}
                        onClick={() => setActiveTab('practice')}
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>Flashcard Drill</span>
                    </button>
                    <button 
                        className={`dojo-tab ${activeTab === 'quiz' ? 'active' : ''}`}
                        onClick={() => setActiveTab('quiz')}
                    >
                        <Award className="w-4 h-4" />
                        <span>Quiz Challenge</span>
                    </button>
                </div>
            </header>

            {activeTab === 'practice' && (
                <div className="dojo-practice-section">
                    <div className="filter-bar">
                        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
                        <button className={filter === 'hiragana' ? 'active' : ''} onClick={() => setFilter('hiragana')}>Hiragana</button>
                        <button className={filter === 'katakana' ? 'active' : ''} onClick={() => setFilter('katakana')}>Katakana</button>
                        <button className={filter === 'n5_vocab' ? 'active' : ''} onClick={() => setFilter('n5_vocab')}>N5 Vocabulary</button>
                    </div>

                    <div className="dojo-grid">
                        {filteredItems.map((item) => (
                            <div 
                                key={item.id} 
                                className={`dojo-card ${flippedCards[item.id] ? 'flipped' : ''}`}
                                onClick={() => toggleCard(item.id)}
                            >
                                <div className="card-face card-front">
                                    <span className="item-tag">{item.type.toUpperCase()}</span>
                                    <div className="kana-symbol">{item.character}</div>
                                    {item.kanji && <div className="kanji-sub">{item.kanji}</div>}
                                    <div className="romaji-label">{item.romaji}</div>
                                    <button 
                                        className="audio-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSpeak(item.character);
                                        }}
                                        title="Listen Audio"
                                    >
                                        <Volume2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'quiz' && (
                <div className="dojo-quiz-section">
                    {!quizCompleted ? (
                        <div className="quiz-card">
                            <div className="quiz-top">
                                <span>Question {currentQuestionIdx + 1} of {QUIZ_QUESTIONS.length}</span>
                                <span className="score-counter">Score: {score}</span>
                            </div>

                            <h3 className="quiz-question">{QUIZ_QUESTIONS[currentQuestionIdx].question}</h3>

                            <div className="options-grid">
                                {QUIZ_QUESTIONS[currentQuestionIdx].options.map((option, idx) => {
                                    let btnClass = 'quiz-option';
                                    if (selectedAnswer === option) btnClass += ' selected';
                                    if (isAnswerSubmitted) {
                                        if (option === QUIZ_QUESTIONS[currentQuestionIdx].correctAnswer) btnClass += ' correct';
                                        else if (selectedAnswer === option) btnClass += ' wrong';
                                    }

                                    return (
                                        <button 
                                            key={idx}
                                            className={btnClass}
                                            onClick={() => handleAnswerSelect(option)}
                                        >
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>

                            {isAnswerSubmitted && (
                                <div className="explanation-box">
                                    <p>{QUIZ_QUESTIONS[currentQuestionIdx].explanation}</p>
                                </div>
                            )}

                            <div className="quiz-actions">
                                {!isAnswerSubmitted ? (
                                    <button 
                                        className="submit-ans-btn" 
                                        disabled={!selectedAnswer}
                                        onClick={submitAnswer}
                                    >
                                        Submit Answer
                                    </button>
                                ) : (
                                    <button className="next-q-btn" onClick={nextQuestion}>
                                        Next Question
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="quiz-result-card">
                            <Sparkles className="w-12 h-12" style={{ color: 'var(--accent-amber)', margin: '0 auto 1rem' }} />
                            <h2>Quiz Completed!</h2>
                            <p className="score-summary">You scored {score} / {QUIZ_QUESTIONS.length}</p>
                            <p className="torine-comment">
                                {score === QUIZ_QUESTIONS.length 
                                    ? "Perfect score! Impressive work, Master! Keep it up!" 
                                    : "Not bad, but you can do better! Practice in the Flashcard Drill more!"}
                            </p>
                            <button className="restart-btn" onClick={restartQuiz}>
                                <RotateCcw className="w-4 h-4" />
                                <span>Try Again</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
