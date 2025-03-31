import { useState, useEffect } from 'react'
import { usePowerSync } from '@powersync/react'
import { Database } from '../../AppSchema'
import { QueryResult } from '@powersync/web'

// 更新类型定义以匹配新的查询结果
type DocBlock = Database['doc_block']
type DocumentResult = Pick<DocBlock, 'user_id' | 'doc_id' | 'created_at'>

/**
 * 获取所有文档的hook
 * @returns {object} 文档列表和加载状态
 */
export function useDocuments(): { documents: DocumentResult[]; loading: boolean } {
  const [documents, setDocuments] = useState<DocumentResult[]>([])
  const [loading, setLoading] = useState(true)
  const powersync = usePowerSync()

  useEffect(() => {
    const controller = new AbortController()

    powersync.watch(
      'SELECT user_id, doc_id, MAX(created_at) as created_at FROM doc_block GROUP BY user_id, doc_id',
      [],
      {
        onResult: (results: QueryResult) => {
          console.log('useDocuments results', results)
          const typedResults = (results.rows?._array as DocumentResult[]) || []
          setDocuments(typedResults)
          setLoading(false)
        },
        onError: (error) => {
          console.error('获取文档列表失败:', error)
          setLoading(false)
        }
      },
      { signal: controller.signal, tables: ['doc_block'] }
    )
    return (): void => {
      controller.abort()
    }
  }, [powersync])

  return { documents, loading }
}
