"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Upload, 
  FileText, 
  Link, 
  X, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  Plus,
  ArrowRight
} from "lucide-react"

interface UploadedFilePreview {
  file: File
  name: string
  size: string
}

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (files: File[], urls: string[]) => Promise<void>
  isUploading: boolean
}

export function UploadDialog({ open, onOpenChange, onConfirm, isUploading }: UploadDialogProps) {
  const [activeTab, setActiveTab] = useState<"files" | "urls">("files")
  const [selectedFiles, setSelectedFiles] = useState<UploadedFilePreview[]>([])
  const [urls, setUrls] = useState<string[]>([])
  const [urlInput, setUrlInput] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState("")

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const handleFilesSelected = useCallback((files: FileList | null) => {
    if (!files) return
    setError("")
    
    const fileArray = Array.from(files)
    const nonPdfFiles = fileArray.filter(f => f.type !== "application/pdf")
    
    if (nonPdfFiles.length > 0) {
      setError("Only PDF files are supported. Please select PDF files only.")
      return
    }

    const newFiles: UploadedFilePreview[] = fileArray.map(file => ({
      file,
      name: file.name,
      size: formatFileSize(file.size)
    }))

    setSelectedFiles(prev => [...prev, ...newFiles])
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFilesSelected(e.dataTransfer.files)
  }, [handleFilesSelected])

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const addUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    
    // Basic URL validation
    try {
      new URL(trimmed)
      if (!urls.includes(trimmed)) {
        setUrls(prev => [...prev, trimmed])
      }
      setUrlInput("")
      setError("")
    } catch {
      setError("Please enter a valid URL")
    }
  }

  const removeUrl = (index: number) => {
    setUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleConfirm = async () => {
    if (selectedFiles.length === 0 && urls.length === 0) {
      setError("Please add at least one file or URL")
      return
    }

    const files = selectedFiles.map(f => f.file)
    await onConfirm(files, urls)
    
    // Reset state after upload
    setSelectedFiles([])
    setUrls([])
    setUrlInput("")
    setError("")
  }

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFiles([])
      setUrls([])
      setUrlInput("")
      setError("")
      onOpenChange(false)
    }
  }

  const totalItems = selectedFiles.length + urls.length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Add Learning Materials
          </DialogTitle>
          <DialogDescription>
            Upload PDF files or add YouTube/web links. Review before processing.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "files" | "urls")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="files" className="gap-2">
              <FileText className="w-4 h-4" />
              PDF Files
              {selectedFiles.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {selectedFiles.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="urls" className="gap-2">
              <Link className="w-4 h-4" />
              URLs
              {urls.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {urls.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4 mt-4">
            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive 
                  ? "border-primary bg-primary/5 scale-[1.02]" 
                  : "border-border/50 hover:border-primary/50"
              }`}
            >
              <Upload className={`w-10 h-10 mx-auto mb-3 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm font-medium text-foreground mb-1">Drag and drop PDF files here</p>
              <p className="text-xs text-muted-foreground mb-3">or</p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  disabled={isUploading}
                />
                <Button variant="secondary" size="sm" disabled={isUploading} type="button" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Selected Files ({selectedFiles.length})</Label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  <AnimatePresence>
                    {selectedFiles.map((file, index) => (
                      <motion.div
                        key={`${file.name}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg group"
                      >
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.size}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFile(index)}
                          disabled={isUploading}
                        >
                          <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="urls" className="space-y-4 mt-4">
            {/* URL Input */}
            <div className="flex gap-2">
              <Input
                placeholder="https://youtube.com/watch?v=... or any web URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
                disabled={isUploading}
              />
              <Button 
                variant="secondary" 
                size="icon" 
                onClick={addUrl}
                disabled={isUploading || !urlInput.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports YouTube videos, web articles, and other educational content
            </p>

            {/* URLs List */}
            {urls.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Added URLs ({urls.length})</Label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  <AnimatePresence>
                    {urls.map((url, index) => (
                      <motion.div
                        key={`${url}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg group"
                      >
                        <Link className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <p className="flex-1 text-sm truncate">{url}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeUrl(index)}
                          disabled={isUploading}
                        >
                          <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Summary & Actions */}
        <div className="pt-4 border-t border-border/50 space-y-4">
          {totalItems > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Ready to process: {selectedFiles.length > 0 && `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
                {selectedFiles.length > 0 && urls.length > 0 && ' and '}
                {urls.length > 0 && `${urls.length} URL${urls.length > 1 ? 's' : ''}`}
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isUploading || totalItems === 0}
              className="flex-1 gap-2"
            >
              {isUploading ? (
                "Processing..."
              ) : (
                <>
                  Process Materials
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
