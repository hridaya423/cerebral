declare module 'react-highlight-words' {
  import { ComponentType } from 'react';
  
  interface HighlighterProps {
    searchWords: string[];
    textToHighlight: string;
    highlightClassName?: string;
    className?: string;
    caseSensitive?: boolean;
    findChunks?: (options: {
      autoEscape?: boolean;
      caseSensitive?: boolean;
      sanitize?: (text: string) => string;
      searchWords: string[];
      textToHighlight: string;
    }) => Array<{ start: number; end: number; highlight: boolean }>;
    highlightTag?: string | ComponentType<unknown>;
    highlightStyle?: React.CSSProperties;
    sanitize?: (text: string) => string;
    unhighlightClassName?: string;
    unhighlightStyle?: React.CSSProperties;
    autoEscape?: boolean;
  }
  
  const Highlighter: ComponentType<HighlighterProps>;
  export default Highlighter;
} 