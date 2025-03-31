import { AppSchema } from '../../powersync/AppSchema'
import { SupabaseConnector } from '../../powersync/BackendConnector'
import { PowerSyncDatabase } from '@powersync/web'
import React from 'react'

// 创建 Supabase 上下文
export const SupabaseContext = React.createContext<SupabaseConnector | null>(null)
export const useSupabase = (): SupabaseConnector | null => React.useContext(SupabaseContext)

// 创建数据库实例
export const db = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: 'example.db'
  }
})
