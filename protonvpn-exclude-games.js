const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const readline = require('readline/promises');
const { execSync, spawn } = require('child_process');
const { stdin: input, stdout: output } = require('process');

// ─── STRINGS ──────────────────────────────────────────────────────────────────
const STRINGS = {
    tr: {
        title: '--- Proton VPN Game Excluder ---',
        langSelect: '\nLütfen dil seçiniz / Please select language:\n  [1] Türkçe\n  [2] English\n',
        langPrompt: 'Seçiminiz / Your choice (1/2): ',
        steamPathPrompt: (def) => `\nOyun kütüphane yolunu giriniz (Varsayılan: ${def}): `,
        aboutToDoTitle: '\nBu uygulama şunları yapacaktır:',
        step1: (p) => `  1. Oyun kütüphanenizi (${p}) tarayarak oyun (.exe) dosyalarını bulacaktır.`,
        step2: '  2. Proton VPN ayarlarınızı (AppData) okuyacak ve bu oyunları Split Tunneling listesine ekleyecektir.',
        step3: '  3. Herhangi bir değişiklik yapmadan önce size bulunan oyun sayısını bildirip tekrar onay alacaktır.',
        vpnRunningDetected: '\n⚠️  Proton VPN şu anda çalışıyor. Değişikliklerin doğru uygulanabilmesi\n   için uygulamanın kapatılması gerekmektedir.',
        closeVpnPermission: 'Proton VPN şimdi kapatılsın mı? (E) Evet / (H) Hayır: ',
        closingVpn: '\nProton VPN kapatılıyor...',
        vpnClosed: '✓ Proton VPN kapatıldı.\n',
        closeVpnDenied: '\nİşlem iptal edildi. Devam edebilmek için Proton VPN\'in kapatılması gerekmektedir.',
        vpnNotRunning: '\n✓ Proton VPN çalışmıyor. Devam ediliyor...\n',
        consentPrompt: '\nTaramayı başlatmak ve dosyalara erişmek için onay veriyor musunuz? (E) Evet / (H) Hayır: ',
        cancelled: '\nİşlem iptal edildi. Dosya erişimi yapılmadı.',
        scanning: '\nDosyalar taranıyor, lütfen bekleyin...',
        errNoProtonFolder: '\nHata: Proton VPN klasörü bulunamadı! Uygulamanın kurulu olduğundan emin olun.',
        errNoSettingsFile: '\nHata: UserSettings dosyası bulunamadı!',
        scanComplete: '\nTarama Tamamlandı:',
        foundCount: (n) => `  Oyun kütüphanenizde ${n} adet yeni oyun/exe dosyası bulundu.`,
        notesTitle: '\nÖnemli Notlar:',
        note1: '  - Proton VPN Split Tunneling menüsünde her oyun için birden fazla exe görünebilir.',
        note2: '  - İşlem tamamlandıktan sonra Proton VPN\'i yeniden başlatmanız gerekecektir.',
        savePrompt: '\nDeğişiklikleri Proton VPN ayarlarına kaydetmek istiyor musunuz? (E) Evet / (H) Hayır: ',
        success: (n) => `\n✓ İşlem başarılı! ${n} yeni öğe eklendi.`,
        undoInfo: (dir, file) => `\n  İşlemi geri almak isterseniz:\n  "${path.join(dir, file)}" dosyasını silin ve Proton VPN'i yeniden başlatın.\n  (Giriş bilgileriniz hariç diğer ayarlarınız sıfırlanacaktır.)`,
        saveCancelled: '\nKaydetme işlemi iptal edildi.',
        noNewGames: '\nOyun kütüphanesinden eklenecek yeni oyun bulunamadı. Liste zaten güncel.',
        reopenVpnPrompt: '\nProton VPN\'i şimdi açmak ister misiniz? (E) Evet / (H) Hayır: ',
        openingVpn: '\nProton VPN açılıyor...',
        vpnOpenedSuccess: '\n✓ Proton VPN başarıyla açıldı.\n',
        error: (msg) => `\n✗ Hata: ${msg}`,
        pressAnyKey: '\nÇıkmak için herhangi bir tuşa basınız...',
    },
    en: {
        title: '--- Proton VPN Game Excluder ---',
        langSelect: '\nPlease select language / Lütfen dil seçiniz:\n  [1] Türkçe\n  [2] English\n',
        langPrompt: 'Your choice / Seçiminiz (1/2): ',
        steamPathPrompt: (def) => `\nEnter game library path (Default: ${def}): `,
        aboutToDoTitle: '\nThis application will:',
        step1: (p) => `  1. Scan your game library (${p}) to find game (.exe) files.`,
        step2: '  2. Read your Proton VPN settings (AppData) and add games to the Split Tunneling list.',
        step3: '  3. Show the number of games found and ask for your final confirmation before any changes.',
        vpnRunningDetected: '\n⚠️  Proton VPN is currently running. It must be closed for\n   changes to be applied correctly.',
        closeVpnPermission: 'Close Proton VPN now? (Y) Yes / (N) No: ',
        closingVpn: '\nClosing Proton VPN...',
        vpnClosed: '✓ Proton VPN has been closed.\n',
        closeVpnDenied: '\nOperation cancelled. Proton VPN must be closed to continue.',
        vpnNotRunning: '\n✓ Proton VPN is not running. Continuing...\n',
        consentPrompt: '\nDo you consent to start the scan and access files? (Y) Yes / (N) No: ',
        cancelled: '\nOperation cancelled. No files were accessed.',
        scanning: '\nScanning files, please wait...',
        errNoProtonFolder: '\nError: Proton VPN folder not found! Make sure the application is installed.',
        errNoSettingsFile: '\nError: UserSettings file not found!',
        scanComplete: '\nScan Complete:',
        foundCount: (n) => `  Found ${n} new game/exe file(s) in your game library.`,
        notesTitle: '\nImportant Notes:',
        note1: '  - Multiple exe files per game may appear in the Proton VPN Split Tunneling menu.',
        note2: '  - You must restart Proton VPN after the operation completes.',
        savePrompt: '\nDo you want to save the changes to Proton VPN settings? (Y) Yes / (N) No: ',
        success: (n) => `\n✓ Success! ${n} new game(s)/exe(s) added.`,
        undoInfo: (dir, file) => `\n  To undo all changes:\n  Delete "${path.join(dir, file)}" and restart Proton VPN.\n  (All settings except your login credentials will be reset.)`,
        saveCancelled: '\nSave operation cancelled.',
        noNewGames: '\nNo new games found to add. The list is already up to date.',
        reopenVpnPrompt: '\nWould you like to open Proton VPN now? (Y) Yes / (N) No: ',
        openingVpn: '\nOpening Proton VPN...',
        vpnOpenedSuccess: '\n✓ Proton VPN successfully opened.\n',
        error: (msg) => `\n✗ Error: ${msg}`,
        pressAnyKey: '\nPress any key to exit...',
    }
};

