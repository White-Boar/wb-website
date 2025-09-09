'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  X, 
  GripVertical, 
  AlertCircle, 
  CheckCircle2,
  Edit2,
  Check
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ListItem {
  id: string
  value: string
  order: number
  metadata?: Record<string, any>
}

interface DynamicListProps {
  label: string
  items?: ListItem[]
  defaultItems?: ListItem[]
  placeholder?: string
  addButtonText?: string
  error?: string
  hint?: string
  success?: string
  required?: boolean
  maxItems?: number
  minItems?: number
  allowReorder?: boolean
  allowEdit?: boolean
  showCounter?: boolean
  itemPrefix?: string
  itemSuffix?: string
  className?: string
  onItemsChange?: (items: ListItem[]) => void
  onItemAdd?: (item: ListItem) => void
  onItemRemove?: (itemId: string) => void
  onItemEdit?: (item: ListItem) => void
}

export function DynamicList({
  label,
  items,
  defaultItems = [],
  placeholder,
  addButtonText,
  error,
  hint,
  success,
  required = false,
  maxItems = 10,
  minItems = 0,
  allowReorder = true,
  allowEdit = true,
  showCounter = true,
  itemPrefix,
  itemSuffix,
  className,
  onItemsChange,
  onItemAdd,
  onItemRemove,
  onItemEdit
}: DynamicListProps) {
  const t = useTranslations('forms.dynamicList')
  
  const [internalItems, setInternalItems] = useState<ListItem[]>(
    items || defaultItems
  )
  const [newItemValue, setNewItemValue] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const hasError = !!error
  const hasSuccess = !!success && !hasError
  const canAddMore = internalItems.length < maxItems
  const hasMinimumItems = internalItems.length >= minItems
  const isValid = hasMinimumItems && internalItems.length <= maxItems

  // Update internal items when external items change
  useEffect(() => {
    if (items) {
      setInternalItems(items)
    }
  }, [items])

  // Generate unique ID
  const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Add new item
  const handleAddItem = () => {
    if (!newItemValue.trim() || !canAddMore) return

    const newItem: ListItem = {
      id: generateId(),
      value: newItemValue.trim(),
      order: internalItems.length
    }

    const updatedItems = [...internalItems, newItem]
    setInternalItems(updatedItems)
    setNewItemValue('')
    
    onItemsChange?.(updatedItems)
    onItemAdd?.(newItem)
  }

  // Remove item
  const handleRemoveItem = (itemId: string) => {
    const updatedItems = internalItems
      .filter(item => item.id !== itemId)
      .map((item, index) => ({ ...item, order: index }))
    
    setInternalItems(updatedItems)
    onItemsChange?.(updatedItems)
    onItemRemove?.(itemId)
  }

  // Start editing item
  const handleStartEdit = (item: ListItem) => {
    setEditingId(item.id)
    setEditingValue(item.value)
  }

  // Save edit
  const handleSaveEdit = () => {
    if (!editingValue.trim() || !editingId) return

    const updatedItems = internalItems.map(item =>
      item.id === editingId 
        ? { ...item, value: editingValue.trim() }
        : item
    )

    setInternalItems(updatedItems)
    setEditingId(null)
    setEditingValue('')

    const editedItem = updatedItems.find(item => item.id === editingId)
    if (editedItem) {
      onItemsChange?.(updatedItems)
      onItemEdit?.(editedItem)
    }
  }

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingValue('')
  }

  // Handle key press for add input
  const handleAddKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddItem()
    }
  }

  // Handle key press for edit input
  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    if (!allowReorder) return
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!allowReorder) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (!allowReorder || !draggedItem) return
    
    e.preventDefault()
    
    if (draggedItem === targetId) {
      setDraggedItem(null)
      return
    }

    const draggedIndex = internalItems.findIndex(item => item.id === draggedItem)
    const targetIndex = internalItems.findIndex(item => item.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null)
      return
    }

    const reorderedItems = [...internalItems]
    const [draggedElement] = reorderedItems.splice(draggedIndex, 1)
    reorderedItems.splice(targetIndex, 0, draggedElement)

    // Update order property
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      order: index
    }))

    setInternalItems(updatedItems)
    setDraggedItem(null)
    onItemsChange?.(updatedItems)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label 
            className={cn(
              "text-sm font-medium",
              hasError && "text-destructive",
              hasSuccess && "text-green-600"
            )}
          >
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-label={t('required')}>
                *
              </span>
            )}
          </Label>
          
          {showCounter && (
            <div className="text-xs text-muted-foreground">
              {internalItems.length}/{maxItems}
            </div>
          )}
        </div>

        {/* Validation Status */}
        {minItems > 0 && (
          <div className={cn(
            "text-xs",
            hasMinimumItems ? "text-green-600" : "text-muted-foreground"
          )}>
            {hasMinimumItems ? (
              t('minimumMet', { min: minItems })
            ) : (
              t('minimumRequired', { min: minItems, current: internalItems.length })
            )}
          </div>
        )}
      </div>

      {/* Add New Item */}
      {canAddMore && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                onKeyPress={handleAddKeyPress}
                placeholder={placeholder || t('placeholder')}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddItem}
                disabled={!newItemValue.trim()}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                {addButtonText || t('add')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {internalItems.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              draggable={allowReorder}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group",
                draggedItem === item.id && "opacity-50",
                allowReorder && "cursor-move"
              )}
            >
              <Card className="transition-all hover:shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    {allowReorder && (
                      <div className="flex-shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}

                    {/* Order Badge */}
                    <Badge variant="outline" className="text-xs min-w-[2rem] text-center">
                      {index + 1}
                    </Badge>

                    {/* Item Content */}
                    <div className="flex-1 min-w-0">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyPress={handleEditKeyPress}
                            className="text-sm"
                            autoFocus
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={!editingValue.trim()}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 min-w-0">
                            {itemPrefix && (
                              <span className="text-muted-foreground text-sm flex-shrink-0">
                                {itemPrefix}
                              </span>
                            )}
                            <span className="text-sm truncate">
                              {item.value}
                            </span>
                            {itemSuffix && (
                              <span className="text-muted-foreground text-sm flex-shrink-0">
                                {itemSuffix}
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {allowEdit && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleStartEdit(item)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {internalItems.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <div className="space-y-2">
            <p className="text-sm">{t('empty')}</p>
            {minItems > 0 && (
              <p className="text-xs">
                {t('addMinimum', { min: minItems })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Max Items Warning */}
      {!canAddMore && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-800">
            {t('maxItems', { max: maxItems })}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-1">
        {/* Error Message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-destructive flex items-center gap-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.p>
        )}

        {/* Success Message */}
        {success && !error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-green-600 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </motion.p>
        )}

        {/* Hint */}
        {hint && !error && !success && (
          <p className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}