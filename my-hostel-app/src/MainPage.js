import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import './MainPage.css';

const MainPage = () => {
  const { user, logout } = useAuth();
  const [issues, setIssues] = useState([]);
  const [votedIssues, setVotedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueDescription, setNewIssueDescription] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await axios.get('http://localhost:3002/issues');
        setIssues(response.data);
      } catch (error) {
        console.error('Error fetching issues:', error);
        setError('Failed to load issues. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchVotedIssues = async () => {
      if (user && user.id) {
        try {
          const response = await axios.get(`http://localhost:3002/votes/${user.id}`);
          setVotedIssues(response.data.map(issue => issue.id));
        } catch (error) {
          console.error('Error fetching voted issues:', error);
        }
      }
    };

    fetchIssues();
    fetchVotedIssues();
  }, [user]);

  const handleVote = async (issueId) => {
    if (!user) {
      alert('Please log in to vote.');
      return;
    }
  
    try {
      const response = await axios.post(`http://localhost:3002/vote/${issueId}`, { userId: user.id });
  
      const { message, voteStatus } = response.data;
      alert(message);
  
      if (voteStatus === 'casted') {
        setVotedIssues(prev => [...prev, issueId]);
        setIssues(prevIssues =>
          prevIssues.map(issue =>
            issue.id === issueId ? { ...issue, votes: issue.votes + 1 } : issue
          )
        );
      } else if (voteStatus === 'removed') {
        setVotedIssues(prev => prev.filter(id => id !== issueId));
        setIssues(prevIssues =>
          prevIssues.map(issue =>
            issue.id === issueId ? { ...issue, votes: issue.votes - 1 } : issue
          )
        );
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert(error.response?.data?.message || 'An error occurred while voting. Please try again.');
    }
  };
  

  const handleCheckboxChange = async (issueId, currentChecked) => {
    if (user.role !== 'admin') {
      alert('Only admin users can modify the checkbox.');
      return;
    }

    const newChecked = !currentChecked;

    if (newChecked) {
      const confirmDelete = window.confirm(
        'Selecting this checkbox will delete the issue after 30 seconds. Do you want to proceed?'
      );
      if (!confirmDelete) return;
    } else {
      alert('Issue deletion canceled.');
    }

    try {
      await axios.patch(`http://localhost:3002/issues/${issueId}/checkbox`, {
        userId: user.id,
        isChecked: newChecked,
      });

      // Update local state
      setIssues(prevIssues =>
        prevIssues.map(issue =>
          issue.id === issueId ? { ...issue, is_checked: newChecked } : issue
        )
      );

      alert(`Checkbox status updated successfully! ${newChecked ? 'Issue will be deleted in 30 seconds.' : 'Deletion canceled.'}`);
    } catch (error) {
      console.error('Error updating checkbox status:', error);
      alert('Error updating checkbox status: ' + error.response?.data?.message || error.message);
    }
  };



  // Handle new issue submission
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!user) {
      setSubmitError('Please log in to submit an issue.');
      return;
    }

    if (!newIssueTitle || !newIssueDescription) {
      setSubmitError('Please provide both title and description.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3002/issues', {
        title: newIssueTitle,
        description: newIssueDescription,
        userId: user.id,
      });

      if (response.data.success) {
        setSubmitSuccess('Issue published successfully!');
        setIssues([...issues, response.data.issue]); // Add the new issue to the list
        setNewIssueTitle(''); // Clear the form fields
        setNewIssueDescription('');
      } else {
        setSubmitError('Failed to publish the issue. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      setSubmitError('Failed to publish the issue. Please try again.');
    }
  };

  return (
    <div className="main-page">
      <h1>Community Issues Page</h1>

      <div className="issues-section">
        <h2>Current Issues</h2>

        {loading ? (
          <p>Loading issues...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : issues.length === 0 ? (
          <p>No issues reported yet.</p>
        ) : (
          <ul>
            {issues.map((issue) => (
              <li key={issue.id} className={`issue-card ${votedIssues.includes(issue.id) ? 'voted' : ''}`}>
                <h3>{issue.title}</h3>
                <p>{issue.description}</p>
                <p>Votes: {issue.votes}</p>
                <button
                  className="vote-button"
                 onClick={() => handleVote(issue.id)}
                            >
                  {votedIssues.includes(issue.id) ? 'Cancel Vote' : 'Vote'}
                      </button>

                <label>
                <input
                  type="checkbox"
                  checked={issue.is_checked}
                  onChange={() => handleCheckboxChange(issue.id, issue.is_checked)}
                  disabled={user.role !== 'admin'} // Disable checkbox for non-admin users
                />
                {issue.is_checked ? 'Checked' : 'Unchecked'}
                </label>
                <p>
                  <small className="text-muted">
                    Raised by {issue.first_name} {issue.last_name}
                  </small>
                </p>
                <p><small className="text-muted">
                    Posted: {issue.created_at}
                  </small></p>
              </li>
            ))}
          </ul>
        )}
      </div>

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

export default MainPage;
