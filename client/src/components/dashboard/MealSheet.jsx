import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { mealLabels } from '@/utils/food'

export default function MealSheet({ meal, loggedEntries = [], plannedItems = [], onClose, onDelete, onAte, onAddFood }) {
  const [deleteIndex, setDeleteIndex] = useState(null)
  const [busyItem, setBusyItem] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const remove = async () => { setDeleting(true); try { await onDelete(deleteIndex); setDeleteIndex(null) } finally { setDeleting(false) } }
  const ate = async (item, index) => { setBusyItem(index); try { await onAte(item) } finally { setBusyItem(null) } }
  return <><BottomSheet open={Boolean(meal)} title={meal ? mealLabels[meal] : ''} onClose={onClose}><div className="space-y-6"><section><h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Logged</h3>{loggedEntries.length ? <div className="mt-2">{loggedEntries.map(({ entry, index }) => <div key={`${entry.food_name}-${index}`} className="flex items-center justify-between border-b border-line py-3 last:border-0"><div><p className="font-medium">{entry.food_name}</p><p className="text-sm text-muted">{entry.quantity} {entry.unit} · {Math.round(entry.calories || 0)} kcal</p></div><button type="button" onClick={() => setDeleteIndex(index)} className="grid min-h-11 min-w-11 place-items-center rounded-full text-muted hover:bg-error/10 hover:text-error" aria-label={`Delete ${entry.food_name}`}><Trash2 size={18} /></button></div>)}</div> : <p className="mt-3 rounded-2xl bg-surface-2 p-4 text-sm text-muted">Nothing logged for this meal.</p>}</section><section><h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Suggested in your plan</h3>{plannedItems.length ? <div className="mt-2 space-y-2">{plannedItems.map((item, index) => <div key={`${item.food_name}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 p-3"><div className="min-w-0"><p className="truncate font-medium">{item.food_name}</p><p className="text-xs text-muted">{Math.round(item.calories || 0)} kcal</p></div><Button size="sm" variant="secondary" loading={busyItem === index} onClick={() => ate(item, index)}>Ate this</Button></div>)}</div> : <p className="mt-3 text-sm text-muted">No planned items for this meal.</p>}</section><Button className="w-full" onClick={onAddFood}><Plus size={17} />Add food</Button></div></BottomSheet><ConfirmDialog open={deleteIndex != null} title="Delete this food?" description="The entry will be removed while every other food remains unchanged." loading={deleting} onCancel={() => setDeleteIndex(null)} onConfirm={remove} /></>
}
