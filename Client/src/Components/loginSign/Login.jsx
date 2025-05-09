import React from 'react'
import './style.css'

import Header from './Header'

// import userIcon from '../Assets/network.png'
import userIcon from '../Assets/community.png'

const Login = () => {
    return (

        <div>

            {/* Include the Header here */}
            <Header />

            <div className='FormContainer'>
                <div className='header'>
                    <div className='text'>Welcome Back </div>

                    <br /> {/* this is for space bettwen lines*/}
                    <div className='text'>Login to your account</div>
                    <div className='underline'></div>
                </div>
                <div className='inputs'>

                    <label >Enter your email</label>
                    <div className='input'>

                        <input type="email" placeholder="example@gmail.com" />
                    </div>

                    <label >Enter your password</label>
                    <div className='input'>

                        <input type="password" placeholder="******" />
                    </div>
                    <a href="#" title="Forget your password?">Forgot password?</a><br />
                    {/* <a href="#" title="Forget your password?">you dont have an account?</a><br /> */}

                    <button className='login-button'>Login</button>

                </div>

            </div>
            <img src={userIcon} alt="Icon" id="bottomRightIcon" />

        </div>

    )
}

export default Login
