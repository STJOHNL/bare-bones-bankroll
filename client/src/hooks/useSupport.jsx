import { useMemo } from 'react'
import { useApi } from './useApi'

export const useSupport = () => {
  const { get, post, put, del } = useApi()

  return useMemo(
    () => ({
      getSupportTickets: () => get('/support'),
      getSupportTicket: id => get(`/support/${id}`),
      createSupportTicket: formData => post('/support', formData),
      updateSupportTicket: formData => put('/support', formData),
      deleteSupportTicket: id => del(`/support/${id}`),
    }),
    [get, post, put, del]
  )
}
