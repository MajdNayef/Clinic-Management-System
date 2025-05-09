import React from 'react'
import Header from './Header'
import AddUser from '../Assets/adduser.png'
import alarmIcon from '../Assets/alarm.svg'
import './style.css'

const Signup = () => {
    return (

        <div>
            {/* Include the Header here */}
            <Header />

            <div className='FormContainer'>
                <div className='header'>
                    <div className='text'>Welcome to DMC Community</div>
                    <br /> {/* this is for space bettwen lines*/}
                    <div className='text'>Sign up</div>
                    <div className='underline'></div>
                </div>
                <div className='inputs'>

                    <div className='input-row'> {/* for 2 inputs in the same line*/}
                        <div className='input-group'>
                            <label>Enter your first name</label>
                            <div className='input'>
                                <input type="text" placeholder="First Name" />
                            </div>
                        </div>

                        <div className='input-group'>
                            <label>Enter your last name</label>
                            <div className='input'>
                                <input type="text" placeholder="Last Name" />
                            </div>
                        </div>
                    </div>

                    <label >Enter your phone number</label>
                    <div className='input'>

                        <input type="text " placeholder="+966" />
                    </div>

                    <label >Enter your Address</label>
                    <div className='input'>

                        <input type="text" placeholder="Address" />
                    </div>

                    <label >Enter your email</label>
                    <div className='input'>

                        <input type="email" placeholder="Example@gmail.com" />
                    </div>
                    <div className='input-row'> {/* for 2 inputs in the same line*/}
                        <div className='input-group'>
                            <label >Enter your password</label>
                            <div className='input'>

                                <input type="password" placeholder='******' />
                            </div>
                        </div>

                        <div className='input-group'>
                            <label >Confirm your password</label>
                            <div className='input'>

                                <input type="password" placeholder='******' />
                            </div>
                        </div>
                    </div>

                    <div className='checkbox'>
                        <input type="checkbox" />
                        <label>I would like to receive email notifications</label>
                        <img src={alarmIcon} alt="Alarm" id="alarmIcon" />
                    </div>


                    <button className='signup-button'>Sign up</button>

                </div>

            </div>
            <img src={AddUser} alt="Icon" id="bottomRightIcon" />

        </div>

    )
}

export default Signup



