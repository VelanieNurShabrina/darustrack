import React, { Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EvaluationNotes from './EvaluationNotes';
import ParentEvaluations from '../components/ParentEvaluations';

// Lazy load the new component to avoid breaking if it's not found
const ParentEvaluationTitles = lazy(() => 
  import('../components/ParentEvaluationTitles').catch(() => {
    console.log('ParentEvaluationTitles component not found, using ParentEvaluations instead');
    return { default: ParentEvaluations };
  })
);

const Evaluations = () => {
  const { userRole } = useAuth();

  // For parents, show the parent version of evaluations
  if (userRole === 'orang_tua') {
    return (
      <Suspense fallback={<div className="text-center my-5"><div className="spinner-border"></div></div>}>
        <ParentEvaluationTitles />
      </Suspense>
    );
  }

  // For teachers and other roles, show the teacher version
  return <EvaluationNotes />;
};

export default Evaluations;
