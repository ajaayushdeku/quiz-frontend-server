import React, { useEffect, useState } from "react";
import logo from "../../assets/images/logo.png";
import { FaPlay } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import "../../styles/Home.css";

const Home = () => {
  const [splashScreen, setSplashScreen] = useState(true);
  const [timer, setTimer] = useState(1);

  useEffect(() => {
    if (splashScreen && timer) {
      const id = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 2000);
      return () => clearInterval(id);
    } else if (timer === 0) {
      setSplashScreen(false);
    }
  }, [splashScreen, timer]);

  return (
    <section className="home-wrapper">
      {splashScreen ? (
        /* Splash Screen */
        <section className="main-container">
          <div className="splash-content">
            <p className="splash-text">Quiz Competition</p>
            <img src={logo} alt="quiz" className="splash-logo" />
          </div>
        </section>
      ) : (
        /* Main Home Page */
        <section className="main-container">
          <div className="home-content">
            <img src={logo} alt="quiz" className="home-logo" />
            <h1 className="home-title">SEE Quiz Competition</h1>

            <NavLink to="/roundselect" className="nav-link">
              <button className="start-btn">
                START <FaPlay />
              </button>
            </NavLink>
          </div>
        </section>
      )}
    </section>
  );
};

export default Home;
