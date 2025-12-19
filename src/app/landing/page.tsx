import Link from 'next/link';
import './landing.css';

export const metadata = {
  title: 'RISIDIO Creative Rights & Revenue Tracker | Protect Your Work, Track Your Revenue',
  description: 'The complete platform for managing creative rights, tracking revenue, and automating payments with blockchain technology. Built for creators, by creators.',
};

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <div className="landing-logo">
            Revenue <span className="landing-logo-accent">Tracker</span>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <Link href="/login" className="landing-btn landing-btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1>Protect Your Creative Rights. Track Every Dollar.</h1>
          <p>
            The complete platform for managing creative rights, automating revenue splits, and securing payments with blockchain technology. Built for creators, by creators.
          </p>
          <div className="landing-hero-buttons">
            <Link href="/signup" className="landing-btn landing-btn-white">
              Start Free Trial
            </Link>
            <a href="#how-it-works" className="landing-btn landing-btn-secondary">
              Watch Demo
            </a>
          </div>
          <div className="landing-trust-badges">
            <p>Trusted by creative professionals worldwide</p>
            <div className="landing-badges">
              <span className="landing-badge">🔒 Blockchain Secured</span>
              <span className="landing-badge">⚡ Instant Payments</span>
              <span className="landing-badge">📊 Real-time Analytics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="landing-stats">
        <div className="landing-stats-container">
          <div className="landing-stat">
            <div className="landing-stat-number">$2.4M+</div>
            <div className="landing-stat-label">Revenue Tracked</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-number">500+</div>
            <div className="landing-stat-label">Active Projects</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-number">1,200+</div>
            <div className="landing-stat-label">Creators Protected</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-number">99.9%</div>
            <div className="landing-stat-label">Payment Accuracy</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-section" id="features">
        <div className="landing-section-header">
          <h2>Everything You Need to Manage Creative Rights</h2>
          <p>Comprehensive tools designed specifically for creative professionals</p>
        </div>
        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon">⚖️</div>
            <h3>Rights Management</h3>
            <p>
              Track ownership, licensing, and distribution rights across all your projects. Get alerts before rights expire and maintain complete control over your intellectual property.
            </p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">💸</div>
            <h3>Revenue Tracking</h3>
            <p>
              Monitor all revenue streams in real-time. From streaming royalties to licensing fees, see exactly where your money comes from and when it arrives.
            </p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">🤝</div>
            <h3>Automatic Payment Splits</h3>
            <p>
              Set up revenue sharing agreements once and let smart contracts handle the rest. Payments are automatically distributed to all contributors based on their share.
            </p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">🔗</div>
            <h3>Smart Contract Integration</h3>
            <p>
              Deploy and manage smart contracts directly from the platform. Interact with Ethereum, Polygon, and other blockchain networks with no coding required.
            </p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">📊</div>
            <h3>Advanced Analytics</h3>
            <p>
              Visualize your revenue trends, project performance, and contributor breakdowns. Generate detailed PDF reports for stakeholders and tax purposes.
            </p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">🔔</div>
            <h3>Smart Notifications</h3>
            <p>
              Never miss important deadlines. Get alerts for expiring rights, pending payments, milestone due dates, and new revenue deposits.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-section landing-how-it-works" id="how-it-works">
        <div className="landing-section-header">
          <h2>Get Started in Minutes</h2>
          <p>Simple setup, powerful results</p>
        </div>
        <div className="landing-steps">
          <div className="landing-step">
            <div className="landing-step-number">1</div>
            <h3>Create Your Project</h3>
            <p>
              Add your creative project and define the rights structure. Include all contributors and their roles.
            </p>
          </div>
          <div className="landing-step">
            <div className="landing-step-number">2</div>
            <h3>Set Revenue Shares</h3>
            <p>
              Define how revenue should be split among contributors. Our platform ensures everyone gets their fair share.
            </p>
          </div>
          <div className="landing-step">
            <div className="landing-step-number">3</div>
            <h3>Deploy Smart Contracts</h3>
            <p>
              Optional: Deploy your revenue agreement to the blockchain for immutable, automated payment distribution.
            </p>
          </div>
          <div className="landing-step">
            <div className="landing-step-number">4</div>
            <h3>Track & Get Paid</h3>
            <p>
              Monitor revenue in real-time and receive automatic payments as money comes in. It&apos;s that simple.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="landing-section">
        <div className="landing-section-header">
          <h2>Built for Creative Professionals</h2>
          <p>No matter your industry, we&apos;ve got you covered</p>
        </div>
        <div className="landing-use-cases-grid">
          <div className="landing-use-case">
            <h3>🎵 Musicians & Producers</h3>
            <ul>
              <li>Track streaming royalties</li>
              <li>Manage sync licensing</li>
              <li>Split producer credits</li>
              <li>Monitor mechanical rights</li>
            </ul>
          </div>
          <div className="landing-use-case">
            <h3>🎬 Filmmakers</h3>
            <ul>
              <li>Distribution agreements</li>
              <li>Festival prize tracking</li>
              <li>Crew payment splits</li>
              <li>Rights management</li>
            </ul>
          </div>
          <div className="landing-use-case">
            <h3>🎨 Designers & Artists</h3>
            <ul>
              <li>Licensing revenue</li>
              <li>Commission tracking</li>
              <li>Collaborative projects</li>
              <li>Usage rights control</li>
            </ul>
          </div>
          <div className="landing-use-case">
            <h3>📸 Photographers</h3>
            <ul>
              <li>Stock photo royalties</li>
              <li>Commercial licensing</li>
              <li>Print sales tracking</li>
              <li>Usage monitoring</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="landing-section landing-pricing-section" id="pricing">
        <div className="landing-section-header">
          <h2>Simple, Transparent Pricing</h2>
          <p>Choose the plan that fits your needs</p>
        </div>
        <div className="landing-pricing-grid">
          <div className="landing-pricing-card">
            <h3>Starter</h3>
            <div className="landing-pricing-price">$29</div>
            <div className="landing-pricing-period">per month</div>
            <ul className="landing-pricing-features">
              <li>✓ Up to 5 projects</li>
              <li>✓ Unlimited contributors</li>
              <li>✓ Revenue tracking</li>
              <li>✓ Payment splitting</li>
              <li>✓ Basic analytics</li>
              <li>✓ Email support</li>
            </ul>
            <Link href="/signup" className="landing-btn landing-btn-secondary">
              Get Started
            </Link>
          </div>
          <div className="landing-pricing-card landing-featured">
            <div className="landing-pricing-badge">Most Popular</div>
            <h3>Professional</h3>
            <div className="landing-pricing-price">$79</div>
            <div className="landing-pricing-period">per month</div>
            <ul className="landing-pricing-features">
              <li>✓ Unlimited projects</li>
              <li>✓ Unlimited contributors</li>
              <li>✓ Smart contract deployment</li>
              <li>✓ Advanced analytics</li>
              <li>✓ PDF report generation</li>
              <li>✓ Priority support</li>
              <li>✓ API access</li>
            </ul>
            <Link href="/signup" className="landing-btn landing-btn-primary">
              Get Started
            </Link>
          </div>
          <div className="landing-pricing-card">
            <h3>Enterprise</h3>
            <div className="landing-pricing-price">Custom</div>
            <div className="landing-pricing-period">contact us</div>
            <ul className="landing-pricing-features">
              <li>✓ Everything in Professional</li>
              <li>✓ Custom smart contracts</li>
              <li>✓ White-label options</li>
              <li>✓ Dedicated account manager</li>
              <li>✓ Custom integrations</li>
              <li>✓ SLA guarantees</li>
              <li>✓ On-premise deployment</li>
            </ul>
            <a href="#contact" className="landing-btn landing-btn-secondary">
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <h2>Ready to Take Control of Your Creative Rights?</h2>
        <p>
          Join thousands of creators who trust RISIDIO to protect their work and maximize their revenue.
        </p>
        <Link href="/signup" className="landing-btn landing-btn-white">
          Start Your Free Trial
        </Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="landing-footer-section">
            <h4>
              Revenue <span style={{ color: '#5bb5c1' }}>Tracker</span>
            </h4>
            <p>
              Empowering creators with blockchain-powered rights management and revenue tracking.
            </p>
          </div>
          <div className="landing-footer-section">
            <h4>Product</h4>
            <ul>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <a href="#how-it-works">Use Cases</a>
              </li>
              <li>
                <a href="#integrations">Integrations</a>
              </li>
            </ul>
          </div>
          <div className="landing-footer-section">
            <h4>Resources</h4>
            <ul>
              <li>
                <a href="#docs">Documentation</a>
              </li>
              <li>
                <a href="#api">API Reference</a>
              </li>
              <li>
                <a href="#blog">Blog</a>
              </li>
              <li>
                <a href="#support">Support</a>
              </li>
            </ul>
          </div>
          <div className="landing-footer-section">
            <h4>Company</h4>
            <ul>
              <li>
                <a href="#about">About Us</a>
              </li>
              <li>
                <a href="#careers">Careers</a>
              </li>
              <li>
                <a href="#privacy">Privacy Policy</a>
              </li>
              <li>
                <a href="#terms">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <p>&copy; 2024 RISIDIO Group. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
