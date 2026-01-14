const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BASE_PATH = __dirname;
const DATA_DIR = path.join(BASE_PATH, 'data');
const DATA2_DIR = path.join(BASE_PATH, 'data2');
const DATA2_CONVERTED_DIR = path.join(BASE_PATH, 'data2_converted');
const MASTER_KNOWLEDGE_FILE = path.join(BASE_PATH, 'master_knowledge.md');
const INDEX_FILE = path.join(BASE_PATH, 'memory_index.json');

// List to track all generated memory files
const generatedFiles = [];

async function processFile(sourcePath, outputName, type = 'conv') {
    if (!fs.existsSync(sourcePath)) return;

    const outputPath = path.join(BASE_PATH, outputName);
    console.log(`Processing ${path.basename(sourcePath)} -> ${outputName}...`);

    const outStream = fs.createWriteStream(outputPath, { encoding: 'utf8' });
    outStream.write('['); // Start JSON array

    const fileStream = fs.createReadStream(sourcePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let isFirstEntry = true;
    let entryCount = 0;

    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            const json = JSON.parse(line);
            if (json.messages) {
                let q = null;
                let a = null;
                for (const msg of json.messages) {
                    if (msg.role === 'user') q = msg.content;
                    if (msg.role === 'assistant') a = msg.content;
                }

                if (q && a) {
                    if (!isFirstEntry) outStream.write(',\n');
                    outStream.write(JSON.stringify({ q, a, type: 'conv' }));
                    isFirstEntry = false;
                    entryCount++;
                } else if (type === 'knowledge' && a) {
                    if (!isFirstEntry) outStream.write(',\n');
                    outStream.write(JSON.stringify({ q: "", a, type: 'knowledge' }));
                    isFirstEntry = false;
                    entryCount++;
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
    }

    outStream.write(']');
    outStream.end();

    // Wait for finish
    await new Promise(resolve => outStream.on('finish', resolve));

    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`  -> Created ${outputName} (${sizeMB} MB, ${entryCount} entries)`);

    if (entryCount > 0) {
        generatedFiles.push(outputName);
    } else {
        // If empty, maybe delete it? existing logic didn't, but let's keep it clean
        fs.unlinkSync(outputPath);
        console.log(`  -> Removed empty file ${outputName}`);
    }
}

async function processKnowledgeMd() {
    if (!fs.existsSync(MASTER_KNOWLEDGE_FILE)) {
        console.log('master_knowledge.md not found, skipping dictionary.');
        return;
    }

    const outputName = 'memory_dictionary.json';
    const outputPath = path.join(BASE_PATH, outputName);
    console.log(`Processing Dictionary from master_knowledge.md -> ${outputName}...`);

    const outStream = fs.createWriteStream(outputPath, { encoding: 'utf8' });
    outStream.write('[');

    const fileStream = fs.createReadStream(MASTER_KNOWLEDGE_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const regex = /\|\s*\*\*(.*?)\*\*\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|/;
    let isFirstEntry = true;
    let entryCount = 0;

    for await (const line of rl) {
        const match = line.match(regex);
        if (match) {
            const word = match[1].trim().toLowerCase();
            const pos = match[2].trim();
            const cat = match[3].trim();
            const def = match[4].trim();

            if (!isFirstEntry) outStream.write(',\n');
            outStream.write(JSON.stringify({
                word,
                pos,
                category: cat,
                def,
                type: 'dict'
            }));
            isFirstEntry = false;
            entryCount++;
        }
    }

    outStream.write(']');
    outStream.end();

    await new Promise(resolve => outStream.on('finish', resolve));

    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`  -> Created ${outputName} (${sizeMB} MB, ${entryCount} entries)`);

    if (entryCount > 0) {
        generatedFiles.push(outputName);
    } else {
        fs.unlinkSync(outputPath);
    }
}

async function main() {
    console.log("Compiling Guahh AI Memory (Multi-file Mode)...");

    // Clear generatedFiles list
    generatedFiles.length = 0;

    // 1. Process Data Directory
    if (fs.existsSync(DATA_DIR)) {
        const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.jsonl'));
        for (const file of files) {
            if (file.startsWith('train-')) {
                console.log(`Skipping raw training data: ${file}`);
                continue;
            }
            // Create output filename: memory_filename.json
            const baseName = path.basename(file, '.jsonl');
            const outputName = `memory_${baseName}.json`;
            await processFile(path.join(DATA_DIR, file), outputName);
        }
    }

    // 2. Process Data2 Converted (if exists)
    if (fs.existsSync(DATA2_CONVERTED_DIR)) {
        const files = fs.readdirSync(DATA2_CONVERTED_DIR).filter(f => f.endsWith('.jsonl'));
        for (const file of files) {
            const baseName = path.basename(file, '.jsonl');
            const outputName = `memory_knowledge_${baseName}.json`;
            await processFile(path.join(DATA2_CONVERTED_DIR, file), outputName, 'knowledge');
        }
    }

    // 3. Process Dictionary
    await processKnowledgeMd();

    // 4. Generate Index
    fs.writeFileSync(INDEX_FILE, JSON.stringify(generatedFiles, null, 2));
    console.log(`\nGenerated Index: ${INDEX_FILE}`);
    console.log('Files:', generatedFiles);
}

main().catch(err => console.error(err));
