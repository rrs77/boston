import React, { useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text here...',
  minHeight = '150px',
  className = ''
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  // Set up the editor with RTL support and paste handling
  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.root.dir = 'ltr';
      
      // Configure clipboard to preserve formatting
      const clipboard = editor.getModule('clipboard');
      if (clipboard) {
        // Preserve lists (UL and OL)
        clipboard.addMatcher(Node.ELEMENT_NODE, (node: any, delta: any) => {
          if (node.tagName === 'UL') {
            const listItems = Array.from(node.querySelectorAll('li'));
            let newDelta = delta;
            listItems.forEach((li: any) => {
              const text = li.textContent || '';
              if (text.trim()) {
                newDelta = newDelta.insert(text, { list: 'bullet' });
                newDelta = newDelta.insert('\n');
              }
            });
            return newDelta;
          }
          if (node.tagName === 'OL') {
            const listItems = Array.from(node.querySelectorAll('li'));
            let newDelta = delta;
            listItems.forEach((li: any) => {
              const text = li.textContent || '';
              if (text.trim()) {
                newDelta = newDelta.insert(text, { list: 'ordered' });
                newDelta = newDelta.insert('\n');
              }
            });
            return newDelta;
          }
          // Preserve line breaks
          if (node.tagName === 'BR') {
            return delta.insert('\n');
          }
          // Preserve paragraphs and divs as line breaks
          if (node.tagName === 'P' || node.tagName === 'DIV') {
            const text = node.textContent || '';
            if (text.trim()) {
              return delta.insert(text + '\n');
            }
            return delta.insert('\n');
          }
          return delta;
        });
        
        // Preserve plain text line breaks
        clipboard.addMatcher(Node.TEXT_NODE, (node: any, delta: any) => {
          const text = node.data || '';
          if (text.includes('\n')) {
            const lines = text.split('\n');
            let newDelta = delta;
            lines.forEach((line: string, index: number) => {
              if (index > 0) {
                newDelta = newDelta.insert('\n');
              }
              if (line) {
                newDelta = newDelta.insert(line);
              }
            });
            return newDelta;
          }
          return delta.insert(text);
        });
      }
    }
  }, []);

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ],
    clipboard: {
      // Preserve formatting when pasting
      matchVisual: false,
    },
  };

  const formats = [
    'bold', 'italic', 'underline',
    'list', 'bullet', 'ordered',
    'indent', 'align',
  ];

  return (
    <div className={`rich-text-editor ${className}`} style={{ direction: 'ltr' }}>
      <style>{`
        .rich-text-editor .ql-container {
          min-height: ${minHeight};
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          background: white;
          border-color: #D4F1EF;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: #f9fafb;
          border-color: #D4F1EF;
        }
        .rich-text-editor .ql-toolbar button:hover {
          color: #17A697;
        }
        .rich-text-editor .ql-toolbar button.ql-active {
          color: #17A697;
        }
        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: #2D3748;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-stroke {
          stroke: #17A697;
        }
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #17A697;
        }
        .rich-text-editor .ql-toolbar .ql-fill {
          fill: #2D3748;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-fill {
          fill: #17A697;
        }
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #17A697;
        }
        .rich-text-editor .ql-editor {
          min-height: ${minHeight};
          direction: ltr;
          text-align: left;
          color: #2D3748;
          font-size: 18px;
          line-height: 1.5;
        }
        .rich-text-editor .ql-editor p {
          font-size: 18px;
          line-height: 1.5;
          margin-bottom: 0.5em;
        }
        .rich-text-editor .ql-editor li {
          font-size: 18px;
          line-height: 1.5;
          margin-bottom: 0.25em;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}