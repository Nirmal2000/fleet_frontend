"use client"

import { useSession } from '@descope/react-sdk'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Navbar from '@/components/Navbar'
import { Label as FormLabel } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, X, Info } from 'lucide-react'
import { useDescope } from '@descope/react-sdk'

export default function CreatePage() {
  const { isAuthenticated } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Navbar />

      <CreateMCPForm />
    </div>
  )
}

function CreateMCPForm() {
  const [name, setName] = useState("")
  const [startupCommands, setStartupCommands] = useState([""])
  const [envVars, setEnvVars] = useState([{ key: '', value: '' }])
  const [mcpEnvs, setMcpEnvs] = useState([{ key: '', value: '' }])
  const [isPrivate, setIsPrivate] = useState(true)
  const [mcpCommand, setMcpCommand] = useState("")
  const [mcpArgs, setMcpArgs] = useState([""])
  const { getSessionToken } = useDescope()
  const router = useRouter()

  const addEnvVar = () => setEnvVars((v) => [...v, { key: '', value: '' }])
  const removeEnvVar = (idx) => setEnvVars((v) => v.filter((_, i) => i !== idx))
  const updateEnvVar = (idx, field, value) => setEnvVars((v) => v.map((e, i) => i === idx ? { ...e, [field]: value } : e))

  const handleEnvVarPaste = (e) => {
    const text = e.clipboardData?.getData('text') || ''
    if (!text.includes('=')) return
    e.preventDefault()
    const lines = text.split(/\r?\n/).filter(Boolean)
    const parsed = lines.map((line) => {
      const [key, ...rest] = line.split('=')
      return { key: key?.trim() || '', value: rest.join('=').trim() }
    })
    setEnvVars(parsed.length ? parsed : [{ key: '', value: '' }])
  }

  const addMcpEnv = () => setMcpEnvs((v) => [...v, { key: '', value: '' }])
  const removeMcpEnv = (idx) => setMcpEnvs((v) => v.filter((_, i) => i !== idx))
  const updateMcpEnv = (idx, field, value) => setMcpEnvs((v) => v.map((e, i) => i === idx ? { ...e, [field]: value } : e))

  const addMcpArg = () => setMcpArgs((v) => [...v, ""]) 
  const removeMcpArg = (idx) => setMcpArgs((v) => v.filter((_, i) => i !== idx))
  const updateMcpArg = (idx, value) => setMcpArgs((v) => v.map((a, i) => i === idx ? value : a))

  function tryParseJson(text) {
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }

  function extractCommandArgs(obj) {
    if (!obj || typeof obj !== 'object') return null
    let node = obj
    if (obj.mcpServers && typeof obj.mcpServers === 'object') {
      const firstKey = Object.keys(obj.mcpServers)[0]
      if (!firstKey) return null
      node = obj.mcpServers[firstKey]
    }
    if (!node) return null
    const cmd = typeof node.command === 'string' ? node.command : ''
    const args = Array.isArray(node.args) ? node.args.filter(a => typeof a === 'string') : []
    if (!cmd && args.length === 0) return null
    return { command: cmd, args }
  }

  const handleMcpPaste = (e) => {
    const text = e.clipboardData?.getData('text')?.trim() || ''
    const parsed = tryParseJson(text)
    const extracted = extractCommandArgs(parsed)
    if (extracted) {
      e.preventDefault()
      if (extracted.command) setMcpCommand(extracted.command)
      setMcpArgs(extracted.args.length ? extracted.args : [''])
    }
  }

  const addStartupCmd = () => setStartupCommands((v) => [...v, ""]) 
  const removeStartupCmd = (idx) => setStartupCommands((v) => v.filter((_, i) => i !== idx))
  const updateStartupCmd = (idx, value) => setStartupCommands((v) => v.map((c, i) => (i === idx ? value : c)))

  const handleStartupPaste = (e) => {
    const text = e.clipboardData?.getData('text') || ''
    if (!text.includes('\n')) return
    e.preventDefault()
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    setStartupCommands(lines.length ? lines : [""])
  }

  const handleSave = async () => {
    try {
      const sessionToken = getSessionToken?.()
      // Build MCP env names and merge with general envs; MCP values can be blank
      const mcpEnvNames = mcpEnvs.map(e => (e.key || '').trim()).filter(Boolean)
      const merged = {}
      envVars.forEach(({ key, value }) => { if ((key || '').trim()) merged[(key || '').trim()] = value ?? '' })
      mcpEnvs.forEach(({ key, value }) => { if ((key || '').trim()) merged[(key || '').trim()] = value ?? '' })
      const payload = {
        name,
        startupCommands: startupCommands.filter((c) => c.trim()),
        envVars: Object.entries(merged).map(([key, value]) => ({ key, value })),
        mcpEnvNames,
        isPrivate,
        mcpCommand,
        mcpArgs: mcpArgs.filter((a) => a.trim()),
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/mcp/tasks/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {})
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Failed to start task')

      // Persist task id and go to marketplace
      const key = 'mcp_task_ids'
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const updated = Array.from(new Set([data.task_id, ...existing]))
      localStorage.setItem(key, JSON.stringify(updated))
      router.push('/marketplace')
    } catch (err) {
      console.error('Save failed:', err)
      alert(`Failed to save MCP: ${err.message || err}`)
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Create MCP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Name */}
          <div className="space-y-2">
            <FormLabel>Name</FormLabel>
            <Input
              placeholder="My MCP"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {/* Startup commands - at least one required */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>
                Startup Commands
                <span className="ml-1 text-red-500">*</span>
              </FormLabel>
              <Button type="button" variant="outline" size="sm" onClick={addStartupCmd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Command
              </Button>
            </div>
            {startupCommands.map((cmd, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={index === 0 ? 'e.g. npm install' : 'command'}
                  value={cmd}
                  onChange={(e) => updateStartupCmd(index, e.target.value)}
                  onPaste={handleStartupPaste}
                  className="font-mono"
                />
                {startupCommands.length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removeStartupCmd(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {/* Tip line */}
            <p className="text-xs text-muted-foreground">Tip: paste multiple lines to auto-split into separate commands. At least one command is required.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>Environment Variables</FormLabel>
              <Button type="button" variant="outline" size="sm" onClick={addEnvVar}>
                <Plus className="h-4 w-4 mr-2" />
                Add Variable
              </Button>
            </div>

            {/* Optional bulk paste (kept disabled but working if pasted into inputs) */}
            {/* <div className="space-y-2">
              <FormLabel className="text-sm text-gray-400">Or paste .env lines</FormLabel>
              <Textarea onPaste={handleEnvVarPaste} className="min-h-[80px] font-mono text-sm" />
            </div> */}

            {envVars.map((env, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="KEY"
                  value={env.key}
                  onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                  onPaste={handleEnvVarPaste}
                />
                <Input
                  placeholder="VALUE"
                  value={env.value}
                  onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                  onPaste={handleEnvVarPaste}
                />
                {envVars.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeEnvVar(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* MCP Config: Command + Args */}
          <div className="space-y-4">
            <FormLabel>MCP Config</FormLabel>
            <div className="space-y-2">
              <Input
                placeholder="command (e.g., uv)"
                value={mcpCommand}
                onChange={(e) => setMcpCommand(e.target.value)}
                onPaste={handleMcpPaste}
                className="font-mono"
              />
              <div className="flex items-center justify-between">
                <FormLabel>Args</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addMcpArg}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Arg
                </Button>
              </div>
              {mcpArgs.map((arg, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="arg"
                    value={arg}
                    onChange={(e) => updateMcpArg(index, e.target.value)}
                    onPaste={handleMcpPaste}
                    className="font-mono"
                  />
                  {mcpArgs.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeMcpArg(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Tip: paste an MCP JSON snippet to auto-fill command and args.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>MCP Environment Variables (names + optional values)</FormLabel>
              <Button type="button" variant="outline" size="sm" onClick={addMcpEnv}>
                <Plus className="h-4 w-4 mr-2" />
                Add MCP Env
              </Button>
            </div>
            {mcpEnvs.map((env, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="VARIABLE_NAME"
                  value={env.key}
                  onChange={(e) => updateMcpEnv(index, 'key', e.target.value)}
                />
                <Input
                  placeholder="value (optional)"
                  value={env.value}
                  onChange={(e) => updateMcpEnv(index, 'value', e.target.value)}
                />
                {mcpEnvs.length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removeMcpEnv(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Leave value blank if users should provide it later.</p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    If Public, it will be visible in the marketplace.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-2">
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} id="privacy" />
                <label htmlFor="privacy" className="cursor-pointer select-none">
                  {isPrivate ? 'Private' : 'Public'}
                </label>
              </div>
            </div>
            <Button
              type="button"
              variant="default"
              disabled={!startupCommands.some((c) => c.trim().length > 0)}
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
