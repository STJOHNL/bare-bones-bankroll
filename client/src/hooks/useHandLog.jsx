import { useMemo } from 'react'
import { useApi } from './useApi'

export const useHandLog = () => {
  const { get, post, del } = useApi()

  return useMemo(
    () => ({
      getHandLogs: () => get('/hands'),
      createHandLog: data => post('/hands', data),
      deleteHandLog: id => del(`/hands/${id}`),
    }),
    [get, post, del]
  )
}
