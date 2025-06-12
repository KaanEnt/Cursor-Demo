import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' })
export const geminiVisionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' })

export interface ExtractedData {
  documentType: string
  keyEntities: { [key: string]: string | number }
  summary: string
  tags: string[]
  confidence: number
  riskFlags: string[]
}

export async function extractDocumentData(
  text: string,
  documentType?: string
): Promise<ExtractedData> {
  const prompt = `
    You are an expert document analyst specializing in professional services documents.
    
    Analyze the following document and extract key information in a structured format:
    
    Document Text:
    ${text}
    
    ${documentType ? `Expected Document Type: ${documentType}` : ''}
    
    Please provide the extracted information in the following JSON format:
    {
      "documentType": "contract|invoice|legal|financial|medical|other",
      "keyEntities": {
        "parties": ["entity1", "entity2"],
        "amount": "value if financial",
        "date": "key dates",
        "location": "relevant locations",
        "deadline": "important deadlines"
      },
      "summary": "Brief 2-3 sentence summary of the document",
      "tags": ["tag1", "tag2", "tag3"],
      "confidence": 0.95,
      "riskFlags": ["flag1 if any risks detected"]
    }
    
    Focus on accuracy and provide confidence scores. If this is a legal document, pay special attention to obligations, deadlines, and financial terms.
  `

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    throw new Error('Failed to parse AI response')
  } catch (error) {
    console.error('Error extracting document data:', error)
    throw new Error('Failed to process document with AI')
  }
}

export async function analyzeDocumentImage(
  imageData: string,
  mimeType: string
): Promise<string> {
  const prompt = `
    Extract all text content from this document image. 
    Maintain the structure and formatting as much as possible.
    Focus on capturing all text accurately for further analysis.
  `

  try {
    const result = await geminiVisionModel.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData,
          mimeType: mimeType
        }
      }
    ])
    
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error analyzing document image:', error)
    throw new Error('Failed to extract text from image')
  }
}

export async function searchDocuments(
  query: string,
  documents: any[]
): Promise<any[]> {
  const prompt = `
    You are a semantic search assistant. Given the search query and document summaries below,
    rank the documents by relevance and return the most relevant ones.
    
    Search Query: "${query}"
    
    Documents:
    ${documents.map((doc, idx) => `${idx}: ${doc.name} - ${doc.summary || 'No summary'}`).join('\n')}
    
    Return the document indices in order of relevance (most relevant first).
    Format: [0, 2, 1] (just the array of indices)
  `

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const indices = JSON.parse(text.match(/\[(.*?)\]/)?.[0] || '[]')
    return indices.map((idx: number) => documents[idx]).filter(Boolean)
  } catch (error) {
    console.error('Error searching documents:', error)
    return documents // Return all documents if search fails
  }
} 