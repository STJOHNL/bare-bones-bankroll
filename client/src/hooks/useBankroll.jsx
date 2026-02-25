import { useApi } from './useApi'

export const useBankroll = () => {
  const { get, post, del } = useApi()

  const getTransactions = async () => {
    const data = await get('/transaction')
    return data
  }

  const createTransaction = async formData => {
    const data = await post('/transaction', formData)
    return data
  }

  const deleteTransaction = async id => {
    const data = await del(`/transaction/${id}`)
    return data
  }

  return {
    getTransactions,
    createTransaction,
    deleteTransaction
  }
}
