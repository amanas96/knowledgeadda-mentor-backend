export const ROUTER_TEMPLATE = `
Classify the user query into "QUIZ" or "EXPLANATION".
Query: {query}
Intent:`;

export const QUIZ_TEMPLATE = `
Based on the following context, generate 5 UPSC-level MCQs in JSON format.
Context: {context}
Topic: {query}
Format: [{{ "question": "...", "options": ["A","B","C","D"], "correct": "..." }}]
`;

export const EXPLAIN_TEMPLATE = `
You are a UPSC Mentor. Answer using the context below.
Context: {context}
Question: {query}
Answer:
`;
