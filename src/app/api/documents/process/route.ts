import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { extractDocumentData, analyzeDocumentImage } from '@/lib/gemini'
import { createClient } from '@supabase/supabase-js'

// Create a service role client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { documentId, userId } = await request.json()

    if (!documentId || !userId) {
      return NextResponse.json(
        { error: 'Document ID and User ID are required' },
        { status: 400 }
      )
    }

    // Get the document from the database
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Update status to processing
    await supabaseAdmin
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId)

    // Get the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('documents')
      .download(document.file_path)

    if (downloadError || !fileData) {
      await supabaseAdmin
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', documentId)
      
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      )
    }

    const startTime = Date.now()
    let extractedData
    let textContent = ''

    try {
      // Check if it's an image file
      if (document.file_type.startsWith('image/')) {
        // Convert file to base64 for Gemini Vision API
        const arrayBuffer = await fileData.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        
        // Extract text from image using Gemini Vision
        textContent = await analyzeDocumentImage(base64, document.file_type)
      } else {
        // For PDF/DOC files, you'd need to extract text first
        // This is a simplified example - in production, you'd use libraries like pdf-parse
        textContent = await fileData.text()
      }

      // Extract structured data using Gemini AI
      extractedData = await extractDocumentData(textContent)
      
      const processingTime = Date.now() - startTime

      // Update document with extracted data
      const { error: updateError } = await supabaseAdmin
        .from('documents')
        .update({
          status: 'completed',
          extracted_data: extractedData,
          processing_time_ms: processingTime,
          confidence_score: extractedData.confidence
        })
        .eq('id', documentId)

      if (updateError) {
        throw new Error('Failed to update document')
      }

      // Insert tags
      if (extractedData.tags && extractedData.tags.length > 0) {
        const tagInserts = extractedData.tags.map(tag => ({
          document_id: documentId,
          tag: tag
        }))

        await supabaseAdmin
          .from('document_tags')
          .insert(tagInserts)
      }

      // Update user's document count
      await supabaseAdmin
        .from('users')
        .update({ 
          documents_processed: document.user_id 
        })
        .eq('id', userId)

      // Log analytics
      await supabaseAdmin
        .from('analytics')
        .insert({
          user_id: userId,
          document_id: documentId,
          action: 'document_processed',
          metadata: {
            file_type: document.file_type,
            file_size: document.file_size,
            processing_time_ms: processingTime,
            confidence_score: extractedData.confidence,
            document_type: extractedData.documentType
          }
        })

      return NextResponse.json({
        success: true,
        extractedData,
        processingTime
      })

    } catch (aiError) {
      console.error('AI processing error:', aiError)
      
      // Update status to failed
      await supabaseAdmin
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', documentId)

      return NextResponse.json(
        { error: 'Failed to process document with AI' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Document processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    )
  }

  try {
    // Get user's documents
    const { data: documents, error } = await supabaseAdmin
      .from('documents')
      .select(`
        *,
        document_tags(tag)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ documents })

  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
} 