'use client';

import React, { useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Extension } from '@tiptap/core';

interface TiptapEditorProps {
  initialContent?: any;
  onChange?: (json: any) => void;
  isChecklistModeAlways?: boolean;
  maxLinesPerPage?: number;
  onPageLimitReached?: () => void;
}

export interface TiptapEditorRef {
  setColor: (color: string) => void;
  setFont: (font: string) => void;
  toggleTaskList: () => void;
  undo: () => void;
  redo: () => void;
  getTasks: () => { text: string; completed: boolean }[];
}

export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  (
    {
      initialContent,
      onChange,
      isChecklistModeAlways = false,
      maxLinesPerPage = 18,
      onPageLimitReached,
    },
    ref
  ) => {
    const onPageLimitReachedRef = React.useRef(onPageLimitReached);
    onPageLimitReachedRef.current = onPageLimitReached;
    const isChecklistModeRef = React.useRef(isChecklistModeAlways);
    isChecklistModeRef.current = isChecklistModeAlways;

    // Accurate top-level visible line counting
    const PageLimitExtension = Extension.create({
      name: 'pageLimit',
      addKeyboardShortcuts() {
        return {
          Enter: ({ editor }) => {
            const doc = editor.state.doc;
            
            // Count actual visible lines (paragraphs, taskItems, headings)
            let actualLinesCount = 0;
            doc.descendants((node) => {
              if (node.type.name === 'paragraph' || node.type.name === 'taskItem' || node.type.name === 'heading') {
                actualLinesCount += 1;
              }
            });

            // Only flip to next page when page lines genuinely reach or exceed 18 lines
            if (actualLinesCount >= maxLinesPerPage) {
              if (onPageLimitReachedRef.current) {
                onPageLimitReachedRef.current();
                return true;
              }
            }

            // Normal typing inside a taskItem: continue checkbox
            if (editor.isActive('taskItem')) {
              return editor.commands.splitListItem('taskItem');
            }

            // If checklist toggle is active, create checkbox on new line
            if (isChecklistModeRef.current) {
              editor.chain().splitBlock().toggleTaskList().run();
              return true;
            }

            return false; // Default normal enter behavior
          },
        };
      },
    });

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Underline,
        TextStyle,
        Color,
        FontFamily,
        Highlight.configure({ multicolor: true }),
        TaskList.configure({
          HTMLAttributes: {
            class: 'space-y-0',
          },
        }),
        TaskItem.configure({
          nested: false,
          HTMLAttributes: {
            class: 'flex items-center gap-2',
          },
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Placeholder.configure({
          placeholder: 'Start writing your notes on the lines...',
        }),
        PageLimitExtension,
      ],
      content: initialContent || {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
      editorProps: {
        attributes: {
          class:
            'tiptap-notebook-editor focus:outline-none w-full text-slate-900',
          style: `font-family: var(--font-kalam); color: #000000; min-height: ${maxLinesPerPage * 44}px; max-height: ${maxLinesPerPage * 44}px; overflow: hidden;`,
        },
      },
      onUpdate: ({ editor }) => {
        if (onChange) {
          onChange(editor.getJSON());
        }
      },
    });

    useImperativeHandle(ref, () => ({
      setColor: (color: string) => {
        if (editor) {
          editor.chain().focus().setColor(color).run();
        }
      },
      setFont: (font: string) => {
        if (editor) {
          editor.chain().focus().setFontFamily(font).run();
        }
      },
      toggleTaskList: () => {
        if (editor) {
          editor.chain().focus().toggleTaskList().run();
        }
      },
      undo: () => {
        if (editor) editor.chain().focus().undo().run();
      },
      redo: () => {
        if (editor) editor.chain().focus().redo().run();
      },
      getTasks: () => {
        if (!editor) return [];
        const taskItems: { text: string; completed: boolean }[] = [];
        editor.state.doc.descendants((node) => {
          if (node.type.name === 'taskItem') {
            taskItems.push({
              text: node.textContent || 'Task item',
              completed: Boolean(node.attrs.checked),
            });
          }
        });
        return taskItems;
      },
    }));

    return (
      <div className="relative w-full h-full text-left" dir="ltr">
        <EditorContent editor={editor} />
      </div>
    );
  }
);

TiptapEditor.displayName = 'TiptapEditor';
