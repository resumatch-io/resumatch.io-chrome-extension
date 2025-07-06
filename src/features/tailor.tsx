import React, { useState, useRef } from 'react'
import { Upload, CheckCircle, Loader2 } from 'lucide-react'
import { SignedIn, SignedOut } from "@clerk/chrome-extension"
import { parseDocument } from '../api/parse'
import type { ParseResult } from '../api/parse'

interface TailorResumePageProps {
  onSelectFromCollections?: () => void
  selectedResume?: string | null
  onTailorStart?: (shareableLink: string) => void
  onResumeRemove?: () => void
  jobDescriptionText?: string
  onJobDescriptionChange?: (text: string) => void
  onFileDialogOpen?: () => void
  onFileDialogClose?: () => void
}

const TailorResumePage: React.FC<TailorResumePageProps> = ({ 
  onSelectFromCollections, 
  selectedResume, 
  onTailorStart,
  onResumeRemove,
  jobDescriptionText = '',
  onJobDescriptionChange,
  onFileDialogOpen,
  onFileDialogClose
}) => {
  const [jobDescription, setJobDescription] = useState(jobDescriptionText)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parsedText, setParsedText] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File) => {
    const allowedTypes = ['application/pdf']
    const maxSize = 5 * 1024 * 1024
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF file only.')
      return false
    }
    if (file.size > maxSize) {
      alert('File size must be less than 5MB.')
      return false
    }
    return true
  }

  const parseDocumentLocal = async (file: File) => {
    try {
      const result = await parseDocument(file)
      return result
    } catch (error) {
      const fallbackResult: ParseResult = {
        fileName: file.name,
        parsedText: `File processing failed for ${file.name}. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try with a different file.`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      return fallbackResult
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    onFileDialogClose?.()
    const file = event.target.files?.[0]
    
    if (file && validateFile(file)) {
      setIsUploading(true)
      setUploadedFile(file)
      
      try {
        const result = await parseDocumentLocal(file)
        setParsedText(result.parsedText)
      } catch (error) {
        alert("There was an error parsing your document. Please try again.")
        setUploadedFile(null)
        setParsedText('')
      } finally {
        setIsUploading(false)
      }
    }
    
    if (event.target) event.target.value = ''
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files[0]
    
    if (file && validateFile(file)) {
      setIsUploading(true)
      setUploadedFile(file)
      
      try {
        const result = await parseDocumentLocal(file)
        setParsedText(result.parsedText)
      } catch (error) {
        alert("There was an error parsing your document. Please try again.")
        setUploadedFile(null)
        setParsedText('')
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleUploadButtonClick = () => {
    onFileDialogOpen?.()
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setParsedText('')
  }

  const isFormComplete = () => {
    return (selectedResume || uploadedFile) && jobDescription.trim().length > 0
  }

  const handleTailorResume = async () => {
    if (!parsedText || !jobDescription.trim()) {
      alert('Please upload a resume and enter a job description.')
      return
    }
    if (onTailorStart) onTailorStart('')
    setIsGenerating(true)
    try {
      chrome.runtime.sendMessage(
        {
          action: 'GENERATE_RESUME',
          parsedText,
          jobDescription
        },
        (response) => {
          if (response?.success && response.data?.resume) {
            const summary = Array.isArray(response.data.resume.summary) && response.data.resume.summary.length > 0
              ? response.data.resume.summary[0]
              : '';
            console.log(response.data.resume);
            chrome.runtime.sendMessage(
              {
                action: 'SAVE_RESUME',
                parsedText,
                text: response.data.resume,
                jobDescription,
                summary,
                resumeTemplate: 'Default'
              },
              (saveResponse) => {
                setIsGenerating(false)
                if (saveResponse?.success && saveResponse.data?.resumeId) {
                  const link = `https://resumatch.io/share/${saveResponse.data.resumeId}`;
                  if (onTailorStart) onTailorStart(link)
                } else {
                  alert('There was an error saving your tailored resume.')
                }
              }
            )
          } else {
            setIsGenerating(false)
            alert('There was an error generating your tailored resume.')
          }
        }
      )
    } catch (error) {
      setIsGenerating(false)
      alert('There was an error generating your tailored resume.')
    }
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <h1 className="text-sm font-semibold text-left text-gray-900 mb-4">Tailor My Resume</h1>

        <div className="w-full mb-4">
          <h2 className="text-center text-xs font-semibold text-gray-800 mb-3">Job Description</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <label className="block text-xs font-medium text-gray-800 mb-2">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => {
                const newValue = e.target.value
                setJobDescription(newValue)
                onJobDescriptionChange?.(newValue)
              }}
              rows={4}
              className="w-full text-xs border border-gray-300 rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter job description here..."
            />
          </div>
        </div>

        <div className="w-full mb-4">
          {!selectedResume && !uploadedFile && (
            <div className="flex justify-center space-x-4 mb-3">
              <button 
                onClick={handleUploadButtonClick}
                disabled={isUploading}
                className="text-xs font-semibold text-gray-800 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                Upload Resume
              </button>
              
              <SignedIn>
                <button 
                  onClick={onSelectFromCollections}
                  className="text-xs font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                >
                  Select from Collections
                </button>
              </SignedIn>
              
              <SignedOut>
                <button 
                  onClick={() => alert("Please sign in to access your resume collections")}
                  className="text-xs font-semibold text-gray-400 cursor-not-allowed"
                >
                  Sign in to access Collections
                </button>
              </SignedOut>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />

          {uploadedFile ? (
            <div className="bg-white border-2 border-[#4A3AFF] rounded-lg p-4 text-center">
              <div className="mx-auto w-10 h-10 bg-[#4A3AFF] rounded-full flex items-center justify-center mb-2">
                {isUploading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-white" />
                )}
              </div>
              <p className="text-xs font-semibold text-[#4A3AFF] mb-1">
                {isUploading ? 'Processing Resume...' : 'Resume Uploaded'}
              </p>
              <p className="text-xs text-gray-600 mb-1">{uploadedFile.name}</p>
              {!isUploading && (
                <button 
                  onClick={handleRemoveFile}
                  className="text-[10px] text-[#4A3AFF] hover:underline"
                >
                  Remove File
                </button>
              )}
            </div>
          ) : selectedResume ? (
            <div className="bg-white border-2 border-[#4A3AFF] rounded-lg p-4 text-center">
              <div className="mx-auto w-10 h-10 bg-[#4A3AFF] rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-[#4A3AFF] mb-1">Resume Selected</p>
              <p className="text-xs text-gray-600 mb-1">{selectedResume}</p>
              <div className="flex justify-center space-x-3">
                <SignedIn>
                  <button 
                    onClick={onSelectFromCollections}
                    className="text-[10px] text-[#4A3AFF] hover:underline"
                  >
                    Change Resume
                  </button>
                </SignedIn>
                <button 
                  onClick={onResumeRemove}
                  className="text-[10px] text-red-500 hover:underline"
                >
                  Remove Resume
                </button>
              </div>
            </div>
          ) : (
            <div 
              className={`bg-white border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragOver 
                  ? 'border-[#4A3AFF] bg-[#4A3AFF]/5' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
              onClick={handleUploadButtonClick}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false) }}
            >
              <div className="mx-auto w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-600 mb-1">
                {isUploading ? 'Processing...' : 'Click or Drag to add your resume.'}
              </p>
              <p className="text-[10px] text-gray-500 mb-1">or drag and drop</p>
              <p className="text-[10px] text-gray-400">PDF up to 5MB.</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 p-4">
        <button 
          type="button"
          disabled={!isFormComplete() || isUploading || isGenerating}
          onClick={handleTailorResume}
          className={`w-full py-2 rounded-lg shadow-md transition-all text-xs font-medium ${
            isFormComplete() && !isUploading && !isGenerating
              ? 'bg-[#4A3AFF] hover:bg-[#4A3AFF]/90 text-white cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isUploading ? 'Processing Resume...' : isGenerating ? 'Generating...' : 'Tailor My Resume'}
        </button>
        {!isFormComplete() && !isUploading && !isGenerating && (
          <p className="text-[10px] text-gray-500 text-center mt-2">
            Please {!jobDescription.trim() ? 'enter job description' : ''} 
            {!jobDescription.trim() && !(selectedResume || uploadedFile) ? ' and ' : ''}
            {!(selectedResume || uploadedFile) ? 'upload/select a resume' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

export default TailorResumePage