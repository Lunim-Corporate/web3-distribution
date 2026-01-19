"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function LandingPage() {
    const { user } = useAuth();
    const startHref = user ? "/dashboard" : "/login";

    return (
        <div>
            <nav>
                <div className="nav-container">
                    <div className="logo">
                        Revenue <span style={{ color: "#5bb5c1" }}>Tracker</span>
                    </div>
                    <div className="nav-links">
                        <Link href="#features">Features</Link>
                        <Link href="#how-it-works">How It Works</Link>
                        <Link href="#pricing">Pricing</Link>
                        <Link href={startHref} className="btn btn-primary">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            <section className="hero">
                <div className="hero-content">
                    <h1>Protect Your Creative Rights. Track Every Dollar.</h1>
                    <p>
                        The complete platform for managing creative rights, automating revenue splits, and securing
                        payments with blockchain technology. Built for creators, by creators.
                    </p>
                    <div className="hero-buttons">
                        <Link href={startHref} className="btn btn-white">
                            Start Free Trial
                        </Link>
                        <a href="#" className="btn btn-secondary">
                            Watch Demo
                        </a>
                    </div>
                    <div className="trust-badges">
                        <p>Trusted by creative professionals worldwide</p>
                        <div className="badges">
                            <span className="badge">🔒 Blockchain Secured</span>
                            <span className="badge">⚡ Instant Payments</span>
                            <span className="badge">📊 Real-time Analytics</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="stats">
                <div className="stats-container">
                    <div className="stat">
                        <div className="stat-number">$2.4M+</div>
                        <div className="stat-label">Revenue Tracked</div>
                    </div>
                    <div className="stat">
                        <div className="stat-number">500+</div>
                        <div className="stat-label">Active Projects</div>
                    </div>
                    <div className="stat">
                        <div className="stat-number">1,200+</div>
                        <div className="stat-label">Creators Protected</div>
                    </div>
                    <div className="stat">
                        <div className="stat-number">99.9%</div>
                        <div className="stat-label">Payment Accuracy</div>
                    </div>
                </div>
            </section>

            <section className="section" id="features">
                <div className="section-header">
                    <h2>Everything You Need to Manage Creative Rights</h2>
                    <p>Comprehensive tools designed specifically for creative professionals</p>
                </div>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">⚖️</div>
                        <h3>Rights Management</h3>
                        <p>
                            Track ownership, licensing, and distribution rights across all your projects. Get alerts
                            before rights expire and maintain complete control over your intellectual property.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">💸</div>
                        <h3>Revenue Tracking</h3>
                        <p>
                            Monitor all revenue streams in real-time. From streaming royalties to licensing fees, see
                            exactly where your money comes from and when it arrives.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🤝</div>
                        <h3>Automatic Payment Splits</h3>
                        <p>
                            Set up revenue sharing agreements once and let smart contracts handle the rest. Payments
                            are automatically distributed to all contributors based on their share.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔗</div>
                        <h3>Smart Contract Integration</h3>
                        <p>
                            Deploy and manage smart contracts directly from the platform. Interact with Ethereum,
                            Polygon, and other blockchain networks with no coding required.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Advanced Analytics</h3>
                        <p>
                            Visualize your revenue trends, project performance, and contributor breakdowns. Generate
                            detailed PDF reports for stakeholders and tax purposes.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔔</div>
                        <h3>Smart Notifications</h3>
                        <p>
                            Never miss important deadlines. Get alerts for expiring rights, pending payments, milestone
                            due dates, and new revenue deposits.
                        </p>
                    </div>
                </div>
            </section>

            <section className="section how-it-works" id="how-it-works">
                <div className="section-header">
                    <h2>Get Started in Minutes</h2>
                    <p>Simple setup, powerful results</p>
                </div>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>Create Your Project</h3>
                        <p>
                            Add your creative project and define the rights structure. Include all contributors and
                            their roles.
                        </p>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>Set Revenue Shares</h3>
                        <p>
                            Define how revenue should be split among contributors. Our platform ensures everyone gets
                            their fair share.
                        </p>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>Deploy Smart Contracts</h3>
                        <p>
                            Optional: Deploy your revenue agreement to the blockchain for immutable, automated payment
                            distribution.
                        </p>
                    </div>
                    <div className="step">
                        <div className="step-number">4</div>
                        <h3>Track &amp; Get Paid</h3>
                        <p>
                            Monitor revenue in real-time and receive automatic payments as money comes in. It&apos;s
                            that simple.
                        </p>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="section-header">
                    <h2>Built for Creative Professionals</h2>
                    <p>No matter your industry, we&apos;ve got you covered</p>
                </div>
                <div className="use-cases-grid">
                    <div className="use-case">
                        <h3>🎵 Musicians &amp; Producers</h3>
                        <ul>
                            <li>Track streaming royalties</li>
                            <li>Manage sync licensing</li>
                            <li>Split producer credits</li>
                            <li>Monitor mechanical rights</li>
                        </ul>
                    </div>
                    <div className="use-case">
                        <h3>🎬 Filmmakers</h3>
                        <ul>
                            <li>Distribution agreements</li>
                            <li>Festival prize tracking</li>
                            <li>Crew payment splits</li>
                            <li>Rights management</li>
                        </ul>
                    </div>
                    <div className="use-case">
                        <h3>🎨 Designers &amp; Artists</h3>
                        <ul>
                            <li>Licensing revenue</li>
                            <li>Commission tracking</li>
                            <li>Collaborative projects</li>
                            <li>Usage rights control</li>
                        </ul>
                    </div>
                    <div className="use-case">
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

            <section className="section pricing-section" id="pricing">
                <div className="section-header">
                    <h2>Simple, Transparent Pricing</h2>
                    <p>Choose the plan that fits your needs</p>
                </div>
                <div className="pricing-grid">
                    <div className="pricing-card">
                        <h3>Starter</h3>
                        <div className="pricing-price">$29</div>
                        <div className="pricing-period">per month</div>
                        <ul className="pricing-features">
                            <li>✓ Up to 5 projects</li>
                            <li>✓ Unlimited contributors</li>
                            <li>✓ Revenue tracking</li>
                            <li>✓ Payment splitting</li>
                            <li>✓ Basic analytics</li>
                            <li>✓ Email support</li>
                        </ul>
                        <Link href={startHref} className="btn btn-secondary">
                            Get Started
                        </Link>
                    </div>
                    <div className="pricing-card featured">
                        <div className="pricing-badge">Most Popular</div>
                        <h3>Professional</h3>
                        <div className="pricing-price">$79</div>
                        <div className="pricing-period">per month</div>
                        <ul className="pricing-features">
                            <li>✓ Unlimited projects</li>
                            <li>✓ Unlimited contributors</li>
                            <li>✓ Smart contract deployment</li>
                            <li>✓ Advanced analytics</li>
                            <li>✓ PDF report generation</li>
                            <li>✓ Priority support</li>
                            <li>✓ API access</li>
                        </ul>
                        <Link href={startHref} className="btn btn-primary">
                            Get Started
                        </Link>
                    </div>
                    <div className="pricing-card">
                        <h3>Enterprise</h3>
                        <div className="pricing-price">Custom</div>
                        <div className="pricing-period">contact us</div>
                        <ul className="pricing-features">
                            <li>✓ Everything in Professional</li>
                            <li>✓ Custom smart contracts</li>
                            <li>✓ White-label options</li>
                            <li>✓ Dedicated account manager</li>
                            <li>✓ Custom integrations</li>
                            <li>✓ SLA guarantees</li>
                            <li>✓ On-premise deployment</li>
                        </ul>
                        <a href="#" className="btn btn-secondary">
                            Contact Sales
                        </a>
                    </div>
                </div>
            </section>

            <section className="cta">
                <h2>Ready to Take Control of Your Creative Rights?</h2>
                <p>
                    Join thousands of creators who trust RISIDIO to protect their work and maximize their revenue.
                </p>
                <Link href={startHref} className="btn btn-white">
                    Start Your Free Trial
                </Link>
            </section>

            <footer>
                <div className="footer-container">
                    <div className="footer-section">
                        <h4>
                            Revenue <span style={{ color: "#5bb5c1" }}>Tracker</span>
                        </h4>
                        <p style={{ color: "rgba(255, 255, 255, 0.7)", marginTop: "1rem" }}>
                            Empowering creators with blockchain-powered rights management and revenue tracking.
                        </p>
                    </div>
                    <div className="footer-section">
                        <h4>Product</h4>
                        <ul>
                            <li>
                                <a href="#">Features</a>
                            </li>
                            <li>
                                <a href="#">Pricing</a>
                            </li>
                            <li>
                                <a href="#">Use Cases</a>
                            </li>
                            <li>
                                <a href="#">Integrations</a>
                            </li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Resources</h4>
                        <ul>
                            <li>
                                <a href="#">Documentation</a>
                            </li>
                            <li>
                                <a href="#">API Reference</a>
                            </li>
                            <li>
                                <a href="#">Blog</a>
                            </li>
                            <li>
                                <a href="#">Support</a>
                            </li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Company</h4>
                        <ul>
                            <li>
                                <a href="#">About Us</a>
                            </li>
                            <li>
                                <a href="#">Careers</a>
                            </li>
                            <li>
                                <a href="#">Privacy Policy</a>
                            </li>
                            <li>
                                <a href="#">Terms of Service</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 RISIDIO Group. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
