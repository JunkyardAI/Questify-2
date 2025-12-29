const { useReducer, useState, useRef, useEffect } = React;

function appReducer(state, action) {
    switch (action.type) {
        case 'LOAD_DATA': return { ...state, ...action.payload };
        
        case 'ADD_TASK': return { ...state, tasks: [action.payload, ...state.tasks] };
        
        case 'UPDATE_TASK': {
            const { id, updates } = action.payload;
            return {
                ...state,
                tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
            };
        }

        case 'MOVE_TASK': {
            const { id, x, y } = action.payload;
            return {
                ...state,
                tasks: state.tasks.map(t => t.id === id ? { ...t, position: { x, y } } : t)
            };
        }

        case 'DELETE_TASK': return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
        
        case 'TOGGLE_TASK': {
            const task = state.tasks.find(t => t.id === action.payload);
            if (!task) return state;
            const isCompleting = !task.completed;
            
            let newXp = state.user.xp;
            let newLevel = state.user.level;
            let newCombo = { ...state.combo };
            let effect = null;

            if (isCompleting) {
                // Combo Logic
                const now = Date.now();
                const timeDiff = now - state.combo.lastCompletion;
                const windowSize = window.DIFFICULTY_SETTINGS[state.settings.difficulty].window;
                
                if (timeDiff < windowSize) {
                    newCombo.count += 1;
                } else {
                    newCombo.count = 1; // Reset or start
                }
                newCombo.lastCompletion = now;

                // XP Calc
                const priorityMult = window.PRIORITIES[task.priority]?.xpMult || 1;
                const comboMult = 1 + ((newCombo.count - 1) * 0.1); // +10% per combo
                const totalXpGain = Math.floor(task.xpReward * priorityMult * comboMult);
                
                newXp += totalXpGain;
                effect = { type: 'COMPLETE', xpGained: totalXpGain, combo: newCombo.count };
            } else {
                // Removing XP penalty & Reverting Combo to prevent farming
                const priorityMult = window.PRIORITIES[task.priority]?.xpMult || 1;
                
                const currentMult = newCombo.count > 0 ? (1 + ((newCombo.count - 1) * 0.1)) : 1;
                const totalRemove = Math.floor(task.xpReward * priorityMult * currentMult);
                
                newXp = newXp - totalRemove;
                
                if (newCombo.count > 0) {
                    newCombo.count--;
                }
            }
            
            // Level Logic
            while (newXp >= newLevel * 1000) {
                newXp -= newLevel * 1000;
                newLevel++;
                effect = { type: 'LEVEL_UP', level: newLevel };
            }

            while (newXp < 0 && newLevel > 1) {
                newLevel--;
                newXp += newLevel * 1000;
            }
            
            if (newLevel === 1 && newXp < 0) {
                newXp = 0;
            }

            return {
                ...state,
                tasks: state.tasks.map(t => t.id === action.payload ? { ...t, completed: isCompleting } : t),
                user: { ...state.user, xp: newXp, level: newLevel },
                combo: newCombo,
                lastEffect: effect
            };
        }

        case 'ADD_SUBTASK': {
            const { taskId, title } = action.payload;
            return {
                ...state,
                tasks: state.tasks.map(t => t.id === taskId ? { 
                    ...t, 
                    subtasks: [...t.subtasks, { id: window.generateId(), title, completed: false }] 
                } : t)
            };
        }

        case 'TOGGLE_SUBTASK': {
            const { taskId, subtaskId } = action.payload;
            return {
                ...state,
                tasks: state.tasks.map(t => {
                    if (t.id === taskId) {
                        return {
                            ...t,
                            subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
                        };
                    }
                    return t;
                })
            };
        }

        case 'SET_FOLDER': return { ...state, activeFolderId: action.payload };
        case 'ADD_FOLDER': return { ...state, folders: [...state.folders, action.payload] };
        case 'SET_VIEW': return { ...state, view: action.payload };
        case 'CLEAR_EFFECT': return { ...state, lastEffect: null };
        
        case 'UPDATE_SETTINGS': return { ...state, settings: { ...state.settings, ...action.payload } };

        case 'SPAWN_SIDE_QUEST': {
            const questTemplate = window.SIDE_QUESTS[Math.floor(Math.random() * window.SIDE_QUESTS.length)];
            const newQuest = {
                id: window.generateId(),
                title: `[Side Quest] ${questTemplate.title}`,
                folderId: 'inbox',
                completed: false,
                priority: 'MEDIUM',
                xpReward: questTemplate.xp,
                subtasks: [],
                createdAt: Date.now(),
                dueDate: null,
                position: window.getRandomPos(),
                isSideQuest: true
            };
            return {
                ...state,
                tasks: [newQuest, ...state.tasks],
                spawner: { ...state.spawner, lastSpawn: Date.now() },
                lastEffect: { type: 'SPAWN', title: newQuest.title }
            };
        }

        case 'APPLY_TEMPLATE': {
            // Legacy support
            const newTasks = action.payload.map(t => ({
                ...t, 
                id: window.generateId(), 
                folderId: state.activeFolderId, 
                subtasks: t.subtasks || [],
                createdAt: Date.now(),
                dueDate: null,
                position: window.getRandomPos()
            }));
            return { ...state, tasks: [...newTasks, ...state.tasks] };
        }

        // --- BLUEPRINT ACTIONS ---
        case 'SAVE_BLUEPRINT': {
            const { name, tasks } = action.payload;
            // Sanitize tasks for blueprint (remove IDs, dates, completion status)
            const blueprintTasks = tasks.map(t => ({
                title: t.title,
                priority: t.priority,
                xpReward: t.xpReward,
                subtasks: t.subtasks.map(st => ({ title: st.title, completed: false }))
            }));
            
            const newBlueprint = {
                id: window.generateId(),
                name: name,
                description: `Created on ${new Date().toLocaleDateString()}`,
                tasks: blueprintTasks
            };
            
            return { ...state, blueprints: [...(state.blueprints || []), newBlueprint] };
        }

        case 'DELETE_BLUEPRINT': {
            return { ...state, blueprints: state.blueprints.filter(bp => bp.id !== action.payload) };
        }

        case 'IMPORT_BLUEPRINT': {
            const bp = action.payload;
            // Basic validation
            if (!bp.name || !bp.tasks) return state;
            
            // Assign new ID to avoid collisions
            const importedBp = { ...bp, id: window.generateId() };
            return { ...state, blueprints: [...(state.blueprints || []), importedBp] };
        }

        case 'APPLY_BLUEPRINT': {
            const blueprint = state.blueprints.find(bp => bp.id === action.payload);
            if (!blueprint) return state;

            const newTasks = blueprint.tasks.map(t => ({
                id: window.generateId(),
                title: t.title,
                folderId: state.activeFolderId,
                completed: false,
                priority: t.priority || 'MEDIUM',
                xpReward: t.xpReward || 100,
                subtasks: t.subtasks ? t.subtasks.map(st => ({ ...st, id: window.generateId(), completed: false })) : [],
                createdAt: Date.now(),
                dueDate: null,
                position: window.getRandomPos()
            }));

            return { ...state, tasks: [...newTasks, ...state.tasks] };
        }

        default: return state;
    }
}

