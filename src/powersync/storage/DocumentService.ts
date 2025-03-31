// import { AbstractPowerSyncDatabase } from '@powersync/web'
// import { v4 as uuidv4 } from 'uuid'

// /**
//  * 文档服务 - 提供文档相关的基础操作
//  */
// export class DocumentService {
//   constructor(private db: AbstractPowerSyncDatabase) {}

//   /**
//    * 创建新文档
//    * @returns 新创建的文档ID
//    */
//   async createDocument(): Promise<string> {
//     const docId = uuidv4()
//     const blockId = uuidv4()
//     const initialBlockId = uuidv4()
//     const created_at = new Date().toISOString()

//     try {
//       // 创建初始区块
//       await this.db.execute('INSERT INTO block (id, type, content, props) VALUES (?, ?, ?, ?)', [
//         blockId,
//         'paragraph',
//         JSON.stringify([
//           {
//             type: 'paragraph',
//             id: initialBlockId
//           }
//         ]),
//         JSON.stringify({})
//       ])

//       // 关联文档和区块
//       await this.db.execute(
//         'INSERT INTO doc_block (doc_id, block_id, created_at) VALUES (?, ?, ?)',
//         [docId, blockId, created_at]
//       )

//       return docId
//     } catch (error) {
//       console.error('创建文档失败:', error)
//       throw error
//     }
//   }

//   /**
//    * 获取所有文档
//    * @returns 文档列表
//    */
//   async getDocuments() {
//     return await this.db.getAll(
//       'SELECT DISTINCT doc_id, created_at FROM doc_block ORDER BY created_at DESC'
//     )
//   }

//   /**
//    * 获取文档的所有区块
//    * @param docId 文档ID
//    * @returns 区块列表
//    */
//   async getDocumentBlocks(docId: string) {
//     return await this.db.getAll(
//       `SELECT b.* FROM block b
//        JOIN doc_block db ON b.id = db.block_id
//        WHERE db.doc_id = ?`,
//       [docId]
//     )
//   }
// }
