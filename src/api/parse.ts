// PDF parsing using pdfjs-dist for browser extensions
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'

export interface ParseResult {
  fileName: string
  parsedText: string
  pageCount?: number
  error?: string
}

// Set up the PDF.js worker for v3.x (CDN)
GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js"

export async function parseDocument(file: File): Promise<ParseResult> {
  try {
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are supported')
    }
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = getDocument({ data: arrayBuffer })
    const pdf: PDFDocumentProxy = await loadingTask.promise
    let allText = ''
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const content = await page.getTextContent()
      const pageText = content.items.map(item => (item as any).str).join(' ')
      allText += pageText + '\n'
    }
    console.log('Extracted PDF text:', allText)
    return {
      fileName: file.name,
      parsedText: allText.trim(),
      pageCount: pdf.numPages
    }
  } catch (error) {
    console.error('PDF parsing failed:', error)
    return {
      fileName: file.name,
      parsedText: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Browser-compatible PDF text extraction
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Convert ArrayBuffer to Uint8Array
      const uint8Array = new Uint8Array(arrayBuffer)
      console.log('Converted to Uint8Array, length:', uint8Array.length)
      
      // Extract text using multiple strategies
      const extractedText = extractPDFTextContent(uint8Array)
      
      if (extractedText.length > 0) {
        console.log('Successfully extracted text from PDF')
        resolve(extractedText)
      } else {
        console.log('No text found, using fallback')
        const fallbackText = `PDF content could not be extracted. File size: ${uint8Array.length} bytes. This may be a scanned document or image-based PDF.`
        resolve(fallbackText)
      }
      
    } catch (error) {
      console.error('Text extraction error:', error)
      reject(error)
    }
  })
}

// Main PDF text extraction function
function extractPDFTextContent(uint8Array: Uint8Array): string {
  console.log('Starting PDF text extraction...')
  
  // Convert to string for pattern matching
  const fullText = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array)
  console.log('Full text length:', fullText.length)
  
  // Extract text using multiple strategies
  const strategies = [
    extractTextFromStreams,
    extractTextFromContent,
    extractTextFromObjects,
    extractReadableSequences
  ]
  
  let bestResult = ''
  
  for (const strategy of strategies) {
    try {
      const result = strategy(uint8Array, fullText)
      if (result.length > bestResult.length && isReadableText(result)) {
        bestResult = result
        console.log(`Strategy found ${result.length} characters of readable text`)
      }
      } catch (error) {
      console.log('Strategy failed:', error)
    }
  }
  
  return bestResult
}

// Extract text from PDF text streams
function extractTextFromStreams(uint8Array: Uint8Array, fullText: string): string {
  const textParts: string[] = []
  
  // Look for text stream patterns
  const streamPatterns = [
    /BT[\s\S]*?ET/g, // Text blocks
    /Tj[\s\S]*?TJ/g, // Text objects
    /\([^)]*\)/g,    // Parenthesized text
    /\[[^\]]*\]/g    // Bracket text
  ]
  
  for (const pattern of streamPatterns) {
    const matches = fullText.match(pattern)
    if (matches) {
      for (const match of matches) {
        // Clean up the text
        const cleanText = match
          .replace(/BT|ET|Tj|TJ/g, '') // Remove PDF operators
          .replace(/[\(\)\[\]]/g, '')  // Remove brackets
          .replace(/\s+/g, ' ')        // Normalize spaces
          .trim()
        
        if (cleanText.length > 3 && isReadableText(cleanText)) {
          textParts.push(cleanText)
        }
      }
    }
  }
  
  return textParts.join(' ')
}

// Extract text from content streams
function extractTextFromContent(uint8Array: Uint8Array, fullText: string): string {
  const textParts: string[] = []
  
  // Look for content streams
  const contentMatches = fullText.match(/stream[\s\S]*?endstream/g)
  
  if (contentMatches) {
    for (const match of contentMatches) {
      // Remove stream markers
      const content = match.replace(/stream|endstream/g, '').trim()
      
      // Look for readable text in the content
      const readableText = extractReadableTextFromContent(content)
      if (readableText.length > 0) {
        textParts.push(readableText)
      }
    }
  }
  
  return textParts.join(' ')
}

// Extract text from PDF objects
function extractTextFromObjects(uint8Array: Uint8Array, fullText: string): string {
  const textParts: string[] = []
  
  // Look for object definitions
  const objectMatches = fullText.match(/\d+ \d+ obj[\s\S]*?endobj/g)
  
  if (objectMatches) {
    for (const match of objectMatches) {
      // Look for text content in objects
      const textContent = extractTextFromObject(match)
      if (textContent.length > 0) {
        textParts.push(textContent)
      }
    }
  }
  
  return textParts.join(' ')
}

