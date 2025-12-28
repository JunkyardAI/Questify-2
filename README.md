Questify ⚔️Questify is a gamified productivity dashboard that turns your daily to-do list into an RPG adventure. Earn XP, level up, and maintain "Combo Streaks" by completing tasks.Status: Open Source (v1.0.0-OSS)🎮 Key FeaturesGamification: Earn XP for every task. High priority tasks grant more rewards.Quest Board: A visual, drag-and-drop kanban board for managing tasks spacially.Combo System: Complete tasks in quick succession to earn XP multipliers.Audio Engine: Built-in 8-bit sound synthesizer (no external assets needed).Zen Mode: A relaxed mode with no timers for anxiety-free productivity.Passive Quests: The app acts as a Dungeon Master, occasionally spawning wellness side-quests.100% Client-Side: All data is stored in LocalStorage. No server required.📂 Project StructureThis project uses a Modular Single-Page Architecture designed for stability and zero-build deployment.Questify/

├── index.html              # Main Entry Point (Shell)

├── src/

│   ├── styles/

│   │   └── main.css        # CSS (Extracted from styles)

│   └── scripts/

│       ├── utils.js        # Audio Engine \& Helpers

│       ├── constants.js    # Config \& Static Data

│       ├── components.js   # React UI Components

│       └── app.js          # Core Logic \& Mount

└── README.md

Developer NoteTo preserve the runtime stability of this application without a build step (Webpack/Vite), we use Namespaced Globals.Do not use import/export statements (ES Modules are not used to maintain broad compatibility).Components are attached to window (e.g., window.Sidebar) in components.js.Configuration is attached to window (e.g., window.PRIORITIES) in constants.js.🚀 Quick StartClone the repogit clone \[https://github.com/YOUR\_USERNAME/Questify.git](https://github.com/YOUR\_USERNAME/Questify.git)

Run itSimply open index.html in your browser. No npm install required!🤝 ContributingWe welcome forks and mods! Ideas for contributions:Boss Battles: A large task composed of many subtasks that has a "health bar."Inventory System: Earn "gold" to buy virtual items or themes.Pomodoro Timer: Integrate a focus timer directly into the UI.📄 LicenseQuestify is open source software licensed under the MIT License.

