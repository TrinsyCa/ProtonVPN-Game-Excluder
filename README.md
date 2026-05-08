# ProtonVPN Game Excluder 🛡️🎮

ProtonVPN Game Excluder is a specialized utility tool designed for gamers who use ProtonVPN. It automatically scans your Steam library and adds all game executables (.exe) to the ProtonVPN **Split Tunneling** list. 

This ensures your games bypass the VPN tunnel, providing you with the lowest possible ping while keeping the rest of your internet traffic secure and encrypted.

---

## 🌟 For Users (Easy Start)

### Why should I use this?
When playing competitive games like *Counter-Strike 2*, *VALORANT*, or *League of Legends*, using a VPN can often increase your "ping" (latency). Usually, you have to manually add every single game to ProtonVPN's "Split Tunneling" settings. If you have many games, this is a tedious process. This tool does it all for you in seconds.

### How to Use:
1. **Download:** Get the latest version of the tool [from this link](https://file.trinsy.ca/8151a3f7-c6cb-4cb2).
2. **Close ProtonVPN:** Ensure ProtonVPN is completely closed (not running in the system tray).
3. **Run the EXE:** Launch `ProtonVPN-Game-Excluder.exe`.
4. **Follow Prompts:** The tool will ask for permission to scan your Steam folder and update your settings.
5. **Restart:** Once finished, open ProtonVPN and enjoy your low-ping gaming!

---

## 👨‍💻 For Developers (Technical Details)

### How it Works
The application interacts with the local storage of the ProtonVPN Windows client. ProtonVPN stores its configurations (including the Split Tunneling whitelist) in a hashed JSON file located in `%LOCALAPPDATA%\proton\Proton VPN\Storage\`.

The script performs the following operations:
- **Dynamic File Discovery:** It automatically identifies the correct `UserSettings.[HASH].json` file without requiring a hardcoded filename or username.
- **Deep Scanning:** Uses the `glob` pattern to recursively find all `.exe` files within the Steam `common` directory.
- **JSON Manipulation:** Parses the `SplitTunnelingStandardAppsList` string (which is stored as an escaped string within the main JSON) into a JavaScript array.
- **Duplicate Prevention:** Compares found executables with the existing list using a `Set` for O(1) lookup performance to prevent redundant entries.
- **WFP Integration:** By updating the JSON, it ensures the Windows Filtering Platform (WFP) drivers used by ProtonVPN correctly route the game traffic outside the encrypted tunnel.

### Tech Stack
- **Environment:** Node.js
- **Libraries:** `glob` (file pattern matching), `readline` (CLI interaction), `fs` & `path` (file system operations).

### Running from Source
If you want to run or build the project yourself:

1. **Clone the repo:**
   ```bash
   git clone https://github.com/TrinsyCa/ProtonVPN-Game-Excluder.git
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the script**
   ```bash
   node protonvpn-exclude-games.js
   ```

## 📜 License
This project is licensed under the MIT License. You are free to use, modify, and distribute it as long as the original license and copyright notice are included.

## ⚠️ Disclaimer
This is an independent open-source project and is not officially affiliated with Proton AG or Steam (Valve Corporation). Use it at your own risk. Always back up your configuration files if you are concerned about data loss.
