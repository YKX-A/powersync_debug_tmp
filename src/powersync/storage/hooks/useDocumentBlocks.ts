// import { useState, useEffect } from 'react'
// import { usePowerSync } from '@powersync/react'
// import { Database } from '@renderer/lib/powersync/AppSchema'

// type DBBlock = Database['block'] & { id: string }

// // 扩展区块类型，添加children字段
// interface BlockWithChildren extends Omit<DBBlock, 'content' | 'props'> {
//   children: BlockWithChildren[]
//   content: any // 解析后的内容
//   props: any // 解析后的属性
// }

// /**
//  * 获取指定文档的所有区块并组织成树状结构
//  * @param docId 文档ID
//  * @returns {object} 树状区块结构和加载状态
//  */
// export function useDocumentBlocks(docId: string | null): {
//   blocks: BlockWithChildren[]
//   loading: boolean
// } {
//   const [blocks, setBlocks] = useState<BlockWithChildren[]>([])
//   const [loading, setLoading] = useState(true)
//   const powersync = usePowerSync()

//   useEffect(() => {
//     // 如果没有文档ID，重置状态并返回
//     if (!docId) {
//       setBlocks([])
//       setLoading(false)
//       return
//     }

//     // 创建中止控制器用于清理
//     const controller = new AbortController()

//     // 构建文档区块树
//     const buildDocumentTree = async () => {
//       try {
//         setLoading(true)

//         // 1. 获取文档的顶层区块
//         const topLevelQuery = await powersync.execute(
//           `SELECT block_id FROM doc_block WHERE doc_id = ?`,
//           [docId]
//         )
//         const topLevelIds = topLevelQuery.rows?._array.map((row) => row.block_id) || []

//         if (topLevelIds.length === 0) {
//           setBlocks([])
//           setLoading(false)
//           return
//         }

//         // 2. 获取并组装树状结构
//         const result = await buildBlockTree(topLevelIds)

//         setBlocks(result)
//         setLoading(false)
//       } catch (error) {
//         console.error('Error building document tree:', error)
//         setLoading(false)
//       }
//     }

//     // 递归构建区块树结构
//     const buildBlockTree = async (blockIds: string[]): Promise<BlockWithChildren[]> => {
//       if (blockIds.length === 0) return []

//       try {
//         // 获取区块详情
//         const placeholders = blockIds.map(() => '?').join(',')
//         const blocksQuery = await powersync.execute(
//           `SELECT * FROM block WHERE id IN (${placeholders})`,
//           blockIds
//         )
//         const blockData = (blocksQuery.rows?._array as DBBlock[]) || []

//         // 获取子区块关系
//         const relationsQuery = await powersync.execute(
//           `SELECT parent_block_id, children_block_id FROM block_to_block 
//            WHERE parent_block_id IN (${placeholders})
//            ORDER BY id`, // 添加排序以保持子区块顺序
//           blockIds
//         )
//         const relations = relationsQuery.rows?._array || []

//         // 按父区块ID对关系进行分组
//         const relationsByParent = new Map<string, string[]>()
//         relations.forEach((rel) => {
//           if (!relationsByParent.has(rel.parent_block_id)) {
//             relationsByParent.set(rel.parent_block_id, [])
//           }
//           relationsByParent.get(rel.parent_block_id)!.push(rel.children_block_id)
//         })

//         // 处理每个区块及其子区块
//         const result: BlockWithChildren[] = []

//         for (const block of blockData) {
//           // 解析JSON字段
//           let content = []
//           let props = {}

//           try {
//             // 详细调试原始内容
//             console.log('原始content:', block.content)

//             if (block.content) {
//               const parsed = JSON.parse(block.content)
//               console.log('解析后类型:', typeof parsed)
//               console.log('解析后值:', parsed)
//               console.log('是数组?', Array.isArray(parsed))

//               // 赋值给content
//               content = parsed
//             } else {
//               content = []
//             }

//             // 同样处理props
//             if (block.props) {
//               props = JSON.parse(block.props)
//             } else {
//               props = {}
//             }
//           } catch (e) {
//             console.warn('解析JSON失败:', block.id, e)
//           }

//           // 递归处理子区块
//           const childIds = relationsByParent.get(block.id) || []
//           const children = await buildBlockTree(childIds)

//           result.push({
//             ...block,
//             content,
//             props,
//             children
//           })
//         }

//         return result
//       } catch (error) {
//         console.error('Error building block tree:', error)
//         return []
//       }
//     }

//     // 初始化获取文档树
//     buildDocumentTree()

//     // 设置监听器，当数据变化时重新构建树
//     // 监听doc_block表变化
//     powersync.watch(
//       `SELECT * FROM doc_block WHERE doc_id = ?`,
//       [docId],
//       {
//         onResult: buildDocumentTree,
//         onError: (error) => console.error('Watch doc_block error:', error)
//       },
//       { signal: controller.signal }
//     )

//     // 监听与文档相关的区块变化
//     powersync.watch(
//       `SELECT b.* FROM block b
//        JOIN doc_block db ON b.id = db.block_id
//        WHERE db.doc_id = ?`,
//       [docId],
//       {
//         onResult: buildDocumentTree,
//         onError: (error) => console.error('Watch blocks error:', error)
//       },
//       { signal: controller.signal }
//     )

//     // 监听与文档相关的区块关系变化
//     powersync.watch(
//       `SELECT bb.* FROM block_to_block bb
//        JOIN doc_block db ON bb.parent_block_id = db.block_id
//        WHERE db.doc_id = ?`,
//       [docId],
//       {
//         onResult: buildDocumentTree,
//         onError: (error) => console.error('Watch block relations error:', error)
//       },
//       { signal: controller.signal }
//     )

//     // 组件卸载时清理
//     return () => {
//       controller.abort()
//     }
//   }, [docId, powersync])

//   return { blocks, loading }
// }
