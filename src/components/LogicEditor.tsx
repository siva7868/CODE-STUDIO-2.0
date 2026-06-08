import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Node,
  useNodesState,
  useEdgesState,
  Position,
  NodeProps,
  applyNodeChanges,
  NodeChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { UIElement, LogicBlock, LogicEventType, LogicActionType, LogicAction } from '../types';
import { 
  MousePointer2, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Workflow,
  ChevronDown,
  Settings2,
  Layout
} from 'lucide-react';
import { cn } from '../lib/utils';

// --- Custom Nodes ---

const LogicBlockNode = ({ data }: NodeProps<{ 
  block: LogicBlock, 
  elements: UIElement[],
  onUpdate: (id: string, updates: Partial<LogicBlock>) => void,
  onDelete: (id: string) => void
}>) => {
  const { block, elements, onUpdate, onDelete } = data;

  const addAction = () => {
    const newAction: LogicAction = {
      id: `action_${Math.random().toString(36).substr(2, 9)}`,
      type: 'hide',
      targetElementId: elements[0]?.id
    };
    onUpdate(block.id, { actions: [...block.actions, newAction] });
  };

  const updateAction = (actionId: string, updates: Partial<LogicAction>) => {
    onUpdate(block.id, {
      actions: block.actions.map(a => a.id === actionId ? { ...a, ...updates } : a)
    });
  };

  const removeAction = (actionId: string) => {
    onUpdate(block.id, {
      actions: block.actions.filter(a => a.id !== actionId)
    });
  };

  return (
    <div className="px-4 py-4 shadow-xl rounded-xl bg-neutral-900 border-2 border-purple-500 text-white min-w-[300px]">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-purple-400" />
          <div className="flex items-center gap-2">
            <select 
              value={block.elementId}
              onChange={(e) => onUpdate(block.id, { elementId: e.target.value })}
              className="bg-neutral-800 border-none text-white text-[10px] font-bold rounded px-1 py-0.5 focus:ring-0"
            >
              {elements.map(el => (
                <option key={el.id} value={el.id}>{el.id}</option>
              ))}
            </select>
            <span className="text-neutral-500 text-[10px]">-</span>
            <select 
              value={block.event}
              onChange={(e) => onUpdate(block.id, { event: e.target.value as LogicEventType })}
              className="bg-neutral-800 border-none text-white text-[10px] font-bold rounded px-1 py-0.5 focus:ring-0"
            >
              <option value="click">Click</option>
              <option value="doubleClick">Double Click</option>
              <option value="hover">Hover</option>
              <option value="exit">Exit</option>
              <option value="change">Change</option>
            </select>
          </div>
        </div>
        <button onClick={() => onDelete(block.id)} className="p-1 hover:bg-red-900/30 rounded text-red-400">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Perform Actions</label>
            <button onClick={addAction} className="p-1 hover:bg-neutral-800 rounded text-purple-400">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {block.actions.map((action, idx) => (
            <div key={action.id} className="p-3 bg-neutral-800 rounded-lg border border-neutral-700 space-y-3 relative group">
              <button 
                onClick={() => removeAction(action.id)}
                className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-neutral-700 rounded text-neutral-500 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>

              <div className="space-y-1.5">
                <select 
                  value={action.type}
                  onChange={(e) => {
                    const type = e.target.value as LogicActionType;
                    const updates: Partial<LogicAction> = { type };
                    if (type === 'checkValue' && !action.condition) {
                      updates.condition = {
                        logicalOperator: 'AND',
                        rules: [{ id: `rule_${Math.random().toString(36).substr(2, 9)}`, elementId: elements[0]?.id, operator: '==', expectedValue: '' }],
                        onTrue: [],
                        onFalse: []
                      };
                    }
                    if (type === 'setProperty' && !action.property) {
                      updates.property = 'text';
                      updates.targetElementId = elements[0]?.id;
                    }
                    updateAction(action.id, updates);
                  }}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-[11px] focus:outline-none"
                >
                  <option value="hide">Hide Element</option>
                  <option value="show">Show Element</option>
                  <option value="openLink">Open Link</option>
                  <option value="checkValue">Check Value (If/Else)</option>
                  <option value="setProperty">Set Property</option>
                </select>
              </div>

              {(action.type === 'hide' || action.type === 'show') && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-neutral-500 uppercase">Target Element</label>
                  <select 
                    value={action.targetElementId}
                    onChange={(e) => updateAction(action.id, { targetElementId: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-[11px] focus:outline-none"
                  >
                    {elements.map(el => (
                      <option key={el.id} value={el.id}>{el.id} ({el.type})</option>
                    ))}
                  </select>
                </div>
              )}

              {action.type === 'openLink' && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-neutral-500 uppercase">URL</label>
                  <input 
                    type="text"
                    value={action.value || ''}
                    onChange={(e) => updateAction(action.id, { value: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-[11px] focus:outline-none"
                  />
                </div>
              )}

              {action.type === 'checkValue' && (
                <div className="space-y-3 pt-2 border-t border-neutral-700">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Conditions</span>
                    <div className="flex items-center gap-2">
                      <select 
                        value={action.condition?.logicalOperator}
                        onChange={(e) => updateAction(action.id, { 
                          condition: { ...action.condition!, logicalOperator: e.target.value as 'AND' | 'OR' } 
                        })}
                        className="bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-[10px]"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                      <button 
                        onClick={() => {
                          const newRule = { id: `rule_${Math.random().toString(36).substr(2, 9)}`, elementId: elements[0]?.id, operator: '==' as const, expectedValue: '' };
                          updateAction(action.id, { condition: { ...action.condition!, rules: [...action.condition!.rules, newRule] } });
                        }}
                        className="p-0.5 hover:bg-neutral-800 rounded text-purple-400"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {action.condition?.rules.map((rule, rIdx) => (
                    <div key={rule.id} className="flex items-center gap-1.5">
                      <select 
                        value={rule.elementId}
                        onChange={(e) => {
                          const updated = action.condition!.rules.map(r => r.id === rule.id ? { ...r, elementId: e.target.value } : r);
                          updateAction(action.id, { condition: { ...action.condition!, rules: updated } });
                        }}
                        className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-[10px]"
                      >
                        {elements.map(el => <option key={el.id} value={el.id}>{el.id}</option>)}
                      </select>
                      <select 
                        value={rule.operator}
                        onChange={(e) => {
                          const updated = action.condition!.rules.map(r => r.id === rule.id ? { ...r, operator: e.target.value as any } : r);
                          updateAction(action.id, { condition: { ...action.condition!, rules: updated } });
                        }}
                        className="bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-[10px]"
                      >
                        <option value="==">==</option>
                        <option value="!=">!=</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                      </select>
                      <input 
                        type="text"
                        value={rule.expectedValue}
                        onChange={(e) => {
                          const updated = action.condition!.rules.map(r => r.id === rule.id ? { ...r, expectedValue: e.target.value } : r);
                          updateAction(action.id, { condition: { ...action.condition!, rules: updated } });
                        }}
                        className="w-12 bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-[10px]"
                      />
                      {action.condition!.rules.length > 1 && (
                        <button 
                          onClick={() => {
                            const updated = action.condition!.rules.filter(r => r.id !== rule.id);
                            updateAction(action.id, { condition: { ...action.condition!, rules: updated } });
                          }}
                          className="p-0.5 hover:bg-red-900/20 rounded text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="space-y-2 pl-2 border-l border-green-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-green-500 uppercase">Then (On True)</span>
                      <button 
                        onClick={() => {
                          const newSubAction: LogicAction = { id: `sub_${Math.random().toString(36).substr(2, 9)}`, type: 'show', targetElementId: elements[0]?.id };
                          updateAction(action.id, { condition: { ...action.condition!, onTrue: [...action.condition!.onTrue, newSubAction] } });
                        }}
                        className="p-0.5 hover:bg-green-900/20 rounded text-green-400"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {action.condition?.onTrue.map(sub => (
                      <div key={sub.id} className="flex flex-col gap-1 bg-neutral-800/50 p-1.5 rounded border border-neutral-700/50">
                        <div className="flex items-center gap-1">
                          <select 
                            value={sub.type}
                            onChange={(e) => {
                              const type = e.target.value as LogicActionType;
                              const updated = action.condition!.onTrue.map(s => s.id === sub.id ? { 
                                ...s, 
                                type, 
                                value: type === 'openLink' ? 'https://' : s.value,
                                property: type === 'setProperty' ? 'text' : s.property
                              } : s);
                              updateAction(action.id, { condition: { ...action.condition!, onTrue: updated } });
                            }}
                            className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-[9px]"
                          >
                            <option value="show">Show</option>
                            <option value="hide">Hide</option>
                            <option value="openLink">Open Link</option>
                            <option value="setProperty">Set Property</option>
                          </select>
                          {sub.type !== 'openLink' && (
                            <select 
                              value={sub.targetElementId}
                              onChange={(e) => {
                                const updated = action.condition!.onTrue.map(s => s.id === sub.id ? { ...s, targetElementId: e.target.value } : s);
                                updateAction(action.id, { condition: { ...action.condition!, onTrue: updated } });
                              }}
                              className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-[9px]"
                            >
                              {elements.map(el => <option key={el.id} value={el.id}>{el.id}</option>)}
                            </select>
                          )}
                          <button 
                            onClick={() => {
                              const updated = action.condition!.onTrue.filter(s => s.id !== sub.id);
                              updateAction(action.id, { condition: { ...action.condition!, onTrue: updated } });
                            }}
                            className="p-0.5 hover:bg-red-900/20 rounded text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {sub.type === 'openLink' && (
                          <input 
                            type="text"
                            placeholder="URL (https://...)"
                            value={sub.value || ''}
                            onChange={(e) => {
                              const updated = action.condition!.onTrue.map(s => s.id === sub.id ? { ...s, value: e.target.value } : s);
                              updateAction(action.id, { condition: { ...action.condition!, onTrue: updated } });
                            }}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-[9px]"
                          />
                        )}
                        {sub.type === 'setProperty' && (
                          <div className="grid grid-cols-2 gap-1">
                            <select 
                              value={sub.property}
                              onChange={(e) => {
                                const updated = action.condition!.onTrue.map(s => s.id === sub.id ? { ...s, property: e.target.value } : s);
                                updateAction(action.id, { condition: { ...action.condition!, onTrue: updated } });
                              }}
                              className="bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-[9px]"
                            >
                              <option value="text">Text/Value</option>
                              <option value="bgColor">BG Color</option>
                              <option value="textColor">Text Color</option>
                              <option value="hidden">Hidden (true/false)</option>
                            </select>
                            <input 
                              type="text"
                              placeholder="Value"
                              value={sub.value || ''}
                              onChange={(e) => {
                                const updated = action.condition!.onTrue.map(s => s.id === sub.id ? { ...s, value: e.target.value } : s);
                                updateAction(action.id, { condition: { ...action.condition!, onTrue: updated } });
                              }}
                              className="bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-[9px]"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pl-2 border-l border-red-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-red-500 uppercase">Else (On False)</span>
                      <button 
                        onClick={() => {
                          const newSubAction: LogicAction = { id: `sub_${Math.random().toString(36).substr(2, 9)}`, type: 'hide', targetElementId: elements[0]?.id };
                          updateAction(action.id, { condition: { ...action.condition!, onFalse: [...action.condition!.onFalse, newSubAction] } });
                        }}
                        className="p-0.5 hover:bg-red-900/20 rounded text-red-400"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {action.condition?.onFalse.map(sub => (
                      <div key={sub.id} className="flex flex-col gap-1 bg-neutral-800/50 p-1.5 rounded border border-neutral-700/50">
                        <div className="flex items-center gap-1">
                          <select 
                            value={sub.type}
                            onChange={(e) => {
                              const type = e.target.value as LogicActionType;
                              const updated = action.condition!.onFalse.map(s => s.id === sub.id ? { 
                                ...s, 
                                type, 
                                value: type === 'openLink' ? 'https://' : s.value,
                                property: type === 'setProperty' ? 'text' : s.property
                              } : s);
                              updateAction(action.id, { condition: { ...action.condition!, onFalse: updated } });
                            }}
                            className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-[9px]"
                          >
                            <option value="show">Show</option>
                            <option value="hide">Hide</option>
                            <option value="openLink">Open Link</option>
                            <option value="setProperty">Set Property</option>
                          </select>
                          {sub.type !== 'openLink' && (
                            <select 
                              value={sub.targetElementId}
                              onChange={(e) => {
                                const updated = action.condition!.onFalse.map(s => s.id === sub.id ? { ...s, targetElementId: e.target.value } : s);
                                updateAction(action.id, { condition: { ...action.condition!, onFalse: updated } });
                              }}
                              className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-[9px]"
                            >
                              {elements.map(el => <option key={el.id} value={el.id}>{el.id}</option>)}
                            </select>
                          )}
                          <button 
                            onClick={() => {
                              const updated = action.condition!.onFalse.filter(s => s.id !== sub.id);
                              updateAction(action.id, { condition: { ...action.condition!, onFalse: updated } });
                            }}
                            className="p-0.5 hover:bg-red-900/20 rounded text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {sub.type === 'openLink' && (
                          <input 
                            type="text"
                            placeholder="URL (https://...)"
                            value={sub.value || ''}
                            onChange={(e) => {
                              const updated = action.condition!.onFalse.map(s => s.id === sub.id ? { ...s, value: e.target.value } : s);
                              updateAction(action.id, { condition: { ...action.condition!, onFalse: updated } });
                            }}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-[9px]"
                          />
                        )}
                        {sub.type === 'setProperty' && (
                          <div className="grid grid-cols-2 gap-1">
                            <select 
                              value={sub.property}
                              onChange={(e) => {
                                const updated = action.condition!.onFalse.map(s => s.id === sub.id ? { ...s, property: e.target.value } : s);
                                updateAction(action.id, { condition: { ...action.condition!, onFalse: updated } });
                              }}
                              className="bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-[9px]"
                            >
                              <option value="text">Text/Value</option>
                              <option value="bgColor">BG Color</option>
                              <option value="textColor">Text Color</option>
                              <option value="hidden">Hidden (true/false)</option>
                            </select>
                            <input 
                              type="text"
                              placeholder="Value"
                              value={sub.value || ''}
                              onChange={(e) => {
                                const updated = action.condition!.onFalse.map(s => s.id === sub.id ? { ...s, value: e.target.value } : s);
                                updateAction(action.id, { condition: { ...action.condition!, onFalse: updated } });
                              }}
                              className="bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-[9px]"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {action.type === 'setProperty' && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <select 
                      value={action.targetElementId}
                      onChange={(e) => updateAction(action.id, { targetElementId: e.target.value })}
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-[11px] focus:outline-none"
                    >
                      {elements.map(el => (
                        <option key={el.id} value={el.id}>{el.id}</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-neutral-500">.</span>
                    <select 
                      value={action.property}
                      onChange={(e) => updateAction(action.id, { property: e.target.value })}
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-[11px] focus:outline-none"
                    >
                      <option value="text">text</option>
                      <option value="bgColor">bgColor</option>
                      <option value="textColor">textColor</option>
                      <option value="hidden">hidden</option>
                    </select>
                  </div>
                  <input 
                    type="text"
                    value={action.value || ''}
                    onChange={(e) => updateAction(action.id, { value: e.target.value })}
                    placeholder="Value..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-[11px] focus:outline-none"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  logic: LogicBlockNode,
};

// --- Main Component ---

interface LogicEditorProps {
  elements: UIElement[];
  logicBlocks: LogicBlock[];
  setLogicBlocks: React.Dispatch<React.SetStateAction<LogicBlock[]>>;
}

export default function LogicEditor({ elements, logicBlocks, setLogicBlocks }: LogicEditorProps) {
  const [nodes, setNodes] = useNodesState([]);
  const reactFlowInstance = React.useRef<any>(null);

  // Sync state to nodes without resetting positions
  React.useEffect(() => {
    setNodes((currentNodes) => {
      const newNodes: Node[] = [];

      // Add/Update Logic Block Nodes
      logicBlocks.forEach((block, index) => {
        const existingNode = currentNodes.find(n => n.id === block.id);
        newNodes.push({
          id: block.id,
          type: 'logic',
          data: { 
            block, 
            elements,
            onUpdate: (id: string, updates: Partial<LogicBlock>) => {
              setLogicBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
            },
            onDelete: (id: string) => {
              setLogicBlocks(prev => prev.filter(b => b.id !== id));
            }
          },
          position: existingNode?.position || { x: block.x || 400, y: block.y || (100 + index * 350) },
          draggable: true,
          selectable: true,
        });
      });

      return newNodes;
    });
  }, [elements, logicBlocks, setLogicBlocks, setNodes]);

  // Handle node position changes to persist them internally in ReactFlow state
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  // Persist the final node position to the logicBlocks state only when dragging stops
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (!node.id.startsWith('source_')) {
        setLogicBlocks(prev => prev.map(b => 
          b.id === node.id ? { ...b, x: node.position!.x, y: node.position!.y } : b
        ));
      }
    },
    [setLogicBlocks]
  );

  // Auto fit view only once or when number of blocks changes significantly
  const prevBlocksLength = React.useRef(logicBlocks.length);
  React.useEffect(() => {
    if (reactFlowInstance.current && logicBlocks.length > prevBlocksLength.current) {
      setTimeout(() => {
        reactFlowInstance.current.fitView({ duration: 400, padding: 0.2 });
      }, 50);
    }
    prevBlocksLength.current = logicBlocks.length;
  }, [logicBlocks.length]);

  const addLogicBlock = () => {
    const newBlock: LogicBlock = {
      id: `logic_${Math.random().toString(36).substr(2, 9)}`,
      elementId: elements[0]?.id || '',
      event: 'click',
      actions: []
    };
    setLogicBlocks([...logicBlocks, newBlock]);
  };

  const onInit = (instance: any) => {
    reactFlowInstance.current = instance;
  };

  return (
    <div className="flex-1 flex bg-neutral-950 overflow-hidden">
      {/* Left Sidebar - Design Elements */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-900 flex flex-col">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Design Elements</h2>
          <MousePointer2 className="w-4 h-4 text-neutral-500" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {elements.map(el => (
            <div key={el.id} className="p-3 bg-neutral-800 border border-neutral-700 rounded-xl flex items-center gap-3 group hover:border-blue-500 transition-all cursor-grab active:cursor-grabbing">
              <div className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center text-neutral-400 group-hover:text-blue-400 transition-colors">
                {el.type === 'button' && <MousePointer2 className="w-4 h-4" />}
                {el.type === 'textInput' && <Workflow className="w-4 h-4" />}
                {el.type === 'label' && <Layout className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-tighter">{el.type}</div>
                <div className="text-xs font-medium text-neutral-200">{el.id}</div>
              </div>
            </div>
          ))}
          {elements.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-2 text-center p-4">
              <Settings2 className="w-8 h-8 opacity-20" />
              <p className="text-xs">No elements in design yet</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Flow Area */}
      <section className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
          onInit={onInit}
          nodeTypes={nodeTypes}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag={true}
        >
          <Background color="#222" gap={20} />
          <Controls />
        </ReactFlow>
        
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <button 
            onClick={addLogicBlock}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Logic Block
          </button>
        </div>
      </section>
    </div>
  );
}
