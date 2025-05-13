import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../utils/api'
import logo from '../assets/logo.png'
import Illustration from '../assets/Illustration.svg'
import { toast } from 'react-toastify'

// Custom styles for the forgot password page (same as login page)
const styles = {
  floatingLabel: {
    input: {
      borderRadius: '8px',
      height: 'calc(3.5rem + 2px)',
      fontSize: '1rem',
      paddingTop: '1.625rem',
      paddingBottom: '0.625rem',
      paddingLeft: '0.75rem',
      paddingRight: '0.75rem',
      boxShadow: 'none',
      border: '1px solid #ced4da',
      transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
    },
    label: {
      padding: '0.75rem',
      opacity: 0.65
    },
    container: {
      marginBottom: '1.5rem'
    }
  },
  // Add focus styles to apply via inline CSS
  focusedInput: {
    borderColor: '#86b7fe',
    boxShadow: '0 0 0 0.25rem rgba(13, 110, 253, 0.25)',
    outline: 0
  }
};

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [animateCard, setAnimateCard] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Add animation effect when component mounts
    setTimeout(() => {
      setAnimateCard(true)
    }, 100)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!email) {
      setError('Please enter your email address')
      return
    }

    console.log(`[ForgotPassword] Attempting to send password reset email to: ${email}`)
    
    try {
      setError('')
      setLoading(true)
      const response = await authAPI.requestPasswordReset(email)
      console.log(`[ForgotPassword] Password reset email sent successfully to: ${email}`, response)
      setSuccess(true)
      toast.success('Reset password instructions have been sent to your email')
    } catch (error) {
      console.error(`[ForgotPassword] Failed to send password reset email to: ${email}`, error)
      setError(error.message || 'Failed to request password reset. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)' }}>
      {/* Blue Banner with Logo and School Name */}
      <div className="bg-primary text-white p-3 p-md-4" style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div className="container">
          <div className="d-flex flex-column flex-md-row align-items-center text-center text-md-start">
            <img
              src={logo}
              alt="School Logo"
              className="mb-2 mb-md-0 me-md-3"
              height="60"
              width="60"
              style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.2))' }}
            />
            <div>
              <h1 className="fs-4 fs-md-3 fs-lg-2 mb-0 fw-bold">SDIT 01 Darussalam Batam</h1>
              <p className="mb-0 small fs-6 fs-md-6 lh-sm opacity-90">Mempertahankan Kebaikan Kebaikan Lama Mengembangkan hal hal baru yang lebih baik</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-11 col-sm-10 col-md-9 col-lg-7 col-xl-6">
              <div
                className={`card border-0 ${animateCard ? 'shadow-lg' : 'shadow-sm'}`}
                style={{
                  borderRadius: '12px',
                  transition: 'all 0.3s ease-in-out',
                  transform: animateCard ? 'translateY(0)' : 'translateY(20px)',
                  opacity: animateCard ? 1 : 0.8
                }}
              >
                <div className="card-body p-4 p-sm-5">
                  <h2 className="text-center text-primary fw-bold mb-4 d-md-none">Forgot Password</h2>

                  <div className="d-flex flex-column flex-md-row align-items-center">
                    <div className="mb-4 mb-md-0 me-md-5 d-flex justify-content-center" style={{ minWidth: '100px' }}>
                      <img
                        src={Illustration}
                        alt="Forgot Password Illustration"
                        className="img-fluid"
                        style={{
                          maxWidth: '100%',
                          width: '180px',
                          height: 'auto',
                          display: 'block',
                          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                        }}
                      />
                    </div>
                    <div className="flex-grow-1">
                      <h3 className="fw-bold mb-2 d-none d-md-block text-primary">Forgot Password</h3>
                      <p className="text-muted mb-4">Enter your email address and we'll send you instructions to reset your password.</p>

                      {success ? (
                        <div className="alert alert-success" role="alert">
                          <i className="bi bi-check-circle-fill me-2"></i>
                          Password reset instructions have been sent to your email. Please check your inbox.
                          <div className="mt-3">
                            <Link to="/login" className="btn btn-primary">
                              Return to Login
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <>
                          {error && (
                            <div
                              className="alert alert-danger py-2 mb-4"
                              role="alert"
                              style={{ borderRadius: '8px' }}
                            >
                              <i className="bi bi-exclamation-triangle-fill me-2"></i>
                              {error}
                            </div>
                          )}

                          <form onSubmit={handleSubmit}>
                            <div className="form-floating" style={styles.floatingLabel.container}>
                              <input
                                type="email"
                                className="form-control"
                                id="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                                required
                                disabled={loading}
                                style={{
                                  ...styles.floatingLabel.input,
                                  ...(emailFocused ? styles.focusedInput : {})
                                }}
                              />
                              <label htmlFor="email" style={styles.floatingLabel.label}>Email Address</label>
                            </div>

                            <div className="d-grid mb-3">
                              <button
                                type="submit"
                                className="btn btn-primary btn-lg py-3"
                                disabled={loading}
                                style={{
                                  borderRadius: '8px',
                                  fontWeight: '600',
                                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.12)',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {loading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Sending...
                                  </>
                                ) : 'Reset Password'}
                              </button>
                            </div>

                            <div className="text-center">
                              <Link to="/login" className="text-decoration-none text-primary fw-semibold">
                                <i className="bi bi-arrow-left-short"></i> Back to Login
                              </Link>
                            </div>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center mt-4 text-muted small">
                <p>&copy; {new Date().getFullYear()} SDIT 01 Darussalam Batam. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword 