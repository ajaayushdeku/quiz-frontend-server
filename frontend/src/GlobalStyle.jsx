import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`


  .main-container {
    position: relative;
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: white;
    background: linear-gradient(
    135deg,
    #0d0d0d,
    #0d0d0d,
    #343434,
    #444444,
    #808080
  );
    overflow-x: hidden;
    overflow-y: auto; /* allow scrolling on small screens */
    padding-bottom: 2rem; /* extra space for bottom options */
  }

  .main-container::-webkit-scrollbar {
    display: none;               /* Chrome, Safari, Edge */
  }

  /* Floating shapes for uniqueness */
  .main-container::before,
  .main-container::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.6;
    z-index: 0;
  }

  .main-container::before {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle at center,  rgba(255, 255, 255, 0.6), transparent);
    top: 20%;
    left: -10%;
    animation: float1 10s infinite alternate ease-in-out;
  }

  .main-container::after {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle at center, rgba(200, 200, 200, 0.4), transparent);
    bottom: 10%;
    right: -15%;
    animation: float2 12s infinite alternate ease-in-out;
  }
    

  .content {
    position: relative;
    margin: auto;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    // background-color: green;
    font-size: 2rem;
  }


`;

// import { createGlobalStyle } from "styled-components";

// export const GlobalStyle = createGlobalStyle`

//   .main-container {
//     position: relative;
//     width: 100%;
//     height: 100vh;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     color: rgb(247, 234, 225); /* soft off-white text */
//     background: linear-gradient(
//       135deg,
//       rgb(2, 102, 85),
//       rgb(0, 163, 136),
//       rgb(222, 139, 51),
//       rgb(2, 102, 85)
//     );
//     overflow-x: hidden;
//     overflow-y: auto;
//     padding-bottom: 2rem;
//   }

//   /* Floating shapes for uniqueness */
//   .main-container::before,
//   .main-container::after {
//     content: "";
//     position: absolute;
//     border-radius: 50%;
//     filter: blur(120px);
//     opacity: 0.55;
//     z-index: 0;
//   }

//   .main-container::before {
//     width: 380px;
//     height: 380px;
//     background: radial-gradient(circle at center, rgb(222, 139, 51), transparent);
//     top: 15%;
//     left: -8%;
//     animation: float1 10s infinite alternate ease-in-out;
//   }

//   .main-container::after {
//     width: 480px;
//     height: 480px;
//     background: radial-gradient(circle at center, rgb(0, 163, 136), transparent);
//     bottom: 12%;
//     right: -12%;
//     animation: float2 12s infinite alternate ease-in-out;
//   }

//   .content {
//     position: relative;
//     margin: auto;
//     z-index: 1;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
//     font-size: 2rem;
//   }

//   @keyframes float1 {
//     from { transform: translateY(0px); }
//     to { transform: translateY(40px); }
//   }

//   @keyframes float2 {
//     from { transform: translateY(0px); }
//     to { transform: translateY(-40px); }
//   }
// `;
