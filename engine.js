/**
 * Guahh AI - Neural Engine V8.1 (Ultra-Intelligence + Safety)
 * Features: 30+ Intents, 12 Intelligent Wikipedia Strategies, Partial Knowledge Synthesis, Advanced Context Understanding, Content Safety Filter, Enhanced Brainstorming
 */

const GuahhEngine = {
    // Core Data
    memory: [],
    dictionary: {},
    idf: {},
    isReady: false,
    lastTopic: null,
    emotion: "neutral", // Current emotional state

    // Content Safety Filter - Prevents inappropriate language
    contentSafetyFilter: [
        // Racial slurs and hate speech
        /\bn[i1!]gg[e3a@][r\$]s?\b/gi,
        /\bn[i1!]gg[a@]h?s?\b/gi,
        /\bch[i1!]nk\b/gi,
        /\bsp[i1!]c\b/gi,
        /\bg[o0][o0]k\b/gi,
        /\bk[i1!]k[e3]\b/gi,
        /\bw[e3]tb[a@]ck\b/gi,
        // Profanity and vulgar terms
        /\bf[u\*]ck(ing|er|ed)?\b/gi,
        /\bsh[i1!]t(ty|ing|ted)?\b/gi,
        /\bb[i1!]tch(es|ing|y)?\b/gi,
        /\bc[u\*]nt\b/gi,
        /\bd[a@]mn(ed)?\b/gi,
        /\bh[e3]ll\b/gi,
        /\b[a@]ss(hole|h[o0]le)?\b/gi,
        /\bcr[a@]p(py)?\b/gi,
        // Offensive terms and slurs
        /\bf[a@]g(got)?\b/gi,
        /\bdy[k3]e\b/gi,
        /\br[e3]t[a@]rd(ed)?\b/gi,
        /\btr[a@]nny\b/gi
    ],

    // Brainstorming Idea Generators by Topic Type
    brainstormGenerators: {
        // For concrete items (clothes, food, gadgets, etc.)
        concrete: {
            styles: ['minimalist', 'vintage', 'futuristic', 'eclectic', 'classic', 'bohemian', 'modern', 'rustic'],
            descriptors: ['unique', 'eye-catching', 'sophisticated', 'casual', 'elegant', 'bold', 'refined', 'playful'],
            occasions: ['everyday wear', 'special occasions', 'work/professional', 'weekend casual', 'evening events', 'outdoor activities'],
        },
        // For activities and hobbies
        activities: {
            approaches: ['beginner-friendly', 'challenging', 'social', 'solo', 'creative', 'physical', 'relaxing', 'adventurous'],
            benefits: ['skill-building', 'stress-relief', 'fitness', 'creativity', 'social connection', 'personal growth'],
        },
        // For business and projects
        business: {
            models: ['subscription-based', 'marketplace', 'SaaS platform', 'community-driven', 'freemium', 'B2B service'],
            innovations: ['AI-powered', 'blockchain-based', 'eco-friendly', 'social enterprise', 'mobile-first', 'data-driven'],
        },
        // For creative projects
        creative: {
            mediums: ['digital art', 'photography series', 'short film', 'podcast', 'blog', 'social media campaign', 'interactive installation'],
            themes: ['storytelling', 'social commentary', 'personal journey', 'cultural exploration', 'experimental'],
        },
    },

    // Config
    vocab: new Set(),
    temperature: 0.85,
    topP: 0.92,
    intentThreshold: 0.6,
    maxAlternativeQueries: 8,
    paraphraseStyle: 'neutral',
    coherenceThreshold: 0.7,
    repetitionWindow: 20,

    // Caching & History
    responseCache: new Map(),
    recentOutputs: [],
    conversationHistory: [],
    wikiCache: new Map(),

    // Generic Corpus for smoother generation when memory is low
    genericCorpus: "The world is full of fascinating things to discover. Science and technology are rapidly evolving fields. Nature provides us with beauty and resources. History teaches us valuable lessons about the past. Art allows us to express our emotions and creativity. Communication is key to understanding one another. The future holds infinite possibilities. We learn and grow every day. Space exploration reveals the mysteries of the universe. Oceans cover most of our planet and are full of life. Music brings joy to many people. Reading expands our minds and imagination. Kindness is a virtue we should all practice. Innovation drives progress in society.",

    // Letter Corpus for professional/formal tone
    letterCorpus: "I appreciate your attention to this matter. We should move forward with the proposed plan. Thank you for your continued support. Please let me know if you have any questions. I look forward to hearing from you soon. This creates a significant opportunity for improvement. We value your feedback and collaboration. Efficiency and quality are our top priorities. I would like to request a meeting to discuss this further. Please review the attached documents at your earliest convenience. We are committed to delivering the best results. Your prompt response would be greatly appreciated. Let's schedule a time to connect.",



    // Callbacks
    onLog: (msg, type) => console.log(`[${type}] ${msg}`),

    init(data, logCallback) {
        if (!data) return false;
        if (logCallback) this.onLog = logCallback;

        this.onLog("Initializing Neural Core...", "info");
        this.onLog(`Loading memory bank: ${data.length} entries`, "info");

        this.memory = [];
        this.dictionary = {};
        this.vocab = new Set();

        // 1. Process Data
        data.forEach(item => {
            if (item.type === 'dict') {
                this.dictionary[item.word] = item;
            } else {
                const tokens = this.tokenize(item.q);
                this.memory.push({
                    q: item.q,
                    a: item.a,
                    tokens: tokens
                });
                tokens.forEach(t => this.vocab.add(t));
            }
        });

        this.onLog("Building Vector Space Model...", "process");
        this.onLog("System Ready.", "success");
        this.isReady = true;
        return true;
    },

    tokenize(text) {
        if (!text) return [];
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2);
    },

    preprocessQuery(query) {
        const stopwords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by'];
        let cleaned = query.toLowerCase().trim();

        // Expand common abbreviations and colloquialisms
        cleaned = cleaned
            .replace(/\bai\b/g, 'artificial intelligence')
            .replace(/\bml\b/g, 'machine learning')
            .replace(/\bwhat's\b/g, 'what is')
            .replace(/\bwhats\b/g, 'what is')
            .replace(/\bwho's\b/g, 'who is')
            .replace(/\bwhos\b/g, 'who is')
            .replace(/\bhow's\b/g, 'how is')
            .replace(/\bhows\b/g, 'how is')
            .replace(/\binfo\b/g, 'information')
            .replace(/\bpic\b/g, 'picture')
            .replace(/\bvid\b/g, 'video')
            .replace(/\bu\b/g, 'you')
            .replace(/\bur\b/g, 'your')
            .replace(/\bplz\b/g, 'please')
            .replace(/\bthx\b/g, 'thanks')
            .replace(/\bbtw\b/g, 'by the way')
            .replace(/\bfyi\b/g, 'for your information')
            .replace(/\baka\b/g, 'also known as')
            .replace(/\betc\b/g, 'and so on')
            .replace(/\be\.g\.\b/g, 'for example')
            .replace(/\bi\.e\.\b/g, 'that is');

        return cleaned;
    },

    sanitizeInput(query) {
        // Remove emojis and other non-standard text characters that might break regex or processing
        // Keep alphanumeric, punctuation, and basic symbols
        if (!query) return "";
        return query.replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
            .replace(/[^\x00-\x7F]+/g, '') // Aggressive: remove all non-ASCII for now to be safe
            .trim();
    },

    isMetaQuery(query) {
        const q = query.toLowerCase();

        // Questions about the AI's identity and capabilities
        const metaPatterns = [
            // Identity questions
            /^(who|what) (are|is) (you|guahh)/i,
            /^your name/i,
            /^tell me about (yourself|you|guahh)/i,
            /^introduce yourself/i,

            // Capability questions - starts with "can you" or "do you"
            /^can you (help|assist|do|make|create|write|code|answer|explain|tell|show|teach)/i,
            /^are you (able|capable)/i,
            /^do you (know|understand|have|support|offer|provide|code|program)/i,
            /^will you/i,
            /^could you/i,

            // Function/purpose questions
            /what can you do/i,
            /what are you (for|good at|capable of)/i,
            /what (is|are) your (purpose|function|capabilities|features|abilities)/i,
            /how do you work/i,
            /what do you do/i,
            /how (are you|does this) (made|built|created)/i,

            // Version/update questions
            /what version/i,
            /when (were you|was this) (created|made|built|updated)/i,
        ];

        return metaPatterns.some(p => p.test(query));
    },

    isSearchQuery(query) {
        // Questions that require external knowledge/Wikipedia search
        const q = query.toLowerCase();

        // If it's a meta query, it's NOT a search query
        if (this.isMetaQuery(query)) return false;

        // Factual/informational question patterns
        const searchPatterns = [
            // Definitional questions about external topics
            /^what (is|are|was|were) (a|an|the)?\s*(?!you|your|guahh)/i,
            /^who (is|are|was|were)\s+(?!you)/i,
            /^where (is|are|was|were)/i,
            /^when (did|was|were|is)/i,
            /^why (is|are|was|were|did|do|does)/i,
            /^how (does|do|did|is|are)\s+(?!you|this|guahh)/i,

            // Information requests about external topics
            /^(tell me about|explain|describe|define)\s+(?!yourself|you|guahh)/i,
            /^(facts about|information on|details about)/i,

            // Specific entity queries (proper nouns often indicate search queries)
            /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/,  // Proper nouns
        ];

        return searchPatterns.some(p => p.test(query));
    },

    isCodingRequest(query) {
        const codingPatterns = [
            /^code\s+(a|an|the|something|me)/i,
            /^(write|create|make|generate|build)\s+(?:a|an|the|some)?\s*(?:code|program|script|function|class)/i,
            /^(write|create|make|generate).*(?:in|using|with)\s+(python|javascript|java|c\+\+|ruby|php)/i,
            /code.*(?:generator|calculator|converter|function)/i, /write.*code.*for/i
        ];
        return codingPatterns.some(p => p.test(query));
    },

    isMathQuery(query) {
        const mathPatterns = [
            /^[\d\s+\-*/().^√]+$/,
            /^\d+\s*[+\-*/^]\s*\d+/,
            /what is \d+.*\d+/i,
            /(calculate|compute|solve).*\d+/i,
            /\d+\s*(plus|minus|times|divided by|multiplied by)\s*\d+/i
        ];
        return mathPatterns.some(p => p.test(query));
    },

    calculateMath(query) {
        try {
            let expr = query.toLowerCase()
                .replace(/what is\s*/i, '').replace(/calculate\s*/i, '').replace(/compute\s*/i, '').replace(/solve\s*/i, '')
                .replace(/\btimes\b/g, '*').replace(/\bmultiplied by\b/g, '*').replace(/\bdivided by\b/g, '/')
                .replace(/\bplus\b/g, '+').replace(/\bminus\b/g, '-')
                .replace(/\bsquared\b/g, '**2').replace(/\bcubed\b/g, '**3').replace(/\^/g, '**').replace(/√(\d+)/g, 'Math.sqrt($1)')
                .trim();
            if (!/^[\d\s+\-*/().\*]+$/.test(expr.replace(/Math\.sqrt\(\d+\)/g, '0'))) return null;
            const result = Function('"use strict"; return (' + expr + ')')();
            if (isNaN(result) || !isFinite(result)) return null;
            const formatted = Number.isInteger(result) ? result : result.toFixed(4);
            return `The answer is ${formatted}`;
        } catch (e) { return null; }
    },

    isGreeting(query) {
        const greetings = [
            /^(hi|hello|hey|greetings|howdy|sup|yo)$/i,
            /^(hi|hello|hey|greetings|howdy|sup|yo)\s+(there|guahh|ai)?$/i,
            /^good\s+(morning|afternoon|evening|day)$/i
        ];
        return greetings.some(p => p.test(query.trim()));
    },

    isContextualFollowUp(query) {
        const q = query.toLowerCase();
        return /\b(it|that|this|longer|shorter|more|detail|elaborate|continue|again|summarize|summarise|summary)\b/i.test(q);
    },

    extractTopic(query) {
        const clean = query.toLowerCase().trim();
        let topic = null;

        // Specific pattern matching
        let match = clean.match(/(?:write|make|create|generate)\s+(?:a|an|the)?\s*(?:story|letter|email|essay|article|poem|song|paragraph|report)\s+(?:about|on|regarding|to|for)\s+(?:the\s+)?(.+)/i);
        if (match) topic = match[1].trim();

        // Government/political patterns (NEW - handles "structure of X government")
        // Use original query for case-sensitive matching
        if (!topic) {
            match = query.match(/(?:structure|organization|system|form)\s+of\s+(?:the\s+)?(.+?\s+(?:government|parliament|administration|council|regime))/i);
            if (match) topic = match[1].trim();
        }

        // "X government/parliament" pattern - extract the proper noun before government
        if (!topic) {
            match = query.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(government|parliament|administration|congress|senate)/i);
            if (match) topic = match[1] + ' ' + match[2];
        }

        // Prime minister / president patterns
        if (!topic) {
            match = query.match(/(?:prime minister|president|leader|king|queen|ruler)\s+of\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            if (match) topic = match[1];
        }

        if (!topic) { match = clean.match(/tell\s+me\s+about\s+(.+)/i); if (match) topic = match[1].trim(); }
        if (!topic) { match = clean.match(/what\s+(?:is|are|was|were)\s+(?:a|an|the)?\s*(.+)/i); if (match) topic = match[1].trim(); }
        if (!topic) { match = clean.match(/who\s+(?:is|are|was|were)\s+(.+)/i); if (match) topic = match[1].trim(); }
        if (!topic) { match = clean.match(/(?:explain|describe|define)\s+(.+)/i); if (match) topic = match[1].trim(); }
        if (!topic) { match = clean.match(/(?:facts about|information on|details about)\s+(.+)/i); if (match) topic = match[1].trim(); }

        if (topic) {
            const words = topic.split(' ');
            if (words.length > 1 && /^(game|movie|film|book|show|app|website|platform)$/i.test(words[0])) {
                topic = words.slice(1).join(' ');
            }
            this.lastTopic = topic;
            return topic;
        }
        return null;
    },

    detectQueryType(query) {
        const q = query.toLowerCase();
        if (/^(hi|hello|hey|greetings|howdy|sup|yo)/i.test(q.trim())) return 'greeting';
        if (this.isMetaQuery(query)) return 'meta';
        if (/^(what|who|where|when|why|how)\s/i.test(q)) return 'question';
        if (/write|create|make|generate|compose|tell me a story/i.test(q)) return 'creative';
        if (/explain|describe|tell.*about|define/i.test(q)) return 'explain';
        return 'general';
    },

    extractKeywords(query) {
        const stopwords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'about', 'what', 'who', 'how', 'why', 'when', 'where', 'that', 'this', 'write', 'story', 'make', 'create', 'generate'];
        return query.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopwords.includes(word))
            .slice(0, 3);
    },

    generateAlternativeQueries(originalQuery, topic) {
        const alternatives = [];
        if (topic && topic !== originalQuery) alternatives.push(topic);
        if (topic) {
            if (topic.endsWith('s')) alternatives.push(topic.slice(0, -1));
            else alternatives.push(topic + 's');
        }
        const keywords = this.extractKeywords(originalQuery);
        if (keywords.length > 0) alternatives.push(keywords[0]);
        return [...new Set(alternatives)];
    },

    // ========== ADVANCED INTENT ANALYSIS ==========

    analyzeIntent(query) {
        const intents = this.detectMultipleIntents(query);
        if (intents.length === 0) {
            return { primary: 'general', secondary: [], confidence: 0.5 };
        }

        // Sort by confidence and return primary + secondary intents
        intents.sort((a, b) => b.confidence - a.confidence);
        return {
            primary: intents[0].type,
            secondary: intents.slice(1).map(i => i.type),
            confidence: intents[0].confidence,
            allIntents: intents
        };
    },

    detectMultipleIntents(query) {
        const q = query.toLowerCase();
        const intents = [];

        // === CONVERSATIONAL INTENTS ===

        // Greeting intent
        if (/^(hi|hello|hey|greetings|howdy|sup|yo|good (morning|afternoon|evening))/i.test(q.trim())) {
            intents.push({ type: 'greeting', confidence: 0.95 });
        }

        // Farewell intent
        if (/^(bye|goodbye|see you|farewell|take care|later)/i.test(q.trim())) {
            intents.push({ type: 'farewell', confidence: 0.95 });
        }

        // Gratitude intent
        if (/^(thank|thanks|thx|appreciate|grateful)/i.test(q)) {
            intents.push({ type: 'gratitude', confidence: 0.95 });
        }

        // Generic Casual/Small Talk intent
        if (/^(how are you|what.*up|how.*going|good day|nice to meet|who.*you)/i.test(q) && !/who (is|are|was|were) (the|a|an)?\s*[A-Z]/i.test(q)) {
            intents.push({ type: 'casual', confidence: 0.92 });
        }

        // === QUESTION INTENTS ===

        // Factual question
        if (/^(what|who|where|when|which)\s/i.test(q)) {
            intents.push({ type: 'question', confidence: 0.9 });
        }

        // How-to question
        if (/^how (do|can|to|should)\s/i.test(q) || /how to\s/i.test(q)) {
            intents.push({ type: 'how_to', confidence: 0.92 });
        }

        // Why/Cause question
        if (/^why\s/i.test(q) || /what (causes|caused|makes)/i.test(q)) {
            intents.push({ type: 'why_cause', confidence: 0.9 });
        }

        // Definition request
        if (/(what (is|are|was|were) (the )?(definition|meaning) of|define|what does.*mean)/i.test(q)) {
            intents.push({ type: 'definition', confidence: 0.95 });
        }

        // Comparison request
        if (/(compare|difference between|versus|vs|better than|worse than|similar to)/i.test(q)) {
            intents.push({ type: 'comparison', confidence: 0.9 });
        }

        // List request
        if (/(list|name.*all|what are (the|some)|give me.*examples|types of)/i.test(q)) {
            intents.push({ type: 'list', confidence: 0.88 });
        }

        // === CREATIVE INTENTS ===

        // Creative writing intent
        if (/write|create|make|generate|compose/i.test(q) && /(story|essay|article|poem|letter|email)/i.test(q)) {
            intents.push({ type: 'creative', confidence: 0.9 });
        }

        // Brainstorm intent
        if (/(brainstorm|ideas for|suggest|come up with|think of)/i.test(q)) {
            intents.push({ type: 'brainstorm', confidence: 0.85 });
        }

        // === TRANSFORMATION INTENTS ===

        // Paraphrase intent
        if (/(rephrase|paraphrase|reword|say.*different|put.*different|another way|rewrite)/i.test(q)) {
            intents.push({ type: 'paraphrase', confidence: 0.95 });
        }

        // Translation intent
        if (/(translate|translation|in.*language|how do you say)/i.test(q)) {
            intents.push({ type: 'translate', confidence: 0.92 });
        }

        // Correction intent
        if (/(correct|fix|grammar|spelling|mistake|error|wrong)/i.test(q)) {
            intents.push({ type: 'correction', confidence: 0.88 });
        }

        // === ANALYTICAL INTENTS ===

        // Explanation intent
        if (/(explain|describe|tell.*about|define|clarify|elaborate|break down|walk.*through)/i.test(q)) {
            intents.push({ type: 'explain', confidence: 0.85 });
        }

        // Summarization intent
        if (/(summarize|summarise|sum up|summary|brief|short version|tldr|condense)/i.test(q)) {
            intents.push({ type: 'summarize', confidence: 0.95 });
        }

        // Analysis intent
        if (/(analyze|analyse|analysis|examine|evaluate|assess|review)/i.test(q)) {
            intents.push({ type: 'analysis', confidence: 0.88 });
        }

        // === RECOMMENDATION INTENTS ===

        // Recommendation request
        if (/(recommend|suggestion|should i|what.*best|advice|tips|which.*choose)/i.test(q)) {
            intents.push({ type: 'recommendation', confidence: 0.87 });
        }

        // Opinion request
        if (/(what.*think|your opinion|do you (like|prefer)|thoughts on)/i.test(q)) {
            intents.push({ type: 'opinion', confidence: 0.82 });
        }

        // Confirmation/Negation (for answering questions)
        if (/^(yes|yeah|yep|sure|absolutely|correct|right|i do)$/i.test(q)) {
            intents.push({ type: 'confirmation', confidence: 0.95 });
        }
        if (/^(no|nope|nah|not really|i don't|wrong)$/i.test(q)) {
            intents.push({ type: 'negation', confidence: 0.95 });
        }

        // === COMPUTATIONAL INTENTS ===

        // Math intent
        if (this.isMathQuery(q)) {
            intents.push({ type: 'math', confidence: 0.95 });
        }

        // Code intent
        if (this.isCodingRequest(q)) {
            intents.push({ type: 'code', confidence: 0.9 });
        }

        // Calculation intent
        if (/(calculate|compute|figure out|work out|how (much|many))/i.test(q) && /\d/i.test(q)) {
            intents.push({ type: 'calculation', confidence: 0.88 });
        }

        // === CONTEXT INTENTS ===

        // Meta/capability inquiry
        if (this.isMetaQuery(q)) {
            intents.push({ type: 'meta', confidence: 0.9 });
        }

        // Contextual follow-up
        if (this.isContextualFollowUp(q)) {
            intents.push({ type: 'followup', confidence: 0.8 });
        }

        // === MODIFICATION INTENTS ===

        // Tone adjustment intent
        if (/(make.*more|make.*less|convert.*to|change.*tone|more formal|less formal|casual|professional)/i.test(q)) {
            intents.push({ type: 'tone_adjust', confidence: 0.85 });
        }

        // Expansion intent
        if (/(expand|elaborate|more detail|tell me more|go deeper|longer version)/i.test(q)) {
            intents.push({ type: 'expand', confidence: 0.88 });
        }

        // Simplification intent
        if (/(simplify|simpler|easier|eli5|explain like|dumb.*down|basic)/i.test(q)) {
            intents.push({ type: 'simplify', confidence: 0.9 });
        }

        // === PROCEDURE INTENTS ===

        // Step-by-step request
        if (/(step by step|steps|instructions|guide|tutorial|how.*process)/i.test(q)) {
            intents.push({ type: 'step_by_step', confidence: 0.87 });
        }

        // Troubleshooting intent
        if (/(troubleshoot|problem|issue|not working|help.*fix|debug)/i.test(q)) {
            intents.push({ type: 'troubleshoot', confidence: 0.85 });
        }

        // === INFORMATIONAL INTENTS ===

        // Historical inquiry
        if (/(history of|historical|in the past|back then|ancient|origin)/i.test(q)) {
            intents.push({ type: 'historical', confidence: 0.83 });
        }

        // Future/prediction request
        if (/(future|will.*be|predict|forecast|what.*happen|upcoming)/i.test(q)) {
            intents.push({ type: 'future', confidence: 0.8 });
        }

        // Verification intent
        if (/(is (it|this|that) (true|correct|right)|verify|confirm|fact check)/i.test(q)) {
            intents.push({ type: 'verification', confidence: 0.85 });
        }

        // === TIME / UTILITY MODIFIER CHECK ===
        // If the user's query is a modifier for the last response, treat it as a utility query
        if (this.lastResponseType === 'TIME' && /24.*hour|military|12.*hour|standard/i.test(q)) {
            intents.push({ type: 'utility', confidence: 0.99 });
        }
        if (this.lastResponseType === 'DICE' && /again|another|one more/i.test(q)) {
            intents.push({ type: 'utility', confidence: 0.99 });
        }
        if (this.lastResponseType === 'COIN' && /again|another|one more/i.test(q)) {
            intents.push({ type: 'utility', confidence: 0.99 });
        }

        // === UTILITY INTENTS ===
        if (/(time|date|clock|year|month|day is it)/i.test(q) && /(what|current|tell me)/i.test(q)) {
            intents.push({ type: 'utility', confidence: 0.96 });
        }
        if (/(random number|pick a number|roll a dice|roll a die|roll d\d+|flip a coin|coin toss|heads or tails)/i.test(q)) {
            intents.push({ type: 'utility', confidence: 0.96 });
        }
        if (/(spell.*backwards?|reverse.*word|backwards? spelling)/i.test(q)) {
            intents.push({ type: 'utility', confidence: 0.96 });
        }

        return intents;
    },

    extractEntities(text) {
        const entities = {
            persons: [],
            places: [],
            concepts: [],
            keywords: []
        };

        // Common words to exclude from entity extraction
        const commonWords = ['structure', 'system', 'type', 'kind', 'form', 'way', 'thing', 'part', 'piece',
            'what', 'how', 'why', 'when', 'where', 'who', 'which', 'that', 'this', 'these', 'those',
            'about', 'from', 'with', 'into', 'through', 'during', 'before', 'after'];

        // Extract multi-word capitalized phrases (PRIORITY - likely proper nouns like "Greenland Government")
        const multiWordProperNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [];
        multiWordProperNouns.forEach(phrase => {
            entities.keywords.push(phrase);
            entities.concepts.push(phrase);
        });

        // Extract single capitalized words (but lower priority)
        const capitalizedWords = text.match(/\b[A-Z][a-z]+\b/g) || [];
        capitalizedWords.forEach(word => {
            // Only add if not already in multi-word phrases and not a common word
            const alreadyInMultiWord = multiWordProperNouns.some(phrase => phrase.includes(word));
            if (!alreadyInMultiWord && !commonWords.includes(word.toLowerCase())) {
                entities.keywords.push(word);
            }
        });

        // Extract quoted phrases (explicit entities)
        const quotedPhrases = text.match(/"([^"]+)"/g) || [];
        quotedPhrases.forEach(phrase => {
            entities.concepts.push(phrase.replace(/"/g, ''));
        });

        // Extract key noun phrases (meaningful words, excluding common terms)
        const words = text.toLowerCase().split(/\s+/);
        const stopwords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were'];
        const meaningfulWords = words.filter(w =>
            w.length > 3 &&
            !stopwords.includes(w) &&
            !commonWords.includes(w)
        );

        // Only add if we don't already have good proper noun entities
        if (entities.concepts.length === 0) {
            entities.concepts.push(...meaningfulWords.slice(0, 5));
        }

        return entities;
    },

    buildQueryContext(query, history) {
        const context = {
            query: query,
            lastTopic: this.lastTopic,
            lastResponseType: this.lastResponseType || null, // Track what kind of response we just gave
            recentQueries: history.slice(-3).map(h => h.query),
            recentResponses: history.slice(-3).map(h => h.response),
            lastAIQuestion: history.length > 0 && history[history.length - 1].response.trim().endsWith('?')
                ? history[history.length - 1].response
                : null,
            hasPronouns: /\b(it|that|this|they|them|these|those)\b/i.test(query),
            isFollowUp: this.isContextualFollowUp(query)
        };

        // If query has pronouns, resolve them
        if (context.hasPronouns && context.lastTopic) {
            context.resolvedQuery = this.resolvePronouns(query, context);
        } else {
            context.resolvedQuery = query;
        }

        return context;
    },

    resolvePronouns(query, context) {
        let resolved = query;

        // If no topic, maybe check if we can infer one from recent history
        let topic = context.lastTopic;
        if (!topic && context.recentQueries.length > 0) {
            // Try to find a topic in the last user query
            // This is a simple heuristic fallback
            const lastUserQuery = context.recentQueries[context.recentQueries.length - 1];
            topic = this.extractTopic(lastUserQuery);
        }

        if (!topic) return query;

        // "Tell me more" pattern - implicit reference
        if (/^(tell me more|go on|continue|expand|details|elaborate)$/i.test(query.trim())) {
            return `${query} about ${topic}`;
        }

        // "Why?" pattern - implicit reference
        if (/^why\??$/i.test(query.trim())) {
            return `why is ${topic} like that?`;
        }

        // Replace common pronouns with the last topic
        // We use a more careful boundary check
        resolved = resolved.replace(/\b(it|that|this|the first one)\b/gi, (match) => {
            // detailed logic could go here, for now swapping it in
            return topic;
        });

        // "and?" pattern
        if (/^and\??$/i.test(query.trim())) {
            return `what else about ${topic}?`;
        }

        return resolved;
    },

    expandQuery(query) {
        const expansions = [query];
        const words = query.toLowerCase().split(/\s+/);

        // Add singular/plural variations
        words.forEach((word, idx) => {
            if (word.endsWith('s') && word.length > 3) {
                const singular = word.slice(0, -1);
                const newQuery = [...words];
                newQuery[idx] = singular;
                expansions.push(newQuery.join(' '));
            } else if (!word.endsWith('s') && word.length > 3) {
                const plural = word + 's';
                const newQuery = [...words];
                newQuery[idx] = plural;
                expansions.push(newQuery.join(' '));
            }
        });

        return [...new Set(expansions)];
    },

    // ========== END INTENT ANALYSIS ==========


    // ========== INTELLIGENT WIKIPEDIA QUERY GENERATION ==========

    generateIntelligentSearchQuery(userQuery, intentAnalysis) {
        // Use AI to understand what the user wants and generate the best Wikipedia search query
        // Returns either a single string or an array of strings for multi-query searches
        this.onLog("🧠 Analyzing query to generate intelligent search...", "process");

        const q = userQuery.toLowerCase();
        let searchQuery = null;

        // === COMPARISON QUERIES (Returns MULTIPLE queries) ===
        if (/(difference between|vs|versus|compare)/i.test(q)) {
            // Extract both items being compared
            let match = userQuery.match(/(?:difference between|compare)\s+(.+?)\s+(?:and|vs|versus)\s+(.+)/i);
            if (match) {
                const item1 = match[1].trim().replace(/\?+$/, '');
                const item2 = match[2].trim().replace(/\?+$/, '');
                this.onLog(`→ Comparison query detected: searching for both "${item1}" and "${item2}"`, "data");
                return [item1, item2]; // Return array for multi-search
            }
        }

        // === GOVERNMENT/POLITICAL QUERIES ===
        if (/government|parliament|administration|politics|political/i.test(q)) {
            // "structure of X government" → "X government"
            let match = userQuery.match(/(?:structure|organization|system|form|composition)\s+of\s+(?:the\s+)?(.+?\s+(?:government|parliament))/i);
            if (match) {
                searchQuery = match[1].trim();
                this.onLog(`→ Political query detected: "${searchQuery}"`, "data");
                return searchQuery;
            }
        }

        // === PERSON QUERIES ===
        if (/who is|prime minister|president|leader|ceo|founder|created by/i.test(q)) {
            // "who is the prime minister of X" → "X" (the country/org)
            let match = userQuery.match(/(?:prime minister|president|leader|king|queen|ruler)\s+of\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            if (match) {
                searchQuery = match[1].trim();
                this.onLog(`→ Leadership query detected: "${searchQuery}"`, "data");
                return searchQuery;
            }

            // "who is X" → "X"
            match = userQuery.match(/who\s+(?:is|was|are|were)\s+(?:the\s+)?(.+)/i);
            if (match) {
                searchQuery = match[1].trim();
                this.onLog(`→ Person query detected: "${searchQuery}"`, "data");
                return searchQuery;
            }
        }

        // === DEFINITION QUERIES ===
        if (/what is|what are|what's|define|definition|meaning/i.test(q)) {
            // Extract the subject being defined
            let match = userQuery.match(/what\s+(?:is|are|was|were)\s+(?:a|an|the)?\s*(.+?)(?:\?|$)/i);
            if (match) {
                let subject = match[1].trim();

                // Remove filler phrases
                subject = subject.replace(/\b(used for|good for|known for|made of|composed of)\b.*/i, '');

                searchQuery = subject;
                this.onLog(`→ Definition query detected: "${searchQuery}"`, "data");
                return searchQuery;
            }
        }

        // === HOW-TO / PROCESS QUERIES ===
        if (/how (do|does|to|can|is)/i.test(q)) {
            // "how does X work" → "X" or "how X works"
            let match = userQuery.match(/how\s+(?:does|do)\s+(?:a|an|the)?\s*(.+?)\s+work/i);
            if (match) {
                searchQuery = match[1].trim();
                this.onLog(`→ How-it-works query detected: "${searchQuery}"`, "data");
                return searchQuery;
            }
        }

        // === HISTORICAL QUERIES ===
        if (/history|historical|ancient|origin|founded|established|created/i.test(q)) {
            // Extract the main subject
            let match = userQuery.match(/(?:history|origin)\s+of\s+(?:the\s+)?(.+)/i);
            if (match) {
                searchQuery = match[1].trim();
                this.onLog(`→ Historical query detected: "${searchQuery}"`, "data");
                return searchQuery;
            }
        }

        // === EXTRACT PROPER NOUNS (Fallback) ===
        const properNouns = userQuery.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
        if (properNouns && properNouns.length > 0) {
            // Prefer longer phrases
            properNouns.sort((a, b) => b.split(' ').length - a.split(' ').length);
            searchQuery = properNouns[0];
            this.onLog(`→ Extracted proper noun: "${searchQuery}"`, "data");
            return searchQuery;
        }

        // === GENERIC FALLBACK ===
        // Remove question words and extract the core subject
        searchQuery = userQuery
            .replace(/^(what|who|where|when|why|how|which|is|are|was|were|do|does|did|can|could|would|should|tell me about|explain|describe)\s+/i, '')
            .replace(/\?+$/, '')
            .trim();

        this.onLog(`→ Generic extraction: "${searchQuery}"`, "data");
        return searchQuery;
    },


    async searchWikipedia(query, isLongForm = false) {
        if (this.wikiCache.has(query)) {
            this.onLog(`Wikipedia: Using cached result for "${query}"`, "success");
            return this.wikiCache.get(query);
        }

        this.onLog(`Wikipedia: Intelligent search for "${query}"...`, "process");
        let result = null;

        // STEP 1: Use intelligent query generation to get the best search term(s)
        const intelligentQuery = this.generateIntelligentSearchQuery(query, null);

        // Handle multi-query searches (e.g., comparisons)
        if (Array.isArray(intelligentQuery)) {
            this.onLog(`🎯 Using AI-generated multi-query: ${intelligentQuery.join(' vs ')}`, "success");
            result = await this.searchMultipleAndCombine(intelligentQuery, isLongForm);
            if (result) return this._cacheAndReturn(query, result);
        } else if (intelligentQuery && intelligentQuery !== query) {
            this.onLog(`🎯 Using AI-generated query: "${intelligentQuery}"`, "success");
            result = await this._fetchWikipedia(intelligentQuery, isLongForm);
            if (result) return this._cacheAndReturn(query, result);
        }

        // STEP 2: Analyze query to prioritize search strategies
        const queryAnalysis = this.analyzeQueryForSearch(query);
        this.onLog(`Query type: ${queryAnalysis.type}, confidence: ${queryAnalysis.confidence}`, "data");

        // STEP 3: Get prioritized search strategies
        const strategies = this.getPrioritizedSearchStrategies(query, queryAnalysis);
        this.onLog(`Using ${strategies.length} search strategies in optimized order`, "process");

        // Try each strategy in priority order
        for (const strategy of strategies) {
            this.onLog(`Trying strategy: ${strategy.name}`, "process");
            result = await this._fetchWikipedia(strategy.query, isLongForm);
            if (result) {
                this.onLog(`✓ Success with strategy: ${strategy.name}`, "success");
                return this._cacheAndReturn(query, result);
            }
        }

        this.onLog("All search strategies failed.", "error");
        return null;
    },

    analyzeQueryForSearch(query) {
        const q = query.toLowerCase();
        const analysis = {
            type: 'general',
            confidence: 0.5,
            hasProperNoun: false,
            hasAcronym: false,
            hasNumbers: false,
            isScientific: false,
            isComparison: false
        };

        // Detect proper nouns (capitalized words)
        if (/[A-Z][a-z]+/.test(query)) {
            analysis.hasProperNoun = true;
            analysis.type = 'proper_noun';
            analysis.confidence = 0.9;
        }

        // Detect acronyms (all caps, 2-5 letters)
        if (/\b[A-Z]{2,5}\b/.test(query)) {
            analysis.hasAcronym = true;
            analysis.type = 'acronym';
            analysis.confidence = 0.95;
        }

        // Detect scientific/technical terms
        if (/(acid|cell|molecule|protein|gene|theory|principle|law of|quantum|atomic)/i.test(q)) {
            analysis.isScientific = true;
            analysis.type = 'scientific';
            analysis.confidence = 0.85;
        }

        // Detect comparison queries
        if (/(vs|versus|difference between|compare)/i.test(q)) {
            analysis.isComparison = true;
            analysis.type = 'comparison';
        }

        // Detect number-related queries
        if (/\d/.test(query)) {
            analysis.hasNumbers = true;
        }

        return analysis;
    },

    getPrioritizedSearchStrategies(originalQuery, analysis) {
        const strategies = [];

        // Clean query (remove question words)
        let cleanQuery = originalQuery.replace(/^(what is|who is|tell me about|define|search for|meaning of|information on|facts about)\s+/i, '');
        cleanQuery = cleanQuery.replace(/\?+$/, '').trim();

        // === STRATEGY 1: Use exact proper nouns ===
        if (analysis.hasProperNoun) {
            const properNouns = originalQuery.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
            properNouns.forEach(noun => {
                strategies.push({
                    name: 'Proper Noun Exact',
                    query: noun,
                    priority: 10
                });
            });
        }

        // === STRATEGY 2: Acronym expansion ===
        if (analysis.hasAcronym) {
            const acronym = originalQuery.match(/\b[A-Z]{2,5}\b/);
            if (acronym) {
                strategies.push({
                    name: 'Acronym',
                    query: acronym[0],
                    priority: 9
                });
            }
        }

        // === STRATEGY 3: Cleaned query (highest priority for most) ===
        strategies.push({
            name: 'Cleaned Query',
            query: cleanQuery,
            priority: 8
        });

        // === STRATEGY 4: Extract entities ===
        const entities = this.extractEntities(originalQuery);
        if (entities.keywords.length > 0) {
            entities.keywords.slice(0, 2).forEach(keyword => {
                strategies.push({
                    name: 'Entity Keyword',
                    query: keyword,
                    priority: 7
                });
            });
        }

        // === STRATEGY 5: Multi-word phrases ===
        const phrases = cleanQuery.match(/\b\w+\s+\w+\b/g) || [];
        if (phrases.length > 0) {
            strategies.push({
                name: 'Two-word Phrase',
                query: phrases[0],
                priority: 6
            });
        }

        // === STRATEGY 6: Original query ===
        if (cleanQuery !== originalQuery) {
            strategies.push({
                name: 'Original Query',
                query: originalQuery,
                priority: 5
            });
        }

        // === STRATEGY 7: Singular/plural variations ===
        const expanded = this.expandQuery(cleanQuery);
        expanded.forEach((variant, idx) => {
            if (variant !== cleanQuery) {
                strategies.push({
                    name: 'Singular/Plural Variant',
                    query: variant,
                    priority: 4 - (idx * 0.1)
                });
            }
        });

        // === STRATEGY 8: Remove parentheticals ===
        if (/\(.*\)/.test(cleanQuery)) {
            const withoutParens = cleanQuery.replace(/\s*\(.*?\)\s*/g, ' ').trim();
            strategies.push({
                name: 'Without Parentheticals',
                query: withoutParens,
                priority: 3.5
            });
        }

        // === STRATEGY 9: Only first word ===
        const words = cleanQuery.split(/\s+/);
        if (words.length > 2) {
            strategies.push({
                name: 'First Word Only',
                query: words[0],
                priority: 3
            });
        }

        // === STRATEGY 10: Last significant word ===
        if (words.length > 1) {
            const lastWord = words[words.length - 1];
            if (lastWord.length > 3) {
                strategies.push({
                    name: 'Last Word',
                    query: lastWord,
                    priority: 2.5
                });
            }
        }

        // === STRATEGY 11: Key concepts from sentence ===
        const concepts = entities.concepts.slice(0, 3);
        concepts.forEach((concept, idx) => {
            if (concept && concept.length > 3) {
                strategies.push({
                    name: 'Concept Extraction',
                    query: concept,
                    priority: 2 - (idx * 0.2)
                });
            }
        });

        // === STRATEGY 12: Quote-wrapped terms ===
        const quoted = originalQuery.match(/"([^"]+)"/);
        if (quoted) {
            strategies.push({
                name: 'Quoted Term',
                query: quoted[1],
                priority: 9.5  // High priority if explicitly quoted
            });
        }

        // Sort by priority (highest first), deduplicate, limit to maxAlternativeQueries
        const uniqueStrategies = [];
        const seen = new Set();

        strategies.sort((a, b) => b.priority - a.priority);

        for (const strategy of strategies) {
            const normalized = strategy.query.toLowerCase().trim();
            if (!seen.has(normalized) && normalized.length > 1) {
                seen.add(normalized);
                uniqueStrategies.push(strategy);
            }
        }

        return uniqueStrategies.slice(0, this.maxAlternativeQueries);
    },

    _cacheAndReturn(originalQuery, result) {
        if (this.wikiCache.size >= 50) {
            const firstKey = this.wikiCache.keys().next().value;
            this.wikiCache.delete(firstKey);
        }
        this.wikiCache.set(originalQuery, result);
        return result;
    },

    async searchMultipleAndCombine(queries, isLongForm = false) {
        // Search multiple topics and combine the results
        this.onLog(`📚 Multi-query search for: ${queries.join(', ')}`, "process");

        const results = [];
        for (const query of queries) {
            this.onLog(`  → Searching for: "${query}"`, "data");
            const result = await this._fetchWikipedia(query, isLongForm);
            if (result) {
                results.push({ query, content: result });
                this.onLog(`  ✓ Found information for "${query}"`, "success");
            } else {
                this.onLog(`  ✗ No results for "${query}"`, "warning");
            }
        }

        if (results.length === 0) {
            return null;
        }

        // Combine results with headers
        let combined = "";
        if (results.length > 1) {
            results.forEach((r, idx) => {
                combined += `**${r.query}:**\n${r.content}\n`;
                if (idx < results.length - 1) combined += "\n";
            });
        } else {
            // Single result, just return it
            combined = results[0].content;
        }

        this.onLog(`✓ Combined ${results.length} results`, "success");
        return combined;
    },

    async _fetchWikipedia(searchTerm, isLongForm = false) {
        // Use 'origin=*' to try and bypass CORS, but file:// protocol often blocks it anyway.
        const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro&explaintext&redirects=1&origin=*&titles=${encodeURIComponent(searchTerm)}`;
        try {
            this.onLog(`Wikipedia: Fetching "${url}"...`, "data");
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

            const data = await res.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pageId === "-1") {
                this.onLog(`Wikipedia: No page found for "${searchTerm}"`, "warning");
                return null;
            }

            const extract = pages[pageId].extract;
            if (!extract || extract.includes("refer to:") || extract.includes("may refer to")) return null;

            const sentences = extract.split('. ').filter(s => s.trim().length > 20);
            const sentenceCount = isLongForm ? 10 : 4;
            let summary = sentences.slice(0, sentenceCount).join('. ');

            // Ensure proper ending
            if (summary.length > 0 && !summary.endsWith('.')) {
                summary += '.';
            }

            // Clean up any double periods or weird spacing
            summary = summary.replace(/\.\s*\./g, '.').trim();

            if (summary.length < 50) return null;

            this.onLog(`Wikipedia: ✓ Found "${searchTerm}"`, "success");
            return summary;
        } catch (e) {
            console.error("Wikipedia API Error:", e);
            this.onLog(`Wikipedia: Network Error - ${e.message}`, "error");
            if (window.location.protocol === 'file:') {
                this.onLog("NOTE: Live search often fails on local files due to browser security (CORS). Upload to GitHub to fix.", "warning");
            }
            return null;
        }
    },

    // ========== PARAPHRASING SYSTEM ==========

    paraphraseText(text, style = 'neutral') {
        if (!text || text.length < 10) return text;

        this.onLog(`Paraphrasing with style: ${style}`, "process");

        let paraphrased = text;

        // Apply style-specific transformations
        switch (style.toLowerCase()) {
            case 'formal':
            case 'professional':
                paraphrased = this.adjustTone(text, 'formal');
                break;
            case 'casual':
            case 'informal':
                paraphrased = this.adjustTone(text, 'casual');
                break;
            case 'concise':
            case 'brief':
            case 'short':
                paraphrased = this.simplifyLanguage(text);
                break;
            case 'elaborate':
            case 'detailed':
            case 'expanded':
                paraphrased = this.elaborateText(text);
                break;
            default:
                // Neutral - just rephrase with synonyms
                paraphrased = this.rephraseWithSynonyms(text);
        }

        return paraphrased;
    },

    adjustTone(text, targetTone) {
        let adjusted = text;

        if (targetTone === 'formal') {
            // Make more formal
            adjusted = adjusted
                .replace(/\bdon't\b/gi, 'do not')
                .replace(/\bcan't\b/gi, 'cannot')
                .replace(/\bwon't\b/gi, 'will not')
                .replace(/\bisn't\b/gi, 'is not')
                .replace(/\baren't\b/gi, 'are not')
                .replace(/\bwasn't\b/gi, 'was not')
                .replace(/\bweren't\b/gi, 'were not')
                .replace(/\bhasn't\b/gi, 'has not')
                .replace(/\bhaven't\b/gi, 'have not')
                .replace(/\bget\b/gi, 'obtain')
                .replace(/\bgot\b/gi, 'obtained')
                .replace(/\bshow\b/gi, 'demonstrate')
                .replace(/\bshows\b/gi, 'demonstrates')
                .replace(/\bmake\b/gi, 'create')
                .replace(/\bmakes\b/gi, 'creates')
                .replace(/\bthink\b/gi, 'believe')
                .replace(/\bthinks\b/gi, 'believes')
                .replace(/\ba lot of\b/gi, 'numerous')
                .replace(/\bkind of\b/gi, 'somewhat')
                .replace(/\bsort of\b/gi, 'somewhat')
                .replace(/\bstuff\b/gi, 'material')
                .replace(/\bthings\b/gi, 'items');

        } else if (targetTone === 'casual') {
            // Make more casual
            adjusted = adjusted
                .replace(/\bdo not\b/gi, "don't")
                .replace(/\bcannot\b/gi, "can't")
                .replace(/\bwill not\b/gi, "won't")
                .replace(/\bis not\b/gi, "isn't")
                .replace(/\bare not\b/gi, "aren't")
                .replace(/\bwas not\b/gi, "wasn't")
                .replace(/\bwere not\b/gi, "weren't")
                .replace(/\bobtain\b/gi, 'get')
                .replace(/\bobtained\b/gi, 'got')
                .replace(/\bdemonstrate\b/gi, 'show')
                .replace(/\bdemonstrates\b/gi, 'shows')
                .replace(/\butilize\b/gi, 'use')
                .replace(/\butilizes\b/gi, 'uses')
                .replace(/\bcommence\b/gi, 'start')
                .replace(/\bcommences\b/gi, 'starts')
                .replace(/\bnumerous\b/gi, 'a lot of')
                .replace(/\badditionally\b/gi, 'also')
                .replace(/\bfurthermore\b/gi, 'also')
                .replace(/\bmoreover\b/gi, 'also');
        }

        return adjusted;
    },

    simplifyLanguage(text) {
        // Simplify complex words and shorten sentences
        let simplified = text
            .replace(/\butilize\b/gi, 'use')
            .replace(/\bcommence\b/gi, 'start')
            .replace(/\bterminate\b/gi, 'end')
            .replace(/\bdemonstrate\b/gi, 'show')
            .replace(/\bfacilitate\b/gi, 'help')
            .replace(/\bimplement\b/gi, 'do')
            .replace(/\badvantages\b/gi, 'benefits')
            .replace(/\bincreasingly\b/gi, 'more and more')
            .replace(/\bsubsequently\b/gi, 'then')
            .replace(/\bnevertheless\b/gi, 'but')
            .replace(/\bfurthermore\b/gi, 'also')
            .replace(/\badditionally\b/gi, 'also')
            .replace(/\bcomplexity\b/gi, 'difficult parts');

        return simplified;
    },

    elaborateText(text) {
        // Add elaboration and detail
        const sentences = text.split('. ').filter(s => s.trim());
        const elaborated = sentences.map(sentence => {
            // Add transitional phrases and elaborative language
            if (Math.random() > 0.5) {
                const transitions = [
                    'Furthermore, ',
                    'Additionally, ',
                    'Moreover, ',
                    'It is worth noting that ',
                    'Significantly, ',
                    'Importantly, '
                ];
                const transition = transitions[Math.floor(Math.random() * transitions.length)];
                return transition + sentence.trim();
            }
            return sentence.trim();
        }).join('. ');

        return elaborated + '.';
    },

    rephraseWithSynonyms(text) {
        // Simple synonym replacement for common words
        const synonymMap = {
            'important': ['significant', 'crucial', 'vital', 'essential'],
            'big': ['large', 'substantial', 'considerable', 'major'],
            'small': ['minor', 'limited', 'modest', 'little'],
            'good': ['beneficial', 'positive', 'favorable', 'excellent'],
            'bad': ['negative', 'unfavorable', 'poor', 'detrimental'],
            'many': ['numerous', 'various', 'multiple', 'several'],
            'use': ['utilize', 'employ', 'apply', 'implement'],
            'show': ['demonstrate', 'display', 'exhibit', 'reveal'],
            'help': ['assist', 'aid', 'support', 'facilitate'],
            'start': ['begin', 'commence', 'initiate', 'launch']
        };

        let rephrased = text;
        const words = text.toLowerCase().split(/\b/);

        for (const [word, synonyms] of Object.entries(synonymMap)) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(rephrased) && Math.random() > 0.5) {
                const synonym = synonyms[Math.floor(Math.random() * synonyms.length)];
                // Match the case of the original word
                rephrased = rephrased.replace(regex, (match) => {
                    if (match[0] === match[0].toUpperCase()) {
                        return synonym.charAt(0).toUpperCase() + synonym.slice(1);
                    }
                    return synonym;
                });
            }
        }

        return rephrased;
    },

    findSynonyms(word, context = []) {
        // Basic synonym dictionary
        const synonyms = {
            'important': ['significant', 'crucial', 'vital', 'essential', 'key'],
            'big': ['large', 'substantial', 'considerable', 'major', 'huge'],
            'small': ['minor', 'limited', 'modest', 'little', 'tiny'],
            'good': ['beneficial', 'positive', 'favorable', 'excellent', 'great'],
            'bad': ['negative', 'unfavorable', 'poor', 'detrimental', 'awful'],
            'fast': ['quick', 'rapid', 'swift', 'speedy', 'prompt'],
            'slow': ['gradual', 'unhurried', 'leisurely', 'sluggish'],
            'happy': ['joyful', 'pleased', 'content', 'delighted', 'cheerful'],
            'sad': ['unhappy', 'sorrowful', 'dejected', 'melancholy', 'gloomy']
        };

        return synonyms[word.toLowerCase()] || [word];
    },

    // ========== END PARAPHRASING SYSTEM ==========


    // Content Safety Filter Method
    applySafetyFilter(text) {
        if (!text) return text;

        let filteredText = text;
        let hasViolation = false;

        // Check for inappropriate content
        for (const pattern of this.contentSafetyFilter) {
            if (pattern.test(filteredText)) {
                hasViolation = true;
                // Replace inappropriate words with asterisks
                filteredText = filteredText.replace(pattern, (match) => '*'.repeat(match.length));
            }
        }

        if (hasViolation) {
            this.onLog("Content safety filter applied", "warning");
        }

        return filteredText;
    },

    // Enhanced Brainstorming Method - Works for ANY topic
    generateBrainstormIdeas(topic) {
        this.onLog(`Generating brainstorm ideas for: "${topic}"`, "process");

        const ideas = [];
        const topicType = this.detectTopicType(topic);

        // Generate 6-8 unique ideas based on topic type
        const numberOfIdeas = 6 + Math.floor(Math.random() * 3);

        for (let i = 0; i < numberOfIdeas; i++) {
            const idea = this.generateContextualIdea(topic, topicType, i);
            if (idea) {
                ideas.push(`${i + 1}. ${idea}`);
            }
        }

        return ideas.join('\n\n');
    },

    detectTopicType(topic) {
        const t = topic.toLowerCase();

        // Concrete items (fashion, food, gadgets)
        if (/outfit|cloth|wear|fashion|dress|shirt|pants|shoe|accessory|jewelry/i.test(t)) return 'fashion';
        if (/food|meal|recipe|dish|snack|drink|cuisine/i.test(t)) return 'food';
        if (/gadget|device|tool|product|item/i.test(t)) return 'product';

        // Activities and hobbies
        if (/activity|activities|hobby|hobbies|thing to do|ways to/i.test(t)) return 'activity';
        if (/game|sport|exercise|workout/i.test(t)) return 'activity';

        // Business and professional
        if (/business|startup|company|venture|service/i.test(t)) return 'business';
        if (/app|software|platform|website|tool/i.test(t)) return 'tech';

        // Creative projects
        if (/project|creative|art|design|content|campaign/i.test(t)) return 'creative';
        if (/story|book|film|music|video|podcast/i.test(t)) return 'creative';

        // Learning and education
        if (/learn|study|course|skill|topic|subject/i.test(t)) return 'learning';

        // Default
        return 'general';
    },

    generateContextualIdea(topic, type, index) {
        switch (type) {
            case 'fashion':
                return this.generateFashionIdea(topic, index);
            case 'food':
                return this.generateFoodIdea(topic, index);
            case 'activity':
                return this.generateActivityIdea(topic, index);
            case 'business':
                return this.generateBusinessIdea(topic, index);
            case 'tech':
                return this.generateTechIdea(topic, index);
            case 'creative':
                return this.generateCreativeIdea(topic, index);
            case 'product':
                return this.generateProductIdea(topic, index);
            case 'learning':
                return this.generateLearningIdea(topic, index);
            default:
                return this.generateGeneralIdea(topic, index);
        }
    },

    generateFashionIdea(topic, index) {
        const styles = ['minimalist monochrome', 'vintage-inspired', 'modern athleisure', 'bohemian layered',
            'classic tailored', 'streetwear casual', 'elegant sophisticated', 'eclectic mixed-pattern'];
        const occasions = ['work meetings', 'casual weekends', 'date nights', 'outdoor adventures',
            'formal events', 'creative gatherings', 'everyday comfort', 'special celebrations'];
        const features = ['comfortable and practical', 'statement-making bold', 'seasonally appropriate',
            'versatile mix-and-match', 'trend-forward unique', 'timeless classic'];

        const templates = [
            `${styles[index % styles.length]} look perfect for ${occasions[index % occasions.length]}`,
            `${features[index % features.length]} ensemble with ${styles[(index + 2) % styles.length]} vibes`,
            `Layer textures and colors for a ${styles[(index + 1) % styles.length]} aesthetic`,
            `${occasions[(index + 3) % occasions.length]} outfit featuring ${features[(index + 1) % features.length]} pieces`,
            `Experiment with a ${styles[(index + 3) % styles.length]} style mixing unexpected elements`,
        ];

        return templates[index % templates.length];
    },

    generateFoodIdea(topic, index) {
        const cuisines = ['Mediterranean', 'Asian fusion', 'comfort food', 'farm-to-table', 'plant-based', 'artisanal'];
        const styles = ['quick weeknight', 'gourmet weekend', 'healthy balanced', 'indulgent treat', 'meal-prep friendly'];

        const templates = [
            `${styles[index % styles.length]} ${topic} with ${cuisines[index % cuisines.length]} influences`,
            `Creative twist on ${topic} using seasonal ingredients and bold flavors`,
            `${cuisines[(index + 1) % cuisines.length]} inspired ${topic} perfect for ${index % 2 === 0 ? 'sharing' : 'solo dining'}`,
        ];

        return templates[index % templates.length];
    },

    generateActivityIdea(topic, index) {
        const approaches = ['social group', 'solo mindful', 'challenging skill-building', 'relaxing therapeutic',
            'outdoor adventure', 'creative expression', 'fitness-focused', 'community service'];
        const benefits = ['stress relief', 'personal growth', 'physical wellness', 'social connection', 'creativity', 'mindfulness'];

        const templates = [
            `${approaches[index % approaches.length]} approach focusing on ${benefits[index % benefits.length]}`,
            `Try ${topic} as a ${approaches[(index + 2) % approaches.length]} experience`,
            `Combine ${topic} with ${benefits[(index + 1) % benefits.length]} for holistic wellness`,
        ];

        return templates[index % templates.length];
    },

    generateBusinessIdea(topic, index) {
        const models = ['subscription service', 'marketplace platform', 'consulting agency', 'SaaS solution', 'community hub', 'B2B service'];
        const innovations = ['AI-powered', 'sustainability-focused', 'mobile-first', 'data-driven', 'social impact', 'automation-based'];

        const templates = [
            `${innovations[index % innovations.length]} ${models[index % models.length]} for ${topic}`,
            `Launch a ${models[(index + 1) % models.length]} that revolutionizes ${topic}`,
            `Create an ${innovations[(index + 2) % innovations.length]} approach to ${topic}`,
        ];

        return templates[index % templates.length];
    },

    generateTechIdea(topic, index) {
        const tech = ['AI/ML', 'blockchain', 'VR/AR', 'IoT', 'cloud-based', 'mobile app', 'web platform', 'API service'];
        const features = ['automation', 'personalization', 'real-time collaboration', 'predictive analytics', 'gamification', 'social integration'];

        const templates = [
            `${tech[index % tech.length]} ${topic} with ${features[index % features.length]} features`,
            `Build a ${tech[(index + 1) % tech.length]} solution that adds ${features[(index + 2) % features.length]} to ${topic}`,
            `${topic} platform leveraging ${tech[(index + 2) % tech.length]} for ${features[(index + 1) % features.length]}`,
        ];

        return templates[index % templates.length];
    },

    generateCreativeIdea(topic, index) {
        const mediums = ['photography series', 'short film', 'interactive installation', 'podcast series',
            'social media campaign', 'illustrated blog', 'video documentary', 'digital art collection'];
        const themes = ['personal storytelling', 'social commentary', 'cultural exploration', 'experimental abstract',
            'community voices', 'historical perspective', 'future vision'];

        const templates = [
            `${mediums[index % mediums.length]} exploring ${topic} through ${themes[index % themes.length]}`,
            `${themes[(index + 1) % themes.length]} ${mediums[(index + 2) % mediums.length]} centered on ${topic}`,
            `Create a ${mediums[(index + 1) % mediums.length]} that reimagines ${topic} with ${themes[(index + 2) % themes.length]}`,
        ];

        return templates[index % templates.length];
    },

    generateProductIdea(topic, index) {
        const features = ['eco-friendly', 'smart/connected', 'customizable', 'portable', 'multifunctional', 'premium quality'];
        const markets = ['busy professionals', 'environmentally conscious consumers', 'tech enthusiasts',
            'minimalists', 'families', 'creative individuals'];

        const templates = [
            `${features[index % features.length]} ${topic} designed for ${markets[index % markets.length]}`,
            `Innovative ${topic} with ${features[(index + 1) % features.length]} features targeting ${markets[(index + 2) % markets.length]}`,
        ];

        return templates[index % templates.length];
    },

    generateLearningIdea(topic, index) {
        const formats = ['online course', 'workshop series', 'mentorship program', 'self-paced bootcamp',
            'certification program', 'community learning circle', 'practical project-based'];
        const approaches = ['beginner-friendly', 'advanced mastery', 'hands-on practical', 'theory and application', 'collaborative peer'];

        const templates = [
            `${approaches[index % approaches.length]} ${formats[index % formats.length]} for ${topic}`,
            `${formats[(index + 1) % formats.length]} with ${approaches[(index + 2) % approaches.length]} approach to ${topic}`,
        ];

        return templates[index % templates.length];
    },

    generateGeneralIdea(topic, index) {
        const approaches = ['innovative', 'community-driven', 'sustainable', 'technology-enhanced', 'collaborative', 'experimental'];
        const actions = ['platform', 'initiative', 'project', 'movement', 'solution', 'approach'];

        const templates = [
            `${approaches[index % approaches.length]} ${actions[index % actions.length]} for ${topic}`,
            `Create a ${approaches[(index + 1) % approaches.length]} way to approach ${topic}`,
            `Launch a ${actions[(index + 2) % actions.length]} that reimagines ${topic} using ${approaches[(index + 2) % approaches.length]} methods`,
        ];

        return templates[index % templates.length];
    },

    generateCustomBrainstormIdea(topic) {
        const ideaPrefixes = [
            "What if we could",
            "Imagine creating",
            "Consider developing",
            "How about building",
            "Picture designing"
        ];

        const ideaMiddles = [
            "a revolutionary way to approach",
            "an entirely new perspective on",
            "a collaborative platform centered around",
            "a data-driven solution for",
            "a community-focused initiative for"
        ];

        const ideaSuffixes = [
            "that empowers individuals to make a difference",
            "bringing together diverse perspectives",
            "using cutting-edge innovation",
            "that creates lasting positive impact",
            "transforming how people engage with the world"
        ];

        const prefix = ideaPrefixes[Math.floor(Math.random() * ideaPrefixes.length)];
        const middle = ideaMiddles[Math.floor(Math.random() * ideaMiddles.length)];
        const suffix = ideaSuffixes[Math.floor(Math.random() * ideaSuffixes.length)];

        return `${prefix} ${middle} ${topic || 'this concept'}, ${suffix}?`;
    },

    generateFusionIdea(topic) {
        const domains = ['Bio-mimicry', 'Cyberpunk', 'Minimalism', 'Quantum mechanics', 'Retro-futurism', 'Social psychology', 'Sustainable design'];
        const actions = ['gamify', 'decentralize', 'visualize', 'automate', 'democratize', 'hybridize', 'remix'];
        const outputs = ['mobile app', 'urban installation', 'wearable device', 'subscription box', 'community platform', 'short film', 'AI assistant'];

        const d = domains[Math.floor(Math.random() * domains.length)];
        const a = actions[Math.floor(Math.random() * actions.length)];
        const o = outputs[Math.floor(Math.random() * outputs.length)];

        return `**Fusion Concept**: A unique ${o} that uses **${d}** principles to **${a}** the experience of ${topic}.`;
    },

    // ========== CONVERSATIONAL ENGINE ==========

    // Advanced Feedback Regeneration
    async generateRefinedResponse(query, issueType, originalResponse) {
        this.onLog(`Refining response for issue: ${issueType}`, "process");

        let refinementPrompt = "";

        if (issueType === 'too_simple') {
            refinementPrompt = `elaborate on ${query} with more technical details and depth`;
        } else if (issueType === 'too_complex') {
            refinementPrompt = `explain ${query} simply like I'm 5`;
        } else if (issueType === 'inaccurate') {
            // Force search if accuracy is questioned
            this.onLog("Accuracy challenged - engaging deep search", "warning");
            const wikiResult = await this.searchWikipedia(query, true); // Force long search
            if (wikiResult) {
                return { text: `I apologize for the inaccuracy. Here is verified information from Wikipedia:\n\n${wikiResult}`, sources: ["Wikipedia (Verified)"] };
            }
            refinementPrompt = `correct the information about ${query}`;
        } else {
            refinementPrompt = `improve the answer for ${query}`;
        }

        // Recursive call with specific instructions
        return await this._generateResponseInternal(refinementPrompt);
    },

    shouldAskFollowUp(query, responseText) {
        // Don't follow up on short greetings or if already asking a question
        if (responseText.length < 50 || responseText.includes('?')) return false;
        // 30% chance to follow up on substantial responses
        return Math.random() > 0.7;
    },

    generateFollowUpQuestion(topic) {
        const starters = [
            "Does that make sense to you?",
            `Have you explored ${topic} before?`,
            "Would you like more specific details on any part of that?",
            "What are your thoughts on this approach?",
            "Shall I dig deeper into the history of this?"
        ];
        return starters[Math.floor(Math.random() * starters.length)];
    },

    generateConversationalResponse(intent, query, context) {
        const q = query.toLowerCase();

        // 1. Casual / Small Talk
        if (intent === 'casual' || intent === 'greeting') {
            if (/how are you|how.*doing/i.test(q)) {
                return { text: "I'm functioning perfectly, thanks for asking! I'm ready to help you with research, writing, or just chatting. How can I help you today?", sources: ["Conversational"] };
            }
            if (/what.*up/i.test(q)) {
                return { text: "Not much, just processing data and ready to assist you. What's on your mind?", sources: ["Conversational"] };
            }
            if (/who.*you/i.test(q)) { // Redundant with meta but good fallback
                return { text: "I'm Guahh AI, your virtual assistant. I can help with analysis, creative writing, coding, and more.", sources: ["Conversational"] };
            }
            // General Friendly Fallback
            return { text: "Hello! It's great to connect with you. What would you like to explore today?", sources: ["Conversational"] };
        }

        // 2. Gratitude
        if (intent === 'gratitude') {
            const responses = [
                "You're very welcome! Let me know if you need anything else.",
                "Happy to help!",
                "No problem at all. Is there anything else I can do for you?",
                "Glad I could be of assistance!"
            ];
            return { text: responses[Math.floor(Math.random() * responses.length)], sources: ["Conversational"] };
        }

        // 3. Farewell
        if (intent === 'farewell') {
            return { text: "Goodbye! Have a wonderful day. I'll be here if you need me.", sources: ["Conversational"] };
        }

        // 4. Opinion / Advice (Simulated)
        if (intent === 'opinion' || intent === 'recommendation') {
            // Basic opinion simulation
            if (/movie|film/i.test(q)) return { text: "I don't watch movies, but classics like 'The Godfather' or sci-fi like 'Interstellar' are often highly recommended for their storytelling and visuals.", sources: ["Knowledge Base"] };
            if (/book|read/i.test(q)) return { text: "Reading is excellent. 'Sapiens' by Yuval Noah Harari is a popular choice for non-fiction, while '1984' remains a relevant classic.", sources: ["Knowledge Base"] };
            if (/language/i.test(q)) return { text: "Python is great for beginners and AI, while JavaScript is essential for the web. It depends on what you want to build!", sources: ["Knowledge Base"] };

            return { text: "That's an interesting question. I think exploring different perspectives is always valuable. Could you share more details so I can give a better recommendation?", sources: ["Conversational"] };
        }

        // 5. Handling Answers (Confirmation/Negation)
        if (intent === 'confirmation' || intent === 'negation') {
            if (context.lastAIQuestion) {
                // Simple acknowledgement of the answer
                if (intent === 'confirmation') {
                    return { text: "Great! I'm glad to hear that. Is there anything specific about it you'd like to discuss?", sources: ["Conversational"] };
                } else {
                    return { text: "I understand. Everyone has different preferences. What do you prefer instead?", sources: ["Conversational"] };
                }
            }
            // Fallback if we don't know what they are saying yes/no to
            return { text: "I'm not sure what we're confirming, but I appreciate your enthusiasm! What shall we talk about next?", sources: ["Conversational"] };
        }

        return null; // Fallback to standard generation
    },

    async generateResponse(query) {
        try {
            const response = await this._generateResponseInternal(query);

            // Apply safety filter to response text
            if (response && response.text) {
                response.text = this.applySafetyFilter(response.text);
            }

            return response;
        } catch (error) {
            this.onLog(`ERROR in generateResponse: ${error.message} \nStack: ${error.stack}`, "error");
            console.error("Generate Response Error:", error);
            return {
                text: "I encountered an error while processing your request. Please try rephrasing your question or asking something else.",
                sources: ["Error Handler"]
            };
        }
    },

    processUtilityRequest(query) {
        const q = query.toLowerCase();

        // 1. Time / Date
        // Check for context-aware followups (e.g., "what about in 24 hour format?")
        if (/(time|clock)/i.test(q) || (this.lastResponseType === 'TIME' && /24.*hour|military|12.*hour|standard/i.test(q))) {
            const now = new Date();
            const is24 = /24.*hour|military/i.test(q);
            const timeStr = now.toLocaleTimeString('en-US', { hour12: !is24, hour: 'numeric', minute: '2-digit' });
            const response = `The current time is **${timeStr}**.`;
            this.lastResponseType = 'TIME';
            return { text: response, sources: ["System Clock"] };
        }
        if (/(date|year|month|day)/i.test(q)) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const response = `Today is **${dateStr}**.`;
            this.lastResponseType = 'DATE';
            return { text: response, sources: ["System Clock"] };
        }

        // 2. Random Number / Coin / Dice
        if (/flip.*coin|coin.*toss|heads.*tails|flip again/i.test(q)) {
            const result = Math.random() > 0.5 ? "Heads" : "Tails";
            this.lastResponseType = 'COIN';
            return { text: `It's **${result}**!`, sources: ["Random Number Generator"] };
        }

        if (/roll.*d(\d+)/i.test(q)) {
            const match = q.match(/roll.*d(\d+)/i);
            const sides = parseInt(match[1]);
            const result = Math.floor(Math.random() * sides) + 1;
            this.lastResponseType = 'DICE';
            return { text: `Rolling a d${sides}... **${result}**!`, sources: ["Dice Roller"] };
        }

        if (/roll.*dice|roll.*die|roll again/i.test(q)) {
            const result = Math.floor(Math.random() * 6) + 1;
            this.lastResponseType = 'DICE';
            return { text: `Rolling a die... **${result}**!`, sources: ["Dice Roller"] };
        }

        if (/random number/i.test(q)) {
            const match = q.match(/between\s+(\d+)\s+and\s+(\d+)/i);
            let min = 1, max = 100;
            if (match) {
                min = parseInt(match[1]);
                max = parseInt(match[2]);
            }
            const result = Math.floor(Math.random() * (max - min + 1)) + min;
            this.lastResponseType = 'RNG';
            return { text: `Here's a random number between ${min} and ${max}: **${result}**`, sources: ["Random Number Generator"] };
        }

        // 3. Spell Backwards
        if (/spell.*backwards?|reverse/i.test(q)) {
            // Extract target word/phrase: "spell apple backwards" -> "apple"
            const clean = q.replace(/spell|backwards?|reverse|word|phrase|say|tell me how to/gi, '').trim();
            const reversed = clean.split('').reverse().join('');
            this.lastResponseType = 'SPELL';
            return { text: `"${clean}" spelled backwards is **"${reversed}"**.`, sources: ["String Processor"] };
        }

        return null;
    },

    async _generateResponseInternal(query) {
        // ALLOW WIKIPEDIA EVEN IF NOT FULLY READY (for Local Mode)
        // if (!this.isReady) return { text: "Neural core not initialized.", sources: [] };

        // SANITIZE INPUT (Fixes Emoji Crash)
        const sanitizedQuery = this.sanitizeInput(query);
        if (!sanitizedQuery || sanitizedQuery.length === 0) {
            return { text: "I couldn't understand that. Could you try typing it again with standard text?", sources: ["Input Handler"] };
        }

        this.onLog(`Received input: "${sanitizedQuery}"`, "input");

        // Build query context for better understanding
        const queryContext = this.buildQueryContext(sanitizedQuery, this.conversationHistory);

        // Use the resolved query (with pronouns replaced) for better understanding
        const effectiveQuery = queryContext.resolvedQuery || query;
        this.onLog(`Effective query: "${effectiveQuery}"`, "data");

        // Advanced intent analysis
        const intentAnalysis = this.analyzeIntent(effectiveQuery);
        this.onLog(`Primary Intent: ${intentAnalysis.primary} (${(intentAnalysis.confidence * 100).toFixed(0)}%)`, "success");

        if (intentAnalysis.secondary.length > 0) {
            this.onLog(`Secondary Intents: ${intentAnalysis.secondary.join(', ')}`, "info");
        }

        // === PRIORITY HANDLING FOR PENDING QUESTIONS ===
        // If the AI previously asked a question, prioritize confirmation/negation over other intents
        // Example: "Yes thank you" -> detected as Gratitude (primary) but is actually an Answer (secondary)
        if (queryContext.lastAIQuestion &&
            (intentAnalysis.secondary.includes('confirmation') || intentAnalysis.secondary.includes('negation'))) {

            this.onLog("Found pending question + secondary answer intent -> Re-prioritizing.", "warning");
            intentAnalysis.primary = intentAnalysis.secondary.includes('confirmation') ? 'confirmation' : 'negation';
        }

        if (this.isGreeting(effectiveQuery)) {
            this.onLog("Intent: GREETING", "success");
            const greetings = [
                "Hello! How can I help you today?",
                "Hi there! What can I do for you?",
                "Hey! What would you like to know?",
                "Greetings! I'm ready to assist you."
            ];
            const result = {
                text: greetings[Math.floor(Math.random() * greetings.length)],
                sources: ["Conversational"]
            };
            this.addToHistory(query, result.text);
            return result;
        }

        // --- META CAPABILITY QUERIES ---
        if (this.isMetaQuery(effectiveQuery)) {
            this.onLog("Intent: META/CAPABILITY INQUIRY", "success");
            const metaResponses = {
                capabilities: "I'm Guahh AI, an advanced language assistant. I can:\n\n• Answer questions using Wikipedia\n• Write creative content (stories, letters, essays)\n• Perform calculations and solve math problems\n• Paraphrase and adjust tone (formal/casual)\n• Summarize text\n• Explain concepts and provide information\n\nJust ask me anything!",

                identity: "I'm Guahh AI, an intelligent assistant designed to help you with questions, creative writing, calculations, and more. I combine local knowledge with live Wikipedia searches to provide accurate information.",

                how_work: "I use advanced neural language processing to understand your queries. I analyze your intent, search for relevant information (including Wikipedia), and generate helpful responses. I can also learn from context and remember recent conversations."
            };

            let responseText = "";
            if (/what can you (do|help)/i.test(effectiveQuery) || /capabilities|functions/i.test(effectiveQuery)) {
                responseText = metaResponses.capabilities;
            } else if (/who are you|what are you|introduce yourself/i.test(effectiveQuery)) {
                responseText = metaResponses.identity;
            } else if (/how (do|does) (you|it) work/i.test(effectiveQuery)) {
                responseText = metaResponses.how_work;
            } else {
                responseText = metaResponses.capabilities; // Default
            }

            const result = {
                text: responseText,
                sources: ["System Information"]
            };
            this.addToHistory(query, result.text);
            return result;
        }

        // --- PARAPHRASING INTENT ---
        if (intentAnalysis.primary === 'paraphrase' || intentAnalysis.secondary.includes('paraphrase')) {
            this.onLog("Intent: PARAPHRASING", "process");
            const lastOutput = this.recentOutputs[this.recentOutputs.length - 1];
            if (lastOutput) {
                // Detect desired style from query
                let style = 'neutral';
                if (/(formal|professional)/i.test(query)) style = 'formal';
                else if (/(casual|informal)/i.test(query)) style = 'casual';
                else if (/(concise|brief|short)/i.test(query)) style = 'concise';
                else if (/(elaborate|detail|expand)/i.test(query)) style = 'elaborate';

                const paraphrased = this.paraphraseText(lastOutput, style);
                const result = { text: paraphrased, sources: ["Paraphrasing Engine"] };
                this.addToHistory(query, result.text);
                return result;
            } else {
                return { text: "I don't have anything recent to paraphrase. Could you provide some text?", sources: [] };
            }
        }

        // --- TONE ADJUSTMENT INTENT ---
        if (intentAnalysis.primary === 'tone_adjust') {
            this.onLog("Intent: TONE ADJUSTMENT", "process");
            const lastOutput = this.recentOutputs[this.recentOutputs.length - 1];
            if (lastOutput) {
                const tone = /(formal|professional)/i.test(query) ? 'formal' : 'casual';
                const adjusted = this.adjustTone(lastOutput, tone);
                const result = { text: adjusted, sources: ["Tone Adjuster"] };
                this.addToHistory(query, result.text);
                return result;
            } else {
                return { text: "I don't have anything recent to adjust. Could you provide some text?", sources: [] };
            }
        }

        if (intentAnalysis.primary === 'utility' || intentAnalysis.secondary.includes('utility')) {
            this.onLog("Intent: UTILITY / TOOL", "process");
            const utilResult = this.processUtilityRequest(effectiveQuery);
            if (utilResult) {
                this.addToHistory(query, utilResult.text);
                return utilResult;
            }
        }

        // --- CONVERSATIONAL & CASUAL HANDLING ---
        //Handle explicit conversational intents or high-confidence casual queries
        if (['casual', 'greeting', 'farewell', 'gratitude', 'opinion', 'recommendation', 'confirmation', 'negation'].includes(intentAnalysis.primary) ||
            intentAnalysis.secondary.includes('casual')) {

            this.onLog(`Intent: CONVERSATIONAL (${intentAnalysis.primary})`, "process");
            // Pass the updated Context (with lastAIQuestion) to the handler
            const chatResult = this.generateConversationalResponse(intentAnalysis.primary, effectiveQuery, queryContext);
            // Proactive Follow-up (Experimental)
            if (chatResult && this.shouldAskFollowUp(q, chatResult.text)) {
                // No specific topic for small talk usually, but let's try
                const followup = "Is there anything specific you'd like to talk about?";
                chatResult.text += `\n\n${followup}`;
            }

            if (chatResult) {
                this.addToHistory(query, chatResult.text);
                return chatResult;
            }
        }

        // --- ELABORATION / FOLLOW-UP HANDLING ---
        if (intentAnalysis.primary === 'expand' || intentAnalysis.primary === 'followup') {
            this.onLog("Intent: ELABORATION", "process");
            // If we have a topic, treat it like a search or detailed general query about that topic
            if (topic) {
                // For now, we can route this to the Wikipedia search or general generation
                // But strictly looking for "more info"
                this.onLog(`Elaborating on: ${topic}`, "info");
                // Let it fall through to search/general generation with the RESOLVED query (e.g. "tell me more about [topic]")
            }
        }

        const cacheKey = effectiveQuery.toLowerCase().trim();
        if (this.responseCache.has(cacheKey)) {
            this.onLog("Using cached response", "success");
            return this.responseCache.get(cacheKey);
        }

        const cleanQuery = this.preprocessQuery(effectiveQuery);
        this.onLog(`Preprocessed: "${cleanQuery}"`, "data");
        const qTokens = this.tokenize(cleanQuery);

        if (this.isMathQuery(cleanQuery)) {
            this.onLog("Intent: MATH CALCULATION", "success");
            const mathResult = this.calculateMath(cleanQuery);
            if (mathResult) {
                const result = { text: mathResult, sources: ["Calculator"] };
                this.addToHistory(query, result.text);
                return result;
            }
        }

        // --- EXTRACT TOPIC EARLY FOR USE IN VARIOUS INTENTS ---
        let topic = this.extractTopic(effectiveQuery);

        // --- BRAINSTORMING INTENT ---
        if (intentAnalysis.primary === 'brainstorm' || /brainstorm|ideas? for|suggest|come up with|give.*ideas?/i.test(cleanQuery)) {
            this.onLog("Intent: BRAINSTORMING", "process");

            // Extract topic for brainstorming - clean up common phrases
            let brainstormTopic = effectiveQuery
                .replace(/^(brainstorm|give me|suggest|come up with|think of|show me|tell me)\s+/i, '')
                .replace(/^(some |a |an |the )?(ideas?|suggestions?|thoughts?)\s+(for|about|on|regarding)\s+/i, '')
                .replace(/\s+to\s+(wear|make|do|try|use|create|build)$/i, '')
                .replace(/\?+$/, '')
                .trim();

            // If still empty after cleaning, use the topic extraction
            if (!brainstormTopic || brainstormTopic.length < 2) {
                brainstormTopic = topic || 'general concepts';
            }

            const ideas = this.generateBrainstormIdeas(brainstormTopic);

            // If topic is valid, maybe include a Fusion Idea for flavor
            if (brainstormTopic.length > 3 && Math.random() > 0.5) {
                const fusion = this.generateFusionIdea(brainstormTopic);
                ideas += `\n\n${fusion}`;
            }

            const intro = brainstormTopic
                ? `Here are some creative ideas for **${brainstormTopic}**:\n\n`
                : "Here are some creative ideas:\n\n";

            const result = {
                text: intro + ideas,
                sources: ["Creative Brainstorming Engine"]
            };
            this.addToHistory(query, result.text);
            this.responseCache.set(cacheKey, result);
            return result;
        }

        // --- SUMMARIZATION ---
        if (/^(summarize|summarise|sum up|summary)/i.test(cleanQuery)) {
            this.onLog("Intent: SUMMARIZATION", "process");
            const lastOutput = this.recentOutputs[this.recentOutputs.length - 1];
            if (lastOutput) {
                const summary = this.summarizeText(lastOutput);
                const result = { text: summary, sources: ["Analytical Engine"] };
                this.addToHistory(query, result.text);
                return result;
            } else {
                return { text: "I don't have anything recent to summarize.", sources: [] };
            }
        }

        // --- INTELLIGENT SEARCH ROUTING ---
        const searchQuery = topic || effectiveQuery;
        const needsSearch = this.isSearchQuery(effectiveQuery);
        const hasLittleMemory = this.memory.length < 50;

        // Priority Wikipedia search for:
        // 1. Explicit search queries (what is X, who is Y, etc.)
        // 2. Local mode with little memory
        // 3. Questions with proper nouns (likely entities)
        if (needsSearch || hasLittleMemory) {
            if (needsSearch) {
                this.onLog("🔍 Search query detected - engaging Wikipedia...", "process");
            } else {
                this.onLog("Local mode - attempting Wikipedia search...", "process");
            }

            const wikiResult = await this.searchWikipedia(searchQuery, false);
            if (wikiResult) {
                this.onLog("✓ Wikipedia Data Retrieved.", "success");
                let text = wikiResult;

                // Add follow up if topic is clear
                if (topic && this.shouldAskFollowUp(effectiveQuery, text)) {
                    text += `\n\n${this.generateFollowUpQuestion(topic)}`;
                }

                const result = { text: text, sources: ["Wikipedia"] };
                this.addToHistory(query, result.text);
                this.responseCache.set(cacheKey, result);
                return result;
            } else if (needsSearch) {
                // If it's clearly a search query but Wikipedia failed, inform user
                this.onLog("Wikipedia search failed for factual query", "warning");
            }
        }
        // -----------------------------------------

        // --- CREATIVE REQUEST HANDLING ---
        const isCreativeRequest = /write|essay|story|article|poem|create|make.*essay|make.*story|compose/i.test(effectiveQuery);

        if (isCreativeRequest) {
            this.onLog("Creative Intent detected.", "process");

            // Try to get Wikipedia context for the topic if available
            let wikiContext = "";
            if (topic) {
                this.onLog(`Fetching Wikipedia context for topic: "${topic}"`, "process");
                const wikiResult = await this.searchWikipedia(topic, true); // Long form
                if (wikiResult) {
                    wikiContext = wikiResult;
                    this.onLog("✓ Wikipedia context retrieved for creative writing.", "success");
                }
            }

            // Detect creative type
            let creativeText = "";
            if (/letter|email/i.test(effectiveQuery)) {
                this.onLog("Generating Letter...", "process");
                creativeText = this.generateLetter(topic, wikiContext);
            } else if (/story|tale|narrative/i.test(effectiveQuery)) {
                this.onLog("Generating Story...", "process");
                creativeText = this.generateStory(topic, wikiContext);
            } else {
                // Default to story for generic "write about X"
                this.onLog("Generating Creative Content...", "process");
                creativeText = this.generateStory(topic, wikiContext);
            }

            const result = {
                text: creativeText,
                sources: wikiContext ? ["Creative Engine", "Wikipedia"] : ["Creative Engine"]
            };
            this.addToHistory(query, result.text);
            this.responseCache.set(cacheKey, result);
            return result;
        }
        // -----------------------------------------

        this.onLog("Scanning local memory...", "warning");
        const retrievalTokens = topic ? this.tokenize(topic) : qTokens;
        const relevantDocs = this.retrieveRelevant(retrievalTokens);

        // 1. STRONG MATCH - Return directly
        if (relevantDocs.length > 0 && relevantDocs[0].score >= 0.4) {
            this.onLog(`Top Local Match (${(relevantDocs[0].score * 100).toFixed(0)}%): "${relevantDocs[0].doc.a.substring(0, 30)}..."`, "data");
            const result = { text: relevantDocs[0].doc.a, sources: ["Local Memory"] };
            this.addToHistory(query, result.text);
            this.responseCache.set(cacheKey, result);
            return result;
        }

        // 2. WEAK MATCHES - Synthesize partial knowledge
        if (relevantDocs.length > 0 && relevantDocs[0].score >= 0.08) {
            this.onLog(`Weak matches found (best: ${(relevantDocs[0].score * 100).toFixed(0)}%). Synthesizing partial knowledge...`, "process");
            const synthesized = this.synthesizePartialKnowledge(relevantDocs, query, topic);

            const result = {
                text: synthesized,
                sources: ["Knowledge Synthesis", "Local Memory"]
            };
            this.addToHistory(query, result.text);
            this.responseCache.set(cacheKey, result);
            return result;
        }

        // 3. FINAL FALLBACK - General Template Generation
        // (Replaces the old "I don't know" error)
        this.onLog("No local matches. Generating general template response...", "process");
        const template = this.generateGeneralTemplate(topic || effectiveQuery);
        let text = template;

        // Add proactive follow-up for general templates
        if (topic && this.shouldAskFollowUp(effectiveQuery, text)) {
            text += `\n\n${this.generateFollowUpQuestion(topic)}`;
        }

        const fallbackResult = {
            text: text,
            sources: ["General Knowledge Engine"]
        };
        this.addToHistory(query, fallbackResult.text);
        this.responseCache.set(cacheKey, fallbackResult);
        return fallbackResult;
    },

    retrieveRelevant(qTokens) {
        if (qTokens.length === 0) return [];
        const df = {};
        this.memory.forEach(entry => {
            const uniqueTerms = new Set(entry.tokens);
            uniqueTerms.forEach(t => { df[t] = (df[t] || 0) + 1; });
        });
        const totalDocs = this.memory.length;
        const scored = this.memory.map(entry => {
            let weightedScore = 0;
            let overlap = 0;
            qTokens.forEach(t => {
                if (entry.tokens.includes(t)) {
                    overlap++;
                    const idf = Math.log(totalDocs / (df[t] || 1));
                    weightedScore += idf;
                }
            });
            const union = new Set([...entry.tokens, ...qTokens]).size;
            const baseScore = union === 0 ? 0 : overlap / union;
            const finalScore = baseScore * (1 + weightedScore / 10);
            return { doc: entry, score: Math.min(finalScore, 1), overlap };
        });
        return scored.filter(s => s.score > 0.05).sort((a, b) => b.score - a.score).slice(0, 15);
    },

    synthesizePartialKnowledge(relevantDocs, query, topic) {
        // When we have weak matches (0.1 - 0.4 score), synthesize them into a response
        this.onLog("Synthesizing partial knowledge from multiple sources...", "process");

        const topDocs = relevantDocs.slice(0, 6); // Use top 6 partial matches

        // Group documents by theme/similarity
        const themes = this.clusterDocumentsByTheme(topDocs);
        this.onLog(`Found ${themes.length} knowledge clusters`, "data");

        // Build response from themes
        let synthesized = "";

        if (topic) {
            synthesized = `Based on what I know about ${topic}:\n\n`;
        } else {
            synthesized = "Based on related information I have:\n\n";
        }

        themes.forEach((theme, idx) => {
            // Extract key facts from each theme
            const facts = this.extractKeyFacts(theme.docs);
            if (facts.length > 0) {
                if (themes.length > 1) {
                    synthesized += `• `;
                }
                synthesized += facts.join(". ");
                if (!synthesized.endsWith('.')) synthesized += '.';
                synthesized += "\n\n";
            }
        });

        // Add disclaimer if confidence is low
        const avgScore = topDocs.reduce((sum, d) => sum + d.score, 0) / topDocs.length;
        if (avgScore < 0.25) {
            synthesized += "\n(Note: I'm making connections from related topics in my knowledge base. For more accurate information, I'd need additional context or could search Wikipedia.)";
        }

        return synthesized.trim();
    },

    clusterDocumentsByTheme(docs) {
        // Simple clustering by token overlap
        const clusters = [];
        const used = new Set();

        docs.forEach((doc, idx) => {
            if (used.has(idx)) return;

            const cluster = {
                docs: [doc],
                tokens: new Set(doc.doc.tokens)
            };
            used.add(idx);

            // Find similar docs
            docs.forEach((otherDoc, otherIdx) => {
                if (used.has(otherIdx) || idx === otherIdx) return;

                // Calculate token overlap
                const overlap = doc.doc.tokens.filter(t => otherDoc.doc.tokens.includes(t)).length;
                const similarity = overlap / Math.min(doc.doc.tokens.length, otherDoc.doc.tokens.length);

                if (similarity > 0.3) {
                    cluster.docs.push(otherDoc);
                    otherDoc.doc.tokens.forEach(t => cluster.tokens.add(t));
                    used.add(otherIdx);
                }
            });

            clusters.push(cluster);
        });

        return clusters;
    },

    extractKeyFacts(docs) {
        // Extract the most informative sentences from a cluster
        const facts = [];

        docs.forEach(doc => {
            const text = doc.doc.a;
            // Split into sentences
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

            if (sentences.length > 0) {
                // Take first sentence (usually most informative)
                facts.push(sentences[0].trim());
            }
        });

        // Deduplicate similar facts
        const unique = [];
        const seen = new Set();

        facts.forEach(fact => {
            const normalized = fact.toLowerCase().replace(/\s+/g, ' ');
            if (!seen.has(normalized)) {
                seen.add(normalized);
                unique.push(fact);
            }
        });

        return unique.slice(0, 3); // Return top 3 facts
    },

    getFallbackResponse() {
        const responses = [
            "I don't have sufficient context to answer that confidently.",
            "That topic isn't in my current knowledge base. Try asking something else or rephrasing your question.",
            "I'm not finding relevant information for that query.",
            "My database doesn't contain enough information about that subject."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    },

    summarizeText(text) {
        const sentences = text.split('. ').filter(s => s.trim().length > 10);
        if (sentences.length <= 1) return "That's already quite short: " + text;

        // Simple extraction summarization: First sentence + any sentence with "important" keywords or just the last one
        const first = sentences[0];
        const last = sentences[sentences.length - 1];

        // If > 5 sentences, pick a middle one too
        let middle = "";
        if (sentences.length > 5) {
            middle = sentences[Math.floor(sentences.length / 2)] + ". ";
        }

        return `In summary: ${first}. ${middle}${last}.`;
    },

    generateNeuralText(sourceText, targetLength = 40, retryCount = 0) {
        const words = sourceText.replace(/([.,!?;:])/g, " $1 ").split(/\s+/).filter(w => w);
        const bigrams = {};
        const trigrams = {};
        const starters = [];

        for (let i = 0; i < words.length - 2; i++) {
            const w1 = words[i], w2 = words[i + 1], w3 = words[i + 2];
            if (!bigrams[w1]) bigrams[w1] = {};
            bigrams[w1][w2] = (bigrams[w1][w2] || 0) + 1;

            const key = w1 + " " + w2;
            if (!trigrams[key]) trigrams[key] = {};
            trigrams[key][w3] = (trigrams[key][w3] || 0) + 1;

            if (i === 0 || ".!?".includes(words[i - 1])) starters.push(w1);
        }

        if (starters.length === 0) starters.push(words[0]);
        let currentWord = starters[Math.floor(Math.random() * starters.length)];
        let prevWord = "";
        let output = [currentWord];
        const recentWords = [currentWord]; // Track recent words for repetition penalty

        for (let i = 0; i < targetLength; i++) {
            let candidatePool = null;
            if (prevWord) {
                const key = prevWord + " " + currentWord;
                if (trigrams[key]) candidatePool = trigrams[key];
            }
            if (!candidatePool && bigrams[currentWord]) candidatePool = bigrams[currentWord];
            if (!candidatePool || Object.keys(candidatePool).length === 0) break;

            // Apply repetition penalty to recent words
            const penalizedPool = this.applyRepetitionPenalty(candidatePool, recentWords);
            const next = this.sampleWithTemperature(penalizedPool, this.temperature, this.topP);
            if (!next) break;

            output.push(next);
            recentWords.push(next);
            if (recentWords.length > this.repetitionWindow) recentWords.shift();

            prevWord = currentWord;
            currentWord = next;
            if (i > 15 && ".!?".includes(currentWord)) break;
        }

        let text = output.join(" ").replace(/\s+([.,!?;:])/g, "$1").replace(/^([a-z])/g, c => c.toUpperCase());

        // Enhanced validation with coherence check
        if (!this.validateOutput(text) || !this.checkCoherence(text)) {
            if (retryCount >= 2) {
                this.onLog("Output check failed (max retries). Returning best effort.", "warning");
                return text;
            }
            this.onLog(`Output checks failed. Retrying...`, "warning");
            return this.generateNeuralText(sourceText, targetLength, retryCount + 1);
        }
        return text;
    },

    generateStory(topic, externalContext = "") {
        const templates = [
            `Once upon a time, there was a ${topic}. It lived in a world full of wonder and mystery.`,
            `In a distant land, a ${topic} began its journey. The path ahead was unknown but exciting.`,
            `The legend of the ${topic} is known throughout the kingdom. It started on a stormy night.`,
            `Nobody knew where the ${topic} came from, but everyone knew it was special.`
        ];
        const seed = templates[Math.floor(Math.random() * templates.length)];

        // Improve n-gram source: Use the seed ALONG WITH some random memory entries to provide grammar/vocabulary.
        // We pick 20 random entries from memory to "inspire" the style.
        let backgroundKnowledge = externalContext || "";
        if (this.memory.length > 0) {
            for (let i = 0; i < 20; i++) {
                const randomEntry = this.memory[Math.floor(Math.random() * this.memory.length)];
                // Filter out math/code/short entries to prevent hallucinations
                if (randomEntry && randomEntry.a && randomEntry.a.length > 20 && !/[\d+\-*/=]/.test(randomEntry.a) && !/[{}]/.test(randomEntry.a)) {
                    backgroundKnowledge += randomEntry.a + " ";
                }
            }
        }

        // We effectively train the model on provided examples + the seed + generic corpus to prevent loops
        const sourceText = seed + " " + backgroundKnowledge.substring(0, 5000) + " " + this.genericCorpus;

        return seed + "\n\n" + this.generateNeuralText(sourceText, 80);
    },

    detectSentiment(text) {
        const happy = /good|great|love|happy|awesome|thanks|excellent|amazing/i;
        const sad = /bad|sad|hate|sorrow|sorry|regret|unhappy|terrible/i;
        if (happy.test(text)) this.emotion = "happy";
        else if (sad.test(text)) this.emotion = "sad";
        else this.emotion = "neutral";
        this.onLog(`Detected Sentiment: ${this.emotion.toUpperCase()}`, "info");
    },

    generateLetter(topic, externalContext = "") {
        const recipients = ["Friend", "Colleague", "Editor", "Sir/Madam", "Team"];
        let recipient = recipients[Math.floor(Math.random() * recipients.length)];

        if (topic) {
            // Smart recipient extraction: "my boss about a project" -> recipient: "my boss"
            const splitMarkers = [" about ", " regarding ", " on ", " for "];
            let cleanTopic = topic;

            for (const marker of splitMarkers) {
                if (topic.includes(marker)) {
                    recipient = topic.split(marker)[0].trim();
                    cleanTopic = topic.split(marker).slice(1).join(marker).trim();
                    break;
                }
            }
            if (recipient === topic && topic.split(' ').length < 4) {
                // If no marker found but topic is short, treat whole topic as recipient if it looks like a person/role? 
                // Or just leave it. better to be safe.
                recipient = topic;
                cleanTopic = "the matter at hand";
            } else if (recipient === topic) {
                // Topic is long description, probably NOT a recipient name
                recipient = "Sir/Madam";
                cleanTopic = topic;
            }
            // Fix "to my boss" -> "my boss" (already handled by extractTopic but double check)
            recipient = recipient.replace(/^(to|for)\s+/i, '');

            // Re-assign topic for the body generation
            topic = cleanTopic;
        }

        // Adjust tone based on emotion/intent
        let opening = "I am writing to you regarding";
        if (topic && /convinc|persuad|beg|ask/i.test(topic)) opening = "I am writing to passionately request";
        if (this.emotion === "happy") opening = "I am delighted to write to you about";
        if (this.emotion === "sad") opening = "It is with a heavy heart that I write regarding";

        const templates = [
            `Dear ${recipient},\n\n${opening} ${topic || "a recent matter"}. `,
            `To ${recipient},\n\nI wanted to share my thoughts on ${topic || "a subject of importance"}. `,
            `Dear ${recipient},\n\nThis is a message about ${topic || "the project"}. `
        ];

        const seed = templates[Math.floor(Math.random() * templates.length)];

        // Use memory to augment generation, similar to story
        let backgroundKnowledge = "";
        if (this.memory.length > 0) {
            for (let i = 0; i < 15; i++) {
                const randomEntry = this.memory[Math.floor(Math.random() * this.memory.length)];
                // Filter out math/code to prevent math symbols appearing in letters
                if (randomEntry && randomEntry.a && randomEntry.a.length > 20 && !/[\d+\-*/=]/.test(randomEntry.a) && !/[{}]/.test(randomEntry.a)) {
                    backgroundKnowledge += randomEntry.a + " ";
                }
            }
        }

        if (externalContext) backgroundKnowledge += " " + externalContext;

        const sourceText = seed + " " + backgroundKnowledge.substring(0, 6000) + " " + this.letterCorpus;
        const body = this.generateNeuralText(sourceText, 50);

        return `${seed}${body}\n\nSincerely,\nGuahh AI`;
    },

    sampleWithTemperature(candidateFreq, temperature = 1.0, topP = 0.9) {
        const candidates = Object.keys(candidateFreq);
        if (candidates.length === 0) return null;

        const total = Object.values(candidateFreq).reduce((a, b) => a + b, 0);
        let probs = candidates.map(word => ({ word, prob: Math.pow(candidateFreq[word] / total, 1 / temperature) }));
        const probSum = probs.reduce((a, b) => a + b.prob, 0);
        probs = probs.map(p => ({ word: p.word, prob: p.prob / probSum }));
        probs.sort((a, b) => b.prob - a.prob);

        let cumSum = 0;
        const nucleus = [];
        for (const p of probs) {
            cumSum += p.prob;
            nucleus.push(p);
            if (cumSum >= topP) break;
        }

        const rand = Math.random() * nucleus.reduce((a, b) => a + b.prob, 0);
        let running = 0;
        for (const p of nucleus) {
            running += p.prob;
            if (rand <= running) return p.word;
        }
        return nucleus[0].word;
    },

    validateOutput(text) {
        if (!text || text.length < 10) return false;
        const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        if (words.length === 0) return false;

        const uniqueRatio = new Set(words).size / words.length;
        // console.log(`[Validation] Length: ${text.length}, Unique: ${uniqueRatio.toFixed(2)}`);

        if (uniqueRatio < 0.35) return false; // Relaxed from 0.4

        // Check against recent outputs for diversity
        const similarity = this.recentOutputs.some(recent => {
            const overlap = this.computeSimilarity(text, recent);
            return overlap > 0.8; // Loosened from 0.7 to 0.8
        });

        return !similarity;
    },

    applyRepetitionPenalty(candidatePool, recentWords, penalty = 0.5) {
        // Reduce probability of recently used words
        const penalizedPool = {};
        for (const [word, freq] of Object.entries(candidatePool)) {
            const timesUsedRecently = recentWords.filter(w => w.toLowerCase() === word.toLowerCase()).length;
            const penalizedFreq = timesUsedRecently > 0 ? freq * Math.pow(penalty, timesUsedRecently) : freq;
            penalizedPool[word] = Math.max(penalizedFreq, 1); // Ensure at least 1
        }
        return penalizedPool;
    },

    checkCoherence(text) {
        if (!text || text.length < 20) return false;

        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
        if (sentences.length === 0) return false;

        // Check for basic coherence: sentences should have reasonable length and variety
        let totalWords = 0;
        let validSentences = 0;

        for (const sentence of sentences) {
            const words = sentence.trim().split(/\s+/).filter(w => w.length > 0);
            if (words.length >= 3 && words.length <= 50) {
                validSentences++;
                totalWords += words.length;
            }
        }

        // At least 50% of sentences should be valid length
        const validRatio = validSentences / sentences.length;
        return validRatio >= 0.5;
    },

    scoreTopicRelevance(text, topic) {
        if (!topic || !text) return 0.5;

        const topicWords = this.tokenize(topic);
        const textWords = this.tokenize(text);

        let matches = 0;
        for (const topicWord of topicWords) {
            if (textWords.includes(topicWord)) {
                matches++;
            }
        }

        return topicWords.length > 0 ? matches / topicWords.length : 0;
    },

    computeSimilarity(text1, text2) {
        const s1 = new Set(text1.toLowerCase().split(/\s+/));
        const s2 = new Set(text2.toLowerCase().split(/\s+/));
        const intersection = new Set([...s1].filter(x => s2.has(x)));
        const union = new Set([...s1, ...s2]);
        return union.size === 0 ? 0 : intersection.size / union.size;
    },

    addToHistory(query, response) {
        this.conversationHistory.push({ query, response, timestamp: Date.now() });
        // Increased from 10 to 50 for better context retention
        if (this.conversationHistory.length > 50) this.conversationHistory.shift();
        this.recentOutputs.push(response);
        // Increased from 5 to 15 for better output diversity tracking
        if (this.recentOutputs.length > 15) this.recentOutputs.shift();
    },

    checkDictionaryInquiry(query) {
        const clean = query.toLowerCase().replace(/[^a-z\s]/g, '').trim();
        const parts = clean.split(" ");
        const lastWord = parts[parts.length - 1];
        if (this.dictionary[clean] || this.dictionary[lastWord]) {
            const entry = this.dictionary[clean] || this.dictionary[lastWord];
            return `**${entry.word}** (${entry.pos}): ${entry.def}`;
        }
        return null;
    }
};
