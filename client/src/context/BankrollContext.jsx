import { createContext, useContext, useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { useUserContext } from './UserContext'

const BankrollContext = createContext()

export const BankrollProvider = ({ children }) => {
  const { get } = useApi()
  const { user } = useUserContext()
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setTransactions([])
      return
    }
    const fetchTransactions = async () => {
      setIsLoading(true)
      const data = await get('/transaction')
      setTransactions(data || [])
      setIsLoading(false)
    }
    fetchTransactions()
  }, [user])

  const deposits = transactions
    .filter(t => t.type === 'Deposit' || t.type === 'Cash-out')
    .reduce((sum, t) => sum + t.amount, 0)

  const withdrawals = transactions
    .filter(t => t.type === 'Withdrawal' || t.type === 'Buy-in')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = deposits - withdrawals

  return (
    <BankrollContext.Provider value={{ transactions, setTransactions, balance, isLoading }}>
      {children}
    </BankrollContext.Provider>
  )
}

export const useBankrollContext = () => {
  const context = useContext(BankrollContext)
  if (!context) throw new Error('useBankrollContext must be used within a BankrollProvider')
  return context
}
