import { useMemo } from 'react'
import { useApi } from './useApi'

export const useBankroll = () => {
  const { get, post, put, del } = useApi()

  return useMemo(
    () => ({
      getTransactions: () => get('/transaction'),
      createTransaction: formData => post('/transaction', formData),
      updateTransaction: (id, formData) => put(`/transaction/${id}`, formData),
      deleteTransaction: id => del(`/transaction/${id}`),
    }),
    [get, post, put, del]
  )
}
