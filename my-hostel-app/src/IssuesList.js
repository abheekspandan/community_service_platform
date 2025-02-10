// src/IssuesList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const IssuesList = () => {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await axios.get('http://localhost:3002/issues');
        setIssues(response.data);
      } catch (error) {
        console.error('Error fetching issues:', error);
      }
    };

    fetchIssues();
  }, []);

  return (
    <div className="issues-list">
      <h2>Current Issues</h2>
      {issues.length === 0 ? (
        <p>No issues reported.</p>
      ) : (
        <div className="row">
          {issues.map(issue => (
            <div className="col-md-4" key={issue.id}>
              <div className="card mb-4">
                <div className="card-body">
                  <h5 className="card-title">{issue.title}</h5>
                  <p className="card-text">{issue.description}</p>
                  <p className="card-text">
                    <small className="text-muted">
                      Raised by {issue.first_name} {issue.last_name}
                    </small>
                  </p>
                  <p className="card-text">
                    <strong>Votes:</strong> {issue.votes}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default IssuesList;
