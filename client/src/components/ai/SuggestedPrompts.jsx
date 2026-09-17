const prompts = [
  'What should I eat for dinner?',
  'Is my protein intake okay?',
  'High protein Indian snacks',
  'How many calories left today?',
]

export default function SuggestedPrompts({ onPrompt }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {prompts.map((prompt) => <button key={prompt} type="button" onClick={() => onPrompt(prompt)} className="shrink-0 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:border-brand-green hover:text-brand-green">{prompt}</button>)}
    </div>
  )
}
