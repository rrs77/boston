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
      }
      
      // Also handle paste event directly to preserve HTML
      const container = editor.root;
      container.addEventListener('paste', (e: ClipboardEvent) => {
        e.preventDefault();
        const clipboardData = e.clipboardData;
        if (clipboardData) {
          const html = clipboardData.getData('text/html');
          const text = clipboardData.getData('text/plain');
          
          if (html) {
            // Use HTML if available to preserve formatting
            const range = editor.getSelection(true);
            if (range) {
              // Convert HTML to Delta while preserving structure
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = html;
              
              // Process the HTML to preserve lists and line breaks
              let delta = editor.clipboard.convert(tempDiv);
              editor.updateContents(delta, 'user');
              editor.setSelection(range.index + delta.length());
            }
          } else if (text) {
            // Fallback to plain text, preserving line breaks
            const range = editor.getSelection(true);
            if (range) {
              const lines = text.split('\n');
              let delta = editor.clipboard.convert({});
              lines.forEach((line, index) => {
                if (index > 0) {
                  delta = delta.insert('\n');
                }
                if (line) {
                  delta = delta.insert(line);
                }
              });
              editor.updateContents(delta, 'user');
              editor.setSelection(range.index + delta.length());
            }
          }
        }
      }, true);
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