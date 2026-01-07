import { PageLayout } from '../components/PageLayout'
import homeBg from '../assets/img/SPACEDOS01.jpg'

export const HomePage = () => {
  return (
    <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${homeBg})`}>
        {/* Welcome Hero Section */}
        <section style={{ 
          position: 'relative', 
          padding: '3rem 1.25rem',
          backdropFilter: 'blur(3px)',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '10px',
          marginBottom: '2rem'
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 600, margin: '0 0 1rem 0' }}>
              Welcome to DOSPORTAL
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', margin: '0' }}>
              Page, where you can visualize, store, share or compare your dosimetry data.
            </p>
          </div>
        </section>

        {/* About Section */}
        <section style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '2rem 1.25rem',
          borderRadius: '10px'
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>About DOSPORTAL</h3>
            
            <p>
              This web application has been developed and maintained by <a href="https://www.ust.cz">UST (Universal Scientific Technologies s.r.o.)</a>, a company specializing in the manufacturing and development of both semiconductor and scintillation detectors. Our extensive range of detectors includes SPACEDOS, AIRDOS, and LABDOS, which are designed to meet the diverse needs of scientific applications.
            </p>

            <p>
              Semiconductor detectors, based on solid-state physics principles, utilize semiconductor materials to detect radiation. These detectors offer excellent energy resolution and are widely used in fields such as nuclear physics, materials science, and environmental monitoring.
            </p>

            <p>
              Scintillation detectors, on the other hand, employ scintillating materials that emit light when interacting with radiation. These detectors are highly efficient and find applications in areas such as medical imaging, homeland security, and nuclear power plants.
            </p>

            <p>
              UST collaborates closely with the <a href="https://odz.ujf.cas.cz/">Nuclear Physics Institute</a> of the Czech Academy of Sciences to develop advanced detectors. This collaboration ensures that our detectors meet the rigorous standards required for scientific research and personal dosimetry.
            </p>

            <p>
              This website serves as a comprehensive portal for accessing fundamental information about measurements conducted with our detectors. Users can browse through individual records or contribute their own measurements to further scientific understanding.
            </p>

            <p>
              For more in-depth information about our detectors, please visit the <a href="https://www.ust.cz/UST-dosimeters/">official UST website</a> or refer to the <a href="https://docs.dos.ust.cz/">documentation</a> pages, where you will find detailed specifications and technical details about our semiconductor and scintillation detectors.
            </p>
          </div>
        </section>
      </PageLayout>
    )
  }
