import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useApi } from '../hooks/useApi'
import { useUserContext } from './UserContext'
import { computeBankroll, normalizeTransaction } from '../utils/bankroll'

const BankrollContext = createContext()

export const BankrollProvider = ({ children }) => {
  const { get } = useApi()
  const { user } = useUserContext()
  const [rawTransactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const refetchTransactions = useCallback(async () => {
    setIsLoading(true)
    const data = await get('/transaction')
    if (data) setTransactions(data)
    setIsLoading(false)
  }, [get])

  useEffect(() => {
    if (!user) {
      setTransactions([])
      return
    }
    refetchTransactions()
  }, [user, refetchTransactions])

  // Legacy Deposit/Withdrawal rows are presented as Purchase/Redemption
  const transactions = useMemo(() => rawTransactions.map(normalizeTransaction), [rawTransactions])
  const summary = useMemo(() => computeBankroll(transactions), [transactions])

  const value = useMemo(
    () => ({ transactions, setTransactions, summary, balance: summary.balance, isLoading, refetchTransactions }),
    [transactions, summary, isLoading, refetchTransactions]
  )

  return <BankrollContext.Provider value={value}>{children}</BankrollContext.Provider>
}

export const useBankrollContext = () => {
  const context = useContext(BankrollContext)
  if (!context) throw new Error('useBankrollContext must be used within a BankrollProvider')
  return context
}
