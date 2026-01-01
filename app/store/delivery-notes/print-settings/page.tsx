'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'

interface PrintSettings {
  marginTop: string
  marginRight: string
  marginBottom: string
  marginLeft: string
  fontSize: string
  headerFontSize: string
  tableFontSize: string
  rowHeight: string
}

const defaultSettings: PrintSettings = {
  marginTop: '1.0',
  marginRight: '0.5',
  marginBottom: '1.5',
  marginLeft: '0.25',
  fontSize: '12',
  headerFontSize: '22',
  tableFontSize: '12',
  rowHeight: '40',
}

export default function PrintSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<PrintSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('deliveryNotePrintSettings')
    if (saved) {
      setSettings(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  const handleSave = () => {
    localStorage.setItem('deliveryNotePrintSettings', JSON.stringify(settings))
    alert('Print settings saved successfully!')
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    localStorage.removeItem('deliveryNotePrintSettings')
    alert('Print settings reset to defaults!')
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/store/delivery-notes')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Delivery Notes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Note Print Settings</CardTitle>
          <p className="text-sm text-gray-500">Configure print layout margins and font sizes for delivery notes</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Page Margins */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Page Margins (inches)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="marginTop">Top Margin</Label>
                  <Input
                    id="marginTop"
                    type="number"
                    step="0.1"
                    value={settings.marginTop}
                    onChange={(e) => setSettings({ ...settings, marginTop: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="marginRight">Right Margin</Label>
                  <Input
                    id="marginRight"
                    type="number"
                    step="0.1"
                    value={settings.marginRight}
                    onChange={(e) => setSettings({ ...settings, marginRight: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="marginBottom">Bottom Margin (Footer Height)</Label>
                  <Input
                    id="marginBottom"
                    type="number"
                    step="0.1"
                    value={settings.marginBottom}
                    onChange={(e) => setSettings({ ...settings, marginBottom: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="marginLeft">Left Margin</Label>
                  <Input
                    id="marginLeft"
                    type="number"
                    step="0.1"
                    value={settings.marginLeft}
                    onChange={(e) => setSettings({ ...settings, marginLeft: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Font Sizes */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Font Sizes (px)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fontSize">Base Font Size</Label>
                  <Input
                    id="fontSize"
                    type="number"
                    min="8"
                    max="20"
                    value={settings.fontSize}
                    onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="headerFontSize">Header Title Font Size</Label>
                  <Input
                    id="headerFontSize"
                    type="number"
                    min="14"
                    max="30"
                    value={settings.headerFontSize}
                    onChange={(e) => setSettings({ ...settings, headerFontSize: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="tableFontSize">Table Font Size</Label>
                  <Input
                    id="tableFontSize"
                    type="number"
                    min="8"
                    max="18"
                    value={settings.tableFontSize}
                    onChange={(e) => setSettings({ ...settings, tableFontSize: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="rowHeight">Row Height (px)</Label>
                  <Input
                    id="rowHeight"
                    type="number"
                    min="20"
                    max="60"
                    value={settings.rowHeight}
                    onChange={(e) => setSettings({ ...settings, rowHeight: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
              <Button onClick={handleReset} variant="outline" className="flex-1">
                Reset to Defaults
              </Button>
            </div>

            {/* Preview Note */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> These settings will be applied to all delivery note prints from this browser. 
                Print a test delivery note to preview the changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