// ─── PROTONVPN PROCESS UTILITIES ──────────────────────────────────────────────
// ProtonVPN runs as "ProtonVPN.Client.exe" (UI) and "ProtonVPNService.exe" (service)
function isProtonVpnRunning() {
    // Method 1: tasklist full dump — fastest, no locale issues
    try {
        const result = execSync('tasklist /NH', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 6000
        });
        const lower = result.toLowerCase();
        if (lower.includes('protonvpn.client') || lower.includes('protonvpnservice')) {
            return true;
        }
    } catch {}

    // Method 2: PowerShell wildcard match — text output, no exit code dependency
    try {
        const result = execSync(
            'powershell -NoProfile -NonInteractive -Command "Get-Process -Name ProtonVPN* -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name"',
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 8000 }
        );
        if (result.trim().length > 0) return true;
    } catch {}

    // Method 3: WMIC fallback
    try {
        const result = execSync(
            'wmic process where "name like \'%ProtonVPN%\'" get name /format:list',
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 6000 }
        );
        if (result.toLowerCase().includes('protonvpn')) return true;
    } catch {}

    return false;
}

function killProtonVpn() {
    const targets = ['ProtonVPN.Client.exe', 'ProtonVPNService.exe', 'ProtonVPN.exe'];
    for (const name of targets) {
        try {
            execSync(`taskkill /F /IM "${name}"`, { stdio: ['pipe', 'pipe', 'pipe'] });
        } catch {
            // not found under this name — safe to ignore
        }
    }
}

