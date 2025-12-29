const { useState, useEffect, useRef } = React;

// --- Icon Wrapper ---
window.Icon = React.memo(({ name, size = 20, className = "" }) => {
    const containerRef = useRef(null);
    useEffect(() => {
        if (window.lucide && containerRef.current) {
            window.lucide.createIcons({
                root: containerRef.current,
                nameAttrs: { 'data-lucide': name },
                attrs: { width: size, height: size, class: className }
            });
        }
    }, [name, size, className]);

    return (
        <span ref={containerRef} className={`flex items-center justify-center shrink-0 pointer-events-none ${className}`}>
            <i data-lucide={name}></i>
        </span>
    );
});

// --- DraggableTaskCard ---
window.DraggableTaskCard = React.memo(({ task, dispatch, zIndex, onFocus }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editPriority, setEditPriority] = useState(task.priority);
    
    const cardRef = useRef(null);
    const offset = useRef({ x: 0, y: 0 });
    const currentPos = useRef(task.position || { x: 50, y: 50 });

    useEffect(() => {
        if (cardRef.current) {
            cardRef.current.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y}px)`;
        }
    }, []);

    useEffect(() => {
            if (!isDragging && task.position) {
            currentPos.current = task.position;
            if(cardRef.current) {
                cardRef.current.style.transform = `translate(${task.position.x}px, ${task.position.y}px)`;
            }
            }
    }, [task.position, isDragging]);

    const handlePointerDown = (e) => {
        if (isEditing) return;
        e.stopPropagation();
        onFocus();
        setIsDragging(true);
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        offset.current = { x: clientX - currentPos.current.x, y: clientY - currentPos.current.y };
    };

    useEffect(() => {
        const handlePointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            currentPos.current = { x: clientX - offset.current.x, y: clientY - offset.current.y };
            if (cardRef.current) {
                cardRef.current.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y}px)`;
            }
        };
        const handlePointerUp = () => {
            if (isDragging) {
                setIsDragging(false);
                dispatch({ type: 'MOVE_TASK', payload: { id: task.id, ...currentPos.current } });
            }
        };
        if (isDragging) {
            window.addEventListener('mousemove', handlePointerMove);
            window.addEventListener('mouseup', handlePointerUp);
            window.addEventListener('touchmove', handlePointerMove, { passive: false });
            window.addEventListener('touchend', handlePointerUp);
        }
        return () => {
            window.removeEventListener('mousemove', handlePointerMove);
            window.removeEventListener('mouseup', handlePointerUp);
            window.removeEventListener('touchmove', handlePointerMove);
            window.removeEventListener('touchend', handlePointerUp);
        };
    }, [isDragging, dispatch, task.id]);

    const saveEdit = () => {
        dispatch({
            type: 'UPDATE_TASK',
            payload: { id: task.id, updates: { title: editTitle, priority: editPriority } }
        });
        setIsEditing(false);
    };

    const priorityStyle = window.PRIORITIES[task.priority];

    return (
        <div 
            ref={cardRef}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            style={{ zIndex }}
            className={`absolute w-64 flex flex-col hardware-accelerated rounded-lg shadow-xl border ${priorityStyle.border} bg-discord-darker transition-shadow duration-200 ${isDragging ? 'shadow-2xl cursor-grabbing' : 'cursor-grab'} ${task.completed ? 'opacity-50' : ''}`}
        >
            <div className={`h-2 w-full rounded-t-lg ${priorityStyle.bg}`}></div>
            <div className="p-3">
                {isEditing ? (
                    <div className="flex flex-col gap-2">
                        <input autoFocus className="bg-discord-darkest text-white p-1 rounded border border-discord-blurple text-sm w-full outline-none" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit()} />
                        <select className="bg-discord-darkest text-xs text-gray-300 p-1 rounded outline-none" value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                            {Object.entries(window.PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <div className="flex justify-end gap-2 mt-1">
                            <button onClick={() => setIsEditing(false)} className="text-xs text-gray-400 hover:text-white">Cancel</button>
                            <button onClick={saveEdit} className="text-xs bg-discord-blurple text-white px-2 py-1 rounded">Save</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); dispatch({type: 'TOGGLE_TASK', payload: task.id}); }} className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-discord-green border-discord-green' : 'border-gray-500 hover:border-discord-blurple'}`}>
                                    {task.completed && <Icon name="check" size={10} className="text-white" />}
                                </button>
                                <span className="text-xs font-bold text-gray-400">{priorityStyle.label}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="text-gray-400 hover:text-white"><Icon name="pencil" size={12}/></button>
                            </div>
                        </div>
                        <p onDoubleClick={() => setIsEditing(true)} className={`text-sm font-medium mb-2 break-words ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                            {task.title}
                        </p>
                    </>
                )}
                <div className="flex justify-between items-center mt-2 border-t border-discord-darkest pt-2">
                    <span className="text-[10px] text-discord-yellow flex items-center gap-1">
                        <Icon name="zap" size={10} /> {task.xpReward} XP
                    </span>
                    {task.dueDate && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Icon name="calendar" size={10} /> {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); dispatch({type: 'DELETE_TASK', payload: task.id}); }} className="text-gray-500 hover:text-discord-red">
                        <Icon name="trash-2" size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
});

// --- ComboMeter ---
window.ComboMeter = ({ combo, difficulty }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const difficultyConfig = window.DIFFICULTY_SETTINGS[difficulty];
    const isZen = difficulty === 'ZEN';

    useEffect(() => {
        if (!combo.lastCompletion || isZen) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = now - combo.lastCompletion;
            const remaining = Math.max(0, difficultyConfig.window - diff);
            setTimeLeft(remaining);

            if (remaining === 0 && combo.count > 0) {
                // Visual reset implied
            }
        }, 100);

        return () => clearInterval(interval);
    }, [combo.lastCompletion, difficultyConfig.window, isZen]);

    if (combo.count <= 1 && !isZen) return null;
    if (isZen && combo.count <= 1) return null;

    const percent = isZen ? 100 : Math.min(100, (timeLeft / difficultyConfig.window) * 100);
    
    // Color logic based on time left
    let barColor = 'bg-discord-blurple';
    if (!isZen) {
        if (percent < 25) barColor = 'bg-red-500';
        else if (percent < 50) barColor = 'bg-yellow-500';
    }

    return (
        <div className="flex flex-col items-end animate-combo min-w-[100px]">
            <div className="text-2xl font-black italic text-discord-yellow tracking-tighter leading-none">
                {combo.count}x COMBO
            </div>
            {!isZen && (
                <div className="w-full h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full ${barColor} transition-all duration-100 ease-linear`} style={{ width: `${percent}%` }}></div>
                </div>
            )}
            {isZen && (
                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">ZEN MODE</div>
            )}
        </div>
    );
};

