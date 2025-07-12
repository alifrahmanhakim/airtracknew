
'use client';

import * as React from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Pilcrow,
} from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import DOMPurify from 'dompurify';
import { Toggle } from './toggle';
import { Separator } from './separator';
import { cn } from '@/lib/utils';

const TiptapToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-input p-2">
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Toggle bold"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Toggle italic"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Toggle strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive('paragraph')}
        onPressedChange={() => editor.chain().focus().setParagraph().run()}
        aria-label="Toggle Paragraph"
      >
        <Pilcrow className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        aria-label="Toggle Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="Toggle Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        aria-label="Toggle Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>
       <Separator orientation="vertical" className="h-8 mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Toggle bullet list"
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Toggle ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Toggle blockquote"
      >
        <Quote className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 mx-1" />
      <Toggle
        size="sm"
        onPressedChange={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        aria-label="Undo"
      >
        <Undo className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        onPressedChange={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        aria-label="Redo"
      >
        <Redo className="h-4 w-4" />
      </Toggle>
    </div>
  );
};


interface RichTextInputProps {
  name: string;
}

export function RichTextInput({ name }: RichTextInputProps) {
  const { setValue, watch, formState: { isSubmitting } } = useFormContext();
  const initialContent = watch(name) || '';

  const editor = useEditor({
    extensions: [StarterKit],
    content: '', // Start empty, content is set via useEffect
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base max-w-none focus:outline-none px-3 py-2',
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      const sanitizedHtml = typeof window !== 'undefined' ? DOMPurify.sanitize(html) : html;
      setValue(name, sanitizedHtml, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    editable: !isSubmitting,
  });

  React.useEffect(() => {
    if (isSubmitting) {
        editor?.setEditable(false);
    } else {
        editor?.setEditable(true);
    }
  }, [isSubmitting, editor]);

  React.useEffect(() => {
    if (editor && !editor.isDestroyed) {
        const sanitizedInitialContent = typeof window !== 'undefined' ? DOMPurify.sanitize(initialContent) : initialContent;
        const currentEditorContent = editor.getHTML();

        if (currentEditorContent !== sanitizedInitialContent) {
            // Use a timeout to ensure the editor is ready for content update
            setTimeout(() => {
                editor.commands.setContent(sanitizedInitialContent, false);
            }, 0);
        }
    }
    // Only run this when the component mounts or the editor instance changes
  }, [editor]); 
  
  // Watch for external changes to the form value and update the editor
  React.useEffect(() => {
    const subscription = watch((value, { name: fieldName }) => {
        if (fieldName === name && editor && !editor.isDestroyed) {
             const formValue = value[name] || '';
             const editorValue = editor.getHTML();
             if (formValue !== editorValue) {
                const sanitizedFormValue = typeof window !== 'undefined' ? DOMPurify.sanitize(formValue) : formValue;
                editor.commands.setContent(sanitizedFormValue, false);
             }
        }
    });
    return () => subscription.unsubscribe();
  }, [watch, editor, name]);


  return (
    <div className={cn('rounded-md border border-input focus-within:ring-2 focus-within:ring-ring', isSubmitting ? 'bg-muted' : '')}>
        <TiptapToolbar editor={editor} />
        <EditorContent editor={editor} className="min-h-[120px]"/>
    </div>
  );
}
