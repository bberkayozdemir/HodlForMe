import React from 'react'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom' 
import Logo from 'assets/images/logo.png'

const Home = () => {

    return (
        <div className="home">

            <div className="logo">
                <Container>
                    <Link className="logo-text" to="/">
                        <img src={Logo}/>
                        <div>HODL<span>FOR</span>ME</div>
                    </Link>
                </Container>
            </div>

            <Container>

                <div className="landing">
                    <div className="first-title">
                        CANT HODL?
                    </div>
                    <div className="second-title">
                        WE CAN DO IT FOR YOU
                    </div>
                    <div className="description">
                        Deposit your crypto assets and we will hold them for you until<br/>the time you want to keep them
                    </div>
                    <Link className="button" to="/hodl">
                        START NOW
                    </Link>
                </div>
            </Container>
        </div>
    )

}

export default Home