import React, { useState } from 'react';
import { UIElement, LogicBlock, LogicAction } from '../types';
import { Copy, Download, Edit3, Code2, Eye } from 'lucide-react';

interface ResultViewProps {
  elements: UIElement[];
  logicBlocks: LogicBlock[];
  canvasWidth: number;
  canvasHeight: number;
  projectName: string;
}

export default function ResultView({ elements, logicBlocks, canvasWidth, canvasHeight, projectName }: ResultViewProps) {
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'CODE'>('PREVIEW');
  const [manualCode, setManualCode] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const generateCSS = (elements: UIElement[]) => {
    return `        body { margin: 0; padding: 0; background: #f0f2f5; font-family: sans-serif; }
        .app-container {
            position: relative;
            width: ${canvasWidth}px;
            height: ${canvasHeight}px;
            background: white;
            margin: 40px auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border-radius: 8px;
        }
${elements.map(el => `        .element-${el.id} {
            position: absolute;
            left: ${el.x}px;
            top: ${el.y}px;
            width: ${el.width}px;
            height: ${el.height}px;
            z-index: ${el.depth};
            background-color: ${el.bgColor || el.color || 'transparent'};
            color: ${el.textColor || 'inherit'};
            border-radius: ${el.borderRadius || 0}px;
            border: ${el.borderWidth || 0}px solid ${el.borderColor || 'transparent'};
            font-size: ${el.fontSize || 14}px;
            text-align: ${el.textAlign || 'left'};
            transform: rotate(${el.rotation || 0}deg);
            display: ${el.hidden ? 'none' : 'block'};
            box-sizing: border-box;
            ${el.fontFamily ? `font-family: ${el.fontFamily};` : ''}
        }`).join('\n')}`;
  };

  const generateJS = (logicBlocks: LogicBlock[]) => {
    const generateActionJS = (action: LogicAction): string => {
      switch (action.type) {
        case 'hide': return `                document.getElementById('${action.targetElementId}').style.display = 'none';`;
        case 'show': return `                document.getElementById('${action.targetElementId}').style.display = 'block';`;
        case 'openLink': return `                window.open('${action.value}', '_blank');`;
        case 'setProperty': 
          const cleanPropValue = (action.value || '').replace(/^["']|["']$/g, '');
          if (action.property === 'hidden') {
            return `                document.getElementById('${action.targetElementId}').style.display = ${cleanPropValue === 'true' ? "'none'" : "'block'"};`;
          }
          if (action.property === 'text') {
            return `                const target = document.getElementById('${action.targetElementId}');
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') target.value = '${cleanPropValue}';
                else target.innerText = '${cleanPropValue}';`;
          }
          const propMap: Record<string, string> = {
            'bgColor': 'backgroundColor',
            'textColor': 'color'
          };
          const finalProp = propMap[action.property] || action.property;
          return `                document.getElementById('${action.targetElementId}').style.${finalProp} = '${cleanPropValue}';`;
        case 'checkValue': 
          if (action.condition) {
            const cond = action.condition;
            const ruleJS = cond.rules.map(rule => {
              const cleanValue = rule.expectedValue.replace(/^["']|["']$/g, '');
              return `(() => {
                    const el = document.getElementById('${rule.elementId}');
                    if (!el) return false;
                    let val = '';
                    if (el.type === 'checkbox' || el.type === 'radio') {
                        val = el.checked ? (el.getAttribute('value') || el.id) : '';
                    } else {
                        val = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' ? el.value : el.innerText;
                    }
                    return val ${rule.operator === '==' ? '===' : rule.operator} '${cleanValue}';
                })()`;
            }).join(` ${cond.logicalOperator === 'AND' ? '&&' : '||'} `);

            return `                if (${ruleJS}) {
                    ${cond.onTrue.map(a => generateActionJS(a)).join('\n                    ')}
                } else {
                    ${cond.onFalse.map(a => generateActionJS(a)).join('\n                    ')}
                }`;
          }
          return '';
        default: return '';
      }
    };

    return `        document.addEventListener('DOMContentLoaded', () => {
${logicBlocks.map(block => {
  const eventMap: Record<string, string> = {
    'click': 'click',
    'hover': 'mouseenter',
    'exit': 'mouseleave',
    'doubleClick': 'dblclick',
    'change': 'change'
  };
  
  const jsActions = block.actions.map(action => generateActionJS(action)).join('\n');

  return `            const el_${block.id} = document.getElementById('${block.elementId}');
            if (el_${block.id}) {
                el_${block.id}.addEventListener('${eventMap[block.event]}', () => {
${jsActions}
                });
            }`;
}).join('\n')}
        });`;
  };

  const generateHTML = (elements: UIElement[]) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated App</title>
    <style>
${generateCSS(elements)}
    </style>
</head>
<body>
    <div class="app-container">
${elements.map(el => {
  const common = `id="${el.id}" class="element-${el.id}"`;
  switch (el.type) {
    case 'button': return `        <button ${common}>${el.text}</button>`;
    case 'textInput': return `        <input type="text" ${common} placeholder="${el.placeholder}">`;
    case 'label': return `        <label ${common}>${el.text}</label>`;
    case 'dropdown': return `        <select ${common}>\n${el.options?.map(o => `            <option value="${o}">${o}</option>`).join('\n')}\n        </select>`;
    case 'radioButton': return `        <input type="radio" ${common} name="${el.groupId}" value="${el.value || el.id}" ${el.checked ? 'checked' : ''}>`;
    case 'checkbox': return `        <input type="checkbox" ${common} value="${el.value || el.id}" ${el.checked ? 'checked' : ''}>`;
    case 'image': return `        <img ${common} src="${el.src}" alt="">`;
    case 'textArea': return `        <textarea ${common}>${el.text || ''}</textarea>`;
    case 'slider': return `        <input type="range" ${common} min="${el.min}" max="${el.max}" step="${el.step}" value="${el.value}">`;
    case 'passwordInput': return `        <input type="password" ${common}>`;
    case 'rectangle': return `        <div ${common}></div>`;
    default: return `        <div ${common}></div>`;
  }
}).join('\n')}
    </div>
    <script>
${generateJS(logicBlocks)}
    </script>
</body>
</html>`;
  };

  const fullCode = manualCode || generateHTML(elements);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullCode);
    alert('Code copied to clipboard!');
  };

  const downloadFile = () => {
    const blob = new Blob([fullCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = projectName.toLowerCase().replace(/\s+/g, '-') || 'my-app';
    a.download = `${fileName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
      <div className="h-12 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-900">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('PREVIEW')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all ${activeTab === 'PREVIEW' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button 
            onClick={() => setActiveTab('CODE')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all ${activeTab === 'CODE' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <Code2 className="w-4 h-4" />
            Source Code
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setIsEditing(!isEditing);
              if (!isEditing) setActiveTab('CODE');
            }} 
            className={`p-2 rounded-lg transition-all ${isEditing ? 'bg-purple-600 text-white' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'}`} 
            title="Edit Manually"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={copyToClipboard} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-all" title="Copy to Clipboard">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={downloadFile} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-all" title="Download .html">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'PREVIEW' ? (
          <div className="w-full h-full flex items-center justify-center p-8 bg-neutral-950 overflow-auto">
            <iframe 
              srcDoc={fullCode}
              className="bg-white rounded-lg shadow-2xl border-none"
              style={{ width: canvasWidth, height: canvasHeight }}
              title="Preview"
            />
          </div>
        ) : (
          <div className="w-full h-full p-8 overflow-auto bg-neutral-950">
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              {isEditing ? (
                <textarea
                  value={fullCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1 w-full p-6 bg-neutral-900 border border-neutral-800 rounded-xl text-blue-400 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  spellCheck={false}
                />
              ) : (
                <pre className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl text-blue-400 font-mono text-sm leading-relaxed overflow-x-auto">
                  {fullCode}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
