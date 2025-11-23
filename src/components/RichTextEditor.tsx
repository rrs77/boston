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

  // Set up the editor with RTL support
  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.root.dir = 'ltr';
    }
  }, []);

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  const formats = [
    'bold', 'italic', 'underline',
    'list', 'bullet', 'indent',
  ];

  return (
    <div className={`rich-text-editor ${className}`} style={{ direction: 'ltr' }}>
      <style jsx="true">{`
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
          font-size: 16px;
          line-height: 1.6;
        }
        .rich-text-editor .ql-editor p {
          font-size: 16px;
          line-height: 1.6;
        }
        .rich-text-editor .ql-editor li {
          font-size: 16px;
          line-height: 1.6;
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