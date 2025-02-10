// src/RaisedIssues.js
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import './RaisedIssues.css'; // Ensure to import your CSS

const RaisedIssues = () => {
  const { user, logout } = useAuth();
  const [issues, setIssues] = useState([]);

  // Fetch issues raised by the current logged-in user
  useEffect(() => {
    axios.get(`http://localhost:3002/issues/${user.id}`)
      .then((response) => {
        setIssues(response.data);
      })
      .catch((error) => {
        console.error('Error fetching issues:', error);
      });
  }, [user.id]);

  const handleDelete = (issueId) => {
    // Confirmation dialog
    const confirmDelete = window.confirm("Are you sure you want to delete this issue?");
    
    if (confirmDelete) {
        const userId = user.id/* get userId from your state/context here */;

        axios.delete(`http://localhost:3002/issues/${issueId}`, { data: { userId } })
            .then(() => {
                setIssues(issues.filter(issue => issue.id !== issueId));
                alert('Issue deleted successfully!');
            })
            .catch((error) => {
                console.error('Error deleting issue:', error);
                alert('Error deleting issue: ' + error.response?.data?.message || error.message);
            });
    } else {
        // If the user cancels the deletion, you might want to log or alert this
        console.log('Delete action canceled');
    }
};

  
  return (
    <>
      <button
        className="logout-button"
        onClick={logout}
        style={{ position: 'absolute', top: '-12px', right: '10px' }}
      >
        Logout
      </button>
    <div className="raised-issues">
      <h1>Your Raised Issues</h1>
      {issues.length === 0 ? (
        <p>You haven't raised any issues yet.</p>
      ) : (
        <ul>
          {issues.map((issue) => (
            <li key={issue.id}>
              <h3>{issue.title}</h3>
              <p>{issue.description}</p>
              <p>Votes: {issue.votes} </p>
                <button onClick={() => handleDelete(issue.id)} className="delete-button">
                <i className="fas fa-trash-alt"></i>
              </button>
              
            </li>
          ))}
        </ul>
      )}
      
    </div>
  </>  
  );
};

export default RaisedIssues;
