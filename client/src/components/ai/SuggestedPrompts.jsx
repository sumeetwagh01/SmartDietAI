export default function SuggestedPrompts({ prompts = [], onPrompt }) {
  if (!prompts.length) return null
  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto pb-2" aria-label="Suggested questions">
      {prompts.map((prompt) => <button key={prompt} type="button" onClick={() => onPrompt(prompt)} className="min-h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-sm text-muted hover:border-accent hover:text-accent">{prompt}</button>)}
    </div>
  )
}
