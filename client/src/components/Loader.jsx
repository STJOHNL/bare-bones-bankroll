// Assets
import LoadingGif from '../assets/catBoxLoader.gif'

const Loader = () => {
  return (
    <div className='loader'>
      <div className='loader__image'>
        <img src={LoadingGif} alt='Loading...' className='loader__image' />
      </div>
    </div>
  )
}

export default Loader