const App = () => {
    const [state, dispatch] = useReducer(appReducer, window.INITIAL_STATE, (init) => {
        const saved = localStorage.getItem('questify_v4');
        return saved ? JSON.parse(saved) : init;
    });

    useEffect(() => {
        localStorage.setItem('questify_v4', JSON.stringify(state));
    }, [state]);

    const [levelModal, setLevelModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const prevLevel = useRef(state.user.level);

    // Effect Handler (Sounds, Notifications, Modals)
    useEffect(() => {
        if (state.lastEffect) {
            const { type, xpGained, combo } = state.lastEffect;

            if (state.settings.soundEnabled) {
                if (type === 'COMPLETE') window.playSynthSound('complete');
                else if (type === 'LEVEL_UP') window.playSynthSound('levelUp');
                else if (type === 'SPAWN') window.playSynthSound('notify');
            }

            if (type === 'LEVEL_UP') {
                setLevelModal(true);
                setTimeout(() => setLevelModal(false), 3000);
            }
            else if (type === 'SPAWN') {
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("New Side Quest!", {
                        body: state.lastEffect.title,
                        icon: "https://cdn.jsdelivr.net/npm/lucide-static@0.16.29/icons/scroll.svg"
                    });
                }
            }

            // Clear effect to prevent replay
            dispatch({ type: 'CLEAR_EFFECT' });
        }
    }, [state.lastEffect, state.settings.soundEnabled]);

    // Auto-Spawner Interval (Passive Quests)
    useEffect(() => {
        const spawnerInterval = setInterval(() => {
            const now = Date.now();
            const { lastSpawn } = state.spawner;
            
            const activeSideQuests = state.tasks.filter(t => t.isSideQuest && !t.completed).length;

            if (now - lastSpawn > window.SPAWN_COOLDOWN_MS && activeSideQuests < 3) {
                dispatch({ type: 'SPAWN_SIDE_QUEST' });
            }

        }, 60000); 

        return () => clearInterval(spawnerInterval);
    }, [state.spawner, state.tasks]);

    return (
        <div className="h-screen w-screen flex bg-discord-darkest overflow-hidden relative">
            {levelModal && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none backdrop-blur-sm bg-black/40">
                    <div className="animate-level-up bg-discord-blurple p-8 rounded-3xl shadow-2xl border-4 border-white/20 text-center transform rotate-2">
                        <div className="text-6xl mb-2 animate-bounce">👑</div>
                        <h1 className="text-5xl font-black text-white italic drop-shadow-md">LEVEL UP!</h1>
                        <p className="text-xl text-white/90 font-bold mt-2">Welcome to Level {state.user.level}</p>
                    </div>
                </div>
            )}

            {showSettings && <SettingsModal state={state} dispatch={dispatch} onClose={() => setShowSettings(false)} />}

            {state.view === 'board' ? (
                <DashboardBoard state={state} dispatch={dispatch} />
            ) : (
                <>
                    <Sidebar state={state} dispatch={dispatch} onOpenSettings={() => setShowSettings(true)} />
                    <MainView state={state} dispatch={dispatch} />
                </>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