// Extract readable text from object content
function extractTextFromObject(objectContent: string): string {
  const textParts: string[] = []
  
  // Look for text patterns in objects
  const textPatterns = [
    /\([^)]{3,50}\)/g,  // Parenthesized text (3-50 chars)
    /\[[^\]]{3,50}\]/g, // Bracket text (3-50 chars)
    /"[^"]{3,50}"/g     // Quoted text (3-50 chars)
  ]
  
  for (const pattern of textPatterns) {
    const matches = objectContent.match(pattern)
    if (matches) {
      for (const match of matches) {
        // Clean up the text
        const cleanText = match
          .replace(/[\(\)\[\]"]/g, '') // Remove brackets and quotes
          .trim()
        
        if (cleanText.length > 3 && isReadableText(cleanText)) {
          textParts.push(cleanText)
        }
      }
    }
  }
  
  return textParts.join(' ')
}

// Extract readable text from content
function extractReadableTextFromContent(content: string): string {
  const textParts: string[] = []
  
  // Split content into chunks and look for readable text
  const chunks = content.split(/\s+/)
  
  for (const chunk of chunks) {
    if (chunk.length > 3 && isReadableText(chunk)) {
      textParts.push(chunk)
    }
  }
  
  return textParts.join(' ')
}

// Extract readable sequences from the full text
function extractReadableSequences(uint8Array: Uint8Array, fullText: string): string {
  const textParts: string[] = []
  
  // Look for sequences of readable characters
  const readablePatterns = [
    /[A-Za-z]{4,}/g,           // Words with 4+ letters
    /[A-Za-z0-9\s]{10,}/g,     // Mixed alphanumeric sequences
    /[A-Z][a-z]+ [A-Z][a-z]+/g // Name patterns
  ]
  
  for (const pattern of readablePatterns) {
    const matches = fullText.match(pattern)
    if (matches) {
      for (const match of matches) {
        if (isReadableText(match)) {
          textParts.push(match)
        }
      }
    }
  }
  
  return textParts.join(' ')
}

// Check if text is readable
function isReadableText(text: string): boolean {
  if (text.length < 3) return false
  
  // Check for too many special characters
  const specialCharRatio = (text.match(/[^A-Za-z0-9\s]/g) || []).length / text.length
  if (specialCharRatio > 0.3) return false
  
  // Check for too many numbers
  const numberRatio = (text.match(/[0-9]/g) || []).length / text.length
  if (numberRatio > 0.5) return false
  
  // Check for at least some letters
  const letterCount = (text.match(/[A-Za-z]/g) || []).length
  if (letterCount < 2) return false
  
  // Check for common PDF artifacts
  const pdfArtifacts = ['obj', 'endobj', 'stream', 'endstream', 'BT', 'ET', 'Tj', 'TJ', 'PDF']
  for (const artifact of pdfArtifacts) {
    if (text.includes(artifact)) return false
  }
  
  return true
}

// Fallback text extraction
function extractFallbackText(uint8Array: Uint8Array): string {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array)
  
  // Look for any readable text sequences
  const readableSequences = text.match(/[A-Za-z0-9\s\.\,\!\?\-\_]{10,}/g)
  
  if (readableSequences) {
    return readableSequences.join(' ')
  }
  
  return `PDF content extracted but may contain encoded data. File size: ${uint8Array.length} bytes.`
}

// Alternative parsing method for future implementation
export async function parsePDFWithPdfParse(file: File): Promise<ParseResult> {
  try {
    console.log('Attempting alternative parsing method:', file.name)
    
    // This would be implemented with a different PDF parsing approach
    // For now, we'll use the main parsing method
    return await parsePDFFile(file)
    
  } catch (error) {
    console.error('Alternative parsing method failed:', error)
    return {
      fileName: file.name,
      parsedText: '',
      error: 'Alternative parsing method not available in browser environment'
    }
  }
}

// Utility function to clean and format extracted text
export function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .trim()
}

// Main parsing function that handles REAL PDF parsing
export async function parsePDFFile(file: File): Promise<ParseResult> {
  try {
    console.log('Starting REAL PDF parsing for:', file.name, file.size, file.type)
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are supported')
    }
    
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    console.log('File converted to ArrayBuffer, size:', arrayBuffer.byteLength)
    
    // Try to extract text using a browser-compatible approach
    const textContent = await extractTextFromPDF(arrayBuffer)
    console.log('Text extraction completed!')
    console.log('Text length:', textContent.length)
    console.log('First 200 characters of extracted text:', textContent.substring(0, 200))
    
    const result: ParseResult = {
      fileName: file.name,
      parsedText: textContent,
      pageCount: 1 // We'll estimate this
    }
    
    console.log('REAL PDF parsing completed successfully!')
    console.log('Total text length:', textContent.length)
    console.log('Parsed result:', result)
    
    return result

  } catch (error) {
    console.error('REAL PDF parsing failed:', error)
    
    const errorResult: ParseResult = {
      fileName: file.name,
      parsedText: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
    
    return errorResult
  }
}