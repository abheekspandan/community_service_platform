import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Adjust path based on your project structure
import NewIssueForm from './NewIssueForm'; // Import the form

const YourRaisedIssues = () => {

  const { user, logout } = useAuth(); // Assuming you're using AuthContext to manage user state
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await axios.get(`http://localhost:3002/issues/${user.id}`);
        setIssues(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching issues:', error);
        setError('Failed to load issues.');
        setLoading(false);
      }
    };

    if (user) {
      fetchIssues();
    }
  }, [user]);

  // Callback to handle new issues being published
  const handleIssuePublished = (newIssue) => {
    setIssues([newIssue, ...issues]); // Add new issue to the list
  };

  if (loading) {
    return <p>Loading your issues...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>Your Raised Issues</h1>
      {/* Add the NewIssueForm */}
      <NewIssueForm onIssuePublished={handleIssuePublished} />
      
      {issues.length > 0 ? (
        <ul>
          {issues.map((issue) => (
            <li key={issue.id}>
              {issue.title} - {issue.status === 'draft' ? 'Draft' : 'Published'}
            </li>
          ))}
        </ul>
      ) : (
        <p>You haven't raised any issues yet.</p>
       
      )}
     <button
        className="logout-button"
        onClick={logout}
        style={{ position: 'absolute', top: '-12px', right: '10px' }}
      >
        Logout
      </button>  
    </div>
    
  );
};

export default YourRaisedIssues;
