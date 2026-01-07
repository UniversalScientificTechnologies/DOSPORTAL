import { Link } from 'react-router-dom'

export const Navbar = ({
  isAuthed,
  onLogout,
}: {
  isAuthed: boolean
  onLogout: () => Promise<void>
}) => {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-link">
            <span className="nav-brand">DOSPORTAL</span>
        </Link>
        {isAuthed && (
          <Link to="/logbooks" className="nav-link">
              LogBooks
          </Link>
        )}
      </div>
      <div className="nav-right">
        {isAuthed ? (
          <>
            <Link to="/profile" className="nav-link">
              <span role="img" aria-label="profile">👤</span> Profile
            </Link>
            <button className="nav-link" onClick={onLogout}>
              Logout
            </button>
            
          </>
        ) : (
          <Link to="/login" className="nav-link">
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}
