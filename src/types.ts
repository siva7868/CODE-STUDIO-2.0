export type ElementType = 
  | 'button' 
  | 'textInput' 
  | 'label' 
  | 'dropdown' 
  | 'radioButton' 
  | 'checkbox' 
  | 'image' 
  | 'textArea' 
  | 'slider' 
  | 'passwordInput' 
  | 'rectangle';

export interface UIElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  hidden: boolean;
  rotation?: number;
  
  // Common properties
  text?: string;
  placeholder?: string;
  textColor?: string;
  bgColor?: string;
  fontFamily?: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  
  // Specific properties
  options?: string[]; // for dropdown
  groupId?: string; // for radio button
  checked?: boolean; // for checkbox/radio
  src?: string; // for image
  value?: string | number; // for slider, radio, checkbox
  min?: number; // for slider
  max?: number; // for slider
  step?: number; // for slider
  passwordChar?: string; // for password input
  color?: string; // for rectangle
  fontType?: string; // for password input (e.g. '•', '*', '.')
}

export interface ProjectState {
  elements: UIElement[];
  selectedElementId: string | null;
}

export type ViewMode = 'DESIGN' | 'CODE' | 'RESULT';

export type LogicEventType = 'click' | 'hover' | 'exit' | 'doubleClick' | 'change';
export type LogicActionType = 'hide' | 'show' | 'openLink' | 'checkValue' | 'setProperty';

export interface LogicConnection {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface LogicBlock {
  id: string;
  elementId: string; // The UI element this logic is attached to
  event: LogicEventType;
  actions: LogicAction[];
  x?: number;
  y?: number;
}

export interface LogicAction {
  id: string;
  type: LogicActionType;
  targetElementId?: string;
  property?: string; // For setProperty
  value?: string; // For openLink or setProperty
  condition?: LogicCondition;
}

export interface LogicCondition {
  logicalOperator: 'AND' | 'OR';
  rules: LogicRule[];
  onTrue: LogicAction[];
  onFalse: LogicAction[];
}

export interface LogicRule {
  id: string;
  elementId: string;
  operator: '==' | '!=' | '>' | '<' | 'contains';
  expectedValue: string;
}
