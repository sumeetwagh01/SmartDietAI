// Backend behavior (verified in server/api/routes/food_log.py): POST /food-log/ replaces the day's entries; it does not append.
import axiosInstance from './axiosInstance'

const writeQueues = new Map()

export const logFood = async (data) =>
  (await axiosInstance.post('/food-log/', data)).data

export const getFoodLog = async (dateStr) =>
  (await axiosInstance.get(`/food-log/${dateStr}`)).data

export const appendFoodEntries = ({ date, meal_type, entries }) => {
  const previous = writeQueues.get(date) || Promise.resolve()
  const operation = previous.catch(() => {}).then(async () => {
    const current = await getFoodLog(date)
    const mergedEntries = [...(current?.entries || []), ...entries]
    const totals = await logFood({ date, meal_type, entries: mergedEntries })
    return { ...current, ...totals, date, meal_type, entries: mergedEntries }
  })
  writeQueues.set(date, operation)
  const cleanup = () => { if (writeQueues.get(date) === operation) writeQueues.delete(date) }
  operation.then(cleanup, cleanup)
  return operation
}

export const deleteEntry = async (dateStr, index) =>
  (await axiosInstance.delete(`/food-log/${dateStr}/${index}`)).data
