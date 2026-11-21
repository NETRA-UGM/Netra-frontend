import LoginForm from "@/components/LoginForm";
import ParticleBackground from "@/components/ParticleBackground";
import "./login.css";

export default function LoginPage() {
  return (
    <main className="figma-login-page">
      <ParticleBackground />
      <div className="figma-login-layout">
        <div className="figma-login-content">
          <header className="figma-login-brand" aria-label="NETRA">
            <span className="figma-login-mark" aria-hidden="true">
              <img className="figma-mark-left" src="/login/logo-left.svg" alt="" width="24" height="18" />
              <img className="figma-mark-right" src="/login/logo-right.svg" alt="" width="24" height="18" />
            </span>
            <span className="figma-login-wordmark">ETRA</span>
          </header>

          <section className="figma-login-panel" aria-labelledby="login-title">
            <h1 id="login-title">Welcome back</h1>
            <LoginForm />
          </section>
        </div>
      </div>
    </main>
  );
}
