"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Calendar, Play } from 'lucide-react'

export default function WorkflowsTab() {
  const [workflows, setWorkflows] = useState([
    {
      id: 1,
      name: "Workflow 1",
      isRunning: false,
      isOpen: false,
      steps: []
    }
  ])

  const handleRunWorkflow = async (workflowId) => {
    setWorkflows(prev => prev.map(w =>
      w.id === workflowId
        ? { ...w, isRunning: true, isOpen: true, steps: [] }
        : w
    ))

    const fakeSteps = [
      "Start WhatsApp MCP",
      "Started Notion MCP",
      "Started Browser",
      "Going to producthunt.com",
      "Fetching top 5 products of the day",
      "Adding the products to Notion DB",
      "Sending a summary of the product to 918939085119"
    ]

    for (let i = 0; i < fakeSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, (i === 0 ? 1 : 2 + Math.random() * 2) * 1000))

      setWorkflows(prev => prev.map(w =>
        w.id === workflowId
          ? { ...w, steps: [...w.steps, fakeSteps[i]] }
          : w
      ))
    }

    setWorkflows(prev => prev.map(w =>
      w.id === workflowId
        ? { ...w, isRunning: false }
        : w
    ))
  }

  const handleScheduleWorkflow = (workflowId) => {
    // For now, just show an alert
    alert('Schedule functionality coming soon!')
  }

  return (
    <div className="flex-1 p-4">
      <h2 className="text-2xl font-bold mb-6">Workflows</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">{workflow.name}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => handleRunWorkflow(workflow.id)}
                  disabled={workflow.isRunning}
                  className="flex-1"
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {workflow.isRunning ? 'Running...' : 'Run'}
                </Button>

                <Button
                  onClick={() => handleScheduleWorkflow(workflow.id)}
                  variant="outline"
                  size="sm"
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </div>

              <Collapsible open={workflow.isOpen}>
                <CollapsibleContent className="space-y-2 mt-4">
                  <div className="border rounded-lg p-4 bg-muted/50 max-h-60 overflow-y-auto">
                    <h4 className="font-medium mb-3">Execution Log</h4>
                    <div className="space-y-2">
                      {workflow.steps.map((step, index) => (
                        <div key={index} className="text-sm text-muted-foreground bg-background p-2 rounded border-l-2 border-primary">
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}