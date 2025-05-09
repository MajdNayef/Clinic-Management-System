import React from 'react'
import './style.css'
import Header from './Header'

import userIcon from '../Assets/community.png'
import dmcIcon from '../Assets/DMC.png'

const HomePage = () => {
    return (
        <div>
            {/* Include the Header here */}
            <Header />

            <section className='heroSection'>
                <div className='heroContent'>
                    <h1>Welcome to MedConnect</h1>
                    <p>Your bridge to smarter, simpler healthcare.</p>
                    <a href='/register' className='ctaButton'>Get Started</a>
                </div>
                <img src={userIcon} alt='Hero Icon' className='heroIcon' />
            </section>

            <section className='featuresSection'>
                <h2>Why Choose MedConnect?</h2>
                <div className='featuresGrid'>
                    <div className='featureBox'>
                        <h3>Book Appointments Easily</h3>
                        <p>Schedule physical or virtual visits in just a few clicks.</p>
                    </div>
                    <div className='featureBox'>
                        <h3>Secure Medical Records</h3>
                        <p>Access your history and prescriptions anytime, anywhere.</p>
                    </div>
                    <div className='featureBox'>
                        <h3>Talk to Trusted Doctors</h3>
                        <p>Consult with qualified healthcare professionals online or onsite.</p>
                    </div>
                </div>
            </section>

            <section className='aboutSection'>
                <h2>About Distinct Medicine Complex (DMC)</h2>
                <p>Based in Medina, Saudi Arabia, DMC offers modern healthcare services with a compassionate approach. MedConnect enhances that experience through digital innovation.</p>
                <img src={dmcIcon} alt='DMC Logo' className='dmcIcon' />
            </section>
        </div>
    )
}

export default HomePage
