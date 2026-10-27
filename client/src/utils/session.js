import useAiPlanStore from '@/store/aiPlanStore'
import useFoodStore from '@/store/foodStore'
import useOnboardingStore from '@/store/onboardingStore'
import usePrefsStore from '@/store/prefsStore'
import useWellnessStore from '@/store/wellnessStore'

export const clearPerUserClientData = () => {
  useAiPlanStore.getState().clearAiData()
  useFoodStore.getState().clearFoodState()
  useOnboardingStore.getState().clearDraft()
  usePrefsStore.getState().clearClientPreferences()
  useWellnessStore.getState().clearWellness()
}

