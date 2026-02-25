import { createContext, useContext, useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { useUserContext } from './UserContext'

const BankrollContext = createContext()

export const BankrollProvider = ({ children }) => {
  const { get } = useApi()
  const { user } = useUserContext()
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchTransactions = async () => {
    setIsLoading(true)
    const data = await get('/transaction')
    setTransactions(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    if (!user) {
      setTransactions([])
      return
    }
    fetchTransactions()
  }, [user])

  const deposits = transactions
    .filter(t => t.type === 'Deposit')
    .reduce((sum, t) => sum + t.amount, 0)

  const withdrawals = transactions
    .filter(t => t.type === 'Withdrawal')
    .reduce((sum, t) => sum + t.amount, 0)

  const cashouts = transactions
    .filter(t => t.type === 'Cash-out')
    .reduce((sum, t) => sum + t.amount, 0)

  const buyins = transactions
    .filter(t => t.type === 'Buy-in')
    .reduce((sum, t) => sum + t.amount, 0)

  const promos = transactions
    .filter(t => t.type === 'Promo')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = deposits + cashouts + promos - withdrawals - buyins

  return (
    <BankrollContext.Provider value={{ transactions, setTransactions, balance, isLoading, refetchTransactions: fetchTransactions }}>
      {children}
    </BankrollContext.Provider>
  )
}

export const useBankrollContext = () => {
  const context = useContext(BankrollContext)
  if (!context) throw new Error('useBankrollContext must be used within a BankrollProvider')
  return context
}
