import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import birdVideo from '../assets/bird.webm';
import './Mascot.css';

export default function Mascot() {
  const location = useLocation();
  const mascotRef = useRef(null);
  const containerRef = useRef(null);
  const [particles, setParticles] = useState([]);
  let particleId = 0;

  const createParticle = (x, y) => {
    const id = particleId++;
    setParticles(prev => [...prev, { id, x, y }]);

    // Remove particle after 1.5 seconds to allow fade out
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, 1500);
  };

  useEffect(() => {
    if (!mascotRef.current) return;

    // Reset rotation and clear ongoing animations on route change
    gsap.killTweensOf(mascotRef.current);
    gsap.to(mascotRef.current, { rotation: 0, duration: 0.5, scaleX: 1 });

    const path = location.pathname;

    // Helper to fly to a specific element immediately when it renders
    const flyToElement = (selector, offsetX = 0, offsetY = 0, scale = 1, forceFlip = null) => {
      let retries = 0;
      const maxRetries = 20; // Try for up to 3 seconds (20 * 150ms)

      const tryAnimate = () => {
        const el = document.querySelector(selector);
        if (el && mascotRef.current) {
          const rect = el.getBoundingClientRect();
          const isLeftHalf = rect.left < window.innerWidth / 2;
          const shouldFlip = forceFlip !== null ? forceFlip : isLeftHalf;

          gsap.to(mascotRef.current, {
            x: rect.left + offsetX,
            y: rect.top + offsetY,
            scale: scale,
            scaleX: shouldFlip ? -scale : scale,
            duration: 1.2, // Snappier, faster flight
            ease: "power2.out", // More responsive easing
            onUpdate: function () {
              // Spawn footprints during flight
              if (Math.random() > 0.6 && mascotRef.current) {
                const r = mascotRef.current.getBoundingClientRect();
                createParticle(
                  r.left + r.width / 2 + (Math.random() - 0.5) * 15,
                  r.top + r.height / 2 + 10 + (Math.random() - 0.5) * 15
                );
              }
            }
          });
        } else if (retries < maxRetries) {
          retries++;
          setTimeout(tryAnimate, 150);
        }
      };

      tryAnimate();
    };

    const isMobile = window.innerWidth <= 1024;

    if (path === '/' || path === '/home') {
      // Home: Land near the writeblog button
      flyToElement('.desktop-navbar', isMobile ? 100 : -10, isMobile ? 0 : -5, isMobile ? 0.7 : 1);
    }
    else if (path.startsWith('/profile')) {
      // Profile: Land near avatar
      flyToElement('.profile-avatar-container', isMobile ? -20 : -60, isMobile ? -40 : -20, isMobile ? 0.7 : 0.9, true);
    }
    else if (path === '/search') {
      // Search: Fly near the search input/icon
      flyToElement(isMobile ? '.search-input-wrapper' : '.search-input', isMobile ? +200 : -80, isMobile ? 0 : -30, isMobile ? 0.8 : 0.7);
    }
    else if (path === '/messages' || path.startsWith('/chat/')) {
      // Messages: Fly around the sticker or chat area
      flyToElement(isMobile ? '.headoo' : '.empty-chat-sticker', isMobile ? 170 : -100, isMobile ? -15 : 100, isMobile ? 0.7 : 0.9);

      // If no sticker (e.g. inside a chat), just hover top right
      setTimeout(() => {
        if (!document.querySelector('.empty-chat-sticker') && mascotRef.current) {
          gsap.to(mascotRef.current, {
            x: window.innerWidth - (isMobile ? 100 : 200),
            y: isMobile ? 70 : 100,
            scale: isMobile ? 0.6 : 0.8,
            duration: 2,
            ease: "power2.inOut",
            onUpdate: function () {
              if (Math.random() > 0.6 && mascotRef.current) {
                const r = mascotRef.current.getBoundingClientRect();
                createParticle(
                  r.left + r.width / 2 + (Math.random() - 0.5) * 15,
                  r.top + r.height / 2 + 10 + (Math.random() - 0.5) * 15
                );
              }
            }
          });
        }
      }, 600);
    }
    else if (path === '/notti') {
      // Notifications: Swoop in from off-screen left to top-right
      gsap.fromTo(mascotRef.current,
        {
          x: -200,
          y: window.innerHeight / 2,
          scale: 1.2,
          rotation: 15
        },
        {
          x: window.innerWidth - (isMobile ? 100 : 180),
          y: isMobile ? 60 : 80,
          rotation: -10,
          duration: 2.5,
          ease: "power1.inOut",
          onUpdate: function () {
            // Spawn footprints occasionally
            if (Math.random() > 0.6 && mascotRef.current) {
              const r = mascotRef.current.getBoundingClientRect();
              createParticle(
                r.left + r.width / 2 + (Math.random() - 0.5) * 8,
                r.top + r.height / 2 + 10 + (Math.random() - 0.5) * 8
              );
            }
          },
          onComplete: () => {
            gsap.to(mascotRef.current, { rotation: 0, duration: 1 });
          }
        }
      );
    }
    else {
      // Default: Top right corner
      gsap.to(mascotRef.current, {
        x: window.innerWidth - (isMobile ? 100 : 200),
        y: isMobile ? 60 : 80,
        scale: isMobile ? 0.6 : 0.8,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: function () {
          if (Math.random() > 0.6 && mascotRef.current) {
            const r = mascotRef.current.getBoundingClientRect();
            createParticle(
              r.left + r.width / 2 + (Math.random() - 0.5) * 15,
              r.top + r.height / 2 + 10 + (Math.random() - 0.5) * 15
            );
          }
        }
      });
    }

  }, [location.pathname]);

  return (
    <div className="mascot-container" ref={containerRef}>
      <div className="mascot-wrapper" ref={mascotRef}>
        <video
          src={birdVideo}
          className="mascot-video"
          autoPlay
          loop
          muted
          playsInline
          style={{ mixBlendMode: 'multiply' }} /* Assuming white background on webm */
        />
      </div>
      {particles.map(p => (
        <Particle key={p.id} x={p.x} y={p.y} />
      ))}
    </div>
  );
}

function Particle({ x, y }) {
  const particleRef = useRef(null);

  useEffect(() => {
    if (particleRef.current) {
      // Footprints pop in then fade out in place
      gsap.fromTo(particleRef.current,
        { x, y, opacity: 0, scale: 0, rotation: (Math.random() - 0.5) * 40 },
        { 
          opacity: 1, 
          scale: 1, 
          duration: 0.2, 
          ease: "back.out(1.5)",
          onComplete: () => {
            gsap.to(particleRef.current, {
              opacity: 0,
              scale: 0.5,
              duration: 0.8,
              delay: 0.4,
              ease: "power2.out"
            });
          }
        }
      );
    }
  }, [x, y]);

  return (
    <div ref={particleRef} className="mascot-footprint" style={{
      position: 'absolute',
      pointerEvents: 'none',
      zIndex: 9998,
      marginLeft: '-8px', // Center the SVG
      marginTop: '-8px'
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="12" r="2" fill="#ff6b00" />
  <circle cx="6" cy="8" r="1.5" fill="#ff8c42" />
  <circle cx="18" cy="9" r="1.5" fill="#ff8c42" />
  <circle cx="8" cy="18" r="1" fill="#ffb366" />
  <circle cx="17" cy="17" r="1" fill="#ffd4a3" />
</svg>
    </div>
  );
}
