window.APP_VERSION = "1.0.0-OSS";

window.SIDE_QUESTS = [
    { title: "Drop and give me 20 (Pushups)", xp: 150, type: "FITNESS" },
    { title: "Hydrate: Drink a glass of water", xp: 50, type: "HEALTH" },
    { title: "Mindfulness: 5 min meditation", xp: 200, type: "MENTAL" },
    { title: "Read 5 pages of a book", xp: 150, type: "INTELLECT" },
    { title: "Stretch your back", xp: 50, type: "HEALTH" },
    { title: "Declutter desk surface", xp: 100, type: "ORG" }
];

window.PRIORITIES = {
    LOW: { value: 1, label: 'Low', color: 'text-gray-400', border: 'border-gray-500', bg: 'bg-gray-500', xpMult: 1 },
    MEDIUM: { value: 2, label: 'Medium', color: 'text-discord-yellow', border: 'border-discord-yellow', bg: 'bg-discord-yellow', xpMult: 1.5 },
    HIGH: { value: 3, label: 'High', color: 'text-orange-400', border: 'border-orange-400', bg: 'bg-orange-400', xpMult: 2 },
    CRITICAL: { value: 4, label: 'Critical', color: 'text-discord-red', border: 'border-discord-red', bg: 'bg-discord-red', xpMult: 3 }
};

window.DIFFICULTY_SETTINGS = {
    BLITZ: { label: 'Blitz (Hard)', window: 2 * 60 * 1000, desc: '2 min combo window. High intensity.' },
    STANDARD: { label: 'Standard', window: 5 * 60 * 1000, desc: '5 min combo window. Balanced.' },
    COZY: { label: 'Cozy', window: 15 * 60 * 1000, desc: '15 min combo window. Relaxed.' },
    ZEN: { label: 'Zen', window: Infinity, desc: 'No timer. Combos never expire.' }
};

window.SPAWN_COOLDOWN_MS = 8 * 60 * 60 * 1000; // 8 hours

window.INITIAL_STATE = {
    user: { xp: 0, level: 1, name: "Task Master" },
    view: 'full', // 'full' or 'board'
    activeFolderId: 'inbox',
    settings: {
        soundEnabled: true,
        difficulty: 'STANDARD'
    },
    tasks: [
        { id: 't1', title: 'Welcome to Questify', folderId: 'inbox', completed: false, priority: 'HIGH', xpReward: 100, subtasks: [], createdAt: Date.now(), dueDate: null, position: {x: 100, y: 100} },
    ],
    folders: [
        { id: 'inbox', name: 'Inbox', icon: 'inbox', type: 'system' },
        { id: 'quest_log', name: 'Quest Log', icon: 'scroll', type: 'system' },
        { id: 'dailies', name: 'Daily Rituals', icon: 'repeat', type: 'system' }
    ],
    combo: { count: 0, lastCompletion: 0 },
    spawner: { lastSpawn: Date.now(), activeSideQuests: 0 },
    lastEffect: null
};