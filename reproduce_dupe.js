
const { GuahhAIEngine } = require('./engine.js');

async function testEssayDuplication() {
    const ai = new GuahhAIEngine();

    // Simulate a mocked Wikipedia context with headers
    const topic = "Lady Macbeth";
    const mockWiki = `**Lady Macbeth:**
Lady Macbeth is a leading character in William Shakespeare's tragedy Macbeth (c. 1603-1607). As the wife of the play's tragic hero, Macbeth (a Scottish nobleman), Lady Macbeth goads her husband into committing regicide, after which she becomes queen of Scotland. She dies off-stage in the last act, an apparent suicide. Lady Macbeth is a powerful presence in the play, most notably in the first two acts. Following the murder of King Duncan, however, her role in the plot diminishes. She becomes an unhinged spectator to Macbeth's plotting and a nervous hostess at a banquet dominated by her husband's hallucinations. Her fifth-act sleepwalking scene is a turning point in the play. Her line "Out, damned spot!" has become a familiar phrase in the English language.`;

    // 1. Check Introduction Generation
    const outline = {
        thesis: "This is a thesis.",
        bodyPoints: ["Character Analysis", "Themes", "History"]
    };

    console.log("--- GENERATING INTRODUCTION ---");
    const intro = ai.generateIntroduction(topic, mockWiki, outline);
    console.log(intro);

    // 2. Check Body Paragraph 0 Generation
    console.log("\n--- GENERATING BODY PARAGRAPH 0 ---");
    const body0 = ai.generateBodyParagraph(topic, mockWiki, "Character Analysis", 0);
    console.log(body0);

    // Check for overlap
    const introSentences = intro.split('.');
    const bodySentences = body0.split('.');

    // Simple overlap check
    let duplicates = 0;
    for (const s of introSentences) {
        if (s.length > 20 && body0.includes(s.trim())) {
            console.log(`\n[CRITICAL] Duplicate detected: "${s.trim()}"`);
            duplicates++;
        }
    }

    if (duplicates > 0) {
        console.log("\n[FAIL] Duplication confirmed between Intro and Body Paragraph 0.");
    } else {
        console.log("\n[PASS] No obvious duplication found.");
    }
}

testEssayDuplication();
