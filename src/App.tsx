import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, 
  Code2, 
  Plus, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Settings2,
  MousePointer2,
  Type,
  Image as ImageIcon,
  CheckSquare,
  Circle,
  ChevronDown as DropdownIcon,
  Type as TextAreaIcon,
  SlidersHorizontal,
  Lock,
  RectangleHorizontal,
  Workflow,
  RotateCw,
  LogOut,
  User as UserIcon,
  Search,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
  Github,
  Twitter,
  Globe,
  Download,
  Save,
  Mail,
  Key
} from 'lucide-react';
import { UIElement, ElementType, ViewMode, LogicBlock } from './types';
import { cn } from './lib/utils';
import LogicEditor from './components/LogicEditor';
import ResultView from './components/ResultView';

interface User {
  id: string;
  email: string;
}

const ELEMENT_TEMPLATES: Record<ElementType, Partial<UIElement>> = {
  button: { text: 'Button', width: 100, height: 40, bgColor: '#3b82f6', textColor: '#ffffff', borderRadius: 4, fontSize: 14, textAlign: 'center', fontFamily: 'sans-serif', borderWidth: 0, borderColor: '#000000' },
  textInput: { placeholder: 'Type here...', width: 160, height: 32, bgColor: '#ffffff', textColor: '#000000', borderRadius: 4, fontSize: 14, borderWidth: 1, borderColor: '#d1d5db', textAlign: 'left', fontFamily: 'sans-serif' },
  label: { text: 'Label', width: 80, height: 24, textColor: '#000000', fontSize: 14, textAlign: 'left', fontFamily: 'sans-serif', rotation: 0 },
  dropdown: { options: ['Option 1', 'Option 2'], width: 160, height: 32, bgColor: '#ffffff', textColor: '#000000', borderRadius: 4, fontSize: 14, borderWidth: 1, borderColor: '#d1d5db', textAlign: 'left', fontFamily: 'sans-serif' },
  radioButton: { width: 20, height: 20, checked: false, groupId: 'group1', value: '' },
  checkbox: { width: 20, height: 20, checked: false, value: '' },
  image: { src: 'https://picsum.photos/seed/devflow/200/200', width: 100, height: 100, borderRadius: 0, borderWidth: 0, borderColor: '#000000' },
  textArea: { text: '', width: 200, height: 100, bgColor: '#ffffff', textColor: '#000000', borderRadius: 4, fontSize: 14, borderWidth: 1, borderColor: '#d1d5db', textAlign: 'left', fontFamily: 'sans-serif' },
  slider: { width: 160, height: 20, value: 50, min: 0, max: 100, step: 1 },
  passwordInput: { text: '', width: 160, height: 32, bgColor: '#ffffff', textColor: '#000000', borderRadius: 4, fontSize: 14, borderWidth: 1, borderColor: '#d1d5db', passwordChar: '•', fontType: '•', textAlign: 'left', fontFamily: 'sans-serif' },
  rectangle: { width: 100, height: 100, color: '#e5e7eb', borderRadius: 0, borderWidth: 0, borderColor: '#000000', rotation: 0 },
};

