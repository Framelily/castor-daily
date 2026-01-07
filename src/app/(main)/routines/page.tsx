'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react'
import { loadRoutinesData, toggleTemplate, deleteTemplate } from '@/lib/actions/templates'
import type { TaskTemplateWithCategory, Category } from '@/types/database'
import { RoutineDialog } from '@/components/routines/RoutineDialog'
import { CategoryManager } from '@/components/routines/CategoryManager'

const TIME_SLOT_LABELS: Record<string, string> = {
  pre_work: 'ก่อนเริ่มงาน',
  during_work: 'ระหว่างทำงาน',
  post_work: 'หลังเลิกงาน',
  anytime: 'ทำได้ตลอดวัน',
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'ทุกวัน',
  weekly: 'รายสัปดาห์',
  interval: 'ทุก N วัน',
  monthly: 'รายเดือน',
}

export default function RoutinesPage() {
  const [templates, setTemplates] = useState<TaskTemplateWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplateWithCategory | null>(null)
  const hasInitialized = useRef(false)

  const fetchData = async () => {
    // Single optimized action that fetches both in one call
    const result = await loadRoutinesData()
    if (!result.error) {
      setTemplates(result.templates)
      setCategories(result.categories)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [])

  const handleToggle = async (id: string, isActive: boolean) => {
    // Optimistic update
    setTemplates(prev =>
      prev.map(t => t.id === id ? { ...t, is_active: isActive } : t)
    )

    const result = await toggleTemplate(id, isActive)
    if (result.error) {
      // Revert on error
      setTemplates(prev =>
        prev.map(t => t.id === id ? { ...t, is_active: !isActive } : t)
      )
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบกิจวัตรนี้หรือไม่?')) return

    const result = await deleteTemplate(id)
    if (!result.error) {
      setTemplates(prev => prev.filter(t => t.id !== id))
    }
  }

  const handleEdit = (template: TaskTemplateWithCategory) => {
    setEditingTemplate(template)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingTemplate(null)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingTemplate(null)
  }

  const handleDialogSuccess = () => {
    handleDialogClose()
    fetchData()
  }

  // Group templates by category
  const groupedTemplates = templates.reduce<Record<string, TaskTemplateWithCategory[]>>((acc, template) => {
    const categoryId = template.category_id || 'uncategorized'
    if (!acc[categoryId]) {
      acc[categoryId] = []
    }
    acc[categoryId].push(template)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">กิจวัตรของฉัน</h1>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={handleAdd}
        >
          <Plus className="mr-1 h-4 w-4" />
          เพิ่ม
        </Button>
      </div>

      {/* Category Manager */}
      <CategoryManager categories={categories} onUpdate={fetchData} />

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="mb-4 text-4xl">📁</div>
            <p className="mb-2 font-medium">ยังไม่มีหมวดหมู่</p>
            <p className="text-sm text-muted-foreground">
              สร้างหมวดหมู่ก่อนเพื่อจัดระเบียบกิจวัตรของคุณ
            </p>
          </CardContent>
        </Card>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="mb-4 text-4xl">🦫</div>
            <p className="mb-2 font-medium">ยังไม่มีกิจวัตร</p>
            <p className="text-sm text-muted-foreground">
              เริ่มสร้างกิจวัตรแรกของคุณเพื่อติดตามความก้าวหน้า
            </p>
            <Button
              className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAdd}
            >
              <Plus className="mr-1 h-4 w-4" />
              สร้างกิจวัตร
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map(category => {
            const categoryTemplates = groupedTemplates[category.id] || []
            if (categoryTemplates.length === 0) return null

            return (
              <Card key={category.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      {categoryTemplates.filter(t => t.is_active).length}/{categoryTemplates.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categoryTemplates.map(template => (
                    <div
                      key={template.id}
                      className="flex items-start justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={template.is_active ? '' : 'text-muted-foreground'}>
                            {template.title}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{FREQUENCY_LABELS[template.frequency_type]}</span>
                          <span>•</span>
                          <span>{TIME_SLOT_LABELS[template.time_slot]}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(template)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Switch
                          checked={template.is_active}
                          onCheckedChange={(checked) => handleToggle(template.id, checked)}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}

          {/* Uncategorized templates */}
          {groupedTemplates['uncategorized']?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="h-3 w-3 rounded-full bg-gray-400" />
                  ไม่มีหมวดหมู่
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedTemplates['uncategorized'].map(template => (
                  <div
                    key={template.id}
                    className="flex items-start justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={template.is_active ? '' : 'text-muted-foreground'}>
                          {template.title}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{FREQUENCY_LABELS[template.frequency_type]}</span>
                        <span>•</span>
                        <span>{TIME_SLOT_LABELS[template.time_slot]}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={(checked) => handleToggle(template.id, checked)}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <RoutineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
        categories={categories}
        onSuccess={handleDialogSuccess}
      />
    </div>
  )
}
