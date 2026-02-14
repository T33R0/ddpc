'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Badge } from '@repo/ui/badge'
import { ArrowLeft, Monitor, Smartphone, Camera, Loader2, Save, ExternalLink, Upload, FileUp } from 'lucide-react'
import { useToast } from '@repo/ui/use-toast'
import { Textarea } from '@repo/ui/textarea'
import html2canvas from 'html2canvas'
import { ComponentRegistry } from '@/lib/component-registry'

interface StructureItem {
  id: string
  name: string
  type: 'page' | 'component' | 'modal'
  path: string
  description?: string
  category?: string
  last_updated: string
  screenshot_desktop?: string
  screenshot_mobile?: string
  metadata: any
}

export default function StructureDetailClient({ item }: { item: StructureItem }) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [propsJson, setPropsJson] = useState(JSON.stringify(item.metadata?.defaultProps || {}, null, 2))
  const [parsedProps, setParsedProps] = useState<any>({})
  const [capturing, setCapturing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    try {
      setParsedProps(JSON.parse(propsJson))
    } catch (e) {
      // invalid json, ignore
    }
  }, [propsJson])

  const Component = item.type !== 'page' ? ComponentRegistry[item.name] : null

  const uploadBlob = async (blob: Blob) => {
    const fileName = `${item.id}/${device}-${Date.now()}.png`
    const bucket = 'admin-screenshots'

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucket)
      .upload(fileName, blob, {
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)

    // Update DB
    const updateField = device === 'desktop' ? 'screenshot_desktop' : 'screenshot_mobile'
    const { error: dbError } = await supabase
      .from('app_structure')
      .update({ [updateField]: publicUrl })
      .eq('id', item.id)

    if (dbError) throw dbError

    return publicUrl
  }

  const handleCapture = async () => {
    if (!previewRef.current) return
    setCapturing(true)

    try {
      const element = previewRef.current

      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        logging: false,
        backgroundColor: null
      })

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Failed to generate image blob')

        const publicUrl = await uploadBlob(blob)

        toast({
          title: 'Screenshot Captured',
          description: `Saved ${device} screenshot.`,
        })

        // Update local state to reflect change immediately
        if (device === 'desktop') item.screenshot_desktop = publicUrl
        else item.screenshot_mobile = publicUrl

      }, 'image/png')
    } catch (error) {
      console.error('Capture error:', error)
      toast({
        title: 'Capture Failed',
        description: 'Could not take screenshot.',
        variant: 'destructive'
      })
    } finally {
      setCapturing(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setUploading(true)

    try {
      const file = e.target.files[0]
      if (!file) return
      const publicUrl = await uploadBlob(file)

      toast({
        title: 'Upload Complete',
        description: `Saved ${device} screenshot.`,
      })

      if (device === 'desktop') item.screenshot_desktop = publicUrl
      else item.screenshot_mobile = publicUrl
    } catch (error) {
       console.error('Upload error:', error)
       toast({
         title: 'Upload Failed',
         description: 'Could not upload file.',
         variant: 'destructive'
       })
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveProps = async () => {
    setSaving(true)
    try {
      const json = JSON.parse(propsJson)
      const { error } = await supabase
        .from('app_structure')
        .update({
          metadata: { ...item.metadata, defaultProps: json }
        })
        .eq('id', item.id)

      if (error) throw error

      toast({
        title: 'Saved',
        description: 'Default props updated.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid JSON or save failed.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/structure">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {item.name}
              <Badge variant="outline">{item.type}</Badge>
            </h1>
            <p className="text-muted-foreground font-mono text-xs">{item.path}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => setDevice(device === 'desktop' ? 'mobile' : 'desktop')}>
             {device === 'desktop' ? <Monitor className="mr-2 h-4 w-4" /> : <Smartphone className="mr-2 h-4 w-4" />}
             {device === 'desktop' ? 'Desktop View' : 'Mobile View'}
           </Button>

           {item.type !== 'page' && (
             <Button onClick={handleCapture} disabled={capturing}>
               {capturing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
               Capture
             </Button>
           )}

           <input
             type="file"
             ref={fileInputRef}
             className="hidden"
             accept="image/*"
             onChange={handleFileUpload}
           />
           <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
             {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
             Upload
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Preview Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden bg-muted/50 border-dashed">
             <div className="p-4 flex items-center justify-between border-b bg-background/50 backdrop-blur">
               <span className="text-xs font-medium text-muted-foreground">Preview Canvas</span>
               <div className="text-xs text-muted-foreground">
                 {device === 'mobile' ? '375px' : '100%'} width
               </div>
             </div>

             <div className="flex justify-center p-8 overflow-auto">
               <div
                 ref={previewRef}
                 className={`bg-background shadow-sm border transition-all duration-300 origin-top
                   ${device === 'mobile' ? 'w-[375px] min-h-[667px]' : 'w-full min-h-[400px]'}
                 `}
               >
                 {item.type === 'page' ? (
                   <div className="w-full h-full min-h-[600px] bg-white flex flex-col">
                     <div className="p-4 border-b bg-warning/10 text-warning text-sm flex items-center gap-2">
                       <ExternalLink className="h-4 w-4" />
                       Page previews are rendered via iframe. Screenshots must be manually uploaded.
                     </div>
                     <iframe
                       src={item.path.replace('[id]', 'preview-placeholder')}
                       className="w-full flex-1 border-0"
                       title="Page Preview"
                     />
                   </div>
                 ) : (
                   <div className="p-4">
                     <Suspense fallback={<div className="p-4 text-center">Loading component...</div>}>
                       {Component ? (
                         <Component {...parsedProps} />
                       ) : (
                         <div className="p-12 text-center border-2 border-dashed rounded-lg">
                           <p className="text-muted-foreground">Component not found in registry.</p>
                           <p className="text-xs text-muted-foreground mt-2">Try re-running the scan script.</p>
                         </div>
                       )}
                     </Suspense>
                   </div>
                 )}
               </div>
             </div>
          </Card>

          {/* Screenshots Gallery */}
          <div className="grid grid-cols-2 gap-4">
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium">Desktop Screenshot</CardTitle>
               </CardHeader>
               <CardContent>
                 {item.screenshot_desktop ? (
                   <img src={item.screenshot_desktop} alt="Desktop" className="w-full rounded border aspect-video object-cover" />
                 ) : (
                   <div className="h-32 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">None</div>
                 )}
               </CardContent>
             </Card>
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium">Mobile Screenshot</CardTitle>
               </CardHeader>
               <CardContent>
                 {item.screenshot_mobile ? (
                   <img src={item.screenshot_mobile} alt="Mobile" className="w-full rounded border aspect-[9/16] object-cover mx-auto max-h-48" />
                 ) : (
                   <div className="h-32 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">None</div>
                 )}
               </CardContent>
             </Card>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Properties</CardTitle>
              <CardDescription>Configure props for the preview.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {item.type === 'page' ? (
                 <div className="text-sm text-muted-foreground">
                   Pages render via iframe. Ensure you are authenticated if the page requires it.
                   <div className="mt-4">
                     <Link href={item.path} target="_blank">
                       <Button variant="outline" className="w-full">
                         Open in New Tab <ExternalLink className="ml-2 h-4 w-4" />
                       </Button>
                     </Link>
                   </div>
                 </div>
               ) : (
                 <>
                   <div className="space-y-2">
                     <label className="text-xs font-medium">JSON Props</label>
                     <Textarea
                       value={propsJson}
                       onChange={(e) => setPropsJson(e.target.value)}
                       className="font-mono text-xs min-h-[300px]"
                     />
                   </div>
                   <Button onClick={handleSaveProps} disabled={saving} className="w-full">
                     {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                     Save Default Props
                   </Button>
                 </>
               )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
               <div className="grid grid-cols-3 gap-1">
                 <span className="text-muted-foreground">Category:</span>
                 <span className="col-span-2 font-medium">{item.category || '-'}</span>

                 <span className="text-muted-foreground">Last Upd:</span>
                 <span className="col-span-2">{new Date(item.last_updated).toLocaleDateString()}</span>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
