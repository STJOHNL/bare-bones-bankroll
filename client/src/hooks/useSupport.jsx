import { useApi } from './useApi'

export const useSupport = () => {
  const { post, get, put, del } = useApi()

  const getSupportTickets = async () => {
    const data = await get('/support')
    return data
  }

  const getSupportTicket = async (id) => {
    const data = await get(`/support/${id}`)
    return data
  }

  const createSupportTicket = async (formData) => {
    const data = await post('/support', formData)
    return data
  }

  const updateSupportTicket = async (formData) => {
    const data = await put('/support', formData)
    return data
  }

  const deleteSupportTicket = async (id) => {
    const data = await del(`/support/${id}`)
    return data
  }

  return {
    getSupportTickets,
    getSupportTicket,
    createSupportTicket,
    updateSupportTicket,
    deleteSupportTicket,
  }
}
