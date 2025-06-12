'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Upload, 
  FileText, 
  Brain, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  BarChart3,
  Download
} from "lucide-react"

interface Document {
  id: string
  name: string
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  extractedData?: {
    documentType: string
    keyEntities: any
    summary: string
    tags: string[]
    confidence: number
    riskFlags: string[]
  }
  uploadedAt: string
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Service_Agreement_2024.pdf',
      status: 'completed',
      extractedData: {
        documentType: 'contract',
        keyEntities: {
          parties: ['TechCorp LLC', 'ClientCo Inc'],
          amount: '$50,000',
          date: '2024-01-15',
          deadline: '2024-12-31'
        },
        summary: 'Annual service agreement between TechCorp and ClientCo for software development services worth $50,000.',
        tags: ['contract', 'software', 'annual'],
        confidence: 0.94,
        riskFlags: ['Late payment clause missing']
      },
      uploadedAt: '2024-01-10T10:30:00Z'
    },
    {
      id: '2',
      name: 'Invoice_12345.pdf',
      status: 'processing',
      uploadedAt: '2024-01-10T11:00:00Z'
    }
  ])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const newDoc: Document = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        status: 'uploading',
        uploadedAt: new Date().toISOString()
      }
      
      setDocuments(prev => [newDoc, ...prev])
      
      // Simulate upload and processing
      setTimeout(() => {
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === newDoc.id 
              ? { ...doc, status: 'processing' }
              : doc
          )
        )
        
        // Simulate AI processing completion
        setTimeout(() => {
          setDocuments(prev => 
            prev.map(doc => 
              doc.id === newDoc.id 
                ? { 
                    ...doc, 
                    status: 'completed',
                    extractedData: {
                      documentType: 'legal',
                      keyEntities: {
                        parties: ['Sample Party A', 'Sample Party B'],
                        amount: 'TBD',
                        date: new Date().toISOString().split('T')[0]
                      },
                      summary: 'Document successfully processed by AI. Key information extracted.',
                      tags: ['processed', 'ai-analyzed'],
                      confidence: 0.89,
                      riskFlags: []
                    }
                  }
                : doc
            )
          )
        }, 3000)
      }, 1000)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'processing':
        return <Brain className="h-5 w-5 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const stats = {
    totalDocuments: documents.length,
    processed: documents.filter(d => d.status === 'completed').length,
    processing: documents.filter(d => d.status === 'processing').length,
    avgConfidence: documents
      .filter(d => d.extractedData)
      .reduce((acc, d) => acc + (d.extractedData?.confidence || 0), 0) / 
      documents.filter(d => d.extractedData).length || 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Document Intelligence Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Search Documents
              </Button>
              <Button variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.processed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {(stats.avgConfidence * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>
                  Drop files here or click to upload. Supports PDF, DOC, DOCX, and images.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  {isDragActive ? (
                    <p className="text-blue-600 font-medium">Drop files here...</p>
                  ) : (
                    <>
                      <p className="text-gray-600 font-medium mb-2">
                        Drag & drop files here
                      </p>
                      <p className="text-sm text-gray-500">
                        or click to browse
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
                <CardDescription>
                  Track the status and view extracted data from your documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(doc.status)}
                        <div>
                          <h3 className="font-medium text-gray-900">{doc.name}</h3>
                          <p className="text-sm text-gray-500 capitalize">{doc.status}</p>
                        </div>
                      </div>
                      
                      {doc.extractedData && (
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {doc.extractedData.documentType}
                            </p>
                            <p className="text-sm text-gray-500">
                              {(doc.extractedData.confidence * 100).toFixed(1)}% confidence
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {documents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No documents uploaded yet. Start by uploading your first document.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Document Details */}
        {documents.filter(d => d.extractedData).length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Latest Extracted Data</CardTitle>
                <CardDescription>
                  AI-powered insights from your most recently processed document
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const latestDoc = documents.find(d => d.extractedData)
                  if (!latestDoc?.extractedData) return null
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Key Entities</h4>
                        <div className="space-y-2">
                          {Object.entries(latestDoc.extractedData.keyEntities).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-sm text-gray-600 capitalize">{key}:</span>
                              <span className="text-sm font-medium">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                        <p className="text-sm text-gray-600 mb-4">{latestDoc.extractedData.summary}</p>
                        
                        <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {latestDoc.extractedData.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        {latestDoc.extractedData.riskFlags.length > 0 && (
                          <>
                            <h4 className="font-medium text-gray-900 mb-2 mt-4">Risk Flags</h4>
                            <div className="space-y-1">
                              {latestDoc.extractedData.riskFlags.map((flag, idx) => (
                                <div key={idx} className="flex items-center text-sm text-red-600">
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  {flag}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 