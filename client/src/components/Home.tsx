import { useNavigate } from "react-router-dom"

const Home = () => {

    const navigate = useNavigate();

  return (
    <div>
        <div>Home</div>
        <button onClick={() => navigate('/sender')}>Sender</button>
        <button onClick={() => navigate('/receiver')}>Receiver</button>
    </div>
  )
}

export default Home