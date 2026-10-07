// Assets
import LoadingImage from '../assets/catBoxLoader.webp'

const Loader = () => {
  return (
    <div className='loader' role='status'>
      <div className='loader__image'>
        <img src={LoadingImage} alt='Loading…' className='loader__image' />
      </div>
    </div>
  )
}

export default Loader
