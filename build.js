const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT_EXE = 'ProtonVPN Game Excluder.exe';
const BUNDLE  = '_sea-bundle.cjs';
const BLOB    = '_sea-prep.blob';
const CONFIG  = '_sea-config.json';

function run(cmd, label) {
    console.log(`\n[${label}] ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
}

function cleanup() {
    for (const f of [BUNDLE, BLOB, CONFIG]) {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
    }
}

try {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   ProtonVPN Game Excluder — Build    ║');
    console.log('╚══════════════════════════════════════╝\n');

    // 1. Bundle JS + node_modules (glob etc.) into a single CJS file
    // Built-in Node.js modules must be marked as external (they ship inside node binary)
    const externals = [
        'fs', 'path', 'readline', 'readline/promises',
        'process', 'os', 'crypto', 'child_process',
        'stream', 'util', 'events', 'buffer'
    ].map(m => `--external:${m}`).join(' ');

    run(
        `npx esbuild protonvpn-exclude-games.js --bundle --platform=node --format=cjs ${externals} --outfile=${BUNDLE}`,
        '1/5 Bundle  (esbuild)'
    );

    // 2. SEA configuration
    console.log('\n[2/5 Config] Writing sea-config.json...');
    fs.writeFileSync(CONFIG, JSON.stringify({
        main: BUNDLE,
        output: BLOB,
        disableExperimentalSEAWarning: true,
        useSnapshot: false,
        useCodeCache: true
    }, null, 2));

    // 3. Generate the SEA blob
    run(`node --experimental-sea-config ${CONFIG}`, '3/5 Blob    (node SEA)');

    // 4. Copy node.exe as base for our executable (delete old one first to avoid EBUSY)
    console.log(`\n[4/5 Copy  ] ${process.execPath} → ${OUT_EXE}`);
    if (fs.existsSync(OUT_EXE)) {
        fs.unlinkSync(OUT_EXE);
    }
    fs.copyFileSync(process.execPath, OUT_EXE);

    // Optional: remove existing signature so postject can inject cleanly
    try {
        execSync(`signtool remove /s "${OUT_EXE}"`, { stdio: 'pipe' });
        console.log('[4/5 Sign  ] Existing signature removed.');
    } catch {
        // signtool not available — safe to skip
    }

    // 5. Inject SEA blob into the copied binary
    run(
        `npx postject "${OUT_EXE}" NODE_SEA_BLOB "${BLOB}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
        '5/5 Inject  (postject)'
    );

    cleanup();

    console.log('\n╔══════════════════════════════════════╗');
    console.log(`║  ✓ Build complete!                   ║`);
    console.log(`║  Output: ${OUT_EXE.padEnd(27)} ║`);
    console.log('╚══════════════════════════════════════╝\n');

} catch (err) {
    cleanup();
    console.error('\n✗ Build failed:', err.message);
    process.exit(1);
}