// --- DashboardBoard ---
window.DashboardBoard = ({ state, dispatch }) => {
    const [focusedId, setFocusedId] = useState(null);
    const { useMemo } = React;
    
    const activeTasks = useMemo(() => state.tasks.filter(t => t.folderId === state.activeFolderId), [state.tasks, state.activeFolderId]);
    const activeFolder = state.folders.find(f => f.id === state.activeFolderId) || state.folders[0];

    return (
        <div className="fixed inset-0 z-40 bg-discord-darkest dots-pattern overflow-hidden flex flex-col">
            <div className="h-14 bg-discord-darker border-b border-discord-light flex items-center justify-between px-4 z-50 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="bg-discord-blurple p-1.5 rounded text-white">
                        <Icon name="layout-dashboard" size={18} />
                    </div>
                    <div>
                        <h1 className="font-bold text-white leading-tight">Quest Board</h1>
                        <p className="text-xs text-gray-400">{activeFolder.name} Realm</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <ComboMeter combo={state.combo} difficulty={state.settings.difficulty} />
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-xs font-bold text-discord-yellow">LVL {state.user.level}</span>
                        <div className="w-24 h-1.5 bg-discord-darkest rounded-full overflow-hidden">
                            <div className="h-full bg-discord-blurple" style={{ width: `${(state.user.xp / (state.user.level * 1000)) * 100}%` }}></div>
                        </div>
                    </div>
                    <button onClick={() => dispatch({type: 'SET_VIEW', payload: 'full'})} className="bg-discord-light hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-all shadow-lg border border-gray-600">
                        <Icon name="list" size={16} /> Return to List
                    </button>
                </div>
            </div>
            <div className="relative flex-1 w-full h-full overflow-hidden touch-none">
                {activeTasks.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-500 pointer-events-none select-none">
                        <Icon name="sticky-note" size={64} className="opacity-20 mb-4" />
                        <p>The board is empty.</p>
                        <p className="text-sm">Switch to List View to add tasks.</p>
                    </div>
                )}
                {activeTasks.map((task) => (
                    <DraggableTaskCard key={task.id} task={task} dispatch={dispatch} zIndex={focusedId === task.id ? 100 : 1} onFocus={() => setFocusedId(task.id)} />
                ))}
            </div>
        </div>
    );
};

