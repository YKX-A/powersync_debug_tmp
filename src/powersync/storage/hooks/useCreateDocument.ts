import { usePowerSync } from '@powersync/react'
import { v4 as uuidv4 } from 'uuid'
// import { UniqueID } from '@blocknote/core'
import { useSupabase } from '../../../components/providers/context'

/**
 * Hook that provides document creation functionality
 * @returns {object} Object containing createDocument method
 */
export function useCreateDocument(): { createDocument: () => Promise<string> } {
  const powersync = usePowerSync()
  const supabaseConnector = useSupabase()

  /**
   * Creates a new document
   * @returns {Promise<string>} ID of the newly created document
   */
  const createDocument = async (): Promise<string> => {
    const docId = uuidv4()
    const blockId = uuidv4()
    const docBlockId = uuidv4() // Generate separate id for doc_block
    const created_at = new Date().toISOString()
    const user_id = supabaseConnector?.currentSession?.user?.id || ''

    try {
      // Create initial block
      await powersync.writeTransaction(async (tx) => {
        // According to schema order: id, created_at, content, props, type, user_id
        await tx.execute(
          'INSERT INTO block (id, created_at, content, props, type, user_id) VALUES (?, ?, ?, ?, ?, ?)',
          [
            blockId,
            created_at,
            JSON.stringify([
              {
                type: 'text',
                text: 'QAQ',
                styles: {}
              }
            ]),
            JSON.stringify({}),
            'paragraph',
            user_id
          ]
        )

        // Explicitly specify id field: id, created_at, doc_id, block_id, user_id
        await tx.execute(
          'INSERT INTO doc_block (id, created_at, doc_id, block_id, user_id) VALUES (?, ?, ?, ?, ?)',
          [docBlockId, created_at, docId, blockId, user_id]
        )
      })
      console.log('Document created successfully:', docId)
      return docId
    } catch (error) {
      console.error('Failed to create document:', error)
      throw error
    }
  }

  return { createDocument }
}
