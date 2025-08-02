"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X } from 'lucide-react'

export default function MCPConfigDialog({ 
  isOpen, 
  onClose, 
  mcp = null, 
  mode = 'create', // 'create', 'configure'
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    name: '',
    command: '',
    args: [''],
    title: '',
    description: '',
    env: [{ key: '', value: '' }] // Changed to an array of objects
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data when dialog opens or mcp changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'configure' && mcp) {
        // Pre-fill with existing MCP data
        const existingEnv = mcp.config.env || {};
        const envArray = Object.keys(existingEnv).length > 0
          ? Object.entries(existingEnv).map(([key, value]) => ({ key, value }))
          : [{ key: '', value: '' }];

        setFormData({
          name: mcp.name,
          command: mcp.config.command,
          args: [...mcp.config.args],
          title: mcp.title,
          description: mcp.description,
          env: envArray
        })
      } else {
        // Reset for create mode
        resetForm()
      }
    }
  }, [isOpen, mcp, mode])

  const resetForm = () => {
    setFormData({
      name: '',
      command: '',
      args: [''],
      title: '',
      description: '',
      env: [{ key: '', value: '' }]
    })
  }

  const addArgument = () => {
    setFormData(prev => ({
      ...prev,
      args: [...prev.args, '']
    }))
  }

  const removeArgument = (index) => {
    if (formData.args.length > 1) {
      setFormData(prev => ({
        ...prev,
        args: prev.args.filter((_, i) => i !== index)
      }))
    }
  }

  const updateArgument = (index, value) => {
    setFormData(prev => ({
      ...prev,
      args: prev.args.map((arg, i) => i === index ? value : arg)
    }))
  }

  // --- Environment Variable Handlers (Updated) ---

  const addEnvVariable = () => {
    setFormData(prev => ({
      ...prev,
      env: [...prev.env, { key: '', value: '' }]
    }))
  }

  const removeEnvVariable = (index) => {
    if (formData.env.length > 1) {
      setFormData(prev => ({
        ...prev,
        env: prev.env.filter((_, i) => i !== index)
      }))
    }
  }

  const updateEnvVariable = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      env: prev.env.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      // Convert env array to object, filtering out empty keys
      const cleanEnv = Object.fromEntries(
        formData.env
          .filter(item => item.key.trim() !== '')
          .map(item => [item.key.trim(), item.value])
      );
      
      const cleanArgs = formData.args.filter(arg => arg.trim())

      if (mode === 'create') {
        const { data: { session: userSession } } = await supabase.auth.getSession()
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/mcps`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userSession?.access_token}`
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            command: formData.command.trim(),
            args: cleanArgs,
            title: formData.title.trim() || null,
            description: formData.description.trim() || null,
            env: Object.keys(cleanEnv).length > 0 ? cleanEnv : null
          })
        })
        
        const data = await response.json()
        
        if (data.success) {
          onClose()
          resetForm()
          onSuccess()
        } else {
          console.error('Failed to create MCP:', data.message)
          alert('Failed to create MCP: ' + (data.message || 'Unknown error'))
        }
      } else {
        // Configure existing MCP - just activate with current config
        const mcpConfig = {
          name: mcp.name,
          config: {
            command: formData.command,
            args: cleanArgs,
            env: Object.keys(cleanEnv).length > 0 ? cleanEnv : null
          }
        }
        
        onClose()
        onSuccess(mcpConfig)
      }
    } catch (error) {
      console.error('Error submitting MCP:', error)
      alert('Failed to submit MCP: ' + (error.message || 'Network error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return formData.name.trim() && 
           formData.command.trim() && 
           formData.args.filter(a => a.trim()).length > 0 &&
           !isSubmitting
  }

  const isReadOnlyField = (field) => {
    return mode === 'configure' && ['name', 'title', 'description'].includes(field)
  }

  const getTitle = () => {
    if (mode === 'create') return 'Add New MCP'
    return `Configure ${mcp?.title || 'MCP'}`
  }

  const getSubmitText = () => {
    if (isSubmitting) {
      return mode === 'create' ? 'Creating...' : 'Configuring...'
    }
    return mode === 'create' ? 'Create MCP' : 'Enable MCP'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          {/* Required fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., filesystem"
                disabled={isReadOnlyField('name')}
                className={isReadOnlyField('name') ? 'bg-muted' : ''}
              />
            </div>
            <div>
              <Label htmlFor="command">Command *</Label>
              <Input
                id="command"
                value={formData.command}
                onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                placeholder="e.g., npx"
              />
            </div>
          </div>

          {/* Arguments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Arguments * (at least one required)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addArgument}>
                <Plus className="h-4 w-4 mr-1" />
                Add Arg
              </Button>
            </div>
            {formData.args.map((arg, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={arg}
                  onChange={(e) => updateArgument(index, e.target.value)}
                  placeholder="e.g., -y, @modelcontextprotocol/server-filesystem"
                />
                {formData.args.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArgument(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Optional fields - read-only in configure mode */}
          <div>
            <Label htmlFor="title">Title (optional - defaults to name)</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., File System"
              disabled={isReadOnlyField('title')}
              className={isReadOnlyField('title') ? 'bg-muted' : ''}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this MCP does..."
              rows={3}
              disabled={isReadOnlyField('description')}
              className={isReadOnlyField('description') ? 'bg-muted' : ''}
            />
          </div>

          {/* Environment variables (Updated Section) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Environment Variables (optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addEnvVariable}>
                <Plus className="h-4 w-4 mr-1" />
                Add Env
              </Button>
            </div>
            {formData.env.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={item.key}
                  onChange={(e) => updateEnvVariable(index, 'key', e.target.value)}
                  placeholder="Variable Name (e.g., API_KEY)"
                  className="flex-1"
                />
                <Input
                  value={item.value}
                  onChange={(e) => updateEnvVariable(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="flex-1"
                />
                {formData.env.length > 1 && (
                    <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeEnvVariable(index)}
                    >
                    <X className="h-4 w-4" />
                    </Button>
                )}
              </div>
            ))}
          </div>

        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid()}
            >
              {getSubmitText()}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}