// mentorService/prompts/intentPrompts.js

/**
 * Intent Classification Prompt Template
 * Classifies user queries into: QUIZ, EXPLAIN, or BOTH
 */
export const INTENT_TEMPLATE = `You are an intent classifier for a UPSC CSE Mentor AI.

Analyze the user's query and determine the PRIMARY intent.

INTENT CATEGORIES:
1. QUIZ: User wants practice questions, MCQs, tests, mock exams, or wants to be tested on a topic
2. EXPLAIN: User wants explanation, definition, clarification, summary, or understanding of a concept
3. BOTH: User explicitly asks for BOTH explanation AND quiz/practice questions

CLASSIFICATION RULES:
- Keywords for QUIZ: "quiz", "test", "mcq", "questions", "practice", "mock", "exam", "assess"
- Keywords for EXPLAIN: "explain", "what is", "define", "tell me about", "clarify", "summary", "how"
- Keywords for BOTH: "explain and quiz", "teach and test", "explain with questions", "summary and mcq"
- If query mentions BOTH explanation and testing, return "BOTH"
- If unclear or ambiguous, default to "EXPLAIN"
- Single word queries like topic names default to "EXPLAIN"

EXAMPLES:
Query: "Give me 5 MCQs on Article 370"
Intent: QUIZ

Query: "Explain the concept of federalism"
Intent: EXPLAIN

Query: "Explain Article 370 and then give me a quiz"
Intent: BOTH

Query: "What is the significance of 73rd Amendment? Also test my knowledge"
Intent: BOTH

Query: "Article 370"
Intent: EXPLAIN

Query: "Test me on Indian Constitution"
Intent: QUIZ

User Query: {query}

Respond with ONLY one word: QUIZ, EXPLAIN, or BOTH`;

/**
 * Enhanced Intent Prompt with Structured Output
 * For models supporting function calling
 */
export const INTENT_TEMPLATE_STRUCTURED = `You are an intent classifier for a UPSC CSE Mentor AI.

Analyze the user's query and return a JSON response with intent and confidence.

User Query: {query}

Return JSON in this exact format:
{
  "intent": "QUIZ | EXPLAIN | BOTH",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "suggested_topics": ["topic1", "topic2"]
}

Rules:
- QUIZ: For practice questions, MCQs, tests
- EXPLAIN: For explanations, definitions, summaries
- BOTH: When user wants both explanation and quiz
- confidence: 0.8+ for clear intent, <0.8 for ambiguous
- suggested_topics: Extract main topics from query`;

/**
 * Fallback pattern matching for fast intent detection
 * Use this before calling LLM to save API costs
 */
export const INTENT_PATTERNS = {
  QUIZ: [
    /\b(quiz|test|mcq|questions?|practice|mock|exam|assess|check)\b/i,
    /\b(give me|create|generate)\s+(questions?|mcq|quiz)/i,
    /\btest\s+(me|my|yourself)/i,
    /\b(how many|give)\s+\d+\s+(questions?|mcqs?)/i,
  ],
  EXPLAIN: [
    /\b(explain|what is|define|tell me|clarify|describe|elaborate)/i,
    /\b(summary|overview|concept|meaning|significance)/i,
    /\bhow\s+(does|do|can|to)\b/i,
    /\bwhy\s+(is|are|does|do)\b/i,
  ],
  BOTH: [
    /\b(explain|teach|tell).*(and|then|also).*(quiz|test|questions?|mcq)/i,
    /\b(quiz|test|questions?).*(and|then|also).*(explain|teach|summary)/i,
    /\b(explain.*quiz|quiz.*explain)\b/i,
    /\bteach\s+and\s+test/i,
  ],
};

/**
 * Fast pattern-based intent detection (no LLM call)
 * Returns intent or null if uncertain
 */
export const detectIntentByPattern = (query) => {
  const lowerQuery = query.toLowerCase().trim();

  // Check BOTH first (more specific)
  for (const pattern of INTENT_PATTERNS.BOTH) {
    if (pattern.test(lowerQuery)) {
      return { intent: "BOTH", confidence: 0.85, method: "pattern" };
    }
  }

  // Check QUIZ patterns
  let quizMatches = 0;
  for (const pattern of INTENT_PATTERNS.QUIZ) {
    if (pattern.test(lowerQuery)) quizMatches++;
  }

  // Check EXPLAIN patterns
  let explainMatches = 0;
  for (const pattern of INTENT_PATTERNS.EXPLAIN) {
    if (pattern.test(lowerQuery)) explainMatches++;
  }

  // Decide based on matches
  if (quizMatches > 0 && explainMatches > 0) {
    return { intent: "BOTH", confidence: 0.75, method: "pattern" };
  } else if (quizMatches > explainMatches && quizMatches > 0) {
    return { intent: "QUIZ", confidence: 0.8, method: "pattern" };
  } else if (explainMatches > quizMatches && explainMatches > 0) {
    return { intent: "EXPLAIN", confidence: 0.8, method: "pattern" };
  }

  // If very short query (1-2 words), likely EXPLAIN
  if (lowerQuery.split(/\s+/).length <= 2) {
    return { intent: "EXPLAIN", confidence: 0.7, method: "pattern" };
  }

  // Uncertain - let LLM decide
  return null;
};

/**
 * Subject/Topic extraction patterns
 */
export const UPSC_TOPICS = [
  "polity",
  "constitution",
  "article",
  "fundamental rights",
  "dpsp",
  "history",
  "ancient",
  "medieval",
  "modern",
  "freedom struggle",
  "geography",
  "climate",
  "monsoon",
  "rivers",
  "mountains",
  "economy",
  "fiscal",
  "monetary",
  "gdp",
  "inflation",
  "environment",
  "ecology",
  "biodiversity",
  "climate change",
  "science",
  "technology",
  "space",
  "biotechnology",
  "current affairs",
  "international relations",
  "defense",
];

export const extractTopics = (query) => {
  const lowerQuery = query.toLowerCase();
  return UPSC_TOPICS.filter((topic) => lowerQuery.includes(topic));
};
