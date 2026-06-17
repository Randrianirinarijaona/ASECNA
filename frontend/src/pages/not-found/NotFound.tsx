import { Link } from 'react-router-dom';
import { PlaneTakeoff } from 'lucide-react';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-content">
        <PlaneTakeoff size={80} className="not-found-icon" />
        <h1>404</h1>
        <h2>Page non trouvée</h2>
        <p>La page que vous recherchez n'existe pas ou a été déplacée.</p>
        <Link to="/" className="btn btn-primary">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}