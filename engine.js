/**
 * Guahh AI - Neural Engine V8.0 (Ultra-Intelligence)
 * Features: 30+ Intents, 12 Intelligent Wikipedia Strategies, Partial Knowledge Synthesis, Advanced Context Understanding
 */

const GuahhEngine = {
    // Core Data
    memory: [],
    dictionary: {},
    idf: {},
    isReady: false,
    lastTopic: null,
    emotion: "neutral", // Current emotional state


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

    isMetaQuery(query) {
        const metaPatterns = [
            /who are you/i, /what (are|is) you/i, /your name/i, /tell me about yourself/i, /introduce yourself/i, /what (are|is) guahh/i,
            /^can you (code|program|write code|help|assist|do|make)/i, /^can you (answer|explain|tell|show|teach|create)/i, /are you able to/i,
            /^do you (code|program|write code|know|understand)/i, /^do you (have|support|offer|provide)/i,
            /what can you do/i, /what (are|is) your (purpose|function|capabilities)/i, /how do you work/i, /what do you do/i, /what are you (good|capable) of/i
        ];
        return metaPatterns.some(p => p.test(query));
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
            recentQueries: history.slice(-3).map(h => h.query),
            recentResponses: history.slice(-3).map(h => h.response),
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

        if (!context.lastTopic) return query;

        // Replace common pronouns with the last topic
        resolved = resolved
            .replace(/\bit\b/gi, context.lastTopic)
            .replace(/\bthat\b/gi, context.lastTopic)
            .replace(/\bthis\b/gi, context.lastTopic);

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


    async generateResponse(query) {
        try {
            return await this._generateResponseInternal(query);
        } catch (error) {
            this.onLog(`ERROR in generateResponse: ${error.message}`, "error");
            console.error("Generate Response Error:", error);
            return {
                text: "I encountered an error while processing your request. Please try rephrasing your question or asking something else.",
                sources: ["Error Handler"]
            };
        }
    },

    async _generateResponseInternal(query) {
        // ALLOW WIKIPEDIA EVEN IF NOT FULLY READY (for Local Mode)
        // if (!this.isReady) return { text: "Neural core not initialized.", sources: [] };

        this.onLog(`Received input: "${query}"`, "input");

        // Build query context for better understanding
        const queryContext = this.buildQueryContext(query, this.conversationHistory);

        // Use the resolved query (with pronouns replaced) for better understanding
        const effectiveQuery = queryContext.resolvedQuery || query;
        this.onLog(`Effective query: "${effectiveQuery}"`, "data");

        // Advanced intent analysis
        const intentAnalysis = this.analyzeIntent(effectiveQuery);
        this.onLog(`Primary Intent: ${intentAnalysis.primary} (${(intentAnalysis.confidence * 100).toFixed(0)}%)`, "success");

        if (intentAnalysis.secondary.length > 0) {
            this.onLog(`Secondary Intents: ${intentAnalysis.secondary.join(', ')}`, "info");
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

        // --- WIKIPEDIA PRIORITY FOR LOCAL MODE ---
        let topic = this.extractTopic(effectiveQuery);
        const searchQuery = topic || effectiveQuery; // fallback to full query if no topic

        // Always attempt Wikipedia if we have a valid topic or it looks like a question
        const isQuestion = /what|who|where|when|how|define|explain/i.test(effectiveQuery);
        const hasLittleMemory = this.memory.length < 50; // Local mode usually has ~3 items

        if (hasLittleMemory || isQuestion) {
            this.onLog("Engaging Live Search (Wikipedia)...", "process");
            const wikiResult = await this.searchWikipedia(searchQuery, false);
            if (wikiResult) {
                this.onLog("✓ Wikipedia Data Retrieved.", "success");
                const result = { text: wikiResult, sources: ["Wikipedia"] };
                this.addToHistory(query, result.text);
                this.responseCache.set(cacheKey, result);
                return result;
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

        // No matches at all
        if (relevantDocs.length === 0 || relevantDocs[0].score < 0.08) {
            this.onLog("No relevant context found in any source.", "error");

            // FINAL FALLBACK
            const result = {
                text: "I don't have that information in my local database, and I couldn't find it on Wikipedia right now. Could you try rephrasing your question or asking about something else?",
                sources: []
            };
            this.addToHistory(query, result.text);
            return result;
        }

        // Strong match - return directly
        if (relevantDocs[0].score >= 0.4) {
            this.onLog(`Top Local Match (${(relevantDocs[0].score * 100).toFixed(0)}%): "${relevantDocs[0].doc.a.substring(0, 30)}..."`, "data");
            const result = { text: relevantDocs[0].doc.a, sources: ["Local Memory"] };
            this.addToHistory(query, result.text);
            this.responseCache.set(cacheKey, result);
            return result;
        }

        // Weak matches (0.08 - 0.4) - synthesize partial knowledge
        this.onLog(`Weak matches found (best: ${(relevantDocs[0].score * 100).toFixed(0)}%). Synthesizing partial knowledge...`, "process");
        const synthesized = this.synthesizePartialKnowledge(relevantDocs, query, topic);

        const result = {
            text: synthesized,
            sources: ["Knowledge Synthesis", "Local Memory"]
        };
        this.addToHistory(query, result.text);
        this.responseCache.set(cacheKey, result);
        return result;
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
        if (this.conversationHistory.length > 10) this.conversationHistory.shift();
        this.recentOutputs.push(response);
        if (this.recentOutputs.length > 5) this.recentOutputs.shift();
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
