import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import Seo from '../../Utils/Seo';
import { SearchX, ServerCrash, Home } from 'lucide-react';

const NotFound = () => {
  const error = useRouteError();
  const is404 = !error || (isRouteErrorResponse(error) && error.status === 404);

  const Icon = is404 ? SearchX : ServerCrash;
  const title = is404 ? "Page Not Found" : "Something Went Wrong";
  const message = is404
    ? "The page you're looking for doesn't exist or may have been moved."
    : "We hit an unexpected error while loading this page. Please try again.";

  return (
    <>
      <Seo title={is404 ? '404 — Page Not Found' : 'Error'} description={message} noindex />

      <main className="bg-white min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center py-20">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-teal-50 flex items-center justify-center mb-6">
            <Icon className="w-10 h-10 text-teal-500" />
          </div>

          {is404 && (
            <p className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500 mb-2">
              404
            </p>
          )}

          <h1 className="text-2xl font-extrabold text-slate-900 mb-3">{title}</h1>
          <p className="text-slate-500 leading-relaxed mb-8">{message}</p>

          <Link
            to="/"
            className="btn-gradient px-8 py-3"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </main>
    </>
  );
};

export default NotFound;