// --- GrimoireModal (Blueprints) ---
window.GrimoireModal = ({ state, dispatch, onClose }) => {
    const [view, setView] = useState('list'); // list, create
    const [newBpName, setNewBpName] = useState('');
    const fileInputRef = useRef(null);

    const activeFolder = state.folders.find(f => f.id === state.activeFolderId) || state.folders[0];
    const tasksInFolder = state.tasks.filter(t => t.folderId === state.activeFolderId);

    const handleCreate = () => {
        if(!newBpName.trim()) return;
        dispatch({
            type: 'SAVE_BLUEPRINT',
            payload: { name: newBpName, tasks: tasksInFolder }
        });
        setNewBpName('');
        setView('list');
    };

    const handleApply = (bpId) => {
        dispatch({ type: 'APPLY_BLUEPRINT', payload: bpId });
        onClose();
        alert("Blueprint applied to current folder!");
    };

    const handleExport = (bp) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bp));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `blueprint_${bp.name.replace(/\s+/g, '_')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImportClick = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const fileReader = new FileReader();
        fileReader.readAsText(e.target.files[0], "UTF-8");
        fileReader.onload = e => {
            try {
                const parsed = JSON.parse(e.target.result);
                if(parsed.tasks && Array.isArray(parsed.tasks)) {
                    dispatch({ type: 'IMPORT_BLUEPRINT', payload: parsed });
                    alert("Blueprint imported into Grimoire!");
                } else {
                    alert("Invalid Blueprint file.");
                }
            } catch(err) {
                alert("Error reading file.");
            }
        };
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-discord-dark p-0 rounded-lg shadow-2xl w-[600px] border border-discord-light max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-discord-light flex justify-between items-center bg-discord-darker">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Icon name="book" size={20} className="text-purple-400" /> 
                        Grimoire (Blueprints)
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="x" size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {view === 'list' && (
                        <div className="space-y-4">
                            <div className="flex gap-2 mb-4">
                                <button onClick={() => setView('create')} className="flex-1 bg-discord-blurple hover:bg-indigo-600 text-white py-2 rounded font-bold text-xs flex items-center justify-center gap-2">
                                    <Icon name="plus" size={14} /> Create from Current Folder
                                </button>
                                <button onClick={handleImportClick} className="flex-1 bg-discord-light hover:bg-gray-600 text-white py-2 rounded font-bold text-xs flex items-center justify-center gap-2">
                                    <Icon name="upload" size={14} /> Import Blueprint
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                            </div>

                            <div className="space-y-2">
                                {(state.blueprints || []).length === 0 && (
                                    <p className="text-center text-gray-500 text-sm py-4">No blueprints yet.</p>
                                )}
                                {(state.blueprints || []).map(bp => (
                                    <div key={bp.id} className="bg-discord-darker p-3 rounded border border-discord-light hover:border-discord-blurple transition-colors group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-200 text-sm">{bp.name}</h3>
                                                <p className="text-xs text-gray-400">{bp.tasks.length} tasks • {bp.description || 'No description'}</p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleExport(bp)} className="p-1.5 hover:bg-gray-700 rounded text-gray-400" title="Export"><Icon name="download" size={14}/></button>
                                                <button onClick={() => { if(confirm('Delete blueprint?')) dispatch({type: 'DELETE_BLUEPRINT', payload: bp.id}) }} className="p-1.5 hover:bg-red-900/50 text-red-400 rounded" title="Delete"><Icon name="trash" size={14}/></button>
                                            </div>
                                        </div>
                                        <button onClick={() => handleApply(bp.id)} className="w-full mt-3 bg-discord-light hover:bg-discord-green hover:text-white text-gray-300 py-1.5 rounded text-xs font-bold transition-colors">
                                            Apply to Current Folder
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {view === 'create' && (
                        <div className="space-y-4">
                            <div className="bg-discord-darker p-4 rounded text-sm text-gray-300">
                                <p className="mb-2 font-bold text-white">Create New Blueprint</p>
                                <p className="text-xs text-gray-400 mb-4">
                                    Saving the current folder <strong>{activeFolder.name}</strong> ({tasksInFolder.length} tasks) as a blueprint.
                                </p>
                                <input 
                                    className="w-full bg-discord-darkest text-white p-2 rounded border border-discord-light mb-4 outline-none focus:border-discord-blurple"
                                    placeholder="Blueprint Name (e.g., Daily Routine)"
                                    value={newBpName}
                                    onChange={e => setNewBpName(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => setView('list')} className="flex-1 bg-transparent hover:bg-discord-light text-gray-400 py-2 rounded text-xs">Cancel</button>
                                    <button onClick={handleCreate} className="flex-1 bg-discord-blurple hover:bg-indigo-600 text-white py-2 rounded font-bold text-xs">Save Blueprint</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Sidebar ---
window.Sidebar = React.memo(({ state, dispatch, onOpenSettings }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newFolder, setNewFolder] = useState('');
    const [showGrimoire, setShowGrimoire] = useState(false);
    const { useMemo } = React;

    const handleAdd = (e) => {
        if (e.key === 'Enter' && newFolder.trim()) {
            dispatch({ type: 'ADD_FOLDER', payload: { id: window.generateId(), name: newFolder, icon: 'folder', type: 'custom' } });
            setNewFolder('');
            setIsAdding(false);
        }
    };

    const unreadCount = useMemo(() => state.tasks.filter(t => t.folderId === 'inbox' && !t.completed).length, [state.tasks]);

    return (
        <div className="w-64 bg-discord-darker flex flex-col border-r border-discord-darkest flex-shrink-0">
            {showGrimoire && <window.GrimoireModal state={state} dispatch={dispatch} onClose={() => setShowGrimoire(false)} />}
            
            <div className="h-12 flex items-center px-4 border-b border-discord-darkest font-bold text-white tracking-tight gap-2">
                <Icon name="sword" className="text-discord-blurple" /> QUESTIFY <span className="text-[10px] bg-discord-blurple px-1 rounded text-white ml-auto">v1.1</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {/* Grimoire Button */}
                <button onClick={() => setShowGrimoire(true)} className="w-full flex items-center gap-3 px-2 py-2 rounded transition-all mb-4 text-purple-300 hover:bg-purple-900/20 hover:text-purple-200 group">
                    <Icon name="book" size={18} />
                    <span className="font-bold text-sm">Grimoire (Blueprints)</span>
                </button>

                {/* Folders */}
                {state.folders.map(f => (
                    <button key={f.id} onClick={() => dispatch({type: 'SET_FOLDER', payload: f.id})}
                        className={`w-full flex items-center gap-3 px-2 py-2 rounded transition-all group focus:outline-none focus:ring-2 focus:ring-discord-blurple ${state.activeFolderId === f.id ? 'bg-discord-light text-white' : 'text-gray-400 hover:bg-discord-dark hover:text-gray-200'}`}>
                        <Icon name={f.icon} size={18} />
                        <span className="font-medium text-sm truncate">{f.name}</span>
                        {f.id === 'inbox' && unreadCount > 0 && (
                            <span className="ml-auto text-[10px] bg-discord-red text-white px-1.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                ))}
                
                <button className="w-full mt-4 px-2 flex items-center justify-between text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-gray-300 transition-colors focus:outline-none" onClick={() => setIsAdding(!isAdding)}>
                    <span>Projects</span>
                    <Icon name="plus" size={12} />
                </button>
                {isAdding && (
                    <input autoFocus className="w-full bg-discord-darkest text-gray-200 text-sm p-1 mt-1 rounded border border-discord-blurple outline-none" placeholder="Folder Name..." value={newFolder} onChange={e => setNewFolder(e.target.value)} onKeyDown={handleAdd} />
                )}
            </div>
            <div className="p-3 bg-discord-darkest/50 border-t border-discord-darkest flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white font-bold text-sm shadow-lg relative shrink-0">
                        {state.user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white mb-0.5 truncate">{state.user.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">Lvl {state.user.level}</div>
                    </div>
                </div>
                <button onClick={onOpenSettings} className="text-gray-400 hover:text-white p-1 rounded hover:bg-discord-light" aria-label="Settings">
                    <Icon name="settings" size={16} />
                </button>
            </div>
        </div>
    );
});

// --- TaskItem ---
window.TaskItem = React.memo(({ task, dispatch }) => {
    const [expanded, setExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editPriority, setEditPriority] = useState(task.priority);
    const [editDate, setEditDate] = useState(task.dueDate || '');
    const [subInput, setSubInput] = useState('');

    const handleSubAdd = (e) => {
        e.preventDefault();
        if(!subInput.trim()) return;
        dispatch({ type: 'ADD_SUBTASK', payload: { taskId: task.id, title: subInput } });
        setSubInput('');
    };

    const saveEdit = () => {
        if (editTitle.trim()) {
            dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { title: editTitle, priority: editPriority, dueDate: editDate || null } } });
            setIsEditing(false);
        }
    };

    const cancelEdit = () => {
        setEditTitle(task.title);
        setEditPriority(task.priority);
        setEditDate(task.dueDate || '');
        setIsEditing(false);
    };

    const priorityStyle = window.PRIORITIES[task.priority];
    const subtaskCount = task.subtasks.length;
    const subtaskCompleted = task.subtasks.filter(s => s.completed).length;

    if (isEditing) {
        return (
            <div className="mb-2 p-3 bg-discord-light/20 border border-discord-blurple rounded flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase text-gray-500 font-bold">Task Title</label>
                    <input className="bg-discord-darkest text-white p-2 rounded border border-gray-600 focus:border-discord-blurple outline-none text-sm" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && saveEdit()} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-gray-500 font-bold">Priority</label>
                        <select className="bg-discord-darkest text-xs text-gray-300 p-2 rounded outline-none border border-gray-600" value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                            {Object.entries(window.PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-gray-500 font-bold">Due Date</label>
                        <input type="date" className="bg-discord-darkest text-gray-300 p-1.5 rounded border border-gray-600 outline-none text-xs" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={cancelEdit} className="text-xs text-gray-400 hover:text-white px-3 py-1.5">Cancel</button>
                    <button onClick={saveEdit} className="text-xs bg-discord-blurple hover:bg-indigo-500 text-white px-4 py-1.5 rounded font-bold">Save Changes</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`group mb-2 rounded border transition-all duration-200 ${task.completed ? 'bg-discord-darker border-transparent opacity-60' : 'bg-discord-light border-transparent hover:border-discord-blurple shadow-sm'}`}>
            <div className="p-3 flex items-start gap-3">
                <button onClick={() => dispatch({type: 'TOGGLE_TASK', payload: task.id})} className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-discord-blurple ${task.completed ? 'bg-discord-green border-discord-green' : 'border-gray-500 hover:border-discord-blurple'}`}>
                    {task.completed && <Icon name="check" size={14} className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                    <div className={`text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-200'} font-medium break-words`}>
                        {task.title}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 rounded border ${priorityStyle.color} ${priorityStyle.border} bg-opacity-10`}>
                            {priorityStyle.label.toUpperCase()}
                        </span>
                        {task.isSideQuest && <span className="text-[9px] text-blue-400 font-bold uppercase">Side Quest</span>}
                        {task.dueDate && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Icon name="calendar" size={10} /> {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        )}
                        <span className="text-[10px] text-discord-yellow flex items-center gap-1">
                            <Icon name="zap" size={10} /> +{task.xpReward} XP
                        </span>
                        {(subtaskCount > 0 || expanded) && (
                            <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-gray-400 flex items-center gap-1 cursor-pointer hover:text-white select-none focus:outline-none">
                                <Icon name="list-tree" size={10} /> 
                                {subtaskCompleted}/{subtaskCount}
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                        <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-white p-1 focus:outline-none" aria-label="Edit Task"><Icon name="pencil" size={16} /></button>
                    <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-white p-1 focus:outline-none" aria-label="Toggle Subtasks"><Icon name={expanded ? "chevron-up" : "chevron-down"} size={16} /></button>
                    <button onClick={() => dispatch({type: 'DELETE_TASK', payload: task.id})} className="text-gray-400 hover:text-discord-red p-1 focus:outline-none" aria-label="Delete Task"><Icon name="trash-2" size={16} /></button>
                </div>
            </div>
            {expanded && (
                <div className="px-3 pb-3 pt-0 pl-11">
                    <div className="space-y-1 mt-1">
                        {task.subtasks.map(st => (
                            <div key={st.id} className="flex items-center gap-2 text-xs group/sub">
                                <button onClick={() => dispatch({type: 'TOGGLE_SUBTASK', payload: {taskId: task.id, subtaskId: st.id}})} className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${st.completed ? 'bg-discord-blurple border-discord-blurple' : 'border-gray-500'}`}>
                                    {st.completed && <Icon name="check" size={8} className="text-white" />}
                                </button>
                                <span className={`break-all ${st.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{st.title}</span>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSubAdd} className="mt-2 flex items-center gap-2">
                        <Icon name="corner-down-right" size={12} className="text-gray-600 shrink-0" />
                        <input className="bg-transparent text-xs text-gray-300 outline-none w-full placeholder-gray-600" placeholder="Add subtask..." value={subInput} onChange={e => setSubInput(e.target.value)} />
                    </form>
                </div>
            )}
        </div>
    );
});

// --- SettingsModal ---
window.SettingsModal = ({ state, dispatch, onClose }) => {
    const fileInputRef = useRef(null);
    
    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `questify_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImportClick = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const fileReader = new FileReader();
        fileReader.readAsText(e.target.files[0], "UTF-8");
        fileReader.onload = e => {
            try {
                const parsed = JSON.parse(e.target.result);
                if(parsed.user && parsed.tasks) {
                    dispatch({ type: 'LOAD_DATA', payload: parsed });
                    onClose();
                    alert("Data imported successfully!");
                } else {
                    alert("Invalid save file format.");
                }
            } catch(err) {
                alert("Error reading file.");
            }
        };
    };
    
    const requestNotify = () => {
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notifications");
        } else {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("Questify Notifications Enabled!");
                }
            });
        }
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-discord-dark p-6 rounded-lg shadow-2xl w-[500px] border border-discord-light max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white">Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="x" size={20}/></button>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-discord-blurple/20 border border-discord-blurple p-4 rounded text-sm text-gray-200">
                        <p className="mb-2 font-bold text-white flex items-center gap-2">
                            <Icon name="github" size={16}/> Open Source
                        </p>
                        <p className="text-xs opacity-80 mb-2">
                            Questify is free and open source. Help us build the ultimate productivity RPG.
                        </p>
                        <a href="https://github.com/Questify" target="_blank" className="inline-block text-xs bg-discord-blurple hover:bg-indigo-600 text-white px-3 py-1.5 rounded font-bold transition-colors">
                            View on GitHub
                        </a>
                    </div>

                    <div className="bg-discord-darker p-4 rounded text-sm text-gray-300">
                        <p className="mb-2 font-bold text-discord-blurple flex items-center gap-2">
                            <Icon name="gamepad-2" size={16}/> Game Mode (Anxiety Control)
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                            {Object.entries(window.DIFFICULTY_SETTINGS).map(([key, setting]) => (
                                <button 
                                    key={key}
                                    onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { difficulty: key } })}
                                    className={`flex items-center justify-between p-3 rounded border text-left transition-colors ${state.settings.difficulty === key ? 'bg-discord-blurple/20 border-discord-blurple text-white' : 'bg-discord-light/30 border-transparent hover:bg-discord-light/50 text-gray-400'}`}
                                >
                                    <div>
                                        <div className="font-bold text-xs">{setting.label}</div>
                                        <div className="text-[10px] opacity-70">{setting.desc}</div>
                                    </div>
                                    {state.settings.difficulty === key && <Icon name="check" size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-discord-darker p-4 rounded text-sm text-gray-300 flex items-center justify-between">
                        <p className="font-bold text-white flex items-center gap-2">
                            <Icon name={state.settings.soundEnabled ? "volume-2" : "volume-x"} size={16}/> Sound Effects
                        </p>
                        <button 
                            onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { soundEnabled: !state.settings.soundEnabled } })}
                            className={`w-12 h-6 rounded-full relative transition-colors ${state.settings.soundEnabled ? 'bg-discord-green' : 'bg-gray-600'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${state.settings.soundEnabled ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>

                    <div className="bg-discord-darker p-4 rounded text-sm text-gray-300">
                        <p className="mb-2 font-bold text-discord-green flex items-center gap-2">
                            <Icon name="bell" size={16}/> Notifications
                        </p>
                        <button onClick={requestNotify} className="w-full bg-discord-light hover:bg-gray-600 text-white py-2 rounded font-bold text-xs">
                            Enable Desktop Notifications
                        </button>
                    </div>

                    <div className="bg-discord-darker p-4 rounded text-sm text-gray-300">
                        <p className="mb-2 font-bold text-discord-yellow flex items-center gap-2">
                            <Icon name="save" size={16}/> Data Persistence
                        </p>
                        <div className="flex gap-2">
                            <button onClick={handleExport} className="flex-1 bg-discord-blurple hover:bg-indigo-600 text-white py-2 rounded font-bold flex items-center justify-center gap-2 text-xs">
                                <Icon name="download" size={14}/> Export
                            </button>
                            <button onClick={handleImportClick} className="flex-1 bg-discord-light hover:bg-gray-600 text-white py-2 rounded font-bold flex items-center justify-center gap-2 text-xs">
                                <Icon name="upload" size={14}/> Import
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                        </div>
                    </div>

                        <div className="bg-discord-darker p-4 rounded text-sm text-gray-300">
                        <p className="mb-2 font-bold text-discord-red flex items-center gap-2">
                            <Icon name="alert-triangle" size={16}/> Danger Zone
                        </p>
                        <button onClick={() => { if(confirm('Reset all progress?')) { localStorage.clear(); window.location.reload(); } }} className="w-full bg-discord-red hover:bg-red-700 text-white py-2 rounded font-bold text-xs">
                            Hard Reset
                        </button>
                        </div>
                    
                    <div className="text-xs text-center text-gray-500">
                        Questify v{window.APP_VERSION}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MainView ---
window.MainView = ({ state, dispatch }) => {
    const [title, setTitle] = useState('');
    const [prio, setPrio] = useState('MEDIUM');
    const [dueDate, setDueDate] = useState('');
    const { useMemo } = React;

    const activeFolder = state.folders.find(f => f.id === state.activeFolderId) || state.folders[0];
    
    const sortedTasks = useMemo(() => {
        const tasks = state.tasks.filter(t => t.folderId === state.activeFolderId);
        return tasks.sort((a,b) => {
            if (a.completed === b.completed) return window.PRIORITIES[b.priority].value - window.PRIORITIES[a.priority].value;
            return a.completed ? 1 : -1;
        });
    }, [state.tasks, state.activeFolderId]);

    const addTask = (e) => {
        e.preventDefault();
        if(!title.trim()) return;
        dispatch({
            type: 'ADD_TASK',
            payload: {
                id: window.generateId(),
                title,
                folderId: state.activeFolderId,
                completed: false,
                priority: prio,
                xpReward: 100,
                subtasks: [],
                createdAt: Date.now(),
                dueDate: dueDate || null,
                position: window.getRandomPos()
            }
        });
        setTitle('');
        setDueDate('');
    };

    const runTemplate = () => {
        const template = [
            { title: 'Morning Standup / Review', priority: 'MEDIUM', xpReward: 150 },
            { title: 'Deep Work Session (90m)', priority: 'HIGH', xpReward: 300, subtasks: [{title:'Silence Phone',completed:false}] },
            { title: 'Clear Inbox', priority: 'LOW', xpReward: 50 }
        ];
        dispatch({type: 'APPLY_TEMPLATE', payload: template});
    };

    const taskCount = sortedTasks.length;
    const completedCount = sortedTasks.filter(t => t.completed).length;
    const completion = taskCount ? Math.round((completedCount / taskCount) * 100) : 0;

    return (
        <div className="flex-1 bg-discord-dark flex flex-col relative h-full min-w-0">
            <div className="h-12 border-b border-discord-darkest flex items-center justify-between px-6 bg-discord-dark shadow-md z-10 shrink-0">
                <div className="flex items-center gap-2 text-white font-bold truncate">
                    <Icon name={activeFolder.icon} className="text-gray-400" /> 
                    <span>{activeFolder.name}</span>
                </div>
                <div className="flex gap-2 shrink-0">
                    <ComboMeter combo={state.combo} difficulty={state.settings.difficulty} />
                    <button onClick={runTemplate} className="text-xs bg-discord-darker hover:bg-discord-light text-gray-300 px-3 py-1.5 rounded flex items-center gap-2 transition-colors">
                        <Icon name="wand-2" size={14} /> <span className="hidden sm:inline">Daily Ritual</span>
                    </button>
                    <button onClick={() => dispatch({type: 'SET_VIEW', payload: 'board'})} className="text-xs bg-discord-blurple hover:bg-indigo-600 text-white px-3 py-1.5 rounded flex items-center gap-2 font-bold shadow-lg transition-all border border-indigo-400">
                        <Icon name="layout-dashboard" size={14} /> <span>Quest Board</span>
                    </button>
                </div>
            </div>

            <div className="px-6 py-6 shrink-0">
                <div className="flex justify-between items-end mb-2">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Quest Progress</h2>
                    <span className={`text-sm font-mono font-bold ${completion === 100 ? 'text-discord-green' : 'text-discord-blurple'}`}>{completion}%</span>
                </div>
                <div className="h-2 w-full bg-discord-darker rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-700 ease-out ${completion === 100 ? 'bg-discord-green shadow-[0_0_10px_#3BA55C]' : 'bg-discord-blurple'}`} 
                            style={{ width: `${completion}%` }}></div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scroll">
                <form onSubmit={addTask} className="mb-6 bg-discord-light/30 p-1 rounded-lg border-2 border-dashed border-gray-600 hover:border-discord-blurple transition-colors flex items-center gap-2 focus-within:border-discord-blurple focus-within:bg-discord-light/50">
                    <div className="pl-3 text-gray-400 shrink-0"><Icon name="plus" /></div>
                    <input className="flex-1 bg-transparent py-3 px-1 text-white placeholder-gray-500 outline-none min-w-0" 
                        placeholder="Add a new task..." value={title} onChange={e => setTitle(e.target.value)} />
                        <input 
                        type="date" 
                        className="bg-discord-darker text-gray-200 text-xs py-2 px-2 rounded outline-none border border-transparent focus:border-discord-blurple cursor-pointer shrink-0"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                    />
                    <select value={prio} onChange={e => setPrio(e.target.value)} aria-label="Task Priority"
                        className="bg-discord-darker text-gray-200 text-xs py-2 px-3 rounded mr-1 outline-none border border-transparent focus:border-discord-blurple cursor-pointer shrink-0">
                        {Object.entries(window.PRIORITIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </form>

                {sortedTasks.map(t => <TaskItem key={t.id} task={t} dispatch={dispatch} />)}
                
                {taskCount === 0 && (
                    <div className="text-center mt-20 text-gray-600 flex flex-col items-center gap-2">
                        <Icon name="ghost" size={48} className="opacity-20" />
                        <p>No tasks in this realm.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
