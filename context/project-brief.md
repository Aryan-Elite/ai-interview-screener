# Project Brief

## Problem chosen
Problem 3: AI Tutor Screener

## What it does
1. Candidate arrives at the site — sees a clean intro screen
2. Reads what to expect (~5 questions, ~10 minutes)
3. Presses "Start Interview"
4. AI asks Question 1
5. Candidate speaks their answer → browser converts speech to text
6. Claude reads the transcript, responds naturally, asks follow-up if needed
7. Repeats for ~5 questions
8. Claude generates a structured assessment report:
   - Score per dimension: clarity, warmth, simplicity, patience, fluency
   - Specific quotes from the candidate as evidence
   - Final recommendation: Move Forward / Hold

## Original Problem Statement (from Cuemath)
Cuemath hires hundreds of tutors every month. Every one goes through screening —
can they communicate clearly? Are they patient? Can they explain simply? Do they have the
right temperament for kids? Right now, human interviewers do 10-minute calls. It's expensive,
slow, and hard to scale.

This is NOT about testing deep math knowledge. It's about the soft stuff:
communication clarity, patience, warmth, ability to simplify, English fluency.

### What the conversation must do
- Feel natural, not robotic
- Listen, respond, adapt based on what the candidate says
- Follow up on vague answers ("Can you tell me more about that?")
- Keep it flowing like a real back-and-forth

### Sample questions
- "Explain fractions to a 9-year-old"
- "A student says they don't understand — they've been staring at the problem for 5 minutes. What do you do?"
- "How do you keep a distracted child engaged?"
- "A parent complains their child isn't improving. How do you respond?"

### Assessment rubric (5 dimensions)
After the conversation, generate a report with score + specific quotes per dimension:
1. Clarity — explains simply and precisely
2. Warmth — encouraging, kind tone
3. Simplicity — breaks down complex ideas for a child
4. Patience — handles confusion or frustration well
5. Fluency — clear and confident English

Overall score: computed in code as average of the 5 dimension scores (not by OpenAI).
Final: recommendation → Move Forward / Hold

### Edge cases to handle
- One-word answers → follow up, ask to elaborate
- Long tangents → gently redirect
- Choppy audio / unclear speech → ask to repeat
- Silence → prompt them to take their time

### Candidate experience
Professional, welcoming, fair. This may be their first interaction with Cuemath.

## Cuemath's Current System (Reference — from screenshots)
This is what Cuemath currently has. Your build should match AND beat this.

### Their Pre-Screening Flow (NOT your responsibility to build)
- Step 1: Eligibility (India resident? Graduate? 24hrs/week?)
- Step 2: Education (Degree + Field of Study)
- Step 3: Grade range (1-5 / 3-8 / 9-12)
- Step 4: Region (US / UK / Asia Pacific / India & Middle East)

### Their Current AI Screening UI
- Pipeline shown: Signup → Application → AI Screening → Math Test → Interview → Shortlisting
- Timer: 6 minutes hard limit
- Single microphone button — "Ready to start" → "Start Call"
- No live transcript visible on screen
- No adaptive follow-ups (just a scripted call)
- Message shown: "Speak clearly and naturally. The AI interviewer will evaluate your English communication skills."

### What They Currently Assess
- Fluency, Pronunciation, Grammar, Vocabulary, Communication

### What the PDF Asks You to Build (More Advanced)
- Clarity, Warmth, Simplicity, Patience, Fluency
- Natural adaptive follow-ups
- Specific quotes as evidence in report

### Guidelines They Show Candidates
- Use laptop/standalone mic in quiet space
- Speak naturally — clarity over speed
- Think of it as a conversation, not a test
- Allow microphone access when prompted

## How Your Build Beats Theirs
| Feature | Cuemath current | Your build |
|---------|----------------|------------|
| Live transcript | Not visible | Shown in real-time |
| Questions | Fixed script | Grade-adaptive + follow-ups |
| Assessment dimensions | 5 basic | 5 richer dimensions + quotes |
| Timer | 6 min hard cutoff | No hard cutoff — if candidate's last response arrives after 5 min, AI closes naturally |
| Report | Unknown | Immediate, structured, with evidence |

## Why this problem
- Solves Cuemath's own hiring pain (they screen hundreds of tutors/month)
- The evaluators are the same people who feel this pain daily
- Voice + AI conversation demo is impressive and differentiated
- No image generation API needed — just Anthropic
- Backend-heavy — plays to Aryan's Node.js/Express strengths