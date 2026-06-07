import AuthLayout from '../layouts/AuthLayout';
import { useSignupPage } from '../hooks/pageHooks';

export default function SignupPage() {
  const {
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    termsAgreed,
    setTermsAgreed,
    status,
    onSubmit,
    checkoutNotice,
    loginHref,
  } = useSignupPage();

  return (
    <AuthLayout>
      <main>
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-header">
              <img src="assets/images/2020/12/Logo_light1.svg" alt="cheezka" className="auth-logo" />
              <h1>Join Cheezka!</h1>
              <p>Create your account in seconds</p>
            </div>
            {checkoutNotice ? (
              <div
                id="checkout-auth-notice"
                style={{ display: 'block', backgroundColor: '#fff3e0', color: '#e65100', marginBottom: '16px', padding: '12px', borderRadius: '6px' }}
              >
                {checkoutNotice}
              </div>
            ) : null}
            <form id="signup-form" method="post" action="#" onSubmit={onSubmit}>
              <div className="form-group">
                <label htmlFor="signup-name">Full Name</label>
                <input type="text" id="signup-name" name="name" placeholder="Your full name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="signup-email">Email Address</label>
                <input type="email" id="signup-email" name="email" placeholder="your@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="signup-phone">Phone Number</label>
                <input type="tel" id="signup-phone" name="phone" placeholder="10-digit phone number" required value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <input type="password" id="signup-password" name="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="signup-confirm">Confirm Password</label>
                <input type="password" id="signup-confirm" name="confirm" placeholder="••••••••" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <div className="terms-check">
                <label>
                  <input type="checkbox" id="terms-agree" name="terms" required checked={termsAgreed} onChange={(e) => setTermsAgreed(e.target.checked)} />
                  <span>I agree to the <a href="#">Terms &amp; Conditions</a> and <a href="#">Privacy Policy</a></span>
                </label>
              </div>
              <div id="form-status" style={{ display: status.message ? 'block' : 'none', backgroundColor: status.bg, color: status.color }}>
                {status.message}
              </div>
              <button type="submit" className="submit-btn">Create Account</button>
            </form>
            <div className="login-link">
              Already have an account? <a href={loginHref}>Login here</a>
            </div>
            <div className="home-link">
              <a href="/"><i className="fa fa-chevron-left ck-mr-5" /> Back to Home</a>
            </div>
          </div>
        </div>
      </main>
    </AuthLayout>
  );
}
