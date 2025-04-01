import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabase } from './providers/context'
import SidePanel from './sidePanel'
import { useCreateDocument } from '../powersync/storage/hooks/useCreateDocument'

/**
 * Main Panel Component
 * 
 * Features:
 * 1. Serves as the main content area of the application
 * 2. Contains sidebar and document display area
 * 3. Provides logout functionality
 */
export default function MainPanel(): React.ReactElement {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true)
  const navigate = useNavigate()
  const connector = useSupabase()
  const { createDocument } = useCreateDocument()

  if (!connector) {
    return <div>Connecting to database...</div>
  }

  const handleDocumentSelect = (docId: string) => {
    setSelectedDocId(docId)
  }

  // Create new document
  const handleDocumentCreate = async (): Promise<void> => {
    try {
      const newDocId = await createDocument()
      setSelectedDocId(newDocId)
    } catch (error) {
      console.error("Failed to create document:", error)
    }
  }

  const handleDocumentDelete = (docId: string) => {
    if (selectedDocId === docId) {
      setSelectedDocId(null)
    }
  }

  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen)
  }

  // Logout
  const handleLogout = async () => {
    try {
      await connector.client.auth.signOut()
      navigate('/login')
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top navigation bar */}
      <div className="bg-indigo-700 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">My App</h1>
        <button
          onClick={handleLogout}
          className="px-3 py-1 text-sm text-white bg-indigo-800 rounded hover:bg-indigo-900 focus:outline-none"
        >
          Logout
        </button>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        <SidePanel
          selectedDocId={selectedDocId}
          onDocumentSelect={handleDocumentSelect}
          onDocumentCreate={handleDocumentCreate}
          onDocumentDelete={handleDocumentDelete}
          isOpen={isSidePanelOpen}
          onToggle={toggleSidePanel}
        />

        {/* Content area */}
        <div className="flex-1 p-6 overflow-auto">
          {selectedDocId ? (
            <div>
              <h1 className="text-2xl font-bold mb-4">Document {selectedDocId && selectedDocId.substring(0, 8)}</h1>
              <p className="text-gray-600">Document editor content will be displayed here</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-4">👈 Please select or create a document</h2>
                <p className="text-gray-500">Select a document from the sidebar or create a new one to start editing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 