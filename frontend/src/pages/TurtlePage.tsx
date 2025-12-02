export default function TurtlePage() {
  return (
    <main className="section">
      {/* hero */}
      <div className="hero-section" style={{
        background: 'linear-gradient(135deg, #006d77 0%, #83c5be 100%)',
        padding: '4rem 2rem',
        textAlign: 'center',
        color: 'white',
        marginBottom: '3rem'
      }}>
        <h1 className="heading1" style={{ 
          fontSize: '3rem', 
          marginBottom: '1rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          Sea Turtle Research
        </h1>
        <p className="bodytext" style={{ 
          fontSize: '1.2rem',
          maxWidth: '800px',
          margin: '0 auto',
          color: 'rgba(255,255,255,0.95)'
        }}>
          Tracking and conserving Caribbean sea turtles through advanced research methods
        </p>
      </div>

      <div className="container">
        {/* target species */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 className="heading2" style={{
            fontSize: '2rem',
            marginBottom: '1rem',
            color: '#006d77',
            borderBottom: '3px solid #83c5be',
            paddingBottom: '0.5rem'
          }}>
            Target Species
          </h2>
          <p className="bodytext" style={{ 
            marginBottom: '2rem',
            fontSize: '1.1rem',
            lineHeight: '1.6'
          }}>
            Our research focuses on tracking adult sea turtles in the Caribbean, 
            specifically three species: Green Sea Turtles (Chelonia midas), 
            Hawksbill Sea Turtles (Eretmochelys imbricata), and Loggerhead Sea Turtles (Caretta).
          </p>

          {/* species cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginTop: '2rem'
          }}>
            
            {/* green sea turtle */}
            <div className="species-card" style={{
              background: 'linear-gradient(135deg, rgba(131, 197, 190, 0.1) 0%, rgba(0, 109, 119, 0.1) 100%)',
              border: '2px solid #83c5be',
              borderRadius: '12px',
              padding: '2rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 109, 119, 0.3)';
              e.currentTarget.style.borderColor = '#006d77';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#83c5be';
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#006d77',
                marginBottom: '0.5rem',
                fontWeight: 'bold'
              }}>
                Green Sea Turtle
              </h3>
              <p style={{
                fontStyle: 'italic',
                color: '#666',
                marginBottom: '1rem',
                fontSize: '0.95rem'
              }}>
                Chelonia midas
              </p>
              <div style={{
                height: '3px',
                background: 'linear-gradient(90deg, #83c5be 0%, #006d77 100%)',
                marginBottom: '1rem',
                borderRadius: '2px'
              }}></div>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                lineHeight: '1.8'
              }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  🐢 <strong>Size:</strong> Largest hard-shelled sea turtle
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  🌿 <strong>Diet:</strong> Herbivorous (seagrass & algae)
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  🌍 <strong>Habitat:</strong> Tropical & subtropical coastal waters globally
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  🧭 <strong>Navigation:</strong> Uses Earth's magnetic field for nesting beaches
                </li>
                <li style={{ 
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  background: 'rgba(131, 197, 190, 0.2)',
                  borderRadius: '6px',
                  marginTop: '1rem'
                }}>
                  ✅ <strong>Status:</strong> Moved from endangered to least concern
                </li>
              </ul>
            </div>

            {/* hawksbill sea turtle */}
            <div className="species-card" style={{
              background: 'linear-gradient(135deg, rgba(131, 197, 190, 0.1) 0%, rgba(0, 109, 119, 0.1) 100%)',
              border: '2px solid #83c5be',
              borderRadius: '12px',
              padding: '2rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 109, 119, 0.3)';
              e.currentTarget.style.borderColor = '#006d77';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#83c5be';
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#006d77',
                marginBottom: '0.5rem',
                fontWeight: 'bold'
              }}>
                Hawksbill Sea Turtle
              </h3>
              <p style={{
                fontStyle: 'italic',
                color: '#666',
                marginBottom: '1rem',
                fontSize: '0.95rem'
              }}>
                Eretmochelys imbricata
              </p>
              <div style={{
                height: '3px',
                background: 'linear-gradient(90deg, #83c5be 0%, #006d77 100%)',
                marginBottom: '1rem',
                borderRadius: '2px'
              }}></div>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                lineHeight: '1.8'
              }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  🐢 <strong>Beak:</strong> Narrow pointed beak for extracting sponges
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  🌿 <strong>Diet:</strong> Primarily sponges (omnivorous)
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  🐚 <strong>Shell:</strong> Distinctive beautiful patterns
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  🌎 <strong>Habitat:</strong> Coral reefs & rocky coastal areas
                </li>
                <li style={{ 
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  background: 'rgba(239, 71, 111, 0.1)',
                  borderRadius: '6px',
                  marginTop: '1rem',
                  color: '#c23b5a'
                }}>
                  ⚠️ <strong>Status:</strong> Endangered - habitat loss & fishing gear
                </li>
              </ul>
            </div>

            {/* loggerhead sea turtle */}
            <div className="species-card" style={{
              background: 'linear-gradient(135deg, rgba(131, 197, 190, 0.1) 0%, rgba(0, 109, 119, 0.1) 100%)',
              border: '2px solid #83c5be',
              borderRadius: '12px',
              padding: '2rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 109, 119, 0.3)';
              e.currentTarget.style.borderColor = '#006d77';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#83c5be';
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#006d77',
                marginBottom: '0.5rem',
                fontWeight: 'bold'
              }}>
                Loggerhead Sea Turtle
              </h3>
              <p style={{
                fontStyle: 'italic',
                color: '#666',
                marginBottom: '1rem',
                fontSize: '0.95rem'
              }}>
                Caretta caretta
              </p>
              <div style={{
                height: '3px',
                background: 'linear-gradient(90deg, #83c5be 0%, #006d77 100%)',
                marginBottom: '1rem',
                borderRadius: '2px'
              }}></div>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                lineHeight: '1.8'
              }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  🐢 <strong>Head:</strong> Oversized with powerful crushing jaws
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  🌿 <strong>Diet:</strong> Carnivorous (crabs & hard-shelled prey)
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  🗺️ <strong>Migration:</strong> Long distances between feeding & nesting
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  🌎 <strong>Habitat:</strong> Coral reefs, lagoons, shallow coastal waters
                </li>
                <li style={{ 
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  background: 'rgba(239, 71, 111, 0.1)',
                  borderRadius: '6px',
                  marginTop: '1rem',
                  color: '#c23b5a'
                }}>
                  ⚠️ <strong>Status:</strong> Endangered - fishing gear & harvesting
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* behaviour & bio */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 className="heading2" style={{
            fontSize: '2rem',
            marginBottom: '1rem',
            color: '#006d77',
            borderBottom: '3px solid #83c5be',
            paddingBottom: '0.5rem'
          }}>
            Behavior & Biology
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginTop: '2rem'
          }}>
            {/* migration */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 109, 119, 0.05) 0%, rgba(131, 197, 190, 0.05) 100%)',
              border: '2px solid rgba(131, 197, 190, 0.3)',
              borderRadius: '10px',
              padding: '1.5rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#83c5be';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 109, 119, 0.1) 0%, rgba(131, 197, 190, 0.1) 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(131, 197, 190, 0.3)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 109, 119, 0.05) 0%, rgba(131, 197, 190, 0.05) 100%)';
            }}>
              <h3 style={{ color: '#006d77', marginBottom: '0.75rem' }}>🗺️ Migration Patterns</h3>
              <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                All three species travel hundreds to thousands of miles between nesting beaches. 
                They use ocean currents for long-distance migrations to conserve energy, though juveniles 
                may swim against currents when needed.
              </p>
            </div>

            {/* breathing */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 109, 119, 0.05) 0%, rgba(131, 197, 190, 0.05) 100%)',
              border: '2px solid rgba(131, 197, 190, 0.3)',
              borderRadius: '10px',
              padding: '1.5rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#83c5be';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 109, 119, 0.1) 0%, rgba(131, 197, 190, 0.1) 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(131, 197, 190, 0.3)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 109, 119, 0.05) 0%, rgba(131, 197, 190, 0.05) 100%)';
            }}>
              <h3 style={{ color: '#006d77', marginBottom: '0.75rem' }}>💨 Breathing Patterns</h3>
              <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                <strong>Active:</strong> Surface every few minutes to half hour<br/>
                <strong>Resting:</strong> Can stay submerged up to 2 hours<br/>
                <strong>Hibernating:</strong> Up to 7 hours underwater (species-dependent)
              </p>
            </div>

            {/* natal homing */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 109, 119, 0.05) 0%, rgba(131, 197, 190, 0.05) 100%)',
              border: '2px solid rgba(131, 197, 190, 0.3)',
              borderRadius: '10px',
              padding: '1.5rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#83c5be';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 109, 119, 0.1) 0%, rgba(131, 197, 190, 0.1) 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(131, 197, 190, 0.3)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 109, 119, 0.05) 0%, rgba(131, 197, 190, 0.05) 100%)';
            }}>
              <h3 style={{ color: '#006d77', marginBottom: '0.75rem' }}>🌴 Natal Homing</h3>
              <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                Female sea turtles exhibit remarkable natal homing behavior, returning to the 
                general area of the beach where they were born to lay their own eggs after 
                reaching sexual maturity.
              </p>
            </div>
          </div>
        </section>

        {/* tracking technology */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 className="heading2" style={{
            fontSize: '2rem',
            marginBottom: '1rem',
            color: '#006d77',
            borderBottom: '3px solid #83c5be',
            paddingBottom: '0.5rem'
          }}>
            Tracking Technology
          </h2>
          
          <div style={{
            background: 'linear-gradient(135deg, rgba(131, 197, 190, 0.1) 0%, rgba(0, 109, 119, 0.1) 100%)',
            border: '2px solid #83c5be',
            borderRadius: '12px',
            padding: '2rem',
            marginTop: '2rem'
          }}>
            <h3 style={{ 
              color: '#006d77', 
              marginBottom: '1.5rem',
              fontSize: '1.3rem'
            }}>
             Key Considerations for Turtle Trackers
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              <div style={{
                padding: '1rem',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid rgba(131, 197, 190, 0.3)'
              }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '0.5rem'
                }}>💡</div>
                <h4 style={{ color: '#006d77', marginBottom: '0.5rem' }}>Lightweight Design</h4>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Trackers must be lightweight to not impede natural swimming and diving behaviors
                </p>
              </div>

              <div style={{
                padding: '1rem',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid rgba(131, 197, 190, 0.3)'
              }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '0.5rem'
                }}>🐚</div>
                <h4 style={{ color: '#006d77', marginBottom: '0.5rem' }}>Shell Placement</h4>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Must be placed on the central flat part of the shell, only on a single scute
                </p>
              </div>

              <div style={{
                padding: '1rem',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid rgba(131, 197, 190, 0.3)'
              }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '0.5rem'
                }}>🐢</div>
                <h4 style={{ color: '#006d77', marginBottom: '0.5rem' }}>Species Variation</h4>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Different species have unique shell shapes and growth patterns requiring custom considerations
                </p>
              </div>
            </div>

            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '8px',
              borderLeft: '4px solid #006d77'
            }}>
              <p style={{ 
                fontSize: '0.95rem', 
                lineHeight: '1.6',
                color: '#333'
              }}>
                <strong>Important:</strong> Tracker placement must never be between scute lines 
                and must account for how the turtle will grow over time to ensure long-term 
                data collection without harming the animal.
              </p>
            </div>
          </div>
        </section>

        {/* research impact */}
        <section style={{ 
          marginBottom: '4rem',
          textAlign: 'center',
          padding: '3rem 1rem',
          background: 'linear-gradient(135deg, rgba(0, 109, 119, 0.05) 0%, rgba(131, 197, 190, 0.05) 100%)',
          borderRadius: '12px',
          border: '2px solid rgba(131, 197, 190, 0.2)'
        }}>
          <h2 style={{
            fontSize: '2rem',
            marginBottom: '1rem',
            color: '#006d77'
          }}>
            Why This Research Matters
          </h2>
          <p style={{
            maxWidth: '800px',
            margin: '0 auto',
            fontSize: '1.1rem',
            lineHeight: '1.8',
            color: '#333'
          }}>
            By tracking adult sea turtles in the Caribbean, we gain crucial insights into 
            migration patterns, breeding behaviors, and habitat usage. This data is essential 
            for conservation efforts, helping us protect critical nesting beaches, establish 
            marine protected areas, and reduce threats from fishing gear and habitat loss.
          </p>
        </section>

      </div>
    </main>
  );
}
