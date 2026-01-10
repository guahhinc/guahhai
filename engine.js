/**
 * Guahh AI - Neural Engine V6.0 (Advanced Generative)
 * Features: Temperature Sampling, Nucleus Sampling, Response Caching, Better Context Management
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
        cleaned = cleaned
            .replace(/\bai\b/g, 'artificial intelligence')
            .replace(/\bml\b/g, 'machine learning')
            .replace(/\bwhat's\b/g, 'what is')
            .replace(/\bwhats\b/g, 'what is') // FIx: Handle missing apostrophe
            .replace(/\bwho's\b/g, 'who is')
            .replace(/\bwhos\b/g, 'who is')
            .replace(/\bhow's\b/g, 'how is')
            .replace(/\bhows\b/g, 'how is')
            .replace(/\binfo\b/g, 'information')
            .replace(/\bpic\b/g, 'picture')
            .replace(/\bvid\b/g, 'video');
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
        return /\b(it|that|this|longer|shorter|more|detail|elaborate|continue|again)\b/i.test(q);
    },

    extractTopic(query) {
        const clean = query.toLowerCase().trim();
        let topic = null;
        let match = clean.match(/(?:write|make|create|generate)\s+(?:a|an|the)?\s*(?:story|letter|email|essay|article|poem|song|paragraph|report)\s+(?:about|on|regarding|to|for)\s+(?:the\s+)?(.+)/i);
        if (match) topic = match[1].trim();
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

    async searchWikipedia(query, isLongForm = false) {
        if (this.wikiCache.has(query)) {
            this.onLog(`Wikipedia: Using cached result for "${query}"`, "success");
            return this.wikiCache.get(query);
        }

        this.onLog(`Wikipedia: Smart search for "${query}"...`, "process");
        let result = null;

        const cleanQuery = query.replace(/^(what is|who is|tell me about|define|search for|meaning of|information on|facts about)\s+/i, '');
        result = await this._fetchWikipedia(cleanQuery, isLongForm);
        if (result) return this._cacheAndReturn(query, result);

        if (cleanQuery !== query) {
            this.onLog(`Wikipedia: Trying original query...`, "process");
            result = await this._fetchWikipedia(query, isLongForm);
            if (result) return this._cacheAndReturn(query, result);
        }

        const alternatives = this.generateAlternativeQueries(query, cleanQuery);
        for (const alt of alternatives) {
            this.onLog(`Wikipedia: Trying alternative "${alt}"...`, "process");
            result = await this._fetchWikipedia(alt, isLongForm);
            if (result) return this._cacheAndReturn(query, result);
        }

        this.onLog("Wikipedia: All search attempts failed.", "error");
        return null;
    },

    _cacheAndReturn(originalQuery, result) {
        this.wikiCache.set(originalQuery, result);
        if (this.wikiCache.size > 50) {
            const firstKey = this.wikiCache.keys().next().value;
            this.wikiCache.delete(firstKey);
        }
        return result;
    },

    async _fetchWikipedia(searchTerm, isLongForm = false) {
        const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro&explaintext&redirects=1&origin=*&titles=${encodeURIComponent(searchTerm)}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pageId === "-1") return null;

            const extract = pages[pageId].extract;
            if (!extract || extract.includes("refer to:") || extract.includes("may refer to")) return null;

            const sentences = extract.split('. ').filter(s => s.trim().length > 20);
            const sentenceCount = isLongForm ? 10 : 4;
            const summary = sentences.slice(0, sentenceCount).join('. ') + '.';
            if (summary.length < 50) return null;

            this.onLog(`Wikipedia: ✓ Found "${searchTerm}"`, "success");
            return summary;
        } catch (e) {
            this.onLog(`Wikipedia: Error fetching "${searchTerm}"`, "error");
            return null;
        }
    },

    async generateResponse(query) {
        if (!this.isReady) return { text: "Neural core not initialized.", sources: [] };

        this.onLog(`Received input: "${query}"`, "input");

        if (this.isGreeting(query)) {
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

        const cacheKey = query.toLowerCase().trim();
        if (this.responseCache.has(cacheKey)) {
            this.onLog("Using cached response", "success");
            return this.responseCache.get(cacheKey);
        }

        const cleanQuery = this.preprocessQuery(query);
        this.onLog(`Preprocessed: "${cleanQuery}"`, "data");
        const qTokens = this.tokenize(cleanQuery);

        // Fix: Use cleanQuery to catch "whats 1+9" -> "what is 1+9"
        if (this.isMathQuery(cleanQuery)) {
            this.onLog("Intent: MATH CALCULATION", "success");
            const mathResult = this.calculateMath(cleanQuery);
            if (mathResult) {
                const result = { text: mathResult, sources: ["Calculator"] };
                this.addToHistory(query, result.text);
                return result;
            }
        }

        if (this.isCodingRequest(query)) {
            this.onLog("Intent: CODING REQUEST", "warning");
            const result = {
                text: "I'm a knowledge and conversation AI, not a code generator. However, I can explain programming concepts, answer questions about coding, or help you understand how algorithms work. What would you like to learn about?",
                sources: ["System Limitations"]
            };
            this.addToHistory(query, result.text);
            return result;
        }

        if (this.isMetaQuery(query)) {
            this.onLog("Intent: META (Self-referential)", "success");
            const relevantDocs = this.retrieveRelevant(qTokens);
            if (relevantDocs.length > 0 && relevantDocs[0].score > 0.5) {
                const result = { text: relevantDocs[0].doc.a, sources: ["Local Memory"] };
                this.addToHistory(query, result.text);
                return result;
            }
            let responseText;
            if (/can you|do you|are you able/i.test(query)) {
                responseText = "Yes! I can answer questions, search Wikipedia for information, explain concepts, and have conversations. I work best with factual topics and creative writing requests. What would you like to know?";
            } else if (/who (made|created|developed|built) you/i.test(query)) {
                responseText = "I was developed by the Australian technology company, Guahh.";
            } else {
                responseText = "I am Guahh AI One (a), an advanced locally-running neural system. I use temperature sampling, nucleus sampling, and sophisticated retrieval to answer questions, generate creative text, search Wikipedia, and maintain natural conversations.";
            }
            const result = { text: responseText, sources: ["Core Identity"] };
            this.addToHistory(query, result.text);
            return result;
        }

        const dictResult = this.checkDictionaryInquiry(query);
        if (dictResult) {
            this.onLog("Intent: DEFINITION", "success");
            const result = { text: dictResult, sources: ["Dictionary"] };
            this.addToHistory(query, result.text);
            return result;
        }

        const isCreativeRequest = /write|essay|story|article|poem|create|make.*essay|make.*story/i.test(query);
        this.onLog("Priority Source: Wikipedia (External Knowledge)", "process");

        let topic = this.extractTopic(query);
        if (!topic && this.lastTopic && this.isContextualFollowUp(query)) {
            topic = this.lastTopic;
            this.onLog(`Context recovered: "${topic}" from previous conversation`, "info");
        }
        const searchQuery = topic || query;
        if (topic) this.onLog(`Active topic: "${topic}"`, "data");

        const wikiResult = await this.searchWikipedia(searchQuery, isCreativeRequest);
        if (wikiResult && !isCreativeRequest) {
            this.onLog("Wikipedia knowledge retrieved. Using as primary source.", "success");
            const result = { text: wikiResult, sources: ["Wikipedia"] };
            this.addToHistory(query, result.text);
            this.responseCache.set(cacheKey, result);
            return result;
        }

        // Detect sentiment to adjust tone
        this.detectSentiment(query);

        if (isCreativeRequest) {
            this.onLog("Wikipedia unavailable for creative request. Engaging Creative Engine...", "warning");

            // If we have wiki result, use it as context context!
            let externalContext = "";
            if (wikiResult) {
                this.onLog("Using Wikipedia data as background context for generation.", "info");
                externalContext = wikiResult;
            }

            // Check for Letter/Email
            if (/letter|email|note|message/i.test(query)) {
                this.onLog("Intent: LETTER WRITING", "process");
                const letter = this.generateLetter(topic || "a friend", externalContext);
                const result = { text: letter, sources: ["Neural Creative Engine"] };
                this.addToHistory(query, result.text);
                return result;
            }

            const isStory = /story|tale|adventure|legend|myth/i.test(query);
            if (isStory || topic) {
                const storyTopic = topic || "a mysterious adventure";
                const story = this.generateStory(storyTopic, externalContext);
                const result = { text: story, sources: ["Neural Creative Engine"] };
                this.addToHistory(query, result.text);
                return result;
            }

            // Fallback for creative but not story/letter
            this.onLog("Creative request type unspecified. Asking for clarification.", "info");
            return {
                text: "I'd love to write something for you! Could you specify if you want a story, a letter, or an essay? For example: 'Write a story about space' or 'Write a letter to my friend'.",
                sources: ["System"]
            };
        }

        this.onLog("Wikipedia unavailable. Scanning local memory...", "warning");
        const retrievalTokens = topic ? this.tokenize(topic) : qTokens;
        const relevantDocs = this.retrieveRelevant(retrievalTokens);

        if (relevantDocs.length === 0 || relevantDocs[0].score < 0.1) {
            this.onLog("No relevant context found in any source.", "error");
            return { text: "I don't have that information yet. Try rephrasing or asking about a different topic.", sources: [] };
        }

        this.onLog(`Top Local Match (${(relevantDocs[0].score * 100).toFixed(0)}%): "${relevantDocs[0].doc.a.substring(0, 30)}..."`, "data");

        const queryType = this.detectQueryType(query);
        const isLongForm = /write|story|essay|article|explain|detail|elaborate/.test(cleanQuery);
        let maxLen = isLongForm ? 400 : 60;
        let contextSize = isLongForm ? 20 : 10;
        const bestScore = relevantDocs[0].score;
        let outputText = "";
        const confidenceThreshold = queryType === 'question' ? 0.7 : 0.85;

        if (bestScore > confidenceThreshold && !isLongForm) {
            this.onLog("High confidence. Using retrieved memory directly.", "info");
            outputText = relevantDocs[0].doc.a;
        } else if (bestScore > 0.15 || isLongForm) {
            this.onLog(`Engaging Advanced Generative Engine (Mode: ${isLongForm ? "Long-Form" : "Standard"})...`, "warning");
            const validDocs = relevantDocs.slice(0, contextSize);
            const contextText = validDocs.map(d => d.doc.a).join(" ");
            if (validDocs.length < 3) this.onLog("Warning: Low context volume for generation.", "error");

            outputText = this.generateNeuralText(contextText, maxLen);

            if (outputText.length < 20) {
                this.onLog("Generation unstable. Reverting to best context match.", "error");
                outputText = relevantDocs[0].doc.a;
            } else {
                this.onLog("✓ Synthesized new response with temperature sampling.", "success");
            }
        } else {
            this.onLog("Low confidence match. Avoiding hallucination.", "error");
            return { text: "I found some data, but it doesn't seem relevant enough to answer confidently. Can you be more specific?", sources: [] };
        }

        const result = { text: outputText, sources: relevantDocs.slice(0, 3).map(d => d.score) };
        this.addToHistory(query, result.text);
        this.responseCache.set(cacheKey, result);
        if (this.responseCache.size > 100) {
            const firstKey = this.responseCache.keys().next().value;
            this.responseCache.delete(firstKey);
        }
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
            return { doc: entry, score: Math.min(finalScore, 1) };
        });
        return scored.filter(s => s.score > 0.05).sort((a, b) => b.score - a.score).slice(0, 15);
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

        for (let i = 0; i < targetLength; i++) {
            let candidatePool = null;
            if (prevWord) {
                const key = prevWord + " " + currentWord;
                if (trigrams[key]) candidatePool = trigrams[key];
            }
            if (!candidatePool && bigrams[currentWord]) candidatePool = bigrams[currentWord];
            if (!candidatePool || Object.keys(candidatePool).length === 0) break;

            const next = this.sampleWithTemperature(candidatePool, this.temperature, this.topP);
            if (!next) break;

            output.push(next);
            prevWord = currentWord;
            currentWord = next;
            if (i > 15 && ".!?".includes(currentWord)) break;
        }

        let text = output.join(" ").replace(/\s+([.,!?;:])/g, "$1").replace(/^([a-z])/g, c => c.toUpperCase());
        if (!this.validateOutput(text)) {
            if (retryCount >= 2) {
                this.onLog("Output check failed (max retries). Returning best effort.", "warning");
                return text;
            }
            this.onLog(`Output checks failed (Ratio: ${(new Set(text.split(/\s+/)).size / text.split(/\s+/).length).toFixed(2)}). Retrying...`, "warning");
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
