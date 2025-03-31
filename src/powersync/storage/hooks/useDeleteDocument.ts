import { usePowerSync } from '@powersync/react'

/**
 * Custom Hook for deleting documents and their associated blocks
 * @returns Object containing deleteDocument method
 */
export const useDeleteDocument = (): { deleteDocument: (docId: string) => Promise<boolean> } => {
  const powersync = usePowerSync()

  /**
   * Delete a document with the specified ID and its associated blocks
   * @param docId ID of the document to delete
   * @returns Returns true if deletion is successful
   */
  const deleteDocument = async (docId: string): Promise<boolean> => {
    try {
      // 1. First, get all block IDs associated with this document
      const blockIds = await powersync.execute(`SELECT block_id FROM doc_block WHERE doc_id = ?`, [
        docId
      ])

      if (blockIds.rows && blockIds.rows._array.length > 0) {
        const blockIdList = blockIds.rows._array.map((row) => row.block_id)
        const placeholders = blockIdList.map(() => '?').join(',')

        // 2. Delete data in the block_to_block table associated with these blocks
        // await powersync.execute(
        //   `DELETE FROM block_to_block WHERE parent_block_id IN (${placeholders}) OR children_block_id IN (${placeholders})`,
        //   [...blockIdList, ...blockIdList]
        // )

        // 3. Delete the blocks themselves
        await powersync.execute(`DELETE FROM block WHERE id IN (${placeholders})`, blockIdList)
        console.log('Blocks deleted successfully', blockIdList)

        // Delete from doc_block table
        // await powersync.execute(`DELETE FROM doc_block WHERE doc_id = ?`, [docId])
      }

      // 4. Finally delete records in the document association table
      // await powersync.execute(`DELETE FROM doc_block WHERE doc_id = ?`, [docId])

      return true
    } catch (error) {
      console.error('Failed to delete document:', error)
      throw error
    }
  }

  return { deleteDocument }
}
