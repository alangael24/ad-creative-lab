'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { useCallback, useEffect, useState, useRef } from 'react'
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Undo, Redo, Link as LinkIcon, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InsightEditorProps {
  initialContent?: string
  onSave: (content: string) => Promise<void>
  autoSave?: boolean
}

export function InsightEditor({ initialContent, onSave, autoSave = true }: InsightEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Escribe tus insights, patrones y observaciones aquí...',
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: initialContent ? JSON.parse(initialContent) : '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      if (!autoSave) return

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        const content = JSON.stringify(editor.getJSON())
        setIsSaving(true)
        try {
          await onSaveRef.current(content)
          setLastSaved(new Date())
        } finally {
          setIsSaving(false)
        }
      }, 2000)
    },
  })

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleManualSave = useCallback(async () => {
    if (!editor) return
    const content = JSON.stringify(editor.getJSON())
    setIsSaving(true)
    try {
      await onSave(content)
      setLastSaved(new Date())
    } finally {
      setIsSaving(false)
    }
  }, [editor, onSave])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return <div className="animate-pulse bg-muted h-[500px] rounded-lg" />
  }

  return (
    <div className="border rounded-lg bg-card">
      {/* Toolbar */}
      <div className="border-b p-2 flex items-center gap-1 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-muted' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={editor.isActive('link') ? 'bg-muted' : ''}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        {/* Save status */}
        <div className="text-xs text-muted-foreground mr-2">
          {isSaving ? (
            'Guardando...'
          ) : lastSaved ? (
            `Guardado ${lastSaved.toLocaleTimeString()}`
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={handleManualSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-1" />
          Guardar
        </Button>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  )
}
