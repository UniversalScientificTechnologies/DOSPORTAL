interface PageLayoutProps {
  children: React.ReactNode
  backgroundImage?: string
}

export const PageLayout = ({ children, backgroundImage }: PageLayoutProps) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'auto',
        backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '80px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '1200px', padding: '1.25rem' }}>
        {children}
      </div>
    </div>
  )
}
