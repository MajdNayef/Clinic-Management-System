import React from 'react'
import { useTranslation } from 'react-i18next'
import './style.css'
import Header from './Header'

import userIcon from '../Assets/community.png'
import dmcIcon from '../Assets/DMC.png'

export default function HomePage() {
  const { t } = useTranslation();
    
    return (
        <div>
            {/* Include the Header here */}
            <Header />

            <section className='heroSection'>
                <div className='heroContent'>
                    <h1>{t('homepage.welcomeTitle')}</h1>
                    <p>{t('homepage.welcomeSubtitle')}</p>
                    <a href='/signup' className='ctaButton' >{t('homepage.getStarted')}</a>
                </div>
                <img src={userIcon} alt='Hero Icon' className='heroIcon' />
            </section>

            <section className='featuresSection'>
                <h2>{t('homepage.whyChooseTitle')}</h2>
                <div className='featuresGrid'>
                    <div className='featureBox'>
                        <h3>{t('homepage.bookAppointmentsTitle')}</h3>
                        <p>{t('homepage.bookAppointmentsDesc')}</p>
                    </div>
                    <div className='featureBox'>
                        <h3>{t('homepage.secureRecordsTitle')}</h3>
                        <p>{t('homepage.secureRecordsDesc')}</p>
                    </div>
                    <div className='featureBox'>
                        <h3>{t('homepage.trustedDoctorsTitle')}</h3>
                        <p>{t('homepage.trustedDoctorsDesc')}</p>
                    </div>
                </div>
            </section>

            <section className='aboutSection'>
                <h2>{t('homepage.aboutTitle')}</h2>
                <p>{t('homepage.aboutDesc')}</p>
                <img src={dmcIcon} alt='DMC Logo' className='dmcIcon' />
            </section>
        </div>
    )
}
