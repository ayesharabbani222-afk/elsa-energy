import { useState } from 'react'
import { Mic, Send } from 'lucide-react'
import { voiceIntents, voiceReply } from '../../../data/elsaData'

export default function VoiceAssistant({ conversation, setConversation }) {
  const [query, setQuery] = useState('')

  const ask = (text) => {
    const q = text.trim()
    if (!q) return
    const reply = voiceReply(q)
    setConversation(prev => [...prev, { from: 'user', text: q }, { from: 'elsa', text: reply }])
    setQuery('')
  }

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-1">
          <Mic size={16} className="text-primary-600" />
          <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100">Hey ELSA — Voice Interface</h3>
        </div>
        <p className="text-xs text-surface-400 mb-4">Push-to-talk fallback always visible. Type below to simulate a voice query — ELSA understands both English and Roman Urdu.</p>

        <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3 h-72 overflow-y-auto space-y-2.5 bg-surface-50 dark:bg-surface-950">
          {conversation.map((c, i) => (
            <div key={i} className={`flex ${c.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${c.from === 'user' ? 'bg-primary-500 text-surface-950 font-medium' : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-surface-700 dark:text-surface-300'}`}>
                {c.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <input
            className="input flex-1"
            placeholder='e.g. "Hey ELSA, what will my bill be this time?"'
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask(query)}
          />
          <button className="btn-primary" onClick={() => ask(query)}><Send size={14} /></button>
          <button type="button" className="btn-secondary" onClick={() => ask(voiceIntents[Math.floor(Math.random() * voiceIntents.length)].example)}>
            <Mic size={14} /> Push-to-talk
          </button>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-1">Launch Intent Set (9)</h3>
        <p className="text-xs text-surface-400 mb-3">Tap either the English or Roman Urdu phrasing to try it.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {voiceIntents.map(i => (
            <div key={i.intent} className="rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-2">
              <p className="text-xs font-bold text-primary-600 mb-1">{i.intent} <span className="text-surface-400 font-normal">→ {i.module}</span></p>
              <button type="button" onClick={() => ask(i.example)} className="block w-full text-left text-sm text-surface-700 dark:text-surface-300 hover:text-primary-600">
                EN: {i.example}
              </button>
              <button type="button" onClick={() => ask(i.exampleUr)} className="block w-full text-left text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 mt-0.5">
                UR: {i.exampleUr}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
