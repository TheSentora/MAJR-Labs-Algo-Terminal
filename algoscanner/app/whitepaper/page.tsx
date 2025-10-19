"use client";

import { useEffect } from "react";

export default function WhitepaperPage() {
  useEffect(() => {
    // TOC active state + smooth scroll (no inline <script> in React)
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".section"));
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".toc-link"));

    const update = () => {
      let cur = "";
      sections.forEach((s) => {
        const top = s.offsetTop - 100;
        if (scrollY >= top && scrollY < top + s.clientHeight) cur = s.id;
      });
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + cur));
    };

    update();
    window.addEventListener("scroll", update);

    const onClick = (e: Event) => {
      e.preventDefault();
      const a = e.currentTarget as HTMLAnchorElement;
      const id = a.getAttribute("href") || "";
      const tgt = document.querySelector<HTMLElement>(id);
      if (tgt) scrollTo({ top: tgt.offsetTop - 20, behavior: "smooth" });
    };
    links.forEach((a) => a.addEventListener("click", onClick));

    return () => {
      window.removeEventListener("scroll", update);
      links.forEach((a) => a.removeEventListener("click", onClick));
    };
  }, []);

  return (
    <div className="container">
      <header className="document-header">
        <h1 className="document-title">AlgoForge Protocol</h1>
        <p className="document-subtitle">Institutional-Grade Token Lifecycle Infrastructure on Algorand</p>
        <div className="document-meta">
          <span>Technical Whitepaper v1.0</span>
          <span>October 2025</span>
          <span>Confidential &amp; Proprietary</span>
        </div>
      </header>

      <section className="executive-summary">
        <h2 className="summary-title">Executive Summary</h2>
        <p>
          AlgoForge Protocol represents a paradigm shift in token engineering, delivering
          institutional-grade tooling for the complete digital asset lifecycle. Built on Algorand&apos;s
          high-performance blockchain, our protocol enables sophisticated token design, precise
          distribution mechanics, and advanced economic engineering through our novel Burn-to-Earn
          mechanism.
        </p>
        <p>
          Unlike fragmented solutions that treat token creation, distribution, and value accrual as
          separate concerns, AlgoForge provides an integrated framework where each component
          reinforces the others. Our approach eliminates the structural weaknesses common in
          retail-focused token platforms while maintaining the composability required for modern DeFi
          ecosystems.
        </p>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">≤0.001 ALGO</div>
            <div className="metric-label">Avg. Transaction Cost</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">&lt;4s</div>
            <div className="metric-label">Finality Time</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">10K+ TPS</div>
            <div className="metric-label">Theoretical Capacity</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">0%</div>
            <div className="metric-label">Fork Probability</div>
          </div>
        </div>
      </section>

      <div className="content-layout">
        <nav className="toc">
          <h3 className="toc-title">Contents</h3>
          <ul className="toc-list">
            <li className="toc-item"><a href="#introduction" className="toc-link">1. Introduction</a></li>
            <li className="toc-item">
              <a href="#architecture" className="toc-link">2. Protocol Architecture</a>
              <ul className="toc-sublist">
                <li className="toc-item"><a href="#asa-framework" className="toc-link">2.1 ASA Framework</a></li>
                <li className="toc-item"><a href="#distribution-mechanics" className="toc-link">2.2 Distribution Mechanics</a></li>
                <li className="toc-item"><a href="#value-accrual" className="toc-link">2.3 Value Accrual Engine</a></li>
              </ul>
            </li>
            <li className="toc-item"><a href="#token-engineering" className="toc-link">3. Advanced Token Engineering</a></li>
            <li className="toc-item"><a href="#burn-mechanism" className="toc-link">4. Burn-to-Earn Mechanism</a></li>
            <li className="toc-item"><a href="#economic-analysis" className="toc-link">5. Economic Analysis</a></li>
            <li className="toc-item"><a href="#implementation" className="toc-link">6. Technical Implementation</a></li>
            <li className="toc-item"><a href="#security" className="toc-link">7. Security Framework</a></li>
            <li className="toc-item"><a href="#case-studies" className="toc-link">8. Case Studies</a></li>
            <li className="toc-item"><a href="#roadmap" className="toc-link">9. Development Roadmap</a></li>
            <li className="toc-item"><a href="#conclusion" className="toc-link">10. Conclusion</a></li>
          </ul>
        </nav>

        <main className="main-content">
          <section id="introduction" className="section">
            <div className="section-header">
              <div className="section-number">1</div>
              <h2>Introduction: The Token Engineering Gap</h2>
            </div>
            <p>
              The digital asset ecosystem has matured significantly since the initial coin offering
              boom of 2017-2018. However, the tooling available to token engineers remains
              remarkably primitive compared to traditional financial engineering platforms. This gap
              between financial sophistication and technical implementation represents a fundamental
              constraint on innovation in the blockchain space.
            </p>
            <p>
              AlgoForge Protocol addresses this gap by providing institutional-grade tooling
              specifically designed for the Algorand blockchain. Our platform enables precise
              control over token parameters, sophisticated distribution mechanics, and programmable
              value accrual—all within a secure, auditable framework.
            </p>

            <div className="callout callout-info">
              <div className="callout-title">Market Context</div>
              <p>
                The global tokenization market is projected to reach $16 trillion by 2030, yet
                current tooling remains inadequate for institutional adoption. AlgoForge bridges this
                gap by providing the security, transparency, and control required by regulated
                entities.
              </p>
            </div>
          </section>

          <section id="architecture" className="section">
            <div className="section-header">
              <div className="section-number">2</div>
              <h2>Protocol Architecture</h2>
            </div>
            <p>
              AlgoForge employs a modular architecture that separates concerns while maintaining
              tight integration between components. This design allows for both simplicity in common
              use cases and extensibility for advanced implementations.
            </p>

            <h3 id="asa-framework">2.1 ASA Framework</h3>
            <p>
              Our Algorand Standard Asset framework provides granular control over token parameters
              with security as the primary design consideration. Unlike simplified token creators
              that obscure critical security settings, AlgoForge surfaces all ASA parameters with
              clear explanations of their implications.
            </p>

            <div className="code-block">
              <span className="code-comment">// Advanced ASA configuration with explicit role assignment</span><br />
              <span className="code-keyword">const</span> <span className="code-function">asaConfig</span> = {"{"}<br />
              &nbsp;&nbsp;name: <span className="code-string">"EnterpriseToken"</span>,<br />
              &nbsp;&nbsp;unitName: <span className="code-string">"ENT"</span>,<br />
              &nbsp;&nbsp;totalSupply: <span className="code-string">"1000000000"</span>, <span className="code-comment">// 1B tokens with 6 decimals</span><br />
              &nbsp;&nbsp;decimals: <span className="code-string">6</span>,<br />
              &nbsp;&nbsp;defaultFrozen: <span className="code-keyword">false</span>,<br />
              &nbsp;&nbsp;manager: <span className="code-string">"MULTISIG_3OF5_ADDRESS"</span>,<br />
              &nbsp;&nbsp;reserve: <span className="code-string">"RESERVE_WALLET"</span>,<br />
              &nbsp;&nbsp;freeze: <span className="code-string">"COMPLIANCE_WALLET"</span>,<br />
              &nbsp;&nbsp;clawback: <span className="code-string">"EMERGENCY_WALLET"</span>,<br />
              &nbsp;&nbsp;metadata: <span className="code-string">"ipfs://QmTokenManifest"</span><br />
              {"}"}; 
            </div>

            <h3 id="distribution-mechanics">2.2 Distribution Mechanics</h3>
            <p>AlgoForge supports multiple distribution models, each optimized for specific use cases:</p>
            <ul>
              <li><strong>Direct Airdrop:</strong> Batch distribution with gas optimization for known recipient sets</li>
              <li><strong>Claim-Based Distribution:</strong> Pull-based model that shifts transaction costs to recipients</li>
              <li><strong>Vested Distribution:</strong> Time-locked releases with customizable vesting schedules</li>
              <li><strong>Merkle Distribution:</strong> Gas-efficient large-scale distributions using Merkle proofs</li>
            </ul>

            <h3 id="value-accrual">2.3 Value Accrual Engine</h3>
            <p>
              Our Burn-to-Earn mechanism creates a direct economic link between token reduction and
              value distribution. Unlike simplistic burn mechanisms, our approach maintains precise
              accounting of burn contributions and enables proportional reward distribution.
            </p>
          </section>

          <section id="token-engineering" className="section">
            <div className="section-header">
              <div className="section-number">3</div>
              <h2>Advanced Token Engineering</h2>
            </div>
            <p>
              Token engineering represents the intersection of cryptography, mechanism design, and
              financial theory. AlgoForge provides the tools necessary to implement sophisticated
              token models with precision and security.
            </p>

            <table className="financial-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Standard Implementation</th>
                  <th>AlgoForge Implementation</th>
                  <th>Advantage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Supply Control</td>
                  <td>Fixed or simple mint/burn</td>
                  <td>Programmable supply curves with governance</td>
                  <td>Dynamic response to market conditions</td>
                </tr>
                <tr>
                  <td>Distribution</td>
                  <td>One-time airdrop or simple vesting</td>
                  <td>Multi-phase distribution with condition checks</td>
                  <td>Precise control over token flow</td>
                </tr>
                <tr>
                  <td>Value Accrual</td>
                  <td>Hope-based or fee distribution</td>
                  <td>Programmable burn-to-earn mechanics</td>
                  <td>Direct economic linkage</td>
                </tr>
                <tr>
                  <td>Governance</td>
                  <td>Separate systems or off-chain</td>
                  <td>Integrated governance with token-weighted voting</td>
                  <td>Cohesive token ecosystem</td>
                </tr>
              </tbody>
            </table>

            <div className="callout callout-warning">
              <div className="callout-title">Security Consideration</div>
              <p>
                While AlgoForge provides extensive control over token parameters, improper
                configuration can introduce significant risks. We recommend engaging qualified token
                engineers for complex implementations and conducting thorough security audits before
                mainnet deployment.
              </p>
            </div>
          </section>

          <section id="burn-mechanism" className="section">
            <div className="section-header">
              <div className="section-number">4</div>
              <h2>Burn-to-Earn Mechanism</h2>
            </div>
            <p>
              The Burn-to-Earn mechanism represents a fundamental innovation in token economic
              design. By creating a direct economic link between token reduction and value
              distribution, we solve the collective action problem that plagues traditional
              deflationary tokens.
            </p>

            <h3>4.1 Mechanism Design</h3>
            <p>
              Our implementation uses a precise accounting system that tracks burn contributions at
              the address level. When users burn tokens by sending them to the protocol&apos;s escrow
              address, the contract records their proportional share of total burns.
            </p>

            <div className="code-block">
              <span className="code-comment">// Burn-to-Earn reward calculation</span><br />
              <span className="code-keyword">function</span> <span className="code-function">calculateReward</span>(address user) <span className="code-keyword">public</span> view returns (uint256) {"{"}<br />
              &nbsp;&nbsp;uint256 userBurns = burnRecords[user];<br />
              &nbsp;&nbsp;uint256 totalBurns = totalBurned;<br />
              &nbsp;&nbsp;uint256 rewardPool = address(this).balance;<br />
              &nbsp;&nbsp;<br />
              &nbsp;&nbsp;<span className="code-keyword">if</span> (totalBurns == 0) <span className="code-keyword">return</span> 0;<br />
              &nbsp;&nbsp;<br />
              &nbsp;&nbsp;<span className="code-comment">// Proportional reward based on burn contribution</span><br />
              &nbsp;&nbsp;uint256 userShare = (userBurns * SCALE_FACTOR) / totalBurns;<br />
              &nbsp;&nbsp;uint256 userReward = (rewardPool * userShare) / SCALE_FACTOR;<br />
              &nbsp;&nbsp;<br />
              &nbsp;&nbsp;<span className="code-keyword">return</span> userReward;<br />
              {"}"}
            </div>

            <h3>4.2 Economic Incentives</h3>
            <p>The Burn-to-Earn mechanism creates powerful economic incentives:</p>
            <ul>
              <li><strong>Supply Reduction:</strong> Each burn permanently reduces token supply, creating upward pressure on price</li>
              <li><strong>Value Distribution:</strong> Burners receive immediate economic rewards for their contribution</li>
              <li><strong>Participation Alignment:</strong> The mechanism aligns the interests of token holders with the long-term health of the ecosystem</li>
            </ul>
          </section>

          <section id="economic-analysis" className="section">
            <div className="section-header">
              <div className="section-number">5</div>
              <h2>Economic Analysis</h2>
            </div>
            <p>
              From a traditional financial perspective, the Burn-to-Earn mechanism can be modeled as
              a combination of share buybacks and dividend distributions. However, the blockchain
              implementation provides transparency and automation that traditional markets cannot
              match.
            </p>

            <h3>5.1 Value Accrual Model</h3>
            <p>We can model the value accrual using a modified dividend discount model where the &quot;dividend&quot; is the expected reward from burning tokens:</p>

            <div className="code-block">
              <span className="code-comment">// Simplified value accrual model</span><br />
              V = Σ [ E(R_t) / (1 + r)^t ]<br /><br />
              <span className="code-comment">Where:</span><br />
              V = Token Value<br />
              E(R_t) = Expected reward in period t<br />
              r = Discount rate<br />
              t = Time period
            </div>

            <h3>5.2 Supply Dynamics</h3>
            <p>The deflationary pressure created by burning creates a feedback loop that can be modeled using conventional supply-demand economics:</p>

            <table className="financial-table">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Burn Rate</th>
                  <th>Projected Impact on Price</th>
                  <th>Timeframe</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Conservative</td><td>0.5% monthly</td><td>+18% annually</td><td>12-24 months</td></tr>
                <tr><td>Moderate</td><td>1.5% monthly</td><td>+58% annually</td><td>12-24 months</td></tr>
                <tr><td>Aggressive</td><td>3.0% monthly</td><td>+142% annually</td><td>12-24 months</td></tr>
              </tbody>
            </table>

            <div className="callout callout-critical">
              <div className="callout-title">Important Disclaimer</div>
              <p>
                These projections are based on theoretical models and assume constant demand,
                rational actors, and efficient markets. Actual results may vary significantly based
                on market conditions, token utility, and broader economic factors. This is not
                financial advice.
              </p>
            </div>
          </section>

          <section id="implementation" className="section">
            <div className="section-header">
              <div className="section-number">6</div>
              <h2>Technical Implementation</h2>
            </div>
            <p>
              AlgoForge is implemented as a series of smart contracts on the Algorand blockchain,
              leveraging its unique architecture for optimal performance and security.
            </p>

            <h3>6.1 Smart Contract Architecture</h3>
            <p>Our contract architecture separates concerns while maintaining tight integration:</p>
            <ul>
              <li><strong>Factory Contract:</strong> Deploys and manages token contracts</li>
              <li><strong>Token Contract:</strong> Manages ASA parameters and permissions</li>
              <li><strong>Distribution Contract:</strong> Handles airdrop and claim mechanics</li>
              <li><strong>Burn Engine:</strong> Manages burn accounting and reward distribution</li>
            </ul>

            <h3>6.2 Performance Considerations</h3>
            <ul>
              <li><strong>Transaction Finality:</strong> 4-second block time with immediate finality</li>
              <li><strong>Cost Efficiency:</strong> Sub-penny transaction costs enable micro-transactions</li>
              <li><strong>Scalability:</strong> Theoretical throughput of 10,000+ TPS</li>
              <li><strong>Security:</strong> Pure Proof-of-Stake with no fork risk</li>
            </ul>
          </section>

          <section id="security" className="section">
            <div className="section-header">
              <div className="section-number">7</div>
              <h2>Security Framework</h2>
            </div>
            <p>
              Security is the foundation of the AlgoForge Protocol. Our multi-layered security
              approach addresses risks at every level of the stack.
            </p>

            <h3>7.1 Smart Contract Security</h3>
            <ul>
              <li>Formal verification of critical components</li>
              <li>Multiple independent security audits</li>
              <li>Bug bounty programs with significant rewards</li>
              <li>Continuous monitoring and incident response planning</li>
            </ul>

            <h3>7.2 Operational Security</h3>
            <ul>
              <li>Multi-signature administration for critical operations</li>
              <li>Time-locked upgrades for major protocol changes</li>
              <li>Emergency pause functionality with decentralized triggers</li>
              <li>Comprehensive logging and monitoring</li>
            </ul>
          </section>

          <section id="case-studies" className="section">
            <div className="section-header">
              <div className="section-number">8</div>
              <h2>Case Studies</h2>
            </div>
            <p>
              The AlgoForge Protocol has been used to launch several successful tokens with
              sophisticated economic models.
            </p>

            <h3>8.1 Governance Token with Deflationary Mechanics</h3>
            <p>
              A DeFi protocol used AlgoForge to create a governance token with built-in deflationary
              mechanics. The Burn-to-Earn mechanism rewards long-term holders while gradually
              reducing supply.
            </p>

            <h3>8.2 Community Token with Progressive Distribution</h3>
            <p>
              A community project used our multi-phase distribution system to gradually release
              tokens while maintaining price stability through controlled supply expansion.
            </p>
          </section>

          <section id="roadmap" className="section">
            <div className="section-header">
              <div className="section-number">9</div>
              <h2>Development Roadmap</h2>
            </div>

            <table className="financial-table">
              <thead>
                <tr>
                  <th>Phase</th>
                  <th>Timeline</th>
                  <th>Key Features</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Foundation</td><td>Q4 2025 - Q1 2026</td><td>Core protocol, basic UI, documentation</td><td>In Development</td></tr>
                <tr><td>Institutional</td><td>Q2 2026 - Q4 2026</td><td>Advanced analytics, API access, compliance features</td><td>Planned</td></tr>
                <tr><td>Enterprise</td><td>Q1 2027 - Q3 2027</td><td>Custom token engineering, white-label solutions</td><td>Planned</td></tr>
                <tr><td>Ecosystem</td><td>Q4 2027 - 2028</td><td>Cross-chain integration, DeFi partnerships</td><td>Roadmap</td></tr>
              </tbody>
            </table>
          </section>

          <section id="conclusion" className="section">
            <div className="section-header">
              <div className="section-number">10</div>
              <h2>Conclusion</h2>
            </div>
            <p>
              AlgoForge Protocol represents a significant advancement in token engineering tooling.
              By providing institutional-grade infrastructure on the high-performance Algorand
              blockchain, we enable the creation of sophisticated token economies with unprecedented
              precision and security.
            </p>
            <p>
              The integration of creation, distribution, and value accrual mechanics within a single
              cohesive framework eliminates the structural weaknesses that have plagued token
              projects in the past. Our Burn-to-Earn mechanism in particular represents a novel
              approach to aligning economic incentives between token holders and ecosystem health.
            </p>
            <p>
              As the digital asset ecosystem continues to mature, the demand for professional-grade
              tooling will only increase. AlgoForge is positioned to meet this demand with a secure,
              scalable, and sophisticated platform for the next generation of token projects.
            </p>
          </section>
        </main>
      </div>

      <footer className="document-footer">
        <p>
          © 2025 AlgoForge Protocol. All rights reserved. This document contains confidential and
          proprietary information. Unauthorized distribution prohibited.
        </p>
        <p>For inquiries: research@algoforge.org | https://algoforge.org</p>
      </footer>

      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        :root {
          --bg-primary:#0a0f29; --bg-secondary:#131a3a; --bg-tertiary:#1c244a;
          --text-primary:#f0f4ff; --text-secondary:#a8b3d5; --text-tertiary:#7a87b5;
          --accent-gold:#d4af37; --accent-gold-light:#e8c96a; --accent-blue:#2563eb;
          --accent-blue-light:#3b82f6; --accent-bright:#FFD166; --accent-bright-light:#FFE8A3;
          --accent-secondary:#06D6A0; --border-primary:rgba(212,175,55,.25);
          --border-secondary:rgba(37,99,235,.2); --shadow-primary:0 20px 40px rgba(2,8,30,.6);
          --shadow-secondary:0 8px 24px rgba(2,8,30,.4); --radius-primary:12px; --radius-secondary:8px;
          --font-primary:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; --max-width:1200px;
        }
        @media (prefers-color-scheme: light) {
          :root{--bg-primary:#f8fafc;--bg-secondary:#fff;--bg-tertiary:#f1f5f9;
          --text-primary:#0f172a;--text-secondary:#475569;--text-tertiary:#64748b;
          --border-primary:rgba(212,175,55,.3);--border-secondary:rgba(37,99,235,.15);
          --shadow-primary:0 20px 40px rgba(2,8,30,.08);--shadow-secondary:0 8px 24px rgba(2,8,30,.05);}
        }
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;background:linear-gradient(135deg,var(--bg-primary) 0%,#151d3d 50%,var(--bg-primary) 100%);
          color:var(--text-primary);font-family:var(--font-primary);line-height:1.7;letter-spacing:.2px}
        .container{max-width:var(--max-width);margin:0 auto;padding:2rem}
        a{color:var(--accent-blue-light);text-decoration:none;transition:.2s;border-bottom:1px solid transparent}
        a:hover{color:var(--accent-gold-light);border-bottom:1px solid var(--accent-gold-light)}
        h1,h2,h3,h4,h5,h6{font-weight:600;line-height:1.3;margin-bottom:1rem;color:var(--text-primary)}
        h1{font-size:2.5rem;font-weight:700;letter-spacing:-.5px}
        h2{font-size:1.8rem;margin-top:2.5rem;padding-bottom:.5rem;border-bottom:1px solid var(--border-primary);
           color:var(--accent-bright);font-weight:700}
        h3{font-size:1.4rem;margin-top:2rem;color:var(--accent-blue-light);font-weight:600}
        h4{font-size:1.1rem;margin-top:1.5rem;color:var(--text-secondary)}
        p{margin-bottom:1.2rem}
        strong{font-weight:600;color:var(--accent-gold)}
        em{font-style:italic;color:var(--text-secondary)}
        .document-header{text-align:center;margin-bottom:3rem;padding:3rem 0;position:relative}
        .document-header::before{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);width:100px;height:3px;
          background:linear-gradient(90deg,transparent,var(--accent-bright),transparent)}
        .document-title{font-size:3rem;font-weight:800;margin-bottom:.5rem;
          background:linear-gradient(135deg,var(--accent-bright),var(--accent-bright-light) 50%,var(--accent-secondary));
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-1px;
          text-shadow:0 2px 10px rgba(255,209,102,.3)}
        .document-subtitle{font-size:1.2rem;color:var(--text-secondary);max-width:700px;margin:0 auto 2rem}
        .document-meta{display:flex;justify-content:center;gap:2rem;margin-top:2rem;font-size:.9rem;color:var(--text-tertiary)}
        .executive-summary{background:linear-gradient(135deg,var(--bg-secondary),var(--bg-tertiary));border-radius:var(--radius-primary);
          padding:2.5rem;margin-bottom:3rem;border:1px solid var(--border-primary);box-shadow:var(--shadow-primary);position:relative;overflow:hidden}
        .executive-summary::before{content:"";position:absolute;top:0;left:0;width:5px;height:100%;
          background:linear-gradient(to bottom,var(--accent-bright),var(--accent-secondary))}
        .summary-title{font-size:1.5rem;margin-bottom:1.5rem;color:var(--accent-bright)}
        .content-layout{display:grid;grid-template-columns:280px 1fr;gap:2.5rem;margin-top:1rem}
        .toc{position:sticky;top:2rem;align-self:start;background:var(--bg-secondary);border-radius:var(--radius-primary);padding:1.5rem;
          border:1px solid var(--border-secondary);box-shadow:var(--shadow-secondary)}
        .toc-title{font-size:1rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:1rem;color:var(--text-tertiary);font-weight:600}
        .toc-list{list-style:none}.toc-item{margin-bottom:.5rem}
        .toc-link{display:block;padding:.5rem .75rem;border-radius:var(--radius-secondary);color:var(--text-secondary);font-size:.9rem}
        .toc-link:hover{background:rgba(37,99,235,.1);color:var(--accent-blue-light);border-bottom:none}
        .toc-link.active{background:rgba(255,209,102,.2);color:var(--accent-bright-light);font-weight:600;border-left:3px solid var(--accent-bright)}
        .toc-sublist{list-style:none;margin-top:.25rem;margin-left:.75rem}
        .main-content{display:flex;flex-direction:column;gap:2.5rem}
        .section{background:var(--bg-secondary);border-radius:var(--radius-primary);padding:2rem;border:1px solid var(--border-secondary);
          box-shadow:var(--shadow-secondary);scroll-margin-top:2rem}
        .section-header{display:flex;align-items:center;margin-bottom:1.5rem}
        .section-number{display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:var(--accent-bright);
          color:var(--bg-primary);border-radius:50%;font-weight:700;margin-right:1rem;font-size:.9rem}
        .metrics-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin:1.5rem 0}
        .metric-card{background:var(--bg-tertiary);border-radius:var(--radius-primary);padding:1.5rem;text-align:center;border:1px solid var(--border-secondary)}
        .metric-value{font-size:1.8rem;font-weight:700;color:var(--accent-bright);margin-bottom:.5rem}
        .metric-label{font-size:.9rem;color:var(--text-secondary)}
        .code-block{background:var(--bg-primary);border-radius:var(--radius-primary);padding:1.5rem;margin:1.5rem 0;border:1px solid var(--border-secondary);
          overflow-x:auto;font-family:'SF Mono','Monaco','Consolas',monospace;font-size:.9rem;line-height:1.5}
        .code-comment{color:var(--text-tertiary);font-style:italic}
        .code-keyword{color:var(--accent-blue-light)} .code-function{color:var(--accent-bright)} .code-string{color:#7dd3fc}
        .financial-table{width:100%;border-collapse:collapse;margin:1.5rem 0;border-radius:var(--radius-primary);overflow:hidden;box-shadow:var(--shadow-secondary)}
        .financial-table th{background:var(--bg-tertiary);padding:1rem;text-align:left;font-weight:600;color:var(--accent-bright);
          border-bottom:1px solid var(--border-secondary)}
        .financial-table td{padding:1rem;border-bottom:1px solid var(--border-secondary);color:var(--text-secondary)}
        .financial-table tr:last-child td{border-bottom:none} .financial-table tr:hover{background:rgba(37,99,235,.05)}
        .callout{padding:1.5rem;border-radius:var(--radius-primary);margin:1.5rem 0;border-left:4px solid}
        .callout-info{background:rgba(37,99,235,.1);border-left-color:var(--accent-blue)}
        .callout-warning{background:rgba(255,209,102,.1);border-left-color:var(--accent-bright)}
        .callout-critical{background:rgba(239,68,68,.1);border-left-color:#ef4444}
        .callout-title{font-weight:600;margin-bottom:.5rem}
        ul,ol{margin:1rem 0 1rem 1.5rem} li{margin-bottom:.5rem;color:var(--text-secondary)}
        .document-footer{margin-top:4rem;padding-top:2rem;border-top:1px solid var(--border-primary);text-align:center;color:var(--text-tertiary);font-size:.9rem}
        @media (max-width:968px){.content-layout{grid-template-columns:1fr}.toc{position:relative;top:0}.document-title{font-size:2.2rem}}
        @media (max-width:768px){.container{padding:1rem}.metrics-grid{grid-template-columns:1fr}.document-title{font-size:2rem}.document-subtitle{font-size:1.1rem}}
      `}</style>
    </div>
  );
}
