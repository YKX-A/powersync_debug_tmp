import { useState } from "react";
import SidePanel from "./components/sidePanel";
import { useCreateDocument } from "./powersync/storage/hooks/useCreateDocument";
import { useDeleteDocument } from "./powersync/storage/hooks/useDeleteDocument";

export default function Index() {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const { createDocument } = useCreateDocument();
  const { deleteDocument } = useDeleteDocument();
  

  // Handle document selection
  const handleDocumentSelect = (docId: string) => {
    setSelectedDocId(docId);
  };

  // Create new document
  const handleDocumentCreate = async () => {
    try {
      const newDocId = await createDocument();
      setSelectedDocId(newDocId);
    } catch (error) {
      console.error("Failed to create document:", error);
    }
  };

  // Delete document
  const handleDocumentDelete = async (docId: string) => {
    try {
      await deleteDocument(docId);
      if (selectedDocId === docId) {
        setSelectedDocId(null);
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  // Toggle side panel
  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
  };

  return (
    <div className="flex h-screen justify-center">
      <div className="flex h-full max-w-6xl w-full">
        {/* Side Panel */}
        <SidePanel
          selectedDocId={selectedDocId}
          onDocumentSelect={handleDocumentSelect}
          onDocumentCreate={handleDocumentCreate}
          onDocumentDelete={handleDocumentDelete}
          isOpen={isSidePanelOpen}
          onToggle={toggleSidePanel}
        />

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {selectedDocId ? (
            <div>
              <h1 className="text-2xl font-bold mb-4">Document {selectedDocId.substring(0, 8)}</h1>
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
  );
}