export default function App() {
  const [appState, setAppState] = useState<'GET_STARTED' | 'DASHBOARD' | 'EDITOR'>('GET_STARTED');
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState('Untitled Project');
  const [isSaving, setIsSaving] = useState(false);
  const [modal, setModal] = useState<{ type: 'NEW_PROJECT' | 'DELETE_CONFIRM' | 'AUTH' | null, data?: any }>({ type: null });
  const [modalInput, setModalInput] = useState('');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('DESIGN');
  const [elements, setElements] = useState<UIElement[]>([]);
  const [logicBlocks, setLogicBlocks] = useState<LogicBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [idError, setIdError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            fetchProjects();
            if (appState === 'GET_STARTED') setAppState('DASHBOARD');
          } else {
            localStorage.removeItem('token');
            setAppState('GET_STARTED');
          }
        } catch (err) {
          setAppState('GET_STARTED');
        }
      } else {
        setAppState('GET_STARTED');
      }
    };
    checkAuth();
  }, []);

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Fetch projects failed:", err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = authMode === 'LOGIN' ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setModal({ type: null });
        setAppState('DASHBOARD');
        fetchProjects();
      } else {
        setAuthError(data.error);
      }
    } catch (err) {
      setAuthError("Authentication failed. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setAppState('GET_STARTED');
  };

  const saveProject = async (status: 'draft' | 'completed' = 'draft') => {
    if (!user) return;
    setIsSaving(true);
    
    const token = localStorage.getItem('token');
    const projectId = currentProjectId || `proj_${Math.random().toString(36).substr(2, 9)}`;
    const projectData = {
      id: projectId,
      name: currentProjectName,
      elements,
      logicBlocks,
      canvasWidth,
      canvasHeight,
      status
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      });
      if (res.ok) {
        setCurrentProjectId(projectId);
        fetchProjects();
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const loadProject = (project: any) => {
    setCurrentProjectId(project.id);
    setCurrentProjectName(project.name);
    setElements(project.elements || []);
    setLogicBlocks(project.logicBlocks || []);
    setCanvasWidth(project.canvasWidth || 800);
    setCanvasHeight(project.canvasHeight || 600);
    setAppState('EDITOR');
  };

  const createNewProject = () => {
    setModalInput('New Project');
    setModal({ type: 'NEW_PROJECT' });
  };

  const confirmCreateProject = () => {
    if (modalInput.trim()) {
      setCurrentProjectId(null);
      setCurrentProjectName(modalInput.trim());
      setElements([]);
      setLogicBlocks([]);
      setCanvasWidth(800);
      setCanvasHeight(600);
      setAppState('EDITOR');
      setModal({ type: null });
    }
  };

  const deleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setModal({ type: 'DELETE_CONFIRM', data: id });
  };

  const confirmDeleteProject = async () => {
    if (modal.data) {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`/api/projects/${modal.data}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchProjects();
          setModal({ type: null });
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  const addElement = (type: ElementType) => {
    const template = ELEMENT_TEMPLATES[type];
    
    // Generate sequential ID
    const existingIds = elements.filter(el => el.type === type).map(el => el.id);
    let counter = 1;
    let newId = `${type}_${counter}`;
    while (elements.some(el => el.id === newId)) {
      counter++;
      newId = `${type}_${counter}`;
    }

    const newElement: UIElement = {
      id: newId,
      type,
      x: 50,
      y: 50,
      depth: elements.length,
      hidden: false,
      ...template,
    } as UIElement;
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const updateElementId = (oldId: string, newId: string) => {
    if (oldId === newId) return;
    
    if (elements.some(el => el.id === newId)) {
      setIdError(`The ID "${newId}" is already in use.`);
      setTimeout(() => setIdError(null), 3000);
      return;
    }

    // Update element ID and all references in logic blocks
    setElements(elements.map(el => el.id === oldId ? { ...el, id: newId } : el));
    setLogicBlocks(logicBlocks.map(block => {
      if (block.elementId === oldId) {
        return { ...block, elementId: newId };
      }
      const updatedActions = block.actions.map(action => {
        let updatedAction = { ...action };
        if (action.targetElementId === oldId) {
          updatedAction.targetElementId = newId;
        }
        if (action.condition) {
          const updatedRules = action.condition.rules.map(rule => 
            rule.elementId === oldId ? { ...rule, elementId: newId } : rule
          );
          const updatedOnTrue = action.condition.onTrue.map(sub => 
            sub.targetElementId === oldId ? { ...sub, targetElementId: newId } : sub
          );
          const updatedOnFalse = action.condition.onFalse.map(sub => 
            sub.targetElementId === oldId ? { ...sub, targetElementId: newId } : sub
          );
          updatedAction.condition = { 
            ...action.condition, 
            rules: updatedRules, 
            onTrue: updatedOnTrue, 
            onFalse: updatedOnFalse 
          };
        }
        return updatedAction;
      });
      return { ...block, actions: updatedActions };
    }));
    setSelectedId(newId);
    setIdError(null);
  };

  const updateElement = (id: string, updates: Partial<UIElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateElement = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (el) {
      const newEl = {
        ...el,
        id: `${el.type}_${Math.random().toString(36).substr(2, 9)}`,
        x: el.x + 20,
        y: el.y + 20,
        depth: elements.length,
      };
      setElements([...elements, newEl]);
      setSelectedId(newEl.id);
    }
  };

  const bringForward = (id: string) => {
    const index = elements.findIndex(el => el.id === id);
    if (index < elements.length - 1) {
      const newElements = [...elements];
      [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
      setElements(newElements.map((el, i) => ({ ...el, depth: i })));
    }
  };

  const sendBackward = (id: string) => {
    const index = elements.findIndex(el => el.id === id);
    if (index > 0) {
      const newElements = [...elements];
      [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
      setElements(newElements.map((el, i) => ({ ...el, depth: i })));
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedId(null);
    }
  };

  const handleElementMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    setIsDragging(true);
    
    const el = elements.find(e => e.id === id);
    if (!el) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = el.x;
    const initialY = el.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      updateElement(id, { x: initialX + dx, y: initialY + dy });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, id: string, handle: string) => {
    e.stopPropagation();
    const el = elements.find(e => e.id === id);
    if (!el) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialWidth = el.width;
    const initialHeight = el.height;
    const initialX = el.x;
    const initialY = el.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newWidth = initialWidth;
      let newHeight = initialHeight;
      let newX = initialX;
      let newY = initialY;

      if (handle.includes('e')) newWidth = Math.max(10, initialWidth + dx);
      if (handle.includes('w')) {
        const delta = Math.min(initialWidth - 10, dx);
        newWidth = initialWidth - delta;
        newX = initialX + delta;
      }
      if (handle.includes('s')) newHeight = Math.max(10, initialHeight + dy);
      if (handle.includes('n')) {
        const delta = Math.min(initialHeight - 10, dy);
        newHeight = initialHeight - delta;
        newY = initialY + delta;
      }

      updateElement(id, { width: newWidth, height: newHeight, x: newX, y: newY });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const renderModals = () => {
    if (!modal.type) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
          {modal.type === 'NEW_PROJECT' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">New Project</h3>
                <p className="text-neutral-400 text-sm">Give your creative work a name to get started.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Project Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmCreateProject()}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="My Awesome App"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setModal({ type: null })}
                  className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmCreateProject}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {modal.type === 'AUTH' && (
            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">{authMode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}</h3>
                <p className="text-neutral-400 text-sm">
                  {authMode === 'LOGIN' ? 'Enter your credentials to access your projects.' : 'Join CODE STUDIO 2.0 and start building today.'}
                </p>
              </div>

              {authError && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-400 text-xs p-3 rounded-xl animate-shake">
                  {authError}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input 
                      required
                      type="email" 
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input 
                      required
                      type="password" 
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <button 
                  type="submit"
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  {authMode === 'LOGIN' ? 'Sign In' : 'Create Account'}
                </button>
                <p className="text-center text-sm text-neutral-500">
                  {authMode === 'LOGIN' ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    type="button"
                    onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
                    className="text-blue-400 font-bold hover:text-blue-300 transition-colors"
                  >
                    {authMode === 'LOGIN' ? 'Sign Up' : 'Log In'}
                  </button>
                </p>
              </div>
            </form>
          )}

          {modal.type === 'DELETE_CONFIRM' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Delete Project?</h3>
                <p className="text-neutral-400 text-sm">This action cannot be undone. All your design and logic will be permanently removed.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setModal({ type: null })}
                  className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-all"
                >
                  Keep it
                </button>
                <button 
                  onClick={confirmDeleteProject}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (appState === 'GET_STARTED') {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
        <header className="h-20 flex items-center justify-between px-10 border-b border-neutral-900 bg-neutral-950/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-2xl tracking-tight">CODE STUDIO 2.0</h1>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => { setAuthMode('LOGIN'); setModal({ type: 'AUTH' }); }} className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">Login</button>
            <button onClick={() => { setAuthMode('SIGNUP'); setModal({ type: 'AUTH' }); }} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">Sign Up</button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8">
            <Workflow className="w-4 h-4" />
            The Future of No-Code Development
          </div>
          <h2 className="text-6xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1]">
            Build Apps <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Faster Than Ever</span>
          </h2>
          <p className="text-xl text-neutral-400 mb-12 max-w-2xl leading-relaxed">
            CODE STUDIO 2.0 is a visual development platform that lets you design, logic-build, and export production-ready HTML apps in minutes. No coding required.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={() => { setAuthMode('SIGNUP'); setModal({ type: 'AUTH' }); }}
              className="px-10 py-4 bg-white text-black hover:bg-neutral-200 rounded-2xl text-lg font-bold transition-all flex items-center gap-3 shadow-xl active:scale-95"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-10 py-4 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 rounded-2xl text-lg font-bold transition-all active:scale-95">
              View Demo
            </button>
          </div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <FeatureCard 
              icon={<MousePointer2 className="w-6 h-6 text-blue-400" />}
              title="Visual Designer"
              description="Drag and drop components onto a pixel-perfect canvas with real-time resizing and zoom."
            />
            <FeatureCard 
              icon={<Workflow className="w-6 h-6 text-purple-400" />}
              title="Logic Engine"
              description="Build complex interactions using our intuitive visual logic editor. If/Else, events, and more."
            />
            <FeatureCard 
              icon={<Code2 className="w-6 h-6 text-emerald-400" />}
              title="Instant Export"
              description="Download your project as a single, clean .html file ready to be hosted anywhere."
            />
          </div>
        </main>

        <footer className="py-12 border-t border-neutral-900 bg-neutral-950 flex flex-col items-center gap-6">
          <div className="flex items-center gap-6 text-neutral-500">
            <Github className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
            <Twitter className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
            <Globe className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
          </div>
          <p className="text-sm text-neutral-600">© 2026 CODE STUDIO 2.0. Built for creators.</p>
        </footer>

        {renderModals()}
      </div>
    );
  }

  if (appState === 'DASHBOARD') {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
        <header className="h-16 flex items-center justify-between px-8 border-b border-neutral-900 bg-neutral-950/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">CODE STUDIO 2.0</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-neutral-900 rounded-xl border border-neutral-800">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold">
                {user?.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-neutral-300">{user?.email}</span>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-neutral-900 rounded-xl text-neutral-500 hover:text-red-400 transition-all" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-12">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-1">My Projects</h2>
              <p className="text-neutral-500">Manage and continue your creative work.</p>
            </div>
            <button 
              onClick={createNewProject}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div 
              onClick={createNewProject}
              className="aspect-[4/3] border-2 border-dashed border-neutral-800 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center group-hover:bg-blue-600 transition-all">
                <Plus className="w-6 h-6 text-neutral-500 group-hover:text-white" />
              </div>
              <span className="font-bold text-neutral-500 group-hover:text-blue-400">Create New Project</span>
            </div>

            {projects.map(project => (
              <div 
                key={project.id}
                onClick={() => loadProject(project)}
                className="aspect-[4/3] bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between hover:border-neutral-700 hover:bg-neutral-800/50 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => deleteProject(e, project.id)}
                      className="p-2 hover:bg-red-900/30 rounded-lg text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors">{project.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[8px]",
                      project.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {project.status}
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 transform translate-y-full group-hover:translate-y-0 transition-transform" />
              </div>
            ))}
          </div>
        </main>

        {renderModals()}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-neutral-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-900/50 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => setAppState('DASHBOARD')} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-all">
            <Layout className="w-5 h-5" />
          </button>
          <div className="h-4 w-px bg-neutral-800" />
          <h1 className="font-bold text-sm tracking-tight text-neutral-400">{currentProjectName}</h1>
        </div>
        
        <nav className="flex items-center bg-neutral-800 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('DESIGN')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              viewMode === 'DESIGN' ? "bg-neutral-700 text-white shadow-lg" : "text-neutral-400 hover:text-neutral-200"
            )}
          >
            <Layout className="w-4 h-4" />
            Design
          </button>
          <button 
            onClick={() => setViewMode('CODE')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              viewMode === 'CODE' ? "bg-neutral-700 text-white shadow-lg" : "text-neutral-400 hover:text-neutral-200"
            )}
          >
            <Workflow className="w-4 h-4" />
            Code
          </button>
          <button 
            onClick={() => setViewMode('RESULT')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              viewMode === 'RESULT' ? "bg-neutral-700 text-white shadow-lg" : "text-neutral-400 hover:text-neutral-200"
            )}
          >
            <Code2 className="w-4 h-4" />
            Result
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => saveProject('draft')}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button 
            onClick={() => saveProject('completed')}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            Complete
          </button>
        </div>
      </header>

      {renderModals()}

      <main className="flex-1 flex overflow-hidden">
        {viewMode === 'DESIGN' && (
          <>
            {/* Left Sidebar - Elements */}
            <aside className="w-64 border-r border-neutral-800 bg-neutral-900 flex flex-col">
              <div className="p-4 border-b border-neutral-800">
                <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">UI Elements</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
                <ElementButton icon={<MousePointer2 className="w-4 h-4" />} label="Button" onClick={() => addElement('button')} />
                <ElementButton icon={<Type className="w-4 h-4" />} label="Input" onClick={() => addElement('textInput')} />
                <ElementButton icon={<Type className="w-4 h-4" />} label="Label" onClick={() => addElement('label')} />
                <ElementButton icon={<DropdownIcon className="w-4 h-4" />} label="Dropdown" onClick={() => addElement('dropdown')} />
                <ElementButton icon={<Circle className="w-4 h-4" />} label="Radio" onClick={() => addElement('radioButton')} />
                <ElementButton icon={<CheckSquare className="w-4 h-4" />} label="Checkbox" onClick={() => addElement('checkbox')} />
                <ElementButton icon={<ImageIcon className="w-4 h-4" />} label="Image" onClick={() => addElement('image')} />
                <ElementButton icon={<TextAreaIcon className="w-4 h-4" />} label="Text Area" onClick={() => addElement('textArea')} />
                <ElementButton icon={<SlidersHorizontal className="w-4 h-4" />} label="Slider" onClick={() => addElement('slider')} />
                <ElementButton icon={<Lock className="w-4 h-4" />} label="Password" onClick={() => addElement('passwordInput')} />
                <ElementButton icon={<RectangleHorizontal className="w-4 h-4" />} label="Rectangle" onClick={() => addElement('rectangle')} />
              </div>
            </aside>

            {/* Canvas Area */}
            <section className="flex-1 bg-neutral-950 relative overflow-auto flex items-center justify-center p-20">
              <div 
                className="relative transition-transform duration-200 ease-out"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              >
                <div 
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  className="bg-white rounded-lg shadow-2xl relative overflow-hidden"
                  style={{ 
                    width: canvasWidth, 
                    height: canvasHeight,
                    cursor: isDragging ? 'grabbing' : 'default' 
                  }}
                >
                  {elements.map((el) => (
                    <div
                      key={el.id}
                      onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                      className={cn(
                        "absolute group cursor-move",
                        selectedId === el.id && "ring-2 ring-blue-500 ring-offset-2 ring-offset-white",
                        el.hidden && "opacity-30 grayscale"
                      )}
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.width,
                        height: el.height,
                        zIndex: el.depth,
                        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                      }}
                    >
                      <RenderElement element={el} />
                      {selectedId === el.id && (
                        <>
                          {/* Resize Handles */}
                          <div onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'nw')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-600 rounded-sm cursor-nw-resize z-50" />
                          <div onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'ne')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-600 rounded-sm cursor-ne-resize z-50" />
                          <div onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-600 rounded-sm cursor-sw-resize z-50" />
                          <div onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-600 rounded-sm cursor-se-resize z-50" />
                          <div onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'n')} className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border border-blue-600 rounded-sm cursor-n-resize z-50" />
                          <div onMouseDown={(e) => handleResizeMouseDown(e, el.id, 's')} className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border border-blue-600 rounded-sm cursor-s-resize z-50" />
                          <div onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'e')} className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border border-blue-600 rounded-sm cursor-e-resize z-50" />
                          <div onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'w')} className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border border-blue-600 rounded-sm cursor-w-resize z-50" />
                          
                          {/* Toolbar */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 flex items-center gap-1 shadow-xl whitespace-nowrap">
                            <button onClick={() => duplicateElement(el.id)} className="p-1.5 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                            <button onClick={() => bringForward(el.id)} className="p-1.5 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white" title="Bring Forward"><ChevronUp className="w-3.5 h-3.5" /></button>
                            <button onClick={() => sendBackward(el.id)} className="p-1.5 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white" title="Send Backward"><ChevronDown className="w-3.5 h-3.5" /></button>
                            <div className="w-px h-4 bg-neutral-700 mx-1" />
                            <button onClick={() => deleteElement(el.id)} className="p-1.5 hover:bg-red-900/30 rounded text-red-400 hover:text-red-300" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-neutral-800/80 backdrop-blur-md border border-neutral-700 rounded-xl p-1.5 flex items-center gap-2 shadow-2xl z-[100]">
                <button 
                  onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                  className="p-2 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-neutral-300 min-w-[40px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button 
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  className="p-2 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-all"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-neutral-700 mx-1" />
                <button 
                  onClick={() => setZoom(1)}
                  className="px-2 py-1 hover:bg-neutral-700 rounded text-[10px] font-bold text-neutral-400 hover:text-white uppercase tracking-wider"
                >
                  Reset
                </button>
              </div>
            </section>

            {/* Right Sidebar - Properties */}
            <aside className="w-72 border-l border-neutral-800 bg-neutral-900 flex flex-col">
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Properties</h2>
                <Settings2 className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {idError && (
                  <div className="bg-red-900/20 border border-red-500/50 text-red-400 text-[10px] p-2 rounded-lg animate-pulse">
                    {idError}
                  </div>
                )}
                {selectedElement ? (
                  <div className="space-y-4">
                    <PropertyField 
                      label="ID" 
                      value={selectedElement.id} 
                      onChange={(v) => updateElementId(selectedElement.id, v)} 
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <PropertyField label="X" type="number" value={selectedElement.x} onChange={(v) => updateElement(selectedElement.id, { x: Number(v) })} />
                      <PropertyField label="Y" type="number" value={selectedElement.y} onChange={(v) => updateElement(selectedElement.id, { y: Number(v) })} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <PropertyField label="Width" type="number" value={selectedElement.width} onChange={(v) => updateElement(selectedElement.id, { width: Number(v) })} />
                      <PropertyField label="Height" type="number" value={selectedElement.height} onChange={(v) => updateElement(selectedElement.id, { height: Number(v) })} />
                    </div>

                    {selectedElement.text !== undefined && (
                      <PropertyField label="Text" value={selectedElement.text} onChange={(v) => updateElement(selectedElement.id, { text: v })} />
                    )}

                    {selectedElement.placeholder !== undefined && (
                      <PropertyField label="Placeholder" value={selectedElement.placeholder} onChange={(v) => updateElement(selectedElement.id, { placeholder: v })} />
                    )}

                    {selectedElement.src !== undefined && (
                      <PropertyField label="Image Source" value={selectedElement.src} onChange={(v) => updateElement(selectedElement.id, { src: v })} />
                    )}

                    {selectedElement.bgColor !== undefined && (
                      <PropertyField label="Background" type="color" value={selectedElement.bgColor} onChange={(v) => updateElement(selectedElement.id, { bgColor: v })} />
                    )}

                    {selectedElement.textColor !== undefined && (
                      <PropertyField label="Text Color" type="color" value={selectedElement.textColor} onChange={(v) => updateElement(selectedElement.id, { textColor: v })} />
                    )}

                    {selectedElement.color !== undefined && (
                      <PropertyField label="Fill Color" type="color" value={selectedElement.color} onChange={(v) => updateElement(selectedElement.id, { color: v })} />
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <PropertyField label="Font Size" type="number" value={selectedElement.fontSize} onChange={(v) => updateElement(selectedElement.id, { fontSize: Number(v) })} />
                      <PropertyField label="Radius" type="number" value={selectedElement.borderRadius} onChange={(v) => updateElement(selectedElement.id, { borderRadius: Number(v) })} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <PropertyField label="Border" type="number" value={selectedElement.borderWidth} onChange={(v) => updateElement(selectedElement.id, { borderWidth: Number(v) })} />
                      <PropertyField label="Border Color" type="color" value={selectedElement.borderColor} onChange={(v) => updateElement(selectedElement.id, { borderColor: v })} />
                    </div>

                    {selectedElement.rotation !== undefined && (
                      <PropertyField label="Rotation" type="number" value={selectedElement.rotation} onChange={(v) => updateElement(selectedElement.id, { rotation: Number(v) })} />
                    )}

                    {selectedElement.type === 'slider' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <PropertyField label="Min" type="number" value={selectedElement.min} onChange={(v) => updateElement(selectedElement.id, { min: Number(v) })} />
                          <PropertyField label="Max" type="number" value={selectedElement.max} onChange={(v) => updateElement(selectedElement.id, { max: Number(v) })} />
                        </div>
                        <PropertyField label="Step" type="number" value={selectedElement.step} onChange={(v) => updateElement(selectedElement.id, { step: Number(v) })} />
                        <PropertyField label="Current Value" type="number" value={selectedElement.value} onChange={(v) => updateElement(selectedElement.id, { value: Number(v) })} />
                      </div>
                    )}

                    {(selectedElement.type === 'radioButton' || selectedElement.type === 'checkbox') && (
                      <PropertyField label="Value (Result)" value={selectedElement.value} onChange={(v) => updateElement(selectedElement.id, { value: v })} />
                    )}

                    {selectedElement.groupId !== undefined && (
                      <PropertyField label="Group ID" value={selectedElement.groupId} onChange={(v) => updateElement(selectedElement.id, { groupId: v })} />
                    )}

                    {selectedElement.fontFamily !== undefined && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Font Family</label>
                        <select 
                          value={selectedElement.fontFamily}
                          onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none"
                        >
                          <option value="sans-serif">Sans Serif</option>
                          <option value="serif">Serif</option>
                          <option value="monospace">Monospace</option>
                        </select>
                      </div>
                    )}

                    {selectedElement.textAlign !== undefined && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Align</label>
                        <div className="flex bg-neutral-800 rounded-lg p-1">
                          {(['left', 'center', 'right'] as const).map(align => (
                            <button 
                              key={align}
                              onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                              className={cn(
                                "flex-1 py-1 text-xs font-bold uppercase rounded",
                                selectedElement.textAlign === align ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"
                              )}
                            >
                              {align}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <input 
                        type="checkbox" 
                        id="hidden-check"
                        checked={selectedElement.hidden}
                        onChange={(e) => updateElement(selectedElement.id, { hidden: e.target.checked })}
                        className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-blue-600"
                      />
                      <label htmlFor="hidden-check" className="text-sm text-neutral-300">Hidden</label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Canvas Settings</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <PropertyField 
                          label="Width" 
                          type="number" 
                          value={canvasWidth} 
                          onChange={(v) => setCanvasWidth(Number(v))} 
                        />
                        <PropertyField 
                          label="Height" 
                          type="number" 
                          value={canvasHeight} 
                          onChange={(v) => setCanvasHeight(Number(v))} 
                        />
                      </div>
                    </div>
                    <div className="h-px bg-neutral-800" />
                    <div className="flex flex-col items-center justify-center text-neutral-500 space-y-2 pt-4">
                      <MousePointer2 className="w-8 h-8 opacity-20" />
                      <p className="text-sm text-center px-4">Select an element to edit its properties</p>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </>
        )}

        {viewMode === 'CODE' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <LogicEditor elements={elements} logicBlocks={logicBlocks} setLogicBlocks={setLogicBlocks} />
          </div>
        )}

        {viewMode === 'RESULT' && (
          <ResultView 
            elements={elements} 
            logicBlocks={logicBlocks} 
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            projectName={currentProjectName}
          />
        )}
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-3xl text-left hover:border-neutral-700 transition-all group">
      <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-neutral-500 leading-relaxed">{description}</p>
    </div>
  );
}

function ElementButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 p-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition-all group"
    >
      <div className="text-neutral-400 group-hover:text-white group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 group-hover:text-neutral-300">{label}</span>
    </button>
  );
}

function PropertyField({ label, value, type = 'text', onChange, disabled = false }: { label: string, value: any, type?: string, onChange?: (v: string) => void, disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{label}</label>
      <input 
        type={type}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
    </div>
  );
}

function RenderElement({ element }: { element: UIElement }) {
  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: element.bgColor || element.color,
    color: element.textColor,
    fontSize: element.fontSize ? `${element.fontSize}px` : undefined,
    textAlign: element.textAlign,
    borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
    borderWidth: element.borderWidth ? `${element.borderWidth}px` : undefined,
    borderColor: element.borderColor,
    borderStyle: element.borderWidth ? 'solid' : 'none',
    fontFamily: element.fontFamily,
    display: 'flex',
    alignItems: 'center',
    justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
    padding: element.type === 'label' || element.type === 'button' ? '0 8px' : '0',
    overflow: 'hidden',
  };

  switch (element.type) {
    case 'button':
      return <button style={style}>{element.text}</button>;
    case 'textInput':
      return <input type="text" placeholder={element.placeholder} style={style} readOnly />;
    case 'label':
      return <div style={style}>{element.text}</div>;
    case 'dropdown':
      return (
        <div style={style} className="flex justify-between px-2">
          <span>{element.options?.[0]}</span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </div>
      );
    case 'radioButton':
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div className="w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center">
            {element.checked && <div className="w-2 h-2 rounded-full bg-blue-500" />}
          </div>
        </div>
      );
    case 'checkbox':
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div className="w-4 h-4 rounded border-2 border-blue-500 flex items-center justify-center">
            {element.checked && <CheckSquare className="w-3 h-3 text-blue-500" />}
          </div>
        </div>
      );
    case 'image':
      return <img src={element.src} alt="" style={{ ...style, objectFit: 'cover' }} referrerPolicy="no-referrer" />;
    case 'textArea':
      return <textarea style={style} placeholder="Text area..." readOnly />;
    case 'slider':
      const min = element.min ?? 0;
      const max = element.max ?? 100;
      const val = Number(element.value ?? 0);
      const percent = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
      return (
        <div className="flex items-center w-full h-full px-2">
          <div className="w-full h-1 bg-neutral-200 rounded-full relative">
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-md" 
              style={{ left: `${percent}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
        </div>
      );
    case 'passwordInput':
      return <input type="password" value="********" style={style} readOnly />;
    case 'rectangle':
      return <div style={style} />;
    default:
      return null;
  }
}
