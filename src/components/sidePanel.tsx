import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'

// Import custom hooks
import { useDocuments } from '../powersync/storage/hooks/useDocuments'
import { useDeleteDocument } from '../powersync/storage/hooks/useDeleteDocument'
import { usePowerSync , useQuery} from '@powersync/react'

export interface Document {
  doc_id: string
  created_at: string
  [key: string]: unknown
}

interface SidePanelProps {
  selectedDocId: string | null
  onDocumentSelect: (docId: string) => void
  onDocumentCreate: () => Promise<void>
  onDocumentDelete?: (docId: string) => void
  isOpen: boolean
  onToggle: () => void
}

export default function SidePanel({
  selectedDocId,
  onDocumentSelect,
  onDocumentCreate,
  onDocumentDelete,
  isOpen,
  onToggle
}: SidePanelProps) {
  const { documents, loading: documentsLoading } = useDocuments()
  const { deleteDocument } = useDeleteDocument()
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const powersync = usePowerSync()
  // this hook gives stale data
  const { data: data_from_doc_block } = useQuery('SELECT user_id, doc_id FROM doc_block')
  // this hook gives correct, latest data
  const { data: data_from_block } = useQuery('SELECT id, created_at FROM block')
  
  // useEffect(() => {
  //   // Debug table parsing
  //   powersync
  //     .resolveTables(
  //       'SELECT user_id, doc_id, MAX(created_at) as created_at FROM doc_block GROUP BY user_id, doc_id'
  //     )
  //     .then((tables) => {
  //       console.log('Monitored tables:', tables)
  //     })

  //   // Other code...
  // }, [powersync])

  useEffect(() => {
    
    const dispose = powersync.onChange(
      {
        onChange: (event) => {
          console.log('detect table changes:', event.changedTables)
        }
      },
      { tables: ['doc_block', 'block', 'block_to_block'] }
    )
    return dispose
  }, [powersync])

  console.log('powersync useQuery data_from_doc_block updated', data_from_doc_block)
  console.log('powersync useQuery data_from_block updated', data_from_block)

  useEffect(() => {
    // powersync.onChange returns a cleanup function
    const dispose = powersync.onChange(
      {
        onChange: (event) => {
          console.log('Changes detected:', event.changedTables)
          // Handle table changes logic here
        }
      },
      { tables: ['doc_block', 'block', 'block_to_block'] }
    )
    return dispose
  }, [powersync])

  // Handle document deletion
  const handleDeleteClick = (docId: string, e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation() // Prevent triggering document selection
    setDeleteConfirmId(docId)
  }

  // Confirm document deletion
  const confirmDelete = async (docId: string, e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.stopPropagation() // Prevent triggering document selection
    try {
      await deleteDocument(docId)
      // If the deleted document is currently selected, notify parent component
      if (selectedDocId === docId && onDocumentDelete) {
        onDocumentDelete(docId)
      }
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  // Cancel deletion
  const cancelDelete = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation() // Prevent triggering document selection
    setDeleteConfirmId(null)
  }

  // Document item click handler
  const handleDocumentClick = (docId: string | null | undefined): void => {
    if (docId) {
      onDocumentSelect(docId)
    }
  }

  return (
    <div
      className={`h-full border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Top bar */}
      <div className="p-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
        {isOpen && <h2 className="text-lg font-medium">My Documents</h2>}
        <button 
          type="button"
          onClick={onToggle} 
          className="ml-auto p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isOpen ? '←' : '→'}
        </button>
      </div>

      {/* New document button */}
      {isOpen && (
        <div className="p-3 border-b">
          <button
            type="button"
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2"
            onClick={onDocumentCreate}
          >
            <span>+</span> New Document
          </button>
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-auto">
        {documentsLoading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : !isOpen ? (
          // Display simple list when collapsed
          <div className="py-2">
            {documents.map((doc) => (
              <div
                key={doc.doc_id}
                onClick={() => handleDocumentClick(doc.doc_id)}
                className={`p-3 w-full flex justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  selectedDocId === doc.doc_id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                📄
              </div>
            ))}
          </div>
        ) : documents.length > 0 ? (
          // Display full list when expanded
          <div className="py-2">
            {documents.map((doc) => (
              <div key={doc.doc_id} className="relative">
                <div
                  onClick={() => handleDocumentClick(doc.doc_id)}
                  className={`px-3 py-2 w-full flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group ${
                    selectedDocId === doc.doc_id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">📄</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        Document {doc.doc_id && doc.doc_id.substring(0, 8)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {doc.created_at
                          ? format(new Date(doc.created_at), 'yyyy-MM-dd HH:mm')
                          : 'Unknown time'}
                      </div>
                    </div>
                  </div>
                  
                  {deleteConfirmId !== doc.doc_id && (
                    <button
                      type="button"
                      onClick={(e) => doc.doc_id && handleDeleteClick(doc.doc_id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 rounded"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                
                {deleteConfirmId === doc.doc_id && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => doc.doc_id && confirmDelete(doc.doc_id, e)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={cancelDelete}
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">No documents</div>
        )}
      </div>
    </div>
  )
}
