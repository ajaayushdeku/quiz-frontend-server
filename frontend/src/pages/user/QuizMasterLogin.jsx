import React from "react";
import styled from "styled-components";

const QuizMasterLogin = () => {
  return (
    <Wrapper>
      <div className="admin-login-container">
        <div className="admin-login-card">
          <h2 className="admin-login-title">Quiz Master Login</h2>
          <form className="admin-login-form">
            <div className="form-group">
              <label>Email:</label>
              <input type="email" placeholder="Enter your email" required />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" className="admin-login-btn">
              Login
            </button>
          </form>
        </div>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.section`
  .admin-login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: linear-gradient(135deg, #0d0d0d, #343434);
  }

  .admin-login-card {
    background: #ffffff;
    padding: 40px 30px;
    border-radius: 12px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .admin-login-title {
    text-align: center;
    font-size: 1.8rem;
    font-weight: bold;
    color: #111;
  }

  .admin-login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    font-weight: 500;
    margin-bottom: 6px;
    color: #1f2937;
  }

  .form-group input {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    font-size: 14px;
    outline: none;
    transition: border 0.2s;
  }

  .form-group input:focus {
    border-color: #3b82f6;
  }

  .admin-login-btn {
    padding: 12px 16px;
    border-radius: 8px;
    border: none;
    background: #3b82f6;
    color: #fff;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .admin-login-btn:hover {
    background: #2563eb;
  }
`;

export default QuizMasterLogin;
