export const modelNodes = [
  { icon: 'OpenAI.Color', label: 'OpenAI' },
  { icon: 'Claude.Color', label: 'Claude' },
  { icon: 'Gemini.Color', label: 'Gemini' },
  { icon: 'DeepSeek.Color', label: 'DeepSeek' },
  { icon: 'Qwen.Color', label: 'Qwen' },
  { icon: 'Grok.Color', label: 'Grok' },
  { icon: 'Doubao.Color', label: 'Doubao' },
  { icon: 'Moonshot.Color', label: 'Moonshot' },
  { icon: 'Zhipu.Color', label: 'GLM' },
  { icon: 'Mistral.Color', label: 'Mistral' },
] as const

export const toolNodes = [
  { icon: 'Codex.Color', label: 'Codex' },
  { icon: 'ClaudeCode.Color', label: 'Claude Code' },
  { icon: 'Cursor.Color', label: 'Cursor' },
  { icon: 'Cline.Color', label: 'Cline' },
  { icon: 'OpenWebUI.Color', label: 'Open WebUI' },
  { icon: 'LobeHub.Color', label: 'LobeChat' },
  { icon: 'Dify.Color', label: 'Dify' },
  { icon: 'CherryStudio.Color', label: 'Cherry Studio' },
  { icon: 'ComfyUI.Color', label: 'ComfyUI' },
  { icon: 'LangChain.Color', label: 'LangChain' },
] as const

export type LandingBrandIconName =
  | typeof modelNodes[number]['icon']
  | typeof toolNodes[number]['icon']
