'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Plus, Pencil, Trash2, FolderOpen } from 'lucide-react'
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/categories'
import type { Category } from '@/types/database'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
]

interface CategoryManagerProps {
  categories: Category[]
  onUpdate: () => void
}

export function CategoryManager({ categories, onUpdate }: CategoryManagerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')

  const handleOpenAdd = () => {
    setEditingCategory(null)
    setName('')
    setColor('#3b82f6')
    setOpen(true)
  }

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat)
    setName(cat.name)
    setColor(cat.color)
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)

    let result
    if (editingCategory) {
      result = await updateCategory(editingCategory.id, { name: name.trim(), color })
    } else {
      result = await createCategory({ name: name.trim(), color, sort_order: categories.length, icon: null, is_default: false })
    }

    setLoading(false)

    if (!result.error) {
      setOpen(false)
      setName('')
      setEditingCategory(null)
      onUpdate()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ลบหมวดหมู่นี้? (กิจวัตรในหมวดหมู่จะยังอยู่)')) return

    const result = await deleteCategory(id)
    if (!result.error) {
      onUpdate()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FolderOpen className="h-4 w-4" />
          <span>หมวดหมู่ ({categories.length})</span>
        </div>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" onClick={handleOpenAdd}>
            <Plus className="mr-1 h-4 w-4" />
            เพิ่มหมวดหมู่
          </Button>
        </DialogTrigger>
      </div>

      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.name}</span>
              <button
                onClick={() => handleOpenEdit(cat)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
              </button>
              {!cat.is_default && (
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">ชื่อหมวดหมู่</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="เช่น สุขภาพ, งานบ้าน"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">สี</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingCategory ? (
                'บันทึก'
              ) : (
                'เพิ่ม'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
