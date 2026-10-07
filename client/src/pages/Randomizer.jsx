import PageTitle from '../components/PageTitle'
import RngPanel from '../components/randomizer/RngPanel'
import PotOddsCalculator from '../components/randomizer/PotOddsCalculator'
import RatioCalculator from '../components/randomizer/RatioCalculator'
import ChipStackCalculator from '../components/randomizer/ChipStackCalculator'
import SavedHands from '../components/randomizer/SavedHands'
import PlayerNotes from '../components/randomizer/PlayerNotes'

const Randomizer = () => (
  <>
    <PageTitle title='Randomizer' />
    <RngPanel />
    <PotOddsCalculator />
    <RatioCalculator />
    <ChipStackCalculator />
    <SavedHands />
    <PlayerNotes />
  </>
)

export default Randomizer
