import { NavLink } from "react-router-dom";
import { TiHome } from "react-icons/ti";
import "../../styles/ErrorPage.css";

const ErrorPage = () => {
  return (
    <section>
      {/* Error Page */}
      <section className="container">
        <div className="content">
          <img
            src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZjhtdW9rNGtwdWs2ZGJsMXl1dHVmaGQ1M3Bmb3puaXhsbmxtdWd6dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lqFHf5fYMSuKcSOJph/giphy.gif"
            alt="404 error"
            className="error-gif"
          />

          <div
            className="
          error-content"
          >
            <div className="error-content-header">
              <div className="four-o-four">404</div>
              <div className="error-message">Oops! Page Not Found</div>
            </div>
            <div className="error-para">
              The page you’re looking for doesn’t exist or has been moved. Let’s
              get you back home!
            </div>
          </div>
          <NavLink to="/" className="btn-back">
            <TiHome />
            <span>Go Back to Home</span>
          </NavLink>
        </div>
      </section>
    </section>
  );
};

export default ErrorPage;