function findProtonVpnExe() {
    const baseDirs = [
        'C:\\Program Files\\Proton\\VPN',
        'C:\\Program Files (x86)\\Proton\\VPN',
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Proton', 'VPN'),
    ];

    for (const dir of baseDirs) {
        if (!fs.existsSync(dir)) continue;

        // Prefer the Launcher (stable path, always up to date)
        const launcher = path.join(dir, 'ProtonVPN.Launcher.exe');
        if (fs.existsSync(launcher)) return launcher;

        // Versioned sub-folders (e.g. v4.3.14) — pick the newest
        try {
            const entries = fs.readdirSync(dir).sort().reverse();
            for (const entry of entries) {
                const client = path.join(dir, entry, 'ProtonVPN.Client.exe');
                if (fs.existsSync(client)) return client;
                // Legacy name fallback
                const legacy = path.join(dir, entry, 'ProtonVPN.exe');
                if (fs.existsSync(legacy)) return legacy;
            }
        } catch {}
    }
    return null;
}

function detectDefaultLang() {
    try {
        const locale = Intl.DateTimeFormat().resolvedOptions().locale;
        return locale.toLowerCase().startsWith('tr') ? 'tr' : 'en';
    } catch {
        return 'en';
    }
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────
async function printDelayed(text) {
    if (text !== undefined) console.log(text);
    await new Promise(r => setTimeout(r, 500));
}

async function fakeLoadingBar(durationMs = 1800, width = 30) {
    const steps = width;
    const stepMs = Math.floor(durationMs / steps);
    process.stdout.write(' [');
    for (let i = 0; i < steps; i++) {
        await new Promise(r => setTimeout(r, stepMs));
        process.stdout.write('█');
    }
    process.stdout.write('] ✓\n');
}

async function waitForProtonVpnUI(timeoutMs = 15000) {
    const startTime = Date.now();
    // Start polling to see if ProtonVPN.Client has a MainWindowHandle > 0
    while (Date.now() - startTime < timeoutMs) {
        try {
            execSync(
                'powershell -NoProfile -NonInteractive -Command "if ((Get-Process ProtonVPN.Client -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowHandle -ne 0}).Count -gt 0) { exit 0 } else { exit 1 }"',
                { stdio: ['pipe', 'pipe', 'pipe'], timeout: 2000 }
            );
            return true; // Window handle found, UI is loaded
        } catch (e) {
            // Not ready yet
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    return false; // Timed out
}

// ─── PRESS ANY KEY ────────────────────────────────────────────────────────────
async function pressAnyKey(message) {
    process.stdout.write(message);
    return new Promise(resolve => {
        const handler = () => {
            if (process.stdin.isTTY) process.stdin.setRawMode(false);
            process.stdin.pause();
            resolve();
        };
        if (process.stdin.isTTY) process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', handler);
    });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
    const rl = readline.createInterface({ input, output });
    const defaultLang = detectDefaultLang();
    let t = STRINGS[defaultLang];

    const done = async (isError = false) => {
        rl.close();
        await pressAnyKey(t.pressAnyKey);
        process.exit(isError ? 1 : 0);
    };

    try {
        await printDelayed(`\n${t.title}`);

        await printDelayed(t.langSelect);
        const langChoice = (await rl.question(t.langPrompt)).trim();
        if (langChoice === '1') t = STRINGS.tr;
        else if (langChoice === '2') t = STRINGS.en;

        const DEFAULT_STEAM_PATH = 'C:/Program Files (x86)/Steam/steamapps/common';
        const steamappsPathInput = await rl.question(t.steamPathPrompt(DEFAULT_STEAM_PATH));
        const steamappsPath = steamappsPathInput.trim() || DEFAULT_STEAM_PATH;

        let vpnWasRunning = false;
        if (isProtonVpnRunning()) {
            vpnWasRunning = true;
            await printDelayed(t.vpnRunningDetected);
            const closeConsent = (await rl.question(t.closeVpnPermission)).toLowerCase().trim();
            if (!['y', 'yes', 'e', 'evet'].includes(closeConsent)) {
                await printDelayed(t.closeVpnDenied);
                return await done();
            }
            process.stdout.write(t.closingVpn);
            await fakeLoadingBar(2000);
            killProtonVpn();
            await new Promise(r => setTimeout(r, 1500));
            await printDelayed(t.vpnClosed);
        } else {
            await printDelayed(t.vpnNotRunning);
        }

        await printDelayed(t.aboutToDoTitle);
        await printDelayed(t.step1(steamappsPath));
        await printDelayed(t.step2);
        await printDelayed(t.step3);

        const initialConsent = (await rl.question(t.consentPrompt)).toLowerCase().trim();
        if (!['y', 'yes', 'e', 'evet'].includes(initialConsent)) {
            await printDelayed(t.cancelled);
            return await done();
        }
        await fakeLoadingBar(1200);

        await printDelayed(t.scanning);

        const localAppData = process.env.LOCALAPPDATA;
        const storageDir = path.join(localAppData, 'proton', 'Proton VPN', 'Storage');

        if (!fs.existsSync(storageDir)) {
            console.error(t.error(t.errNoProtonFolder));
            return await done(true);
        }

        const dirFiles = fs.readdirSync(storageDir);
        const settingsFile = dirFiles.find(f => f.startsWith('UserSettings.') && f.endsWith('.json'));

        if (!settingsFile) {
            console.error(t.error(t.errNoSettingsFile));
            return await done(true);
        }

        const settingsPath = path.join(storageDir, settingsFile);

        const steamExePaths = await glob(`${steamappsPath}/**/*.exe`, {
            windowsPathsNoEscape: true
        });

        const rawData = fs.readFileSync(settingsPath, 'utf8');
        let settingsData = JSON.parse(rawData);

        let appsList = [];
        if (settingsData.SplitTunnelingStandardAppsList) {
            appsList = JSON.parse(settingsData.SplitTunnelingStandardAppsList);
        }
        settingsData.IsSplitTunnelingEnabled = 'true';

        const existingPaths = new Set(appsList.map(app => app.AppFilePath.toLowerCase()));
        const newApps = [];

        for (const exePath of steamExePaths) {
            const normalizedPath = path.normalize(exePath);
            if (!existingPaths.has(normalizedPath.toLowerCase())) {
                newApps.push({ AppFilePath: normalizedPath, AlternateAppFilePaths: [], IsActive: true });
            }
        }

        const addedCount = newApps.length;

        if (addedCount > 0) {
            await printDelayed(t.scanComplete);
            await printDelayed(t.foundCount(addedCount));
            await printDelayed(t.notesTitle);
            await printDelayed(t.note1);
            await printDelayed(t.note2);

            const finalConsent = (await rl.question(t.savePrompt)).toLowerCase().trim();
            if (['y', 'yes', 'e', 'evet'].includes(finalConsent)) {
                await fakeLoadingBar(1500);
                appsList.push(...newApps);
                settingsData.SplitTunnelingStandardAppsList = JSON.stringify(appsList);
                fs.writeFileSync(settingsPath, JSON.stringify(settingsData, null, 2), 'utf8');
                await printDelayed(t.success(addedCount));
                await printDelayed(t.undoInfo(storageDir, settingsFile));
            } else {
                await printDelayed(t.saveCancelled);
            }
        } else {
            await printDelayed(t.noNewGames);
        }

        // ── Reopen ProtonVPN ─────────────────────────────────────────────────────
        const vpnExe = findProtonVpnExe();
        if (vpnExe) {
            const reopenAnswer = (await rl.question(t.reopenVpnPrompt)).toLowerCase().trim();
            if (['y', 'yes', 'e', 'evet'].includes(reopenAnswer)) {
                process.stdout.write(t.openingVpn);
                await fakeLoadingBar(19000);
                
                spawn(vpnExe, [], { detached: true, stdio: 'ignore' }).unref();
                
                const isLoaded = await waitForProtonVpnUI(20000);
                if (isLoaded) {
                    await printDelayed(t.vpnOpenedSuccess);
                }
                
                rl.close();
                process.exit(0);
            }
        }

        await done();
    } catch (error) {
        console.error(t.error(error.message));
        await done(true);
    }
}

main();
