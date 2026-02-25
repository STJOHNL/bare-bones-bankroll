import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const PageTitle = ({ title, hideTitle }) => {
  const location = useLocation()

  useEffect(() => {
    document.title = title
  }, [location, title])

  return !hideTitle ? <h1 className='heading-xl'>{title}</h1> : null
}

export default PageTitle
